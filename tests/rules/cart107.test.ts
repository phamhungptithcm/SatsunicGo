import { beforeAll, afterAll, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, getDocs, setDoc, collection } from "firebase/firestore";
import type { CallableRequest } from "firebase-functions/v2/https";
import type { CartCommand } from "../../packages/domain/cart";
const project = "demo-satsunicgo-cart107";
let env: RulesTestEnvironment;
let command: typeof import("../../functions/src/cart").cartCommand;
let admin: ReturnType<typeof initializeApp>;
const owner = `cart107-${randomUUID()}`,
  other = `cart107-${randomUUID()}`,
  productId = `cart107-${randomUUID()}`,
  lineId = randomUUID();
const claims = {
  email_verified: true,
  firebase: { sign_in_provider: "google.com" as const },
};
const request = (uid: string, data: unknown, token: object = claims) =>
  ({ auth: { uid, token: { uid, ...token } }, data }) as CallableRequest;
const merge = (
  revision: number,
  quantity = 2,
): Extract<CartCommand, { action: "merge" }> => ({
  action: "merge",
  expectedRevision: revision,
  operationId: randomUUID(),
  items: [{ productId, quantity, variant: "Blue", lineId }],
});
beforeAll(async () => {
  if (
    process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:18207" ||
    process.env.GCLOUD_PROJECT !== project ||
    process.env.FUNCTIONS_EMULATOR !== "true"
  )
    throw Error(
      "Cart integration requires the existing shared loopback emulator and an isolated demo project.",
    );
  admin = initializeApp({ projectId: project });
  ({ cartCommand: command } = await import("../../functions/src/cart"));
  env = await initializeTestEnvironment({
    projectId: project,
    firestore: {
      host: "127.0.0.1",
      port: 18207,
      rules: readFileSync("firestore.rules", "utf8"),
    },
  });
  await getFirestore()
    .doc(`products/${productId}`)
    .set({
      title: "Synthetic cart107",
      slug: productId,
      status: "published",
      market: "JP",
      version: 1,
      orderable: true,
      listedPrice: 650000,
      termsVersion: "fixture-v1",
      catalogOptions: ["Blue"],
    });
});
afterAll(async () => {
  await env?.cleanup();
  if (admin) {
    await getFirestore().terminate();
    await deleteApp(admin);
  }
});
it("concurrent retries merge once; conflict/tampered operation fail without overwriting", async () => {
  const input = merge(0);
  const result = await Promise.all([
    command.run(request(owner, input)),
    command.run(request(owner, input)),
  ]);
  expect(result[0]).toEqual(result[1]);
  expect(result[0].items[0].quantity).toBe(2);
  await expect(
    command.run(
      request(owner, { ...input, items: [{ ...input.items[0], quantity: 3 }] }),
    ),
  ).rejects.toMatchObject({ code: "already-exists" });
  await expect(command.run(request(owner, merge(0)))).rejects.toMatchObject({
    code: "aborted",
  });
  const updated = await command.run(request(owner, merge(1, 3)));
  expect(updated.items[0].quantity).toBe(5);
  const replay = await command.run(request(owner, input));
  expect(replay.revision).toBe(2);
  expect(replay.items[0].quantity).toBe(5);
});
it("server rejects unauthenticated, non-Google, locked, foreign writes and invalid products", async () => {
  await expect(
    command.run({ data: merge(0) } as CallableRequest),
  ).rejects.toMatchObject({ code: "unauthenticated" });
  await expect(
    command.run(
      request(other, merge(0), {
        ...claims,
        firebase: { sign_in_provider: "password" },
      }),
    ),
  ).rejects.toMatchObject({ code: "permission-denied" });
  await expect(
    command.run(request(other, { ...merge(0), ownerId: owner })),
  ).rejects.toMatchObject({ code: "invalid-argument" });
  await expect(
    command.run(
      request(other, {
        ...merge(0),
        items: [
          { productId, variant: "Red", quantity: 1, lineId: randomUUID() },
        ],
      }),
    ),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  await getFirestore().doc(`staffAccess/${other}`).set({ locked: true });
  await expect(command.run(request(other, merge(0)))).rejects.toMatchObject({
    code: "permission-denied",
  });
});
it("owner get only; anonymous/other/list/write/nested reads denied, including staff lock", async () => {
  const own = env.authenticatedContext(owner, claims).firestore(),
    foreign = env.authenticatedContext(other, claims).firestore();
  await assertSucceeds(getDoc(doc(own, "carts", owner)));
  await assertFails(getDoc(doc(foreign, "carts", owner)));
  await assertFails(
    getDoc(doc(env.unauthenticatedContext().firestore(), "carts", owner)),
  );
  await assertFails(getDocs(collection(own, "carts")));
  await assertFails(
    setDoc(doc(own, "carts", owner), { ownerId: owner, items: [] }),
  );
  await assertFails(
    getDoc(doc(own, `carts/${owner}/checkouts/${randomUUID()}`)),
  );
  await getFirestore().doc(`staffAccess/${owner}`).set({ locked: true });
  await assertFails(getDoc(doc(own, "carts", owner)));
  await getFirestore().doc(`staffAccess/${owner}`).delete();
});
it("checkout reconciliation verifies ownership, keeps concurrent additions and consumes each order once", async () => {
  const orderId = randomUUID();
  await getFirestore()
    .doc(`orders/${orderId}`)
    .set({
      ownerId: owner,
      purchaseKind: "catalog",
      catalogSnapshot: {
        productId,
        variant: "Blue",
        quantity: 2,
        productVersion: 1,
        title: "Synthetic cart107",
        slug: productId,
        unitPrice: 650000,
        total: 1300000,
        termsVersion: "fixture-v1",
      },
    });
  const input: CartCommand = {
    action: "consume",
    orderId,
    lineId,
    operationId: randomUUID(),
  };
  await expect(command.run(request(other, input))).rejects.toMatchObject({
    code: "permission-denied",
  });
  const result = await command.run(request(owner, input));
  expect(result.items[0].quantity).toBe(3);
  expect(
    (await command.run(request(owner, { ...input, operationId: randomUUID() })))
      .items[0].quantity,
  ).toBe(3);
});

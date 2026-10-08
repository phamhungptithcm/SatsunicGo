import { beforeAll, afterAll, test, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { getFirestore } from "firebase-admin/firestore";
import type { CallableRequest } from "firebase-functions/v2/https";
let command: typeof import("../../functions/src/workspace").workspaceCommand;
let db: ReturnType<typeof getFirestore>;
const owners = new Set<string>();
const paths = new Set<string>();
function owner() {
  const uid = `profile-qa-${randomUUID()}`;
  owners.add(uid);
  return uid;
}
function request(uid: string, data: unknown) {
  return {
    auth: {
      uid,
      token: {
        email_verified: true,
        firebase: { sign_in_provider: "google.com" },
      },
    },
    data,
  } as CallableRequest;
}
function address() {
  return {
    action: "saveAddress",
    operationId: randomUUID(),
    payload: {
      recipient: "Synthetic QA recipient",
      phone: "0900000000",
      address: "Synthetic test address only",
    },
  };
}
async function run(
  uid: string,
  data: ReturnType<typeof address> | Record<string, unknown>,
) {
  paths.add(`idempotencyKeys/${uid}-${data.operationId}`);
  return command.run(request(uid, data));
}
beforeAll(async () => {
  ({ workspaceCommand: command } = await import("../../functions/src/index"));
  db = getFirestore();
});
afterAll(async () => {
  for (const uid of owners) {
    for (const [collection, field] of [
      ["addresses", "ownerId"],
      ["auditEvents", "actor"],
    ]) {
      const rows = await db
        .collection(collection)
        .where(field, "==", uid)
        .get();
      for (const row of rows.docs) await row.ref.delete();
    }
    await db.doc(`users/${uid}`).delete();
    await db.doc(`staffAccess/${uid}`).delete();
  }
  for (const path of paths) await db.doc(path).delete();
  await db.terminate();
});
test("lost address response: exact concurrent/repeated command creates one owned address and audit", async () => {
  const uid = owner(),
    data = address();
  const [a, b] = await Promise.all([run(uid, data), run(uid, data)]);
  expect(a).toEqual(b);
  expect(await run(uid, data)).toEqual(a);
  const rows = await db
    .collection("addresses")
    .where("ownerId", "==", uid)
    .get();
  expect(rows.size).toBe(1);
  expect(rows.docs[0].id).toBe((a as { id: string }).id);
  expect(
    (await db.collection("auditEvents").where("actor", "==", uid).get()).size,
  ).toBe(1);
});
test("tampered replay cannot change address", async () => {
  const uid = owner(),
    data = address();
  await run(uid, data);
  await expect(
    run(uid, {
      ...data,
      payload: { ...data.payload, address: "Different synthetic address" },
    }),
  ).rejects.toMatchObject({ code: "already-exists" });
  expect(
    (
      await db.collection("addresses").where("ownerId", "==", uid).get()
    ).docs[0].data().address,
  ).toBe(data.payload.address);
});
test("profile recovery keeps original expected version after committed response is lost", async () => {
  const uid = owner();
  await db.doc(`users/${uid}`).set({ ownerId: uid, version: 0 });
  const data = {
    action: "saveProfile",
    operationId: randomUUID(),
    expectedVersion: 0,
    payload: {
      displayName: "Synthetic QA",
      businessName: "",
      marketingConsent: false,
    },
  };
  const first = await run(uid, data);
  expect(await run(uid, data)).toEqual(first);
  expect((await db.doc(`users/${uid}`).get()).data()?.version).toBe(1);
  await expect(
    run(uid, { ...data, operationId: randomUUID() }),
  ).rejects.toMatchObject({ code: "aborted" });
});
test("locked identity cannot replay prior success", async () => {
  const uid = owner(),
    data = address();
  await run(uid, data);
  await db.doc(`users/${uid}`).set({ locked: true });
  await expect(run(uid, data)).rejects.toMatchObject({
    code: "permission-denied",
  });
});
test("invalid address and forged owner payload cannot persist", async () => {
  const uid = owner(),
    data = address();
  await expect(
    run(uid, {
      ...data,
      payload: { ...data.payload, ownerId: "another-account" },
    }),
  ).rejects.toMatchObject({ code: "invalid-argument" });
  await expect(
    run(uid, {
      ...data,
      operationId: randomUUID(),
      payload: { ...data.payload, address: "x" },
    }),
  ).rejects.toMatchObject({ code: "invalid-argument" });
  expect(
    (await db.collection("addresses").where("ownerId", "==", uid).get()).empty,
  ).toBe(true);
});

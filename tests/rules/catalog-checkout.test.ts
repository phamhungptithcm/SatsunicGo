import { beforeAll, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { getFirestore } from "firebase-admin/firestore";
import type { CallableRequest } from "firebase-functions/v2/https";
let checkout: typeof import("../../functions/src/catalog-checkout").catalogCheckout;
let command: typeof import("../../functions/src/index").command;
const owner = `catalog018-${randomUUID()}`,
  staff = `catalog018-${randomUUID()}`;
const request = (uid: string, data: unknown, verified = true) =>
  ({
    auth: {
      uid,
      token: {
        uid,
        email_verified: verified,
        firebase: { sign_in_provider: "google.com" },
      },
    },
    data,
  }) as CallableRequest;
const product = {
  title: "Synthetic catalog test",
  body: "Synthetic catalog fixture; no live product or transaction.",
  slug: `catalog018-${randomUUID()}`,
  status: "published",
  market: "US",
  version: 1,
  orderable: true,
  listedPrice: 150000,
  termsVersion: "synthetic-v1",
  catalogOptions: ["Blue"],
};
async function seed() {
  const productId = `catalog018-${randomUUID()}`;
  await getFirestore().doc(`products/${productId}`).set(product);
  return {
    productId,
    productVersion: 1,
    quantity: 2,
    variant: "Blue",
    operationId: randomUUID(),
  };
}
beforeAll(async () => {
  process.env.FUNCTIONS_EMULATOR = "true";
  process.env.GCLOUD_PROJECT = `demo-satsunicgo-catalog-${randomUUID().slice(0, 8)}`;
  process.env.FIREBASE_CONFIG = JSON.stringify({
    projectId: process.env.GCLOUD_PROJECT,
  });
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8181";
  ({ command } = await import("../../functions/src/index"));
  ({ catalogCheckout: checkout } =
    await import("../../functions/src/catalog-checkout"));
  await getFirestore()
    .doc(`staffAccess/${staff}`)
    .set({ active: true, roles: ["OWNER", "FINANCE"] });
});
it("creates one authoritative order on concurrent retries without collecting money or issuing quote", async () => {
  const input = await seed();
  const results = await Promise.all([
    checkout.run(request(owner, input)),
    checkout.run(request(owner, input)),
  ]);
  expect(results[0]).toEqual(results[1]);
  const o = (await getFirestore().doc(`orders/${results[0].id}`).get()).data();
  expect(o).toMatchObject({
    ownerId: owner,
    purchaseKind: "catalog",
    finalTotal: 300000,
    collected: 0,
    refunded: 0,
    stage: "QUOTE_ACCEPTED",
  });
  expect(o?.quote).toBeUndefined();
  expect(o?.deposit).toBeUndefined();
  await expect(
    checkout.run(request(owner, { ...input, quantity: 1 })),
  ).rejects.toMatchObject({ code: "already-exists" });
  const cmd = (action: string, version: number, payload: unknown = {}) =>
    command.run(
      request(staff, {
        action,
        orderId: results[0].id,
        expectedVersion: version,
        payload,
        operationId: randomUUID(),
      }),
    );
  await expect(cmd("claimPurchase", 1)).rejects.toMatchObject({
    code: "failed-precondition",
  });
  await cmd("verifyTransfer", 1, {
    amount: 150000,
    bankTransactionId: randomUUID(),
    evidence: "synthetic-transfer",
    reason: "Synthetic first half",
  });
  await expect(cmd("claimPurchase", 2)).rejects.toMatchObject({
    code: "failed-precondition",
  });
  await cmd("verifyTransfer", 2, {
    amount: 150000,
    bankTransactionId: randomUUID(),
    evidence: "synthetic-transfer",
    reason: "Synthetic remaining half",
  });
  await cmd("claimPurchase", 3);
  expect(
    (await getFirestore().doc(`orders/${results[0].id}`).get()).data()?.stage,
  ).toBe("PURCHASING");
});
it("rejects unverified/locked access and tampering, stale or unavailable products", async () => {
  const input = await seed();
  await expect(
    checkout.run(request(owner, input, false)),
  ).rejects.toMatchObject({ code: "permission-denied" });
  await expect(
    checkout.run(request(owner, { ...input, total: 1 })),
  ).rejects.toMatchObject({ code: "invalid-argument" });
  await expect(
    checkout.run(request(owner, { ...input, productVersion: 2 })),
  ).rejects.toMatchObject({ code: "aborted" });
  await expect(
    checkout.run(request(owner, { ...input, variant: "Red" })),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  const locked = `catalog018-${randomUUID()}`;
  await getFirestore().doc(`users/${locked}`).set({ locked: true });
  await expect(checkout.run(request(locked, input))).rejects.toMatchObject({
    code: "permission-denied",
  });
  await getFirestore()
    .doc(`products/${input.productId}`)
    .update({ orderable: false });
  await expect(checkout.run(request(owner, input))).rejects.toMatchObject({
    code: "failed-precondition",
  });
});

it("allocates authoritative full-purpose callbacks once and quarantines mismatched funds", async () => {
  const { applyVerifiedPayment } =
    await import("../../functions/src/payments/payos");
  const input = await seed();
  const result = await checkout.run(request(owner, input));
  const code = Date.now(),
    link = randomUUID();
  const intent = getFirestore().doc(
    `paymentRequests/catalog018-${randomUUID()}`,
  );
  await intent.set({
    orderId: result.id,
    ownerId: owner,
    purpose: "full",
    acceptedQuoteVersion: null,
    amount: 300000,
    orderCode: code,
    paymentLinkId: link,
    state: "pending",
  });
  const data = {
    orderCode: code,
    amount: 300000,
    currency: "VND",
    reference: randomUUID(),
    paymentLinkId: link,
    accountNumber: "synthetic-018",
    code: "00",
  };
  await applyVerifiedPayment(
    { ...data, reference: randomUUID(), amount: 1 },
    "synthetic-018",
  );
  expect(
    (await getFirestore().doc(`orders/${result.id}`).get()).data()?.collected,
  ).toBe(0);
  await Promise.all([
    applyVerifiedPayment(data, "synthetic-018"),
    applyVerifiedPayment(data, "synthetic-018"),
  ]);
  expect(
    (await getFirestore().doc(`orders/${result.id}`).get()).data()?.collected,
  ).toBe(300000);
  expect((await intent.get()).data()?.state).toBe("paid");
});

it("validates explicitly configured listed prices at authorized publication", async () => {
  const { workspaceCommand } = await import("../../functions/src/workspace");
  const input = await seed();
  const write = {
    action: "saveContent",
    id: `catalog018-${randomUUID()}`,
    expectedVersion: 0,
    operationId: randomUUID(),
    payload: {
      kind: "products",
      content: {
        title: "Synthetic listed content",
        slug: `catalog018-${randomUUID()}`,
        body: "Synthetic fixture content only.",
        status: "published",
        market: "US",
        orderable: true,
        referencePrice: 1,
        termsVersion: "synthetic-v1",
      },
    },
  };
  await expect(
    workspaceCommand.run(request(staff, write)),
  ).rejects.toMatchObject({ code: "invalid-argument" });
  await expect(
    workspaceCommand.run(request(owner, write)),
  ).rejects.toMatchObject({ code: "permission-denied" });
  await workspaceCommand.run(
    request(staff, {
      ...write,
      operationId: randomUUID(),
      payload: {
        ...write.payload,
        content: {
          ...write.payload.content,
          listedPrice: 150000,
          catalogOptions: ["Blue"],
        },
      },
    }),
  );
  await expect(
    command.run(
      request(`catalog018-${randomUUID()}`, {
        action: "cancelRequest",
        orderId: (await checkout.run(request(owner, input))).id,
        expectedVersion: 1,
        operationId: randomUUID(),
        payload: {},
      }),
    ),
  ).rejects.toMatchObject({ code: "permission-denied" });
});

it("listed product travels through purchase, packing and delivery after one full collection", async () => {
  const input = await seed();
  let state: { id: string; version: number } = await checkout.run(
    request(owner, input),
  );
  const act = async (uid: string, action: string, payload: unknown) =>
    command.run(
      request(uid, {
        action,
        orderId: state.id,
        expectedVersion: state.version,
        operationId: randomUUID(),
        payload,
      }),
    );
  await expect(act(staff, "claimPurchase", {})).rejects.toMatchObject({
    code: "failed-precondition",
  });
  state = await act(staff, "verifyTransfer", {
    amount: 300000,
    bankTransactionId: randomUUID(),
    evidence: "Synthetic verified full payment",
    reason: "Demo only full listed purchase",
  });
  state = await act(staff, "claimPurchase", {});
  state = await act(staff, "recordPurchase", {
    quantity: 2,
    supplierOrder: "synthetic-supplier",
    actualSourceMinor: 10000,
    evidence: "Synthetic purchase evidence",
  });
  state = await act(staff, "receive", {
    quantity: 2,
    condition: "good",
    evidence: "Synthetic receiving evidence",
  });
  state = await act(staff, "pack", {
    weightGrams: 1000,
    dimensionsCm: [10, 20, 30],
    evidence: "Synthetic packing evidence",
    checklist: true,
  });
  expect(
    (await getFirestore().doc(`orders/${state.id}`).get()).data()?.stage,
  ).toBe("READY_TO_SHIP");
  await expect(
    act(staff, "finalize", {
      total: 300001,
      reason: "Synthetic forbidden surcharge",
    }),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  state = await act(staff, "dispatch", {});
  state = await act(staff, "track", {
    tracking: "synthetic-carrier",
    delivered: true,
  });
  state = await act(owner, "confirmReceipt", { received: true });
  const order = (await getFirestore().doc(`orders/${state.id}`).get()).data();
  expect(order).toMatchObject({
    stage: "COMPLETED",
    finalTotal: 300000,
    collected: 300000,
    refunded: 0,
  });
  expect(order).not.toHaveProperty("quote");
  expect(
    (
      await getFirestore()
        .collection("financialEntries")
        .where("orderId", "==", state.id)
        .where("kind", "==", "payment")
        .get()
    ).size,
  ).toBe(1);
});

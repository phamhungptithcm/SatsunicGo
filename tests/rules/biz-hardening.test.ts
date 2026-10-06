import { beforeAll, expect, it } from "vitest";
import { createHash, randomUUID } from "node:crypto";
import { getFirestore } from "firebase-admin/firestore";
import type { CallableRequest } from "firebase-functions/v2/https";

let checkout: typeof import("../../functions/src/catalog-checkout").catalogCheckout;
let command: typeof import("../../functions/src/index").command;
const customer = `biz025-${randomUUID()}`,
  finance = `biz025-${randomUUID()}`;
const req = (uid: string, data: unknown) =>
  ({
    auth: {
      uid,
      token: {
        uid,
        email_verified: true,
        firebase: { sign_in_provider: "google.com" },
      },
    },
    data,
  }) as CallableRequest;

beforeAll(async () => {
  process.env.FUNCTIONS_EMULATOR = "true";
  process.env.GCLOUD_PROJECT = `demo-satsunicgo-biz-${randomUUID().slice(0, 8)}`;
  process.env.FIREBASE_CONFIG = JSON.stringify({
    projectId: process.env.GCLOUD_PROJECT,
  });
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8181";
  ({ command } = await import("../../functions/src/index"));
  ({ catalogCheckout: checkout } =
    await import("../../functions/src/catalog-checkout"));
  await getFirestore()
    .doc(`staffAccess/${finance}`)
    .set({ active: true, roles: ["FINANCE"] });
});

async function catalog() {
  const productId = `biz025-${randomUUID()}`;
  await getFirestore()
    .doc(`products/${productId}`)
    .set({
      title: "Synthetic cancellation race product",
      slug: productId,
      status: "published",
      market: "US",
      version: 1,
      orderable: true,
      listedPrice: 150000,
      termsVersion: "synthetic-biz025",
      catalogOptions: ["Blue"],
    });
  const selection = {
    productId,
    productVersion: 1,
    quantity: 2,
    variant: "Blue",
    operationId: randomUUID(),
  };
  const state = await checkout.run(req(customer, selection));
  return { selection, state, ref: getFirestore().doc(`orders/${state.id}`) };
}
function data(
  action: string,
  id: string,
  version: number,
  payload: unknown = {},
  operationId = randomUUID(),
) {
  return {
    action,
    orderId: id,
    expectedVersion: version,
    payload,
    operationId,
  };
}
const transfer = () => ({
  amount: 300000,
  bankTransactionId: randomUUID(),
  evidence: "Synthetic bank proof; emulator only",
  reason: "Synthetic verified collection",
});
async function entries(id: string) {
  return (
    await getFirestore()
      .collection("financialEntries")
      .where("orderId", "==", id)
      .get()
  ).size;
}

it("unpaid catalog cancellation replay preserves one checkout identity and blocks new collections", async () => {
  const { selection, state, ref } = await catalog();
  const cancel = data("cancelRequest", state.id, state.version);
  const result = await command.run(req(customer, cancel));
  expect(await command.run(req(customer, cancel))).toEqual(result);
  expect(await checkout.run(req(customer, selection))).toEqual(state);
  await expect(
    checkout.run(req(customer, { ...selection, quantity: 1 })),
  ).rejects.toMatchObject({ code: "already-exists" });
  const cancelled = (await ref.get()).data()!;
  expect(cancelled).toMatchObject({
    stage: "CANCELLED",
    collected: 0,
    refunded: 0,
  });
  await expect(
    command.run(req(customer, data("cancelRequest", state.id, state.version))),
  ).rejects.toMatchObject({ code: "aborted" });
  await expect(
    command.run(
      req(
        customer,
        data("transferReview", state.id, cancelled.version, {
          reference: "synthetic-late",
          amount: 300000,
        }),
      ),
    ),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  await expect(
    command.run(
      req(
        finance,
        data("verifyTransfer", state.id, cancelled.version, transfer()),
      ),
    ),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  expect((await ref.get()).data()).toEqual(cancelled);
  expect(await entries(state.id)).toBe(0);
  expect(
    (
      await getFirestore()
        .collection("orders")
        .where("catalogSnapshot.productId", "==", selection.productId)
        .get()
    ).size,
  ).toBe(1);
});

it("verified catalog payment prevents cancellation and replay cannot collect twice", async () => {
  const { state, ref } = await catalog();
  const payment = data("verifyTransfer", state.id, state.version, transfer());
  const result = await command.run(req(finance, payment));
  expect(await command.run(req(finance, payment))).toEqual(result);
  const paid = (await ref.get()).data()!;
  await expect(
    command.run(req(customer, data("cancelRequest", state.id, paid.version))),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  expect((await ref.get()).data()).toEqual(paid);
  expect(paid).toMatchObject({
    stage: "QUOTE_ACCEPTED",
    collected: 300000,
    refunded: 0,
  });
  expect(await entries(state.id)).toBe(1);
});

it("concurrent catalog cancellation and payment serialize one winner with no cancelled collection", async () => {
  const { state, ref } = await catalog();
  const outcomes = await Promise.allSettled([
    command.run(req(customer, data("cancelRequest", state.id, state.version))),
    command.run(
      req(finance, data("verifyTransfer", state.id, state.version, transfer())),
    ),
  ]);
  expect(outcomes.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  const rejected = outcomes.find(
    (r) => r.status === "rejected",
  ) as PromiseRejectedResult;
  expect(rejected.reason).toMatchObject({ code: "aborted" });
  const current = (await ref.get()).data()!;
  expect(current.refunded).toBe(0);
  if (current.stage === "CANCELLED") {
    expect(current.collected).toBe(0);
    expect(await entries(state.id)).toBe(0);
  } else {
    expect(current).toMatchObject({
      stage: "QUOTE_ACCEPTED",
      collected: 300000,
    });
    expect(await entries(state.id)).toBe(1);
  }
});

it("late verified catalog callback after cancellation is quarantined once without allocating money", async () => {
  const { applyVerifiedPayment } =
    await import("../../functions/src/payments/payos");
  const { state, ref } = await catalog();
  const intent = getFirestore().doc(`paymentRequests/biz025-${randomUUID()}`);
  const event = {
    orderCode: Date.now() * 1000 + Math.floor(Math.random() * 1000),
    amount: 300000,
    currency: "VND",
    reference: randomUUID(),
    paymentLinkId: randomUUID(),
    accountNumber: "synthetic-biz025",
    code: "00",
  };
  await intent.set({
    orderId: state.id,
    ownerId: customer,
    purpose: "full",
    acceptedQuoteVersion: null,
    amount: event.amount,
    orderCode: event.orderCode,
    paymentLinkId: event.paymentLinkId,
    state: "pending",
  });
  await command.run(
    req(customer, data("cancelRequest", state.id, state.version)),
  );
  const cancelled = (await ref.get()).data()!;
  await Promise.all([
    applyVerifiedPayment(event, event.accountNumber),
    applyVerifiedPayment(event, event.accountNumber),
  ]);
  await applyVerifiedPayment(event, event.accountNumber);
  const key = createHash("sha256")
    .update(`payos:${event.reference}`)
    .digest("hex");
  expect(
    (await getFirestore().doc(`webhookReceipts/${key}`).get()).data()?.state,
  ).toBe("exception");
  expect(
    (await getFirestore().doc(`paymentExceptions/${key}`).get()).data(),
  ).toMatchObject({
    orderCode: event.orderCode,
    amount: 300000,
    state: "open",
    inboundVerified: true,
  });
  expect(
    (
      await getFirestore()
        .collection("paymentExceptions")
        .where("orderCode", "==", event.orderCode)
        .get()
    ).size,
  ).toBe(1);
  expect((await ref.get()).data()).toEqual(cancelled);
  expect(await entries(state.id)).toBe(0);
  expect((await intent.get()).data()?.state).toBe("pending");
  const bankHash = createHash("sha256").update(event.reference).digest("hex");
  expect(
    (await getFirestore().doc(`bankTransactions/${bankHash}`).get()).exists,
  ).toBe(false);
});

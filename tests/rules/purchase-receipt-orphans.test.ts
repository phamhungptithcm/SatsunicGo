import { beforeAll, afterAll, expect, test } from "vitest";
import { randomUUID } from "node:crypto";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
let app: ReturnType<typeof initializeApp>,
  receipts: typeof import("../../functions/src/purchase-receipts");
beforeAll(async () => {
  process.env.FIREBASE_CONFIG = JSON.stringify({
    projectId: "demo-satsunicgo",
  });
  app = initializeApp({ projectId: "demo-satsunicgo" });
  receipts = await import("../../functions/src/purchase-receipts");
});
afterAll(async () => {
  await getFirestore().terminate();
  await deleteApp(app);
});
test("missing receipt retires an orphan lease so recovery cannot be starved by it", async () => {
  const db = getFirestore(),
    id = randomUUID(),
    ref = db.doc(`purchaseReceiptJobs/${id}`);
  await ref.create({
    state: "processing",
    leaseUntil: Date.now() - 1,
    attempts: 1,
  });
  await receipts.processPurchaseReceipt(id);
  expect((await ref.get()).data()).toMatchObject({
    state: "failed",
    failureCode: "RECEIPT_MISSING",
    leaseUntil: 0,
    attempts: 1,
  });
  expect((await db.doc(`purchaseReceipts/${id}`).get()).exists).toBe(false);
  expect((await db.doc(`purchaseEmailOutbox/${id}`).get()).exists).toBe(false);
});
test.each(["ready", "failed"])(
  "terminal %s job cannot occupy expired recovery batch forever",
  async (state) => {
    const db = getFirestore(),
      id = randomUUID(),
      ref = db.doc(`purchaseReceiptJobs/${id}`),
      snapshot = db.doc(`purchaseReceipts/${id}`);
    await ref.create({ state, leaseUntil: Date.now() - 1, attempts: 2 });
    await snapshot.create({ state, snapshotHash: "synthetic-unchanged" });
    await receipts.processPurchaseReceipt(id);
    await receipts.processPurchaseReceipt(id);
    expect((await ref.get()).data()).toMatchObject({
      state,
      leaseUntil: 0,
      attempts: 2,
    });
    expect((await snapshot.get()).data()).toEqual({
      state,
      snapshotHash: "synthetic-unchanged",
    });
    expect((await db.doc(`purchaseEmailOutbox/${id}`).get()).exists).toBe(
      false,
    );
  },
);

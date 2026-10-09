// Shared-runtime variant of pinned e3b2f39 regression fixture.
// Read existing settings, preserve data; do not run the exclusive CI fixture against this runtime.
import { beforeAll, afterAll, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { CallableRequest } from "firebase-functions/v2/https";
import { demoFirestoreEndpoint } from "../tests/helpers/demo-environment";
import {
  initializeTestEnvironment,
  assertFails,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
const uid = `purchase-race-${randomUUID()}`,
  productId = `purchase-race-${randomUUID()}`;
let app: ReturnType<typeof initializeApp>, rules: RulesTestEnvironment;
let originalReceiptId: string;
let api: typeof import("../functions/src/purchase-checkout");
let receipts: typeof import("../functions/src/purchase-receipts");
const req = (data: unknown, owner = uid) =>
  ({
    auth: {
      uid: owner,
      token: {
        email_verified: true,
        email: "demo@satsunicgo.example.invalid",
        firebase: { sign_in_provider: "google.com" },
      },
    },
    data,
  }) as CallableRequest;
beforeAll(async () => {
  process.env.FIREBASE_CONFIG = JSON.stringify({
    projectId: "demo-satsunicgo",
  });
  app = initializeApp({
    projectId: "demo-satsunicgo",
    storageBucket: "demo-satsunicgo.appspot.com",
  });
  api = await import("../functions/src/purchase-checkout");
  receipts = await import("../functions/src/purchase-receipts");
  await getFirestore().doc(`products/${productId}`).create({
    title: "Race demo",
    slug: productId,
    status: "published",
    market: "US",
    version: 1,
    orderable: true,
    listedPrice: 100000,
    termsVersion: "demo",
    catalogOptions: [],
  });
  rules = await initializeTestEnvironment({
    projectId: "demo-satsunicgo-purchase-rules",
    firestore: {
      ...demoFirestoreEndpoint(process.env),
      rules: readFileSync("firestore.rules", "utf8"),
    },
  });
});
afterAll(async () => {
  await rules?.cleanup();
  await getFirestore().terminate();
  await deleteApp(app);
});
it("parallel commit operations reserve one checkout; parallel proof allocates exactly once", async () => {
  const db = getFirestore(),
    lineId = randomUUID();
  await db.doc(`carts/${uid}`).create({
    ownerId: uid,
    revision: 1,
    updatedAt: 0,
    items: [{ lineId, productId, variant: "", quantity: 2 }],
  });
  const region = (await db.doc("settings/purchaseRegions").get()).data()!
      .provinces[0],
    commune = region.communes[0];
  const p = (await api.purchaseCheckout.run(
    req({
      action: "preview",
      operationId: randomUUID(),
      expectedRevision: 1,
      recipient: {
        recipient: "Demo concurrency",
        phone: "0900000000",
        country: "VN",
        provinceCode: region.code,
        communeCode: commune.code,
        province: region.name,
        commune: commune.name,
        street: "Số 10 đường thử",
        note: "",
      },
    }),
  )) as { id: string; previewHash: string };
  const commits = await Promise.allSettled(
    [1, 2].map(() =>
      api.purchaseCheckout.run(
        req({
          action: "commit",
          operationId: randomUUID(),
          previewId: p.id,
          previewHash: p.previewHash,
          confirmed: true,
        }),
      ),
    ),
  );
  expect(commits.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  const payments = await Promise.all([
    api.purchaseDemoPayment.run(req({ id: p.id, outcome: "paid" })),
    api.purchaseDemoPayment.run(req({ id: p.id, outcome: "paid" })),
  ]);
  originalReceiptId = p.id;
  expect(payments[0]).toEqual(payments[1]);
  const entries = await db
    .collection("financialEntries")
    .where("ownerId", "==", uid)
    .get();
  expect(entries.size).toBe(1);
  expect(entries.docs[0].data().amount).toBe(200000);
  expect((await db.doc(`carts/${uid}`).get()).data()!.items).toEqual([]);
  await expect(
    api.purchaseCheckout.run(req({ action: "status", id: p.id }, "other")),
  ).rejects.toMatchObject({ code: "permission-denied" });
});
it("client rules deny all payment/draft/evidence/outbox writes and private cross-owner reads", async () => {
  const fs = rules.authenticatedContext("outsider").firestore();
  for (const collection of [
    "purchaseDrafts",
    "purchaseCheckouts",
    "purchaseReceipts",
    "purchaseReceiptJobs",
    "purchasePaymentEvidence",
    "purchaseEmailOutbox",
  ]) {
    await assertFails(
      setDoc(doc(fs, collection, "private"), { ownerId: "outsider" }),
    );
    await assertFails(getDoc(doc(fs, collection, "private")));
  }
});
it("demo proof refuses production-like configuration even with emulator flag", async () => {
  const before = process.env.GCLOUD_PROJECT;
  try {
    process.env.GCLOUD_PROJECT = "satsunicgo";
    await expect(
      api.purchaseDemoPayment.run(req({ id: randomUUID(), outcome: "paid" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  } finally {
    process.env.GCLOUD_PROJECT = before;
  }
});
it("receipt workers recover expired leases, deduplicate private attachments and never report delivery without a recipient", async () => {
  const db = getFirestore();
  const original = (
    await db.doc(`purchaseReceipts/${originalReceiptId}`).get()
  ).data()!;
  const id = randomUUID();
  await db
    .doc(`purchaseReceipts/${id}`)
    .create({ ...original, id, ownerEmail: null, state: "queued" });
  await db.doc(`purchaseReceiptJobs/${id}`).create({
    state: "processing",
    attempts: 1,
    leaseUntil: Date.now() - 1,
    claim: "expired",
  });
  await Promise.all([
    receipts.processPurchaseReceipt(id),
    receipts.processPurchaseReceipt(id),
  ]);
  const result = (await db.doc(`purchaseReceipts/${id}`).get()).data()!;
  const outbox = (await db.doc(`purchaseEmailOutbox/${id}`).get()).data()!;
  expect(result.state).toBe("ready");
  expect(result.emailState).toBe("pending_recipient");
  expect(outbox.to).toBeNull();
  expect(outbox.attachments).toHaveLength(1);
  expect(outbox.attachments[0].sha256).toBe(result.pdfSha256);
  expect(
    (await db.doc(`purchaseReceiptJobs/${id}`).get()).data()!.attempts,
  ).toBe(2);
  const before = await db
    .collection("financialEntries")
    .where("ownerId", "==", uid)
    .get();
  const badId = randomUUID();
  await db.doc(`purchaseReceipts/${badId}`).create({
    ...original,
    id: badId,
    total: original.total + 1,
    state: "queued",
  });
  await db
    .doc(`purchaseReceiptJobs/${badId}`)
    .create({ state: "queued", attempts: 0 });
  await receipts.processPurchaseReceipt(badId);
  expect((await db.doc(`purchaseReceipts/${badId}`).get()).data()!.state).toBe(
    "queued",
  );
  await receipts.processPurchaseReceipt(badId);
  await receipts.processPurchaseReceipt(badId);
  expect((await db.doc(`purchaseReceipts/${badId}`).get()).data()!.state).toBe(
    "failed",
  );
  expect((await db.doc(`purchaseEmailOutbox/${badId}`).get()).exists).toBe(
    false,
  );
  expect(
    (await db.collection("financialEntries").where("ownerId", "==", uid).get())
      .size,
  ).toBe(before.size);
});
it("background recovery reaches expired leases while new work and active leases are present", async () => {
  const db = getFirestore();
  const original = (
    await db.doc(`purchaseReceipts/${originalReceiptId}`).get()
  ).data()!;
  const activeIds = Array.from(
    { length: 20 },
    () => `00000000-${randomUUID().slice(9)}`,
  );
  const queuedIds = Array.from({ length: 10 }, () => randomUUID());
  const expiredId = `ffffffff-${randomUUID().slice(9)}`;
  const batch = db.batch();
  for (const id of activeIds) {
    batch.create(db.doc(`purchaseReceiptJobs/${id}`), {
      state: "processing",
      attempts: 1,
      leaseUntil: Date.now() + 120000,
    });
  }
  for (const id of [...queuedIds, expiredId]) {
    batch.create(db.doc(`purchaseReceipts/${id}`), {
      ...original,
      id,
      state: "queued",
    });
    batch.create(
      db.doc(`purchaseReceiptJobs/${id}`),
      id === expiredId
        ? {
            state: "processing",
            attempts: 1,
            leaseUntil: Date.now() - 1,
            claim: "expired",
          }
        : { state: "queued", attempts: 0 },
    );
  }
  await batch.commit();
  try {
    await receipts.purchaseReceiptRecovery.run({
      scheduleTime: new Date().toISOString(),
      jobName: "demo-test-recovery",
    });
    expect(
      (await db.doc(`purchaseReceiptJobs/${expiredId}`).get()).data()!.state,
    ).toBe("ready");
    expect(
      (await db.doc(`purchaseReceiptJobs/${expiredId}`).get()).data()!.attempts,
    ).toBe(2);
    const queued = await Promise.all(
      queuedIds.map((id) => db.doc(`purchaseReceiptJobs/${id}`).get()),
    );
    expect(
      queued.filter((row) => row.data()!.state === "ready").length,
    ).toBeGreaterThan(0);
    expect(
      queued.filter((row) => row.data()!.state === "queued").length,
    ).toBeGreaterThan(0);
    expect(
      (await db.doc(`purchaseReceiptJobs/${activeIds[0]}`).get()).data()!
        .attempts,
    ).toBe(1);
  } finally {
    const cleanup = db.batch();
    for (const id of activeIds)
      cleanup.update(db.doc(`purchaseReceiptJobs/${id}`), {
        state: "failed",
        leaseUntil: 0,
        failureCode: "FIXTURE_COMPLETED",
      });
    await cleanup.commit();
  }
});

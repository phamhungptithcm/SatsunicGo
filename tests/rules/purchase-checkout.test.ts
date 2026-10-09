import { beforeAll, afterAll, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore, type DocumentSnapshot } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import type { CallableRequest } from "firebase-functions/v2/https";
import { demoFirestoreEndpoint } from "../helpers/demo-environment";
import {
  checkoutPolicySchema,
  checkoutRecipientSchema,
  type CheckoutSnapshot,
} from "../../packages/domain/purchase-checkout";
import type { PurchaseReceiptData } from "../../functions/src/purchase-pdf";
import {
  initializeTestEnvironment,
  assertFails,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
const uid = `purchase-race-${randomUUID()}`,
  receiptUid = `purchase-receipt-${randomUUID()}`,
  productId = `purchase-race-${randomUUID()}`;
const ownedPaths = new Set<string>(),
  checkoutIds = new Set<string>(),
  receiptIds = new Set<string>(),
  ownedSettings = new Map<string, DocumentSnapshot>();
const recipient = checkoutRecipientSchema.parse({
  recipient: "Demo concurrency",
  phone: "0900000000",
  country: "VN",
  provinceCode: "01",
  communeCode: "00001",
  province: "Synthetic province",
  commune: "Synthetic commune",
  street: "Số 10 đường thử",
  note: "",
});
let app: ReturnType<typeof initializeApp>, rules: RulesTestEnvironment;
let api: typeof import("../../functions/src/purchase-checkout");
let receipts: typeof import("../../functions/src/purchase-receipts");
let receiptSeed: PurchaseReceiptData;
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
function trackReceipt(id: string) {
  receiptIds.add(id);
  for (const collection of [
    "purchaseReceipts",
    "purchaseReceiptJobs",
    "purchaseEmailOutbox",
  ])
    ownedPaths.add(`${collection}/${id}`);
}
function trackCheckout(p: CheckoutSnapshot) {
  checkoutIds.add(p.id);
  receiptIds.add(p.id);
  for (const collection of [
    "purchasePreviews",
    "purchaseCheckouts",
    "purchaseReceipts",
    "purchaseReceiptJobs",
    "purchaseEmailOutbox",
  ])
    ownedPaths.add(`${collection}/${p.id}`);
  ownedPaths.add(`purchasePaymentEvidence/DEMO-${p.id}`);
  for (const line of p.lines) {
    ownedPaths.add(`orders/${line.orderId}`);
    ownedPaths.add(`orderRecipients/${line.orderId}`);
    ownedPaths.add(`orders/${line.orderId}/timeline/purchase-${p.id}`);
    ownedPaths.add(`financialEntries/purchase-${p.id}-${line.orderId}`);
  }
}
async function preview(owner: string) {
  const db = getFirestore(),
    operationId = randomUUID();
  ownedPaths.add(`carts/${owner}`);
  ownedPaths.add(`users/${owner}`);
  ownedPaths.add(`idempotencyKeys/purchase-${owner}-${operationId}`);
  await db.doc(`carts/${owner}`).create({
    ownerId: owner,
    revision: 1,
    updatedAt: 0,
    items: [{ lineId: randomUUID(), productId, variant: "", quantity: 2 }],
  });
  const p = (await api.purchaseCheckout.run(
    req(
      { action: "preview", operationId, expectedRevision: 1, recipient },
      owner,
    ),
  )) as CheckoutSnapshot & { previewHash: string };
  trackCheckout(p);
  return p;
}
function commit(p: CheckoutSnapshot & { previewHash: string }, owner: string) {
  const operationId = randomUUID();
  ownedPaths.add(`idempotencyKeys/purchase-${owner}-${operationId}`);
  return api.purchaseCheckout.run(
    req(
      {
        action: "commit",
        operationId,
        previewId: p.id,
        previewHash: p.previewHash,
        confirmed: true,
      },
      owner,
    ),
  );
}
beforeAll(async () => {
  if (
    demoFirestoreEndpoint(process.env).port !== 18207 ||
    process.env.FIREBASE_STORAGE_EMULATOR_HOST !== "127.0.0.1:9298"
  )
    throw Error(
      "Purchase fixtures require exact demo Firestore18207 and Storage9298",
    );
  process.env.FIREBASE_CONFIG = JSON.stringify({
    projectId: "demo-satsunicgo",
  });
  app = initializeApp({
    projectId: "demo-satsunicgo",
    storageBucket: "demo-satsunicgo.appspot.com",
  });
  api = await import("../../functions/src/purchase-checkout");
  receipts = await import("../../functions/src/purchase-receipts");
  const db = getFirestore();
  if (!api.purchaseDemoEnvironment(db))
    throw Error("Purchase fixtures require the exact guarded demo identity");
  const fixtureVersion = Date.now(),
    settings = {
      upfrontCheckout: checkoutPolicySchema.parse({
        enabled: true,
        approved: true,
        version: fixtureVersion,
        serviceBps: 500,
        termsVersion: productId,
        effectiveFrom: 0,
        expiresAt: Date.now() + 86400000,
        rates: {
          USD: { numerator: 250, denominator: 1 },
          JPY: { numerator: 170, denominator: 1 },
          KRW: { numerator: 20, denominator: 1 },
        },
      }),
      purchaseRegions: {
        version: fixtureVersion,
        provinces: [
          {
            code: recipient.provinceCode,
            name: recipient.province,
            communes: [
              { code: recipient.communeCode, name: recipient.commune },
            ],
          },
        ],
      },
      purchaseDemo: { enabled: true, fixtureId: productId },
    };
  await db.runTransaction(async (tx) => {
    const refs = Object.keys(settings).map((id) => db.doc(`settings/${id}`)),
      snapshots = await Promise.all(refs.map((ref) => tx.get(ref)));
    if (snapshots.some((snapshot) => snapshot.exists))
      throw Error("Purchase fixture refuses preexisting global settings");
    for (const [id, value] of Object.entries(settings))
      tx.create(db.doc(`settings/${id}`), value);
  });
  for (const [id, value] of Object.entries(settings)) {
    const snapshot = await db.doc(`settings/${id}`).get();
    expect(snapshot.data()).toEqual(value);
    ownedSettings.set(snapshot.ref.path, snapshot);
  }
  ownedPaths.add(`products/${productId}`);
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
  // A real paid business operation supplies receipt fixtures independently of
  // the race test, with a distinct owner so its financial oracle remains exact.
  const p = await preview(receiptUid);
  await commit(p, receiptUid);
  await api.purchaseDemoPayment.run(
    req({ id: p.id, outcome: "paid" }, receiptUid),
  );
  receiptSeed = (
    await db.doc(`purchaseReceipts/${p.id}`).get()
  ).data() as PurchaseReceiptData;
  await receipts.processPurchaseReceipt(p.id);
  expect(
    (await db.doc(`purchaseReceiptJobs/${p.id}`).get()).data()?.state,
  ).toBe("ready");
});
afterAll(async () => {
  if (!app) return;
  const db = getFirestore();
  try {
    await rules?.cleanup();
    for (const id of checkoutIds) {
      const audit = await db
        .collection("auditEvents")
        .where("resourceId", "==", id)
        .get();
      for (const row of audit.docs) {
        if (row.data().actor !== "demo-payment-adapter")
          throw Error("Refuse to remove an unowned purchase audit");
        ownedPaths.add(row.ref.path);
      }
    }
    const snapshots = await Promise.all(
      [...ownedPaths].map((path) => db.doc(path).get()),
    );
    for (const snapshot of snapshots) {
      if (!snapshot.exists) continue;
      const owner = snapshot.data()?.ownerId;
      if (owner !== undefined && owner !== uid && owner !== receiptUid)
        throw Error("Refuse to remove an unowned purchase fixture");
    }
    for (const id of receiptIds) {
      const snapshot = snapshots.find(
        (row) => row.ref.path === `purchaseReceipts/${id}`,
      );
      if (!snapshot?.exists) continue;
      const file = getStorage()
        .bucket()
        .file(`private-purchase-receipts/${id}/receipt.pdf`);
      try {
        const [metadata] = await file.getMetadata();
        const generation = Number(metadata.generation);
        if (
          !Number.isSafeInteger(generation) ||
          generation < 1 ||
          !metadata.metadata?.sha256 ||
          (snapshot.data()?.pdfSha256 &&
            metadata.metadata.sha256 !== snapshot.data()?.pdfSha256)
        )
          throw Error("Refuse to remove an unowned receipt artifact");
        await file.delete({ ifGenerationMatch: generation });
      } catch (error) {
        if ((error as { code?: number }).code !== 404) throw error;
      }
    }
    const cleanup = db.batch();
    for (const snapshot of snapshots)
      if (snapshot.exists)
        cleanup.delete(snapshot.ref, { lastUpdateTime: snapshot.updateTime! });
    await cleanup.commit();
    await db.runTransaction(async (tx) => {
      const current = await Promise.all(
        [...ownedSettings.values()].map((snapshot) => tx.get(snapshot.ref)),
      );
      for (const snapshot of current) {
        const original = ownedSettings.get(snapshot.ref.path)!;
        if (
          snapshot.exists &&
          snapshot.updateTime?.isEqual(original.updateTime!)
        )
          tx.delete(snapshot.ref);
        else if (snapshot.exists)
          throw Error("Refuse to remove changed purchase settings");
      }
    });
  } finally {
    await db.terminate();
    await deleteApp(app);
  }
});
it("parallel commit operations reserve one checkout; parallel proof allocates exactly once", async () => {
  const db = getFirestore(),
    p = await preview(uid);
  const commits = await Promise.allSettled([1, 2].map(() => commit(p, uid)));
  expect(commits.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  const payments = await Promise.all([
    api.purchaseDemoPayment.run(req({ id: p.id, outcome: "paid" })),
    api.purchaseDemoPayment.run(req({ id: p.id, outcome: "paid" })),
  ]);
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
  const original = receiptSeed;
  const id = randomUUID();
  trackReceipt(id);
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
    .where("ownerId", "==", receiptUid)
    .get();
  const badId = randomUUID();
  trackReceipt(badId);
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
    (
      await db
        .collection("financialEntries")
        .where("ownerId", "==", receiptUid)
        .get()
    ).size,
  ).toBe(before.size);
});
it("background recovery reaches expired leases while new work and active leases are present", async () => {
  const db = getFirestore();
  const original = receiptSeed;
  const activeIds = Array.from(
    { length: 20 },
    () => `00000000-${randomUUID().slice(9)}`,
  );
  const queuedIds = Array.from({ length: 10 }, () => randomUUID());
  const expiredId = `ffffffff-${randomUUID().slice(9)}`;
  const batch = db.batch();
  for (const id of activeIds) {
    ownedPaths.add(`purchaseReceiptJobs/${id}`);
    batch.create(db.doc(`purchaseReceiptJobs/${id}`), {
      state: "processing",
      attempts: 1,
      leaseUntil: Date.now() + 120000,
    });
  }
  for (const id of [...queuedIds, expiredId]) {
    trackReceipt(id);
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

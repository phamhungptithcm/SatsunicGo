import { initializeApp, deleteApp, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { beforeAll, beforeEach, afterAll, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import type { CallableRequest } from "firebase-functions/v2/https";
let db: ReturnType<typeof getFirestore>,
  returns: typeof import("../../functions/src/returns"),
  consolidation: typeof import("../../functions/src/consolidation");
const prefix = `auth025-${randomUUID()}`,
  uid = `${prefix}-staff`,
  orderId = `${prefix}-order`,
  returnId = `${prefix}-return`,
  parcelId = `${prefix}-parcel`,
  batchId = `${prefix}-batch`;
const order = {
  id: orderId,
  ownerId: `${prefix}-customer`,
  version: 1,
  market: "US",
  stage: "PACKED",
  items: [{ name: "Synthetic", quantity: 1 }],
  collected: 0,
  refunded: 0,
};
const parcel = {
  id: parcelId,
  version: 1,
  state: "packed",
  allocations: [{ orderId, line: 0, quantity: 1 }],
  weightGrams: 100,
  warehouse: "Synthetic hub",
  route: "US-VN",
};
const returnRecord = {
  orderId,
  state: "inspecting",
  version: 1,
  lines: [{ line: 0, authorized: 1, received: 1, accepted: 1, damaged: 0 }],
};
function req(data: unknown) {
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
function closeInput() {
  return {
    id: returnId,
    action: "close",
    expectedVersion: 1,
    operationId: randomUUID(),
    evidence: "Synthetic physical inspection",
  };
}
function sealInput() {
  return {
    action: "seal",
    batchId,
    operationId: randomUUID(),
    orderVersions: { [orderId]: 1 },
    parcelVersions: { [parcelId]: 1 },
    payload: {
      parcelIds: [parcelId],
      orderWeights: { [orderId]: 100 },
      freight: 100,
      hub: "Synthetic hub",
      service: "Synthetic service",
      cutoff: Date.now() + 60000,
    },
  };
}
beforeAll(async () => {
  initializeApp({
    projectId: `demo-satsunicgo-authority-${randomUUID().slice(0, 8)}`,
  });
  db = getFirestore();
  returns = await import("../../functions/src/returns");
  consolidation = await import("../../functions/src/consolidation");
});
beforeEach(async () => {
  await Promise.all([
    db.doc(`users/${uid}`).set({ locked: false }),
    db.doc(`staffAccess/${uid}`).set({ active: true, roles: ["OWNER"] }),
    db.doc(`orders/${orderId}`).set(order),
    db.doc(`orderReturns/${returnId}`).set(returnRecord),
    db.doc(`packages/${parcelId}`).set(parcel),
    db.doc(`consolidationBatches/${batchId}`).delete(),
    db
      .doc(`packageAllocations/${orderId}`)
      .set({ parcelIds: [parcelId], allocations: [{ line: 0, quantity: 1 }] }),
  ]);
});
async function noWrites(operationId: string) {
  expect((await db.doc(`orders/${orderId}`).get()).data()).toEqual(order);
  expect((await db.doc(`orderReturns/${returnId}`).get()).data()).toEqual(
    returnRecord,
  );
  expect((await db.doc(`packages/${parcelId}`).get()).data()).toEqual(parcel);
  expect((await db.doc(`consolidationBatches/${batchId}`).get()).exists).toBe(
    false,
  );
  expect(
    (await db.doc(`idempotencyKeys/${uid}-${operationId}`).get()).exists,
  ).toBe(false);
  expect(
    (
      await db
        .collection("auditEvents")
        .where("resourceId", "==", orderId)
        .get()
    ).empty,
  ).toBe(true);
}
const malformed = [
  { label: "stringactive", access: { active: "false", roles: ["OWNER"] } },
  { label: "numericactive", access: { active: 1, roles: ["OWNER"] } },
  { label: "substringroles", access: { active: true, roles: "NOT_OWNER" } },
  { label: "objectroles", access: { active: true, roles: { OWNER: true } } },
];
it.each(malformed)(
  "AUTH025 returns rejects $label without state/audit writes",
  async ({ access }) => {
    await db.doc(`staffAccess/${uid}`).set(access);
    const d = closeInput();
    await expect(returns.returnCommand.run(req(d))).rejects.toMatchObject({
      code: "permission-denied",
    });
    await noWrites(d.operationId);
  },
);
it.each(malformed)(
  "AUTH025 consolidation rejects $label without state/audit writes",
  async ({ access }) => {
    await db.doc(`staffAccess/${uid}`).set(access);
    const d = sealInput();
    await expect(
      consolidation.consolidationCommand.run(req(d)),
    ).rejects.toMatchObject({ code: "permission-denied" });
    await noWrites(d.operationId);
  },
);
it("AUTH025 valid OWNER closes inspected return and replays without money/order changes", async () => {
  const d = closeInput();
  const result = await returns.returnCommand.run(req(d));
  expect(result).toEqual({ id: returnId, version: 2 });
  expect(await returns.returnCommand.run(req(d))).toEqual(result);
  expect((await db.doc(`orders/${orderId}`).get()).data()).toEqual(order);
});
it("AUTH025 valid WAREHOUSE seals a compatible fixture batch and replays", async () => {
  await db
    .doc(`staffAccess/${uid}`)
    .set({ active: true, roles: ["WAREHOUSE"] });
  const d = sealInput(),
    result = await consolidation.consolidationCommand.run(req(d));
  expect(result).toEqual({ id: batchId, version: 1 });
  expect(await consolidation.consolidationCommand.run(req(d))).toEqual(result);
});
afterAll(async () => {
  await db.terminate();
  await deleteApp(getApp());
});

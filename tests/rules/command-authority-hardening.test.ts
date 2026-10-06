import { getApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import type { CallableRequest } from "firebase-functions/v2/https";
let db: ReturnType<typeof getFirestore>,
  api: typeof import("../../functions/src/index");
const prefix = `cmd025-${randomUUID()}`,
  uid = `${prefix}-buyer`,
  orderId = `${prefix}-order`;
const stored = {
  id: orderId,
  ownerId: `${prefix}-customer`,
  purchaseKind: "catalog",
  stage: "QUOTE_ACCEPTED",
  version: 1,
  createdAt: Date.now(),
  acceptedAt: Date.now(),
  catalogSnapshot: { total: 100 },
  finalTotal: 100,
  collected: 100,
  refunded: 0,
  items: [{ name: "Synthetic", quantity: 1 }],
};
function request(operationId: string) {
  return {
    auth: {
      uid,
      token: {
        email_verified: true,
        firebase: { sign_in_provider: "google.com" },
      },
    },
    data: {
      action: "claimPurchase",
      payload: {},
      orderId,
      expectedVersion: 1,
      operationId,
    },
  } as CallableRequest;
}
beforeAll(async () => {
  api = await import("../../functions/src/index");
  db = getFirestore();
});
beforeEach(async () => {
  await Promise.all([
    db.doc(`users/${uid}`).set({ locked: false }),
    db
      .doc(`staffAccess/${uid}`)
      .set({ active: true, roles: ["BUYER"], orderIds: [orderId] }),
    db.doc(`orders/${orderId}`).set(stored),
    db.doc(`orderOperations/${orderId}`).delete(),
  ]);
});
const malformed = [
  { label: "stringactive", access: { active: "false", roles: ["OWNER"] } },
  { label: "numericactive", access: { active: 1, roles: ["OWNER"] } },
  { label: "stringroles", access: { active: true, roles: "NOT_OWNER" } },
  { label: "objectroles", access: { active: true, roles: { OWNER: true } } },
  {
    label: "substringassignment",
    access: {
      active: true,
      roles: ["BUYER"],
      orderIds: `prefix-${orderId}-suffix`,
    },
  },
  {
    label: "objectassignment",
    access: { active: true, roles: ["BUYER"], orderIds: { [orderId]: true } },
  },
];
it.each(malformed)(
  "CMD025 malformed authority $label denies valid claim without mutation",
  async ({ access }) => {
    await db.doc(`staffAccess/${uid}`).set(access);
    const operationId = randomUUID();
    const auditQuery = db
      .collection("auditEvents")
      .where("resourceId", "==", orderId)
      .where("action", "==", "claimPurchase");
    const priorAuditIds = (await auditQuery.get()).docs.map((d) => d.id).sort();
    await expect(api.command.run(request(operationId))).rejects.toMatchObject({
      code: "permission-denied",
    });
    expect((await db.doc(`orders/${orderId}`).get()).data()).toEqual(stored);
    expect((await db.doc(`orderOperations/${orderId}`).get()).exists).toBe(
      false,
    );
    expect(
      (await db.doc(`idempotencyKeys/${uid}-${operationId}`).get()).exists,
    ).toBe(false);
    expect((await auditQuery.get()).docs.map((d) => d.id).sort()).toEqual(
      priorAuditIds,
    );
  },
);
it("CMD025 exact array BUYER assignment claims current paid catalog and replays once", async () => {
  const operationId = randomUUID(),
    result = await api.command.run(request(operationId));
  expect(result).toEqual({ id: orderId, version: 2 });
  expect(await api.command.run(request(operationId))).toEqual(result);
  expect((await db.doc(`orders/${orderId}`).get()).data()).toMatchObject({
    stage: "PURCHASING",
    collected: 100,
    refunded: 0,
    version: 2,
  });
  expect(
    (await db.doc(`orderOperations/${orderId}`).get()).data()?.buyerId,
  ).toBe(uid);
});
afterAll(async () => {
  await db.terminate();
  await deleteApp(getApp());
});

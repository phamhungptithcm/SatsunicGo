import { initializeApp, getApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { beforeAll, beforeEach, afterAll, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import type { CallableRequest } from "firebase-functions/v2/https";
let db: ReturnType<typeof getFirestore>, refund: typeof import("../../functions/src/refunds"), finance: typeof import("../../functions/src/finance-review"), outbox: typeof import("../../functions/src/outbox-command");
const prefix = `mut026-${randomUUID()}`, uid = `${prefix}-staff`, owner = `${prefix}-customer`, orderId = `${prefix}-order`, exceptionId = `${prefix}-exception`, jobId = `${prefix}-job`;
const order = { ownerId: owner, version: 1, acceptedAt: 1, collected: 100, refunded: 0, refundReserved: 0 };
const exception = { state: "open", amount: 100 }, job = { ownerId: owner, version: 1, emailState: "unknown", reconciliationRequired: true };
function req(data: unknown) { return { auth: { uid, token: { email_verified: true, firebase: { sign_in_provider: "google.com" } } }, data } as CallableRequest; }
beforeAll(async () => { initializeApp({ projectId: `demo-satsunicgo-mut-${randomUUID().slice(0,8)}` }); db = getFirestore(); refund = await import("../../functions/src/refunds"); finance = await import("../../functions/src/finance-review"); outbox = await import("../../functions/src/outbox-command"); });
beforeEach(async () => { await Promise.all([db.doc(`users/${uid}`).set({ locked: false }), db.doc(`users/${owner}`).set({ locked: false }), db.doc(`staffAccess/${uid}`).set({ active: true, roles: ["OWNER"] }), db.doc(`orders/${orderId}`).set(order), db.doc(`paymentExceptions/${exceptionId}`).set(exception), db.doc(`outboxJobs/${jobId}`).set(job)]); });
const malformed = [
  { label: "stringactive", access: { active: "false", roles: ["OWNER"] } },
  { label: "numericactive", access: { active: 1, roles: ["OWNER"] } },
  { label: "stringroles", access: { active: true, roles: "NOT_OWNER" } },
  { label: "objectroles", access: { active: true, roles: { OWNER: true } } },
];
const boundaries = ["refund", "finance", "outbox"] as const;
function input(boundary: typeof boundaries[number], operationId: string) {
  if (boundary === "refund") return { action: "request", id: randomUUID(), orderId, expectedVersion: 1, operationId, amount: 10, reason: "Synthetic refund review" };
  if (boundary === "finance") return { action: "closeException", id: exceptionId, evidence: "Synthetic evidence", reason: "Synthetic review", operationId };
  return { action: "resolveUnknown", id: jobId, expectedVersion: 1, operationId, outcome: "confirmed_not_sent", evidence: "Synthetic provider readback" };
}
async function invoke(boundary: typeof boundaries[number], data: unknown) {
  if (boundary === "refund") return refund.refundCommand.run(req(data));
  if (boundary === "finance") return finance.financeReview.run(req(data));
  return outbox.outboxCommand.run(req(data));
}
for (const boundary of boundaries) {
  it.each(malformed)(`MUT026 ${boundary} denies $label before reservation/review/reconciliation effects`, async ({ access }) => {
    await db.doc(`staffAccess/${uid}`).set(access); const operationId = randomUUID(), data = input(boundary, operationId);
    const ledger = (await db.collection("financialEntries").get()).docs.map(d => d.id).sort();
    await expect(invoke(boundary, data)).rejects.toMatchObject({ code: "permission-denied" });
    expect((await db.doc(`orders/${orderId}`).get()).data()).toEqual(order); expect((await db.doc(`paymentExceptions/${exceptionId}`).get()).data()).toEqual(exception); expect((await db.doc(`outboxJobs/${jobId}`).get()).data()).toEqual(job);
    expect((await db.doc(`idempotencyKeys/${uid}-${operationId}`).get()).exists).toBe(false);
    expect((await db.collection("financialEntries").get()).docs.map(d => d.id).sort()).toEqual(ledger);
  });
  it(`MUT026 valid OWNER ${boundary} preserves action and completed replay`, async () => {
    const data = input(boundary, randomUUID()), result = await invoke(boundary, data);
    expect(await invoke(boundary, data)).toEqual(result);
    if (boundary === "refund") expect((await db.doc(`orders/${orderId}`).get()).data()?.refundReserved).toBe(10);
    if (boundary === "finance") expect((await db.doc(`paymentExceptions/${exceptionId}`).get()).data()?.state).toBe("closed");
    if (boundary === "outbox") expect((await db.doc(`outboxJobs/${jobId}`).get()).data()?.emailState).toBe("failed");
  });
}
afterAll(async () => { await db.terminate(); await deleteApp(getApp()); });

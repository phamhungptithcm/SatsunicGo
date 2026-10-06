import { initializeApp, getApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { beforeAll, beforeEach, afterAll, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import type { CallableRequest } from "firebase-functions/v2/https";
let db: ReturnType<typeof getFirestore>, invoices: typeof import("../../functions/src/invoices"), history: typeof import("../../functions/src/order-history");
const prefix = `read026-${randomUUID()}`, uid = `${prefix}-reader`, customer = `${prefix}-customer`, orderId = `${prefix}-order`, documentId = `${prefix}-draft`, ownId = `${prefix}-own`;
function req(data: unknown) { return { auth: { uid, token: { email_verified: true, firebase: { sign_in_provider: "google.com" } } }, data } as CallableRequest; }
beforeAll(async () => {
  initializeApp({ projectId: `demo-satsunicgo-read-${randomUUID().slice(0,8)}` }); db = getFirestore(); invoices = await import("../../functions/src/invoices"); history = await import("../../functions/src/order-history");
  await Promise.all([db.doc(`orders/${orderId}`).set({ ownerId: customer, version: 1, stage: "REQUESTED" }), db.doc(`salesDocuments/${documentId}`).set({ id: documentId, ownerId: customer, state: "draft", sourceOrderId: orderId }), db.doc(`salesDocuments/${ownId}`).set({ id: ownId, ownerId: uid, state: "issued", sourceOrderId: orderId })]);
});
beforeEach(async () => { await Promise.all([db.doc(`users/${uid}`).set({ locked: false }), db.doc(`staffAccess/${uid}`).set({ active: true, roles: ["OWNER"] })]); });
const malformed = [
  { label: "stringactive", access: { active: "false", roles: ["OWNER"] } },
  { label: "numericactive", access: { active: 1, roles: ["OWNER"] } },
  { label: "stringroles", access: { active: true, roles: "NOT_OWNER" } },
  { label: "objectroles", access: { active: true, roles: { OWNER: true } } },
];
it.each(malformed)("READ026 invoice list $label retains customer scope without foreign draft/privileged flags", async ({ access }) => {
  await db.doc(`staffAccess/${uid}`).set(access);
  const result = await invoices.invoiceList.run(req({ orderId }));
  expect(result.rows.map(r => r.id)).toEqual([ownId]);
  expect(result.canIssue).toBe(false); expect(result.canConfigure).toBe(false); expect(result.seller).toBeNull();
});
it.each(malformed)("READ026 invoice detail $label denies foreign draft", async ({ access }) => { await db.doc(`staffAccess/${uid}`).set(access); await expect(invoices.invoiceDetail.run(req({ id: documentId }))).rejects.toMatchObject({ code: "permission-denied" }); });
it.each(malformed)("READ026 order history $label denies foreign order/ledger", async ({ access }) => { await db.doc(`staffAccess/${uid}`).set(access); await expect(history.orderHistory.run(req({ orderId }))).rejects.toMatchObject({ code: "permission-denied" }); });
it("READ026 valid OWNER retains foreign document and order reads", async () => { expect((await invoices.invoiceDetail.run(req({ id: documentId }))).id).toBe(documentId); expect((await history.orderHistory.run(req({ orderId }))).order?.ownerId).toBe(customer); expect((await invoices.invoiceList.run(req({ orderId }))).canIssue).toBe(true); });
it("READ026 ordinary customer issued document still readable without staff access", async () => { await db.doc(`staffAccess/${uid}`).delete(); expect((await invoices.invoiceDetail.run(req({ id: ownId }))).id).toBe(ownId); });
afterAll(async () => { await db.terminate(); await deleteApp(getApp()); });

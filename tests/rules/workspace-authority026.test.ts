import { initializeApp, getApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { beforeAll, beforeEach, afterAll, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import type { CallableRequest } from "firebase-functions/v2/https";
let db: ReturnType<typeof getFirestore>, api: typeof import("../../functions/src/workspace");
const prefix = `work026-${randomUUID()}`, uid = `${prefix}-reader`, customer = `${prefix}-customer`, target = `${prefix}-target`, orderId = `${prefix}-order`, ticketId = `${prefix}-ticket`;
const ticket = { ownerId: customer, subject: "Synthetic support", version: 1, status: "open" };
function req(data: unknown) { return { auth: { uid, token: { email_verified: true, firebase: { sign_in_provider: "google.com" } } }, data } as CallableRequest; }
beforeAll(async () => { initializeApp({ projectId: `demo-satsunicgo-work-${randomUUID().slice(0,8)}` }); db = getFirestore(); api = await import("../../functions/src/workspace"); });
beforeEach(async () => { await Promise.all([db.doc(`users/${uid}`).set({ locked: false }), db.doc(`staffAccess/${uid}`).set({ active: true, roles: ["OWNER"] }), db.doc(`staffAccess/${target}`).set({ active: true, roles: ["SUPPORT"], version: 1 }), db.doc(`orders/${orderId}`).set({ ownerId: customer, version: 1 }), db.doc(`orderOperations/${orderId}`).set({ recipient: { recipient: "Synthetic recipient" }, receive: { quantity: 1, condition: "accepted" }, changedAt: 1 }), db.doc(`supportTickets/${ticketId}`).set(ticket)]); });
const malformed = [
  { label: "stringactive", access: { active: "false", roles: ["OWNER"] } },
  { label: "numericactive", access: { active: 1, roles: ["OWNER"] } },
  { label: "stringroles", access: { active: true, roles: "NOT_OWNER" } },
  { label: "objectroles", access: { active: true, roles: { OWNER: true } } },
];
it.each(malformed)("WORK026 malformed $label cannot read owner configuration", async ({ access }) => { await db.doc(`staffAccess/${uid}`).set(access); await expect(api.readOwnerConfiguration.run(req({}))).rejects.toMatchObject({ code: "permission-denied" }); });
it.each(malformed)("WORK026 malformed $label cannot read staff access", async ({ access }) => { await db.doc(`staffAccess/${uid}`).set(access); await expect(api.readStaffAccess.run(req({ id: target }))).rejects.toMatchObject({ code: "permission-denied" }); });
it.each(malformed)("WORK026 malformed $label cannot read private order operations", async ({ access }) => { await db.doc(`staffAccess/${uid}`).set(access); await expect(api.readOrderOperations.run(req({ orderId }))).rejects.toMatchObject({ code: "permission-denied" }); });
it.each(malformed)("WORK026 malformed $label cannot reply to foreign ticket or create operation", async ({ access }) => {
  await db.doc(`staffAccess/${uid}`).set(access); const operationId = randomUUID(), messages = db.doc(`supportTickets/${ticketId}`).collection("messages"), before = (await messages.get()).docs.map(d => d.id).sort();
  await expect(api.workspaceCommand.run(req({ action: "replyTicket", id: ticketId, operationId, expectedVersion: 1, payload: { message: "Synthetic reply", status: "open" } }))).rejects.toMatchObject({ code: "permission-denied" });
  expect((await db.doc(`supportTickets/${ticketId}`).get()).data()).toEqual(ticket);
  expect((await messages.get()).docs.map(d => d.id).sort()).toEqual(before);
  expect((await db.doc(`idempotencyKeys/${uid}-${operationId}`).get()).exists).toBe(false);
});
it.each([`prefix-${orderId}-suffix`, { [orderId]: true }])("WORK026 malformed BUYER assignment denies receiving data", async (orderIds) => { await db.doc(`staffAccess/${uid}`).set({ active: true, roles: ["BUYER"], orderIds }); await expect(api.readOrderOperations.run(req({ orderId }))).rejects.toMatchObject({ code: "permission-denied" }); });
it("WORK026 valid OWNER retains configuration/staff/private operations and reply replay", async () => {
  expect(await api.readOwnerConfiguration.run(req({}))).toHaveProperty("pricing");
  expect((await api.readStaffAccess.run(req({ id: target }))).access?.roles).toEqual(["SUPPORT"]);
  expect((await api.readOrderOperations.run(req({ orderId }))).recipient).toEqual({ recipient: "Synthetic recipient" });
  const d = { action: "replyTicket", id: ticketId, operationId: randomUUID(), expectedVersion: 1, payload: { message: "Synthetic reply", status: "open" } };
  const result = await api.workspaceCommand.run(req(d)); expect(result.version).toBe(2); expect(await api.workspaceCommand.run(req(d))).toEqual(result);
});
it("WORK026 exact assigned BUYER reads receiving but no recipient", async () => { await db.doc(`staffAccess/${uid}`).set({ active: true, roles: ["BUYER"], orderIds: [orderId] }); const result = await api.readOrderOperations.run(req({ orderId })); expect(result.recipient).toBeNull(); expect(result.receiving?.quantity).toBe(1); });
afterAll(async () => { await db.terminate(); await deleteApp(getApp()); });

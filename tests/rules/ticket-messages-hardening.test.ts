import { initializeApp, getApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { beforeAll, beforeEach, afterAll, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import type { CallableRequest } from "firebase-functions/v2/https";
let db: ReturnType<typeof getFirestore>, api: typeof import("../../functions/src/workspace");
const prefix = `ticket026-${randomUUID()}`, owner = `${prefix}-owner`, reader = `${prefix}-reader`, ticketId = `${prefix}-ticket`;
function req(uid: string) { return { auth: { uid, token: { email_verified: true, firebase: { sign_in_provider: "google.com" } } }, data: { id: ticketId } } as CallableRequest; }
beforeAll(async () => {
  initializeApp({ projectId: `demo-satsunicgo-ticket-${randomUUID().slice(0,8)}` }); db = getFirestore(); api = await import("../../functions/src/workspace");
  await db.doc(`supportTickets/${ticketId}`).set({ ownerId: owner, subject: "Synthetic support", status: "open", version: 1 });
  await db.doc(`supportTickets/${ticketId}/messages/fixture`).set({ text: "Synthetic private message", authorId: owner, createdAt: 1 });
});
beforeEach(async () => { await Promise.all([db.doc(`users/${owner}`).set({ locked: false }), db.doc(`users/${reader}`).set({ locked: false }), db.doc(`staffAccess/${reader}`).set({ active: true, roles: ["SUPPORT"] }), db.doc(`staffAccess/${owner}`).delete()]); });
it.each([
  { label: "stringactive", access: { active: "false", roles: ["SUPPORT"] } },
  { label: "numericactive", access: { active: 1, roles: ["SUPPORT"] } },
  { label: "stringroles", access: { active: true, roles: "SUPPORT" } },
  { label: "objectroles", access: { active: true, roles: { SUPPORT: true } } },
])("TICKET026 malformed foreign authority $label denies without returning private messages", async ({ access }) => {
  await db.doc(`staffAccess/${reader}`).set(access);
  await expect(api.ticketMessages.run(req(reader))).rejects.toMatchObject({ code: "permission-denied" });
  expect((await db.doc(`supportTickets/${ticketId}`).get()).data()).toMatchObject({ version: 1, ownerId: owner });
});
it("TICKET026 customer owner and valid SUPPORT retain reads with exact message meaning", async () => {
  for (const uid of [owner, reader]) {
    const result = await api.ticketMessages.run(req(uid));
    expect(result.messages).toEqual([{ id: "fixture", text: "Synthetic private message", createdAt: 1, fromCustomer: true }]);
  }
});
it.each(["user", "staff"])("TICKET026 current %s lock overrides valid support authority", async (kind) => {
  await db.doc(`${kind === "user" ? "users" : "staffAccess"}/${reader}`).update({ locked: true });
  await expect(api.ticketMessages.run(req(reader))).rejects.toMatchObject({ code: "permission-denied" });
});
afterAll(async () => { await db.terminate(); await deleteApp(getApp()); });

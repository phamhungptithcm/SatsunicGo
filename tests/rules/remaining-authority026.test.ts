import { initializeApp, getApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { beforeAll, beforeEach, afterAll, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import type { CallableRequest } from "firebase-functions/v2/https";
let db: ReturnType<typeof getFirestore>;
let changes: typeof import("../../functions/src/changes"), media: typeof import("../../functions/src/media"), invoices: typeof import("../../functions/src/invoices"), membership: typeof import("../../functions/src/membership"), shipping: typeof import("../../functions/src/shipping");
const prefix = `remaining026-${randomUUID()}`, uid = `${prefix}-staff`, owner = `${prefix}-customer`, orderId = `${prefix}-order`, parcelId = `${prefix}-parcel`, planId = `${prefix}-plan`;
const order = { id: orderId, ownerId: owner, version: 1, acceptedAt: 1, market: "JP", stage: "IN_TRANSIT", quote: { termsVersion: "synthetic-v1" }, items: [{ name: "Synthetic item", quantity: 2 }], collected: 100, refunded: 0 };
const parcel = { id: parcelId, version: 1, state: "in_transit", allocations: [{ orderId, line: 0, quantity: 1 }], route: "Synthetic route", warehouse: "Synthetic warehouse" };
function req(data: unknown) { return { auth: { uid, token: { email_verified: true, firebase: { sign_in_provider: "google.com" } } }, data } as CallableRequest; }
beforeAll(async () => { initializeApp({ projectId: `demo-satsunicgo-rem-${randomUUID().slice(0,8)}` }); db = getFirestore(); changes = await import("../../functions/src/changes"); media = await import("../../functions/src/media"); invoices = await import("../../functions/src/invoices"); membership = await import("../../functions/src/membership"); shipping = await import("../../functions/src/shipping"); });
beforeEach(async () => { await Promise.all([db.doc(`users/${uid}`).set({ locked: false }), db.doc(`users/${owner}`).set({ locked: false }), db.doc(`staffAccess/${uid}`).set({ active: true, roles: ["OWNER"] }), db.doc(`orders/${orderId}`).set(order), db.doc(`packages/${parcelId}`).set(parcel), db.doc(`packageAllocations/${orderId}`).set({ allocations: parcel.allocations, parcelIds: [parcelId] }), db.doc(`membershipPlans/${planId}`).set({ status: "published", name: "Synthetic plan", price: 100, periodDays: 30 }), db.doc(`membershipSubscriptions/${owner}`).delete(), db.doc("settings/invoiceSeller").set({ version: 1, seller: { name: "Synthetic seller", address: "Synthetic address", contact: "Synthetic contact" } })]); });
const malformed = [
 { label: "stringactive", access: { active: "false", roles: ["OWNER"] } },
 { label: "numericactive", access: { active: 1, roles: ["OWNER"] } },
 { label: "stringroles", access: { active: true, roles: "NOT_OWNER" } },
 { label: "objectroles", access: { active: true, roles: { OWNER: true } } },
];
const boundaries = ["changes", "media", "invoice", "membership", "shipping"] as const;
type Boundary = typeof boundaries[number];
function input(b: Boundary, operationId: string) {
 if (b === "changes") return { action: "propose", orderId, proposalId: randomUUID(), expectedVersion: 1, operationId, payload: { kind: "return", reason: "Synthetic return review", termsVersion: "synthetic-v1", lines: [{ line: 0, cancelQuantity: 1 }], finalPayable: 100, actualCosts: 0, evidence: "Synthetic evidence" } };
 if (b === "media") return { mime: "image/png", base64: "AA==", alt: "Synthetic image", rightsConfirmed: true };
 if (b === "invoice") return { action: "configure", operationId, expectedVersion: 1, seller: { name: "Synthetic updated seller", address: "Synthetic address", contact: "Synthetic contact" } };
 if (b === "membership") return { action: "grant", operationId, planId, ownerId: owner, reason: "Synthetic grant" };
 return { action: "trackParcel", operationId, parcelId, expectedVersion: 1, orderVersions: { [orderId]: 1 }, payload: { state: "in_transit", event: "Synthetic tracking event" } };
}
async function invoke(b: Boundary, data: unknown) {
 if (b === "changes") return changes.changeCommand.run(req(data));
 if (b === "media") return media.uploadContentImage.run(req(data));
 if (b === "invoice") return invoices.invoiceCommand.run(req(data));
 if (b === "membership") return membership.membershipCommand.run(req(data));
 return shipping.shippingCommand.run(req(data));
}
for (const b of boundaries) {
 it.each(malformed)(`REM026 ${b} denies $label before effects`, async ({ access }) => {
  await db.doc(`staffAccess/${uid}`).set(access); const operationId = randomUUID();
  const config = (await db.doc("settings/invoiceSeller").get()).data();
  const collections = ["financialEntries", "outboxJobs", "contentMedia", "orderChanges", "membershipHistory"];
  const baseline = await Promise.all(collections.map(async c => (await db.collection(c).get()).docs.map(d => d.id).sort()));
  await expect(invoke(b, input(b, operationId))).rejects.toMatchObject({ code: "permission-denied" });
  expect((await db.doc(`orders/${orderId}`).get()).data()).toEqual(order);
  expect((await db.doc(`packages/${parcelId}`).get()).data()).toEqual(parcel);
  expect((await db.doc("settings/invoiceSeller").get()).data()).toEqual(config);
  expect((await db.doc(`membershipSubscriptions/${owner}`).get()).exists).toBe(false);
  expect((await db.doc(`idempotencyKeys/${uid}-${operationId}`).get()).exists).toBe(false);
  expect(await Promise.all(collections.map(async c => (await db.collection(c).get()).docs.map(d => d.id).sort()))).toEqual(baseline);
 });
 it(`REM026 valid OWNER ${b} control preserves native boundary`, async () => {
  const data = input(b, randomUUID());
  if (b === "media") { await expect(invoke(b, data)).rejects.toMatchObject({ code: "invalid-argument" }); return; }
  const result = await invoke(b, data); expect(await invoke(b, data)).toEqual(result);
  if (b === "changes") expect((await db.doc(`orders/${orderId}`).get()).data()?.version).toBe(2);
  if (b === "invoice") expect((await db.doc("settings/invoiceSeller").get()).data()?.version).toBe(2);
  if (b === "membership") expect((await db.doc(`membershipSubscriptions/${owner}`).get()).data()?.state).toBe("active");
  if (b === "shipping") expect((await db.doc(`packages/${parcelId}`).get()).data()?.version).toBe(2);
 });
}
afterAll(async () => { await db.terminate(); await deleteApp(getApp()); });

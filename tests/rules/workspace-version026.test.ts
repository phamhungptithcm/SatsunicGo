import { initializeApp, getApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { beforeAll, beforeEach, afterAll, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import type { CallableRequest } from "firebase-functions/v2/https";
let db: ReturnType<typeof getFirestore>, api: typeof import("../../functions/src/workspace");
const prefix = `version026-${randomUUID()}`, uid = `${prefix}-owner`, target = `${prefix}-target`, postId = `${prefix}-post`;
const boundaries = ["staff", "content", "profile"] as const;
type Boundary = typeof boundaries[number];
function path(b: Boundary) { return b === "staff" ? `staffAccess/${target}` : b === "content" ? `posts/${postId}` : `users/${uid}`; }
function stored(b: Boundary) { return b === "staff" ? { active: true, roles: ["SUPPORT"] } : b === "content" ? { title: "Synthetic previous", slug: postId, body: "Synthetic content body", status: "draft" } : { ownerId: uid, locked: false, displayName: "Synthetic previous", marketingConsent: false }; }
function input(b: Boundary, expectedVersion?: number) {
 const common = { operationId: randomUUID(), ...(expectedVersion === undefined ? {} : { expectedVersion }) };
 if (b === "staff") return { ...common, action: "saveStaffAccess", id: target, payload: { active: true, locked: false, roles: ["SUPPORT"], orderIds: [] } };
 if (b === "content") return { ...common, action: "saveContent", id: postId, payload: { kind: "posts", content: { title: "Synthetic updated", slug: postId, body: "Synthetic updated content", status: "draft" } } };
 return { ...common, action: "saveProfile", payload: { displayName: "Synthetic updated", businessName: "", marketingConsent: false } };
}
function invoke(data: unknown) { return api.workspaceCommand.run({ auth: { uid, token: { email_verified: true, firebase: { sign_in_provider: "google.com" } } }, data } as CallableRequest); }
beforeAll(async () => { initializeApp({ projectId: `demo-satsunicgo-ver-${randomUUID().slice(0,8)}` }); db = getFirestore(); api = await import("../../functions/src/workspace"); });
beforeEach(async () => { await Promise.all([db.doc(`users/${uid}`).set(stored("profile")), db.doc(`staffAccess/${uid}`).set({ active: true, roles: ["OWNER"] }), db.doc(path("staff")).set(stored("staff")), db.doc(path("content")).set(stored("content"))]); });
for (const b of boundaries) {
 it.each([
  { label: "exhausted stored version", version: Number.MAX_SAFE_INTEGER, expectedVersion: Number.MAX_SAFE_INTEGER, code: "aborted" },
  { label: "unsafe input rejected by schema", version: Number.MAX_SAFE_INTEGER + 1, expectedVersion: Number.MAX_SAFE_INTEGER + 1, code: "invalid-argument" },
  { label: "null stored version rejected by existing CAS", version: null, expectedVersion: undefined, code: "aborted" },
  { label: "negative stored version rejected by existing CAS", version: -1, expectedVersion: 0, code: "aborted" },
  { label: "fractional stored version rejected by existing CAS", version: 1.5, expectedVersion: 1, code: "aborted" },
 ])(`VER026 ${b} $label without effects`, async ({ version, expectedVersion, code }) => {
  const ref = db.doc(path(b)), old = { ...stored(b), version }; await ref.set(old);
  const data = input(b, expectedVersion), auditBefore = (await db.collection("auditEvents").get()).docs.map(d => d.id).sort(), versionsBefore = (await ref.collection("versions").get()).docs.map(d => d.id).sort(), consentsBefore = (await ref.collection("consents").get()).docs.map(d => d.id).sort(), slugBefore = (await db.doc(`contentSlugs/posts-${postId}`).get()).data();
  await expect(invoke(data)).rejects.toMatchObject({ code });
  expect((await ref.get()).data()).toEqual(old);
  expect((await db.doc(`idempotencyKeys/${uid}-${data.operationId}`).get()).exists).toBe(false);
  expect((await db.collection("auditEvents").get()).docs.map(d => d.id).sort()).toEqual(auditBefore);
  expect((await ref.collection("versions").get()).docs.map(d => d.id).sort()).toEqual(versionsBefore);
  expect((await ref.collection("consents").get()).docs.map(d => d.id).sort()).toEqual(consentsBefore);
  expect((await db.doc(`contentSlugs/posts-${postId}`).get()).data()).toEqual(slugBefore);
 });
 it(`VER026 ${b} last safe increment and completed replay survive exhaustion`, async () => {
  const ref = db.doc(path(b)); await ref.set({ ...stored(b), version: Number.MAX_SAFE_INTEGER - 1 });
  const data = input(b, Number.MAX_SAFE_INTEGER - 1), result = await invoke(data);
  expect(result.version).toBe(Number.MAX_SAFE_INTEGER); expect((await ref.get()).data()?.version).toBe(Number.MAX_SAFE_INTEGER);
  expect(await invoke(data)).toEqual(result);
 });
 it(`VER026 ${b} legacy undefined version permits omitted CAS and replay`, async () => {
  const ref = db.doc(path(b)); await ref.set(stored(b)); const data = input(b), result = await invoke(data);
  expect(result.version).toBe(1); expect((await ref.get()).data()?.version).toBe(1); expect(await invoke(data)).toEqual(result);
 });
}
afterAll(async () => { await db.terminate(); await deleteApp(getApp()); });

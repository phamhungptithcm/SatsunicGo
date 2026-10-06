import { getFirestore } from "firebase-admin/firestore";
import { deleteApp, getApp } from "firebase-admin/app";
import { beforeAll, afterAll, expect, it } from "vitest";
import { createHash, randomUUID } from "node:crypto";
import type { CallableRequest } from "firebase-functions/v2/https";
import { conversationActionSchema } from "../../packages/domain/ask-workflow";
let db: ReturnType<typeof getFirestore>, workflow: typeof import("../../functions/src/ai/ask-workflow").askWorkflow;
const uid = `ask026-${randomUUID()}`;
function req(data: unknown) { return { auth: { uid, token: { email_verified: true, firebase: { sign_in_provider: "google.com" } } }, data } as CallableRequest; }
beforeAll(async () => { ({ askWorkflow: workflow } = await import("../../functions/src/index")); db = getFirestore(); });
it("ASK026 optional answer followup and draft fields redact private details without losing shopping intent", async () => {
  const conversationId = randomUUID(), operationId = randomUUID();
  const draft = { market: "US", items: [{ name: "Synthetic shoes", quantity: 2, variant: "Large", url: "" }], notes: "email fixture@example.invalid", preferredStore: "address: Synthetic private address" };
  const data = { conversationId, operationId, expectedVersion: 0, action: "saveTurn", payload: { id: randomUUID(), question: "Review shoes", answer: { language: "vi", title: "Synthetic", paragraphs: ["Review selection"], bullets: [], sourceIds: [], action: "request", followUp: "email fixture@example.invalid", draft, shoppingDraft: draft } } };
  expect(await workflow.run(req(data))).toEqual({ version: 1 });
  expect(await workflow.run(req(data))).toEqual({ version: 1 });
  const stored = (await db.doc(`askConversations/${uid}-${conversationId}`).get()).data()!, answer = stored.turns[0].answer;
  expect(answer.followUp).not.toContain("fixture@example.invalid");
  for (const field of ["draft", "shoppingDraft"]) {
    expect(answer[field].notes).not.toContain("fixture@example.invalid");
    expect(answer[field].preferredStore).not.toContain("Synthetic private address");
    expect(answer[field]).toMatchObject({ market: "US", items: [{ name: "Synthetic shoes", quantity: 2, variant: "Large", url: "" }] });
  }
  expect(stored.version).toBe(1);
  expect(stored.turns).toHaveLength(1);
});
it.each([
  { action: "saveDraft", version: Number.MAX_SAFE_INTEGER },
  { action: "submitRequest", version: Number.MAX_SAFE_INTEGER - 1 },
])("ASK026 exhausted version rejects $action before conversation/order/op writes", async ({ action, version }) => {
  const conversationId = randomUUID(), operationId = randomUUID();
  const ref = db.doc(`askConversations/${uid}-${conversationId}`);
  const stored = { ownerId: uid, version, turns: [], updatedAt: Date.now() };
  await ref.set(stored);
  const orders = db.collection("orders").where("ownerId", "==", uid);
  const before = (await orders.get()).docs.map((d) => d.id).sort();
  await expect(workflow.run(req({ conversationId, operationId, expectedVersion: version, action, payload: { market: "US", items: [{ name: "Synthetic shoes", quantity: 1, variant: "Large", url: "" }], notes: "Synthetic only" } }))).rejects.toMatchObject({ code: "aborted" });
  expect((await ref.get()).data()).toEqual(stored);
  expect((await ref.collection("operations").doc(operationId).get()).exists).toBe(false);
  expect((await orders.get()).docs.map((d) => d.id).sort()).toEqual(before);
});
it.each([
  { action: "saveDraft", version: Number.MAX_SAFE_INTEGER - 1 },
  { action: "submitRequest", version: Number.MAX_SAFE_INTEGER - 2 },
])("ASK026 final safe $action increment and completed replay remain valid", async ({ action, version }) => {
  const conversationId = randomUUID(), operationId = randomUUID();
  const ref = db.doc(`askConversations/${uid}-${conversationId}`);
  await ref.set({ ownerId: uid, version, turns: [], updatedAt: Date.now() });
  const d = { conversationId, operationId, expectedVersion: version, action, payload: { market: "US", items: [{ name: "Synthetic shoes", quantity: 1, variant: "Large", url: "" }], notes: "Synthetic only" } };
  const result = await workflow.run(req(d));
  expect(result.version).toBe(Number.MAX_SAFE_INTEGER);
  expect(await workflow.run(req(d))).toEqual(result);
  expect((await ref.get()).data()?.version).toBe(Number.MAX_SAFE_INTEGER);
});
it("ASK026 legacy pending finalization rejects overflow while retaining committed order and recovery identity", async () => {
  const conversationId = randomUUID(), operationId = randomUUID();
  const payload = { market: "US", items: [{ name: "Synthetic shoes", quantity: 1, variant: "Large", url: "" }], notes: "Synthetic only" };
  const data = { conversationId, operationId, expectedVersion: Number.MAX_SAFE_INTEGER - 1, action: "submitRequest", payload };
  const { command } = await import("../../functions/src/index");
  const selected = conversationActionSchema.parse({ action: "submitRequest", payload });
  const committed = await command.run(req({ action: selected.action, operationId, payload: selected.payload }));
  const orderRef = db.doc(`orders/${committed.id}`), orderBefore = (await orderRef.get()).data();
  const ref = db.doc(`askConversations/${uid}-${conversationId}`), op = ref.collection("operations").doc(operationId);
  const conversation = { ownerId: uid, version: Number.MAX_SAFE_INTEGER, turns: [], updatedAt: Date.now(), pendingOperation: operationId };
  const operation = { hash: createHash("sha256").update(JSON.stringify(data)).digest("hex"), action: "submitRequest", state: "pending", request: data, createdAt: Date.now() };
  await Promise.all([ref.set(conversation), op.set(operation)]);
  await expect(workflow.run(req(data))).rejects.toMatchObject({ code: "aborted" });
  expect((await ref.get()).data()).toEqual(conversation);
  expect((await op.get()).data()).toEqual(operation);
  expect((await orderRef.get()).data()).toEqual(orderBefore);
});
afterAll(async () => { await db.terminate(); await deleteApp(getApp()); });

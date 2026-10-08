import { afterAll, beforeAll, expect, test } from "vitest";
import { randomUUID } from "node:crypto";
import { getFirestore } from "firebase-admin/firestore";
import type { CallableRequest } from "firebase-functions/v2/https";
let workflow: typeof import("../../functions/src/ai/ask-workflow").askWorkflow;
let db: ReturnType<typeof getFirestore>;
const allocated = new Set<string>();
const draft = {
  market: "US",
  items: [
    {
      name: "Synthetic platform item",
      quantity: 1,
      variant: "Synthetic",
      url: "",
    },
  ],
  notes: "Synthetic test only",
};
function context() {
  const uid = `ask-platform-${randomUUID()}`,
    conversationId = randomUUID();
  allocated.add(`askConversations/${uid}-${conversationId}`);
  allocated.add(`askCurrent/${uid}`);
  allocated.add(`users/${uid}`);
  return { uid, conversationId };
}
function request(uid: string, data: unknown) {
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
function data(
  conversationId: string,
  action = "saveDraft",
  expectedVersion = 0,
) {
  return {
    conversationId,
    operationId: randomUUID(),
    expectedVersion,
    action,
    payload: draft,
  };
}
beforeAll(async () => {
  ({ askWorkflow: workflow } = await import("../../functions/src/index"));
  db = getFirestore();
});
afterAll(async () => {
  for (const path of allocated) await db.recursiveDelete(db.doc(path));
  await db.terminate();
});
test("happy: duplicate draft retries persist once, preserve operation identity and resume", async () => {
  const { uid, conversationId } = context(),
    command = data(conversationId);
  const [first, second] = await Promise.all([
    workflow.run(request(uid, command)),
    workflow.run(request(uid, command)),
  ]);
  expect(first).toEqual({ version: 1 });
  expect(second).toEqual(first);
  const result = await workflow.run(
    request(uid, {
      ...command,
      action: "resume",
      payload: { operationId: command.operationId },
    }),
  );
  expect(result).toEqual(first);
  const stored = (
    await db.doc(`askConversations/${uid}-${conversationId}`).get()
  ).data()!;
  expect(stored.version).toBe(1);
  expect(stored.draft).toEqual(draft);
});
test("bad: stale version and tampered retry cannot overwrite a reviewed draft", async () => {
  const { uid, conversationId } = context(),
    command = data(conversationId);
  await workflow.run(request(uid, command));
  await expect(
    workflow.run(
      request(uid, { ...command, payload: { ...draft, notes: "Changed" } }),
    ),
  ).rejects.toMatchObject({ code: "already-exists" });
  const stale = { ...command, operationId: randomUUID() };
  await expect(workflow.run(request(uid, stale))).rejects.toMatchObject({
    code: "aborted",
  });
  const ref = db.doc(`askConversations/${uid}-${conversationId}`);
  expect((await ref.get()).data()?.draft).toEqual(draft);
  expect(
    (await ref.collection("operations").doc(stale.operationId).get()).exists,
  ).toBe(false);
});
test("bad: anonymous, password-provider, locked and mismatched owner are denied", async () => {
  const { uid, conversationId } = context(),
    command = data(conversationId);
  await expect(
    workflow.run({ data: command } as CallableRequest),
  ).rejects.toMatchObject({ code: "unauthenticated" });
  const wrong = request(uid, command);
  wrong.auth!.token.firebase = { sign_in_provider: "password", identities: {} };
  await expect(workflow.run(wrong)).rejects.toMatchObject({
    code: "permission-denied",
  });
  await db.doc(`users/${uid}`).set({ locked: true });
  await expect(workflow.run(request(uid, command))).rejects.toMatchObject({
    code: "permission-denied",
  });
  await db.doc(`users/${uid}`).set({ locked: false });
  await db
    .doc(`askConversations/${uid}-${conversationId}`)
    .set({ ownerId: `other-${randomUUID()}`, version: 0, turns: [] });
  await expect(workflow.run(request(uid, command))).rejects.toMatchObject({
    code: "permission-denied",
  });
});
test.each([
  "refund",
  "verifyTransfer",
  "publish",
  "grantMembership",
  "changeRole",
])("bad: chat cannot execute privileged action %s", async (action) => {
  const { uid, conversationId } = context();
  await expect(
    workflow.run(request(uid, data(conversationId, action))),
  ).rejects.toMatchObject({ code: "invalid-argument" });
  expect(
    (await db.doc(`askConversations/${uid}-${conversationId}`).get()).exists,
  ).toBe(false);
});

test("bad: completed recovery still checks account lock and rejects corrupt stored results", async () => {
  const { uid, conversationId } = context(),
    command = data(conversationId);
  await workflow.run(request(uid, command));
  const recovery = {
    ...command,
    action: "resume",
    payload: { operationId: command.operationId },
  };
  await db.doc(`users/${uid}`).set({ locked: true });
  await expect(workflow.run(request(uid, recovery))).rejects.toMatchObject({
    code: "permission-denied",
  });
  await db.doc(`users/${uid}`).set({ locked: false });
  for (const result of [
    { version: -1 },
    { version: 999 },
    { version: 1, id: "foreign-order" },
  ]) {
    await db
      .doc(
        `askConversations/${uid}-${conversationId}/operations/${command.operationId}`,
      )
      .update({ result });
    await expect(workflow.run(request(uid, recovery))).rejects.toMatchObject({
      code: "failed-precondition",
    });
  }
});

test("happy: confirmed custom submission recovers completed result without duplicate order or false payment", async () => {
  const { uid, conversationId } = context();
  await workflow.run(request(uid, data(conversationId)));
  const submit = data(conversationId, "submitRequest", 1);
  allocated.add(`idempotencyKeys/${uid}-${submit.operationId}`);
  const result = await workflow.run(request(uid, submit));
  expect(result.id).toBeTruthy();
  allocated.add(`orders/${result.id}`);
  const replay = await workflow.run(
    request(uid, {
      ...submit,
      action: "resume",
      payload: { operationId: submit.operationId },
    }),
  );
  expect(replay).toEqual(result);
  const orders = await db
    .collection("orders")
    .where("ownerId", "==", uid)
    .get();
  expect(orders.size).toBe(1);
  expect(orders.docs[0].data()).toMatchObject({
    ownerId: uid,
    stage: "REQUESTED",
    collected: 0,
  });
});

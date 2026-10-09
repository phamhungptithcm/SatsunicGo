import { customerChatAction } from "../../packages/domain/chat-action";
import { chatDraftChange } from "../../packages/domain/chat-draft";
import { catalogChatAction } from "../../packages/domain/catalog-chat";
import { admitAskCommandResult } from "../../packages/domain/ask-command-result";
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

test("chat compound edit and natural submission execute real draft/order handlers once without payment", async () => {
  const { uid, conversationId } = context();
  const initial = { ...draft, items: [{ ...draft.items[0], quantity: 1 }] };
  await workflow.run(
    request(uid, { ...data(conversationId), payload: initial }),
  );
  const edit = chatDraftChange(
    "mình lấy 2 cái, size M, mua từ Nhật nhé",
    initial,
  );
  if (edit?.kind !== "updated") throw Error("Expected explicit edit");
  await workflow.run(
    request(uid, {
      ...data(conversationId, "saveDraft", 1),
      payload: edit.draft,
    }),
  );
  const action = customerChatAction(
    "mình gửi yêu cầu mua hộ nhé",
    null,
    edit.draft,
  );
  expect(action).toBe("submitRequest");
  const submit = { ...data(conversationId, action!, 2), payload: edit.draft };
  allocated.add(`idempotencyKeys/${uid}-${submit.operationId}`);
  const [result, replay] = await Promise.all([
    workflow.run(request(uid, submit)),
    workflow.run(request(uid, submit)),
  ]);
  expect(replay).toEqual(result);
  allocated.add(`orders/${result.id}`);
  const orders = await db
    .collection("orders")
    .where("ownerId", "==", uid)
    .get();
  expect(orders.size).toBe(1);
  expect(orders.docs[0].data()).toMatchObject({
    stage: "REQUESTED",
    collected: 0,
    market: "JP",
    items: [{ quantity: 2, variant: "M" }],
  });
  expect(orders.docs[0].data().quote).toBeUndefined();
});

test("actual handler rejects research amount masquerading as final price without creating an order", async () => {
  const { uid, conversationId } = context();
  await workflow.run(request(uid, data(conversationId)));
  for (const fields of [
    { goods: 500000 },
    { collected: 500000 },
    { researchPrice: 500000 },
    { reviewRating: 4.9 },
  ])
    await expect(
      workflow.run(
        request(uid, {
          ...data(conversationId, "submitRequest", 1),
          payload: { ...draft, ...fields },
        }),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  expect(
    (await db.collection("orders").where("ownerId", "==", uid).get()).empty,
  ).toBe(true);
  expect(
    (await db.doc(`askConversations/${uid}-${conversationId}`).get()).data()
      ?.version,
  ).toBe(1);
});

test("catalog chat uses authoritative price, creates once on replay and validates client completion", async () => {
  const { uid, conversationId } = context(),
    productId = `ask-catalog-${randomUUID()}`;
  const product = {
    id: productId,
    title: "Synthetic chat catalog",
    slug: productId,
    status: "published",
    market: "JP",
    version: 3,
    orderable: true,
    listedPrice: 200000,
    termsVersion: "synthetic-v1",
    catalogOptions: ["Blue", "Red"],
  };
  allocated.add(`products/${productId}`);
  await db.doc(`products/${productId}`).set(product);
  const initial = await workflow.run(
    request(uid, { ...data(conversationId), payload: {} }),
  );
  expect(
    admitAskCommandResult(initial, { action: "saveDraft", expectedVersion: 0 })
      .version,
  ).toBe(1);
  const scope = { ownerId: uid, conversationId },
    now = Date.now(),
    source = { ...scope, createdAt: now, stale: false, rows: [product] };
  const choice = catalogChatAction(
    "chọn sản phẩm số 1",
    source,
    null,
    scope,
    now,
  );
  if (choice?.kind !== "updated") throw Error("expected choice");
  const edit = catalogChatAction(
    "size Blue, số lượng 2",
    source,
    choice.choice,
    scope,
    now,
  );
  if (edit?.kind !== "updated") throw Error("expected edit");
  const confirm = catalogChatAction(
    "xác nhận lựa chọn và tạo đơn",
    source,
    edit.choice,
    scope,
    now,
  );
  if (confirm?.kind !== "confirm") throw Error("expected consent");
  const submit = {
    ...data(conversationId, "catalogCheckout", 1),
    payload: confirm.selection,
  };
  allocated.add(`idempotencyKeys/${uid}-${submit.operationId}`);
  const [result, replay] = await Promise.all([
    workflow.run(request(uid, submit)),
    workflow.run(request(uid, submit)),
  ]);
  expect(replay).toEqual(result);
  expect(
    admitAskCommandResult(result, {
      action: "catalogCheckout",
      expectedVersion: 1,
    }),
  ).toEqual(result);
  allocated.add(`orders/${result.id}`);
  for (const [kind, key] of [
    ["auditEvents", "resourceId"],
    ["outboxJobs", "orderId"],
  ] as const) {
    const owned = await db.collection(kind).where(key, "==", result.id).get();
    for (const row of owned.docs) allocated.add(row.ref.path);
  }
  const order = (await db.doc(`orders/${result.id}`).get()).data();
  expect(order).toMatchObject({
    ownerId: uid,
    purchaseKind: "catalog",
    stage: "QUOTE_ACCEPTED",
    collected: 0,
    finalTotal: 400000,
    catalogSnapshot: {
      productVersion: 3,
      variant: "Blue",
      quantity: 2,
      total: 400000,
    },
  });
  expect(
    (await db.collection("orders").where("ownerId", "==", uid).get()).size,
  ).toBe(1);
  expect(order?.quote).toBeUndefined();
  expect(order?.deposit).toBeUndefined();
  const recovered = await workflow.run(
    request(uid, {
      ...submit,
      action: "resume",
      payload: { operationId: submit.operationId },
    }),
  );
  expect(recovered).toEqual(result);
});

test("catalog chat old product version cannot create an order after a price change", async () => {
  const { uid, conversationId } = context(),
    productId = `ask-catalog-${randomUUID()}`;
  allocated.add(`products/${productId}`);
  await db
    .doc(`products/${productId}`)
    .set({
      title: "Synthetic changed price",
      slug: productId,
      status: "published",
      market: "JP",
      version: 4,
      orderable: true,
      listedPrice: 250000,
      termsVersion: "synthetic-v2",
      catalogOptions: ["Blue"],
    });
  await workflow.run(request(uid, { ...data(conversationId), payload: {} }));
  const input = {
    ...data(conversationId, "catalogCheckout", 1),
    payload: { productId, productVersion: 3, quantity: 2, variant: "Blue" },
  };
  allocated.add(`idempotencyKeys/${uid}-${input.operationId}`);
  await expect(workflow.run(request(uid, input))).rejects.toMatchObject({
    code: "aborted",
  });
  expect(
    (await db.collection("orders").where("ownerId", "==", uid).get()).empty,
  ).toBe(true);
});

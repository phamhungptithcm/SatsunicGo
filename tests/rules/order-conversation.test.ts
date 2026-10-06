import { beforeAll, afterAll, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { getFirestore } from "firebase-admin/firestore";
import { getApps, initializeApp } from "firebase-admin/app";
import {
  assertFails,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
import type { CallableRequest } from "firebase-functions/v2/https";
let read: typeof import("../../functions/src/order-conversation").readOrderConversation;
let command: typeof import("../../functions/src/order-conversation").orderConversationCommand;
let db: ReturnType<typeof getFirestore>;
const prefix = `conversation-${randomUUID()}`;
const orderId = `${prefix}-order`,
  customer = `${prefix}-customer`,
  staff = `${prefix}-support`,
  buyer = `${prefix}-buyer`,
  other = `${prefix}-other`;
function req(uid: string, data: unknown) {
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
function send(
  uid: string,
  action: "message" | "note" | "assign",
  expectedVersion: number,
  extra: Record<string, string>,
  operationId = randomUUID(),
) {
  return command.run(
    req(uid, { orderId, action, expectedVersion, operationId, ...extra }),
  );
}
beforeAll(async () => {
  process.env.FUNCTIONS_EMULATOR = "true";
  process.env.GCLOUD_PROJECT = "demo-satsunicgo";
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8181";
  if (!getApps().length) initializeApp({ projectId: "demo-satsunicgo" });
  ({ readOrderConversation: read, orderConversationCommand: command } =
    await import("../../functions/src/order-conversation"));
  db = getFirestore();
  await db.doc(`orders/${orderId}`).set({
    ownerId: customer,
    version: 7,
    collected: 10000,
    stage: "REQUESTED",
  });
  for (const [uid, roles] of [
    [staff, ["SUPPORT"]],
    [buyer, ["BUYER"]],
  ] as const) {
    await db
      .doc(`staffAccess/${uid}`)
      .set({ active: true, roles: [...roles], orderIds: [orderId] });
    await db.doc(`users/${uid}`).set({ displayName: "Nhân viên kiểm thử" });
  }
});
afterAll(async () => {
  if (!db) return;
  await db.recursiveDelete(db.doc(`orderConversations/${orderId}`));
  await db.doc(`orders/${orderId}`).delete();
  for (const uid of [staff, buyer, customer, other]) {
    await db.doc(`users/${uid}`).delete();
    await db.doc(`staffAccess/${uid}`).delete();
  }
  for (const kind of ["idempotencyKeys", "outboxJobs", "auditEvents"]) {
    const rows = await db.collection(kind).get();
    const own = rows.docs.filter(
      (d) => d.id.includes(prefix) || d.data().resourceId === orderId,
    );
    for (let i = 0; i < own.length; i += 400) {
      const batch = db.batch();
      own.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }
});

it("binds conversation to owner, isolates notes, checks retries and keeps financial/order data unchanged", async () => {
  const baseline = (await db.doc(`orders/${orderId}`).get()).data();
  await expect(read.run(req(other, { orderId }))).rejects.toMatchObject({
    code: "permission-denied",
  });
  const initial = await read.run(req(customer, { orderId }));
  expect(initial).toMatchObject({
    version: 0,
    staff: false,
    messages: [],
    notes: [],
    staffChoices: [],
    assignee: null,
  });
  await expect(
    send(customer, "note", 0, { text: "Private" }),
  ).rejects.toMatchObject({ code: "permission-denied" });
  await send(customer, "message", 0, { text: "Xin kiểm tra giúp sản phẩm" });
  const op = randomUUID();
  await send(staff, "message", 1, { text: "Mình đã nhận yêu cầu" }, op);
  await send(staff, "message", 1, { text: "Mình đã nhận yêu cầu" }, op);
  await expect(
    send(staff, "message", 1, { text: "Changed content" }, op),
  ).rejects.toMatchObject({ code: "already-exists" });
  await expect(
    send(staff, "message", 1, { text: "Stale" }),
  ).rejects.toMatchObject({ code: "aborted" });
  await send(staff, "note", 2, { text: "Chỉ nhân viên được xem ghi chú" });
  await send(staff, "assign", 3, { assigneeId: buyer });
  const privateView = await read.run(req(staff, { orderId }));
  expect(privateView.notes).toHaveLength(1);
  expect(privateView.assignee?.id).toBe(buyer);
  const publicView = await read.run(req(customer, { orderId }));
  expect(publicView.notes).toEqual([]);
  expect(publicView.assignee).toBeNull();
  expect(publicView.staffChoices).toEqual([]);
  expect(publicView.messages).toHaveLength(2);
  expect(publicView.messages.map((m) => m.fromCustomer)).toEqual([true, false]);
  const jobs = await db
    .collection("outboxJobs")
    .where("resourceId", "==", orderId)
    .get();
  expect(
    jobs.docs.filter((j) => j.data().action === "orderConversationReply"),
  ).toHaveLength(1);
  expect(
    jobs.docs.find((j) => j.data().action === "orderConversationReply")!.data(),
  ).toMatchObject({
    ownerId: customer,
    orderId,
    action: "orderConversationReply",
  });
  expect(
    jobs.docs.find((j) => j.data().action === "staffConversationUpdate")!.data()
      .ownerId,
  ).toBe(buyer);
  expect((await db.doc(`orders/${orderId}`).get()).data()).toEqual(baseline);
  expect(
    (
      await db
        .collection("financialEntries")
        .where("orderId", "==", orderId)
        .get()
    ).size,
  ).toBe(0);
  await db.doc(`staffAccess/${staff}`).update({ active: false });
  await expect(
    send(staff, "message", 1, { text: "Mình đã nhận yêu cầu" }, op),
  ).rejects.toMatchObject({ code: "permission-denied" });
  await db.doc(`staffAccess/${staff}`).update({ active: true });
});

it("checks assignment eligibility, locked users and concurrent versions", async () => {
  const version = (await read.run(req(staff, { orderId }))).version;
  await expect(
    send(staff, "assign", version, { assigneeId: other }),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  await db.doc(`staffAccess/${buyer}`).update({ orderIds: [] });
  await expect(read.run(req(buyer, { orderId }))).rejects.toMatchObject({
    code: "permission-denied",
  });
  await expect(
    send(staff, "assign", version, { assigneeId: buyer }),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  await db.doc(`users/${customer}`).set({ locked: true });
  await expect(read.run(req(customer, { orderId }))).rejects.toMatchObject({
    code: "permission-denied",
  });
  await db.doc(`users/${customer}`).set({ locked: false });
  const results = await Promise.allSettled([
    send(staff, "note", version, { text: "Note A" }),
    send(staff, "note", version, { text: "Note B" }),
  ]);
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
});

it("notifies the current eligible assignee on customer reply and bounds history", async () => {
  await db.doc(`staffAccess/${buyer}`).update({ orderIds: [orderId] });
  const version = (await read.run(req(customer, { orderId }))).version;
  const operationId = randomUUID();
  await send(
    customer,
    "message",
    version,
    { text: "Phản hồi sau khi bàn giao" },
    operationId,
  );
  expect(
    (
      await db
        .doc(`outboxJobs/conversation-staff-${customer}-${operationId}`)
        .get()
    ).data(),
  ).toMatchObject({ ownerId: buyer, action: "staffConversationUpdate" });
  const batch = db.batch();
  for (let i = 0; i < 51; i++)
    batch.set(db.doc(`orderConversations/${orderId}/messages/bounded-${i}`), {
      text: `Message ${i}`,
      authorId: customer,
      createdAt: Date.now() + i,
    });
  await batch.commit();
  const view = await read.run(req(customer, { orderId }));
  expect(view.messages).toHaveLength(50);
  expect(view.hasEarlierMessages).toBe(true);
  expect(view.notes).toEqual([]);
});

it("keeps raw conversations and notes server-only for customers and staff", async () => {
  // Uses currently loaded emulator rules; does not replace rules or clear shared data.
  const env = await initializeTestEnvironment({
    projectId: "demo-satsunicgo",
    firestore: { host: "127.0.0.1", port: 8181 },
  });
  try {
    for (const uid of [customer, staff]) {
      const client = env
        .authenticatedContext(uid, {
          email_verified: true,
          firebase: { sign_in_provider: "google.com" },
        })
        .firestore();
      await assertFails(getDoc(doc(client, `orderConversations/${orderId}`)));
      await assertFails(
        getDoc(doc(client, `orderConversations/${orderId}/notes/private`)),
      );
      await assertFails(
        setDoc(doc(client, `orderConversations/${orderId}/messages/forged`), {
          text: "Forged",
        }),
      );
    }
  } finally {
    await env.cleanup();
  }
});

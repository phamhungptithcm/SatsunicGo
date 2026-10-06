import { initializeApp, getApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { beforeAll, beforeEach, afterAll, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import type { CallableRequest } from "firebase-functions/v2/https";
let db: ReturnType<typeof getFirestore>,
  api: typeof import("../../functions/src/order-conversation");
const prefix = `convmixed026-${randomUUID()}`,
  uid = `${prefix}-staff`,
  target = `${prefix}-target`,
  customer = `${prefix}-customer`,
  orderId = `${prefix}-order`;
const mixed = [
  { label: "object", roles: ["SUPPORT", {}] },
  { label: "null", roles: ["SUPPORT", null] },
  { label: "number", roles: ["SUPPORT", 1] },
];
function req(actor: string, data: unknown) {
  return {
    auth: {
      uid: actor,
      token: {
        email_verified: true,
        firebase: { sign_in_provider: "google.com" },
      },
    },
    data,
  } as CallableRequest;
}
function input(action: "message" | "note" | "assign", expectedVersion = 0) {
  return {
    action,
    orderId,
    expectedVersion,
    operationId: randomUUID(),
    ...(action === "assign"
      ? { assigneeId: target }
      : { text: "Synthetic conversation" }),
  };
}
function command(actor: string, data: unknown) {
  return api.orderConversationCommand.run(req(actor, data));
}
function read(actor = uid) {
  return api.readOrderConversation.run(req(actor, { orderId }));
}
async function snapshot() {
  return Promise.all(
    [
      `orderConversations`,
      `orderConversations/${orderId}/messages`,
      `orderConversations/${orderId}/notes`,
      `idempotencyKeys`,
      `outboxJobs`,
      `auditEvents`,
    ].map(async (c) =>
      (await db.collection(c).get()).docs
        .map((d) => ({ id: d.id, data: d.data() }))
        .sort((a, b) => a.id.localeCompare(b.id)),
    ),
  );
}
beforeAll(async () => {
  initializeApp({
    projectId: `demo-satsunicgo-convmix-${randomUUID().slice(0, 8)}`,
  });
  db = getFirestore();
  api = await import("../../functions/src/order-conversation");
});
beforeEach(async () => {
  const ref = db.doc(`orderConversations/${orderId}`);
  await Promise.all([
    db.doc(`orders/${orderId}`).set({ ownerId: customer, version: 1 }),
    db
      .doc(`users/${uid}`)
      .set({ locked: false, displayName: "Synthetic staff" }),
    db
      .doc(`users/${target}`)
      .set({ locked: false, displayName: "Synthetic target" }),
    db
      .doc(`users/${customer}`)
      .set({ locked: false, displayName: "Synthetic customer" }),
    db.doc(`staffAccess/${uid}`).set({ active: true, roles: ["SUPPORT"] }),
    db.doc(`staffAccess/${target}`).set({ active: true, roles: ["SUPPORT"] }),
    db.doc(`staffAccess/${customer}`).delete(),
    ref.set({ orderId, ownerId: customer, version: 0 }),
    ref
      .collection("messages")
      .get()
      .then(async (rows) => {
        const b = db.batch();
        rows.docs.forEach((d) => b.delete(d.ref));
        await b.commit();
      }),
    ref
      .collection("notes")
      .get()
      .then(async (rows) => {
        const b = db.batch();
        rows.docs.forEach((d) => b.delete(d.ref));
        await b.commit();
      }),
  ]);
});
it.each(mixed)(
  "CONVMIX026 read denies mixed $label actor without effects",
  async ({ roles }) => {
    await db.doc(`staffAccess/${uid}`).set({ active: true, roles });
    const before = await snapshot();
    await expect(read()).rejects.toMatchObject({ code: "permission-denied" });
    expect(await snapshot()).toEqual(before);
  },
);
it.each(mixed)(
  "CONVMIX026 note command denies mixed $label actor without effects",
  async ({ roles }) => {
    await db.doc(`staffAccess/${uid}`).set({ active: true, roles });
    const before = await snapshot();
    await expect(command(uid, input("note"))).rejects.toMatchObject({
      code: "permission-denied",
    });
    expect(await snapshot()).toEqual(before);
  },
);
it.each(mixed)(
  "CONVMIX026 completed note replay denies current mixed $label actor",
  async ({ roles }) => {
    const data = input("note"),
      result = await command(uid, data);
    expect(await command(uid, data)).toEqual(result);
    await db.doc(`staffAccess/${uid}`).set({ active: true, roles });
    const before = await snapshot();
    await expect(command(uid, data)).rejects.toMatchObject({
      code: "permission-denied",
    });
    expect(await snapshot()).toEqual(before);
  },
);
it.each(mixed)(
  "CONVMIX026 assignment denies mixed $label target without effects",
  async ({ roles }) => {
    await db.doc(`staffAccess/${target}`).set({ active: true, roles });
    const before = await snapshot();
    await expect(command(uid, input("assign"))).rejects.toMatchObject({
      code: "failed-precondition",
    });
    expect(await snapshot()).toEqual(before);
  },
);
it.each(mixed)(
  "CONVMIX026 completed assignment replay rechecks mixed $label target",
  async ({ roles }) => {
    const data = input("assign"),
      result = await command(uid, data);
    expect(await command(uid, data)).toEqual(result);
    await db.doc(`staffAccess/${target}`).set({ active: true, roles });
    const before = await snapshot();
    await expect(command(uid, data)).rejects.toMatchObject({
      code: "failed-precondition",
    });
    expect(await snapshot()).toEqual(before);
  },
);
it.each(mixed)(
  "CONVMIX026 list omits mixed $label target and marks current assignee unavailable",
  async ({ roles }) => {
    await db.doc(`staffAccess/${target}`).set({ active: true, roles });
    await db
      .doc(`orderConversations/${orderId}`)
      .update({ assigneeId: target });
    const before = await snapshot(),
      result = await read();
    expect(result.staffChoices.map((r) => r.id)).not.toContain(target);
    expect(result.staffChoices.map((r) => r.id)).toContain(uid);
    expect(result.assignee?.available).toBe(false);
    expect(await snapshot()).toEqual(before);
  },
);
it.each(mixed)(
  "CONVMIX026 customer message skips notification to mixed $label assignee",
  async ({ roles }) => {
    await db.doc(`staffAccess/${target}`).set({ active: true, roles });
    await db
      .doc(`orderConversations/${orderId}`)
      .update({ assigneeId: target });
    const data = input("message"),
      result = await command(customer, data);
    expect(result.version).toBe(1);
    expect(
      (
        await db
          .doc(`outboxJobs/conversation-staff-${customer}-${data.operationId}`)
          .get()
      ).exists,
    ).toBe(false);
    const after = await snapshot();
    expect(await command(customer, data)).toEqual(result);
    expect(await snapshot()).toEqual(after);
  },
);
it("CONVMIX026 future string union retains staff read/note/assignment/replay and notification", async () => {
  await db
    .doc(`staffAccess/${uid}`)
    .set({ active: true, roles: ["SUPPORT", "FUTURE_ROLE"] });
  await db
    .doc(`staffAccess/${target}`)
    .set({ active: true, roles: ["SUPPORT", "FUTURE_ROLE"] });
  expect((await read()).staff).toBe(true);
  const note = input("note"),
    n = await command(uid, note);
  expect(await command(uid, note)).toEqual(n);
  const assign = input("assign", 1),
    a = await command(uid, assign);
  expect(await command(uid, assign)).toEqual(a);
  expect((await read()).assignee?.available).toBe(true);
  const message = input("message", 2);
  await command(customer, message);
  expect(
    (
      await db
        .doc(`outboxJobs/conversation-staff-${customer}-${message.operationId}`)
        .get()
    ).data()?.ownerId,
  ).toBe(target);
});
it.each(mixed)(
  "CONVMIX026 customer with mixed $label metadata retains message/read but no private notes or staffchoices",
  async ({ roles }) => {
    await command(uid, input("note"));
    await db.doc(`staffAccess/${customer}`).set({ active: true, roles });
    const result = await read(customer);
    expect(result.staff).toBe(false);
    expect(result.notes).toEqual([]);
    expect(result.staffChoices).toEqual([]);
    expect(result.assignee).toBeNull();
    const data = input("message", 1);
    expect((await command(customer, data)).version).toBe(2);
    await expect(command(customer, input("note", 2))).rejects.toMatchObject({
      code: "permission-denied",
    });
  },
);
afterAll(async () => {
  await db.terminate();
  await deleteApp(getApp());
});

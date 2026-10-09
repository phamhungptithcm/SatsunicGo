import { beforeAll, afterAll, expect, test } from "vitest";
import { randomUUID } from "node:crypto";
import { getFirestore } from "firebase-admin/firestore";
import type { CallableRequest } from "firebase-functions/v2/https";
let member: typeof import("../../functions/src/membership").membershipCommand;
let db: ReturnType<typeof getFirestore>;
const owners = new Set<string>(),
  paths = new Set<string>();
const free = `ask-free-${randomUUID()}`,
  paid = `ask-plus-${randomUUID()}`;
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
async function owner() {
  const uid = `ask-member-${randomUUID()}`;
  owners.add(uid);
  await db.doc(`users/${uid}`).set({ ownerId: uid });
  return uid;
}
async function run(uid: string, data: Record<string, unknown>) {
  paths.add(`idempotencyKeys/${uid}-${data.operationId}`);
  paths.add(`outboxJobs/membership-${uid}-${data.operationId}`);
  return member.run(req(uid, data));
}
beforeAll(async () => {
  ({ membershipCommand: member } = await import("../../functions/src/index"));
  db = getFirestore();
  for (const [id, name, price] of [
    [free, "FREE", 0],
    [paid, "Synthetic PLUS", 100000],
  ] as const) {
    paths.add(`membershipPlans/${id}`);
    await db.doc(`membershipPlans/${id}`).set({
      name,
      price,
      status: "published",
      periodDays: 30,
      serviceDiscountBps: 100,
      discountCap: 10000,
    });
  }
});
afterAll(async () => {
  for (const uid of owners) {
    for (const [collection, field] of [
      ["membershipInvoices", "ownerId"],
      ["membershipHistory", "ownerId"],
      ["auditEvents", "actor"],
    ]) {
      const rows = await db
        .collection(collection)
        .where(field, "==", uid)
        .get();
      for (const row of rows.docs) await row.ref.delete();
    }
    await db.doc(`users/${uid}`).delete();
    await db.doc(`membershipSubscriptions/${uid}`).delete();
  }
  for (const path of paths) await db.doc(path).delete();
  await db.terminate();
});
test("paid request replay creates one pending invoice and no entitlement", async () => {
  const uid = await owner(),
    data = { action: "purchase", planId: paid, operationId: randomUUID() };
  const [a, b] = await Promise.all([run(uid, data), run(uid, data)]);
  expect(a).toEqual(b);
  expect(a.state).toBe("pending");
  const invoices = await db
    .collection("membershipInvoices")
    .where("ownerId", "==", uid)
    .get();
  expect(invoices.size).toBe(1);
  expect(invoices.docs[0].data().state).toBe("pending");
  expect((await db.doc(`membershipSubscriptions/${uid}`).get()).exists).toBe(
    false,
  );
});
test("free plan activation replay preserves one term", async () => {
  const uid = await owner(),
    data = { action: "purchase", planId: free, operationId: randomUUID() };
  const first = await run(uid, data);
  const term = (await db.doc(`membershipSubscriptions/${uid}`).get()).data()!;
  expect(first).toEqual({ id: uid, state: "active" });
  expect(await run(uid, data)).toEqual(first);
  expect(
    (await db.doc(`membershipSubscriptions/${uid}`).get()).data()?.endsAt,
  ).toBe(term.endsAt);
  expect(
    (await db.collection("membershipHistory").where("ownerId", "==", uid).get())
      .size,
  ).toBe(1);
});
test("renewal intent is idempotent and does not extend entitlement or collect money", async () => {
  const uid = await owner();
  await run(uid, {
    action: "purchase",
    planId: free,
    operationId: randomUUID(),
  });
  const before = (await db.doc(`membershipSubscriptions/${uid}`).get()).data()!;
  const command = { action: "requestRenewal", operationId: randomUUID() };
  expect(await run(uid, command)).toEqual({ id: uid });
  await run(uid, command);
  expect(
    (await db.doc(`membershipSubscriptions/${uid}`).get()).data(),
  ).toMatchObject({ endsAt: before.endsAt, renewalIntent: true });
  await run(uid, { action: "cancelRenewal", operationId: randomUUID() });
  expect(
    (await db.doc(`membershipSubscriptions/${uid}`).get()).data(),
  ).toMatchObject({ endsAt: before.endsAt, renewalIntent: false });
  expect(
    (
      await db
        .collection("membershipInvoices")
        .where("ownerId", "==", uid)
        .get()
    ).empty,
  ).toBe(true);
});
test("customer cannot confirm/grant, cancel foreign or paid invoices, or replay changed payload", async () => {
  const uid = await owner(),
    foreign = await owner(),
    command = { action: "purchase", planId: paid, operationId: randomUUID() };
  const invoice = await run(uid, command);
  await expect(
    run(uid, {
      action: "confirm",
      invoiceId: invoice.id,
      operationId: randomUUID(),
    }),
  ).rejects.toMatchObject({ code: "permission-denied" });
  await expect(
    run(uid, {
      action: "grant",
      planId: free,
      ownerId: uid,
      reason: "Synthetic test only",
      operationId: randomUUID(),
    }),
  ).rejects.toMatchObject({ code: "permission-denied" });
  await expect(
    run(foreign, {
      action: "cancelInvoice",
      invoiceId: invoice.id,
      operationId: randomUUID(),
    }),
  ).rejects.toMatchObject({ code: "permission-denied" });
  await expect(run(uid, { ...command, planId: free })).rejects.toMatchObject({
    code: "already-exists",
  });
  await db.doc(`membershipInvoices/${invoice.id}`).update({ state: "paid" });
  await expect(
    run(uid, {
      action: "cancelInvoice",
      invoiceId: invoice.id,
      operationId: randomUUID(),
    }),
  ).rejects.toMatchObject({ code: "failed-precondition" });
});
test("cancel owned pending request and deny replay after lock", async () => {
  const uid = await owner(),
    result = await run(uid, {
      action: "purchase",
      planId: paid,
      operationId: randomUUID(),
    }),
    cancel = {
      action: "cancelInvoice",
      invoiceId: result.id,
      operationId: randomUUID(),
    };
  expect(await run(uid, cancel)).toEqual({ id: result.id });
  expect(
    (await db.doc(`membershipInvoices/${result.id}`).get()).data()?.state,
  ).toBe("cancelled");
  await db.doc(`users/${uid}`).update({ locked: true });
  await expect(run(uid, cancel)).rejects.toMatchObject({
    code: "permission-denied",
  });
});

test("restored purchase command returns the committed invoice after public plan changes", async () => {
  const uid = await owner(),
    planId = `reload-plan-${randomUUID()}`;
  paths.add(`membershipPlans/${planId}`);
  await db
    .doc(`membershipPlans/${planId}`)
    .set({
      name: "Synthetic reload",
      price: 100000,
      status: "published",
      periodDays: 30,
    });
  const original = { action: "purchase", planId, operationId: randomUUID() };
  const first = await run(uid, original);
  await db
    .doc(`membershipPlans/${planId}`)
    .update({ price: 900000, status: "draft" });
  const restored = JSON.parse(JSON.stringify(original));
  expect(await run(uid, restored)).toEqual(first);
  const rows = await db
    .collection("membershipInvoices")
    .where("ownerId", "==", uid)
    .get();
  expect(rows.size).toBe(1);
  expect(rows.docs[0].data()).toMatchObject({
    amount: 100000,
    state: "pending",
    currency: "VND",
  });
  expect((await db.doc(`membershipSubscriptions/${uid}`).get()).exists).toBe(
    false,
  );
});
test("restored renewal and cancellation replay retain original outcomes after live state changes", async () => {
  const uid = await owner();
  await run(uid, {
    action: "purchase",
    planId: free,
    operationId: randomUUID(),
  });
  const before = (await db.doc(`membershipSubscriptions/${uid}`).get()).data()!;
  const renewal = { action: "requestRenewal", operationId: randomUUID() };
  await run(uid, renewal);
  await run(uid, { action: "cancelRenewal", operationId: randomUUID() });
  expect(await run(uid, JSON.parse(JSON.stringify(renewal)))).toEqual({
    id: uid,
  });
  expect(
    (await db.doc(`membershipSubscriptions/${uid}`).get()).data(),
  ).toMatchObject({ renewalIntent: false, endsAt: before.endsAt });
  const other = await owner(),
    purchase = await run(other, {
      action: "purchase",
      planId: paid,
      operationId: randomUUID(),
    });
  const cancel = {
    action: "cancelInvoice",
    invoiceId: purchase.id,
    operationId: randomUUID(),
  };
  await run(other, cancel);
  expect(await run(other, JSON.parse(JSON.stringify(cancel)))).toEqual({
    id: purchase.id,
  });
  expect(
    (await db.doc(`membershipInvoices/${purchase.id}`).get()).data()?.state,
  ).toBe("cancelled");
  expect(
    (
      await db
        .collection("membershipInvoices")
        .where("ownerId", "==", uid)
        .get()
    ).empty,
  ).toBe(true);
});

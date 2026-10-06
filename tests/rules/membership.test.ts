import { beforeAll, afterAll, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { CallableRequest } from "firebase-functions/v2/https";
import { membershipCommand } from "../../functions/src/membership";
import { maintenance, readNotification } from "../../functions/src/jobs";
const prefix = `membership-${randomUUID()}`;
const customer = `${prefix}-customer`,
  finance = `${prefix}-finance`,
  planId = `${prefix}-plus`;
let app: ReturnType<typeof initializeApp>, db: ReturnType<typeof getFirestore>;
const req = (uid: string, data: unknown) =>
  ({
    auth: {
      uid,
      token: {
        uid,
        email_verified: true,
        firebase: { sign_in_provider: "google.com" },
      },
    },
    data,
  }) as CallableRequest;
beforeAll(async () => {
  if (
    process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8181" ||
    process.env.GCLOUD_PROJECT !== "demo-satsunicgo"
  )
    throw new Error(
      "Membership tests require the isolated demo emulator launcher.",
    );
  process.env.FUNCTIONS_EMULATOR = "true";
  app = initializeApp({
    projectId: `demo-satsunicgo-membership-${randomUUID().slice(0, 8)}`,
  });
  db = getFirestore();
  await Promise.all([
    db.doc(`users/${customer}`).set({ locked: false }),
    db.doc(`users/${finance}`).set({ locked: false }),
    db.doc(`staffAccess/${finance}`).set({ active: true, roles: ["FINANCE"] }),
    db.doc(`membershipPlans/${planId}`).set({
      name: "PLUS",
      status: "published",
      price: 100000,
      periodDays: 30,
      serviceDiscountBps: 1000,
      discountCap: 50000,
    }),
  ]);
});
afterAll(async () => {
  await db?.terminate();
  if (app) await deleteApp(app);
});
it("concurrent FREE activation produces one term and no invoice or money entry", async () => {
  const uid = `${prefix}-free`,
    freePlan = `${prefix}-free-plan`;
  await Promise.all([
    db.doc(`users/${uid}`).set({ locked: false }),
    db.doc(`membershipPlans/${freePlan}`).set({
      name: "FREE",
      status: "published",
      price: 0,
      periodDays: 30,
      serviceDiscountBps: 0,
      discountCap: 0,
    }),
  ]);
  const purchase = {
    action: "purchase",
    planId: freePlan,
    operationId: randomUUID(),
  };
  const results = await Promise.all([
    membershipCommand.run(req(uid, purchase)),
    membershipCommand.run(req(uid, purchase)),
  ]);
  expect(results[0]).toEqual({ id: uid, state: "active" });
  expect(results[1]).toEqual(results[0]);
  const first = (await db.doc(`membershipSubscriptions/${uid}`).get()).data()!;
  await membershipCommand.run(
    req(uid, { ...purchase, operationId: randomUUID() }),
  );
  const repeated = (
    await db.doc(`membershipSubscriptions/${uid}`).get()
  ).data()!;
  expect(repeated.endsAt).toBe(first.endsAt);
  expect(first.endsAt - first.startsAt).toBe(30 * 86400000);
  for (const collection of ["membershipInvoices", "financialEntries"])
    expect(
      (await db.collection(collection).where("ownerId", "==", uid).get()).size,
    ).toBe(0);
  const events = await db
    .collection("membershipHistory")
    .where("ownerId", "==", uid)
    .get();
  expect(
    events.docs.filter((row) => row.data().action === "activateFree"),
  ).toHaveLength(1);
  expect(
    (await db.collection("outboxJobs").where("ownerId", "==", uid).get()).size,
  ).toBe(1);
});
it("concurrent confirmation consumes one bank receipt and prepaid term exactly once", async () => {
  const purchase = { action: "purchase", planId, operationId: randomUUID() };
  const invoice = await membershipCommand.run(req(customer, purchase));
  const confirmation = {
    action: "confirm",
    invoiceId: invoice.id,
    amount: 100000,
    bankTransactionId: `bank-${prefix}`,
    evidence: "Emulator fixture statement only",
    operationId: randomUUID(),
  };
  const results = await Promise.all([
    membershipCommand.run(req(finance, confirmation)),
    membershipCommand.run(req(finance, confirmation)),
  ]);
  expect(results[0]).toEqual(results[1]);
  expect(
    (await db.doc(`membershipInvoices/${invoice.id}`).get()).data()?.state,
  ).toBe("paid");
  const receipts = await db
    .collection("financialEntries")
    .where("invoiceId", "==", invoice.id)
    .get();
  expect(receipts.size).toBe(1);
  const history = await db
    .collection("membershipHistory")
    .where("ownerId", "==", customer)
    .get();
  expect(
    history.docs.filter((row) => row.data().action === "confirm"),
  ).toHaveLength(1);
  const sub = (
    await db.doc(`membershipSubscriptions/${customer}`).get()
  ).data()!;
  expect(sub.endsAt - sub.startsAt).toBe(30 * 86400000);
  await expect(
    membershipCommand.run(
      req(customer, { ...confirmation, operationId: randomUUID() }),
    ),
  ).rejects.toThrow(/quyền tài chính/);
});
it("expiry replay creates one owner-readable event and one notification", async () => {
  const uid = `${prefix}-expired`,
    endsAt = Date.now() - 1000;
  await db
    .doc(`membershipSubscriptions/${uid}`)
    .set({ ownerId: uid, state: "active", endsAt });
  await maintenance.run({ scheduleTime: new Date().toISOString() });
  await maintenance.run({ scheduleTime: new Date().toISOString() });
  const history = await db
    .collection("membershipHistory")
    .where("ownerId", "==", uid)
    .get();
  expect(
    history.docs.filter((row) => row.data().action === "expired"),
  ).toHaveLength(1);
  const key = `membership-expired-${uid}-${endsAt}`;
  expect((await db.doc(`notifications/${key}`).get()).data()).toMatchObject({
    ownerId: uid,
    action: "membershipExpired",
  });
  expect(
    (await db.doc(`membershipSubscriptions/${uid}`).get()).data()?.state,
  ).toBe("expired");
});
it("notification accepts generated long IDs but denies other owners and locked users", async () => {
  const uid = `member_${randomUUID().replaceAll("-", "").repeat(3)}`;
  const id = `membership-${uid}-${randomUUID()}`;
  expect(id.length).toBeGreaterThan(80);
  await db.doc(`users/${uid}`).set({ locked: false });
  await db.doc(`notifications/${id}`).set({ ownerId: uid, read: false });
  await expect(readNotification.run(req(customer, { id }))).rejects.toThrow(
    /truy cập/,
  );
  await readNotification.run(req(uid, { id }));
  expect((await db.doc(`notifications/${id}`).get()).data()?.read).toBe(true);
  await db.doc(`users/${uid}`).update({ locked: true });
  await expect(readNotification.run(req(uid, { id }))).rejects.toThrow(
    /truy cập/,
  );
  await expect(
    readNotification.run(req(uid, { id: "../private" })),
  ).rejects.toThrow(/hợp lệ/);
});
it("approved expiry reminder is delivered once and unknown email is never requeued", async () => {
  const uid = `${prefix}-upcoming`,
    endsAt = Date.now() + 86400000;
  const policy = db.doc("settings/membershipReminders"),
    email = db.doc("settings/email");
  const [oldPolicy, oldEmail] = await Promise.all([policy.get(), email.get()]);
  try {
    await policy.set({ approved: true, daysBeforeExpiry: 3 });
    await email.set({
      enabled: true,
      host: "fixture.invalid",
      user: "fixture",
      from: "fixture@example.invalid",
      messageIdDomain: "example.invalid",
    });
    await db.doc(`membershipSubscriptions/${uid}`).set({
      ownerId: uid,
      state: "active",
      endsAt,
      renewalIntent: "cancelled",
    });
    const batch = db.batch();
    for (let i = 0; i < 31; i++)
      batch.set(db.doc(`membershipSubscriptions/${prefix}-page-${i}`), {
        ownerId: `${prefix}-page-${i}`,
        state: "active",
        endsAt: endsAt + (i + 1) * 1000,
      });
    await batch.commit();
    const safe = db.doc(`outboxJobs/${prefix}-config-blocked`),
      unknown = db.doc(`outboxJobs/${prefix}-unknown`);
    await safe.set({
      ownerId: uid,
      state: "inAppDelivered",
      emailState: "blocked_external",
      emailAttempts: 0,
    });
    await unknown.set({
      ownerId: uid,
      state: "inAppDelivered",
      emailState: "unknown",
      emailAttempts: 1,
    });
    await maintenance.run({ scheduleTime: new Date().toISOString() });
    await maintenance.run({ scheduleTime: new Date().toISOString() });
    const key = `membership-reminder-${uid}-${endsAt}`;
    await maintenance.run({ scheduleTime: new Date().toISOString() });
    expect((await db.doc(`notifications/${key}`).get()).data()).toMatchObject({
      ownerId: uid,
      action: "membershipExpiring",
      endsAt,
    });
    expect((await safe.get()).data()?.emailState).toBe("queued");
    expect((await unknown.get()).data()?.emailState).toBe("unknown");
    expect(
      (
        await db
          .doc(
            `notifications/membership-reminder-${prefix}-page-30-${endsAt + 31000}`,
          )
          .get()
      ).data()?.action,
    ).toBe("membershipExpiring");
    expect(
      (await db.doc(`membershipSubscriptions/${uid}`).get()).data()?.state,
    ).toBe("active");
  } finally {
    if (oldPolicy.exists) await policy.set(oldPolicy.data()!);
    else await policy.delete();
    if (oldEmail.exists) await email.set(oldEmail.data()!);
    else await email.delete();
  }
});

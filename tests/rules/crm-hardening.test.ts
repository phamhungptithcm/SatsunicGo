import { initializeApp, deleteApp, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import type { CallableRequest } from "firebase-functions/v2/https";
let api: typeof import("../../functions/src/crm"),
  db: ReturnType<typeof getFirestore>;
const prefix = `crm024-${randomUUID()}`,
  owner = `${prefix}-owner`,
  customer = `${prefix}-customer`,
  staff = `${prefix}-staff`;
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
function input() {
  return {
    id: customer,
    operationId: randomUUID(),
    tags: [],
    notes: "Synthetic CRM note",
    assigneeId: "",
    followUpAt: 0,
  };
}
beforeAll(async () => {
  initializeApp({
    projectId: `demo-satsunicgo-crm-${randomUUID().slice(0, 8)}`,
  });
  db = getFirestore();
  api = await import("../../functions/src/crm");
  await Promise.all([
    db.doc(`users/${owner}`).set({ displayName: "Fixture owner" }),
    db.doc(`users/${customer}`).set({ displayName: "Fixture customer" }),
    db.doc(`users/${staff}`).set({ displayName: "Fixture staff" }),
  ]);
});
beforeEach(async () => {
  await Promise.all([
    db.doc(`staffAccess/${owner}`).set({ active: true, roles: ["OWNER"] }),
    db.doc(`staffAccess/${staff}`).set({ active: true, roles: ["SUPPORT"] }),
    db.doc(`crmCustomers/${customer}`).delete(),
    db.doc(`users/${owner}`).update({ locked: false }),
  ]);
});
async function expectNoWrite(operationId: string) {
  expect((await db.doc(`crmCustomers/${customer}`).get()).exists).toBe(false);
  expect(
    (await db.doc(`idempotencyKeys/${owner}-${operationId}`).get()).exists,
  ).toBe(false);
  const audit = await db
    .collection("auditEvents")
    .where("correlationId", "==", operationId)
    .get();
  expect(audit.empty).toBe(true);
}
it.each([1, 7])(
  "missing CRM record rejects update expectedVersion %s without writes",
  async (expectedVersion) => {
    const d = { ...input(), expectedVersion };
    await expect(
      api.saveCustomerNotes.run(req(owner, d)),
    ).rejects.toMatchObject({ code: "aborted" });
    await expectNoWrite(d.operationId);
  },
);
const malformed = [
  { label: "string false", access: { active: "false", roles: ["OWNER"] } },
  { label: "number one", access: { active: 1, roles: ["OWNER"] } },
  { label: "string roles", access: { active: true, roles: "OWNER" } },
  { label: "object roles", access: { active: true, roles: { OWNER: true } } },
];
it.each(malformed)(
  "malformed authorizer $label returns safe denial and no notes write",
  async ({ access }) => {
    await db.doc(`staffAccess/${owner}`).set(access);
    await expect(
      api.listCustomers.run(req(owner, { mode: "id", search: customer })),
    ).rejects.toMatchObject({ code: "permission-denied" });
    const d = input();
    await expect(
      api.saveCustomerNotes.run(req(owner, d)),
    ).rejects.toMatchObject({ code: "permission-denied" });
    await expectNoWrite(d.operationId);
  },
);
it.each(malformed)(
  "malformed assignee $label rejects before persistence",
  async ({ access }) => {
    await db.doc(`staffAccess/${staff}`).set(access);
    const d = { ...input(), assigneeId: staff };
    await expect(
      api.saveCustomerNotes.run(req(owner, d)),
    ).rejects.toMatchObject({ code: "failed-precondition" });
    await expectNoWrite(d.operationId);
  },
);
it.each(malformed)(
  "malformed dashboard authority $label denies a valid period",
  async ({ access }) => {
    await db.doc(`staffAccess/${owner}`).set(access);
    const until = Date.now();
    await expect(
      api.operationalDashboard.run(req(owner, { from: until - 60000, until })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  },
);
it("valid create/update and replay preserve current version, while stale and changed payloads fail closed", async () => {
  const create = { ...input(), assigneeId: staff };
  expect(await api.saveCustomerNotes.run(req(owner, create))).toEqual({
    version: 1,
  });
  const update = {
    ...create,
    operationId: randomUUID(),
    expectedVersion: 1,
    notes: "Synthetic revision",
  };
  expect(await api.saveCustomerNotes.run(req(owner, update))).toEqual({
    version: 2,
  });
  expect(await api.saveCustomerNotes.run(req(owner, create))).toEqual({
    version: 1,
  });
  expect(await api.saveCustomerNotes.run(req(owner, update))).toEqual({
    version: 2,
  });
  await expect(
    api.saveCustomerNotes.run(
      req(owner, { ...update, notes: "Different content" }),
    ),
  ).rejects.toMatchObject({ code: "already-exists" });
  await expect(
    api.saveCustomerNotes.run(
      req(owner, { ...update, operationId: randomUUID() }),
    ),
  ).rejects.toMatchObject({ code: "aborted" });
  expect((await db.doc(`crmCustomers/${customer}`).get()).data()?.notes).toBe(
    "Synthetic revision",
  );
});
it("concurrent creates allow only one committed version and replay checks current lock", async () => {
  const first = input(),
    second = { ...input(), notes: "Other synthetic note" };
  const results = await Promise.allSettled([
    api.saveCustomerNotes.run(req(owner, first)),
    api.saveCustomerNotes.run(req(owner, second)),
  ]);
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
  const index = results.findIndex((r) => r.status === "fulfilled"),
    winner = index === 0 ? first : second;
  expect((await db.doc(`crmCustomers/${customer}`).get()).data()?.version).toBe(
    1,
  );
  await db.doc(`users/${owner}`).update({ locked: true });
  await expect(
    api.saveCustomerNotes.run(req(owner, winner)),
  ).rejects.toMatchObject({ code: "permission-denied" });
});
it.each([
  { label: "past", state: "active", delta: -1, projected: "expired" },
  { label: "exact boundary", state: "active", delta: 0, projected: "expired" },
  { label: "future", state: "active", delta: 60000, projected: "active" },
  {
    label: "cancelled",
    state: "cancelled",
    delta: 60000,
    projected: "cancelled",
  },
])(
  "CRM membership read projects $label without mutating stored subscription",
  async ({ state, delta, projected }) => {
    const now = Date.now(),
      ref = db.doc(`membershipSubscriptions/${customer}`);
    const stored = {
      state,
      endsAt: now + delta,
      planId: "synthetic",
      version: 4,
    };
    await ref.set(stored);
    const clock = vi.spyOn(Date, "now").mockReturnValue(now);
    try {
      const result = await api.readCustomer.run(req(owner, { id: customer }));
      expect(result.membership).toEqual({
        state: projected,
        endsAt: stored.endsAt,
      });
    } finally {
      clock.mockRestore();
    }
    expect((await ref.get()).data()).toEqual(stored);
  },
);
it.each([0, -1, "invalid", "", null, true, 1.5, Infinity])(
  "malformed active expiry %s projects unknown without changing membership",
  async (endsAt) => {
    const ref = db.doc(`membershipSubscriptions/${customer}`);
    const stored = { state: "active", endsAt, version: 4 };
    await ref.set(stored);
    const result = await api.readCustomer.run(req(owner, { id: customer }));
    expect(result.membership).toEqual({ state: "unknown", endsAt: 0 });
    expect((await ref.get()).data()).toEqual(stored);
  },
);
it("numeric string expiry follows membershipTerm conversion without granting access or changing storage", async () => {
  const ref = db.doc(`membershipSubscriptions/${customer}`),
    endsAt = Date.now() + 60000;
  const stored = { state: "active", endsAt: String(endsAt), version: 4 };
  await ref.set(stored);
  const result = await api.readCustomer.run(req(owner, { id: customer }));
  expect(result.membership).toEqual({ state: "active", endsAt });
  expect((await ref.get()).data()).toEqual(stored);
});
it.each([
  { label: "missing", storedVersion: undefined, expectedVersion: undefined },
  {
    label: "exhausted",
    storedVersion: Number.MAX_SAFE_INTEGER,
    expectedVersion: Number.MAX_SAFE_INTEGER,
  },
])(
  "CRM025 corrupt stored version $label rejects without replacing notes or creating operation/audit",
  async ({ storedVersion, expectedVersion }) => {
    const ref = db.doc(`crmCustomers/${customer}`);
    const stored = {
      notes: "Retained synthetic note",
      tags: ["retained"],
      ...(storedVersion === undefined ? {} : { version: storedVersion }),
    };
    await ref.set(stored);
    const d = {
      ...input(),
      ...(expectedVersion === undefined ? {} : { expectedVersion }),
    };
    await expect(
      api.saveCustomerNotes.run(req(owner, d)),
    ).rejects.toMatchObject({ code: "aborted" });
    expect((await ref.get()).data()).toEqual(stored);
    expect(
      (await db.doc(`idempotencyKeys/${owner}-${d.operationId}`).get()).exists,
    ).toBe(false);
    expect(
      (
        await db
          .collection("auditEvents")
          .where("correlationId", "==", d.operationId)
          .get()
      ).empty,
    ).toBe(true);
  },
);
it("CRM025 last safe increment commits once and replays after version exhaustion", async () => {
  const ref = db.doc(`crmCustomers/${customer}`);
  await ref.set({
    version: Number.MAX_SAFE_INTEGER - 1,
    notes: "Before last increment",
  });
  const d = { ...input(), expectedVersion: Number.MAX_SAFE_INTEGER - 1 };
  expect(await api.saveCustomerNotes.run(req(owner, d))).toEqual({
    version: Number.MAX_SAFE_INTEGER,
  });
  expect(await api.saveCustomerNotes.run(req(owner, d))).toEqual({
    version: Number.MAX_SAFE_INTEGER,
  });
  expect((await ref.get()).data()?.version).toBe(Number.MAX_SAFE_INTEGER);
});
afterAll(async () => {
  await db.terminate();
  await deleteApp(getApp());
});

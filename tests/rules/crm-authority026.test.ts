import { initializeApp, getApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { beforeAll, beforeEach, afterAll, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import type { CallableRequest } from "firebase-functions/v2/https";
let db: ReturnType<typeof getFirestore>,
  api: typeof import("../../functions/src/crm");
const prefix = `crm026-${randomUUID()}`,
  owner = `${prefix}-owner`,
  customer = `${prefix}-customer`,
  assignee = `${prefix}-assignee`;
const mixed = [
  { label: "object", roles: ["OWNER", {}] },
  { label: "null", roles: ["OWNER", null] },
  { label: "number", roles: ["OWNER", 1] },
];
function req(data: unknown) {
  return {
    auth: {
      uid: owner,
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
    notes: "Synthetic authority note",
    assigneeId: "",
    followUpAt: 0,
  };
}
beforeAll(async () => {
  initializeApp({
    projectId: `demo-satsunicgo-mixed-${randomUUID().slice(0, 8)}`,
  });
  db = getFirestore();
  api = await import("../../functions/src/crm");
});
beforeEach(async () => {
  const rows = await db.collection("staffAccess").get(),
    batch = db.batch();
  for (const row of rows.docs) batch.delete(row.ref);
  await batch.commit();
  await Promise.all([
    db
      .doc(`users/${owner}`)
      .set({ locked: false, displayName: "Synthetic owner" }),
    db
      .doc(`users/${customer}`)
      .set({ locked: false, displayName: "Synthetic customer" }),
    db
      .doc(`users/${assignee}`)
      .set({ locked: false, displayName: "Synthetic assignee" }),
    db.doc(`staffAccess/${owner}`).set({ active: true, roles: ["OWNER"] }),
    db.doc(`staffAccess/${assignee}`).set({ active: true, roles: ["SUPPORT"] }),
    db.doc(`crmCustomers/${customer}`).delete(),
  ]);
});
async function noWrite(operationId: string) {
  expect((await db.doc(`crmCustomers/${customer}`).get()).exists).toBe(false);
  expect(
    (await db.doc(`idempotencyKeys/${owner}-${operationId}`).get()).exists,
  ).toBe(false);
  expect(
    (
      await db
        .collection("auditEvents")
        .where("correlationId", "==", operationId)
        .get()
    ).empty,
  ).toBe(true);
}
const endpoints = [
  "customers",
  "followups",
  "staff",
  "detail",
  "save",
] as const;
async function invoke(
  endpoint: (typeof endpoints)[number],
  data: ReturnType<typeof input>,
) {
  if (endpoint === "customers")
    return api.listCustomers.run(req({ mode: "id", search: customer }));
  if (endpoint === "followups")
    return api.listFollowUps.run(req({ mode: "all" }));
  if (endpoint === "staff") return api.listCrmStaff.run(req({}));
  if (endpoint === "detail") return api.readCustomer.run(req({ id: customer }));
  return api.saveCustomerNotes.run(req(data));
}
for (const endpoint of endpoints)
  it.each(mixed)(
    `CRM026 ${endpoint} denies mixed $label roles before private access or write`,
    async ({ roles }) => {
      await db.doc(`staffAccess/${owner}`).set({ active: true, roles });
      const data = input();
      await expect(invoke(endpoint, data)).rejects.toMatchObject({
        code: "permission-denied",
      });
      await noWrite(data.operationId);
    },
  );
it.each(mixed)(
  "CRM026 dashboard denies mixed $label roles",
  async ({ roles }) => {
    await db.doc(`staffAccess/${owner}`).set({ active: true, roles });
    const until = Date.now();
    await expect(
      api.operationalDashboard.run(req({ from: until - 60000, until })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  },
);
it.each(mixed)(
  "CRM026 assignee mixed $label roles rejects with no writes",
  async ({ roles }) => {
    await db
      .doc(`staffAccess/${assignee}`)
      .set({ active: true, roles: ["SUPPORT", ...roles.slice(1)] });
    const data = { ...input(), assigneeId: assignee };
    await expect(api.saveCustomerNotes.run(req(data))).rejects.toMatchObject({
      code: "failed-precondition",
    });
    await noWrite(data.operationId);
  },
);
it.each(mixed)(
  "CRM026 completed replay denies current mixed $label actor",
  async ({ roles }) => {
    const data = input(),
      result = await api.saveCustomerNotes.run(req(data));
    expect(await api.saveCustomerNotes.run(req(data))).toEqual(result);
    const old = (await db.doc(`crmCustomers/${customer}`).get()).data(),
      operation = (
        await db.doc(`idempotencyKeys/${owner}-${data.operationId}`).get()
      ).data(),
      audits = (
        await db
          .collection("auditEvents")
          .where("correlationId", "==", data.operationId)
          .get()
      ).docs
        .map((d) => d.id)
        .sort();
    await db.doc(`staffAccess/${owner}`).set({ active: true, roles });
    await expect(api.saveCustomerNotes.run(req(data))).rejects.toMatchObject({
      code: "permission-denied",
    });
    expect((await db.doc(`crmCustomers/${customer}`).get()).data()).toEqual(
      old,
    );
    expect(
      (
        await db.doc(`idempotencyKeys/${owner}-${data.operationId}`).get()
      ).data(),
    ).toEqual(operation);
    expect(
      (
        await db
          .collection("auditEvents")
          .where("correlationId", "==", data.operationId)
          .get()
      ).docs
        .map((d) => d.id)
        .sort(),
    ).toEqual(audits);
  },
);
it("CRM026 staff projection omits mixed target beside valid future string union", async () => {
  await db
    .doc(`staffAccess/${assignee}`)
    .set({ active: true, roles: ["SUPPORT", null] });
  const valid = "a-valid-future";
  await db
    .doc(`staffAccess/${valid}`)
    .set({ active: true, roles: ["SUPPORT", "FUTURE_ROLE"] });
  const result = await api.listCrmStaff.run(req({}));
  expect(result.rows.map((r) => r.id)).not.toContain(assignee);
  expect(result.rows.map((r) => r.id)).toContain(valid);
});
it("CRM026 staff filtered projection retains raw thirty-page cursor and sentinel", async () => {
  const batch = db.batch();
  for (let i = 0; i < 31; i++)
    batch.set(db.doc(`staffAccess/a-${String(i).padStart(2, "0")}`), {
      active: true,
      roles: i === 0 ? ["SUPPORT", {}] : ["SUPPORT"],
    });
  await batch.commit();
  const first = await api.listCrmStaff.run(req({}));
  expect(first.rows).toHaveLength(29);
  expect(first.rows.map((r) => r.id)).not.toContain("a-00");
  expect(first.next).toBe("a-29");
  const second = await api.listCrmStaff.run(req({ after: first.next }));
  expect(second.rows.map((r) => r.id)).toEqual(
    ["a-30", assignee, owner].sort(),
  );
  expect(second.next).toBeNull();
});
it("CRM026 valid string union actor and assignee preserve notes and completed replay", async () => {
  await db
    .doc(`staffAccess/${owner}`)
    .set({ active: true, roles: ["OWNER", "FUTURE_ROLE"] });
  await db
    .doc(`staffAccess/${assignee}`)
    .set({ active: true, roles: ["SUPPORT", "FUTURE_ROLE"] });
  const data = { ...input(), assigneeId: assignee },
    result = await api.saveCustomerNotes.run(req(data));
  expect(result.version).toBe(1);
  expect(await api.saveCustomerNotes.run(req(data))).toEqual(result);
  expect(
    (await db.doc(`crmCustomers/${customer}`).get()).data()?.assigneeId,
  ).toBe(assignee);
});
afterAll(async () => {
  await db.terminate();
  await deleteApp(getApp());
});

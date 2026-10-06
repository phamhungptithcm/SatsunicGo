import { initializeApp, getApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { beforeAll, beforeEach, afterAll, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import type { CallableRequest } from "firebase-functions/v2/https";
let db: ReturnType<typeof getFirestore>,
  api: typeof import("../../functions/src/membership-reminder-policy");
const uid = `reminder026-${randomUUID()}`,
  initial = { version: 1, approved: false, daysBeforeExpiry: 7 };
const mixed = [
  { label: "object", roles: ["OWNER", {}] },
  { label: "null", roles: ["OWNER", null] },
  { label: "number", roles: ["OWNER", 1] },
];
function save() {
  return {
    action: "save",
    operationId: randomUUID(),
    expectedVersion: 1,
    approved: true,
    daysBeforeExpiry: 7,
  };
}
function invoke(data: unknown) {
  return api.membershipReminderPolicy.run({
    auth: {
      uid,
      token: {
        email_verified: true,
        firebase: { sign_in_provider: "google.com" },
      },
    },
    data,
  } as CallableRequest);
}
async function snapshot() {
  return {
    policy: (await db.doc("settings/membershipReminders").get()).data(),
    operations: (await db.collection("idempotencyKeys").get()).docs
      .map((d) => ({ id: d.id, data: d.data() }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    audits: (await db.collection("auditEvents").get()).docs
      .map((d) => ({ id: d.id, data: d.data() }))
      .sort((a, b) => a.id.localeCompare(b.id)),
  };
}
beforeAll(async () => {
  initializeApp({
    projectId: `demo-satsunicgo-remrole-${randomUUID().slice(0, 8)}`,
  });
  db = getFirestore();
  api = await import("../../functions/src/membership-reminder-policy");
});
beforeEach(async () => {
  await Promise.all([
    db.doc(`users/${uid}`).set({ locked: false }),
    db
      .doc(`staffAccess/${uid}`)
      .set({ active: true, locked: false, roles: ["OWNER"] }),
    db.doc("settings/membershipReminders").set(initial),
  ]);
});
for (const action of ["read", "save"] as const)
  it.each(mixed)(
    `REMROLE026 ${action} mixed $label denied without policy/op/audit effects`,
    async ({ roles }) => {
      await db
        .doc(`staffAccess/${uid}`)
        .set({ active: true, locked: false, roles });
      const before = await snapshot();
      await expect(
        invoke(action === "read" ? { action } : save()),
      ).rejects.toMatchObject({ code: "permission-denied" });
      expect(await snapshot()).toEqual(before);
    },
  );
it.each(mixed)(
  "REMROLE026 completed save replay denies current mixed $label actor",
  async ({ roles }) => {
    const data = save(),
      result = await invoke(data);
    expect(await invoke(data)).toEqual(result);
    await db
      .doc(`staffAccess/${uid}`)
      .set({ active: true, locked: false, roles });
    const before = await snapshot();
    await expect(invoke(data)).rejects.toMatchObject({
      code: "permission-denied",
    });
    expect(await snapshot()).toEqual(before);
  },
);
it("REMROLE026 OWNER plus future string preserves read/save/replay and bounded day policy", async () => {
  await db
    .doc(`staffAccess/${uid}`)
    .set({ active: true, locked: false, roles: ["OWNER", "FUTURE_ROLE"] });
  expect(await invoke({ action: "read" })).toEqual(initial);
  const data = save(),
    result = await invoke(data);
  expect(result).toEqual({ version: 2, approved: true, daysBeforeExpiry: 7 });
  const after = await snapshot();
  expect(await invoke(data)).toEqual(result);
  expect(await snapshot()).toEqual(after);
  expect(await invoke({ action: "read" })).toEqual(result);
});
for (const action of ["read", "save"] as const)
  it(`REMROLE026 nonOWNER ${action} remains denied without effects`, async () => {
    await db
      .doc(`staffAccess/${uid}`)
      .set({ active: true, locked: false, roles: ["SUPPORT", "FUTURE_ROLE"] });
    const before = await snapshot();
    await expect(
      invoke(action === "read" ? { action } : save()),
    ).rejects.toMatchObject({ code: "permission-denied" });
    expect(await snapshot()).toEqual(before);
  });
afterAll(async () => {
  await db.terminate();
  await deleteApp(getApp());
});

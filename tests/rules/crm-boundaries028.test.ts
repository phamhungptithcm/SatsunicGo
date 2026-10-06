import { initializeApp, deleteApp, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";
import { beforeAll, beforeEach, afterAll, it, expect } from "vitest";
import type { CallableRequest } from "firebase-functions/v2/https";

let db: ReturnType<typeof getFirestore>;
let crm: typeof import("../../functions/src/crm");
let workspace: typeof import("../../functions/src/workspace");
const uid = "boundary028-owner";
const target = `boundary028-${randomUUID()}`.padEnd(128, "a");
const auth = {
  uid,
  token: { email_verified: true, firebase: { sign_in_provider: "google.com" } },
};
const request = (data: unknown) => ({ auth, data }) as CallableRequest;
beforeAll(async () => {
  initializeApp({
    projectId: `demo-satsunicgo-bound-${randomUUID().slice(0, 8)}`,
  });
  db = getFirestore();
  crm = await import("../../functions/src/crm");
  workspace = await import("../../functions/src/workspace");
  await db
    .doc(`users/${target}`)
    .set({
      displayName: "Synthetic boundary customer",
      ownerId: target,
      locked: false,
    });
});
beforeEach(async () => {
  await db
    .doc(`staffAccess/${uid}`)
    .set({ active: true, locked: false, roles: ["OWNER"] });
  await db.doc(`users/${uid}`).set({ ownerId: uid, locked: false });
});
it("exact customer ID128 returns its authorized projection", async () => {
  const result = await crm.listCustomers.run(
    request({ mode: "id", search: target }),
  );
  expect(result.rows.map((row: { id: string }) => row.id)).toEqual([target]);
  expect(result.next).toBeNull();
});
it("name120 stays valid while name121 and ID129 are rejected", async () => {
  expect(
    (
      await crm.listCustomers.run(
        request({ mode: "name", search: "x".repeat(120) }),
      )
    ).rows,
  ).toEqual([]);
  for (const data of [
    { mode: "name", search: "x".repeat(121) },
    { mode: "id", search: target + "a" },
  ])
    await expect(crm.listCustomers.run(request(data))).rejects.toMatchObject({
      code: "invalid-argument",
    });
});
it("exact customer ID128 still requires current CRM authority", async () => {
  await db.doc(`staffAccess/${uid}`).update({ active: false });
  await expect(
    crm.listCustomers.run(request({ mode: "id", search: target })),
  ).rejects.toMatchObject({ code: "permission-denied" });
});
const staffInput = () => ({
  action: "saveStaffAccess",
  id: target,
  expectedVersion: 1,
  operationId: randomUUID(),
  payload: { active: true, locked: false, roles: ["SUPPORT"], orderIds: [] },
});
it("inspected staff ID128 saves with CAS and exact replay, then rejects stale new operations", async () => {
  await db
    .doc(`staffAccess/${target}`)
    .set({ active: true, roles: ["SUPPORT"], version: 1 });
  expect(
    (await workspace.readStaffAccess.run(request({ id: target }))).access,
  ).toMatchObject({ version: 1, active: true, roles: ["SUPPORT"] });
  const input = staffInput();
  const result = await workspace.workspaceCommand.run(request(input));
  expect(result.version).toBe(2);
  expect(await workspace.workspaceCommand.run(request(input))).toEqual(result);
  await expect(
    workspace.workspaceCommand.run(request(staffInput())),
  ).rejects.toMatchObject({ code: "aborted" });
  expect((await db.doc(`staffAccess/${target}`).get()).get("version")).toBe(2);
  await db.doc(`staffAccess/${uid}`).update({ active: false });
  await expect(
    workspace.workspaceCommand.run(request(input)),
  ).rejects.toMatchObject({ code: "permission-denied" });
});
it("staff129 and non-staff81 IDs remain invalid without operation receipts", async () => {
  for (const input of [
    { ...staffInput(), id: target + "a" },
    {
      ...staffInput(),
      action: "openTicket",
      id: "x".repeat(81),
      payload: { subject: "Synthetic boundary", message: "Synthetic message" },
    },
  ]) {
    await expect(
      workspace.workspaceCommand.run(request(input)),
    ).rejects.toMatchObject({ code: "invalid-argument" });
    expect(
      (await db.doc(`idempotencyKeys/${uid}-${input.operationId}`).get())
        .exists,
    ).toBe(false);
  }
});
it("outbox continuation accepts an actual generated84-character cursor without duplicate or missing rows", async () => {
  const ids = Array.from(
    { length: 31 },
    () => `conversation-staff-${"a".repeat(28)}-${randomUUID()}`,
  );
  expect(ids.every((id) => id.length === 84)).toBe(true);
  const batch = db.batch();
  ids.forEach((id, index) =>
    batch.set(db.doc(`outboxJobs/${id}`), {
      createdAt: 1000 + index,
      action: "Synthetic boundary",
      state: "inAppDelivered",
      emailState: "unknown",
      version: 1,
    }),
  );
  await batch.commit();
  const first = await workspace.listWork.run(request({ kind: "outboxJobs" }));
  expect(first.rows).toHaveLength(30);
  expect(first.next).toHaveLength(84);
  const second = await workspace.listWork.run(
    request({ kind: "outboxJobs", after: first.next }),
  );
  expect(second.rows).toHaveLength(1);
  expect(second.next).toBeNull();
  expect(
    [...first.rows, ...second.rows].map((row: { id: string }) => row.id).sort(),
  ).toEqual(ids.sort());
});
it("outbox cursor rejects document paths and257 characters, other queues retain80", async () => {
  for (const data of [
    { kind: "outboxJobs", after: "nested/path" },
    { kind: "outboxJobs", after: "x".repeat(257) },
    { kind: "supportTickets", after: "x".repeat(81) },
  ])
    await expect(workspace.listWork.run(request(data))).rejects.toMatchObject({
      code: "invalid-argument",
    });
});
afterAll(async () => {
  await db.terminate();
  await deleteApp(getApp());
});

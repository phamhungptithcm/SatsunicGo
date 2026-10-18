import { randomUUID, createHash } from "node:crypto";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import type { CallableRequest } from "firebase-functions/v2/https";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";
import {
  runInvitationCommand,
  runListInvitations,
  runListStaffMembers,
  runDepartStaffMember,
  runRecipientInvitation,
  invitationRef,
} from "../../functions/src/staff-invitations";
import { deliverStaffInvitationJob } from "../../functions/src/staff-invitation-email";
import { INVITATION_TTL } from "../../packages/domain/staff-invitation";

if (
  process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:18207" ||
  process.env.GCLOUD_PROJECT !== "demo-satsunicgo" ||
  process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:19207"
)
  throw Error("Only shared demo emulator is allowed");
const app = initializeApp({ projectId: "demo-satsunicgo" });
const actual = getFirestore(app),
  owned = new Set<string>(),
  run = randomUUID();
const db = new Proxy(actual, {
  get(target, prop) {
    if (prop === "doc")
      return (path: string) => {
        owned.add(path);
        return actual.doc(path);
      };
    const value = Reflect.get(target, prop);
    return typeof value === "function" ? value.bind(target) : value;
  },
});

const digestFixture = (value: string) =>
  createHash("sha256").update(value).digest("hex");
function ownsCleanupPath(path: string) {
  const [collection, key] = path.split("/");
  if (["users", "staffAccess"].includes(collection))
    return actors.includes(key);
  if (collection === "staffInvitations")
    return (
      ids.some((id) => key === `invite-${id}`) ||
      actors.some((uid) => key === `quota-${digestFixture(uid)}`) ||
      emails.some((email) => key === `email-${digestFixture(email)}`)
    );
  if (collection === "staffInvitationMailJobs")
    return ids.some((id) => key.startsWith(`${id}-`));
  if (collection === "idempotencyKeys")
    return actors.some(
      (uid) =>
        key.startsWith(`${uid}-`) ||
        key.startsWith(`staff-invite-${uid}-`) ||
        key.startsWith(`staff-depart-${uid}-`),
    );
  return collection === "auditEvents" && owned.has(path); // Added only by exact actor query below.
}
const preservation = new Map<string, string>();
async function captureSharedProfiles() {
  for (const collection of ["users", "staffAccess"])
    for (const doc of (await actual.collection(collection).get()).docs) {
      if (!/^(staff-qa-|staff-browser-|staff-legacy-)/.test(doc.id))
        preservation.set(
          doc.ref.path,
          digestFixture(JSON.stringify(doc.data())),
        );
    }
}
async function checkSharedProfiles() {
  for (const [path, hash] of preservation) {
    const doc = await actual.doc(path).get();
    expect(
      doc.exists && digestFixture(JSON.stringify(doc.data())) === hash,
      "Shared demo profile changed outside fixture ownership",
    ).toBe(true);
  }
}

let workspaceCommand: (typeof import("../../functions/src/workspace"))["workspaceCommand"];
const authFixtures: string[] = [];
const actors: string[] = [],
  ids: string[] = [],
  emails: string[] = [];
const now = () => Date.now();
function auth(uid: string, email: string, owner = false) {
  return {
    uid,
    token: {
      email,
      email_verified: true,
      auth_time: Math.floor(now() / 1000),
      firebase: {
        sign_in_provider: "google.com",
        ...(owner ? { sign_in_second_factor: "totp" } : {}),
      },
    },
  } as CallableRequest["auth"];
}
async function fixture() {
  const suffix = randomUUID(),
    owner = `staff-qa-owner-${suffix}`,
    employee = `staff-qa-employee-${suffix}`,
    email = `${suffix}@example.invalid`;
  actors.push(owner, employee);
  emails.push(email);
  owned.add(`staffAccess/${employee}`);
  await db
    .doc(`staffAccess/${owner}`)
    .set({ roles: ["OWNER"], active: true, locked: false, version: 1 });
  await db.doc(`users/${owner}`).set({ locked: false });
  const ownerAuth = auth(owner, `owner-${suffix}@example.invalid`, true),
    employeeAuth = auth(employee, email);
  const create = async (operationId = randomUUID()) => {
    const result = await runInvitationCommand(db, {
      auth: ownerAuth,
      data: { action: "create", email, operationId },
    });
    ids.push(result.id);
    return result.id;
  };
  return { owner, employee, email, ownerAuth, employeeAuth, create };
}
const recipient = (id: string, who: CallableRequest["auth"]) => ({
  auth: who,
  data: { id },
});
const grant = (
  id: string | undefined,
  uid: string,
  ownerAuth: CallableRequest["auth"],
  operationId = randomUUID(),
  extra = {},
) =>
  workspaceCommand.run({
    auth: ownerAuth,
    data: {
      action: "saveStaffAccess",
      id: uid,
      operationId,
      ...(id ? { invitationId: id } : {}),
      payload: {
        roles: ["SUPPORT"],
        active: true,
        locked: false,
        orderIds: [],
      },
      ...extra,
    },
  } as CallableRequest);
beforeAll(async () => {
  await captureSharedProfiles();
  workspaceCommand = (await import("../../functions/src/workspace"))
    .workspaceCommand;
});
afterAll(async () => {
  for (const actor of actors) {
    for (const collection of ["auditEvents", "idempotencyKeys"]) {
      const field = collection === "auditEvents" ? "actor" : "unused";
      if (field === "actor")
        for (const d of (
          await actual.collection(collection).where(field, "==", actor).get()
        ).docs)
          owned.add(d.ref.path);
    }
  }
  // Exact UID-prefixed command operation receipts; bounded to this test run's known actors.
  for (const actor of actors) {
    const docs = await actual
      .collection("idempotencyKeys")
      .orderBy("__name__")
      .startAt(`${actor}-`)
      .endBefore(`${actor}-~`)
      .get();
    for (const d of docs.docs) owned.add(d.ref.path);
  }
  await Promise.all(
    [...owned].filter(ownsCleanupPath).map((path) => actual.doc(path).delete()),
  );
  for (const uid of authFixtures) await getAuth(app).deleteUser(uid);
  await checkSharedProfiles();
  await actual.terminate();
  await deleteApp(app);
});
describe("staff invitations real Firestore lifecycle (no network email)", () => {
  test("invite → simulated provider acceptance → Google recipient accept → owner grant", async () => {
    const f = await fixture(),
      id = await f.create();
    const send = vi.fn(
      async (
        _message: { to: string; text: string },
        _job: string,
        fence: () => Promise<boolean>,
      ) => {
        expect(await fence()).toBe(true);
        return { state: "accepted" as const, providerId: run, attempted: true };
      },
    );
    await deliverStaffInvitationJob({
      db,
      jobId: `${id}-1`,
      from: "contact@hunpeolabs.com",
      send,
    });
    expect(send).toHaveBeenCalledOnce();
    expect(send.mock.calls[0][0].to).toBe(f.email);
    expect(send.mock.calls[0][0].text).toContain(`/join-staff?id=${id}`);
    await expect(grant(id, f.employee, f.ownerAuth)).rejects.toMatchObject({
      code: "failed-precondition",
    });
    expect(
      await runRecipientInvitation(db, recipient(id, f.employeeAuth), false),
    ).toEqual({ state: "pending" });
    expect((await db.doc(`staffAccess/${f.employee}`).get()).exists).toBe(
      false,
    );
    expect(
      await runRecipientInvitation(db, recipient(id, f.employeeAuth), true),
    ).toEqual({ state: "accepted" });
    expect((await db.doc(`staffAccess/${f.employee}`).get()).exists).toBe(
      false,
    );
    await grant(id, f.employee, f.ownerAuth);
    expect(
      (await db.doc(`staffAccess/${f.employee}`).get()).data(),
    ).toMatchObject({ roles: ["SUPPORT"], active: true, version: 1 });
  });
  test("owner authority and recent MFA are checked before mutation and replay", async () => {
    const f = await fixture(),
      operationId = randomUUID(),
      id = await f.create(operationId);
    await expect(
      runInvitationCommand(db, {
        auth: f.employeeAuth,
        data: { action: "create", email: f.email, operationId: randomUUID() },
      }),
    ).rejects.toMatchObject({ code: "permission-denied" });
    await expect(
      runInvitationCommand(db, {
        auth: auth(f.owner, "owner@example.invalid"),
        data: { action: "create", email: f.email, operationId },
      }),
    ).rejects.toMatchObject({ code: "failed-precondition" });
    await db.doc(`staffAccess/${f.owner}`).update({ active: false });
    await expect(f.create(operationId)).rejects.toMatchObject({
      code: "permission-denied",
    });
    expect((await invitationRef(db, id).get()).get("state")).toBe("pending");
  });
  test("ten concurrent create retries produce one invitation and one mail job", async () => {
    const f = await fixture(),
      operationId = randomUUID();
    const results = await Promise.all(
      Array.from({ length: 10 }, () => f.create(operationId)),
    );
    expect(new Set(results).size).toBe(1);
    await expect(f.create()).rejects.toMatchObject({ code: "already-exists" });
    const jobs = await actual
      .collection("staffInvitationMailJobs")
      .where("invitationId", "==", results[0])
      .get();
    expect(jobs.size).toBe(1);
  });
  test("wrong/unverified identities, anonymous readers and locked accounts cannot accept", async () => {
    const f = await fixture(),
      id = await f.create();
    await expect(
      runRecipientInvitation(db, recipient(id, undefined), true),
    ).rejects.toMatchObject({ code: "unauthenticated" });
    await expect(
      runRecipientInvitation(db, recipient(id, f.ownerAuth), true),
    ).rejects.toMatchObject({ code: "permission-denied" });
    await expect(
      runRecipientInvitation(
        db,
        recipient(id, {
          ...f.employeeAuth!,
          token: { ...f.employeeAuth!.token, email_verified: false },
        }),
        true,
      ),
    ).rejects.toMatchObject({ code: "permission-denied" });
    await db.doc(`users/${f.employee}`).set({ locked: true });
    await expect(
      runRecipientInvitation(db, recipient(id, f.employeeAuth), true),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });
  test("accept is idempotent, binds one UID and cannot be stolen by another UID with same email", async () => {
    const f = await fixture(),
      id = await f.create();
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        runRecipientInvitation(db, recipient(id, f.employeeAuth), true),
      ),
    );
    expect(results.every((r) => r.state === "accepted")).toBe(true);
    expect((await invitationRef(db, id).get()).get("version")).toBe(2);
    await expect(
      runRecipientInvitation(
        db,
        recipient(id, auth(`other-${run}`, f.email)),
        true,
      ),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });
  test("expired and revoked invitations reject acceptance; revocation stops queued mail", async () => {
    const f = await fixture(),
      id = await f.create();
    await expect(
      runRecipientInvitation(
        db,
        recipient(id, f.employeeAuth),
        true,
        now() + INVITATION_TTL,
      ),
    ).rejects.toMatchObject({ code: "failed-precondition" });
    await runInvitationCommand(db, {
      auth: f.ownerAuth,
      data: { action: "revoke", id, version: 1, operationId: randomUUID() },
    });
    await expect(
      runRecipientInvitation(db, recipient(id, f.employeeAuth), true),
    ).rejects.toMatchObject({ code: "failed-precondition" });
    const send = vi.fn();
    await deliverStaffInvitationJob({
      db,
      jobId: `${id}-1`,
      from: "contact@hunpeolabs.com",
      send,
    });
    expect(send).not.toHaveBeenCalled();
    expect(
      (await db.doc(`staffInvitationMailJobs/${id}-1`).get()).get("state"),
    ).toBe("cancelled");
  });
  test("accept/revoke race has one winner and cannot leave accepted state revoked", async () => {
    const f = await fixture(),
      id = await f.create();
    const results = await Promise.allSettled([
      runRecipientInvitation(db, recipient(id, f.employeeAuth), true),
      runInvitationCommand(db, {
        auth: f.ownerAuth,
        data: { action: "revoke", id, version: 1, operationId: randomUUID() },
      }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(["accepted", "revoked"]).toContain(
      (await invitationRef(db, id).get()).get("state"),
    );
  });
  test("concurrent workers dispatch once; provider unknown prevents automatic and manual resend", async () => {
    const f = await fixture(),
      id = await f.create();
    const send = vi.fn().mockResolvedValue({
      state: "unknown",
      reason: "provider_unknown",
      attempted: true,
    });
    await Promise.all(
      Array.from({ length: 5 }, () =>
        deliverStaffInvitationJob({
          db,
          jobId: `${id}-1`,
          from: "contact@hunpeolabs.com",
          send,
        }),
      ),
    );
    expect(send).toHaveBeenCalledOnce();
    await deliverStaffInvitationJob({
      db,
      jobId: `${id}-1`,
      from: "contact@hunpeolabs.com",
      send,
    });
    await expect(
      runInvitationCommand(db, {
        auth: f.ownerAuth,
        data: { action: "resend", id, version: 1, operationId: randomUUID() },
      }),
    ).rejects.toMatchObject({ code: "failed-precondition" });
    expect(send).toHaveBeenCalledOnce();
  });
  test("definitive failure permits resend only after cooldown and correct version", async () => {
    const f = await fixture(),
      id = await f.create();
    const send = vi.fn().mockResolvedValue({
      state: "rejected",
      reason: "provider_rejected",
      attempted: true,
    });
    await deliverStaffInvitationJob({
      db,
      jobId: `${id}-1`,
      from: "contact@hunpeolabs.com",
      send,
    });
    const data = {
      action: "resend",
      id,
      version: 1,
      operationId: randomUUID(),
    };
    await expect(
      runInvitationCommand(db, { auth: f.ownerAuth, data }),
    ).rejects.toMatchObject({ code: "resource-exhausted" });
    await expect(
      runInvitationCommand(db, {
        auth: f.ownerAuth,
        data: { ...data, version: 9 },
      }),
    ).rejects.toMatchObject({ code: "aborted" });
    await runInvitationCommand(db, { auth: f.ownerAuth, data }, now() + 61_000);
    expect((await invitationRef(db, id).get()).get("jobId")).toBe(`${id}-2`);
  });
  test("deferred quota retries preserve queue and do not exhaust attempts when no send occurred", async () => {
    const f = await fixture(),
      id = await f.create(),
      time = now();
    const send = vi.fn().mockResolvedValue({
      state: "deferred",
      reason: "daily_limit",
      retryAt: time + 60_000,
      attempted: false,
    });
    await deliverStaffInvitationJob({
      db,
      jobId: `${id}-1`,
      from: "contact@hunpeolabs.com",
      send,
      now: () => time,
    });
    expect(
      (await db.doc(`staffInvitationMailJobs/${id}-1`).get()).data(),
    ).toMatchObject({ state: "queued", attempts: 0 });
    await deliverStaffInvitationJob({
      db,
      jobId: `${id}-1`,
      from: "contact@hunpeolabs.com",
      send,
      now: () => time + 1000,
    });
    expect(send).toHaveBeenCalledOnce();
  });
  test("stale in-flight claims become unknown and are never automatically resent", async () => {
    const f = await fixture(),
      id = await f.create();
    await db
      .doc(`staffInvitationMailJobs/${id}-1`)
      .update({ state: "sending", claimedAt: now() - 400_000 });
    const send = vi.fn();
    await deliverStaffInvitationJob({
      db,
      jobId: `${id}-1`,
      from: "contact@hunpeolabs.com",
      send,
    });
    expect(send).not.toHaveBeenCalled();
    expect(
      (await db.doc(`staffInvitationMailJobs/${id}-1`).get()).get("state"),
    ).toBe("unknown");
  });
  test("new grants cannot bypass invitation or use another accepted UID; legacy staff still editable", async () => {
    const f = await fixture(),
      id = await f.create();
    await expect(
      grant(undefined, f.employee, f.ownerAuth),
    ).rejects.toMatchObject({ code: "failed-precondition" });
    await runRecipientInvitation(db, recipient(id, f.employeeAuth), true);
    await expect(grant(id, `other-${run}`, f.ownerAuth)).rejects.toMatchObject({
      code: "failed-precondition",
    });
    await db
      .doc(`staffAccess/${f.employee}`)
      .set({ roles: ["BUYER"], active: true, locked: false, version: 3 });
    await grant(undefined, f.employee, f.ownerAuth, randomUUID(), {
      expectedVersion: 3,
    });
    expect(
      (await db.doc(`staffAccess/${f.employee}`).get()).get("version"),
    ).toBe(4);
    await expect(
      grant(undefined, f.employee, f.ownerAuth, randomUUID(), {
        expectedVersion: 3,
      }),
    ).rejects.toMatchObject({ code: "aborted" });
  });
  test("grant replay cannot reactivate revoked staff and owner cannot self-lock", async () => {
    const f = await fixture(),
      id = await f.create(),
      operationId = randomUUID();
    await runRecipientInvitation(db, recipient(id, f.employeeAuth), true);
    await grant(id, f.employee, f.ownerAuth, operationId);
    await db
      .doc(`staffAccess/${f.employee}`)
      .update({ active: false, version: 2 });
    await grant(id, f.employee, f.ownerAuth, operationId);
    expect(
      (await db.doc(`staffAccess/${f.employee}`).get()).get("active"),
    ).toBe(false);
    await expect(grant(undefined, f.owner, f.ownerAuth)).rejects.toMatchObject({
      code: "failed-precondition",
    });
  });
  test("owner-only listing exposes no internal lock/quota rows and reflects grants", async () => {
    const f = await fixture(),
      id = await f.create();
    await expect(
      runListInvitations(db, { auth: f.employeeAuth, data: {} }),
    ).rejects.toMatchObject({ code: "permission-denied" });
    let after: string | undefined, found;
    do {
      const page = await runListInvitations(db, {
        auth: f.ownerAuth,
        data: after ? { after } : {},
      });
      expect(page.items.every((i) => /^[0-9a-f-]{36}$/.test(i.id))).toBe(true);
      found = page.items.find((i) => i.id === id);
      after = page.next ?? undefined;
    } while (after && !found);
    expect(found).toMatchObject({
      email: f.email,
      state: "pending",
      delivery: "queued",
      hasAccess: false,
    });
  });
});

describe("staff review regressions and complete directory", () => {
  test("superseded expired invitation cannot be resent", async () => {
    const f = await fixture(),
      id = await f.create();
    await db.doc(`staffInvitationMailJobs/${id}-1`).update({ state: "failed" });
    await invitationRef(db, id).update({ expiresAt: now() - 1 });
    await db
      .doc(
        `staffInvitations/quota-${(await import("node:crypto")).createHash("sha256").update(f.owner).digest("hex")}`,
      )
      .update({ lastAt: now() - 6000 });
    const replacement = await f.create();
    expect(replacement).not.toBe(id);
    await expect(
      runInvitationCommand(
        db,
        {
          auth: f.ownerAuth,
          data: { action: "resend", id, version: 1, operationId: randomUUID() },
        },
        now() + 61_000,
      ),
    ).rejects.toMatchObject({ code: "failed-precondition" });
  });
  test("replacement owner can resend after original inviter loses authority", async () => {
    const f = await fixture(),
      replacement = await fixture(),
      id = await f.create();
    await db.doc(`staffInvitationMailJobs/${id}-1`).update({ state: "failed" });
    await db.doc(`staffAccess/${f.owner}`).update({ active: false });
    await runInvitationCommand(
      db,
      {
        auth: replacement.ownerAuth,
        data: { action: "resend", id, version: 1, operationId: randomUUID() },
      },
      now() + 61_000,
    );
    const send = vi.fn().mockResolvedValue({
      state: "accepted",
      providerId: randomUUID(),
      attempted: true,
    });
    await deliverStaffInvitationJob({
      db,
      jobId: `${id}-2`,
      from: "contact@hunpeolabs.com",
      send,
      now: () => now() + 61_000,
    });
    expect(send).toHaveBeenCalledOnce();
    expect((await invitationRef(db, id).get()).get("createdBy")).toBe(f.owner);
  });
  test("directory includes legacy inactive staff and accepted unassigned employees without invented dates", async () => {
    const f = await fixture(),
      id = await f.create();
    await runRecipientInvitation(db, recipient(id, f.employeeAuth), true);
    const legacy = `staff-legacy-${randomUUID()}`;
    actors.push(legacy);
    await db
      .doc(`staffAccess/${legacy}`)
      .set({ roles: ["BUYER"], active: false, locked: true, version: 1 });
    await db
      .doc(`users/${legacy}`)
      .set({ displayName: "Nhân viên cũ", email: `${legacy}@example.invalid` });
    const all = [];
    let after: string | undefined;
    do {
      const result = await runListStaffMembers(db, {
        auth: f.ownerAuth,
        data: after ? { after } : {},
      });
      all.push(...result.members);
      after = result.next ?? undefined;
    } while (after);
    expect(all.find((row) => row.uid === legacy)).toMatchObject({
      fullName: "Nhân viên cũ",
      roles: ["BUYER"],
      active: false,
      locked: true,
      joinedAt: null,
      departedAt: null,
    });
    expect(all.find((row) => row.uid === f.employee)).toMatchObject({
      email: f.email,
      roles: [],
      invitationId: id,
      active: false,
    });
    await expect(
      runListStaffMembers(db, { auth: f.employeeAuth, data: {} }),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });
  test("departure writes date and stops access atomically; temporary lock does not create a departure", async () => {
    const f = await fixture(),
      id = await f.create();
    await runRecipientInvitation(db, recipient(id, f.employeeAuth), true);
    await grant(id, f.employee, f.ownerAuth);
    expect(
      (await db.doc(`staffAccess/${f.employee}`).get()).get("joinedAt"),
    ).toBeTypeOf("number");
    await db.doc(`staffAccess/${f.employee}`).update({ locked: true });
    expect(
      (await db.doc(`staffAccess/${f.employee}`).get()).get("departedAt"),
    ).toBeUndefined();
    const data = {
      uid: f.employee,
      expectedVersion: 1,
      operationId: randomUUID(),
    };
    await expect(
      runDepartStaffMember(db, { auth: f.employeeAuth, data }),
    ).rejects.toMatchObject({ code: "permission-denied" });
    const result = await runDepartStaffMember(db, { auth: f.ownerAuth, data });
    expect(await runDepartStaffMember(db, { auth: f.ownerAuth, data })).toEqual(
      result,
    );
    expect(
      (await db.doc(`staffAccess/${f.employee}`).get()).data(),
    ).toMatchObject({
      active: false,
      departedAt: result.departedAt,
      version: 2,
    });
    await expect(
      grant(id, f.employee, f.ownerAuth, randomUUID(), { expectedVersion: 2 }),
    ).rejects.toMatchObject({ code: "failed-precondition" });
    await expect(
      runDepartStaffMember(db, {
        auth: f.ownerAuth,
        data: { ...data, uid: f.owner, operationId: randomUUID() },
      }),
    ).rejects.toMatchObject({ code: "failed-precondition" });
  });
});

test("directory takes Google provider name and avatar ahead of stale profile fields", async () => {
  const f = await fixture();
  await getAuth(app).createUser({
    uid: f.employee,
    email: f.email,
    displayName: "Tên tài khoản cũ",
    photoURL: "https://lh3.googleusercontent.com/a/demo-staff-avatar",
  });
  authFixtures.push(f.employee);
  await getAuth(app).updateUser(f.employee, {
    providerToLink: {
      providerId: "google.com",
      uid: f.employee,
      email: f.email,
      displayName: "Nguyễn Minh An",
      photoURL: "https://lh3.googleusercontent.com/a/demo-staff-avatar",
    },
  });
  await db
    .doc(`staffAccess/${f.employee}`)
    .set({ roles: ["SUPPORT"], active: true, version: 1 });
  await db
    .doc(`users/${f.employee}`)
    .set({ displayName: "Tên hồ sơ cũ", email: f.email });
  let member;
  let after: string | undefined;
  do {
    const page = await runListStaffMembers(db, {
      auth: f.ownerAuth,
      data: after ? { after } : {},
    });
    member = page.members.find((row) => row.uid === f.employee);
    after = page.next ?? undefined;
  } while (!member && after);
  expect(member).toMatchObject({
    fullName: "Nguyễn Minh An",
    avatarUrl: "https://lh3.googleusercontent.com/a/demo-staff-avatar",
  });
});

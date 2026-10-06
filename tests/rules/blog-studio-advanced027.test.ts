import { initializeApp, getApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { beforeAll, beforeEach, afterAll, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import type { CallableRequest } from "firebase-functions/v2/https";
import { emptyStudioDraft } from "../../packages/domain/blog-studio";
let db: ReturnType<typeof getFirestore>,
  core: typeof import("../../functions/src/blog-studio"),
  advanced: typeof import("../../functions/src/blog-studio-advanced");
const prefix = `advanced027-${randomUUID().slice(0, 8)}`,
  owner = `${prefix}-owner`,
  author = `${prefix}-author`;
let id: string;
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
function command(
  action: string,
  payload: unknown,
  expectedVersion?: number,
  targetId?: string,
  operationId = randomUUID(),
) {
  return advanced.studioAdvancedCommand.run(
    req(owner, {
      action,
      payload,
      operationId,
      ...(targetId ? { id: targetId } : {}),
      ...(expectedVersion !== undefined ? { expectedVersion } : {}),
    }),
  );
}
const draft = () => ({
  ...emptyStudioDraft,
  title: "Synthetic advanced",
  summary: "Synthetic summary",
  slug: id,
  category: "Synthetic category",
  sources: [{ title: "Synthetic source", url: "https://example.com/source" }],
  authorId: owner,
  body: {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: "Synthetic text" }],
      },
    ],
  },
});
beforeAll(async () => {
  initializeApp({
    projectId: `demo-satsunicgo-advanced-${randomUUID().slice(0, 8)}`,
  });
  db = getFirestore();
  core = await import("../../functions/src/blog-studio");
  advanced = await import("../../functions/src/blog-studio-advanced");
  await getAuth().importUsers(
    [owner, author].map((uid) => ({
      uid,
      email: `${uid}@example.com`,
      emailVerified: true,
      displayName: "Synthetic member",
      providerData: [
        { providerId: "google.com", uid, email: `${uid}@example.com` },
      ],
    })),
  );
});
beforeEach(async () => {
  id = `${prefix}-${randomUUID().slice(0, 8)}`;
  await Promise.all([
    db
      .doc(`users/${owner}`)
      .set({ locked: false, displayName: "Synthetic owner" }),
    db
      .doc(`users/${author}`)
      .set({ locked: false, displayName: "Synthetic author" }),
    db.doc(`staffAccess/${owner}`).set({ active: true, roles: ["OWNER"] }),
    db
      .doc(`staffAccess/${author}`)
      .set({ active: true, roles: ["CONTENT_EDITOR"] }),
    db.doc(`blogEditorialMembers/${author}`).delete(),
    db.doc("blogStudioSettings/main").set({
      commentsEnabled: true,
      requireReview: false,
      authors: [{ id: owner, name: "Synthetic author", bio: "" }],
      categories: ["Synthetic category"],
      revision: 1,
    }),
    getAuth().updateUser(owner, { disabled: false }),
  ]);
});
it("ADVANCED027 normalized concurrent category create has one identity", async () => {
  const name = `Synthetic category ${randomUUID()}`,
    r = await Promise.all([
      command("categoryCreate", { name }),
      command("categoryCreate", { name: name.toUpperCase() }),
    ]);
  expect(r[0].category.id).toBe(r[1].category.id);
  const docs = await db
    .collection("blogCategories")
    .where("name", "==", r[0].category.name)
    .get();
  expect(docs.size).toBe(1);
});
it("ADVANCED027 isolated member revoke tombstone denies core and leavesCRMroles untouched", async () => {
  await command(
    "memberSave",
    { targetUid: author, role: "author", active: true },
    1,
  );
  const staff = (await db.doc(`staffAccess/${author}`).get()).data();
  await command("memberRevoke", { targetUid: author }, 2);
  expect(
    (await db.doc(`blogEditorialMembers/${author}`).get()).get("active"),
  ).toBe(false);
  expect((await db.doc(`staffAccess/${author}`).get()).data()).toEqual(staff);
  await expect(
    core.studioCommand.run(
      req(author, {
        action: "create",
        operationId: randomUUID(),
        payload: draft(),
      }),
    ),
  ).rejects.toMatchObject({ code: "permission-denied" });
});
it("ADVANCED027 author cannot read foreign draft or publish/reassign", async () => {
  await command("memberSave", { targetUid: author, role: "author" }, 1);
  await core.studioCommand.run(
    req(owner, {
      action: "create",
      id,
      operationId: randomUUID(),
      payload: draft(),
    }),
  );
  await expect(
    core.studioRead.run(req(author, { kind: "get", id })),
  ).rejects.toMatchObject({ code: "permission-denied" });
  const own = await core.studioCommand.run(
    req(author, {
      action: "create",
      operationId: randomUUID(),
      payload: { ...draft(), assignee: author },
    }),
  );
  await expect(
    core.studioCommand.run(
      req(author, {
        action: "publish",
        id: own.draft.id,
        expectedVersion: 1,
        operationId: randomUUID(),
      }),
    ),
  ).rejects.toMatchObject({ code: "permission-denied" });
  await expect(
    core.studioCommand.run(
      req(author, {
        action: "save",
        id: own.draft.id,
        expectedVersion: 1,
        operationId: randomUUID(),
        payload: { ...draft(), assignee: owner },
      }),
    ),
  ).rejects.toMatchObject({ code: "permission-denied" });
});
it("ADVANCED027 schedule safe projection and cancel body no public mutation", async () => {
  await core.studioCommand.run(
    req(owner, {
      action: "create",
      id,
      operationId: randomUUID(),
      payload: draft(),
    }),
  );
  await core.studioCommand.run(
    req(owner, {
      action: "schedule",
      id,
      expectedVersion: 1,
      operationId: randomUUID(),
      payload: { dueAt: new Date(Date.now() + 120000).toISOString() },
    }),
  );
  const r = await core.studioRead.run(req(owner, { kind: "get", id }));
  expect(r.schedule).not.toHaveProperty("actor");
  expect(r.schedule).not.toHaveProperty("operationId");
  await command("cancelSchedule", undefined, 2, id);
  expect((await db.doc(`blogSchedules/${id}`).get()).exists).toBe(false);
  expect((await db.doc(`blogPublished/${id}`).get()).exists).toBe(false);
});
it("ADVANCED027 disabled FirebaseAuth actor cannot scheduledpublish, jobretired", async () => {
  await core.studioCommand.run(
    req(owner, {
      action: "create",
      id,
      operationId: randomUUID(),
      payload: draft(),
    }),
  );
  await core.studioCommand.run(
    req(owner, {
      action: "schedule",
      id,
      expectedVersion: 1,
      operationId: randomUUID(),
      payload: { dueAt: new Date(Date.now() + 120000).toISOString() },
    }),
  );
  await db
    .doc(`blogSchedules/${id}`)
    .update({ dueAt: new Date(Date.now() - 1000).toISOString() });
  await getAuth().updateUser(owner, { disabled: true });
  const results = await core.publishDueStudioPosts(db);
  expect(results.find((r) => r.id === id)?.status).toBe("blocked");
  expect(
    (await db.doc(`blogSchedules/${id}`).get()).get("dueAt"),
  ).toBeUndefined();
  expect((await db.doc(`blogPublished/${id}`).get()).exists).toBe(false);
});
it("ADVANCED027 stale domain revision job is blocked instead of starving due queue", async () => {
  await core.studioCommand.run(
    req(owner, {
      action: "create",
      id,
      operationId: randomUUID(),
      payload: draft(),
    }),
  );
  await db.doc(`blogSchedules/${id}`).set({
    actor: owner,
    postId: id,
    revision: 99,
    dueAt: new Date(Date.now() - 1000).toISOString(),
    operationId: randomUUID(),
  });
  await core.publishDueStudioPosts(db);
  const job = await db.doc(`blogSchedules/${id}`).get();
  expect(job.get("status")).toBe("blocked");
  expect(job.get("code")).toBe("aborted");
  expect(job.get("dueAt")).toBeUndefined();
});
it("ADVANCED027 moderation cannot approve unpublished or invalidparent and hidesprivateUID", async () => {
  const commentId = `${prefix}-comment`;
  await db.doc(`blogComments/${commentId}`).set({
    id: commentId,
    uid: author,
    postId: id,
    parentId: "",
    name: "Synthetic",
    text: "Synthetic",
    status: "pending",
    revision: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  await expect(
    core.studioCommand.run(
      req(owner, {
        action: "moderate",
        id: commentId,
        expectedVersion: 1,
        operationId: randomUUID(),
        payload: { status: "approved" },
      }),
    ),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  await db
    .doc(`blogPublished/${id}`)
    .set({ status: "published", commentCount: 0 });
  const r = await core.studioCommand.run(
    req(owner, {
      action: "moderate",
      id: commentId,
      expectedVersion: 1,
      operationId: randomUUID(),
      payload: { status: "approved" },
    }),
  );
  expect(r.comment).not.toHaveProperty("uid");
  const queue = await core.studioRead.run(
    req(owner, { kind: "moderation", status: "approved" }),
  );
  if (!queue.items) throw new Error("Moderation response must contain items");
  const approvedComment = queue.items.find(
    (c: { id: string }) => c.id === commentId,
  );
  expect(approvedComment).toBeDefined();
  expect(approvedComment).not.toHaveProperty("uid");
});
afterAll(async () => {
  await getAuth().deleteUsers([owner, author]);
  await db.terminate();
  await deleteApp(getApp());
});

it("ADVANCED027 email invitation binds actor beforeauthorread and revocation persists", async () => {
  const email = `${author}@example.com`;
  const inviteKey = (await import("node:crypto"))
    .createHash("sha256")
    .update(email)
    .digest("hex");
  await db.doc(`blogEditorialInvites/${inviteKey}`).delete();
  const r = await command("memberSave", { email, role: "author" }, 1);
  expect(r.member.connected).toBe(false);
  await core.studioCommand.run(
    req(owner, {
      action: "create",
      id,
      operationId: randomUUID(),
      payload: draft(),
    }),
  );
  const request = {
    ...req(author, { kind: "get", id }),
    auth: {
      uid: author,
      token: {
        email_verified: true,
        email,
        firebase: { sign_in_provider: "google.com" },
      },
    },
  } as CallableRequest;
  await expect(core.studioRead.run(request)).rejects.toMatchObject({
    code: "permission-denied",
  });
  expect(
    (await db.doc(`blogEditorialMembers/${author}`).get()).get("role"),
  ).toBe("author");
  await command("memberRevoke", { email }, 2);
  await expect(core.studioRead.run(request)).rejects.toMatchObject({
    code: "permission-denied",
  });
  expect((await db.doc(`staffAccess/${author}`).get()).get("roles")).toEqual([
    "CONTENT_EDITOR",
  ]);
});
it("ADVANCED027 safe reportqueue resolves129ID and rejectsstaleCAS", async () => {
  const reportId = `${"a".repeat(64)}-${"b".repeat(64)}`;
  await db.doc(`blogCommentReports/${reportId}`).set({
    commentId: id,
    reporter: author,
    reason: "Synthetic reason",
    state: "open",
    revision: 1,
    createdAt: new Date().toISOString(),
  });
  const listed = await advanced.studioAdvancedRead.run(
    req(owner, { kind: "reports", state: "open" }),
  );
  if (!Array.isArray(listed.items))
    throw new Error("Report response must contain an items array");
  const listedReport = listed.items.find((r) => r.id === reportId);
  expect(listedReport).toBeDefined();
  expect(listedReport).not.toHaveProperty("reporter");
  const r = await command("reportResolve", undefined, 1, reportId);
  expect(r.report.state).toBe("resolved");
  await expect(
    command("reportResolve", undefined, 1, reportId),
  ).rejects.toMatchObject({ code: "aborted" });
});

it("ADVANCED027 report hydration is approved-only safe and denies revoked authority", async () => {
  const cases = [
    "approved",
    "pending",
    "hidden",
    "rejected",
    "spam",
    "deleted",
    "deleted_private",
    "missing",
  ];
  const batch = db.batch();
  for (const status of cases) {
    const commentId = `${id}-${status}`;
    batch.set(db.doc(`blogCommentReports/${commentId}`), {
      commentId,
      state: "open",
      reporter: "synthetic-private-uid",
      reason: "Synthetic hydration",
    });
    if (status !== "missing")
      batch.set(db.doc(`blogComments/${commentId}`), {
        id: commentId,
        postId: id,
        parentId: "",
        uid: "synthetic-private-uid",
        email: "synthetic-private-email",
        name: "Synthetic",
        text: "Synthetic reviewed",
        status,
        revision: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
  }
  await batch.commit();
  const response = await advanced.studioAdvancedRead.run(
    req(owner, { kind: "reports" }),
  );
  if (!Array.isArray(response.items)) throw new Error("Expected report items");
  for (const status of cases) {
    const item = response.items.find((r) => r.id === `${id}-${status}`);
    expect(item).toBeDefined();
    if (status === "approved")
      expect(item).toMatchObject({
        comment: { id: `${id}-${status}`, text: "Synthetic reviewed" },
      });
    else expect(item).toMatchObject({ comment: null });
  }
  expect(JSON.stringify(response)).not.toContain("synthetic-private-uid");
  expect(JSON.stringify(response)).not.toContain("synthetic-private-email");
  await db
    .doc(`blogEditorialMembers/${owner}`)
    .set({ active: false, role: "reader", revision: 1 });
  try {
    await expect(
      advanced.studioAdvancedRead.run(req(owner, { kind: "reports" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  } finally {
    await db.doc(`blogEditorialMembers/${owner}`).delete();
  }
});

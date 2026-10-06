import { initializeApp, getApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { beforeAll, beforeEach, afterAll, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import type { CallableRequest } from "firebase-functions/v2/https";
let db: ReturnType<typeof getFirestore>,
  api: typeof import("../../functions/src/blog-comments"),
  studio: typeof import("../../functions/src/blog-studio");
const prefix = `comments027-${randomUUID().slice(0, 8)}`,
  uid = `${prefix}-reader`;
let postId: string;
function req(data: unknown, verified = true) {
  return {
    auth: {
      uid,
      token: {
        email_verified: verified,
        firebase: { sign_in_provider: "google.com" },
      },
    },
    data,
  } as CallableRequest;
}
function input(operationId = randomUUID()) {
  return {
    postId,
    name: "Synthetic reader",
    text: "Synthetic pending comment",
    operationId,
  };
}
beforeAll(async () => {
  initializeApp({
    projectId: `demo-satsunicgo-comments-${randomUUID().slice(0, 8)}`,
  });
  db = getFirestore();
  api = await import("../../functions/src/blog-comments");
  studio = await import("../../functions/src/blog-studio");
});
beforeEach(async () => {
  postId = `${prefix}-${randomUUID().slice(0, 8)}`;
  const { createHash } = await import("node:crypto");
  await Promise.all([
    db.doc(`users/${uid}`).set({ locked: false }),
    db
      .doc(`staffAccess/${uid}`)
      .set({ active: true, roles: ["CONTENT_EDITOR"] }),
    db.doc("blogStudioSettings/main").set({ commentsEnabled: true }),
    db
      .doc(`blogPublished/${postId}`)
      .set({ status: "published", commentsEnabled: true }),
    db
      .doc(
        `blogCommentLimits/${createHash("sha256").update(uid).digest("hex")}`,
      )
      .delete(),
  ]);
});
it("COMMENTS027 pending submission feeds moderation and approved public list strips UID", async () => {
  const r = await api.blogCommentSubmit.run(req(input()));
  expect(r.comment.status).toBe("pending");
  expect(r.comment).not.toHaveProperty("uid");
  expect((await api.listBlogComments(db, { postId })).items).toHaveLength(0);
  await studio.studioCommand.run(
    req({
      action: "moderate",
      id: r.comment.id,
      operationId: randomUUID(),
      expectedVersion: 1,
      payload: { status: "approved" },
    }),
  );
  const listed = await api.listBlogComments(db, { postId });
  expect(listed.items.map((c) => c.id)).toEqual([r.comment.id]);
  expect(JSON.stringify(listed)).not.toContain(uid);
});
it("COMMENTS027 concurrent new submissions share quota and have one winner", async () => {
  const results = await Promise.allSettled([
    api.blogCommentSubmit.run(req(input())),
    api.blogCommentSubmit.run(req(input())),
  ]);
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  expect(
    (results.find((r) => r.status === "rejected") as PromiseRejectedResult)
      .reason,
  ).toMatchObject({ code: "resource-exhausted" });
});
it("COMMENTS027 replay rechecks enabled flags and account lock before receipt", async () => {
  const data = input(),
    r = await api.blogCommentSubmit.run(req(data));
  expect(await api.blogCommentSubmit.run(req(data))).toEqual(r);
  await expect(
    api.blogCommentSubmit.run(req({ ...data, text: "Changed text" })),
  ).rejects.toMatchObject({ code: "already-exists" });
  await db.doc("blogStudioSettings/main").update({ commentsEnabled: false });
  await expect(api.blogCommentSubmit.run(req(data))).rejects.toMatchObject({
    code: "failed-precondition",
  });
  await db.doc("blogStudioSettings/main").update({ commentsEnabled: true });
  await db.doc(`blogPublished/${postId}`).update({ commentsEnabled: false });
  await expect(api.blogCommentSubmit.run(req(data))).rejects.toMatchObject({
    code: "failed-precondition",
  });
  await db.doc(`users/${uid}`).update({ locked: true });
  await expect(api.blogCommentSubmit.run(req(data))).rejects.toMatchObject({
    code: "permission-denied",
  });
});
it("COMMENTS027 foreign/pending/nested parent is denied, hidden parent suppresses public replies", async () => {
  const parentId = `${prefix}-parent`;
  const ref = db.doc(`blogComments/${parentId}`);
  for (const parent of [
    { postId: "foreign", parentId: "", status: "approved" },
    { postId, parentId: "", status: "pending" },
    { postId, parentId: "nested", status: "approved" },
  ]) {
    await ref.set(parent);
    await expect(
      api.blogCommentSubmit.run(req({ ...input(), parentId })),
    ).rejects.toMatchObject({ code: "failed-precondition" });
  }
  await ref.set({ postId, parentId: "", status: "approved" });
  const r = await api.blogCommentSubmit.run(req({ ...input(), parentId }));
  await db.doc(`blogComments/${r.comment.id}`).update({ status: "approved" });
  expect(
    (await api.listBlogComments(db, { postId, parentId })).items,
  ).toHaveLength(1);
  await ref.update({ status: "rejected" });
  await expect(
    api.listBlogComments(db, { postId, parentId }),
  ).rejects.toMatchObject({ code: "not-found" });
});
it("COMMENTS027 unverified identity and unpublished article cannot submit", async () => {
  await expect(
    api.blogCommentSubmit.run(req(input(), false)),
  ).rejects.toMatchObject({ code: "permission-denied" });
  await db.doc(`blogPublished/${postId}`).delete();
  await expect(api.blogCommentSubmit.run(req(input()))).rejects.toMatchObject({
    code: "not-found",
  });
  await expect(api.listBlogComments(db, { postId })).rejects.toMatchObject({
    code: "not-found",
  });
});
afterAll(async () => {
  await db.terminate();
  await deleteApp(getApp());
});

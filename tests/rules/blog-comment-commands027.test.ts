import { initializeApp, getApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { beforeAll, beforeEach, afterAll, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import type { CallableRequest } from "firebase-functions/v2/https";
let db: ReturnType<typeof getFirestore>,
  api: typeof import("../../functions/src/blog-comments");
const prefix = `commentcmd027-${randomUUID().slice(0, 8)}`,
  uid = `${prefix}-reader`;
let id: string, postId: string;
function req(data: unknown, actor = uid) {
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
beforeAll(async () => {
  initializeApp({
    projectId: `demo-satsunicgo-commentcmd-${randomUUID().slice(0, 8)}`,
  });
  db = getFirestore();
  api = await import("../../functions/src/blog-comments");
});
beforeEach(async () => {
  id = `${prefix}-${randomUUID().slice(0, 8)}`;
  postId = `${prefix}-post`;
  await Promise.all([
    db.doc(`users/${uid}`).set({ locked: false }),
    db.doc("blogStudioSettings/main").set({ commentsEnabled: true }),
    db
      .doc(`blogPublished/${postId}`)
      .set({ status: "published", commentsEnabled: true, commentCount: 1 }),
    db.doc(`blogComments/${id}`).set({
      id,
      uid,
      postId,
      parentId: "",
      name: "Synthetic reader",
      text: "Synthetic approved",
      status: "approved",
      revision: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
  ]);
});
it("COMMENTCMD027 own edit pending and CAS/replay do not reapprove", async () => {
  const data = {
    action: "edit",
    id,
    text: "Synthetic revised",
    expectedVersion: 1,
    operationId: randomUUID(),
  };
  const r = await api.blogCommentCommand.run(req(data));
  expect(r.comment.status).toBe("pending");
  expect(r.comment.revision).toBe(2);
  expect(await api.blogCommentCommand.run(req(data))).toEqual(r);
  await expect(
    api.blogCommentCommand.run(req({ ...data, operationId: randomUUID() })),
  ).rejects.toMatchObject({ code: "aborted" });
  expect(
    (await db.doc(`blogPublished/${postId}`).get()).get("commentCount"),
  ).toBe(0);
});
it("COMMENTCMD027 foreign ownmutation denied and accountlock before replay", async () => {
  await db.doc("users/foreign").set({ locked: false });
  await expect(
    api.blogCommentCommand.run(
      req(
        { action: "delete", id, expectedVersion: 1, operationId: randomUUID() },
        "foreign",
      ),
    ),
  ).rejects.toMatchObject({ code: "permission-denied" });
  const data = {
    action: "delete",
    id,
    expectedVersion: 1,
    operationId: randomUUID(),
  };
  await api.blogCommentCommand.run(req(data));
  await db.doc(`users/${uid}`).update({ locked: true });
  await expect(api.blogCommentCommand.run(req(data))).rejects.toMatchObject({
    code: "permission-denied",
  });
});
it("COMMENTCMD027 delete tombstone keeps reply thread and clearspublicidentity", async () => {
  const r = await api.blogCommentCommand.run(
    req({
      action: "delete",
      id,
      expectedVersion: 1,
      operationId: randomUUID(),
    }),
  );
  expect(r.comment).toMatchObject({ status: "deleted", name: "", text: "" });
  const page = await api.listBlogComments(db, { postId, commentId: id }, uid);
  expect(page.thread?.parent.id).toBe(id);
  expect(page.mine.find((c) => c.id === id)?.status).toBe("deleted");
  expect(page.count).toBe(0);
});
it("COMMENTCMD027 report bounded and idempotent, unpublished parent denied", async () => {
  const data = { id, reason: "Synthetic report", operationId: randomUUID() };
  expect(await api.blogCommentReport.run(req(data))).toEqual({ ok: true });
  expect(await api.blogCommentReport.run(req(data))).toEqual({ ok: true });
  await expect(
    api.blogCommentReport.run(req({ ...data, reason: "x".repeat(501) })),
  ).rejects.toMatchObject({ code: "invalid-argument" });
  await db.doc(`blogPublished/${postId}`).delete();
  await expect(api.blogCommentReport.run(req(data))).rejects.toMatchObject({
    code: "not-found",
  });
});
it("COMMENTCMD027 newest cursor/mine private rows remain scoped", async () => {
  const newer = `${prefix}-newer`;
  await db.doc(`blogComments/${newer}`).set({
    id: newer,
    uid: "other",
    postId,
    parentId: "",
    name: "Synthetic other",
    text: "Synthetic",
    status: "approved",
    revision: 1,
    createdAt: new Date(Date.now() + 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const page = await api.listBlogComments(db, { postId }, uid);
  expect(page.items[0].id).toBe(newer);
  expect(page.mine.every((c) => c.id !== newer)).toBe(true);
  expect(JSON.stringify(page)).not.toContain(uid);
});
afterAll(async () => {
  await db.terminate();
  await deleteApp(getApp());
});

it.each(["pending", "hidden", "rejected", "spam"])(
  "COMMENTCMD027 deleting %s stays private to anonymous readers",
  async (status) => {
    await db
      .doc(`blogComments/${id}`)
      .update({ status, approvedReplyCount: 1 });
    await db.doc(`blogPublished/${postId}`).update({ commentCount: 0 });
    const replyId = `${id}-reply`;
    await db
      .doc(`blogComments/${replyId}`)
      .set({
        id: replyId,
        uid,
        postId,
        parentId: id,
        name: "Synthetic reply",
        text: "Synthetic reply",
        status: "approved",
        revision: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    const input = {
      action: "delete",
      id,
      expectedVersion: 1,
      operationId: randomUUID(),
    };
    const r = await api.blogCommentCommand.run(req(input));
    expect(r.comment).toMatchObject({ status: "deleted", name: "", text: "" });
    expect(await api.blogCommentCommand.run(req(input))).toEqual(r);
    expect((await db.doc(`blogComments/${id}`).get()).get("status")).toBe(
      "deleted_private",
    );
    const anon = await api.listBlogComments(db, { postId, commentId: id });
    expect(anon.items.some((c) => c.id === id)).toBe(false);
    expect(anon.thread).toBeNull();
    expect(anon.count).toBe(0);
    const focusedReply = await api.listBlogComments(db, {
      postId,
      commentId: replyId,
    });
    expect(focusedReply.thread).toBeNull();
    await expect(
      api.listBlogComments(db, { postId, parentId: id }),
    ).rejects.toMatchObject({ code: "not-found" });
    const mine = await api.listBlogComments(db, { postId }, uid);
    expect(mine.mine.find((c) => c.id === id)).toMatchObject({
      status: "deleted",
      name: "",
      text: "",
    });
    await expect(
      api.blogCommentCommand.run(
        req({
          action: "edit",
          id,
          text: "Synthetic revised",
          expectedVersion: 2,
          operationId: randomUUID(),
        }),
      ),
    ).rejects.toMatchObject({ code: "failed-precondition" });
  },
);
it("COMMENTCMD027 approved deletion preserves approved reply thread and count", async () => {
  const replyId = `${id}-reply`;
  await db.doc(`blogComments/${id}`).update({ approvedReplyCount: 1 });
  await db.doc(`blogPublished/${postId}`).update({ commentCount: 2 });
  await db
    .doc(`blogComments/${replyId}`)
    .set({
      id: replyId,
      uid,
      postId,
      parentId: id,
      name: "Synthetic reply",
      text: "Synthetic reply",
      status: "approved",
      revision: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  const input = {
    action: "delete",
    id,
    expectedVersion: 1,
    operationId: randomUUID(),
  };
  const r = await api.blogCommentCommand.run(req(input));
  expect(await api.blogCommentCommand.run(req(input))).toEqual(r);
  const anon = await api.listBlogComments(db, { postId, commentId: replyId });
  expect(anon.items.find((c) => c.id === id)?.status).toBe("deleted");
  expect(anon.thread?.parent.id).toBe(id);
  expect(anon.thread?.reply?.id).toBe(replyId);
  expect(anon.count).toBe(1);
  const replies = await api.listBlogComments(db, { postId, parentId: id });
  expect(replies.items.some((c) => c.id === replyId)).toBe(true);
});

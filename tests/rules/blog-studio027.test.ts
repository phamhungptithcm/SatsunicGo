import { initializeApp, getApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { CallableRequest } from "firebase-functions/v2/https";
import { beforeAll, beforeEach, afterAll, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { emptyStudioDraft } from "../../packages/domain/blog-studio";
let db: ReturnType<typeof getFirestore>,
  api: typeof import("../../functions/src/blog-studio");
const prefix = `studio027-${randomUUID().slice(0, 8)}`,
  uid = `${prefix}-editor`;
let id: string;
const payload = {
  ...emptyStudioDraft,
  title: "Synthetic Studio",
  summary: "Synthetic isolated content",
  slug: prefix,
  category: "Synthetic category",
  sources: [{ title: "Synthetic source", url: "https://example.com/source" }],
  authorId: uid,
  body: {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: "Synthetic public baseline" }],
      },
    ],
  },
};
function req(data: unknown) {
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
  expectedVersion?: number,
  payload?: unknown,
  operationId = randomUUID(),
) {
  return api.studioCommand.run(
    req({
      action,
      id,
      operationId,
      ...(expectedVersion !== undefined ? { expectedVersion } : {}),
      ...(payload !== undefined ? { payload } : {}),
    }),
  );
}
beforeAll(async () => {
  initializeApp({
    projectId: `demo-satsunicgo-studio-${randomUUID().slice(0, 8)}`,
  });
  db = getFirestore();
  api = await import("../../functions/src/blog-studio");
});
beforeEach(async () => {
  id = `${prefix}-${randomUUID().slice(0, 8)}`;
  payload.slug = id;
  await Promise.all([
    db
      .doc(`staffAccess/${uid}`)
      .set({ active: true, roles: ["CONTENT_EDITOR"] }),
    db.doc(`users/${uid}`).set({ locked: false }),
    db.doc("blogStudioSettings/main").set({
      commentsEnabled: true,
      requireReview: false,
      categories: [],
      authors: [{ id: uid, name: "Synthetic author", bio: "" }],
      revision: 1,
    }),
  ]);
});
it("STUDIO027 published body stays immutable across autosave, restore, review and scheduling", async () => {
  await command("create", undefined, payload);
  await command("publish", 1);
  const baseline = (await db.doc(`blogPublished/${id}`).get()).data();
  await command("save", 2, {
    ...payload,
    title: "Synthetic edited private title",
  });
  await command("restore", 3, { revision: 1 });
  await command("review", 4);
  await command("schedule", 5, {
    dueAt: new Date(Date.now() + 120000).toISOString(),
  });
  expect((await db.doc(`blogPublished/${id}`).get()).data()).toEqual(baseline);
  expect((await db.doc(`blogDrafts/${id}`).get()).get("revision")).toBe(6);
});
it("STUDIO027 concurrent saves have one winner and no lost update", async () => {
  await command("create", undefined, payload);
  const results = await Promise.allSettled([
    command("save", 1, { ...payload, title: "Writer A" }),
    command("save", 1, { ...payload, title: "Writer B" }),
  ]);
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  const rejected = results.find(
    (r) => r.status === "rejected",
  ) as PromiseRejectedResult;
  expect(rejected.reason).toMatchObject({ code: "aborted" });
  expect((await db.doc(`blogDrafts/${id}`).get()).get("revision")).toBe(2);
});
it("STUDIO027 receipt replay requires current authority and exact payload", async () => {
  const op = randomUUID();
  const first = await command("create", undefined, payload, op);
  expect(await command("create", undefined, payload, op)).toEqual(first);
  await expect(
    command("create", undefined, { ...payload, title: "Different" }, op),
  ).rejects.toMatchObject({ code: "already-exists" });
  await db.doc(`staffAccess/${uid}`).update({ active: false });
  await expect(command("create", undefined, payload, op)).rejects.toMatchObject(
    { code: "permission-denied" },
  );
});
it.each([
  { active: "false", roles: ["CONTENT_EDITOR"] },
  { active: true, roles: "CONTENT_EDITOR" },
  { active: true, roles: ["CONTENT_EDITOR", 3] },
  { active: true, roles: ["SUPPORT"] },
])(
  "STUDIO027 strict staff authority rejects malformed access %j",
  async (access) => {
    await db.doc(`staffAccess/${uid}`).set(access);
    await expect(command("create", undefined, payload)).rejects.toMatchObject({
      code: "permission-denied",
    });
    await expect(
      api.studioRead.run(req({ kind: "list" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  },
);
it("STUDIO027 foreign media publish has no partial snapshot or binding", async () => {
  await command("create", undefined, {
    ...payload,
    coverId: `${prefix}-media`,
  });
  const media = db.doc(`contentMedia/${prefix}-media`);
  await media.set({
    rightsConfirmed: true,
    status: "unlinked",
    uploadedBy: "other",
  });
  await expect(command("publish", 1)).rejects.toMatchObject({
    code: "failed-precondition",
  });
  expect((await db.doc(`blogPublished/${id}`).get()).exists).toBe(false);
  expect((await db.doc(`blogDrafts/${id}`).get()).get("revision")).toBe(1);
  expect((await media.get()).get("contentId")).toBeUndefined();
});
it("STUDIO027 schedule stale revision and revocation fail closed", async () => {
  await command("create", undefined, payload);
  await command("schedule", 1, {
    dueAt: new Date(Date.now() + 120000).toISOString(),
  });
  const schedule = db.doc(`blogSchedules/${id}`);
  await schedule.update({ dueAt: new Date(Date.now() - 1000).toISOString() });
  await db.doc(`staffAccess/${uid}`).update({ active: false });
  const blocked = await api.publishDueStudioPosts(db);
  expect(blocked.find((r) => r.id === id)?.status).toBe("blocked");
  expect((await db.doc(`blogPublished/${id}`).get()).exists).toBe(false);
});
it("STUDIO027 unpublish removes only own snapshot and archive follows", async () => {
  await command("create", undefined, payload);
  await command("publish", 1);
  await expect(command("archive", 2)).rejects.toMatchObject({
    code: "failed-precondition",
  });
  await command("unpublish", 2);
  expect((await db.doc(`blogPublished/${id}`).get()).exists).toBe(false);
  await command("archive", 3);
  expect((await db.doc(`blogDrafts/${id}`).get()).get("state")).toBe(
    "archived",
  );
});
afterAll(async () => {
  await db.terminate();
  await deleteApp(getApp());
});
it("STUDIO027 duplicate slug concurrent publishes have one winner", async () => {
  await command("create", undefined, payload);
  const first = id;
  id = `${prefix}-${randomUUID().slice(0, 8)}`;
  await command("create", undefined, payload);
  const second = id;
  const request = (postId: string) =>
    api.studioCommand.run(
      req({
        action: "publish",
        id: postId,
        operationId: randomUUID(),
        expectedVersion: 1,
      }),
    );
  const results = await Promise.allSettled([request(first), request(second)]);
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  expect(
    (results.find((r) => r.status === "rejected") as PromiseRejectedResult)
      .reason,
  ).toMatchObject({ code: "already-exists" });
});
it("STUDIO027 customer account lock denies both command and private read", async () => {
  await command("create", undefined, payload);
  await db.doc(`users/${uid}`).update({ locked: true });
  await expect(command("save", 1, payload)).rejects.toMatchObject({
    code: "permission-denied",
  });
  await expect(
    api.studioRead.run(req({ kind: "get", id })),
  ).rejects.toMatchObject({ code: "permission-denied" });
});
it("STUDIO027 settings require OWNER and exact revision", async () => {
  await expect(
    command("settings", 1, {
      commentsEnabled: true,
      requireReview: false,
      categories: [],
      authors: [],
    }),
  ).rejects.toMatchObject({ code: "permission-denied" });
  await db.doc(`staffAccess/${uid}`).update({ roles: ["OWNER"] });
  const r = await command("settings", 1, {
    commentsEnabled: true,
    requireReview: true,
    categories: [],
    authors: [],
  });
  expect(r.settings.revision).toBe(2);
  await expect(
    command("settings", 1, {
      commentsEnabled: true,
      requireReview: false,
      categories: [],
      authors: [],
    }),
  ).rejects.toMatchObject({ code: "aborted" });
});

it.each([undefined, "wrong-id"])(
  "STUDIO027 moderation derives canonical docid with redundant id %s",
  async (storedId) => {
    const comment = db.doc(`blogComments/${id}`);
    await comment.set({
      ...(storedId ? { id: storedId } : {}),
      postId: id,
      parentId: "",
      uid: "synthetic-private-reader",
      name: "Synthetic",
      text: "Synthetic reviewed",
      status: "approved",
      revision: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await db
      .doc(`blogPublished/${id}`)
      .set({ status: "published", commentCount: 1 });
    const operationId = randomUUID();
    const r = await command("moderate", 1, { status: "hidden" }, operationId);
    expect(r.comment).toMatchObject({ id, status: "hidden", revision: 2 });
    expect(r.comment).not.toHaveProperty("uid");
    expect(r.comment).not.toHaveProperty("moderatedBy");
    expect(
      await command("moderate", 1, { status: "hidden" }, operationId),
    ).toEqual(r);
    expect((await comment.get()).get("id")).toBe(id);
    expect(
      (await db.doc(`blogStudioOperations/${uid}_${operationId}`).get()).get(
        "result",
      ),
    ).toEqual(r);
    await expect(
      command("moderate", 1, { status: "hidden" }),
    ).rejects.toMatchObject({ code: "aborted" });
    await db.doc(`staffAccess/${uid}`).update({ active: false });
    await expect(
      command("moderate", 1, { status: "hidden" }, operationId),
    ).rejects.toMatchObject({ code: "permission-denied" });
  },
);

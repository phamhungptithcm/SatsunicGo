import { describe, it, expect } from "vitest";
import type { Firestore } from "firebase-admin/firestore";
import { executeStudioCommand } from "../../functions/src/blog-studio";
import { emptyStudioDraft } from "../../packages/domain/blog-studio";
// Transaction fake verifies code paths/atomic write shape. It is not emulator/concurrency evidence.
function fixture() {
  const data = new Map<string, Record<string, unknown>>([
    ["staffAccess/editor", { active: true, roles: ["CONTENT_EDITOR"] }],
    ["users/editor", {}],
    [
      "blogStudioSettings/main",
      {
        commentsEnabled: true,
        requireReview: false,
        categories: [],
        authors: [{ id: "editor", name: "Tác giả", bio: "" }],
        revision: 1,
      },
    ],
  ]);
  const ref = (path: string) => ({
    path,
    collection: (name: string) => ({
      doc: (id: string) => ref(`${path}/${name}/${id}`),
    }),
  });
  const db = {
    doc: ref,
    collection: (name: string) => ({
      where: () => ({ limit: () => ({ query: name }) }),
    }),
    runTransaction: async (fn: (tx: unknown) => unknown) => {
      let written = false;
      const pending: (() => void)[] = [];
      const tx = {
        get: async (r: { path?: string; query?: string }) => {
          if (written) throw new Error("READ_AFTER_WRITE");
          if (r.query) return { empty: true, docs: [] };
          const value = data.get(r.path!);
          return {
            id: r.path!.split("/").at(-1),
            exists: !!value,
            data: () => value,
            get: (k: string) => value?.[k],
          };
        },
        set: (r: { path: string }, v: Record<string, unknown>) => {
          written = true;
          pending.push(() => data.set(r.path, v));
        },
        create: (r: { path: string }, v: Record<string, unknown>) => {
          written = true;
          if (data.has(r.path)) throw new Error("DUPLICATE");
          pending.push(() => data.set(r.path, v));
        },
        update: (r: { path: string }, v: Record<string, unknown>) => {
          written = true;
          pending.push(() => data.set(r.path, { ...data.get(r.path), ...v }));
        },
        delete: (r: { path: string }) => {
          written = true;
          pending.push(() => data.delete(r.path));
        },
      };
      const result = await fn(tx);
      pending.forEach((f) => f());
      return result;
    },
  };
  const send = (
    action: Parameters<typeof executeStudioCommand>[2]["action"],
    expectedVersion?: number,
    payload?: unknown,
    operationId = `op-${Math.random().toString(16).slice(2)}`,
  ) =>
    executeStudioCommand(db as unknown as Firestore, "editor", {
      action,
      id: "post-1",
      expectedVersion,
      payload,
      operationId,
    });
  const content = {
    ...emptyStudioDraft,
    title: "Bài viết",
    slug: "bai-viet",
    summary: "Tóm tắt",
    category: "Synthetic category",
    sources: [{ title: "Synthetic source", url: "https://example.com/source" }],
    authorId: "editor",
    body: {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Nội dung" }] },
      ],
    },
  };
  return { data, send, content };
}
describe("Studio transactional service", () => {
  it("autosave after publish leaves public snapshot unchanged; restore has new revision", async () => {
    const f = fixture();
    await f.send("create", undefined, f.content);
    await f.send("publish", 1);
    const snapshot = JSON.stringify(f.data.get("blogPublished/post-1"));
    await f.send("save", 2, { ...f.content, title: "Bản nháp mới" });
    expect(JSON.stringify(f.data.get("blogPublished/post-1"))).toBe(snapshot);
    await f.send("restore", 3, { revision: 1 });
    expect(f.data.get("blogDrafts/post-1")?.revision).toBe(4);
    expect(f.data.get("blogDrafts/post-1")?.title).toBe("Bài viết");
    expect(JSON.stringify(f.data.get("blogPublished/post-1"))).toBe(snapshot);
  });
  it("retries exact operation and denies payload collision", async () => {
    const f = fixture();
    const result = await f.send("create", undefined, f.content, "same-op");
    expect(await f.send("create", undefined, f.content, "same-op")).toEqual(
      result,
    );
    await expect(
      f.send("create", undefined, { ...f.content, title: "Khác" }, "same-op"),
    ).rejects.toMatchObject({ code: "already-exists" });
  });
  it("checks revocation before receipt replay", async () => {
    const f = fixture();
    await f.send("create", undefined, f.content, "same-op");
    f.data.set("staffAccess/editor", {
      active: false,
      roles: ["CONTENT_EDITOR"],
    });
    await expect(
      f.send("create", undefined, f.content, "same-op"),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });
  it.each([
    { active: "true", roles: ["CONTENT_EDITOR"] },
    { active: true, roles: "CONTENT_EDITOR" },
    { active: true, roles: ["CONTENT_EDITOR", 3] },
    { active: true, roles: ["SUPPORT"] },
    { active: true, roles: ["CONTENT_EDITOR"], locked: true },
  ])("fails closed malformed/revoked roles", async (access) => {
    const f = fixture();
    f.data.set("staffAccess/editor", access);
    await expect(f.send("create", undefined, f.content)).rejects.toMatchObject({
      code: "permission-denied",
    });
    expect(f.data.has("blogDrafts/post-1")).toBe(false);
  });
  it("denies stale CAS without writes", async () => {
    const f = fixture();
    await f.send("create", undefined, f.content);
    const before = JSON.stringify([...f.data]);
    await expect(f.send("save", 9, f.content)).rejects.toMatchObject({
      code: "aborted",
    });
    expect(JSON.stringify([...f.data])).toBe(before);
  });
  it("cannot archive published content or change published slug", async () => {
    const f = fixture();
    await f.send("create", undefined, f.content);
    await f.send("publish", 1);
    await expect(f.send("archive", 2)).rejects.toMatchObject({
      code: "failed-precondition",
    });
    await expect(
      f.send("save", 2, { ...f.content, slug: "different" }),
    ).rejects.toMatchObject({ code: "failed-precondition" });
    await f.send("unpublish", 2);
    expect(f.data.has("blogPublished/post-1")).toBe(false);
    await f.send("archive", 3);
    expect(f.data.get("blogDrafts/post-1")?.state).toBe("archived");
  });
  it("requires configured author and review policy", async () => {
    const f = fixture();
    f.data.set("blogStudioSettings/main", {
      commentsEnabled: true,
      requireReview: true,
      categories: [],
      authors: [{ id: "editor", name: "Tác giả", bio: "" }],
      revision: 1,
    });
    await f.send("create", undefined, f.content);
    await expect(f.send("publish", 1)).rejects.toMatchObject({
      code: "failed-precondition",
    });
    await f.send("review", 1);
    await f.send("publish", 2);
    expect(f.data.has("blogPublished/post-1")).toBe(true);
  });
  it("schedule is private and a save cancels it", async () => {
    const f = fixture();
    await f.send("create", undefined, f.content);
    await f.send("schedule", 1, {
      dueAt: new Date(Date.now() + 120000).toISOString(),
    });
    expect(f.data.has("blogSchedules/post-1")).toBe(true);
    expect(f.data.has("blogPublished/post-1")).toBe(false);
    await f.send("save", 2, f.content);
    expect(f.data.has("blogSchedules/post-1")).toBe(false);
    expect(f.data.get("blogDrafts/post-1")).not.toHaveProperty("scheduledAt");
  });
  it("denies foreign media and atomically binds permitted media", async () => {
    const f = fixture();
    const payload = { ...f.content, coverId: "image-1" };
    await f.send("create", undefined, payload);
    f.data.set("contentMedia/image-1", {
      rightsConfirmed: true,
      status: "unlinked",
      uploadedBy: "other",
    });
    await expect(f.send("publish", 1)).rejects.toMatchObject({
      code: "failed-precondition",
    });
    f.data.set("contentMedia/image-1", {
      rightsConfirmed: true,
      status: "unlinked",
      uploadedBy: "editor",
    });
    await f.send("publish", 1);
    expect(f.data.get("contentMedia/image-1")?.contentId).toBe("post-1");
  });
});

it.each(["approved", "hidden", "rejected", "spam"])(
  "does not moderate private deletion into %s",
  async (status) => {
    const f = fixture();
    f.data.set("blogComments/post-1", {
      id: "post-1",
      postId: "post-1",
      parentId: "",
      uid: "reader",
      status: "deleted_private",
      revision: 2,
    });
    const before = JSON.stringify([...f.data]);
    await expect(f.send("moderate", 2, { status })).rejects.toMatchObject({
      code: "failed-precondition",
    });
    expect(JSON.stringify([...f.data])).toBe(before);
  },
);

it.each([undefined, "wrong-id"])(
  "moderation canonicalizes redundant id %s with safe receipt replay",
  async (storedId) => {
    const f = fixture();
    f.data.set("blogComments/post-1", {
      ...(storedId ? { id: storedId } : {}),
      postId: "post-1",
      parentId: "",
      uid: "private-reader",
      name: "Synthetic",
      text: "Synthetic reviewed",
      status: "approved",
      revision: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    f.data.set("blogPublished/post-1", {
      status: "published",
      commentCount: 1,
    });
    const result = await f.send(
      "moderate",
      1,
      { status: "hidden" },
      "canonical-op",
    );
    expect(result.comment).toMatchObject({
      id: "post-1",
      status: "hidden",
      revision: 2,
    });
    expect(result.comment).not.toHaveProperty("uid");
    expect(result.comment).not.toHaveProperty("moderatedBy");
    expect(
      await f.send("moderate", 1, { status: "hidden" }, "canonical-op"),
    ).toEqual(result);
    expect(f.data.get("blogComments/post-1")?.id).toBe("post-1");
    f.data.set("staffAccess/editor", {
      active: false,
      roles: ["CONTENT_EDITOR"],
    });
    await expect(
      f.send("moderate", 1, { status: "hidden" }, "canonical-op"),
    ).rejects.toMatchObject({ code: "permission-denied" });
  },
);

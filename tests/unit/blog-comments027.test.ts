import { describe, it, expect } from "vitest";
import {
  blogCommentSubmitSchema,
  commentRate,
  publicBlogComment,
} from "../../packages/domain/blog-comments";
import {
  submitBlogComment,
  listBlogComments,
  changeBlogComment,
} from "../../functions/src/blog-comments";
import type { Firestore } from "firebase-admin/firestore";
function fixture() {
  const data = new Map<string, Record<string, unknown>>([
    ["users/synthetic-user", { locked: false }],
    [
      "blogPublished/post-1",
      { status: "published", commentsEnabled: true, commentCount: 0 },
    ],
    ["blogStudioSettings/main", { commentsEnabled: true }],
  ]);
  const snapshot = (path: string) => ({
    id: path.split("/").at(-1),
    exists: data.has(path),
    data: () => data.get(path),
    get: (key: string) => data.get(path)?.[key],
  });
  const query = (
    path: string,
    filters: [string, unknown][] = [],
    after = "",
    limit = 21,
  ): unknown => ({
    path,
    filters,
    after,
    cap: limit,
    where: (key: string, _: string, v: unknown) =>
      query(path, [...filters, [key, v]], after, limit),
    orderBy: () => query(path, filters, after, limit),
    startAfter: (...values: string[]) =>
      query(path, filters, values.at(-1)!, limit),
    limit: (n: number) => query(path, filters, after, n),
  });
  const db = {
    doc: (path: string) => ({ path }),
    collection: (path: string) => query(path),
    runTransaction: async (fn: (tx: unknown) => unknown) => {
      let writing = false;
      const writes: (() => void)[] = [];
      const tx = {
        get: async (r: {
          path: string;
          filters?: [string, unknown][];
          after?: string;
          cap?: number;
        }) => {
          if (writing) throw new Error("READ_AFTER_WRITE");
          if (r.filters) {
            const docs = [...data.keys()]
              .filter(
                (p) => p.startsWith(`${r.path}/`) && p.split("/").length === 2,
              )
              .sort()
              .filter(
                (p) =>
                  r.filters!.every(([key, v]) =>
                    Array.isArray(v)
                      ? v.includes(data.get(p)?.[key])
                      : data.get(p)?.[key] === v,
                  ) && p.split("/").at(-1)! > (r.after ?? ""),
              )
              .slice(0, r.cap)
              .map(snapshot);
            return { docs, size: docs.length };
          }
          return snapshot(r.path);
        },
        create: (r: { path: string }, value: Record<string, unknown>) => {
          writing = true;
          if (data.has(r.path)) throw new Error("DUPLICATE");
          writes.push(() => data.set(r.path, value));
        },
        update: (r: { path: string }, value: Record<string, unknown>) => {
          writing = true;
          writes.push(() =>
            data.set(r.path, { ...data.get(r.path), ...value }),
          );
        },
        set: (r: { path: string }, value: Record<string, unknown>) => {
          writing = true;
          writes.push(() => data.set(r.path, value));
        },
      };
      const result = await fn(tx);
      writes.forEach((f) => f());
      return result;
    },
  } as unknown as Firestore;
  const input = {
    postId: "post-1",
    text: "Synthetic comment",
    name: "Synthetic reader",
    operationId: "operation-1",
  };
  return { data, db, input };
}
describe("Blog comments bounds and privacy", () => {
  it.each(["", "  ", "\u200b\ufeff"])("rejects blank comment %s", (text) =>
    expect(
      blogCommentSubmitSchema.safeParse({
        postId: "post-1",
        text,
        name: "Reader",
        operationId: "op-1",
      }).success,
    ).toBe(false),
  );
  it("rejects oversized text and unknown identity fields", () => {
    expect(
      blogCommentSubmitSchema.safeParse({
        postId: "post-1",
        text: "x".repeat(2001),
        name: "Reader",
        operationId: "op-1",
      }).success,
    ).toBe(false);
    expect(
      blogCommentSubmitSchema.safeParse({
        postId: "post-1",
        text: "Hello",
        name: "Reader",
        operationId: "op-1",
        uid: "forged",
      }).success,
    ).toBe(false);
  });
  it("bounds rate window and rejects malformed ledger", () => {
    expect(commentRate([0], 3600001)).toEqual([3600001]);
    expect(() => commentRate([100000], 100001)).toThrow("COMMENT_RATE_LIMIT");
    expect(() => commentRate([0, 30001, 60002, 90003, 120004], 150005)).toThrow(
      "COMMENT_RATE_LIMIT",
    );
    expect(() => commentRate(["x"], 150005)).toThrow("INVALID_RATE_LEDGER");
  });
  it("removes identity and metadata from public projection", () => {
    const p = publicBlogComment({
      id: "comment-1",
      postId: "post-1",
      parentId: "",
      uid: "private-uid",
      name: "Reader",
      text: "Hello",
      status: "approved",
      revision: 1,
      createdAt: "2026-10-05T00:00:00.000Z",
      updatedAt: "now",
    });
    expect(p).not.toHaveProperty("uid");
    expect(JSON.stringify(p)).not.toContain("private-uid");
  });
  it("new comment pending, hidden from public until staff approval", async () => {
    const f = fixture();
    const r = await submitBlogComment(f.db, "synthetic-user", f.input, 100000);
    expect(r.comment.status).toBe("pending");
    expect(r.comment).not.toHaveProperty("uid");
    expect(
      (await listBlogComments(f.db, { postId: "post-1", sort: "oldest" }))
        .items,
    ).toHaveLength(0);
    const path = `blogComments/${r.comment.id}`;
    f.data.set(path, { ...f.data.get(path), status: "approved" });
    expect(
      (
        await listBlogComments(f.db, { postId: "post-1", sort: "oldest" })
      ).items.map((c) => c.id),
    ).toEqual([r.comment.id]);
  });
  it("exact replay bypasses quota but enabled/lock state checked before replay", async () => {
    const f = fixture();
    const r = await submitBlogComment(f.db, "synthetic-user", f.input, 100000);
    expect(
      await submitBlogComment(f.db, "synthetic-user", f.input, 100001),
    ).toEqual(r);
    await expect(
      submitBlogComment(
        f.db,
        "synthetic-user",
        { ...f.input, text: "Different" },
        100001,
      ),
    ).rejects.toMatchObject({ code: "already-exists" });
    f.data.set("blogStudioSettings/main", { commentsEnabled: false });
    await expect(
      submitBlogComment(f.db, "synthetic-user", f.input, 100001),
    ).rejects.toMatchObject({ code: "failed-precondition" });
    f.data.set("users/synthetic-user", { locked: true });
    await expect(
      submitBlogComment(f.db, "synthetic-user", f.input, 100001),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });
  it("new rapid submission denied without partial comment", async () => {
    const f = fixture();
    await submitBlogComment(f.db, "synthetic-user", f.input, 100000);
    await expect(
      submitBlogComment(
        f.db,
        "synthetic-user",
        { ...f.input, operationId: "op-2" },
        100001,
      ),
    ).rejects.toMatchObject({ code: "resource-exhausted" });
    expect(
      [...f.data.keys()].filter((p) => p.startsWith("blogComments/")),
    ).toHaveLength(1);
  });
  it("reply denied for foreign, unapproved or nested parent", async () => {
    const f = fixture();
    for (const parent of [
      { postId: "other", parentId: "", status: "approved" },
      { postId: "post-1", parentId: "", status: "pending" },
      { postId: "post-1", parentId: "nested", status: "approved" },
    ]) {
      f.data.set("blogComments/parent-1", parent);
      await expect(
        submitBlogComment(
          f.db,
          "synthetic-user",
          { ...f.input, parentId: "parent-1" },
          100000,
        ),
      ).rejects.toMatchObject({ code: "failed-precondition" });
    }
  });
  it("public pagination uses last displayed item and closed comments remain readable", async () => {
    const f = fixture();
    for (let n = 0; n < 22; n++) {
      const id = `comment-${String(n).padStart(2, "0")}`;
      f.data.set(`blogComments/${id}`, {
        id,
        postId: "post-1",
        parentId: "",
        uid: "private",
        name: "Reader",
        text: "Hello",
        status: "approved",
        revision: 1,
        createdAt: "2026-10-05T00:00:00.000Z",
        updatedAt: "now",
      });
    }
    const first = await listBlogComments(f.db, {
      postId: "post-1",
      sort: "oldest",
    });
    expect(first.items).toHaveLength(20);
    expect(Buffer.from(first.next!, "base64url").toString()).toBe(
      "2026-10-05T00:00:00.000Z|comment-19",
    );
    expect(
      (
        await listBlogComments(f.db, { postId: "post-1", after: first.next })
      ).items.map((c) => c.id),
    ).toEqual(["comment-20", "comment-21"]);
    f.data.set("blogStudioSettings/main", { commentsEnabled: false });
    expect(
      (await listBlogComments(f.db, { postId: "post-1", sort: "oldest" }))
        .commentsEnabled,
    ).toBe(false);
  });
});

describe("Private deletion visibility", () => {
  it.each(["pending", "hidden", "rejected", "spam"])(
    "keeps deleted %s private and replay safe",
    async (status) => {
      const f = fixture(),
        id = "private-1";
      f.data.set(`blogComments/${id}`, {
        id,
        uid: "synthetic-user",
        postId: "post-1",
        parentId: "",
        name: "Private name",
        text: "Private text",
        avatar: "https://lh3.googleusercontent.com/a",
        badge: "private",
        status,
        revision: 1,
        approvedReplyCount: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      const input = {
        action: "delete",
        id,
        expectedVersion: 1,
        operationId: "delete-1",
      };
      const result = await changeBlogComment(f.db, "synthetic-user", input);
      expect(result.comment).toMatchObject({
        status: "deleted",
        name: "",
        text: "",
        badge: "",
      });
      expect(result.comment).not.toHaveProperty("avatar");
      expect(f.data.get(`blogComments/${id}`)?.status).toBe("deleted_private");
      expect(await changeBlogComment(f.db, "synthetic-user", input)).toEqual(
        result,
      );
      const page = await listBlogComments(
        f.db,
        { postId: "post-1", commentId: id },
        "synthetic-user",
      );
      expect(page.items.some((c) => c.id === id)).toBe(false);
      expect(page.thread).toBeNull();
      expect(page.mine.find((c) => c.id === id)?.status).toBe("deleted");
      expect(page.count).toBe(0);
      await expect(
        listBlogComments(f.db, { postId: "post-1", parentId: id }),
      ).rejects.toMatchObject({ code: "not-found" });
      await expect(
        changeBlogComment(f.db, "synthetic-user", {
          action: "edit",
          id,
          text: "Retry",
          expectedVersion: 2,
          operationId: "edit-1",
        }),
      ).rejects.toMatchObject({ code: "failed-precondition" });
    },
  );
});

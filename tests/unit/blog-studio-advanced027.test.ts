import { describe, it, expect, vi } from "vitest";
import type { Firestore } from "firebase-admin/firestore";
vi.mock("firebase-admin/auth", () => ({
  getAuth: () => ({
    getUser: async (uid: string) => ({
      uid,
      email: `${uid}@example.com`,
      displayName: "Synthetic member",
      emailVerified: true,
      disabled: false,
      providerData: [{ providerId: "google.com" }],
    }),
    getUserByEmail: async (email: string) => ({
      uid: "target",
      email,
      displayName: "Synthetic author",
      photoURL: "https://lh3.googleusercontent.com/image",
      emailVerified: true,
      disabled: false,
      providerData: [{ providerId: "google.com" }],
    }),
  }),
}));
import {
  commandAdvancedStudio,
  readAdvancedStudio,
} from "../../functions/src/blog-studio-advanced";
import {
  studioAuthority,
  requireStudioDraft,
  requireStudioPublisher,
  safeStudioSchedule,
  bindStudioIdentity,
} from "../../functions/src/blog-studio-access";
import {
  googleStudioAvatar,
  studioCursor,
  readStudioCursor,
  studioSearchTokens,
  taxonomyKey,
} from "../../packages/domain/blog-studio-advanced";
function fixture() {
  const reads: string[] = [];
  const data = new Map<string, Record<string, unknown>>([
    ["staffAccess/owner", { active: true, roles: ["OWNER"] }],
    ["users/owner", { locked: false }],
    ["staffAccess/target", { active: true, roles: ["CONTENT_EDITOR"] }],
    ["users/target", { displayName: "Synthetic reader", locked: false }],
    [
      "blogStudioSettings/main",
      {
        commentsEnabled: true,
        requireReview: false,
        categories: [],
        authors: [],
        revision: 1,
      },
    ],
  ]);
  const ref = (path: string) => ({
    path,
    id: path.split("/").at(-1),
    collection: (name: string) => ({
      doc: (id: string) => ref(`${path}/${name}/${id}`),
    }),
  });
  const snap = (path: string) => ({
    ref: ref(path),
    id: path.split("/").at(-1),
    exists: data.has(path),
    data: () => data.get(path),
    get: (k: string) => data.get(path)?.[k],
  });
  const query = (
    path: string,
    filters: [string, unknown][] = [],
    limit = Infinity,
    aggregate = false,
  ): unknown => ({
    path,
    filters,
    cap: limit,
    aggregate,
    where: (key: string, _op: string, v: unknown) =>
      query(path, [...filters, [key, v]], limit),
    orderBy: () => query(path, filters, limit),
    startAfter: () => query(path, filters, limit),
    limit: (n: number) => query(path, filters, n),
    count: () => query(path, filters, limit, true),
  });
  const db = {
    doc: ref,
    collection: (path: string) => query(path),
    runTransaction: async (fn: (tx: unknown) => unknown) => {
      let writing = false;
      const pending: (() => void)[] = [];
      const tx = {
        get: async (r: {
          path: string;
          filters?: [string, unknown][];
          cap?: number;
          aggregate?: boolean;
        }) => {
          if (writing) throw new Error("READ_AFTER_WRITE");
          reads.push(r.path);
          if (r.filters) {
            const docs = [...data.keys()]
              .filter(
                (p) =>
                  p.startsWith(`${r.path}/`) &&
                  p.split("/").length === 2 &&
                  r.filters!.every(([k, v]) =>
                    Array.isArray(v)
                      ? v.includes(data.get(p)?.[k])
                      : data.get(p)?.[k] === v,
                  ),
              )
              .sort()
              .slice(0, r.cap)
              .map(snap);
            return {
              docs,
              size: docs.length,
              data: () => ({ count: docs.length }),
            };
          }
          return snap(r.path);
        },
        set: (r: { path: string }, v: Record<string, unknown>) => {
          writing = true;
          pending.push(() => data.set(r.path, v));
        },
        update: (r: { path: string }, v: Record<string, unknown>) => {
          writing = true;
          pending.push(() => data.set(r.path, { ...data.get(r.path), ...v }));
        },
        create: (r: { path: string }, v: Record<string, unknown>) => {
          writing = true;
          if (data.has(r.path)) throw new Error("EXISTS");
          pending.push(() => data.set(r.path, v));
        },
        delete: (r: { path: string }) => {
          writing = true;
          pending.push(() => data.delete(r.path));
        },
      };
      const result = await fn(tx);
      pending.forEach((f) => f());
      return result;
    },
  } as unknown as Firestore;
  const command = (
    action: string,
    payload: unknown,
    id?: string,
    expectedVersion?: number,
    operationId = `op-${Math.random().toString(16).slice(2)}`,
  ) =>
    commandAdvancedStudio(db, "owner", {
      action,
      payload,
      id,
      expectedVersion,
      operationId,
    });
  return { db, data, command, reads };
}
describe("Exact Studio advanced contracts", () => {
  it("canonical category identity and readable search tokens", () => {
    expect(taxonomyKey("  VẬN CHUYỂN ")).toBe("vận chuyển");
    expect(studioSearchTokens("Đường vận chuyển")).toEqual([
      "duong",
      "van",
      "chuyen",
    ]);
  });
  it("opaque cursor roundtrip and unsafe metadata rejected", () => {
    const value = studioCursor("2026-10-05T00:00:00.000Z", "post-1");
    expect(readStudioCursor(value)).toEqual([
      "2026-10-05T00:00:00.000Z",
      "post-1",
    ]);
    expect(() => readStudioCursor("invalid")).toThrow();
    expect(googleStudioAvatar("https://evil.test/image")).toBeUndefined();
    expect(
      googleStudioAvatar("https://user:pass@lh3.googleusercontent.com/x"),
    ).toBeUndefined();
    expect(
      googleStudioAvatar("https://lh3.googleusercontent.com/x"),
    ).toBeDefined();
  });
  it("schedule projection omits job identities and receipt identifiers", () => {
    const value = safeStudioSchedule({
      dueAt: "time",
      revision: 1,
      actor: "private",
      operationId: "private-operation",
      status: "blocked",
      code: "aborted",
    });
    expect(value).not.toHaveProperty("actor");
    expect(value).not.toHaveProperty("operationId");
    expect(value?.error).toBe("aborted");
  });
  it("author authority requires ownership/assignment and publisher gates", () => {
    expect(() =>
      requireStudioDraft("author", "a", { owner: "b", assignee: "c" }),
    ).toThrow();
    expect(() =>
      requireStudioDraft("author", "a", { owner: "b", assignee: "a" }),
    ).not.toThrow();
    expect(() => requireStudioPublisher("author")).toThrow();
  });
  it("revoked membership tombstone denies authority without altering CRM roles", async () => {
    const f = fixture();
    await f.command(
      "memberSave",
      { targetUid: "target", role: "author", active: true },
      undefined,
      1,
    );
    expect(f.data.get("blogEditorialMembers/target")?.role).toBe("author");
    const staff = JSON.stringify(f.data.get("staffAccess/target"));
    await f.command("memberRevoke", { targetUid: "target" }, undefined, 2);
    expect(f.data.get("blogEditorialMembers/target")?.active).toBe(false);
    expect(JSON.stringify(f.data.get("staffAccess/target"))).toBe(staff);
    await expect(
      f.db.runTransaction((tx) => studioAuthority(f.db, tx, "target")),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });
  it("self privilege edits and ineligible staff deny", async () => {
    const f = fixture();
    await expect(
      f.command(
        "memberSave",
        { targetUid: "owner", role: "author" },
        undefined,
        1,
      ),
    ).rejects.toMatchObject({ code: "failed-precondition" });
    f.data.set("staffAccess/target", { active: true, roles: ["SUPPORT"] });
    await expect(
      f.command(
        "memberSave",
        { targetUid: "target", role: "admin" },
        undefined,
        1,
      ),
    ).rejects.toMatchObject({ code: "failed-precondition" });
    expect(f.data.has("blogEditorialMembers/target")).toBe(false);
  });
  it("taxonomy normalized duplicates reuse identity and keep settings in sync", async () => {
    const f = fixture();
    const a = await f.command("categoryCreate", { name: "Vận chuyển" }),
      b = await f.command("categoryCreate", { name: "  VẬN CHUYỂN  " });
    expect(b.category.id).toBe(a.category.id);
    expect(
      [...f.data.keys()].filter((p) => p.startsWith("blogCategories/")),
    ).toHaveLength(1);
    expect(f.data.get("blogStudioSettings/main")?.categories).toEqual([
      "Vận chuyển",
    ]);
  });
  it("catalog author lookup explicitly links verified identity but cannot grant roles", async () => {
    const f = fixture();
    const r = await f.command("catalogUpdate", {
      kind: "authors",
      name: "Tác giả",
      bio: "Giới thiệu",
      email: "target@example.com",
    });
    expect(r.record.linkedUid).toBe("target");
    expect(r.record.googleAvatar).toBe(
      "https://lh3.googleusercontent.com/image",
    );
    expect(f.data.get("staffAccess/target")?.roles).toEqual(["CONTENT_EDITOR"]);
    const settings = f.data.get("blogStudioSettings/main")!;
    expect(settings.authors).toEqual([
      expect.objectContaining({ id: r.record.id, name: "Tác giả" }),
    ]);
  });
  it("OWNER-only export refuses over1000 without partial result", async () => {
    const f = fixture();
    for (let n = 0; n < 1001; n++)
      f.data.set(`blogDrafts/post-${n}`, { title: "Synthetic" });
    await expect(
      readAdvancedStudio(f.db, "owner", { kind: "export" }),
    ).rejects.toMatchObject({ code: "resource-exhausted" });
  });
  it("member changed eligibility is checked before completed replay", async () => {
    const f = fixture();
    await f.command(
      "memberSave",
      { targetUid: "target", role: "author" },
      undefined,
      1,
      "stable-op",
    );
    f.data.set("staffAccess/target", {
      active: false,
      roles: ["CONTENT_EDITOR"],
    });
    await expect(
      f.command(
        "memberSave",
        { targetUid: "target", role: "author" },
        undefined,
        1,
        "stable-op",
      ),
    ).rejects.toMatchObject({ code: "failed-precondition" });
  });
});

describe("Original reports and email invitations", () => {
  it("reports expose no reporter identity and resolve129charIDs with CAS", async () => {
    const f = fixture(),
      id = `${"a".repeat(64)}-${"b".repeat(64)}`;
    f.data.set(`blogCommentReports/${id}`, {
      commentId: "comment-1",
      reporter: "private-user",
      reason: "Synthetic reason",
      state: "open",
      revision: 1,
      createdAt: "now",
    });
    const page = await readAdvancedStudio(f.db, "owner", {
      kind: "reports",
      state: "open",
    });
    if (!Array.isArray(page.items))
      throw new Error("Expected reports page items");
    const report = page.items[0];
    expect(report).toBeDefined();
    expect(report).not.toHaveProperty("reporter");
    const r = await f.command("reportResolve", undefined, id, 1);
    expect(r.report.state).toBe("resolved");
    expect(r.report.revision).toBe(2);
    await expect(
      f.command("reportResolve", undefined, id, 1),
    ).rejects.toMatchObject({ code: "aborted" });
  });
  it("email pending invite grants noCRM and binds eligibleverifiedidentity asauthor", async () => {
    const f = fixture();
    const r = await f.command(
      "memberSave",
      { email: "new@example.com", role: "author" },
      undefined,
      1,
    );
    expect(r.member.connected).toBe(false);
    expect(f.data.has("blogEditorialMembers/target")).toBe(false);
    const originalStaff = JSON.stringify(f.data.get("staffAccess/target"));
    await bindStudioIdentity(f.db, "target", "new@example.com");
    expect(f.data.get("blogEditorialMembers/target")?.role).toBe("author");
    expect(JSON.stringify(f.data.get("staffAccess/target"))).toBe(
      originalStaff,
    );
    const list = await readAdvancedStudio(f.db, "owner", { kind: "members" });
    if (!Array.isArray(list.items))
      throw new Error("Expected member page items");
    expect(
      list.items.some(
        (i) => i.email === "new@example.com" && i.connected === true,
      ),
    ).toBe(true);
    await f.command("memberRevoke", { email: "new@example.com" }, undefined, 2);
    await bindStudioIdentity(f.db, "target", "new@example.com");
    await expect(
      f.db.runTransaction((tx) => studioAuthority(f.db, tx, "target")),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });
  it("email self-change denied and invite cannotbind ineligible or differentUID", async () => {
    const f = fixture();
    await expect(
      f.command(
        "memberSave",
        { email: "owner@example.com", role: "author" },
        undefined,
        1,
      ),
    ).rejects.toMatchObject({ code: "failed-precondition" });
    await f.command(
      "memberSave",
      { email: "new@example.com", role: "author" },
      undefined,
      1,
    );
    f.data.set("staffAccess/target", { active: true, roles: ["SUPPORT"] });
    await expect(
      bindStudioIdentity(f.db, "target", "new@example.com"),
    ).rejects.toMatchObject({ code: "permission-denied" });
    f.data.set("staffAccess/target", {
      active: true,
      roles: ["CONTENT_EDITOR"],
    });
    await bindStudioIdentity(f.db, "target", "new@example.com");
    await expect(
      bindStudioIdentity(f.db, "owner", "new@example.com"),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });
});

describe("Bounded report hydration", () => {
  it.each([
    "pending",
    "hidden",
    "rejected",
    "spam",
    "deleted",
    "deleted_private",
    "missing",
  ])("does not expose %s comment through report", async (status) => {
    const f = fixture();
    f.data.set("blogCommentReports/report-1", {
      commentId: "comment-1",
      state: "open",
      reporter: "private-uid",
    });
    if (status !== "missing")
      f.data.set("blogComments/comment-1", {
        id: "comment-1",
        status,
        text: "Private text",
        uid: "private-uid",
      });
    const page = await readAdvancedStudio(f.db, "owner", { kind: "reports" });
    if (!Array.isArray(page.items)) throw new Error("Expected report items");
    expect(page.items[0]).toMatchObject({ comment: null });
    expect(JSON.stringify(page)).not.toContain("private-uid");
    expect(JSON.stringify(page)).not.toContain("Private text");
  });
  it("hydrates only deduplicated IDs within first100reportpage and returns safe approved projection", async () => {
    const f = fixture();
    for (let i = 0; i < 101; i++)
      f.data.set(`blogCommentReports/r-${String(i).padStart(3, "0")}`, {
        commentId: i === 100 ? "outside-page" : "comment-1",
        state: "open",
        reporter: "private-uid",
      });
    f.data.set("blogComments/comment-1", {
      id: "comment-1",
      postId: "post-1",
      parentId: "",
      status: "approved",
      name: "Synthetic",
      text: "Reviewed text",
      uid: "private-uid",
      email: "private-email",
      revision: 1,
    });
    const page = await readAdvancedStudio(f.db, "owner", { kind: "reports" });
    if (!Array.isArray(page.items)) throw new Error("Expected report items");
    expect(page.items).toHaveLength(100);
    expect(page.next).toBe("r-099");
    expect(page.items[0]).toMatchObject({
      comment: { id: "comment-1", text: "Reviewed text", status: "approved" },
    });
    expect(f.reads.filter((p) => p.startsWith("blogComments/"))).toEqual([
      "blogComments/comment-1",
    ]);
    expect(JSON.stringify(page)).not.toContain("private-uid");
    expect(JSON.stringify(page)).not.toContain("private-email");
  });
  it("denies revoked publisher before reading referenced comments", async () => {
    const f = fixture();
    f.data.set("blogEditorialMembers/owner", { active: false, role: "reader" });
    f.data.set("blogCommentReports/report-1", {
      commentId: "comment-1",
      state: "open",
    });
    await expect(
      readAdvancedStudio(f.db, "owner", { kind: "reports" }),
    ).rejects.toMatchObject({ code: "permission-denied" });
    expect(f.reads.some((p) => p.startsWith("blogComments/"))).toBe(false);
  });
});

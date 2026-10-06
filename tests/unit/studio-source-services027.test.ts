import { expect, it, vi, beforeEach } from "vitest";
const fixture = vi.hoisted(() => ({
  service: vi.fn(),
  auth: { currentUser: { uid: "one" } as { uid: string } | null },
}));
vi.mock("../../src/shared/firebase", () => ({
  callService: fixture.service,
  auth: fixture.auth,
}));
import { createSourceServices } from "../../src/features/content/studio/source-services";
beforeEach(() => {
  fixture.service.mockReset();
  fixture.auth.currentUser = { uid: "one" };
});
it("advanced uncertain retry preserves receipt and submitted payload", async () => {
  const services = createSourceServices("one");
  fixture.service
    .mockRejectedValueOnce(Error("timeout"))
    .mockResolvedValue({ category: { name: "A" } });
  await expect(services.createCategory("A")).rejects.toThrow("timeout");
  await services.createCategory("A");
  expect(fixture.service.mock.calls[1]).toEqual(fixture.service.mock.calls[0]);
});
it("account switch discards private response and prevents later command", async () => {
  const services = createSourceServices("one");
  fixture.service.mockImplementationOnce(async () => {
    fixture.auth.currentUser = { uid: "two" };
    return { items: [{ id: "private" }] };
  });
  await expect(
    services.advancedRead({ kind: "catalog", catalog: "authors" }),
  ).rejects.toThrow("Tài khoản đã thay đổi");
  await expect(services.createCategory("A")).rejects.toThrow(
    "Tài khoản đã thay đổi",
  );
  expect(fixture.service).toHaveBeenCalledTimes(1);
});
it("new author creates server record while existing author keeps CAS version", async () => {
  const services = createSourceServices("one");
  fixture.service
    .mockResolvedValueOnce({
      items: [{ id: "existing", revision: 4, name: "A" }],
      next: null,
    })
    .mockResolvedValue({ record: { id: "created" } });
  await services.listCatalog("authors");
  await services.request("/api/admin/blog/authors", "POST", {
    id: "client-new",
    name: "New",
    bio: "",
  });
  expect(fixture.service.mock.calls[1][1].id).toBeUndefined();
  await services.request("/api/admin/blog/authors", "POST", {
    id: "existing",
    name: "A",
    bio: "",
  });
  expect(fixture.service.mock.calls[2][1]).toMatchObject({
    id: "existing",
    expectedVersion: 4,
  });
});
it("source reader option revokes only the editorial member grant", async () => {
  const services = createSourceServices("one");
  fixture.service
    .mockResolvedValueOnce({
      items: [{ id: "target", revision: 3, email: "target@example.invalid" }],
      next: null,
    })
    .mockResolvedValue({ member: { id: "target" } });
  await services.advancedRead({ kind: "members" });
  await services.request("/api/admin/blog/members", "POST", {
    id: "target",
    role: "reader",
  });
  expect(fixture.service.mock.calls[1][0]).toBe("studioAdvancedCommand");
  expect(fixture.service.mock.calls[1][1]).toMatchObject({
    action: "memberRevoke",
    expectedVersion: 3,
    payload: { email: "target@example.invalid" },
  });
});
it("schedule cancel uses viewed revision and never silently adopts a newer draft", async () => {
  const services = createSourceServices("one");
  fixture.service.mockResolvedValue({ draft: { id: "post" }, schedule: null });
  await expect(
    services.request("/api/admin/blog/posts/post/schedule", "DELETE"),
  ).rejects.toThrow("Thiếu phiên bản");
  expect(fixture.service).not.toHaveBeenCalled();
  await services.request("/api/admin/blog/posts/post/schedule", "DELETE", {
    revision: 7,
  });
  expect(fixture.service.mock.calls[0][1]).toMatchObject({
    action: "cancelSchedule",
    id: "post",
    expectedVersion: 7,
  });
});
it("new Google email invite sends exclusive email identity with editorial role", async () => {
  const services = createSourceServices("one");
  fixture.service.mockResolvedValue({ member: { id: "pending" } });
  await services.request("/api/admin/blog/members", "POST", {
    email: "New@Example.invalid",
    role: "author",
  });
  expect(fixture.service.mock.calls[0][1].payload).toEqual({
    email: "new@example.invalid",
    role: "author",
    active: true,
  });
});
it("pending email revoke never treats private invite id as a Google UID", async () => {
  const services = createSourceServices("one");
  fixture.service
    .mockResolvedValueOnce({
      items: [
        {
          id: "invite-hash",
          email: "new@example.invalid",
          connected: false,
          revision: 2,
        },
      ],
      next: null,
    })
    .mockResolvedValue({ member: { active: false } });
  await services.advancedRead({ kind: "members" });
  await services.request("/api/admin/blog/members", "DELETE", {
    id: "invite-hash",
  });
  expect(fixture.service.mock.calls[1][1]).toMatchObject({
    action: "memberRevoke",
    expectedVersion: 2,
    payload: { email: "new@example.invalid" },
  });
});
it("report resolve uses report version independently of comment revision", async () => {
  const services = createSourceServices("one");
  fixture.service
    .mockResolvedValueOnce({
      items: [{ id: "comment-reporter-hash", revision: 3 }],
      next: null,
    })
    .mockResolvedValue({ report: { state: "resolved" } });
  await services.advancedRead({ kind: "reports", reportState: "open" });
  await services.request("/api/admin/blog/comment-reports", "POST", {
    id: "comment-reporter-hash",
  });
  expect(fixture.service.mock.calls[1][1]).toMatchObject({
    action: "reportResolve",
    id: "comment-reporter-hash",
    expectedVersion: 3,
    payload: {},
  });
});
it("report resolution refuses an unloaded report", async () => {
  const services = createSourceServices("one");
  await expect(
    services.request("/api/admin/blog/comment-reports", "POST", {
      id: "unknown",
    }),
  ).rejects.toThrow("Báo cáo chưa được tải");
  expect(fixture.service).not.toHaveBeenCalled();
});

it("report query matches the current strict backend schema", async () => {
  const { studioAdvancedReadSchema } =
    await import("../../packages/domain/blog-studio-advanced");
  expect(
    studioAdvancedReadSchema.safeParse({ kind: "reports", reportState: "open" })
      .success,
  ).toBe(true);
  expect(
    studioAdvancedReadSchema.safeParse({ kind: "reports", state: "open" })
      .success,
  ).toBe(true);
});

it("bound invite uses invite CAS by email, UID-only row uses uidRevision", async () => {
  const services = createSourceServices("one");
  fixture.service
    .mockResolvedValueOnce({
      items: [
        {
          id: "invite",
          uid: "bound",
          email: "bound@example.invalid",
          connected: true,
          revision: 8,
          uidRevision: 3,
        },
        {
          id: "legacy",
          uid: "legacy",
          connected: true,
          revision: 9,
          uidRevision: 4,
        },
      ],
      next: null,
    })
    .mockResolvedValue({ member: {} });
  await services.advancedRead({ kind: "members" });
  await services.request("/api/admin/blog/members", "POST", {
    id: "invite",
    role: "author",
  });
  expect(fixture.service.mock.calls[1][1]).toMatchObject({
    expectedVersion: 8,
    payload: { email: "bound@example.invalid", role: "author", active: true },
  });
  await services.request("/api/admin/blog/members", "POST", {
    id: "legacy",
    role: "publisher",
  });
  expect(fixture.service.mock.calls[2][1]).toMatchObject({
    expectedVersion: 4,
    payload: { targetUid: "legacy", role: "publisher", active: true },
  });
});
it("members completes staff and invite pages before returning", async () => {
  const services = createSourceServices("one");
  fixture.service
    .mockResolvedValueOnce({
      items: [{ id: "staff", revision: 4 }],
      next: "invite:",
    })
    .mockResolvedValueOnce({
      items: [
        {
          id: "pending",
          revision: 2,
          connected: false,
          email: "pending@example.invalid",
        },
      ],
      next: null,
    });
  expect(await services.listPeople("members")).toEqual([
    { id: "staff", revision: 4 },
    {
      id: "pending",
      revision: 2,
      connected: false,
      email: "pending@example.invalid",
    },
  ]);
  expect(fixture.service.mock.calls[1][1]).toEqual({
    kind: "members",
    after: "invite:",
  });
});
it("assignable follows an empty filtered staff page with a next cursor", async () => {
  const services = createSourceServices("one");
  fixture.service
    .mockResolvedValueOnce({ items: [], next: "raw-staff-page" })
    .mockResolvedValueOnce({
      items: [{ id: "eligible", name: "Editor" }],
      next: null,
    });
  expect(await services.listPeople("assignable")).toEqual([
    { id: "eligible", name: "Editor" },
  ]);
});
it("people paging rejects unavailable later page instead of partial success", async () => {
  const services = createSourceServices("one");
  fixture.service
    .mockResolvedValueOnce({ items: [{ id: "first" }], next: "next" })
    .mockRejectedValueOnce(Error("unavailable"));
  await expect(services.listPeople("members")).rejects.toThrow("unavailable");
});
it("people paging refuses repeated cursors", async () => {
  const services = createSourceServices("one");
  fixture.service.mockResolvedValue({ items: [], next: "same" });
  await expect(services.listPeople("assignable")).rejects.toThrow(
    "Mốc trang bị lặp",
  );
  expect(fixture.service).toHaveBeenCalledTimes(2);
});
it("people paging enforces item and raw page caps", async () => {
  const services = createSourceServices("one");
  fixture.service.mockResolvedValueOnce({
    items: Array.from({ length: 1001 }, (_, i) => ({ id: String(i) })),
    next: null,
  });
  await expect(services.listPeople("members")).rejects.toThrow("giới hạn tải");
  fixture.service.mockReset();
  let n = 0;
  fixture.service.mockImplementation(async () => ({
    items: [],
    next: `raw-${++n}`,
  }));
  await expect(services.listPeople("assignable")).rejects.toThrow(
    "giới hạn số trang",
  );
  expect(fixture.service).toHaveBeenCalledTimes(100);
});
it("people paging discards UID and request epoch changes before applying a page", async () => {
  const services = createSourceServices("one");
  fixture.service.mockImplementationOnce(async () => {
    fixture.auth.currentUser = { uid: "two" };
    return { items: [{ id: "private" }], next: null };
  });
  await expect(services.listPeople("members")).rejects.toThrow(
    "Tài khoản đã thay đổi",
  );
  fixture.auth.currentUser = { uid: "one" };
  fixture.service.mockReset();
  let current = true;
  fixture.service.mockImplementationOnce(async () => {
    current = false;
    return { items: [{ id: "stale" }], next: "next" };
  });
  await expect(services.listPeople("members", () => current)).rejects.toThrow(
    "Công việc đã thay đổi",
  );
  expect(fixture.service).toHaveBeenCalledTimes(1);
});
it("lost review response retries the exact second receipt without stale save", async () => {
  const services = createSourceServices("one");
  const { emptyStudioDraft } =
    await import("../../packages/domain/blog-studio");
  const input = { draft: emptyStudioDraft, revision: 1, state: "review" };
  fixture.service
    .mockResolvedValueOnce({
      draft: { ...emptyStudioDraft, id: "post", revision: 2 },
    })
    .mockRejectedValueOnce(Error("lost response"))
    .mockResolvedValueOnce({
      draft: { ...emptyStudioDraft, id: "post", revision: 3, state: "review" },
    });
  await expect(
    services.request("/api/admin/blog/posts/post", "PUT", input),
  ).rejects.toThrow("lost response");
  await services.request("/api/admin/blog/posts/post", "PUT", input);
  expect(fixture.service.mock.calls.map((c) => c[1].action)).toEqual([
    "save",
    "review",
    "review",
  ]);
  expect(fixture.service.mock.calls[2][1]).toEqual(
    fixture.service.mock.calls[1][1],
  );
});
it("uncertain archive rejects changed draft rather than restarting stale save", async () => {
  const services = createSourceServices("one");
  const { emptyStudioDraft } =
    await import("../../packages/domain/blog-studio");
  const input = { draft: emptyStudioDraft, revision: 1, state: "archived" };
  fixture.service
    .mockResolvedValueOnce({
      draft: { ...emptyStudioDraft, id: "post", revision: 2 },
    })
    .mockRejectedValueOnce(Error("timeout"));
  await expect(
    services.request("/api/admin/blog/posts/post", "PUT", input),
  ).rejects.toThrow("timeout");
  await expect(
    services.request("/api/admin/blog/posts/post", "PUT", {
      ...input,
      draft: { ...emptyStudioDraft, title: "new typed work" },
    }),
  ).rejects.toThrow("Lần lưu trước chưa hoàn tất");
  expect(fixture.service).toHaveBeenCalledTimes(2);
});
it("genuine Go aborted is a revision conflict; transient failure is not", async () => {
  const { isSourceRevisionConflict } =
    await import("../../src/features/content/studio/source-adapter");
  expect(
    isSourceRevisionConflict(
      Object.assign(Error("Bản thảo đã thay đổi"), {
        code: "functions/aborted",
      }),
    ),
  ).toBe(true);
  expect(
    isSourceRevisionConflict(
      Object.assign(Error("unavailable"), { code: "functions/unavailable" }),
    ),
  ).toBe(false);
});
it("large moderation corpus remains accessible as one bounded page", async () => {
  const services = createSourceServices("one");
  const page = {
    items: Array.from({ length: 30 }, (_, i) => ({ id: String(i) })),
    next: "opaque-next-for-remaining-5000",
  };
  fixture.service.mockResolvedValue(page);
  expect(await services.moderationPage("pending")).toEqual(page);
  expect(fixture.service).toHaveBeenCalledTimes(1);
  expect(fixture.service.mock.calls[0][1]).toEqual({
    kind: "moderation",
    status: "pending",
  });
  await services.moderationPage("pending", page.next);
  expect(fixture.service.mock.calls[1][1]).toEqual({
    kind: "moderation",
    status: "pending",
    after: page.next,
  });
});
it("hydrated report page never requests the approved comment corpus", async () => {
  const services = createSourceServices("one");
  const report = {
    id: "report",
    commentId: "comment",
    revision: 5,
    comment: { id: "comment", revision: 9, text: "Current approved" },
  };
  fixture.service.mockResolvedValue({ items: [report], next: "more-reports" });
  const result = await services.advancedRead<{
    items: (typeof report)[];
    next: string;
  }>({ kind: "reports", reportState: "open" });
  const { sourceReportItem } =
    await import("../../src/features/content/studio/source-adapter");
  expect(sourceReportItem(result.items[0])).toMatchObject({
    reportRevision: 5,
    revision: 9,
    text: "Current approved",
  });
  expect(sourceReportItem({ ...report, comment: null })).toMatchObject({
    revision: 0,
    text: "Bình luận hiện không hiển thị.",
  });
  expect(fixture.service).toHaveBeenCalledTimes(1);
  expect(fixture.service.mock.calls[0][0]).toBe("studioAdvancedRead");
});
it("terminal validation permits corrected save with a new identity", async () => {
  const { emptyStudioDraft } =
    await import("../../packages/domain/blog-studio");
  const services = createSourceServices("one");
  fixture.service
    .mockRejectedValueOnce(
      Object.assign(Error("invalid title"), {
        code: "functions/invalid-argument",
      }),
    )
    .mockResolvedValueOnce({ draft: { ...emptyStudioDraft, revision: 2 } });
  await expect(
    services.request("/api/admin/blog/posts/post", "PUT", {
      draft: emptyStudioDraft,
      revision: 1,
    }),
  ).rejects.toThrow("invalid title");
  await services.request("/api/admin/blog/posts/post", "PUT", {
    draft: { ...emptyStudioDraft, title: "Corrected" },
    revision: 1,
  });
  expect(fixture.service.mock.calls[1][1].payload.title).toBe("Corrected");
  expect(fixture.service.mock.calls[1][1].operationId).not.toBe(
    fixture.service.mock.calls[0][1].operationId,
  );
});
it("terminal transition exposes confirmed revision and releases rejected snapshot", async () => {
  const { emptyStudioDraft } =
    await import("../../packages/domain/blog-studio");
  const services = createSourceServices("one");
  fixture.service
    .mockResolvedValueOnce({
      draft: { ...emptyStudioDraft, revision: 2, state: "draft" },
    })
    .mockRejectedValueOnce(
      Object.assign(Error("review denied"), {
        code: "functions/permission-denied",
      }),
    )
    .mockResolvedValueOnce({ draft: { ...emptyStudioDraft, revision: 3 } });
  await expect(
    services.request("/api/admin/blog/posts/post", "PUT", {
      draft: emptyStudioDraft,
      revision: 1,
      state: "review",
    }),
  ).rejects.toMatchObject({ confirmedSave: { revision: 2, state: "draft" } });
  await services.request("/api/admin/blog/posts/post", "PUT", {
    draft: { ...emptyStudioDraft, title: "Later local text" },
    revision: 2,
  });
  expect(fixture.service.mock.calls[2][1]).toMatchObject({
    action: "save",
    expectedVersion: 2,
    payload: { title: "Later local text" },
  });
});
for (const step of ["hide", "resolve"])
  it(`report composite replays lost ${step} exactly`, async () => {
    const services = createSourceServices("one");
    fixture.service.mockResolvedValueOnce({
      items: [{ id: "report", revision: 5 }],
      next: null,
    });
    await services.advancedRead({ kind: "reports", reportState: "open" });
    if (step === "hide")
      fixture.service
        .mockRejectedValueOnce(Error("lost"))
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ report: { id: "report" } });
    else
      fixture.service
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(Error("lost"))
        .mockResolvedValueOnce({ report: { id: "report" } });
    const input = {
      id: "report",
      hideComment: true,
      commentId: "comment",
      commentRevision: 9,
      reportRevision: 5,
    };
    await expect(
      services.request("/api/admin/blog/comment-reports", "POST", input),
    ).rejects.toThrow("lost");
    await services.request("/api/admin/blog/comment-reports", "POST", input);
    expect(fixture.service.mock.calls[step === "hide" ? 2 : 3]).toEqual(
      fixture.service.mock.calls[step === "hide" ? 1 : 2],
    );
    expect(fixture.service.mock.calls.slice(1).map((c) => c[1].action)).toEqual(
      step === "hide"
        ? ["moderate", "moderate", "reportResolve"]
        : ["moderate", "reportResolve", "reportResolve"],
    );
  });
it("terminal resolve preserves confirmed hide and viewed report revision", async () => {
  const services = createSourceServices("one");
  fixture.service.mockResolvedValueOnce({
    items: [{ id: "report", revision: 5 }],
    next: null,
  });
  await services.advancedRead({ kind: "reports" });
  fixture.service
    .mockResolvedValueOnce({})
    .mockRejectedValueOnce(
      Object.assign(Error("denied"), { code: "functions/permission-denied" }),
    )
    .mockResolvedValueOnce({ report: {} });
  const input = {
    id: "report",
    hideComment: true,
    commentId: "comment",
    commentRevision: 9,
    reportRevision: 5,
  };
  await expect(
    services.request("/api/admin/blog/comment-reports", "POST", input),
  ).rejects.toThrow("denied");
  await services.request("/api/admin/blog/comment-reports", "POST", input);
  expect(fixture.service.mock.calls.slice(1).map((c) => c[1].action)).toEqual([
    "moderate",
    "reportResolve",
    "reportResolve",
  ]);
  expect(fixture.service.mock.calls[3][1].expectedVersion).toBe(5);
  expect(fixture.service.mock.calls[3][1].operationId).not.toBe(
    fixture.service.mock.calls[2][1].operationId,
  );
});
it("report composite does not adopt a fresh CAS after aborted resolve", async () => {
  const services = createSourceServices("one");
  fixture.service.mockResolvedValueOnce({
    items: [{ id: "report", revision: 5 }],
    next: null,
  });
  await services.advancedRead({ kind: "reports" });
  fixture.service
    .mockResolvedValueOnce({})
    .mockRejectedValueOnce(
      Object.assign(Error("changed"), { code: "functions/aborted" }),
    )
    .mockResolvedValueOnce({
      items: [{ id: "report", revision: 6 }],
      next: null,
    })
    .mockRejectedValueOnce(
      Object.assign(Error("changed"), { code: "functions/aborted" }),
    );
  const input = {
    id: "report",
    hideComment: true,
    commentId: "comment",
    commentRevision: 9,
    reportRevision: 5,
  };
  await expect(
    services.request("/api/admin/blog/comment-reports", "POST", input),
  ).rejects.toThrow("changed");
  await services.advancedRead({ kind: "reports" });
  await expect(
    services.request("/api/admin/blog/comment-reports", "POST", input),
  ).rejects.toThrow("changed");
  expect(fixture.service.mock.calls[4][1].expectedVersion).toBe(5);
  expect(
    fixture.service.mock.calls.filter((c) => c[1].action === "moderate"),
  ).toHaveLength(1);
});
it("report composite fences account switch before resolution", async () => {
  const services = createSourceServices("one");
  fixture.service.mockResolvedValueOnce({
    items: [{ id: "report", revision: 5 }],
    next: null,
  });
  await services.advancedRead({ kind: "reports" });
  fixture.service.mockImplementationOnce(async () => {
    fixture.auth.currentUser = { uid: "two" };
    return {};
  });
  await expect(
    services.request("/api/admin/blog/comment-reports", "POST", {
      id: "report",
      hideComment: true,
      commentId: "comment",
      commentRevision: 9,
      reportRevision: 5,
    }),
  ).rejects.toThrow("Tài khoản đã thay đổi");
  expect(fixture.service).toHaveBeenCalledTimes(2);
});

import { describe, it, expect } from "vitest";
import {
  bodyText,
  emptyStudioDraft,
  mediaIds,
  nextStudioRevision,
  publishedStudioPost,
  safeUrl,
  studioDraftSchema,
  validateBody,
  validatePublish,
  type StudioPost,
} from "../../packages/domain/blog-studio";
const draft: StudioPost = {
  ...emptyStudioDraft,
  title: "Bài viết",
  slug: "bai-viet",
  summary: "Tóm tắt",
  category: "Synthetic category",
  sources: [{ title: "Synthetic source", url: "https://example.com/source" }],
  authorId: "private-user",
  assignee: "private-staff",
  body: {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "Nội dung" }] },
    ],
  },
  id: "post-1",
  owner: "private-owner",
  revision: 1,
  state: "draft",
  updatedAt: "2026-10-05T00:00:00.000Z",
};
describe("Studio rich content authority", () => {
  it.each([
    "javascript:alert(1)",
    "data:text/html,hello",
    "https://user:pass@example.com",
    "//evil.test",
  ])("rejects unsafe URL %s", (u) => expect(safeUrl(u)).toBe(false));
  it("permits ordinary http links", () =>
    expect(safeUrl("https://example.com/a?q=x")).toBe(true));
  it.each([
    { type: "script" },
    { type: "doc", content: [{ type: "text", text: 4 }] },
    {
      type: "doc",
      content: [
        {
          type: "paragraph",
          marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
        },
      ],
    },
    {
      type: "doc",
      content: [{ type: "image", attrs: { src: "https://example.com/x.png" } }],
    },
    {
      type: "doc",
      content: [{ type: "tableRow", content: [{ type: "script" }] }],
    },
    { type: "doc", content: [{ type: "doc" }] },
  ])("rejects malformed rich content", (body) =>
    expect(() => validateBody(body)).toThrow(),
  );
  it("strips executable/unknown attributes and preserves safe link", () => {
    const body = validateBody({
      type: "doc",
      attrs: { onclick: "evil" },
      content: [
        {
          type: "text",
          text: "safe",
          marks: [
            {
              type: "link",
              attrs: { href: "https://example.com", onclick: "evil" },
            },
          ],
        },
      ],
    });
    expect(JSON.stringify(body)).not.toContain("onclick");
    expect(bodyText(body)).toBe("safe");
  });
  it("bounds depth and serialized size", () => {
    let node: unknown = { type: "paragraph" };
    for (let n = 0; n < 14; n++) node = { type: "blockquote", content: [node] };
    expect(() => validateBody({ type: "doc", content: [node] })).toThrow();
    expect(() =>
      validateBody({
        type: "doc",
        content: [{ type: "text", text: "a".repeat(200001) }],
      }),
    ).toThrow();
  });
  it("deduplicates owned media ids", () => {
    const body = validateBody({
      type: "doc",
      content: [
        {
          type: "image",
          attrs: { src: "/media/image-1", alt: "Ảnh", width: 300 },
        },
        { type: "image", attrs: { src: "/media/image-1" } },
      ],
    });
    expect(mediaIds(body)).toEqual(["image-1"]);
  });
  it.each([null, 0, -1, 1.5, "1", Number.MAX_SAFE_INTEGER])(
    "denies invalid revision %s",
    (v) => expect(() => nextStudioRevision(v)).toThrow(),
  );
  it("strictly rejects leaked/unsupported draft fields", () =>
    expect(
      studioDraftSchema.safeParse({ ...emptyStudioDraft, owner: "attacker" })
        .success,
    ).toBe(false));
  it("uses explicit public allowlist and preserves source draft", () => {
    const before = JSON.stringify(draft),
      p = publishedStudioPost(
        draft,
        { name: "Tác giả", bio: "Giới thiệu" },
        "2026-10-06T00:00:00.000Z",
      );
    expect(p.content).toBe("Nội dung");
    expect(p.author).toBe("Tác giả");
    for (const key of ["owner", "authorId", "assignee", "scheduledAt", "state"])
      expect(p).not.toHaveProperty(key);
    expect(JSON.stringify(draft)).toBe(before);
  });
});

describe("Reference publication requirements", () => {
  it("requires category and at least one source", () => {
    expect(() => validatePublish({ ...draft, category: "" })).toThrow(
      "PUBLISH_REQUIRED",
    );
    expect(() => validatePublish({ ...draft, sources: [] })).toThrow(
      "PUBLISH_REQUIRED",
    );
  });
  it("permits30 unique inline images but denies31", () => {
    const images = Array.from({ length: 31 }, (_, i) => ({
      type: "image",
      attrs: { src: `/media/image-${i}` },
    }));
    const body = {
      ...draft.body,
      content: [...(draft.body.content ?? []), ...images],
    };
    expect(() =>
      validatePublish({
        ...draft,
        body: { ...body, content: body.content.slice(0, -1) },
      }),
    ).not.toThrow();
    expect(() => validatePublish({ ...draft, body })).toThrow(
      "TOO_MANY_IMAGES",
    );
  });
});

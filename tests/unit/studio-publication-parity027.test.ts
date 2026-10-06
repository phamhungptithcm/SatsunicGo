import { expect, it } from "vitest";
import {
  emptyStudioDraft,
  type RichNode,
} from "../../packages/domain/blog-studio";
import { publicationChecks } from "../../src/features/content/studio/state";

const reference = {
  ...emptyStudioDraft,
  title: "Hướng dẫn gửi hàng Mỹ – Việt Nam",
  slug: "huong-dan-gui-hang",
  summary: "Các bước chuẩn bị và theo dõi kiện hàng của bạn.",
  authorId: "reference-author",
  category: "Hướng dẫn",
  sources: [
    { title: "Nguồn tham khảo", url: "https://example.invalid/reference" },
  ],
  body: {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Chuẩn bị kiện hàng" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Kiểm tra thông tin đơn hàng và địa chỉ nhận trước khi gửi.",
          },
        ],
      },
    ],
  },
};
const check = (body: RichNode, index: number) =>
  publicationChecks({ ...reference, body })[index].ok;
const nested = (...content: RichNode[]): RichNode => ({
  type: "doc",
  content: [
    {
      type: "blockquote",
      content: [
        { type: "bulletList", content: [{ type: "listItem", content }] },
      ],
    },
  ],
});

it("matches original reference six-of-nine and exact label order", () => {
  const checks = publicationChecks(reference);
  expect(checks.map((c) => c.ok)).toEqual([
    true,
    true,
    true,
    false,
    true,
    false,
    true,
    true,
    false,
  ]);
  expect(checks.filter((c) => c.ok)).toHaveLength(6);
  expect(checks.map((c) => c.label)).toEqual([
    "Có tiêu đề và tóm tắt",
    "Đã chọn tác giả",
    "Có mô tả SEO",
    "Có ảnh bìa",
    "Ảnh trong bài có alt mô tả",
    "Có ý chính cho người đọc",
    "Có nguồn tham khảo (khi bài cần)",
    "Link dùng địa chỉ hợp lệ",
    "Có checklist áp dụng (nếu phù hợp)",
  ]);
});

it("requires descriptive alt on every nested image and preserves no-image semantics", () => {
  const image = (alt?: string): RichNode => ({
    type: "image",
    attrs: { src: "/media/fixture", ...(alt === undefined ? {} : { alt }) },
  });
  for (const invalid of [undefined, "", "   "]) {
    expect(check(nested(image("Kiện hàng"), image(invalid)), 4)).toBe(false);
  }
  expect(check(nested(image("Kiện hàng"), image("Địa chỉ nhận")), 4)).toBe(
    true,
  );
  expect(check(emptyStudioDraft.body, 4)).toBe(true);
});

it("checks every nested link with unchanged absolute HTTP(S) safety rules", () => {
  const link = (href?: string): RichNode => ({
    type: "text",
    text: "Nguồn",
    marks: [
      { type: "bold" },
      { type: "link", attrs: href === undefined ? {} : { href } },
    ],
  });
  for (const invalid of [
    undefined,
    "",
    "/relative",
    "javascript:alert(1)",
    "https://user:pass@example.invalid",
  ]) {
    expect(
      check(nested(link("https://example.invalid"), link(invalid)), 7),
    ).toBe(false);
  }
  expect(
    check(
      nested(link("https://example.invalid"), link("http://example.invalid")),
      7,
    ),
  ).toBe(true);
  expect(check(emptyStudioDraft.body, 7)).toBe(true);
});

it("requires checklist wording in a heading rather than ordinary article text", () => {
  for (const text of [
    "CHECKLIST gửi hàng",
    "Kiểm tra kiện hàng",
    "kiem tra dia chi",
  ]) {
    const content = [{ type: "text", text }];
    expect(
      check(nested({ type: "heading", attrs: { level: 2 }, content }), 8),
    ).toBe(true);
    expect(check(nested({ type: "paragraph", content }), 8)).toBe(false);
  }
  expect(check(reference.body, 8)).toBe(false);
});

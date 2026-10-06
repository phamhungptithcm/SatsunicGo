import { expect, test } from "vitest";
import { richContentHtml } from "../../packages/domain/rich-content-html";
test("rich public renderer preserves formatting and escapes text and attributes", () => {
  const html = richContentHtml({
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 2 },
        content: [
          {
            type: "text",
            text: '<script>alert("x")</script>',
            marks: [{ type: "bold" }],
          },
        ],
      },
      {
        type: "image",
        attrs: { src: "/media/safe-id", alt: '" onerror="alert(1)' },
      },
    ],
  });
  expect(html).toContain("<h2>");
  expect(html).toContain("&lt;script&gt;");
  expect(html).not.toContain("<script>");
  expect(html).toContain("&quot; onerror=&quot;");
});
test("rich public renderer rejects untrusted tags links and image references", () => {
  for (const node of [
    { type: "script" },
    { type: "image", attrs: { src: "https://example.com/private.png" } },
    {
      type: "text",
      text: "bad",
      marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
    },
  ])
    expect(() => richContentHtml({ type: "doc", content: [node] })).toThrow();
});

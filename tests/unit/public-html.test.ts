import { expect, test } from "vitest";
import { contentHtml } from "../../functions/src/public";
test("public HTML contains readable content and canonical metadata without script injection", () => {
  const html = contentHtml(
    "Title </script><script>alert(1)</script>",
    "Body <img src=x onerror=attack>",
    "/posts/example",
  );
  expect(html).toContain(
    '<link rel="canonical" href="https://satsunicgo.web.app/posts/example">',
  );
  expect(html).toContain("Body &lt;img");
  expect(html).not.toContain("<script>alert(1)</script>");
  expect(html).toContain("application/ld+json");
  expect(html).toContain("<h1>");
});
test("public images escape alternative text and never accept arbitrary paths", () => {
  const html = contentHtml("Title", "Published body", "/posts/example", {
    id: "fixture-image",
    alt: '" onerror="attack',
  });
  expect(html).toContain("/media/fixture-image");
  expect(html).not.toContain('alt="" onerror');
  expect(
    contentHtml("Title", "Body", "/posts/example", {
      id: "https://evil.invalid/image",
      alt: "Image",
    }),
  ).not.toContain("<img src=");
});
test("listed product structured data uses the explicit VND price and never claims stock", () => {
  const html = contentHtml(
    "Fixture product",
    "Full payment before staff purchasing",
    "/products/fixture",
    undefined,
    undefined,
    120000,
  );
  expect(html).toContain('"price":120000');
  expect(html).toContain('"priceCurrency":"VND"');
  expect(html).not.toContain('"availability"');
  expect(
    contentHtml("Fixture", "Not orderable", "/products/fixture"),
  ).not.toContain('"offers"');
});

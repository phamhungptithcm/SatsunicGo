import { expect, test } from "vitest";
import { verifyImage } from "../../packages/domain/media";
test("rejects SVG/HTML and mismatched MIME, accepts bounded image signatures", () => {
  expect(() =>
    verifyImage(
      new TextEncoder().encode('<svg onload="attack"></svg>'),
      "image/png",
    ),
  ).toThrow();
  expect(() =>
    verifyImage(new Uint8Array(2 * 1024 * 1024 + 1), "image/jpeg"),
  ).toThrow();
  const bytes = new Uint8Array(
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    ),
  );
  expect(verifyImage(bytes, "image/png")).toBe("image/png");
  expect(() => verifyImage(bytes, "image/jpeg")).toThrow();
});

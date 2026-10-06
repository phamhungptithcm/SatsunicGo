import { expect, it } from "vitest";
import sharp from "sharp";
import { sanitizeProductImage } from "../../functions/src/ai/product-images";
it("patched decoder normalizes an image to bounded JPEG without metadata and rejects disguised content", async () => {
  const bytes = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  );
  const result = await sanitizeProductImage(bytes, "image/png");
  const meta = await sharp(result).metadata();
  expect(meta.format).toBe("jpeg");
  expect(meta.width).toBe(1);
  expect(meta.exif).toBeUndefined();
  await expect(
    sanitizeProductImage(Buffer.from("<svg/>"), "image/png"),
  ).rejects.toThrow();
});

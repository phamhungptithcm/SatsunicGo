import { describe, it, expect } from "vitest";
import sharp from "sharp";
import {
  validateStudioImage,
  normalizeStudioImage,
} from "../../functions/src/blog-studio";
describe("Studio image decoder", () => {
  it.each(["png", "jpeg", "webp", "gif"] as const)(
    "accepts real %s pixels",
    async (format) => {
      const bytes = await sharp({
        create: { width: 2, height: 2, channels: 3, background: "#163cff" },
      })
        .toFormat(format)
        .toBuffer();
      await expect(
        validateStudioImage(bytes, `image/${format}`),
      ).resolves.toBeUndefined();
    },
  );
  it("denies declared format mismatch and truncated bytes", async () => {
    const bytes = await sharp({
      create: { width: 2, height: 2, channels: 3, background: "#163cff" },
    })
      .png()
      .toBuffer();
    await expect(validateStudioImage(bytes, "image/gif")).rejects.toMatchObject(
      { code: "invalid-argument" },
    );
    await expect(
      validateStudioImage(bytes.subarray(0, 18), "image/png"),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });
  it("denies oversized input, SVG and dimensions", async () => {
    await expect(
      validateStudioImage(Buffer.alloc(5 * 1024 * 1024 + 1), "image/png"),
    ).rejects.toMatchObject({ code: "invalid-argument" });
    await expect(
      validateStudioImage(
        Buffer.from(
          '<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"/>',
        ),
        "image/png",
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
    const bytes = await sharp({
      create: {
        width: 10001,
        height: 2000,
        channels: 3,
        background: "#163cff",
      },
    })
      .png()
      .toBuffer();
    await expect(validateStudioImage(bytes, "image/png")).rejects.toMatchObject(
      { code: "invalid-argument" },
    );
  });
});

describe("Reference image normalization", () => {
  it.each(["png", "jpeg", "webp", "gif"] as const)(
    "normalizes %s into bounded WebP",
    async (format) => {
      const input = await sharp({
        create: { width: 2, height: 2, channels: 3, background: "#163cff" },
      })
        .toFormat(format)
        .toBuffer();
      const r = await normalizeStudioImage(input, `image/${format}`);
      expect(r.mime).toBe("image/webp");
      expect((await sharp(r.bytes).metadata()).format).toBe("webp");
      expect(r.width).toBe(2);
    },
  );
  it("resizes2400 and strips EXIF metadata", async () => {
    const input = await sharp({
      create: { width: 3000, height: 2, channels: 3, background: "#163cff" },
    })
      .jpeg()
      .withMetadata({ orientation: 1 })
      .toBuffer();
    expect((await sharp(input).metadata()).exif).toBeDefined();
    const r = await normalizeStudioImage(input, "image/jpeg");
    const m = await sharp(r.bytes).metadata();
    expect(r.width).toBe(2400);
    expect(m.exif).toBeUndefined();
    expect(m.xmp).toBeUndefined();
  });
});

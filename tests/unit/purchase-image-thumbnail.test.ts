import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { purchaseImageThumbnail } from "../../functions/src/purchase-image-thumbnail";

async function markedImage(width: number, height: number) {
  return sharp(
    Buffer.from(`<svg width="${width}" height="${height}">
    <rect width="100%" height="100%" fill="white"/>
    <rect width="100%" height="20" fill="red"/>
    <rect y="${height - 20}" width="100%" height="20" fill="blue"/>
    <rect y="20" width="20" height="${height - 40}" fill="lime"/>
    <rect x="${width - 20}" y="20" width="20" height="${height - 40}" fill="yellow"/>
  </svg>`),
  )
    .png()
    .toBuffer();
}

describe("Private product image thumbnail", () => {
  it.each([
    [120, 240, 80, 160],
    [240, 120, 160, 80],
    [240, 240, 160, 160],
  ])(
    "preserves all four edges of a %i x %i photo",
    async (w, h, outW, outH) => {
      const result = await purchaseImageThumbnail(
        await markedImage(w, h),
        "image/png",
      );
      const meta = await sharp(result).metadata();
      expect([meta.width, meta.height, meta.format]).toEqual([
        outW,
        outH,
        "jpeg",
      ]);
      const { data, info } = await sharp(result)
        .raw()
        .toBuffer({ resolveWithObject: true });
      const pixel = (x: number, y: number) => [
        ...data.subarray(
          (y * info.width + x) * info.channels,
          (y * info.width + x) * info.channels + 3,
        ),
      ];
      const [top, bottom, left, right] = [
        pixel(Math.floor(outW / 2), 3),
        pixel(Math.floor(outW / 2), outH - 4),
        pixel(3, Math.floor(outH / 2)),
        pixel(outW - 4, Math.floor(outH / 2)),
      ];
      expect(top[0]).toBeGreaterThan(220);
      expect(top[1]).toBeLessThan(35);
      expect(bottom[2]).toBeGreaterThan(220);
      expect(bottom[0]).toBeLessThan(35);
      expect(left[1]).toBeGreaterThan(220);
      expect(left[0]).toBeLessThan(35);
      expect(right[0]).toBeGreaterThan(220);
      expect(right[1]).toBeGreaterThan(220);
      expect(right[2]).toBeLessThan(35);
    },
  );

  it("does not enlarge a tiny source", async () => {
    const bytes = await sharp({
      create: { width: 8, height: 12, channels: 3, background: "white" },
    })
      .png()
      .toBuffer();
    const meta = await sharp(
      await purchaseImageThumbnail(bytes, "image/png"),
    ).metadata();
    expect([meta.width, meta.height]).toEqual([8, 12]);
  });

  it("flattens transparent product backgrounds onto white", async () => {
    const bytes = await sharp(
      Buffer.from(
        '<svg width="120" height="240"><rect x="40" y="80" width="40" height="80" fill="red"/></svg>',
      ),
    )
      .png()
      .toBuffer();
    const result = await purchaseImageThumbnail(bytes, "image/png");
    const meta = await sharp(result).metadata();
    expect(meta.hasAlpha).toBe(false);
    const { data } = await sharp(result)
      .raw()
      .toBuffer({ resolveWithObject: true });
    expect([...data.subarray(0, 3)]).toEqual([255, 255, 255]);
  });

  it("honors EXIF orientation and strips metadata", async () => {
    const bytes = await sharp(await markedImage(240, 120))
      .withMetadata({ orientation: 6 })
      .jpeg()
      .toBuffer();
    const meta = await sharp(
      await purchaseImageThumbnail(bytes, "image/jpeg"),
    ).metadata();
    expect([meta.width, meta.height]).toEqual([80, 160]);
    expect(meta.exif).toBeUndefined();
    expect(meta.orientation).toBeUndefined();
  });

  it.each(["image/jpeg", "image/webp"])(
    "accepts and bounds %s uploads",
    async (mime) => {
      const source = sharp(await markedImage(240, 120));
      const bytes = await (
        mime === "image/jpeg" ? source.jpeg() : source.webp()
      ).toBuffer();
      const meta = await sharp(
        await purchaseImageThumbnail(bytes, mime),
      ).metadata();
      expect([meta.width, meta.height, meta.format]).toEqual([160, 80, "jpeg"]);
    },
  );

  it("rejects invalid, disguised, oversized and over-pixel-limit inputs", async () => {
    await expect(
      purchaseImageThumbnail(Buffer.from("not an image"), "image/png"),
    ).rejects.toThrow();
    await expect(
      purchaseImageThumbnail(await markedImage(120, 240), "image/jpeg"),
    ).rejects.toThrow();
    await expect(
      purchaseImageThumbnail(Buffer.alloc(2 * 1024 * 1024 + 1), "image/png"),
    ).rejects.toThrow();
    const tooManyPixels = await sharp({
      create: { width: 5000, height: 5000, channels: 3, background: "white" },
    })
      .png()
      .toBuffer();
    await expect(
      purchaseImageThumbnail(tooManyPixels, "image/png"),
    ).rejects.toThrow("INVALID_IMAGE_DIMENSIONS");
  });

  it("keeps concurrent transforms independent", async () => {
    const photos = await Promise.all([
      markedImage(120, 240),
      markedImage(240, 120),
    ]);
    const results = await Promise.all(
      photos.map((bytes) => purchaseImageThumbnail(bytes, "image/png")),
    );
    const sizes = await Promise.all(
      results.map(async (bytes) => {
        const meta = await sharp(bytes).metadata();
        return [meta.width, meta.height];
      }),
    );
    expect(sizes).toEqual([
      [80, 160],
      [160, 80],
    ]);
  });
});

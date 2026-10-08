import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { productThumbnail } from "../../functions/src/product-thumbnail";
describe("Public product thumbnail", () => {
  it("bounds requested sizes and compresses oversized source", async () => {
    const source = await sharp({
      create: { width: 1600, height: 1200, channels: 3, background: "#ccddee" },
    })
      .png()
      .toBuffer();
    expect(await productThumbnail(source, "image/png", "99999")).toBeNull();
    const result = await productThumbnail(source, "image/png", "320");
    const meta = await sharp(result!).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(320);
    expect(result!.length).toBeLessThan(source.length);
    expect(await productThumbnail(source, "image/png", "320")).toEqual(result);
  });
  it("does not enlarge a small source or accept invalid image bytes", async () => {
    const source = await sharp({
      create: { width: 80, height: 60, channels: 3, background: "#ffffff" },
    })
      .png()
      .toBuffer();
    const result = await productThumbnail(source, "image/png", "640");
    expect((await sharp(result!).metadata()).width).toBe(80);
    await expect(
      productThumbnail(Buffer.from("invalid"), "image/png", "320"),
    ).rejects.toThrow();
  });
});

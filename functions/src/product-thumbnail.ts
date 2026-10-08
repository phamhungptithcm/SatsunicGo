import sharp from "sharp";
import { createHash } from "node:crypto";
import { verifyImage } from "../../packages/domain/media";
const cache = new Map<string, Buffer>();
let cacheBytes = 0;
const MAX_BYTES = 16 * 1024 * 1024;
export async function productThumbnail(
  bytes: Buffer,
  mime: string,
  width: string,
) {
  if (!["320", "640", "960"].includes(width)) return null;
  verifyImage(bytes, mime);
  const key = createHash("sha256").update(bytes).update(width).digest("hex");
  const existing = cache.get(key);
  if (existing) {
    cache.delete(key);
    cache.set(key, existing);
    return existing;
  }
  const result = await sharp(bytes, {
    limitInputPixels: 4_000_000,
    animated: false,
    failOn: "warning",
  })
    .rotate()
    .resize({ width: Number(width), withoutEnlargement: true })
    .webp({ quality: 78 })
    .toBuffer();
  const concurrent = cache.get(key);
  if (concurrent) return concurrent;
  if (result.length <= MAX_BYTES) {
    while (cacheBytes + result.length > MAX_BYTES && cache.size) {
      const oldest = cache.keys().next().value!;
      cacheBytes -= cache.get(oldest)!.length;
      cache.delete(oldest);
    }
    cache.set(key, result);
    cacheBytes += result.length;
  }
  return result;
}

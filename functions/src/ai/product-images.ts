import sharp from "sharp";
import { verifyImage } from "../../../packages/domain/media";
export async function sanitizeProductImage(bytes: Uint8Array, mime: string) {
  verifyImage(bytes, mime);
  const result = await sharp(bytes, {
    limitInputPixels: 4_000_000,
    animated: false,
    failOn: "warning",
  })
    .rotate()
    .jpeg({ quality: 90 })
    .toBuffer();
  verifyImage(result, "image/jpeg");
  return result;
}

import sharp from "sharp";
import { verifyImage } from "../../packages/domain/media";

/** Preserve the complete private product photo within a bounded thumbnail. */
export async function purchaseImageThumbnail(bytes: Buffer, mime: string) {
  verifyImage(bytes, mime);
  return sharp(bytes, {
    limitInputPixels: 25_000_000,
    animated: false,
    failOn: "warning",
  })
    .rotate()
    .resize(160, 160, { fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 78 })
    .toBuffer();
}

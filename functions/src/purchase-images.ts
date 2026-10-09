import sharp from "sharp";
import { createHash } from "node:crypto";
import { getFirestore, type Transaction } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { z } from "zod";
import { verifyImage } from "../../packages/domain/media";
import { requireVerifiedGoogle } from "./auth/guards";
const options = {
  region: "asia-southeast1",
  maxInstances: 2,
  concurrency: 4,
  enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
};
const schema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("upload"),
      draftId: z.string().uuid(),
      itemIndex: z.number().int().min(0).max(29),
      operationId: z.string().uuid(),
      mime: z.enum(["image/jpeg", "image/png", "image/webp"]),
      base64: z
        .string()
        .max(2800000)
        .regex(/^[A-Za-z0-9+/]*={0,2}$/),
    })
    .strict(),
  z
    .object({
      action: z.literal("read"),
      draftId: z.string().uuid(),
      itemIndex: z.number().int().min(0).max(29),
    })
    .strict(),
]);
async function owner(tx: Transaction, uid: string, draftId: string) {
  const db = getFirestore();
  const [draft, user, access] = await Promise.all([
    tx.get(db.doc(`purchaseDrafts/${draftId}`)),
    tx.get(db.doc(`users/${uid}`)),
    tx.get(db.doc(`staffAccess/${uid}`)),
  ]);
  if (
    !draft.exists ||
    draft.data()?.ownerId !== uid ||
    user.data()?.locked ||
    access.data()?.locked
  )
    throw new HttpsError("permission-denied", "Chưa mở được ảnh của món.");
  return draft;
}
export const purchaseDraftImage = onCall(options, async (req) => {
  const uid = requireVerifiedGoogle(req.auth),
    p = schema.safeParse(req.data),
    db = getFirestore();
  if (!p.success) throw new HttpsError("invalid-argument", "Ảnh chưa hợp lệ.");
  const d = p.data;
  if (d.action === "read") {
    const read = () =>
      db.runTransaction(async (tx) => {
        const draft = await owner(tx, uid, d.draftId);
        const images = (draft.data()?.images ?? []) as {
          id: string;
          itemIndex: number;
          mime: string;
          objectPath: string;
          state: string;
        }[];
        return images.find(
          (i) => i.itemIndex === d.itemIndex && i.state === "ready",
        );
      });
    const media = await read();
    if (!media) return { mime: null, base64: null };
    const [bytes] = await getStorage()
      .bucket()
      .file(media.objectPath)
      .download();
    verifyImage(bytes, media.mime);
    if ((await read())?.id !== media.id)
      throw new HttpsError("permission-denied", "Ảnh đã thay đổi.");
    const thumbnail = await sharp(bytes, { limitInputPixels: 25000000 })
      .rotate()
      .resize(160, 160, { fit: "cover", withoutEnlargement: true })
      .jpeg({ quality: 78 })
      .toBuffer();
    return { mime: "image/jpeg", base64: thumbnail.toString("base64") };
  }
  const bytes = Buffer.from(d.base64, "base64");
  try {
    verifyImage(bytes, d.mime);
  } catch {
    throw new HttpsError(
      "invalid-argument",
      "Dùng ảnh PNG, JPEG hoặc WebP tối đa 2 MB.",
    );
  }
  const digest = createHash("sha256").update(bytes).digest("hex"),
    id = createHash("sha256").update(`${uid}:${d.operationId}`).digest("hex"),
    objectPath = `private-purchase-drafts/${d.draftId}/${id}`;
  const reserve = async () =>
    db.runTransaction(async (tx) => {
      const draft = await owner(tx, uid, d.draftId),
        cart = await tx.get(db.doc(`carts/${uid}`));
      const images = (draft.data()?.images ?? []) as Record<string, unknown>[];
      const old = images.find((i) => i.id === id);
      if (old) {
        if (
          old.digest !== digest ||
          old.itemIndex !== d.itemIndex ||
          old.mime !== d.mime
        )
          throw new HttpsError(
            "already-exists",
            "Lần tải ảnh đã dùng cho nội dung khác.",
          );
        if (old.state === "ready") return true;
      }
      if (
        cart.data()?.activeCheckoutId ||
        !cart
          .data()
          ?.items?.some(
            (i: { custom?: { draftId: string } }) =>
              i.custom?.draftId === d.draftId,
          )
      )
        throw new HttpsError(
          "failed-precondition",
          "Món đã chuyển sang thanh toán hoặc không còn trong giỏ.",
        );
      if (!draft.data()?.request?.items?.[d.itemIndex])
        throw new HttpsError("invalid-argument", "Dòng sản phẩm chưa hợp lệ.");
      if (!old) {
        if (images.length >= 6)
          throw new HttpsError(
            "resource-exhausted",
            "Mỗi yêu cầu tối đa 6 ảnh.",
          );
        tx.update(draft.ref, {
          images: [
            ...images,
            {
              id,
              itemIndex: d.itemIndex,
              mime: d.mime,
              objectPath,
              digest,
              state: "pending",
              createdAt: Date.now(),
            },
          ],
        });
      }
      return false;
    });
  if (await reserve()) return { id };
  await getStorage()
    .bucket()
    .file(objectPath)
    .save(bytes, {
      resumable: false,
      metadata: { contentType: d.mime, cacheControl: "private,no-store" },
    });
  await db.runTransaction(async (tx) => {
    const draft = await owner(tx, uid, d.draftId),
      cart = await tx.get(db.doc(`carts/${uid}`));
    const images = (draft.data()?.images ?? []) as Record<string, unknown>[];
    const old = images.find((i) => i.id === id);
    if (!old || old.digest !== digest)
      throw new HttpsError("failed-precondition", "Lần tải ảnh chưa khớp.");
    if (old.state === "ready") return;
    if (cart.data()?.activeCheckoutId)
      throw new HttpsError("failed-precondition", "Thanh toán đã bắt đầu.");
    tx.update(draft.ref, {
      images: images.map((i) => (i.id === id ? { ...i, state: "ready" } : i)),
    });
    tx.update(cart.ref, {
      revision: cart.data()!.revision + 1,
      updatedAt: Date.now(),
    });
  });
  return { id };
});

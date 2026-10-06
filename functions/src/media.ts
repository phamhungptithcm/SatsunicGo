import { validateStudioImage } from "./blog-studio";
import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { randomUUID, createHash } from "node:crypto";
import { z } from "zod";
import { verifyImage } from "../../packages/domain/media";
import { isStringRoleArray, requireVerifiedGoogle } from "./auth/guards";
export const uploadContentImage = onCall(
  {
    region: "asia-southeast1",
    maxInstances: 2,
    concurrency: 4,
    memory: "256MiB",
    enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
  },
  async (req) => {
    requireVerifiedGoogle(req.auth);
    if (!req.auth?.uid)
      throw new HttpsError("unauthenticated", "Đăng nhập để tiếp tục.");
    const data = z
      .object({
        mime: z.enum(["image/png", "image/jpeg", "image/webp"]),
        base64: z
          .string()
          .max(2800000)
          .regex(/^[A-Za-z0-9+/]*={0,2}$/),
        alt: z.string().min(2).max(300),
        rightsConfirmed: z.literal(true),
      })
      .strict()
      .safeParse(req.data);
    if (!data.success)
      throw new HttpsError(
        "invalid-argument",
        "Ảnh không hợp lệ. Dùng PNG, JPEG hoặc WebP tối đa 2 MB.",
      );
    const db = getFirestore(),
      uid = req.auth.uid;
    async function authorized() {
      const [a, u] = await Promise.all([
        db.doc(`staffAccess/${uid}`).get(),
        db.doc(`users/${uid}`).get(),
      ]);
      return (
        a.data()?.active === true &&
        isStringRoleArray(a.data()?.roles) &&
        !a.data()?.locked &&
        !u.data()?.locked &&
        a
          .data()
          ?.roles?.some((r: string) => ["OWNER", "CONTENT_EDITOR"].includes(r))
      );
    }
    if (!(await authorized()))
      throw new HttpsError("permission-denied", "Cần quyền biên tập nội dung.");
    const bytes = Buffer.from(data.data.base64, "base64");
    try {
      verifyImage(bytes, data.data.mime);
    } catch {
      throw new HttpsError(
        "invalid-argument",
        "Định dạng hoặc kích thước ảnh không khớp.",
      );
    }
    const id = randomUUID(),
      objectPath = `content-images/${id}`,
      file = getStorage().bucket().file(objectPath);
    await file.save(bytes, {
      resumable: false,
      metadata: {
        contentType: data.data.mime,
        cacheControl: "private,no-store",
        metadata: { sha256: createHash("sha256").update(bytes).digest("hex") },
      },
    });
    if (!(await authorized())) {
      await file.delete({ ignoreNotFound: true });
      throw new HttpsError("permission-denied", "Quyền biên tập đã thay đổi.");
    }
    await db.doc(`contentMedia/${id}`).create({
      objectPath,
      mime: data.data.mime,
      alt: data.data.alt,
      rightsConfirmed: true,
      size: bytes.length,
      uploadedBy: uid,
      createdAt: Date.now(),
      status: "unlinked",
    });
    return { id };
  },
);
export const publicImage = onRequest(
  { region: "asia-southeast1", maxInstances: 3, concurrency: 10 },
  async (req, res) => {
    res.set("X-Content-Type-Options", "nosniff");
    res.set("Content-Security-Policy", "default-src 'none'; sandbox");
    res.set("Cache-Control", "no-store");
    const id = req.path.match(/^\/media\/([a-zA-Z0-9-]{1,80})$/)?.[1];
    if (!id) {
      res.status(404).end();
      return;
    }
    try {
      const db = getFirestore(),
        media = (await db.doc(`contentMedia/${id}`).get()).data();
      if (
        !media ||
        !["products", "posts", "authors"].includes(media.contentKind)
      ) {
        res.status(404).end();
        return;
      }
      if (media.contentKind === "authors") {
        if (media.studioMedia !== true || media.rightsConfirmed !== true) {
          res.status(404).end();
          return;
        }
        const referenced = async () =>
          !(
            await db
              .collection("blogPublished")
              .where("status", "==", "published")
              .where("authorAvatarId", "==", id)
              .limit(1)
              .get()
          ).empty;
        if (!(await referenced())) {
          res.status(404).end();
          return;
        }
        const [bytes] = await getStorage()
          .bucket()
          .file(media.objectPath)
          .download();
        await validateStudioImage(bytes, media.mime);
        if (!(await referenced())) {
          res.status(404).end();
          return;
        }
        res.type(media.mime).send(bytes);
        return;
      }
      const publishedRef = db.doc(`blogPublished/${media.contentId}`);
      const studio =
        media.contentKind === "posts"
          ? (await publishedRef.get()).data()
          : undefined;
      const content =
        studio ??
        (await db.doc(`${media.contentKind}/${media.contentId}`).get()).data();
      if (
        content?.status !== "published" ||
        (studio
          ? !Array.isArray(studio.mediaIds) || !studio.mediaIds.includes(id)
          : content.mediaId !== id)
      ) {
        res.status(404).end();
        return;
      }
      const [bytes] = await getStorage()
        .bucket()
        .file(media.objectPath)
        .download();
      if (studio) {
        await validateStudioImage(bytes, media.mime);
        const current = (await publishedRef.get()).data();
        if (
          current?.status !== "published" ||
          !Array.isArray(current.mediaIds) ||
          !current.mediaIds.includes(id)
        ) {
          res.status(404).end();
          return;
        }
      } else verifyImage(bytes, media.mime);
      res.type(media.mime).send(bytes);
    } catch {
      res.status(404).end();
    }
  },
);

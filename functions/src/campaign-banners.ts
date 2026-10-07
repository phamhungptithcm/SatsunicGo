import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { z } from "zod";
import { requireVerifiedGoogle, isStringRoleArray } from "./auth/guards";
import {
  activeBanners,
  bannerDraftSchema,
  bannerId,
  bannerManifestSchema,
  bannerMode,
  bannerPlacement,
  emptyBannerManifest,
  mediaInBanner,
  type BannerManifest,
} from "../../packages/domain/campaign-banners";
const opts = {
  region: "asia-southeast1",
  maxInstances: 2,
  concurrency: 2,
  enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
};
const commandSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("save"),
      id: bannerId,
      expectedVersion: z.number().int().nonnegative(),
      draft: bannerDraftSchema,
      operationId: bannerId,
    })
    .strict(),
  z
    .object({
      action: z.literal("publish"),
      id: bannerId,
      expectedVersion: z.number().int().nonnegative(),
      startNow: z.boolean().optional(),
      operationId: bannerId,
    })
    .strict(),
  z
    .object({
      action: z.literal("hide"),
      id: bannerId,
      expectedVersion: z.number().int().nonnegative(),
      operationId: bannerId,
    })
    .strict(),
  z
    .object({
      action: z.literal("mode"),
      placement: bannerPlacement,
      mode: bannerMode,
      expectedVersion: z.number().int().nonnegative(),
      operationId: bannerId,
    })
    .strict(),
]);
const version = (v: unknown) =>
  typeof v === "number" &&
  Number.isSafeInteger(v) &&
  v >= 0 &&
  v < Number.MAX_SAFE_INTEGER;
export const websiteBannerCommand = onCall(opts, async (req) => {
  const uid = requireVerifiedGoogle(req.auth),
    parsed = commandSchema.safeParse(req.data);
  if (!parsed.success)
    throw new HttpsError(
      "invalid-argument",
      "Kiểm tra thông tin banner và thời gian hiển thị.",
    );
  const c = parsed.data,
    db = getFirestore(),
    now = Date.now();
  const hash = createHash("sha256").update(JSON.stringify(c)).digest("hex");
  return db.runTransaction(async (tx) => {
    const staff = await tx.get(db.doc(`staffAccess/${uid}`)),
      user = await tx.get(db.doc(`users/${uid}`));
    const roles = staff.data()?.roles;
    if (
      staff.data()?.active !== true ||
      staff.data()?.locked ||
      user.data()?.locked ||
      !isStringRoleArray(roles) ||
      !roles.some(
        (r) => r === "OWNER" || (c.action === "save" && r === "CONTENT_EDITOR"),
      )
    )
      throw new HttpsError(
        "permission-denied",
        "Cần quyền quản lý banner cho thao tác này.",
      );
    const op = db.doc(`idempotencyKeys/${uid}-banner-${c.operationId}`),
      previous = await tx.get(op);
    if (previous.exists) {
      if (previous.data()?.hash !== hash)
        throw new HttpsError("already-exists", "Mã thao tác đã được sử dụng.");
      return previous.data()!.result;
    }
    const manifestRef = db.doc("websiteBannerPublic/current"),
      manifestDoc = await tx.get(manifestRef);
    const manifest: BannerManifest = manifestDoc.exists
      ? bannerManifestSchema.parse(manifestDoc.data()?.manifest)
      : emptyBannerManifest();
    let result: { id?: string; version: number };
    if (c.action === "mode") {
      const current = manifestDoc.data()?.version ?? 0;
      if (!version(current) || current !== c.expectedVersion)
        throw new HttpsError(
          "aborted",
          "Dữ liệu đã thay đổi. Tải lại trước khi lưu.",
        );
      manifest.modes[c.placement] = c.mode;
      result = { version: current + 1 };
      tx.set(manifestRef, {
        manifest,
        version: result.version,
        changedAt: now,
      });
    } else {
      const ref = db.doc(`websiteBanners/${c.id}`),
        old = await tx.get(ref),
        current = old.data()?.version ?? 0;
      if (!version(current) || current !== c.expectedVersion)
        throw new HttpsError(
          "aborted",
          "Dữ liệu đã thay đổi. Tải lại trước khi lưu.",
        );
      result = { id: c.id, version: current + 1 };
      if (c.action === "save") {
        tx.set(ref, {
          draft: c.draft,
          version: result.version,
          createdAt: old.data()?.createdAt ?? now,
          changedAt: now,
          changedBy: uid,
        });
      } else {
        if (!old.exists)
          throw new HttpsError(
            "not-found",
            "Banner không còn tồn tại. Tải lại danh sách.",
          );
        if (c.action === "publish") {
          const draft = bannerDraftSchema.parse(old.data()?.draft);
          if (c.startNow) draft.startsAt = now;
          if (draft.endsAt <= now || draft.endsAt <= draft.startsAt)
            throw new HttpsError(
              "failed-precondition",
              "Chọn giờ kết thúc trong tương lai trước khi bật banner.",
            );
          const ids = [
            draft.desktopMediaId,
            ...(draft.mobileMediaId ? [draft.mobileMediaId] : []),
          ];
          const media = await Promise.all(
            ids.map((id) => tx.get(db.doc(`contentMedia/${id}`))),
          );
          for (const m of media) {
            const d = m.data();
            if (
              !d ||
              d.rightsConfirmed !== true ||
              typeof d.alt !== "string" ||
              d.alt.trim().length < 2 ||
              d.alt.length > 300 ||
              typeof d.objectPath !== "string" ||
              !/^content-images\/[a-f0-9-]{36}$/.test(d.objectPath) ||
              (d.contentId &&
                (d.contentId !== c.id || d.contentKind !== "websiteBanners"))
            )
              throw new HttpsError(
                "failed-precondition",
                "Ảnh chưa hợp lệ hoặc đã gắn với nội dung khác.",
              );
          }
          // Decode before publication too: malformed/animated images never become a live banner.
          for (const m of media) {
            const d = m.data()!,
              [bytes] = await getStorage()
                .bucket()
                .file(d.objectPath)
                .download();
            if (bytes.length > 2 * 1024 * 1024)
              throw new HttpsError("failed-precondition", "Ảnh vượt quá 2 MB.");
            try {
              const image = sharp(bytes, {
                  limitInputPixels: 16000000,
                  animated: false,
                }),
                meta = await image.metadata();
              const mime = (
                {
                  jpeg: "image/jpeg",
                  png: "image/png",
                  webp: "image/webp",
                } as Record<string, string>
              )[meta.format ?? ""];
              if (!mime || mime !== d.mime || (meta.pages ?? 1) !== 1)
                throw new Error("image");
              await image.stats();
            } catch {
              throw new HttpsError(
                "failed-precondition",
                "Dùng ảnh PNG, JPEG hoặc WebP tĩnh hợp lệ.",
              );
            }
          }
          const entries = manifest.entries.filter((e) => e.id !== c.id);
          if (entries.length >= 12)
            throw new HttpsError(
              "resource-exhausted",
              "Tối đa 12 banner đã bật. Tắt banner cũ trước khi thêm.",
            );
          entries.push({
            id: c.id,
            revision: result.version,
            draft,
            desktopAlt: media[0].data()!.alt,
            ...(media[1] ? { mobileAlt: media[1].data()!.alt } : {}),
          });
          manifest.entries = entries;
          for (const m of media)
            tx.update(m.ref, {
              contentId: c.id,
              contentKind: "websiteBanners",
              status: "linked",
            });
        } else manifest.entries = manifest.entries.filter((e) => e.id !== c.id);
        const mv = manifestDoc.data()?.version ?? 0;
        if (!version(mv))
          throw new HttpsError(
            "aborted",
            "Cấu hình banner cần được kiểm tra lại.",
          );
        tx.set(manifestRef, { manifest, version: mv + 1, changedAt: now });
        tx.update(ref, {
          version: result.version,
          changedAt: now,
          changedBy: uid,
        });
      }
    }
    tx.create(db.collection("auditEvents").doc(), {
      actor: uid,
      action: `websiteBanner.${c.action}`,
      resourceId: "id" in c ? c.id : c.placement,
      createdAt: now,
    });
    tx.create(op, { hash, result, createdAt: now });
    return result;
  });
});
export const websiteBannerAdmin = onCall(opts, async (req) => {
  const uid = requireVerifiedGoogle(req.auth),
    input = z
      .object({ after: bannerId.optional() })
      .strict()
      .safeParse(req.data);
  if (!input.success)
    throw new HttpsError("invalid-argument", "Danh sách không hợp lệ.");
  const db = getFirestore();
  return db.runTransaction(async (tx) => {
    const staff = await tx.get(db.doc(`staffAccess/${uid}`)),
      user = await tx.get(db.doc(`users/${uid}`)),
      roles = staff.data()?.roles;
    if (
      staff.data()?.active !== true ||
      staff.data()?.locked ||
      user.data()?.locked ||
      !isStringRoleArray(roles) ||
      !roles.some((r) => ["OWNER", "CONTENT_EDITOR"].includes(r))
    )
      throw new HttpsError("permission-denied", "Cần quyền biên tập nội dung.");
    let query = db.collection("websiteBanners").orderBy("__name__").limit(31);
    if (input.data.after) query = query.startAfter(input.data.after);
    const rows = await tx.get(query),
      m = await tx.get(db.doc("websiteBannerPublic/current"));
    const manifest = m.exists
      ? bannerManifestSchema.parse(m.data()?.manifest)
      : emptyBannerManifest();
    return {
      rows: rows.docs.slice(0, 30).map((d) => {
        if (!version(d.data().version))
          throw new HttpsError(
            "failed-precondition",
            "Phiên bản banner cần được kiểm tra lại.",
          );
        return {
          id: bannerId.parse(d.id),
          version: d.data().version,
          draft: bannerDraftSchema.parse(d.data().draft),
          published: manifest.entries.find((e) => e.id === d.id) ?? null,
        };
      }),
      next: rows.docs.length > 30 ? rows.docs[29].id : null,
      modes: manifest.modes,
      manifestVersion: m.data()?.version ?? 0,
      owner: roles.includes("OWNER"),
      serverNow: Date.now(),
    };
  });
});
export const campaignBannersPublic = onRequest(
  {
    region: "asia-southeast1",
    maxInstances: 2,
    concurrency: 2,
    memory: "256MiB",
    timeoutSeconds: 15,
  },
  async (req, res) => {
    res.set("Cache-Control", "no-store");
    res.set("X-Content-Type-Options", "nosniff");
    res.set("Content-Security-Policy", "default-src 'none'; sandbox");
    if (req.method !== "GET") {
      res.status(405).end();
      return;
    }
    const match =
      /^\/campaign-banners\/media\/([a-f0-9-]{36})\/([a-f0-9-]{36})$/.exec(
        req.path,
      );
    const db = getFirestore();
    const read = async () => {
      const d = await db.doc("websiteBannerPublic/current").get();
      return d.exists
        ? bannerManifestSchema.parse(d.data()?.manifest)
        : emptyBannerManifest();
    };
    try {
      if (match) {
        const [, id, mediaId] = match;
        const permitted = async () => {
          const m = await read();
          return m.entries.some(
            (e) => e.id === id && mediaInBanner(e, mediaId, Date.now()),
          );
        };
        if (!(await permitted())) {
          res.status(404).end();
          return;
        }
        const m = await db.doc(`contentMedia/${mediaId}`).get(),
          data = m.data();
        if (
          !data ||
          data.rightsConfirmed !== true ||
          data.contentId !== id ||
          data.contentKind !== "websiteBanners" ||
          !/^content-images\/[a-f0-9-]{36}$/.test(String(data.objectPath))
        ) {
          res.status(404).end();
          return;
        }
        const [bytes] = await getStorage()
          .bucket()
          .file(data.objectPath)
          .download();
        if (bytes.length > 2 * 1024 * 1024) {
          res.status(404).end();
          return;
        }
        const image = sharp(bytes, {
            limitInputPixels: 16000000,
            animated: false,
          }),
          meta = await image.metadata();
        const mime = (
          {
            jpeg: "image/jpeg",
            png: "image/png",
            webp: "image/webp",
          } as Record<string, string>
        )[meta.format ?? ""];
        if (!mime || mime !== data.mime || (meta.pages ?? 1) !== 1) {
          res.status(404).end();
          return;
        }
        await image.stats();
        const refreshedMedia = await db.doc(`contentMedia/${mediaId}`).get(),
          fresh = refreshedMedia.data();
        if (
          !(await permitted()) ||
          !fresh ||
          fresh.rightsConfirmed !== true ||
          fresh.contentId !== id ||
          fresh.contentKind !== "websiteBanners" ||
          fresh.objectPath !== data.objectPath ||
          fresh.mime !== mime
        ) {
          res.status(404).end();
          return;
        }
        res.type(mime).send(bytes);
        return;
      }
      if (
        req.path !== "/campaign-banners" ||
        !bannerPlacement.safeParse(req.query.placement).success ||
        Object.keys(req.query).some((k) => k !== "placement")
      ) {
        res.status(400).end();
        return;
      }
      const placement = bannerPlacement.parse(req.query.placement),
        manifest = await read(),
        now = Date.now();
      const active = activeBanners(manifest, placement, now);
      res.json({
        serverNow: now,
        mode: manifest.modes[placement],
        entries: active.map((e) => ({
          id: e.id,
          revision: e.revision,
          title: e.draft.title,
          description: e.draft.description,
          cta: e.draft.cta,
          path: e.draft.path,
          endsAt: e.draft.endsAt,
          desktopAlt: e.desktopAlt,
          desktopImage: `/campaign-banners/media/${e.id}/${e.draft.desktopMediaId}`,
          ...(e.draft.mobileMediaId
            ? {
                mobileImage: `/campaign-banners/media/${e.id}/${e.draft.mobileMediaId}`,
                mobileAlt: e.mobileAlt ?? e.desktopAlt,
              }
            : {}),
        })),
      });
    } catch {
      res.status(match ? 404 : 503).end();
    }
  },
);

/** Private preview never creates public URLs or bypasses image rights. */
export const websiteBannerPreview = onCall(opts, async (req) => {
  const uid = requireVerifiedGoogle(req.auth);
  const input = z.object({ mediaId: bannerId }).strict().safeParse(req.data);
  if (!input.success)
    throw new HttpsError("invalid-argument", "Chọn ảnh hợp lệ để xem trước.");
  const db = getFirestore();
  async function authorized() {
    const [staff, user] = await Promise.all([
      db.doc(`staffAccess/${uid}`).get(),
      db.doc(`users/${uid}`).get(),
    ]);
    const roles = staff.data()?.roles;
    return (
      staff.data()?.active === true &&
      !staff.data()?.locked &&
      !user.data()?.locked &&
      isStringRoleArray(roles) &&
      roles.some((r) => ["OWNER", "CONTENT_EDITOR"].includes(r))
    );
  }
  if (!(await authorized()))
    throw new HttpsError("permission-denied", "Cần quyền biên tập nội dung.");
  const media = await db.doc(`contentMedia/${input.data.mediaId}`).get(),
    d = media.data();
  if (
    !d ||
    d.rightsConfirmed !== true ||
    !/^content-images\/[a-f0-9-]{36}$/.test(String(d.objectPath)) ||
    (d.contentId ? d.contentKind !== "websiteBanners" : d.uploadedBy !== uid)
  )
    throw new HttpsError("not-found", "Không thể xem trước ảnh này.");
  const [bytes] = await getStorage().bucket().file(d.objectPath).download();
  if (bytes.length > 2 * 1024 * 1024)
    throw new HttpsError("failed-precondition", "Ảnh vượt quá 2 MB.");
  try {
    const image = sharp(bytes, { limitInputPixels: 16000000, animated: false }),
      meta = await image.metadata();
    const mime = (
      { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" } as Record<
        string,
        string
      >
    )[meta.format ?? ""];
    if (!mime || mime !== d.mime || (meta.pages ?? 1) !== 1)
      throw new Error("image");
    await image.stats();
    if (!(await authorized()))
      throw new HttpsError("permission-denied", "Quyền biên tập đã thay đổi.");
    const fresh = (
      await db.doc(`contentMedia/${input.data.mediaId}`).get()
    ).data();
    if (
      !fresh ||
      fresh.rightsConfirmed !== true ||
      fresh.objectPath !== d.objectPath ||
      fresh.mime !== d.mime ||
      fresh.contentId !== d.contentId ||
      fresh.contentKind !== d.contentKind ||
      fresh.uploadedBy !== d.uploadedBy ||
      fresh.alt !== d.alt
    )
      throw new HttpsError(
        "permission-denied",
        "Quyền sử dụng ảnh đã thay đổi. Tải lại ảnh trước khi xem.",
      );
    return {
      image: `data:${mime};base64,${bytes.toString("base64")}`,
      alt: String(d.alt),
    };
  } catch (e) {
    if (e instanceof HttpsError) throw e;
    throw new HttpsError(
      "failed-precondition",
      "Ảnh chưa hợp lệ để xem trước.",
    );
  }
});

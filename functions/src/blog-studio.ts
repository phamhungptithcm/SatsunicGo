import { createHash, randomUUID } from "node:crypto";
import {
  getFirestore,
  Filter,
  FieldValue,
  type Firestore,
} from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { requireVerifiedGoogle } from "./auth/guards";
import {
  studioAuthority as authority,
  requireStudioDraft,
  requireStudioPublisher,
  safeStudioSchedule,
  bindStudioIdentity,
} from "./blog-studio-access";
import { getAuth } from "firebase-admin/auth";
import {
  publicBlogComment,
  type BlogComment,
} from "../../packages/domain/blog-comments";
import {
  defaultStudioSettings,
  emptyStudioDraft,
  nextStudioRevision,
  publishedStudioPost,
  studioDraftSchema,
  studioIdSchema,
  studioSettingsSchema,
  type StudioPost,
} from "../../packages/domain/blog-studio";
const opts = {
  region: "asia-southeast1",
  maxInstances: 4,
  concurrency: 20,
  enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
};
const version = z
  .number()
  .int()
  .positive()
  .max(Number.MAX_SAFE_INTEGER - 1);
export const studioCommandSchema = z
  .object({
    action: z.enum([
      "create",
      "save",
      "review",
      "publish",
      "schedule",
      "unpublish",
      "archive",
      "restore",
      "settings",
      "moderate",
    ]),
    operationId: studioIdSchema,
    id: studioIdSchema.optional(),
    expectedVersion: version.optional(),
    payload: z.unknown().optional(),
  })
  .strict();
type Command = z.infer<typeof studioCommandSchema>;
function conflict(actual: unknown, expected: unknown) {
  if (
    !Number.isSafeInteger(actual) ||
    Number(actual) < 1 ||
    actual !== expected
  )
    throw new HttpsError(
      "aborted",
      "Bản thảo đã thay đổi. Tải lại trước khi lưu.",
    );
}
function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const p = schema.safeParse(input);
  if (!p.success)
    throw new HttpsError("invalid-argument", "Nội dung không hợp lệ.");
  return p.data;
}
function draftData(p: StudioPost) {
  return Object.fromEntries(
    Object.keys(emptyStudioDraft).map((k) => [k, p[k as keyof StudioPost]]),
  );
}
/** One transaction includes role/account authority, CAS, receipt, draft and public snapshot. */
export async function executeStudioCommand(
  db: Firestore,
  uid: string,
  d: Command,
  scheduled = false,
  email?: string,
) {
  await bindStudioIdentity(db, uid, email);
  const id = d.id ?? (d.action === "create" ? randomUUID() : undefined),
    now = new Date().toISOString();
  if (!id && !["settings"].includes(d.action))
    throw new HttpsError("invalid-argument", "Thiếu mã nội dung.");
  const hash = createHash("sha256").update(JSON.stringify(d)).digest("hex"),
    receipt = db.doc(`blogStudioOperations/${uid}_${d.operationId}`);
  return db.runTransaction(async (tx) => {
    const editorialRole = await authority(db, tx, uid, d.action === "settings");
    if (["publish", "schedule", "unpublish", "moderate"].includes(d.action))
      requireStudioPublisher(editorialRole);
    const done = await tx.get(receipt);
    if (done.exists) {
      if (done.get("hash") !== hash)
        throw new HttpsError("already-exists", "Mã thao tác đã được dùng.");
      return done.get("result");
    }
    if (d.action === "settings") {
      const ref = db.doc("blogStudioSettings/main"),
        old = await tx.get(ref);
      conflict(old.exists ? old.get("revision") : 1, d.expectedVersion);
      const settings = {
        ...parse(studioSettingsSchema, d.payload),
        revision: nextStudioRevision(old.exists ? old.get("revision") : 1),
      };
      const result = { settings };
      tx.set(ref, settings);
      tx.create(receipt, {
        hash,
        result,
        actor: uid,
        action: d.action,
        at: now,
      });
      return result;
    }
    if (d.action === "moderate") {
      const payload = parse(
          z
            .object({
              status: z.enum(["approved", "hidden", "rejected", "spam"]),
            })
            .strict(),
          d.payload,
        ),
        ref = db.doc(`blogComments/${id}`),
        old = await tx.get(ref);
      if (!old.exists)
        throw new HttpsError("not-found", "Không tìm thấy bình luận.");
      conflict(old.get("revision"), d.expectedVersion);
      const prior = { ...old.data(), id: old.id } as BlogComment;
      if (prior.status === "deleted_private")
        throw new HttpsError(
          "failed-precondition",
          "Không thể duyệt bình luận này.",
        );
      const postRef = db.doc(`blogPublished/${prior.postId}`);
      const [post, parent] = await Promise.all([
        tx.get(postRef),
        prior.parentId
          ? tx.get(db.doc(`blogComments/${prior.parentId}`))
          : null,
      ]);
      if (
        payload.status === "approved" &&
        (!post.exists ||
          post.get("status") !== "published" ||
          ["deleted", "deleted_private"].includes(prior.status) ||
          (parent &&
            (!parent.exists ||
              parent.get("postId") !== prior.postId ||
              !["approved", "deleted"].includes(parent.get("status")))))
      )
        throw new HttpsError(
          "failed-precondition",
          "Không thể duyệt bình luận này.",
        );
      const comment = {
        ...prior,
        ...payload,
        revision: nextStudioRevision(old.get("revision")),
        updatedAt: now,
        moderatedAt: now,
        moderatedBy: uid,
      };
      const visible = (value: string) =>
        ["approved", "deleted"].includes(value);
      let delta =
        Number(comment.status === "approved") -
        Number(prior.status === "approved");
      if (!prior.parentId)
        delta +=
          (Number(visible(comment.status)) - Number(visible(prior.status))) *
          Math.max(0, Number(old.get("approvedReplyCount") ?? 0));
      if (parent?.exists) {
        const replies = Math.max(
          0,
          Number(parent.get("approvedReplyCount") ?? 0) + delta,
        );
        if (!visible(parent.get("status"))) delta = 0;
        tx.update(parent.ref, { approvedReplyCount: replies });
      }
      if (post.exists)
        tx.update(postRef, {
          commentCount: Math.max(
            0,
            Number(post.get("commentCount") ?? 0) + delta,
          ),
        });
      const result = { comment: publicBlogComment(comment as BlogComment) };
      tx.set(ref, comment);
      tx.create(receipt, {
        hash,
        result,
        actor: uid,
        action: d.action,
        at: now,
      });
      return result;
    }
    const ref = db.doc(`blogDrafts/${id}`),
      pub = db.doc(`blogPublished/${id}`),
      schedule = db.doc(`blogSchedules/${id}`);
    const [snap, published, settingsSnap, legacy] = await Promise.all([
      tx.get(ref),
      tx.get(pub),
      tx.get(db.doc("blogStudioSettings/main")),
      tx.get(db.doc(`posts/${id}`)),
    ]);
    // Legacy posts cannot be implicitly copied or overwritten by Studio.
    if (!snap.exists && d.action !== "create")
      throw new HttpsError("not-found", "Không tìm thấy bản thảo.");
    if (
      d.action === "create" &&
      (snap.exists || published.exists || legacy.exists)
    )
      throw new HttpsError("already-exists", "Mã bài viết đã tồn tại.");
    const settings = settingsSnap.exists
      ? parse(
          studioSettingsSchema,
          Object.fromEntries(
            Object.keys(defaultStudioSettings).map((k) => [
              k,
              settingsSnap.get(k),
            ]),
          ),
        )
      : defaultStudioSettings;
    const old = snap.data() as StudioPost | undefined;
    if (old) {
      requireStudioDraft(editorialRole, uid, old);
      conflict(old.revision, d.expectedVersion);
    }
    let draft: StudioPost;
    if (d.action === "create")
      draft = {
        ...parse(
          studioDraftSchema,
          d.payload ?? { ...emptyStudioDraft, authorId: uid, assignee: uid },
        ),
        id: id!,
        owner: uid,
        state: "draft",
        revision: 1,
        updatedAt: now,
      };
    else {
      const checked = parse(studioDraftSchema, draftData(old!));
      draft = {
        ...old!,
        ...checked,
        revision: nextStudioRevision(old!.revision),
        updatedAt: now,
      };
      if (d.action === "save")
        draft = {
          ...draft,
          ...parse(studioDraftSchema, d.payload),
          state: "draft",
        };
      if (d.action === "restore") {
        const p = parse(z.object({ revision: version }).strict(), d.payload),
          revision = await tx.get(
            ref.collection("revisions").doc(String(p.revision)),
          );
        if (!revision.exists)
          throw new HttpsError("not-found", "Không tìm thấy phiên bản.");
        draft = {
          ...draft,
          ...parse(studioDraftSchema, draftData(revision.data() as StudioPost)),
          slug: old!.publishedSlug ?? String(revision.get("slug")),
          assignee: old!.assignee,
          state: "draft",
        };
      }
      if (editorialRole === "author" && old!.assignee !== draft.assignee)
        throw new HttpsError(
          "permission-denied",
          "Không thể thay đổi người phụ trách.",
        );
      if (old!.publishedSlug && old!.publishedSlug !== draft.slug)
        throw new HttpsError(
          "failed-precondition",
          "Đường dẫn của bài đã xuất bản được giữ cố định.",
        );
      if (d.action === "review") draft.state = "review";
      if (d.action === "archive") {
        if (published.exists || legacy.get("status") === "published")
          throw new HttpsError(
            "failed-precondition",
            "Gỡ xuất bản trước khi lưu trữ.",
          );
        draft.state = "archived";
      }
      if (d.action === "unpublish") draft.state = "draft";
    }
    let projection: ReturnType<typeof publishedStudioPost> | undefined;
    let mediaRefs: ReturnType<Firestore["doc"]>[] = [];
    let slugRef: ReturnType<Firestore["doc"]> | undefined;
    if (d.action === "schedule") {
      const { dueAt } = parse(
        z.object({ dueAt: z.string().datetime({ offset: true }) }).strict(),
        d.payload,
      );
      const t = Date.parse(dueAt);
      if (t <= Date.now() + 60000 || t >= Date.now() + 366 * 86400000)
        throw new HttpsError(
          "invalid-argument",
          "Chọn thời gian xuất bản trong tương lai.",
        );
      // Validate publish fields now; full author/media/slug checks are repeated at execution.
      try {
        publishedStudioPost(draft, { name: "", bio: "" }, now);
      } catch {
        throw new HttpsError(
          "failed-precondition",
          "Điền tiêu đề, đường dẫn, tóm tắt, tác giả, chuyên mục, nguồn tham khảo và nội dung; dùng tối đa 30 ảnh nội dung.",
        );
      }
      draft.scheduledAt = new Date(t).toISOString();
      draft.state = "review";
    }
    if (d.action === "publish") {
      if (draft.state === "archived")
        throw new HttpsError(
          "failed-precondition",
          "Khôi phục bản thảo trước khi xuất bản.",
        );
      if (settings.requireReview && old?.state !== "review")
        throw new HttpsError(
          "failed-precondition",
          "Gửi duyệt trước khi xuất bản.",
        );
      if (scheduled) {
        const job = await tx.get(schedule);
        if (
          !job.exists ||
          job.get("revision") !== old!.revision ||
          job.get("operationId") !== d.operationId ||
          !Number.isFinite(Date.parse(job.get("dueAt"))) ||
          Date.parse(job.get("dueAt")) > Date.now()
        )
          throw new HttpsError("aborted", "Lịch xuất bản đã thay đổi.");
      }
      const author = settings.authors.find((a) => a.id === draft.authorId);
      if (!author)
        throw new HttpsError(
          "failed-precondition",
          "Chọn tác giả đã được cấu hình.",
        );
      try {
        projection = publishedStudioPost(draft, author, now);
      } catch {
        throw new HttpsError(
          "failed-precondition",
          "Điền tiêu đề, đường dẫn, tóm tắt, tác giả, chuyên mục, nguồn tham khảo và nội dung; dùng tối đa 30 ảnh nội dung.",
        );
      }
      if (author.avatarId) {
        const avatar = await tx.get(db.doc(`contentMedia/${author.avatarId}`));
        if (
          !avatar.exists ||
          avatar.get("contentKind") !== "authors" ||
          avatar.get("contentId") !== draft.authorId ||
          avatar.get("rightsConfirmed") !== true
        )
          throw new HttpsError(
            "failed-precondition",
            "Ảnh tác giả không hợp lệ.",
          );
      }
      slugRef = db.doc(`blogSlugs/${draft.slug}`);
      const slugSnap = await tx.get(slugRef);
      if (slugSnap.exists && slugSnap.get("postId") !== id)
        throw new HttpsError("already-exists", "Đường dẫn đã được dùng.");
      // A legacy public slug must not be shadowed by a new snapshot.
      const legacySlugs = await tx.get(
        db.collection("posts").where("slug", "==", draft.slug).limit(1),
      );
      if (!legacySlugs.empty)
        throw new HttpsError("already-exists", "Đường dẫn đã được dùng.");
      if (projection.mediaIds.length > 31)
        throw new HttpsError(
          "invalid-argument",
          "Mỗi bài viết dùng tối đa 30 ảnh nội dung và một ảnh bìa.",
        );
      mediaRefs = projection.mediaIds.map((mid) =>
        db.doc(`contentMedia/${mid}`),
      );
      const media = await Promise.all(mediaRefs.map((r) => tx.get(r)));
      if (
        media.some(
          (m) =>
            !m.exists ||
            m.get("rightsConfirmed") !== true ||
            !["unlinked", "linked"].includes(m.get("status")) ||
            !(
              (m.get("contentKind") === "posts" && m.get("contentId") === id) ||
              (m.get("status") === "unlinked" && m.get("uploadedBy") === uid)
            ),
        )
      )
        throw new HttpsError(
          "failed-precondition",
          "Ảnh không thuộc bài viết hoặc chưa xác nhận quyền sử dụng.",
        );
      draft.state = "published";
      draft.publishedAt = projection.publishedAt;
      draft.publishedSlug = draft.slug;
    }
    if (d.action !== "schedule") delete draft.scheduledAt;
    // All reads precede writes. Snapshot autosaves at most once a minute like the reference.
    const priorSnapshot = Number(
      (old as (StudioPost & { lastSnapshotAt?: number }) | undefined)
        ?.lastSnapshotAt ?? 0,
    );
    const takeSnapshot =
      !!old &&
      (["review", "archive", "publish", "unpublish"].includes(d.action) ||
        Date.now() - priorSnapshot > 60000);
    if (takeSnapshot)
      tx.create(ref.collection("revisions").doc(String(old!.revision)), old!);
    tx.set(ref, {
      ...draft,
      lastSnapshotAt: takeSnapshot ? Date.now() : priorSnapshot,
      tokens: [
        ...new Set(
          `${draft.title} ${draft.summary} ${draft.tags.join(" ")}`
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/gu, "")
            .toLowerCase()
            .replace(/đ/gu, "d")
            .split(/[^a-z0-9]+/u)
            .filter((t) => t.length >= 2),
        ),
      ].slice(0, 100),
    });
    if (projection) {
      tx.set(pub, {
        ...projection,
        commentCount: Number(published.get("commentCount") ?? 0),
      });
      tx.set(slugRef!, { postId: id });
      for (const mediaRef of mediaRefs)
        tx.update(mediaRef, {
          contentKind: "posts",
          contentId: id,
          status: "linked",
        });
    }
    if (d.action === "unpublish") tx.delete(pub);
    if (d.action === "schedule")
      tx.set(schedule, {
        postId: id,
        actor: uid,
        dueAt: draft.scheduledAt,
        revision: draft.revision,
        operationId: randomUUID(),
      });
    else tx.delete(schedule);
    const result = { draft };
    tx.create(receipt, {
      hash,
      result,
      actor: uid,
      action: d.action,
      postId: id,
      at: now,
    });
    return result;
  });
}
export const studioCommand = onCall(opts, async (req) => {
  const uid = requireVerifiedGoogle(req.auth);
  return executeStudioCommand(
    getFirestore(),
    uid,
    parse(studioCommandSchema, req.data),
    false,
    typeof req.auth?.token.email === "string"
      ? req.auth.token.email
      : undefined,
  );
});
export const studioRead = onCall(opts, async (req) => {
  const uid = requireVerifiedGoogle(req.auth),
    db = getFirestore(),
    d = parse(
      z
        .object({
          kind: z.enum(["list", "get", "revisions", "settings", "moderation"]),
          status: z
            .enum(["pending", "approved", "hidden", "rejected", "spam"])
            .optional(),
          id: studioIdSchema.optional(),
          after: z.string().max(256).optional(),
        })
        .strict(),
      req.data,
    );
  await bindStudioIdentity(
    db,
    uid,
    typeof req.auth?.token.email === "string"
      ? req.auth.token.email
      : undefined,
  );
  return db.runTransaction(async (tx) => {
    const editorialRole = await authority(db, tx, uid);
    if (d.kind === "moderation") requireStudioPublisher(editorialRole);
    if (d.kind === "settings") {
      const s = await tx.get(db.doc("blogStudioSettings/main"));
      return {
        settings: s.exists
          ? s.data()
          : { ...defaultStudioSettings, revision: 1 },
      };
    }
    if (d.kind === "get") {
      if (!d.id) throw new HttpsError("invalid-argument", "Thiếu mã bài viết.");
      const s = await tx.get(db.doc(`blogDrafts/${d.id}`));
      if (!s.exists)
        throw new HttpsError("not-found", "Không tìm thấy bản thảo.");
      requireStudioDraft(editorialRole, uid, s.data()!);
      const schedule = await tx.get(db.doc(`blogSchedules/${d.id}`));
      return {
        draft: s.data(),
        schedule: safeStudioSchedule(schedule.data()),
      };
    }
    if (d.kind === "revisions" && d.id) {
      const post = await tx.get(db.doc(`blogDrafts/${d.id}`));
      if (!post.exists)
        throw new HttpsError("not-found", "Không tìm thấy bản thảo.");
      requireStudioDraft(editorialRole, uid, post.data()!);
    }
    if (d.kind === "revisions" && !d.id)
      throw new HttpsError("invalid-argument", "Thiếu mã bài viết.");
    let q =
      d.kind === "revisions"
        ? db
            .collection(`blogDrafts/${d.id}/revisions`)
            .orderBy("revision", "desc")
        : db
            .collection(d.kind === "moderation" ? "blogComments" : "blogDrafts")
            .orderBy("__name__");
    if (d.kind === "list" && editorialRole === "author")
      q = q.where(
        Filter.or(
          Filter.where("owner", "==", uid),
          Filter.where("assignee", "==", uid),
        ),
      );
    if (d.kind === "moderation")
      q = db
        .collection("blogComments")
        .where("status", "==", d.status ?? "pending")
        .orderBy("createdAt", "asc")
        .orderBy("__name__", "asc");
    if (d.after) {
      if (d.kind === "revisions") {
        if (
          !/^\d+$/.test(d.after) ||
          !Number.isSafeInteger(Number(d.after)) ||
          Number(d.after) < 1
        )
          throw new HttpsError("invalid-argument", "Mốc trang không hợp lệ.");
        q = q.startAfter(Number(d.after));
      } else if (d.kind === "moderation") {
        const parts = Buffer.from(d.after, "base64url").toString().split("|");
        if (
          parts.length !== 2 ||
          !Number.isFinite(Date.parse(parts[0])) ||
          !studioIdSchema.safeParse(parts[1]).success
        )
          throw new HttpsError("invalid-argument", "Mốc trang không hợp lệ.");
        q = q.startAfter(...parts);
      } else {
        parse(studioIdSchema, d.after);
        q = q.startAfter(d.after);
      }
    }
    const s = await tx.get(q.limit(31)),
      page = s.docs.slice(0, 30);
    return {
      items: page.map((x) =>
        d.kind === "moderation"
          ? {
              ...publicBlogComment(x.data() as BlogComment),
              moderationReasons: ["Chờ kiểm duyệt"],
            }
          : { ...x.data(), id: x.id },
      ),
      next:
        s.docs.length > 30
          ? d.kind === "revisions"
            ? String(page.at(-1)!.get("revision"))
            : d.kind === "moderation"
              ? Buffer.from(
                  `${page.at(-1)!.get("createdAt")}|${page.at(-1)!.id}`,
                ).toString("base64url")
              : page.at(-1)!.id
          : null,
    };
  });
});
/** Root scheduler integration: bounded due jobs; revoked actors and changed revisions fail closed. */
export async function publishDueStudioPosts(
  db = getFirestore(),
  now = Date.now(),
) {
  const due = await db
    .collection("blogSchedules")
    .where("dueAt", "<=", new Date(now).toISOString())
    .orderBy("dueAt")
    .limit(20)
    .get();
  const results = [];
  for (const job of due.docs) {
    const j = job.data();
    try {
      let identity;
      try {
        identity = await getAuth().getUser(j.actor);
      } catch (e) {
        if (
          e &&
          typeof e === "object" &&
          "code" in e &&
          ["auth/user-not-found", "auth/user-disabled"].includes(String(e.code))
        )
          throw new HttpsError(
            "permission-denied",
            "Tài khoản không thể xuất bản theo lịch.",
          );
        throw e;
      }
      if (
        identity.disabled ||
        !identity.emailVerified ||
        !identity.providerData.some((p) => p.providerId === "google.com")
      )
        throw new HttpsError(
          "permission-denied",
          "Tài khoản không thể xuất bản theo lịch.",
        );
      await executeStudioCommand(
        db,
        j.actor,
        {
          action: "publish",
          id: job.id,
          expectedVersion: j.revision,
          operationId: j.operationId,
        },
        true,
        identity.email,
      );
      results.push({ id: job.id, status: "published" });
    } catch (e) {
      const code = e instanceof HttpsError ? e.code : "internal";
      // Permanent failures must not starve later jobs. Preserve the requested time
      // and show a blocked schedule; only an explicit new schedule retries it.
      if (
        [
          "aborted",
          "permission-denied",
          "failed-precondition",
          "already-exists",
          "invalid-argument",
          "not-found",
        ].includes(code)
      ) {
        await db.runTransaction(async (tx) => {
          const current = await tx.get(job.ref);
          if (
            current.get("operationId") === j.operationId &&
            current.get("revision") === j.revision
          ) {
            tx.update(job.ref, {
              status: "blocked",
              code,
              requestedAt: j.dueAt,
              failedAt: new Date().toISOString(),
              dueAt: FieldValue.delete(),
            });
          }
        });
      }
      results.push({ id: job.id, status: "blocked", code });
    }
  }
  return results;
}

/** Shared decoder for published Studio media; bounded animated decode and exact format. */
export async function validateStudioImage(
  bytes: Buffer,
  expectedMime: string,
): Promise<void> {
  if (!bytes.length || bytes.length > 5 * 1024 * 1024)
    throw new HttpsError("invalid-argument", "Ảnh vượt quá 5 MB.");
  const { default: sharp } = await import("sharp");
  try {
    const image = sharp(bytes, {
        animated: true,
        limitInputPixels: 20000000,
      }),
      meta = await image.metadata();
    const mime = {
      png: "image/png",
      jpeg: "image/jpeg",
      webp: "image/webp",
      gif: "image/gif",
    }[meta.format as "png" | "jpeg" | "webp" | "gif"];
    if (
      mime !== expectedMime ||
      !meta.width ||
      !meta.height ||
      Number(meta.pages ?? 1) > 100 ||
      meta.width * (meta.pageHeight ?? meta.height) * Number(meta.pages ?? 1) >
        20000000
    )
      throw new Error("INVALID_IMAGE");
    await image.raw().toBuffer();
  } catch {
    throw new HttpsError(
      "invalid-argument",
      "Định dạng hoặc kích thước ảnh không hợp lệ.",
    );
  }
}
/** Source-faithful image normalization also strips EXIF/location metadata. */
export async function normalizeStudioImage(bytes: Buffer, mime: string) {
  await validateStudioImage(bytes, mime);
  const { default: sharp } = await import("sharp");
  const output = await sharp(bytes, {
    animated: true,
    limitInputPixels: 20000000,
  })
    .rotate()
    .resize({
      width: 2400,
      height: 2400,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 85 })
    .toBuffer();
  if (output.length > 5 * 1024 * 1024)
    throw new HttpsError("invalid-argument", "Ảnh sau xử lý vượt quá 5 MB.");
  const meta = await sharp(output, {
    animated: true,
    limitInputPixels: 20000000,
  }).metadata();
  return {
    bytes: output,
    mime: "image/webp" as const,
    width: meta.width!,
    height: (meta.pageHeight ?? meta.height)!,
  };
}
/** Dedicated Studio media supports the reference formats while legacy upload stays unchanged. */
export const studioMediaUpload = onCall(
  { ...opts, maxInstances: 2, concurrency: 2, memory: "512MiB" },
  async (req) => {
    const uid = requireVerifiedGoogle(req.auth),
      db = getFirestore();
    const d = parse(
      z
        .object({
          mime: z.enum(["image/png", "image/jpeg", "image/webp", "image/gif"]),
          base64: z
            .string()
            .min(4)
            .max(6990510)
            .regex(
              /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/,
            ),
          alt: z.string().trim().min(2).max(300),
          rightsConfirmed: z.literal(true),
          postId: studioIdSchema.optional(),
          authorId: studioIdSchema.optional(),
        })
        .strict(),
      req.data,
    );
    await bindStudioIdentity(
      db,
      uid,
      typeof req.auth?.token.email === "string"
        ? req.auth.token.email
        : undefined,
    );
    if (d.postId && d.authorId)
      throw new HttpsError(
        "invalid-argument",
        "Chọn bài viết hoặc tác giả cho ảnh.",
      );
    await db.runTransaction((tx) => authority(db, tx, uid, !!d.authorId));
    const bytes = Buffer.from(d.base64, "base64");
    if (bytes.length > 5 * 1024 * 1024)
      throw new HttpsError("invalid-argument", "Ảnh vượt quá 5 MB.");
    const {
      bytes: output,
      width,
      height,
    } = await normalizeStudioImage(bytes, d.mime);
    const { getStorage } = await import("firebase-admin/storage"),
      id = randomUUID(),
      objectPath = `content-images/${id}`,
      file = getStorage().bucket().file(objectPath);
    await file.save(output, {
      resumable: false,
      metadata: {
        contentType: "image/webp",
        cacheControl: "private,no-store",
        metadata: { sha256: createHash("sha256").update(output).digest("hex") },
      },
    });
    try {
      await db.runTransaction(async (tx) => {
        const role = await authority(db, tx, uid, !!d.authorId);
        let author, settingsSnap;
        if (d.authorId) {
          [author, settingsSnap] = await Promise.all([
            tx.get(db.doc(`blogAuthors/${d.authorId}`)),
            tx.get(db.doc("blogStudioSettings/main")),
          ]);
          if (!author.exists)
            throw new HttpsError("not-found", "Không tìm thấy tác giả.");
        }
        if (d.postId) {
          const draft = await tx.get(db.doc(`blogDrafts/${d.postId}`));
          if (draft.exists) requireStudioDraft(role, uid, draft.data()!);
          if (!draft.exists)
            throw new HttpsError("not-found", "Không tìm thấy bản thảo.");
        }
        tx.create(db.doc(`contentMedia/${id}`), {
          objectPath,
          studioMedia: true,
          mime: "image/webp",
          width: width,
          height: height,
          alt: d.alt,
          rightsConfirmed: true,
          size: output.length,
          uploadedBy: uid,
          createdAt: Date.now(),
          status: d.postId || d.authorId ? "linked" : "unlinked",
          ...(d.postId
            ? { contentKind: "posts", contentId: d.postId }
            : d.authorId
              ? { contentKind: "authors", contentId: d.authorId }
              : {}),
        });
        if (d.authorId && author?.exists && settingsSnap?.exists) {
          const currentAuthors = settingsSnap.get("authors");
          if (
            !Array.isArray(currentAuthors) ||
            !currentAuthors.some((a: { id: string }) => a.id === d.authorId)
          )
            throw new HttpsError(
              "failed-precondition",
              "Danh mục tác giả chưa đồng bộ.",
            );
          tx.update(author.ref, {
            avatarId: id,
            revision: nextStudioRevision(author.get("revision") ?? 1),
          });
          tx.update(settingsSnap.ref, {
            authors: currentAuthors.map((a: { id: string }) =>
              a.id === d.authorId ? { ...a, avatarId: id } : a,
            ),
            revision: nextStudioRevision(settingsSnap.get("revision") ?? 1),
          });
        }
      });
    } catch (e) {
      await file.delete({ ignoreNotFound: true });
      throw e;
    }
    return {
      id,
      url: `/media/${id}`,
      alt: d.alt,
      mime: "image/webp",
      width: width,
      height: height,
    };
  },
);
export const studioMediaRead = onCall(
  { ...opts, maxInstances: 2, concurrency: 4 },
  async (req) => {
    const uid = requireVerifiedGoogle(req.auth),
      db = getFirestore(),
      { id } = parse(z.object({ id: studioIdSchema }).strict(), req.data);
    await bindStudioIdentity(
      db,
      uid,
      typeof req.auth?.token.email === "string"
        ? req.auth.token.email
        : undefined,
    );
    const read = () =>
      db.runTransaction(async (tx) => {
        const role = await authority(db, tx, uid);
        const media = await tx.get(db.doc(`contentMedia/${id}`));
        if (
          !media.exists ||
          !(
            media.get("uploadedBy") === uid ||
            (["posts", "authors"].includes(media.get("contentKind")) &&
              media.get("contentId"))
          )
        )
          throw new HttpsError("permission-denied", "Không thể truy cập ảnh.");
        if (
          ["posts", "authors"].includes(media.get("contentKind")) &&
          media.get("contentId")
        ) {
          const draft = await tx.get(
            db.doc(`blogDrafts/${media.get("contentId")}`),
          );
          if (draft.exists) requireStudioDraft(role, uid, draft.data()!);
          else if (role === "author" && media.get("uploadedBy") !== uid)
            throw new HttpsError(
              "permission-denied",
              "Không thể truy cập ảnh.",
            );
        }
        if (
          media.get("rightsConfirmed") !== true ||
          !["unlinked", "linked"].includes(media.get("status")) ||
          !Number.isSafeInteger(media.get("size")) ||
          media.get("size") < 1 ||
          media.get("size") > 5 * 1024 * 1024 ||
          media.get("objectPath") !== `content-images/${id}` ||
          !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(
            media.get("mime"),
          )
        )
          throw new HttpsError(
            "failed-precondition",
            "Thông tin ảnh không hợp lệ.",
          );
        return media.data()!;
      });
    const media = await read();
    const { getStorage } = await import("firebase-admin/storage"),
      [bytes] = await getStorage().bucket().file(media.objectPath).download();
    const fresh = await read();
    if (
      fresh.objectPath !== media.objectPath ||
      fresh.mime !== media.mime ||
      fresh.size !== media.size
    )
      throw new HttpsError("aborted", "Ảnh đã thay đổi. Tải lại để tiếp tục.");
    if (bytes.length > 5 * 1024 * 1024)
      throw new HttpsError("failed-precondition", "Ảnh vượt quá 5 MB.");
    return {
      id,
      mime: media.mime,
      base64: bytes.toString("base64"),
      alt: media.alt,
    };
  },
);

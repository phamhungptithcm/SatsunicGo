import { createHash } from "node:crypto";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import {
  blogCommentSubmitSchema,
  blogCommentListSchema,
  blogCommentCommandSchema,
  blogCommentReportSchema,
  commentRate,
  publicBlogComment,
  type BlogComment,
} from "../../packages/domain/blog-comments";
import { googleStudioAvatar } from "../../packages/domain/blog-studio-advanced";
import { nextStudioRevision } from "../../packages/domain/blog-studio";
import { requireVerifiedGoogle } from "./auth/guards";
const opts = {
  region: "asia-southeast1",
  maxInstances: 3,
  concurrency: 10,
  enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
};
export async function submitBlogComment(
  db: Firestore,
  uid: string,
  input: unknown,
  now = Date.now(),
  avatar?: string,
) {
  const parsed = blogCommentSubmitSchema.safeParse(input);
  if (!parsed.success)
    throw new HttpsError("invalid-argument", "Bình luận không hợp lệ.");
  const d = parsed.data;
  const actor = createHash("sha256").update(uid).digest("hex"),
    id = createHash("sha256").update(`${uid}:${d.operationId}`).digest("hex"),
    hash = createHash("sha256").update(JSON.stringify(d)).digest("hex"),
    ref = db.doc(`blogComments/${id}`),
    receipt = db.doc(`blogCommentOperations/${id}`),
    rate = db.doc(`blogCommentLimits/${actor}`);
  return db.runTransaction(async (tx) => {
    const [user, post, settings, done, parent, quota] = await Promise.all([
      tx.get(db.doc(`users/${uid}`)),
      tx.get(db.doc(`blogPublished/${d.postId}`)),
      tx.get(db.doc("blogStudioSettings/main")),
      tx.get(receipt),
      d.parentId ? tx.get(db.doc(`blogComments/${d.parentId}`)) : null,
      tx.get(rate),
    ]);
    if (!user.exists || user.get("locked"))
      throw new HttpsError(
        "permission-denied",
        "Tài khoản không thể gửi bình luận.",
      );
    if (!post.exists || post.get("status") !== "published")
      throw new HttpsError("not-found", "Không tìm thấy bài viết.");
    if (
      post.get("commentsEnabled") !== true ||
      (settings.exists && settings.get("commentsEnabled") !== true)
    )
      throw new HttpsError(
        "failed-precondition",
        "Bài viết hiện không nhận bình luận.",
      );
    if (
      parent &&
      (!parent.exists ||
        parent.get("postId") !== d.postId ||
        parent.get("parentId") !== "" ||
        parent.get("status") !== "approved")
    )
      throw new HttpsError(
        "failed-precondition",
        "Không thể trả lời bình luận này.",
      );
    if (done.exists) {
      if (done.get("hash") !== hash)
        throw new HttpsError("already-exists", "Mã thao tác đã được dùng.");
      const current = await tx.get(ref);
      if (!current.exists)
        throw new HttpsError("not-found", "Không tìm thấy bình luận.");
      return { comment: publicBlogComment(current.data() as BlogComment) };
    }
    let recent: number[];
    try {
      recent = commentRate(quota.get("recent"), now);
    } catch (e) {
      throw new HttpsError(
        e instanceof Error && e.message === "COMMENT_RATE_LIMIT"
          ? "resource-exhausted"
          : "failed-precondition",
        "Vui lòng đợi trước khi gửi thêm bình luận.",
      );
    }
    const at = new Date(now).toISOString(),
      comment: BlogComment = {
        id,
        postId: d.postId,
        parentId: d.parentId,
        uid,
        name: d.name,
        text: d.text,
        status: "pending",
        revision: 1,
        createdAt: at,
        updatedAt: at,
        ...(googleStudioAvatar(avatar)
          ? { avatar: googleStudioAvatar(avatar) }
          : {}),
      };
    tx.create(ref, { ...comment, moderationReasons: ["manual_review"] });
    tx.create(receipt, { hash, commentId: id, createdAt: at });
    tx.set(rate, { recent });
    return { comment: publicBlogComment(comment) };
  });
}
export const blogCommentSubmit = onCall(opts, (req) =>
  submitBlogComment(
    getFirestore(),
    requireVerifiedGoogle(req.auth),
    req.data,
    Date.now(),
    typeof req.auth?.token.picture === "string"
      ? req.auth.token.picture
      : undefined,
  ),
);
export async function listBlogComments(
  db: Firestore,
  input: unknown,
  uid?: string,
) {
  const parsed = blogCommentListSchema.safeParse(input);
  if (!parsed.success)
    throw new HttpsError("invalid-argument", "Trang bình luận không hợp lệ.");
  const d = parsed.data;
  return db.runTransaction(async (tx) => {
    const [post, settings, parent] = await Promise.all([
      tx.get(db.doc(`blogPublished/${d.postId}`)),
      tx.get(db.doc("blogStudioSettings/main")),
      d.parentId ? tx.get(db.doc(`blogComments/${d.parentId}`)) : null,
    ]);
    if (
      !post.exists ||
      post.get("status") !== "published" ||
      (parent &&
        (!parent.exists ||
          parent.get("postId") !== d.postId ||
          parent.get("parentId") !== "" ||
          !["approved", "deleted"].includes(parent.get("status"))))
    )
      throw new HttpsError(
        "not-found",
        "Không tìm thấy bài viết hoặc bình luận.",
      );
    let q = db
      .collection("blogComments")
      .where("postId", "==", d.postId)
      .where("parentId", "==", d.parentId)
      .where("status", "in", ["approved", "deleted"])
      .orderBy("createdAt", d.sort === "newest" ? "desc" : "asc")
      .orderBy("__name__", d.sort === "newest" ? "desc" : "asc");
    if (d.after) {
      const cursor = Buffer.from(d.after, "base64url")
        .toString("utf8")
        .split("|");
      if (
        cursor.length !== 2 ||
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(cursor[0]) ||
        !Number.isFinite(Date.parse(cursor[0])) ||
        !/^[a-zA-Z0-9-]{1,80}$/.test(cursor[1])
      )
        throw new HttpsError(
          "invalid-argument",
          "Mốc trang bình luận không hợp lệ.",
        );
      q = q.startAfter(cursor[0], cursor[1]);
    }
    let mine: ReturnType<typeof publicBlogComment>[] = [];
    if (uid) {
      const user = await tx.get(db.doc(`users/${uid}`));
      if (user.exists && !user.get("locked")) {
        const own = await tx.get(
          db
            .collection("blogComments")
            .where("postId", "==", d.postId)
            .where("uid", "==", uid)
            .orderBy("createdAt", "desc")
            .orderBy("__name__", "desc")
            .limit(50),
        );
        mine = own.docs.map((x) => publicBlogComment(x.data() as BlogComment));
      }
    }
    let thread: {
      parent: ReturnType<typeof publicBlogComment>;
      reply: ReturnType<typeof publicBlogComment> | null;
    } | null = null;
    if (d.commentId) {
      const focused = await tx.get(db.doc(`blogComments/${d.commentId}`));
      if (
        focused.exists &&
        focused.get("postId") === d.postId &&
        ["approved", "deleted"].includes(focused.get("status"))
      ) {
        const c = focused.data() as BlogComment;
        if (c.parentId) {
          const p = await tx.get(db.doc(`blogComments/${c.parentId}`));
          if (
            p.exists &&
            p.get("postId") === d.postId &&
            ["approved", "deleted"].includes(p.get("status"))
          )
            thread = {
              parent: publicBlogComment(p.data() as BlogComment),
              reply: publicBlogComment(c),
            };
        } else thread = { parent: publicBlogComment(c), reply: null };
      }
    }
    const count = post.get("commentCount");
    const aggregate =
      Number.isSafeInteger(count) && count >= 0
        ? null
        : await tx.get(
            db
              .collection("blogComments")
              .where("postId", "==", d.postId)
              .where("status", "==", "approved")
              .count(),
          );
    const result = await tx.get(q.limit(21)),
      page = result.docs.slice(0, 20);
    return {
      count: aggregate ? aggregate.data().count : count,
      mine,
      thread,
      items: page.map((c) => publicBlogComment(c.data() as BlogComment)),
      next:
        result.size > 20
          ? Buffer.from(
              `${page.at(-1)!.get("createdAt")}|${page.at(-1)!.id}`,
            ).toString("base64url")
          : null,
      commentsEnabled:
        post.get("commentsEnabled") === true &&
        (!settings.exists || settings.get("commentsEnabled") === true),
    };
  });
}
export const blogCommentList = onCall(opts, (req) =>
  listBlogComments(
    getFirestore(),
    req.data,
    req.auth ? requireVerifiedGoogle(req.auth) : undefined,
  ),
);

export async function changeBlogComment(
  db: Firestore,
  uid: string,
  input: unknown,
  now = Date.now(),
) {
  const parsed = blogCommentCommandSchema.safeParse(input);
  if (!parsed.success || (parsed.data.action === "edit" && !parsed.data.text))
    throw new HttpsError(
      "invalid-argument",
      "Thao tác bình luận không hợp lệ.",
    );
  const d = parsed.data,
    ref = db.doc(`blogComments/${d.id}`),
    hash = createHash("sha256").update(JSON.stringify(d)).digest("hex"),
    receipt = db.doc(
      `blogCommentOperations/${createHash("sha256").update(`${uid}:${d.operationId}`).digest("hex")}`,
    );
  return db.runTransaction(async (tx) => {
    const [user, comment, done] = await Promise.all([
      tx.get(db.doc(`users/${uid}`)),
      tx.get(ref),
      tx.get(receipt),
    ]);
    if (
      !user.exists ||
      user.get("locked") ||
      !comment.exists ||
      comment.get("uid") !== uid
    )
      throw new HttpsError(
        "permission-denied",
        "Không thể thay đổi bình luận này.",
      );
    const old = comment.data() as BlogComment,
      postRef = db.doc(`blogPublished/${old.postId}`),
      [post, settings, parent] = await Promise.all([
        tx.get(postRef),
        tx.get(db.doc("blogStudioSettings/main")),
        old.parentId ? tx.get(db.doc(`blogComments/${old.parentId}`)) : null,
      ]);
    if (
      d.action === "edit" &&
      (!post.exists ||
        post.get("status") !== "published" ||
        post.get("commentsEnabled") !== true ||
        (settings.exists && settings.get("commentsEnabled") !== true) ||
        ["hidden", "rejected", "spam", "deleted", "deleted_private"].includes(
          old.status,
        ))
    )
      throw new HttpsError(
        "failed-precondition",
        "Không thể sửa bình luận này.",
      );
    if (done.exists) {
      if (done.get("hash") !== hash)
        throw new HttpsError("already-exists", "Mã thao tác đã được dùng.");
      return { comment: publicBlogComment(old) };
    }
    if (old.revision !== d.expectedVersion)
      throw new HttpsError(
        "aborted",
        "Bình luận đã thay đổi. Tải lại để tiếp tục.",
      );
    const at = new Date(now).toISOString(),
      next = {
        ...old,
        status:
          d.action === "edit"
            ? "pending"
            : ["approved", "deleted"].includes(old.status)
              ? "deleted"
              : "deleted_private",
        revision: old.revision + 1,
        updatedAt: at,
        ...(d.action === "edit"
          ? { text: d.text! }
          : { text: "", name: "", avatar: "", badge: "" }),
      };
    let delta = old.status === "approved" ? -1 : 0;
    if (parent?.exists) {
      tx.update(parent.ref, {
        approvedReplyCount: Math.max(
          0,
          Number(parent.get("approvedReplyCount") ?? 0) + delta,
        ),
      });
      if (!["approved", "deleted"].includes(parent.get("status"))) delta = 0;
    }
    if (!old.parentId)
      delta +=
        (Number(["approved", "deleted"].includes(next.status)) -
          Number(["approved", "deleted"].includes(old.status))) *
        Math.max(0, Number(old.approvedReplyCount ?? 0));
    if (post.exists)
      tx.update(postRef, {
        commentCount: Math.max(
          0,
          Number(post.get("commentCount") ?? 0) + delta,
        ),
      });
    tx.update(ref, {
      ...next,
      moderationReasons:
        d.action === "edit"
          ? ["manual_review"]
          : (comment.get("moderationReasons") ?? []),
    });
    tx.create(receipt, {
      hash,
      commentId: d.id,
      action: d.action,
      createdAt: at,
    });
    return { comment: publicBlogComment(next) };
  });
}
export const blogCommentCommand = onCall(opts, (req) =>
  changeBlogComment(getFirestore(), requireVerifiedGoogle(req.auth), req.data),
);
export async function reportBlogComment(
  db: Firestore,
  uid: string,
  input: unknown,
) {
  const parsed = blogCommentReportSchema.safeParse(input);
  if (!parsed.success)
    throw new HttpsError("invalid-argument", "Lý do báo cáo không hợp lệ.");
  const d = parsed.data,
    hash = createHash("sha256").update(JSON.stringify(d)).digest("hex"),
    receipt = db.doc(
      `blogCommentOperations/${createHash("sha256").update(`${uid}:${d.operationId}`).digest("hex")}`,
    );
  return db.runTransaction(async (tx) => {
    const [u, c, done] = await Promise.all([
      tx.get(db.doc(`users/${uid}`)),
      tx.get(db.doc(`blogComments/${d.id}`)),
      tx.get(receipt),
    ]);
    if (
      !u.exists ||
      u.get("locked") ||
      !c.exists ||
      c.get("status") !== "approved"
    )
      throw new HttpsError(
        "permission-denied",
        "Không thể báo cáo bình luận này.",
      );
    const [post, parent] = await Promise.all([
      tx.get(db.doc(`blogPublished/${c.get("postId")}`)),
      c.get("parentId")
        ? tx.get(db.doc(`blogComments/${c.get("parentId")}`))
        : null,
    ]);
    if (
      !post.exists ||
      post.get("status") !== "published" ||
      (parent &&
        (!parent.exists ||
          !["approved", "deleted"].includes(parent.get("status"))))
    )
      throw new HttpsError("not-found", "Không tìm thấy bình luận.");
    if (done.exists) {
      if (done.get("hash") !== hash)
        throw new HttpsError("already-exists", "Mã thao tác đã được dùng.");
      return { ok: true };
    }
    const reporter = createHash("sha256").update(uid).digest("hex");
    const reportRef = db.doc(`blogCommentReports/${d.id}-${reporter}`),
      previous = await tx.get(reportRef);
    tx.set(reportRef, {
      commentId: d.id,
      reporter: uid,
      reason: d.reason,
      state: "open",
      revision: previous.exists
        ? nextStudioRevision(previous.get("revision") ?? 1)
        : 1,
      createdAt: new Date().toISOString(),
    });
    tx.create(receipt, { hash, action: "report", commentId: d.id });
    return { ok: true };
  });
}
export const blogCommentReport = onCall(opts, (req) =>
  reportBlogComment(getFirestore(), requireVerifiedGoogle(req.auth), req.data),
);

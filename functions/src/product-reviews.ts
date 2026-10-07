import { createHash } from "node:crypto";
import {
  getFirestore,
  type Firestore,
  type Transaction,
} from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { z } from "zod";
import { requireVerifiedGoogle, isStringRoleArray } from "./auth/guards";
import { commentRate } from "../../packages/domain/blog-comments";
import {
  reviewWriteSchema,
  reviewReadSchema,
  reviewEligibilitySchema,
  reviewModerateSchema,
  reviewAdminSchema,
  purchaseEligibility,
  publicReview,
  ratingSummary,
  updateRating,
  type ProductReview,
  type RatingSummary,
} from "../../packages/domain/product-reviews";
const opts = {
  region: "asia-southeast1",
  maxInstances: 3,
  concurrency: 10,
  enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
};
const digest = (s: string) => createHash("sha256").update(s).digest("hex");
export const productReviewId = (uid: string, productId: string) =>
  digest(JSON.stringify([uid, productId]));
const empty: RatingSummary = { count: 0, sum: 0, histogram: [0, 0, 0, 0, 0] };
function parse<T>(schema: z.ZodType<T>, data: unknown): T {
  const p = schema.safeParse(data);
  if (!p.success)
    throw new HttpsError(
      "invalid-argument",
      "Thông tin đánh giá không hợp lệ.",
    );
  return p.data;
}
async function actor(
  db: Firestore,
  tx: Transaction,
  uid: string,
  staff = false,
) {
  const [u, a] = await Promise.all([
    tx.get(db.doc(`users/${uid}`)),
    tx.get(db.doc(`staffAccess/${uid}`)),
  ]);
  if (!u.exists || u.get("locked") || a.get("locked"))
    throw new HttpsError(
      "permission-denied",
      "Tài khoản không thể thực hiện thao tác.",
    );
  if (
    staff &&
    !(
      a.get("active") === true &&
      isStringRoleArray(a.get("roles")) &&
      a
        .get("roles")
        .some((r: string) => ["OWNER", "CONTENT_EDITOR"].includes(r))
    )
  )
    throw new HttpsError("permission-denied", "Không có quyền duyệt đánh giá.");
}
async function product(db: Firestore, tx: Transaction, id: string) {
  const p = await tx.get(db.doc(`products/${id}`));
  if (!p.exists || p.get("status") !== "published")
    throw new HttpsError("not-found", "Sản phẩm chưa được xuất bản.");
  return p;
}
async function verified(
  db: Firestore,
  tx: Transaction,
  uid: string,
  productId: string,
  orderId: string,
) {
  const order = await tx.get(db.doc(`orders/${orderId}`));
  if (!order.exists || order.get("ownerId") !== uid)
    return { state: "unknown" as const, variant: "" };
  const allocation = await tx.get(db.doc(`packageAllocations/${orderId}`));
  const raw: unknown = allocation.get("parcelIds");
  const ids =
    Array.isArray(raw) &&
    raw.length <= 60 &&
    raw.every((x) => typeof x === "string" && /^[a-zA-Z0-9-]{1,80}$/.test(x))
      ? (raw as string[])
      : [];
  const [parcels, projections] = await Promise.all([
    Promise.all(ids.map((id) => tx.get(db.doc(`packages/${id}`)))),
    Promise.all(
      ids.map((id) => tx.get(db.doc(`customerShipments/${uid}-${id}`))),
    ),
  ]);
  return {
    state: purchaseEligibility({
      uid,
      productId,
      orderId,
      order: order.data(),
      allocation: allocation.data(),
      parcels: parcels.map((x) => x.data()),
      projections: projections.map((x) => x.data()),
    }),
    variant:
      typeof order.get("catalogSnapshot.variant") === "string"
        ? order.get("catalogSnapshot.variant")
        : "",
  };
}
function own(r: ProductReview | undefined) {
  return r
    ? { version: r.version, status: r.status, draft: r.draft, reason: r.reason }
    : null;
}
function summaryValue(raw: unknown, exists: boolean, hasPublic: boolean) {
  if (!exists) {
    if (hasPublic)
      throw new HttpsError(
        "failed-precondition",
        "Chưa xác minh được tổng hợp đánh giá.",
      );
    return { ...empty, histogram: [...empty.histogram] };
  }
  try {
    const value = ratingSummary(raw);
    if (hasPublic && value.count === 0)
      throw Error("REVIEW_SUMMARY_UNAVAILABLE");
    return value;
  } catch {
    throw new HttpsError(
      "failed-precondition",
      "Chưa xác minh được tổng hợp đánh giá.",
    );
  }
}
function safeRatingUpdate(
  value: unknown,
  oldRating?: number,
  nextRating?: number,
) {
  try {
    return updateRating(value, oldRating, nextRating);
  } catch {
    throw new HttpsError(
      "failed-precondition",
      "Chưa xác minh được tổng hợp đánh giá.",
    );
  }
}
export async function readProductReviews(
  db: Firestore,
  input: unknown,
  uid?: string,
) {
  const d = parse(reviewReadSchema, input);
  return db.runTransaction(async (tx) => {
    await product(db, tx, d.productId);
    if (uid) await actor(db, tx, uid);
    let q = db
      .collection(`products/${d.productId}/reviewPublic`)
      .orderBy("__name__");
    if (d.after) q = q.startAfter(d.after);
    const [rows, s, m] = await Promise.all([
      tx.get(q.limit(21)),
      tx.get(db.doc(`productRatingSummaries/${d.productId}`)),
      uid
        ? tx.get(db.doc(`productReviews/${productReviewId(uid, d.productId)}`))
        : null,
    ]);
    const anyPublic = !s.exists
      ? await tx.get(
          db.collection(`products/${d.productId}/reviewPublic`).limit(1),
        )
      : null;
    let summary = null;
    try {
      const v = summaryValue(
        s.data(),
        s.exists,
        rows.size > 0 || !!anyPublic?.size,
      );
      summary = {
        count: v.count,
        average: v.count ? v.sum / v.count : null,
        histogram: v.histogram,
      };
    } catch {
      /* Unavailable is not a zero. */
    }
    const page = rows.docs.slice(0, 20);
    return {
      items: page.map((x) =>
        publicReview(x.data() as NonNullable<ProductReview["approved"]>),
      ),
      summary,
      next: rows.size > 20 ? page.at(-1)!.id : null,
      mine: own(m?.data() as ProductReview | undefined),
    };
  });
}
export async function readProductEligibility(
  db: Firestore,
  uid: string,
  input: unknown,
) {
  const d = parse(reviewEligibilitySchema, input);
  return db.runTransaction(async (tx) => {
    await actor(db, tx, uid);
    await product(db, tx, d.productId);
    const existing = await tx.get(
      db.doc(`productReviews/${productReviewId(uid, d.productId)}`),
    );
    if (existing.exists) return { state: "eligible", orders: [], next: null }; // Retained, server-verified purchase history survives returns/refunds.
    if (d.orderId)
      return {
        ...(await verified(db, tx, uid, d.productId, d.orderId)),
        orders: [],
        next: null,
      };
    let q = db
      .collection("orders")
      .where("ownerId", "==", uid)
      .orderBy("__name__");
    if (d.after) q = q.startAfter(d.after);
    const result = await tx.get(q.limit(21));
    const orders = result.docs
      .slice(0, 20)
      .filter(
        (x) =>
          x.get("purchaseKind") === "catalog" &&
          x.get("catalogSnapshot.productId") === d.productId,
      )
      .map((x) => ({ id: x.id, label: `Đơn ${x.id.slice(0, 8)}` }));
    return {
      state: "unknown",
      orders,
      next: result.size > 20 ? result.docs[19].id : null,
    };
  });
}
export async function writeProductReview(
  db: Firestore,
  uid: string,
  input: unknown,
  now = Date.now(),
) {
  const d = parse(reviewWriteSchema, input),
    id = productReviewId(uid, d.productId),
    ref = db.doc(`productReviews/${id}`),
    receipt = db.doc(
      `productReviewOperations/${digest(`${uid}:${d.operationId}`)}`,
    ),
    hash = digest(JSON.stringify(d));
  return db.runTransaction(async (tx) => {
    await actor(db, tx, uid);
    const [old, done] = await Promise.all([tx.get(ref), tx.get(receipt)]);
    if (d.action === "submit") await product(db, tx, d.productId);
    if (done.exists) {
      if (done.get("hash") !== hash)
        throw new HttpsError("already-exists", "Mã thao tác đã được dùng.");
      return { mine: own(old.data() as ProductReview | undefined) };
    }
    const r = old.data() as ProductReview | undefined;
    if ((r?.version ?? 0) !== d.expectedVersion)
      throw new HttpsError(
        "aborted",
        "Đánh giá đã thay đổi. Tải lại để tiếp tục.",
      );
    const orderId =
      r?.orderId ?? (d.action === "submit" ? (d.orderId ?? "") : "");
    let variant = r?.variant ?? "";
    if (!r) {
      if (d.action !== "submit" || !orderId)
        throw new HttpsError(
          "failed-precondition",
          "Chọn đơn đã nhận sản phẩm để đánh giá.",
        );
      const evidence = await verified(db, tx, uid, d.productId, orderId);
      if (evidence.state !== "eligible")
        throw new HttpsError(
          "failed-precondition",
          "Chưa xác minh được sản phẩm đã nhận trong đơn này.",
        );
      variant = evidence.variant;
    }
    const rateRef = db.doc(`productReviewLimits/${digest(uid)}`),
      quota = d.action === "submit" ? await tx.get(rateRef) : null;
    let recent: number[] = [];
    if (quota) {
      try {
        recent = commentRate(quota.get("recent"), now);
      } catch {
        throw new HttpsError(
          "resource-exhausted",
          "Anh/chị đợi một chút rồi gửi lại nhé.",
        );
      }
    }
    const pub = db.doc(`products/${d.productId}/reviewPublic/${id}`),
      summaryRef = db.doc(`productRatingSummaries/${d.productId}`);
    let nextSummary: RatingSummary | undefined;
    if (d.action === "withdraw" && r?.approved) {
      const [s, p] = await Promise.all([tx.get(summaryRef), tx.get(pub)]);
      if (!p.exists)
        throw new HttpsError(
          "failed-precondition",
          "Chưa xác minh được đánh giá đã đăng.",
        );
      if (
        JSON.stringify(
          publicReview(p.data() as NonNullable<ProductReview["approved"]>),
        ) !== JSON.stringify(publicReview(r.approved))
      )
        throw new HttpsError(
          "failed-precondition",
          "Bản đánh giá công khai không khớp.",
        );
      nextSummary = safeRatingUpdate(
        summaryValue(s.data(), s.exists, true),
        r.approved.rating,
      );
    }
    const next: ProductReview = {
      id,
      productId: d.productId,
      uid,
      orderId,
      variant,
      version: (r?.version ?? 0) + 1,
      status: d.action === "submit" ? "pending" : "withdrawn",
      draft: d.action === "submit" ? d.draft : r!.draft,
      approved: d.action === "withdraw" ? null : (r?.approved ?? null),
      createdAt: r?.createdAt ?? now,
      updatedAt: now,
      reason: "",
    };
    tx.set(ref, next);
    tx.create(receipt, { hash, reviewId: id, createdAt: now });
    if (quota) tx.set(rateRef, { recent });
    if (nextSummary) {
      tx.set(summaryRef, nextSummary);
      tx.delete(pub);
    }
    return { mine: own(next) };
  });
}
export async function moderateProductReview(
  db: Firestore,
  uid: string,
  input: unknown,
  now = Date.now(),
) {
  const d = parse(reviewModerateSchema, input),
    ref = db.doc(`productReviews/${d.id}`),
    receipt = db.doc(
      `productReviewOperations/${digest(`${uid}:${d.operationId}`)}`,
    ),
    hash = digest(JSON.stringify(d));
  return db.runTransaction(async (tx) => {
    await actor(db, tx, uid, true);
    const [old, done] = await Promise.all([tx.get(ref), tx.get(receipt)]);
    if (!old.exists)
      throw new HttpsError("not-found", "Không tìm thấy đánh giá.");
    const r = old.data() as ProductReview;
    if (done.exists) {
      if (done.get("hash") !== hash)
        throw new HttpsError("already-exists", "Mã thao tác đã được dùng.");
      return { ok: true };
    }
    if (r.version !== d.expectedVersion)
      throw new HttpsError(
        "aborted",
        "Đánh giá đã thay đổi. Tải lại để tiếp tục.",
      );
    if (["approve", "reject"].includes(d.action) && r.status !== "pending")
      throw new HttpsError(
        "failed-precondition",
        "Đánh giá không còn chờ duyệt.",
      );
    if (["hide", "reply"].includes(d.action) && !r.approved)
      throw new HttpsError("failed-precondition", "Đánh giá chưa được đăng.");
    if (d.action === "approve" || d.action === "reply")
      await product(db, tx, r.productId);
    const summaryRef = db.doc(`productRatingSummaries/${r.productId}`),
      publicRef = db.doc(`products/${r.productId}/reviewPublic/${r.id}`);
    const [s, p] = await Promise.all([tx.get(summaryRef), tx.get(publicRef)]);
    if (!!r.approved !== p.exists)
      throw new HttpsError(
        "failed-precondition",
        "Chưa xác minh được bản đánh giá công khai.",
      );
    const anyPublic = !s.exists
      ? await tx.get(
          db.collection(`products/${r.productId}/reviewPublic`).limit(1),
        )
      : null;
    if (!s.exists && anyPublic?.size)
      throw new HttpsError(
        "failed-precondition",
        "Chưa xác minh được tổng hợp đánh giá.",
      );
    if (
      p.exists &&
      JSON.stringify(
        publicReview(p.data() as NonNullable<ProductReview["approved"]>),
      ) !== JSON.stringify(publicReview(r.approved!))
    )
      throw new HttpsError(
        "failed-precondition",
        "Bản đánh giá công khai không khớp.",
      );
    let approved = r.approved;
    let summary: RatingSummary | undefined;
    if (d.action === "approve") {
      approved = publicReview({
        ...r.draft,
        id: r.id,
        productId: r.productId,
        variant: r.variant,
        verifiedPurchase: true,
        publishedAt: now,
        ...(r.approved?.reply ? { reply: r.approved.reply } : {}),
      });
      summary = safeRatingUpdate(
        summaryValue(s.data(), s.exists, p.exists),
        r.approved?.rating,
        approved.rating,
      );
    }
    if (d.action === "hide") {
      summary = safeRatingUpdate(
        summaryValue(s.data(), s.exists, true),
        r.approved!.rating,
      );
      approved = null;
    }
    if (d.action === "reply") approved = { ...r.approved!, reply: d.reason };
    const next = {
      ...r,
      approved,
      status:
        d.action === "approve"
          ? "approved"
          : d.action === "reject"
            ? "rejected"
            : d.action === "hide"
              ? "hidden"
              : r.status,
      version: r.version + 1,
      updatedAt: now,
      reason: ["reject", "hide"].includes(d.action) ? d.reason : r.reason,
    };
    tx.set(ref, next);
    if (d.action === "hide") tx.delete(publicRef);
    else if (["approve", "reply"].includes(d.action))
      tx.set(publicRef, approved!);
    if (summary) tx.set(summaryRef, summary);
    tx.create(receipt, { hash, reviewId: r.id, createdAt: now });
    tx.create(db.collection("productReviewAudit").doc(), {
      reviewId: r.id,
      actor: uid,
      action: d.action,
      reason: d.reason,
      version: next.version,
      createdAt: now,
    });
    return { ok: true };
  });
}
export async function adminProductReviews(
  db: Firestore,
  uid: string,
  input: unknown,
) {
  const d = parse(reviewAdminSchema, input);
  return db.runTransaction(async (tx) => {
    await actor(db, tx, uid, true);
    let q = db.collection("productReviews").orderBy("__name__");
    if (d.after) q = q.startAfter(d.after);
    const result = await tx.get(q.limit(21)),
      page = result.docs.slice(0, 20);
    const products = await Promise.all(
      page.map((x) => tx.get(db.doc(`products/${x.get("productId")}`))),
    );
    return {
      items: page.map((x, index) => {
        const r = x.data() as ProductReview;
        const p = products[index];
        return {
          id: r.id,
          productId: r.productId,
          productTitle:
            typeof p.get("title") === "string"
              ? p.get("title")
              : "Sản phẩm đã lưu trữ",
          productSlug:
            p.get("status") === "published" &&
            /^[a-z0-9-]{2,100}$/.test(p.get("slug") ?? "")
              ? p.get("slug")
              : null,
          version: r.version,
          status: r.status,
          draft: r.draft,
          reason: r.reason,
          hasPublished: !!r.approved,
        };
      }),
      next: result.size > 20 ? page.at(-1)!.id : null,
    };
  });
}
export const productReviewRead = onCall(opts, (req) =>
  readProductReviews(
    getFirestore(),
    req.data,
    req.auth ? requireVerifiedGoogle(req.auth) : undefined,
  ),
);
export const productReviewEligibility = onCall(opts, (req) =>
  readProductEligibility(
    getFirestore(),
    requireVerifiedGoogle(req.auth),
    req.data,
  ),
);
export const productReviewWrite = onCall(opts, (req) =>
  writeProductReview(getFirestore(), requireVerifiedGoogle(req.auth), req.data),
);
export const productReviewModerate = onCall(opts, (req) =>
  moderateProductReview(
    getFirestore(),
    requireVerifiedGoogle(req.auth),
    req.data,
  ),
);
export const productReviewAdmin = onCall(opts, (req) =>
  adminProductReviews(
    getFirestore(),
    requireVerifiedGoogle(req.auth),
    req.data,
  ),
);

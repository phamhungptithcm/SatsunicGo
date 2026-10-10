import { createHash, createHmac } from "node:crypto";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import {
  onCall,
  HttpsError,
  type CallableRequest,
} from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { z } from "zod";
import { requireVerifiedGoogle } from "./auth/guards";
import {
  publicTrackingCode,
  projectPublicTracking,
} from "../../packages/domain/public-order-tracking";
import { validTrackingId } from "../../packages/domain/order-tracking";
const key = defineSecret("GUEST_TRACKING_QUOTA_KEY");
const options = {
  region: "asia-southeast1",
  maxInstances: 2,
  concurrency: 8,
  enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
  secrets: process.env.FUNCTIONS_EMULATOR === "true" ? [] : [key],
};
const unavailable = () =>
  new HttpsError(
    "not-found",
    "Chưa tra cứu được đơn này. Kiểm tra mã hoặc đăng nhập để xem đơn của bạn.",
  );
const digest = (s: string) => createHash("sha256").update(s).digest("hex");
function secret() {
  // Test-only key, never used outside the existing emulator workflow.
  if (process.env.FUNCTIONS_EMULATOR === "true")
    return "synthetic-emulator-guest-tracking-key";
  const value = key.value();
  if (value.length < 32)
    throw new HttpsError(
      "unavailable",
      "Tra cứu đang tạm gián đoạn. Thử lại sau.",
    );
  return value;
}
const sign = (s: string) =>
  createHmac("sha256", secret()).update(s).digest("hex");
export async function admitGuestTracking(
  req: CallableRequest,
  scope = "read",
  identity?: string,
) {
  const db = getFirestore(),
    now = Date.now(),
    window = Math.floor(now / 60000);
  // rawRequest.ip is framework-derived; forwarded headers and payload identities ignored.
  const ip = identity ?? req.rawRequest?.ip ?? "unknown";
  const bucket = sign(`${scope}:${window}:${ip}`);
  await db.runTransaction(async (tx) => {
    const ref = db.doc(`guestTrackingQuotas/${bucket}`),
      global = db.doc(`guestTrackingQuotas/${scope}-${window}`);
    const [quota, total] = await Promise.all([tx.get(ref), tx.get(global)]);
    const count = (snapshot: typeof quota) => {
      if (!snapshot.exists) return 0;
      const value = z
        .number()
        .int()
        .nonnegative()
        .max(10000)
        .safeParse(snapshot.get("count"));
      if (!value.success)
        throw new HttpsError(
          "unavailable",
          "Tra cứu đang tạm gián đoạn. Thử lại sau.",
        );
      return value.data;
    };
    const clientCount = count(quota),
      totalCount = count(total);
    if (clientCount >= (scope === "read" ? 30 : 10) || totalCount >= 10000)
      throw new HttpsError(
        "resource-exhausted",
        "Bạn đang tra cứu quá nhanh. Thử lại sau một phút.",
      );
    tx.set(ref, {
      count: clientCount + 1,
      expiresAt: Timestamp.fromMillis(now + 120000),
    });
    tx.set(global, {
      count: totalCount + 1,
      expiresAt: Timestamp.fromMillis(now + 120000),
    });
  });
}
export const publicOrderTracking = onCall(options, async (req) => {
  req.rawRequest?.res?.set({
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex, nofollow",
    "Referrer-Policy": "no-referrer",
  });
  await admitGuestTracking(req);
  const parsed = z
    .object({ code: publicTrackingCode })
    .strict()
    .safeParse(req.data);
  if (!parsed.success) throw unavailable();
  const db = getFirestore(),
    hash = digest(parsed.data.code);
  const result = await db.runTransaction(async (tx) => {
    const share = await tx.get(db.doc(`guestTrackingCodes/${hash}`));
    const s = share.data();
    if (
      !s ||
      !validTrackingId(s.orderId) ||
      !Number.isSafeInteger(s.expiresAt) ||
      s.expiresAt <= Date.now()
    )
      return null;
    const [order, eligibility] = await Promise.all([
      tx.get(db.doc(`orders/${s.orderId}`)),
      tx.get(db.doc(`guestTrackingAccess/${s.orderId}`)),
    ]);
    const o = order.data();
    if (
      !o ||
      typeof o.ownerId !== "string" ||
      !/^[a-zA-Z0-9_-]{1,128}$/.test(o.ownerId) ||
      eligibility.get("activeHash") !== hash
    )
      return null;
    const [user, staff, allocation, history] = await Promise.all([
      tx.get(db.doc(`users/${o.ownerId}`)),
      tx.get(db.doc(`staffAccess/${o.ownerId}`)),
      tx.get(db.doc(`packageAllocations/${s.orderId}`)),
      tx.get(
        order.ref.collection("timeline").orderBy("createdAt", "desc").limit(50),
      ),
    ]);
    if (user.get("locked") || staff.get("locked")) return null;
    const ids = z
      .array(z.string().refine(validTrackingId))
      .max(60)
      .safeParse(allocation.get("parcelIds") ?? []);
    const parcelIds =
      ids.success && new Set(ids.data).size === ids.data.length ? ids.data : [];
    const [parcels, projections] = await Promise.all([
      Promise.all(parcelIds.map((id) => tx.get(db.doc(`packages/${id}`)))),
      Promise.all(
        parcelIds.map((id) =>
          tx.get(db.doc(`customerShipments/${o.ownerId}-${id}`)),
        ),
      ),
    ]);
    try {
      return projectPublicTracking({
        orderId: s.orderId,
        order: o,
        allocation: allocation.data(),
        parcels: parcels.map((p) => p.data()),
        projections: projections.map((p) => p.data()),
        timeline: history.docs.map((e) => e.data()),
        observedAt: Date.now(),
      });
    } catch {
      return null;
    }
  });
  if (!result) throw unavailable();
  return result;
});
/** Owner-issued capability. Hash-only storage; deterministic keyed replay never stores plaintext code. */
export const managePublicTrackingCode = onCall(options, async (req) => {
  req.rawRequest?.res?.set({
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
  });
  const uid = requireVerifiedGoogle(req.auth);
  await admitGuestTracking(req, "issue", uid);
  const parsed = z
    .object({
      action: z.enum(["issue", "revoke"]),
      orderId: z.string().refine(validTrackingId),
      expectedVersion: z.number().int().nonnegative(),
      operationId: z.string().uuid(),
    })
    .strict()
    .safeParse(req.data);
  if (!parsed.success)
    throw new HttpsError("invalid-argument", "Thông tin không hợp lệ.");
  const d = parsed.data,
    db = getFirestore(),
    fingerprint = digest(JSON.stringify(d));
  return db.runTransaction(async (tx) => {
    const accessRef = db.doc(`guestTrackingAccess/${d.orderId}`),
      opRef = db.doc(`guestTrackingOperations/${uid}-${d.operationId}`);
    const [order, user, staff, access, previous] = await Promise.all([
      tx.get(db.doc(`orders/${d.orderId}`)),
      tx.get(db.doc(`users/${uid}`)),
      tx.get(db.doc(`staffAccess/${uid}`)),
      tx.get(accessRef),
      tx.get(opRef),
    ]);
    if (
      !order.exists ||
      order.get("ownerId") !== uid ||
      user.get("locked") ||
      staff.get("locked")
    )
      throw new HttpsError("permission-denied", "Không thể truy cập đơn.");
    const expiresAt = previous.exists
      ? previous.get("expiresAt")
      : Date.now() + 30 * 86400000;
    if (!Number.isSafeInteger(expiresAt) || expiresAt <= Date.now())
      throw new HttpsError(
        "failed-precondition",
        "Mã đã hết hạn. Tạo mã mới để tiếp tục.",
      );
    // Expiry binds each issuance: replay after tombstone TTL cannot recreate an old capability.
    const code =
        "SGT-" + sign(`code:${uid}:${d.orderId}:${d.operationId}:${expiresAt}`),
      hash = digest(code);
    if (previous.exists) {
      if (previous.get("fingerprint") !== fingerprint)
        throw new HttpsError("already-exists", "Mã thao tác đã được sử dụng.");
      if (d.action === "issue" && access.get("activeHash") !== hash)
        throw new HttpsError(
          "failed-precondition",
          "Mã đã được thay thế hoặc thu hồi.",
        );
      return {
        code: d.action === "issue" ? code : null,
        expiresAt: previous.get("expiresAt"),
      };
    }
    if (order.get("version") !== d.expectedVersion)
      throw new HttpsError("aborted", "Đơn đã thay đổi. Tải lại để tiếp tục.");
    if (d.action === "issue")
      tx.set(db.doc(`guestTrackingCodes/${hash}`), {
        orderId: d.orderId,
        expiresAt,
        deleteAfter: Timestamp.fromMillis(expiresAt),
      });
    tx.set(accessRef, { activeHash: d.action === "issue" ? hash : null });
    tx.set(opRef, {
      fingerprint,
      expiresAt,
      deleteAfter: Timestamp.fromMillis(expiresAt),
    });
    tx.create(db.collection("auditEvents").doc(), {
      actor: uid,
      action: `guest-tracking-${d.action}`,
      resourceId: d.orderId,
      createdAt: Date.now(),
    });
    return { code: d.action === "issue" ? code : null, expiresAt };
  });
});

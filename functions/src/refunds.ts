import { requireLivePurchaseRecord } from "./purchase-test-boundary";
import {
  customerEvent,
  customerEventFields,
} from "./customer-notification-events";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { money } from "../../packages/domain";
import {
  isStringRoleArray,
  recentMfa,
  requireVerifiedGoogle,
} from "./auth/guards";
export const refundCommand = onCall(
  {
    region: "asia-southeast1",
    maxInstances: 3,
    enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
  },
  async (req) => {
    requireVerifiedGoogle(req.auth);
    if (!req.auth?.uid)
      throw new HttpsError("unauthenticated", "Đăng nhập để tiếp tục.");
    const parsed = z
      .object({
        action: z.enum(["request", "cancel"]),
        orderId: z.string().regex(/^[a-zA-Z0-9-]{1,80}$/),
        id: z.string().uuid().optional(),
        expectedVersion: z.number().int().positive(),
        operationId: z.string().uuid(),
        amount: money.positive().optional(),
        reason: z.string().trim().min(5).max(500),
      })
      .strict()
      .safeParse(req.data);
    if (!parsed.success)
      throw new HttpsError(
        "invalid-argument",
        "Thông tin hoàn tiền chưa hợp lệ.",
      );
    const d = parsed.data,
      uid = req.auth.uid,
      now = Date.now(),
      db = getFirestore(),
      id = d.id ?? randomUUID();
    const orderRef = db.doc(`orders/${d.orderId}`),
      ref = db.doc(`refunds/${id}`),
      op = db.doc(`idempotencyKeys/${uid}-${d.operationId}`);
    const hash = createHash("sha256").update(JSON.stringify(d)).digest("hex");
    return db.runTransaction(async (tx) => {
      const [access, user, order, refund, previous] = await Promise.all([
        tx.get(db.doc(`staffAccess/${uid}`)),
        tx.get(db.doc(`users/${uid}`)),
        tx.get(orderRef),
        tx.get(ref),
        tx.get(op),
      ]);
      if (
        access.data()?.active !== true ||
        !isStringRoleArray(access.data()?.roles) ||
        access.data()?.locked ||
        user.data()?.locked ||
        !access
          .data()
          ?.roles?.some((r: string) => ["OWNER", "FINANCE"].includes(r))
      )
        throw new HttpsError("permission-denied", "Cần quyền tài chính.");
      if (
        process.env.FUNCTIONS_EMULATOR !== "true" &&
        !recentMfa(req.auth!.token, now)
      )
        throw new HttpsError(
          "failed-precondition",
          "Cần xác thực hai lớp gần đây.",
          { reason: "RECENT_MFA_REQUIRED" },
        );
      if (previous.exists) {
        if (previous.data()?.hash !== hash)
          throw new HttpsError("already-exists", "Mã thao tác đã dùng.");
        return previous.data()?.result;
      }
      const o = order.data();
      if (!o || o.version !== d.expectedVersion)
        throw new HttpsError(
          "aborted",
          "Đơn đã thay đổi. Tải lại để đối soát.",
        );
      requireLivePurchaseRecord(o);
      requireLivePurchaseRecord(refund.data());
      let reserved = o.refundReserved ?? 0;
      if (d.action === "request") {
        if (
          refund.exists ||
          !d.amount ||
          !o.acceptedAt ||
          d.amount > o.collected - o.refunded - reserved
        )
          throw new HttpsError(
            "failed-precondition",
            "Số tiền vượt phần chưa hoàn và chưa dành cho yêu cầu khác.",
          );
        reserved += d.amount;
        tx.create(ref, {
          orderId: d.orderId,
          ownerId: o.ownerId,
          amount: d.amount,
          reason: d.reason,
          state: "pending",
          version: 1,
          createdAt: now,
          createdBy: uid,
        });
      } else {
        if (
          !d.id ||
          d.amount !== undefined ||
          refund.data()?.orderId !== d.orderId ||
          refund.data()?.state !== "pending"
        )
          throw new HttpsError(
            "failed-precondition",
            "Yêu cầu không còn chờ hoàn.",
          );
        reserved -= refund.data()!.amount;
        if (reserved < 0)
          throw new HttpsError(
            "failed-precondition",
            "Cần đối soát phần tiền đã dành để hoàn.",
          );
        tx.update(ref, {
          state: "cancelled",
          version: refund.data()!.version + 1,
          cancelledAt: now,
          cancelledBy: uid,
          cancellationReason: d.reason,
        });
      }
      const version = o.version + 1;
      tx.update(orderRef, {
        refundReserved: money.parse(reserved),
        version,
        ...(o.stage === "READY_TO_SHIP" &&
        o.finalTotal !== undefined &&
        o.collected - o.refunded - reserved < o.finalTotal
          ? { stage: "PACKED" }
          : {}),
      });
      tx.create(db.collection("auditEvents").doc(), {
        actor: uid,
        action: `refund-${d.action}`,
        resourceId: d.orderId,
        createdAt: now,
      });
      tx.create(orderRef.collection("timeline").doc(), {
        action: `refund-${d.action}`,
        createdAt: now,
      });
      tx.create(db.collection("outboxJobs").doc(), {
        ownerId: o.ownerId,
        orderId: d.orderId,
        action: `refund-${d.action}`,
        state: "queued",
        createdAt: now,
        ...customerEventFields(() => {
          const context = {
            ownerId: o.ownerId,
            entityId: d.orderId,
            orderId: d.orderId,
            entityVersion: version,
            occurredAt: now,
          };
          const values = {
            orderRef: d.orderId,
            refundAmount:
              d.action === "request"
                ? d.amount!
                : (refund.data()!.amount as number),
          };
          return d.action === "request"
            ? customerEvent("refund_requested", context, values)
            : customerEvent("refund_request_cancelled", context, {
                ...values,
                customerReason: "Yêu cầu đã được dừng xử lý",
              });
        }),
      });
      const result = { id, version };
      tx.create(op, { hash, result, createdAt: now });
      return result;
    });
  },
);

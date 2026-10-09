import {
  customerEvent,
  customerEventFields,
} from "./customer-notification-events";
import { createHash } from "node:crypto";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { requireVerifiedGoogle, isStringRoleArray } from "./auth/guards";
import { convertFx, money, type Order } from "../../packages/domain";
const schema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("propose"),
      operationId: z.string().uuid(),
      orderId: z.string().uuid(),
      expectedVersion: z.number().int().positive(),
      sourceLimitMinor: money.positive(),
      reason: z.string().trim().min(5).max(1000),
    })
    .strict(),
  z
    .object({
      action: z.literal("approve"),
      operationId: z.string().uuid(),
      orderId: z.string().uuid(),
      expectedVersion: z.number().int().positive(),
      proposalVersion: z.number().int().positive(),
    })
    .strict(),
]);
export function purchaseBalanceTarget(order: Order) {
  if (
    order.stage === "PACKED" &&
    order.finalApproved &&
    order.finalTotal !== undefined
  )
    return { total: order.finalTotal, reason: "final" as const };
  if (order.stage === "PURCHASING" && order.purchaseAdjustment?.approved)
    return {
      total: order.purchaseAdjustment.total,
      reason: "sourcing" as const,
    };
  throw new HttpsError(
    "failed-precondition",
    "Khoản chi phí cần được duyệt trước khi thanh toán thêm.",
  );
}
export const purchaseSourcingChange = onCall(
  {
    region: "asia-southeast1",
    maxInstances: 2,
    concurrency: 4,
    enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
  },
  async (req) => {
    const uid = requireVerifiedGoogle(req.auth),
      p = schema.safeParse(req.data),
      db = getFirestore();
    if (!p.success)
      throw new HttpsError(
        "invalid-argument",
        "Kiểm tra giá mua và lý do thay đổi.",
      );
    const d = p.data;
    return db.runTransaction(async (tx) => {
      const [stored, user, staff, op] = await Promise.all([
        tx.get(db.doc(`orders/${d.orderId}`)),
        tx.get(db.doc(`users/${uid}`)),
        tx.get(db.doc(`staffAccess/${uid}`)),
        tx.get(db.doc(`idempotencyKeys/sourcing-${uid}-${d.operationId}`)),
      ]);
      const order = stored.data() as Order | undefined,
        roles =
          staff.data()?.active && isStringRoleArray(staff.data()?.roles)
            ? (staff.data()!.roles as string[])
            : [];
      const authorized =
        d.action === "approve"
          ? order?.ownerId === uid
          : roles.some((r) => ["OWNER", "OPERATIONS_MANAGER"].includes(r)) ||
            (roles.includes("BUYER") &&
              staff.data()?.orderIds?.includes(d.orderId));
      if (
        !order?.upfront ||
        !order.checkoutId ||
        !authorized ||
        user.data()?.locked ||
        staff.data()?.locked
      )
        throw new HttpsError(
          "permission-denied",
          "Chưa thể cập nhật giá mua của đơn.",
        );
      const hash = createHash("sha256").update(JSON.stringify(d)).digest("hex");
      if (op.exists) {
        if (op.data()?.hash !== hash)
          throw new HttpsError("already-exists", "Mã thao tác đã dùng.");
        return op.data()?.result;
      }
      if (order.version !== d.expectedVersion)
        throw new HttpsError(
          "aborted",
          "Đơn đã đổi. Tải lại trước khi tiếp tục.",
        );
      if (
        order.stage !== "PURCHASING" ||
        order.balanceCheckoutId ||
        order.hold ||
        order.refundReserved
      )
        throw new HttpsError(
          "failed-precondition",
          "Đơn chưa thể thay đổi giá mua.",
        );
      let adjustment = order.purchaseAdjustment;
      if (d.action === "propose") {
        const original =
          order.upfront.unitSourceMinor *
          order.items.reduce((s, i) => s + i.quantity, 0);
        if (
          d.sourceLimitMinor <= original ||
          d.sourceLimitMinor < (order.actualSourceMinor ?? 0)
        )
          throw new HttpsError(
            "invalid-argument",
            "Giá mới cần cao hơn giá ban đầu và đủ chi phí đã ghi nhận.",
          );
        const total = money
          .positive()
          .parse(
            convertFx(
              d.sourceLimitMinor,
              order.upfront.fxNumerator,
              order.upfront.fxDenominator,
            ) + order.upfront.service,
          );
        adjustment = {
          version: (adjustment?.version ?? 0) + 1,
          sourceLimitMinor: d.sourceLimitMinor,
          total,
          reason: d.reason,
          approved: false,
        };
      } else {
        if (
          !adjustment ||
          adjustment.version !== d.proposalVersion ||
          adjustment.approved
        )
          throw new HttpsError(
            "aborted",
            "Khoản chênh lệch đã đổi. Xem lại trước khi duyệt.",
          );
        adjustment = { ...adjustment, approved: true };
      }
      const result = { id: order.id, version: order.version + 1 };
      tx.update(stored.ref, {
        purchaseAdjustment: adjustment,
        version: result.version,
      });
      tx.create(db.doc(`idempotencyKeys/sourcing-${uid}-${d.operationId}`), {
        hash,
        result,
        createdAt: Date.now(),
      });
      tx.create(stored.ref.collection("timeline").doc(d.operationId), {
        action:
          d.action === "propose"
            ? "proposePurchasePrice"
            : "approvePurchasePrice",
        createdAt: Date.now(),
      });
      const occurredAt = Date.now();
      tx.create(db.doc(`outboxJobs/sourcing-${uid}-${d.operationId}`), {
        ownerId: order.ownerId,
        orderId: order.id,
        resourceId: order.id,
        action:
          d.action === "propose"
            ? "proposePurchasePrice"
            : "approvePurchasePrice",
        state: "queued",
        createdAt: occurredAt,
        ...customerEventFields(() =>
          customerEvent(
            d.action === "propose"
              ? "price_change_proposed"
              : "change_accepted",
            {
              ownerId: order.ownerId,
              entityId: order.id,
              orderId: order.id,
              entityVersion: result.version,
              occurredAt,
            },
            d.action === "propose"
              ? {
                  orderRef: order.id,
                  customerReason: "Giá mua hiện tại cao hơn giá ban đầu",
                  previousTotal: order.upfront!.initialTotal,
                  proposedTotal: adjustment!.total,
                  differenceAmount:
                    adjustment!.total - order.upfront!.initialTotal,
                }
              : {
                  orderRef: order.id,
                  changeSummary: "Giá mua mới đã được bạn đồng ý",
                },
          ),
        ),
      });
      return result;
    });
  },
);

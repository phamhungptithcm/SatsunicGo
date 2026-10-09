import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { z } from "zod";
import { requireVerifiedGoogle } from "./auth/guards";
import {
  trackingStages,
  shipmentDeliveryEstimate,
  aggregateDeliveryEstimate,
  validTrackingId,
  type CustomerOrderTracking,
  type TrackingShipment,
} from "../../packages/domain/order-tracking";

const shipment = z.object({
  id: z.string().max(80),
  ownerId: z.string(),
  state: z.enum(["packed", "in_transit", "delivered", "failed", "returned"]),
  route: z.string().max(200),
  carrier: z.string().max(100).optional(),
  tracking: z.string().max(100).optional(),
  updatedAt: z.number().int().positive().max(8_640_000_000_000_000).optional(),
  allocations: z
    .array(
      z.object({
        orderId: z.string(),
        line: z.number().int().min(0).max(29),
        quantity: z.number().int().min(1).max(100),
      }),
    )
    .max(100),
});
const safeActions = new Set([
  "catalogCheckout",
  "submitRequest",
  "issueQuote",
  "acceptQuote",
  "verifyTransfer",
  "claimPurchase",
  "recordPurchase",
  "receive",
  "pack",
  "finalize",
  "approveFinal",
  "dispatch",
  "track",
  "confirmReceipt",
  "hold",
  "releaseHold",
  "cancelRequest",
  "change-propose",
  "change-accept",
  "change-reject",
  "change-apply",
  "return-request",
  "return-authorize",
  "return-receive",
  "return-inspect",
  "return-close",
  "refund-request",
  "refund-confirm",
  "refund-cancel",
  "resolvePaymentException",
]);

/** Read-only owner projection; even privileged staff cannot inspect another owner. */
export const customerOrderTracking = onCall(
  {
    region: "asia-southeast1",
    maxInstances: 3,
    enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
  },
  async (req): Promise<CustomerOrderTracking> => {
    const uid = requireVerifiedGoogle(req.auth);
    const input = z
      .object({ orderId: z.string().refine(validTrackingId) })
      .strict()
      .safeParse(req.data);
    if (!input.success)
      throw new HttpsError("invalid-argument", "Thông tin đơn không hợp lệ.");
    const orderId = input.data.orderId,
      db = getFirestore();
    return db.runTransaction(async (tx) => {
      const [order, user, access] = await Promise.all([
        tx.get(db.doc("orders/" + orderId)),
        tx.get(db.doc("users/" + uid)),
        tx.get(db.doc("staffAccess/" + uid)),
      ]);
      const value = order.data();
      if (
        !order.exists ||
        value?.ownerId !== uid ||
        user.data()?.locked ||
        access.data()?.locked
      )
        throw new HttpsError("permission-denied", "Không thể truy cập đơn.");
      const core = z
        .object({
          stage: z.enum(trackingStages),
          purchaseKind: z.enum(["catalog", "custom"]).optional(),
          version: z.number().int().nonnegative(),
          hold: z.string().optional(),
        })
        .safeParse(value);
      if (!core.success)
        throw new HttpsError(
          "failed-precondition",
          "Chưa đọc được trạng thái đơn đã xác minh.",
        );
      const [history, allocation] = await Promise.all([
        tx.get(
          order.ref
            .collection("timeline")
            .orderBy("createdAt", "desc")
            .limit(51),
        ),
        tx.get(db.doc("packageAllocations/" + orderId)),
      ]);
      const observedAt = Date.now();
      const rawIds: unknown = allocation.data()?.parcelIds;
      const validIds =
        Array.isArray(rawIds) &&
        rawIds.length <= 60 &&
        rawIds.every(validTrackingId);
      const parcelIds: string[] = validIds
        ? [...new Set(rawIds as string[])]
        : [];
      const projections = await Promise.all(
        parcelIds.map((id) =>
          tx.get(db.doc("customerShipments/" + uid + "-" + id)),
        ),
      );
      const shipments: TrackingShipment[] = [];
      const shippingStage = ["IN_TRANSIT", "DELIVERED", "COMPLETED"].includes(
        core.data.stage,
      );
      let shipmentsPartial =
        (rawIds !== undefined && !validIds) ||
        (validIds && parcelIds.length !== (rawIds as string[]).length) ||
        (shippingStage && parcelIds.length === 0);
      for (let i = 0; i < projections.length; i++) {
        const parsed = shipment.safeParse(projections[i].data());
        if (
          !parsed.success ||
          parsed.data.ownerId !== uid ||
          parsed.data.id !== parcelIds[i] ||
          (parsed.data.updatedAt ?? 0) > observedAt ||
          !parsed.data.allocations.some((a) => a.orderId === orderId)
        ) {
          shipmentsPartial = true;
          continue;
        }
        const p = parsed.data;
        const estimate = shipmentDeliveryEstimate(
          projections[i].get("deliveryEstimate"),
          p.state,
          observedAt,
        );
        shipments.push({
          id: p.id,
          state: p.state,
          route: p.route,
          ...(estimate ? { deliveryEstimate: estimate } : {}),
          ...(p.carrier ? { carrier: p.carrier } : {}),
          ...(p.tracking ? { tracking: p.tracking } : {}),
          ...(p.updatedAt ? { updatedAt: p.updatedAt } : {}),
        });
      }
      let estimate: CustomerOrderTracking["estimate"] = null;
      if (
        core.data.stage === "IN_TRANSIT" &&
        !core.data.hold &&
        !shipmentsPartial &&
        parcelIds.length &&
        shipments.length === parcelIds.length &&
        shipments.some((p) => p.state === "in_transit") &&
        shipments.every(
          (p) =>
            p.state === "delivered" ||
            (p.state === "in_transit" &&
              p.deliveryEstimate?.freshness === "current"),
        )
      ) {
        // At most 60 additional canonical reads, only for a potential complete ETA.
        const canonical = await Promise.all(
          parcelIds.map((id) => tx.get(db.doc("packages/" + id))),
        );
        estimate = aggregateDeliveryEstimate({
          orderId,
          ownerId: uid,
          stage: core.data.stage,
          onHold: !!core.data.hold,
          items: value.items,
          allocation: allocation.data(),
          parcels: canonical.map((p) => p.data()),
          projections: projections.map((p) => p.data()),
          observedAt,
        });
      }
      const timeline: CustomerOrderTracking["timeline"] = [];
      let timelinePartial = history.size > 50;
      for (const event of history.docs.slice(0, 50).reverse()) {
        const parsed = z
          .object({
            action: z.string().max(80),
            createdAt: z.number().int().positive().max(observedAt),
          })
          .safeParse(event.data());
        if (!parsed.success) {
          timelinePartial = true;
          continue;
        }
        timeline.push({
          action: safeActions.has(parsed.data.action)
            ? parsed.data.action
            : "update",
          createdAt: parsed.data.createdAt,
        });
      }
      return {
        orderId,
        stage: core.data.stage,
        purchaseKind: core.data.purchaseKind ?? "custom",
        upfrontPayment: typeof value?.checkoutId === "string",
        version: core.data.version,
        onHold: !!core.data.hold,
        observedAt,
        timeline,
        timelinePartial,
        shipments,
        shipmentsPartial,
        estimate,
      };
    });
  },
);

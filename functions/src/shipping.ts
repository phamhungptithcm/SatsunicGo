import { requireLivePurchaseRecord } from "./purchase-test-boundary";
import { parcelCustomerEvent, customerEventFields } from "./customer-notification-events";
import { isStringRoleArray, requireVerifiedGoogle } from "./auth/guards";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { randomUUID, createHash } from "node:crypto";
import { z } from "zod";
import { type Order } from "../../packages/domain";
import {
  allocationSchema,
  deliveryWindowSchema,
  readManualDeliveryEstimate,
  verifyAllocations,
  verifyParcelDispatch,
  fullyDelivered,
  type Parcel,
} from "../../packages/domain/shipping";
const options = {
  region: "asia-southeast1",
  maxInstances: 3,
  concurrency: 10,
  enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
};
export const shippingCommand = onCall(options, async (req) => {
  requireVerifiedGoogle(req.auth);
  if (!req.auth?.uid)
    throw new HttpsError("unauthenticated", "Đăng nhập để tiếp tục.");
  const parsed = z
    .object({
      action: z.enum([
        "packParcel",
        "dispatchParcel",
        "trackParcel",
        "setDeliveryEstimate",
      ]),
      operationId: z.string().uuid(),
      parcelId: z
        .string()
        .regex(/^[a-zA-Z0-9-]{1,80}$/)
        .optional(),
      expectedVersion: z.number().int().positive().optional(),
      orderVersions: z.record(z.string(), z.number().int().positive()),
      payload: z.unknown(),
    })
    .strict()
    .safeParse(req.data);
  if (!parsed.success)
    throw new HttpsError("invalid-argument", "Thông tin kiện không hợp lệ.");
  const d = parsed.data,
    db = getFirestore(),
    uid = req.auth.uid,
    id = d.parcelId ?? randomUUID(),
    ref = db.doc(`packages/${id}`),
    op = db.doc(`idempotencyKeys/${uid}-${d.operationId}`),
    hash = createHash("sha256").update(JSON.stringify(d)).digest("hex");
  try {
    return await db.runTransaction(async (tx) => {
      const [access, user, previous, snapshot] = await Promise.all([
        tx.get(db.doc(`staffAccess/${uid}`)),
        tx.get(db.doc(`users/${uid}`)),
        tx.get(op),
        tx.get(ref),
      ]);
      const a = access.data();
      if (
        a?.active !== true ||
        !isStringRoleArray(a.roles) ||
        a.locked ||
        user.data()?.locked ||
        !(
          ["trackParcel", "setDeliveryEstimate"].includes(d.action)
            ? ["OWNER", "OPERATIONS_MANAGER"]
            : ["OWNER", "WAREHOUSE"]
        ).some((r) => a.roles?.includes(r))
      )
        throw new HttpsError(
          "permission-denied",
          "Cần quyền vận hành kiện hàng.",
        );
      if (previous.exists) {
        if (previous.data()?.hash !== hash)
          throw new HttpsError(
            "already-exists",
            "Mã thao tác đã được sử dụng.",
          );
        return previous.data()?.result;
      }
      let parcel = snapshot.data() as Parcel;
      if (d.action === "packParcel") {
        if (snapshot.exists)
          throw new HttpsError("already-exists", "Kiện đã tồn tại.");
        const p = z
          .object({
            allocations: z.array(allocationSchema).min(1).max(100),
            weightGrams: z.number().int().positive().max(1000000),
            warehouse: z.string().min(2).max(100),
            route: z.string().min(2).max(100),
            dimensionsCm: z.array(z.number().positive().max(1000)).length(3),
            checklist: z.literal(true),
            evidence: z.string().min(5).max(1000),
          })
          .strict()
          .parse(d.payload);
        parcel = {
          id,
          version: 1,
          state: "packed",
          allocations: p.allocations,
          weightGrams: p.weightGrams,
          warehouse: p.warehouse,
          route: p.route,
        };
      } else if (!snapshot.exists || parcel.version !== d.expectedVersion)
        throw new HttpsError(
          "aborted",
          "Kiện đã thay đổi. Tải lại để tiếp tục.",
        );
      const ids = [...new Set(parcel.allocations.map((a) => a.orderId))];
      if (ids.length > 10) throw Error("TOO_MANY_ORDERS");
      const snapshots = await Promise.all(
        ids.map((id) => tx.get(db.doc(`orders/${id}`))),
      );
      const orders = snapshots.map((s) => s.data() as Order);
      if (orders.some((o, i) => !o || o.version !== d.orderVersions[ids[i]]))
        throw new HttpsError(
          "aborted",
          "Đơn đã thay đổi. Tải lại để tiếp tục.",
        );
      // Order-level allocation records serialize competing parcel creation.
      requireLivePurchaseRecord(parcel);
      orders.forEach(requireLivePurchaseRecord);
      if (new Set(orders.map((o) => o.market)).size !== 1)
        throw Error("INCOMPATIBLE_ORIGINS");
      const allocationRecords = await Promise.all(
        ids.map((id) => tx.get(db.doc(`packageAllocations/${id}`))),
      );
      if (d.action === "packParcel") {
        if (orders.some((o) => o.consolidatedFreight))
          throw Error("SEALED_BATCH");
        const existing = allocationRecords.flatMap(
          (s) => s.data()?.allocations ?? [],
        );
        verifyAllocations(orders, existing, parcel.allocations);
        for (let i = 0; i < ids.length; i++)
          tx.set(allocationRecords[i].ref, {
            allocations: [
              ...(allocationRecords[i].data()?.allocations ?? []),
              ...parcel.allocations.filter((a) => a.orderId === ids[i]),
            ],
            parcelIds: [...(allocationRecords[i].data()?.parcelIds ?? []), id],
          });
        tx.create(db.doc(`packageEvidence/${id}`), {
          ...(d.payload as Record<string, unknown>),
          createdAt: Date.now(),
          createdBy: uid,
        });
      } else if (d.action === "dispatchParcel") {
        if (parcel.batchId) throw Error("USE_BATCH_DISPATCH");
        verifyParcelDispatch(parcel, orders);
        const p = z
          .object({
            carrier: z.string().min(2).max(100),
            tracking: z.string().min(3).max(100),
            handoffEvidence: z.string().min(5).max(1000),
          })
          .strict()
          .parse(d.payload);
        parcel = {
          ...parcel,
          carrier: p.carrier,
          tracking: p.tracking,
          state: "in_transit",
          version: parcel.version + 1,
        };
        tx.create(db.collection("packageHandoffs").doc(), {
          parcelId: id,
          ...p,
          actor: uid,
          createdAt: Date.now(),
        });
        for (let i = 0; i < orders.length; i++) {
          orders[i].stage = "IN_TRANSIT";
          orders[i].version++;
          tx.set(snapshots[i].ref, orders[i]);
        }
      } else if (d.action === "setDeliveryEstimate") {
        if (!["in_transit", "failed"].includes(parcel.state))
          throw Error("INVALID_STATE");
        const p = z
          .object({
            estimate: deliveryWindowSchema.nullable(),
            evidence: z.string().trim().min(5).max(1000),
          })
          .strict()
          .parse(d.payload);
        const now = Date.now();
        if (p.estimate && p.estimate.endAt < now)
          throw Error("ESTIMATE_ELAPSED");
        parcel = { ...parcel, version: parcel.version + 1 };
        if (p.estimate)
          parcel.deliveryEstimate = {
            ...p.estimate,
            source: "staff",
            recordedAt: now,
          };
        else delete parcel.deliveryEstimate;
        tx.create(ref.collection("events").doc(), {
          action: d.action,
          estimate: parcel.deliveryEstimate ?? null,
          evidence: p.evidence,
          source: "manual",
          createdAt: now,
          actor: uid,
        });
      } else {
        const p = z
          .object({
            state: z.enum(["in_transit", "delivered", "failed", "returned"]),
            event: z.string().min(3).max(500),
          })
          .strict()
          .parse(d.payload);
        if (!["in_transit", "failed"].includes(parcel.state))
          throw Error("INVALID_STATE");
        const allIds = [
          ...new Set(
            allocationRecords.flatMap((s) => s.data()?.parcelIds ?? []),
          ),
        ] as string[];
        if (allIds.length > 60) throw Error("PARCEL_LIMIT");
        const all = await Promise.all(
          allIds.map((id) => tx.get(db.doc(`packages/${id}`))),
        );
        parcel = { ...parcel, state: p.state, version: parcel.version + 1 };
        for (let i = 0; i < orders.length; i++)
          if (
            fullyDelivered(
              orders[i],
              all.map((s) => (s.id === id ? parcel : (s.data() as Parcel))),
            )
          ) {
            orders[i].stage = "DELIVERED";
            orders[i].version++;
            tx.set(snapshots[i].ref, orders[i]);
          }
        tx.create(ref.collection("events").doc(), {
          ...p,
          createdAt: Date.now(),
          source: "manual",
          actor: uid,
        });
      }
      tx.set(ref, parcel);
      const publicEstimate = readManualDeliveryEstimate(
        parcel.deliveryEstimate,
        Date.now(),
      );
      // Each projection contains only this customer's allocations, never a manifest.
      for (const ownerId of new Set(orders.map((o) => o.ownerId)))
        tx.set(db.doc(`customerShipments/${ownerId}-${id}`), {
          id: parcel.id,
          version: parcel.version,
          state: parcel.state,
          updatedAt: Date.now(),
          route: parcel.route,
          warehouse: parcel.warehouse,
          ...(publicEstimate ? { deliveryEstimate: publicEstimate } : {}),
          ...(parcel.carrier ? { carrier: parcel.carrier } : {}),
          ...(parcel.tracking ? { tracking: parcel.tracking } : {}),
          ownerId,
          allocations: parcel.allocations.filter(
            (a) => orders.find((o) => o.id === a.orderId)?.ownerId === ownerId,
          ),
        });
      tx.create(db.collection("auditEvents").doc(), {
        actor: uid,
        action: d.action,
        resourceId: id,
        createdAt: Date.now(),
      });
      const result = { id, version: parcel.version };
      // One event per owner+parcel revision; ETA policy remains disabled.
      if (d.action !== "setDeliveryEstimate")
        for (const ownerId of new Set(orders.map(o => o.ownerId))) {
          const order = orders.find(o => o.ownerId === ownerId)!;
          tx.create(db.doc(`outboxJobs/parcel-${id}-${parcel.version}-${ownerId}`), {
            ownerId, orderId: order.id, resourceId: id, action: d.action,
            state: "queued", createdAt: Date.now(),
            ...customerEventFields(() => {
              const event = parcelCustomerEvent(parcel, orders, ownerId, d.action, Date.now());
              if (!event) throw Error("NO_CUSTOMER_EVENT");
              return event;
            }),
          });
        }
      tx.create(op, { hash, result, createdAt: Date.now() });
      return result;
    });
  } catch (e) {
    if (e instanceof HttpsError) throw e;
    throw new HttpsError(
      "failed-precondition",
      "Vui lòng kiểm tra số lượng, đóng gói, số dư và trạng thái kiện.",
    );
  }
});

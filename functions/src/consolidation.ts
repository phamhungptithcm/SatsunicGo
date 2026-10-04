import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { randomUUID, createHash } from "node:crypto";
import { z } from "zod";
import { money, type Order } from "../../packages/domain";
import {
  freightShares,
  verifyBatchDispatch,
  type Batch,
} from "../../packages/domain/consolidation";
import { type Parcel } from "../../packages/domain/shipping";
export const consolidationCommand = onCall(
  {
    region: "asia-southeast1",
    maxInstances: 2,
    concurrency: 8,
    enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
  },
  async (req) => {
    if (!req.auth?.uid)
      throw new HttpsError("unauthenticated", "Đăng nhập để tiếp tục.");
    const d = z
      .object({
        action: z.enum(["seal", "dispatch"]),
        operationId: z.string().uuid(),
        batchId: z
          .string()
          .regex(/^[a-zA-Z0-9-]{1,80}$/)
          .optional(),
        expectedVersion: z.number().int().positive().optional(),
        orderVersions: z.record(z.string(), z.number().int().positive()),
        parcelVersions: z.record(z.string(), z.number().int().positive()),
        payload: z.unknown(),
      })
      .strict()
      .safeParse(req.data);
    if (!d.success)
      throw new HttpsError(
        "invalid-argument",
        "Thông tin lô gom không hợp lệ.",
      );
    const input = d.data,
      db = getFirestore(),
      uid = req.auth.uid,
      id = input.batchId ?? randomUUID(),
      ref = db.doc(`consolidationBatches/${id}`),
      op = db.doc(`idempotencyKeys/${uid}-${input.operationId}`),
      hash = createHash("sha256").update(JSON.stringify(input)).digest("hex"),
      now = Date.now();
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
          !a?.active ||
          a.locked ||
          user.data()?.locked ||
          !a.roles?.some((r: string) =>
            ["OWNER", "WAREHOUSE", "OPERATIONS_MANAGER"].includes(r),
          )
        )
          throw new HttpsError(
            "permission-denied",
            "Cần quyền quản lý lô gom.",
          );
        if (previous.exists) {
          if (previous.data()?.hash !== hash)
            throw new HttpsError("already-exists", "Mã thao tác đã sử dụng.");
          return previous.data()?.result;
        }
        let batch = snapshot.data() as Batch;
        let sealPayload;
        let dispatchPayload;
        if (input.action === "seal") {
          sealPayload = z
            .object({
              parcelIds: z
                .array(z.string().regex(/^[a-zA-Z0-9-]{1,80}$/))
                .min(1)
                .max(20),
              orderWeights: z.record(
                z.string(),
                z.number().int().positive().max(1000000),
              ),
              freight: money,
              hub: z.string().min(2).max(100),
              service: z.string().min(2).max(100),
              cutoff: z.number().int().positive(),
            })
            .strict()
            .parse(input.payload);
          if (
            snapshot.exists ||
            new Set(sealPayload.parcelIds).size !==
              sealPayload.parcelIds.length ||
            sealPayload.cutoff <= now
          )
            throw Error("INVALID_BATCH");
        } else {
          dispatchPayload = z
            .object({
              carrier: z.string().min(2).max(100),
              tracking: z.string().min(3).max(100),
              handoffEvidence: z.string().min(5).max(1000),
            })
            .strict()
            .parse(input.payload);
          if (!snapshot.exists || batch.version !== input.expectedVersion)
            throw Error("STALE_BATCH");
        }
        const parcelIds = sealPayload?.parcelIds ?? batch.parcelIds,
          parcelSnapshots = await Promise.all(
            parcelIds.map((id) => tx.get(db.doc(`packages/${id}`))),
          ),
          parcels = parcelSnapshots.map((s) => s.data() as Parcel);
        if (
          parcels.some(
            (p, i) => !p || p.version !== input.parcelVersions[parcelIds[i]],
          )
        )
          throw Error("STALE_PARCEL");
        const orderIds = [
          ...new Set(
            parcels.flatMap((p) => p.allocations.map((a) => a.orderId)),
          ),
        ];
        if (orderIds.length > 10) throw Error("TOO_MANY_ORDERS");
        const orderSnapshots = await Promise.all(
            orderIds.map((id) => tx.get(db.doc(`orders/${id}`))),
          ),
          orders = orderSnapshots.map((s) => s.data() as Order);
        if (
          orders.some(
            (o, i) => !o || o.version !== input.orderVersions[orderIds[i]],
          )
        )
          throw Error("STALE_ORDER");
        if (sealPayload) {
          const allocationRecords = await Promise.all(
            orderIds.map((orderId) =>
              tx.get(db.doc(`packageAllocations/${orderId}`)),
            ),
          );
          for (let i = 0; i < orders.length; i++) {
            const record = allocationRecords[i].data();
            if (
              !record ||
              record.parcelIds.some(
                (parcelId: string) => !parcelIds.includes(parcelId),
              ) ||
              !["PACKED", "READY_TO_SHIP"].includes(orders[i].stage) ||
              orders[i].items.some(
                (item, line) =>
                  record.allocations
                    .filter((a: { line: number }) => a.line === line)
                    .reduce(
                      (sum: number, a: { quantity: number }) =>
                        sum + a.quantity,
                      0,
                    ) !== item.quantity,
              )
            )
              throw Error("INCOMPLETE_BATCH_ALLOCATION");
          }
          if (
            parcels.some((p) => p.batchId) ||
            orders.some((o) => o.consolidatedFreight)
          )
            throw Error("ALREADY_ALLOCATED");
          const shares = freightShares(
            sealPayload.freight,
            sealPayload.orderWeights,
            orders,
            parcels,
          );
          batch = {
            id,
            version: 1,
            state: "sealed",
            parcelIds,
            orderIds,
            freight: sealPayload.freight,
            shares,
            warehouse: parcels[0].warehouse,
            route: parcels[0].route,
            hub: sealPayload.hub,
            service: sealPayload.service,
            cutoff: sealPayload.cutoff,
          };
          for (let i = 0; i < orders.length; i++) {
            const o = orders[i];
            o.consolidatedFreight = {
              batchId: id,
              version: 1,
              amount: shares[o.id],
            };
            o.finalApproved = false;
            delete o.finalFreightVersion;
            if (o.stage === "READY_TO_SHIP") o.stage = "PACKED";
            o.version++;
            tx.set(orderSnapshots[i].ref, o);
          }
          for (let i = 0; i < parcels.length; i++)
            tx.update(parcelSnapshots[i].ref, {
              batchId: id,
              version: parcels[i].version + 1,
            });
        } else if (dispatchPayload) {
          verifyBatchDispatch(batch, parcels, orders, now);
          for (let i = 0; i < orders.length; i++) {
            orders[i].stage = "IN_TRANSIT";
            orders[i].version++;
            tx.set(orderSnapshots[i].ref, orders[i]);
          }
          for (let i = 0; i < parcels.length; i++) {
            const parcel = {
              ...parcels[i],
              state: "in_transit" as const,
              carrier: dispatchPayload.carrier,
              tracking: dispatchPayload.tracking,
              version: parcels[i].version + 1,
            };
            tx.set(parcelSnapshots[i].ref, parcel);
            for (const ownerId of new Set(
              orders
                .filter((o) =>
                  parcel.allocations.some((a) => a.orderId === o.id),
                )
                .map((o) => o.ownerId),
            ))
              tx.set(db.doc(`customerShipments/${ownerId}-${parcel.id}`), {
                id: parcel.id,
                version: parcel.version,
                state: parcel.state,
                route: parcel.route,
                carrier: parcel.carrier,
                tracking: parcel.tracking,
                ownerId,
                allocations: parcel.allocations.filter(
                  (a) =>
                    orders.find((o) => o.id === a.orderId)?.ownerId === ownerId,
                ),
              });
          }
          batch.state = "dispatched";
          batch.version++;
          tx.create(db.collection("batchHandoffs").doc(), {
            batchId: id,
            ...dispatchPayload,
            createdAt: now,
            actor: uid,
          });
        }
        tx.set(ref, batch);
        tx.create(db.collection("auditEvents").doc(), {
          actor: uid,
          action: `batch-${input.action}`,
          resourceId: id,
          createdAt: now,
        });
        const result = { id, version: batch.version };
        tx.create(op, { hash, result, createdAt: now });
        return result;
      });
    } catch (e) {
      if (e instanceof HttpsError) throw e;
      throw new HttpsError(
        "failed-precondition",
        "Lô chưa hợp lệ. Kiểm tra tuyến/kho, cước đã phân bổ, xác nhận tổng cuối, tiền, hold và cutoff của từng thành viên.",
      );
    }
  },
);

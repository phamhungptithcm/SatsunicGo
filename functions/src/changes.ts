import { isStringRoleArray, requireVerifiedGoogle } from "./auth/guards";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { randomUUID, createHash } from "node:crypto";
import { z } from "zod";
import { type Order } from "../../packages/domain";
import {
  proposalSchema,
  checkProposal,
  type ChangeProposal,
} from "../../packages/domain/changes";
export const changeCommand = onCall(
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
        action: z.enum(["propose", "accept", "reject", "apply"]),
        operationId: z.string().uuid(),
        orderId: z.string().regex(/^[a-zA-Z0-9-]{1,80}$/),
        expectedVersion: z.number().int().positive(),
        proposalId: z
          .string()
          .regex(/^[a-zA-Z0-9-]{1,80}$/)
          .optional(),
        payload: z.unknown().optional(),
      })
      .strict()
      .safeParse(req.data);
    if (!parsed.success)
      throw new HttpsError(
        "invalid-argument",
        "Thông tin thay đổi không hợp lệ.",
      );
    const d = parsed.data,
      db = getFirestore(),
      uid = req.auth.uid,
      id = d.proposalId ?? randomUUID(),
      orderRef = db.doc(`orders/${d.orderId}`),
      proposalRef = db.doc(`orderChanges/${id}`),
      op = db.doc(`idempotencyKeys/${uid}-${d.operationId}`),
      hash = createHash("sha256").update(JSON.stringify(d)).digest("hex"),
      now = Date.now();
    try {
      return await db.runTransaction(async (tx) => {
        const [s, a, u, previous, ps, allocation, proof] = await Promise.all([
          tx.get(orderRef),
          tx.get(db.doc(`staffAccess/${uid}`)),
          tx.get(db.doc(`users/${uid}`)),
          tx.get(op),
          tx.get(proposalRef),
          tx.get(db.doc(`packageAllocations/${d.orderId}`)),
          tx.get(db.doc(`orderChangeEvidence/${id}`)),
        ]);
        const order = s.data() as Order;
        if (!s.exists || u.data()?.locked || a.data()?.locked)
          throw new HttpsError("permission-denied", "Không thể xử lý đơn.");
        if (["accept", "reject"].includes(d.action)) {
          if (order.ownerId !== uid)
            throw new HttpsError(
              "permission-denied",
              "Chỉ chủ đơn duyệt thay đổi.",
            );
        } else if (
          a.data()?.active !== true ||
          !isStringRoleArray(a.data()?.roles) ||
          !a
            .data()
            ?.roles?.some((r: string) =>
              ["OWNER", "OPERATIONS_MANAGER"].includes(r),
            )
        )
          throw new HttpsError(
            "permission-denied",
            "Cần quyền quản lý vận hành.",
          );
        if (previous.exists) {
          if (previous.data()?.hash !== hash)
            throw new HttpsError("already-exists", "Mã thao tác đã dùng.");
          return previous.data()?.result;
        }
        if (order.version !== d.expectedVersion)
          throw new HttpsError(
            "aborted",
            "Đơn đã thay đổi. Tải lại để tiếp tục.",
          );
        if (d.action === "propose") {
          if (ps.exists || order.hold?.startsWith("Chờ duyệt thay đổi"))
            throw Error("PROPOSAL_PENDING");
          const p = proposalSchema.parse(d.payload);
          checkProposal(order, p);
          if (allocation.exists && p.kind !== "return")
            throw Error("PARCEL_ALREADY_ALLOCATED");
          const { evidence, ...publicProposal } = p;
          tx.create(db.doc(`orderChangeEvidence/${id}`), {
            evidence,
            orderId: order.id,
            createdAt: now,
            createdBy: uid,
          });
          tx.create(proposalRef, {
            orderId: order.id,
            ownerId: order.ownerId,
            proposal: publicProposal,
            previousHold: order.hold ?? "",
            state: "pending",
            version: 1,
            createdAt: now,
            createdBy: uid,
          });
          order.hold = `Chờ duyệt thay đổi ${id}`;
        } else {
          if (!ps.exists || ps.data()?.orderId !== order.id)
            throw Error("INVALID_PROPOSAL");
          if (order.hold !== `Chờ duyệt thay đổi ${id}`)
            throw Error("HOLD_CHANGED");
          const p = {
            ...ps.data()?.proposal,
            evidence: proof.data()?.evidence,
          } as ChangeProposal;
          if (d.action === "accept" || d.action === "reject") {
            if (ps.data()?.state !== "pending") throw Error("ALREADY_REVIEWED");
            tx.update(proposalRef, {
              state: d.action === "accept" ? "accepted" : "rejected",
              reviewedAt: now,
              reviewedBy: uid,
            });
            if (d.action === "reject")
              order.hold = ps.data()?.previousHold ?? "";
          } else {
            if (ps.data()?.state !== "accepted")
              throw Error("CUSTOMER_APPROVAL_REQUIRED");
            checkProposal(order, p);
            if (allocation.exists && p.kind !== "return")
              throw Error("PARCEL_ALREADY_ALLOCATED");
            if (p.kind === "return") {
              tx.create(db.doc(`orderReturns/${id}`), {
                orderId: order.id,
                ownerId: order.ownerId,
                proposalId: id,
                lines: p.lines
                  .filter((line) => line.cancelQuantity > 0)
                  .map((line) => ({
                    line: line.line,
                    name: order.items[line.line].name,
                    authorized: line.cancelQuantity,
                    received: 0,
                    accepted: 0,
                    damaged: 0,
                  })),
                state: "authorized",
                version: 1,
                createdAt: now,
              });
            }
            if (p.kind !== "return") {
              const canceled = p.lines.reduce(
                  (sum, l) => sum + l.cancelQuantity,
                  0,
                ),
                count = order.items.reduce((sum, i) => sum + i.quantity, 0);
              if (canceled === count) {
                order.stage = "CANCELLED";
              } else {
                for (const l of p.lines) {
                  order.items[l.line] = {
                    ...order.items[l.line],
                    quantity: order.items[l.line].quantity - l.cancelQuantity,
                    ...(l.replacementName ? { name: l.replacementName } : {}),
                    ...(l.replacementVariant !== undefined
                      ? { variant: l.replacementVariant }
                      : {}),
                  };
                }
                order.packingComplete = false;
                if (
                  [
                    "PURCHASING",
                    "PURCHASED",
                    "ORIGIN_RECEIVED",
                    "PACKED",
                  ].includes(order.stage) &&
                  order.purchasedQuantity ===
                    order.items.reduce((sum, i) => sum + i.quantity, 0) &&
                  order.receivedQuantity === order.purchasedQuantity
                )
                  order.stage = "ORIGIN_RECEIVED";
                if (
                  order.stage === "PURCHASING" &&
                  order.purchasedQuantity ===
                    order.items.reduce((sum, i) => sum + i.quantity, 0)
                )
                  order.stage = "PURCHASED";
                delete order.packedQuantity;
              }
            }
            // Accepted deposit is an immutable obligation snapshot, including
            // after a lower final payable. Refunds/credits are separate events.
            order.finalTotal = p.finalPayable;
            order.finalApproved = true;
            order.hold =
              p.kind === "return"
                ? "Chờ kiểm tra hàng trả về và đối soát"
                : p.resolveHold
                  ? ""
                  : (ps.data()?.previousHold ?? "");
            tx.update(proposalRef, {
              state: "applied",
              appliedAt: now,
              appliedBy: uid,
            });
            tx.create(db.collection("financialAdjustments").doc(), {
              orderId: order.id,
              proposalId: id,
              finalPayable: p.finalPayable,
              actualCosts: p.actualCosts,
              createdAt: now,
              actor: uid,
            });
          }
        }
        order.version++;
        tx.set(orderRef, order);
        tx.create(orderRef.collection("timeline").doc(), {
          action: `change-${d.action}`,
          createdAt: now,
        });
        tx.create(db.collection("auditEvents").doc(), {
          actor: uid,
          action: `change-${d.action}`,
          resourceId: order.id,
          proposalId: id,
          createdAt: now,
        });
        const result = { id, version: order.version };
        tx.create(db.collection("outboxJobs").doc(), {
          ownerId: order.ownerId,
          orderId: order.id,
          action: `change-${d.action}`,
          state: "queued",
          createdAt: now,
        });
        tx.create(op, { hash, result, createdAt: now });
        return result;
      });
    } catch (e) {
      if (e instanceof HttpsError) throw e;
      throw new HttpsError(
        "failed-precondition",
        "Thay đổi chưa hợp lệ. Kiểm tra phần hàng đã xử lý, điều khoản, chi phí thật và xác nhận của khách.",
      );
    }
  },
);

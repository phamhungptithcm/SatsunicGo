import { withPurchaseMutation } from "./purchase-mutation-queue";
import { createHash } from "node:crypto";
import { getFirestore } from "firebase-admin/firestore";
import {
  onCall,
  HttpsError,
  type CallableRequest,
} from "firebase-functions/v2/https";
import { z } from "zod";
import {
  evolve,
  requireRole,
  type Order,
  type Role,
} from "../../packages/domain";
import {
  assertDemoRecord,
  demoAuth,
  demoExecution,
  demoOwner,
  demoSession,
} from "./production-demo-policy";

const input = z
  .object({
    runId: z.string().uuid(),
    operationId: z.string().uuid(),
    orderId: z.string().uuid(),
    expectedVersion: z.number().int().positive(),
    action: z.enum([
      "claimPurchase",
      "recordPurchase",
      "receive",
      "pack",
      "dispatch",
      "track",
      "confirmReceipt",
    ]),
    payload: z.unknown(),
  })
  .strict();
export async function handleProductionDemoCommand(req: CallableRequest) {
  const uid = demoAuth(req),
    parsed = input.safeParse(req.data),
    db = getFirestore();
  if (!parsed.success)
    throw new HttpsError("invalid-argument", "Kiểm tra lại bước demo.");
  const d = parsed.data,
    hash = createHash("sha256").update(JSON.stringify(d)).digest("hex");
  try {
    return await withPurchaseMutation(
      `production-demo-order-${d.orderId}`,
      () =>
        db.runTransaction(async (tx) => {
          await demoOwner(tx, uid);
          const session = await demoSession(tx, d.runId, uid);
          const ref = db.doc(`orders/${d.orderId}`),
            op = db.doc(`productionDemoOperations/${d.runId}-${d.operationId}`);
          const [stored, previous] = await tx.getAll(ref, op),
            order = stored.data();
          assertDemoRecord(
            order && { ...order, provider: order.paymentProvider },
            session,
          );
          if (!session.checkoutIds.includes(order!.checkoutId))
            throw new HttpsError(
              "permission-denied",
              "Không mở được đơn demo.",
            );
          if (previous.exists) {
            if (previous.data()!.hash !== hash)
              throw new HttpsError(
                "already-exists",
                "Mã thao tác đã được dùng.",
              );
            return previous.data()!.result;
          }
          if (order!.version !== d.expectedVersion)
            throw new HttpsError(
              "aborted",
              "Đơn demo đã thay đổi. Tải lại trước khi tiếp tục.",
            );
          // The production owner performs both customer and staff roles in this isolated run.
          if (d.action !== "confirmReceipt")
            requireRole(d.action, ["OWNER"] as Role[]);
          const next = evolve(order as Order, d.action, d.payload, Date.now());
          const result = {
            id: ref.id,
            stage: next.stage,
            version: next.version,
          };
          tx.set(ref, {
            ...next,
            ...demoExecution(session),
            paymentProvider: "production_demo",
          });
          tx.create(ref.collection("timeline").doc(d.operationId), {
            ...demoExecution(session),
            action: d.action,
            simulation: true,
            createdAt: Date.now(),
          });
          tx.create(
            db.doc(`productionDemoOperations/${d.runId}-${d.operationId}`),
            { hash, result, ...demoExecution(session) },
          );
          tx.create(db.doc(`auditEvents/production-demo-${d.operationId}`), {
            ...demoExecution(session),
            action: "productionDemoTransition",
            transition: d.action,
            actor: uid,
            resourceId: ref.id,
            createdAt: Date.now(),
          });
          // Operational evidence is test-only. No stock, supplier payment, real parcel or carrier write.
          tx.set(db.doc(`productionDemoFulfillment/${ref.id}`), {
            ...demoExecution(session),
            ownerId: uid,
            orderId: ref.id,
            stage: next.stage,
            version: next.version,
            simulation: true,
            updatedAt: Date.now(),
          });
          return result;
        }),
    );
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError(
      "failed-precondition",
      "Bước demo chưa hợp lệ. Kiểm tra trạng thái, số lượng và thông tin trước khi tiếp tục.",
    );
  }
}
export const productionDemoCommand = onCall(
  {
    region: "asia-southeast1",
    maxInstances: 2,
    concurrency: 4,
    enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
  },
  handleProductionDemoCommand,
);

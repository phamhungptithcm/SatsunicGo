import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { requireVerifiedGoogle } from "../auth/guards";
import {
  customerSavePointerSchema,
  customerSaveResultSchema,
} from "../../../packages/domain/customer-save";
/** Resolve a customer save without retaining PII in browser storage.
 * Missing results are fenced atomically against a still-running workspace save.
 */
export const customerSaveResolve = onCall(
  {
    region: "asia-southeast1",
    maxInstances: 2,
    concurrency: 4,
    enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
  },
  async (req) => {
    const uid = requireVerifiedGoogle(req.auth),
      parsed = customerSavePointerSchema.safeParse(req.data);
    if (!parsed.success)
      throw new HttpsError(
        "invalid-argument",
        "Thông tin đối chiếu chưa hợp lệ.",
      );
    const pointer = parsed.data,
      db = getFirestore(),
      now = Date.now();
    const op = db.doc(`idempotencyKeys/${uid}-${pointer.operationId}`),
      fence = db.doc(`customerSaveFences/${uid}-${pointer.operationId}`);
    // Charge admission independently so invalid lookups cannot evade the limit.
    await db.runTransaction(async (tx) => {
      const quota = db.doc(
        `customerSaveQuota/${uid}-${Math.floor(now / 60000)}`,
      );
      const [user, staff, usage] = await Promise.all([
        tx.get(db.doc(`users/${uid}`)),
        tx.get(db.doc(`staffAccess/${uid}`)),
        tx.get(quota),
      ]);
      if (user.data()?.locked || staff.data()?.locked)
        throw new HttpsError(
          "permission-denied",
          "Không thể đối chiếu với tài khoản này.",
        );
      const count = usage.data()?.count ?? 0;
      if (!Number.isSafeInteger(count) || count < 0 || count >= 8)
        throw new HttpsError(
          "resource-exhausted",
          "Anh/chị thử lại sau một chút nhé.",
        );
      tx.set(quota, { count: count + 1, expiresAt: new Date(now + 120000) });
    });
    return db.runTransaction(async (tx) => {
      const [user, staff, operation, closed] = await Promise.all([
        tx.get(db.doc(`users/${uid}`)),
        tx.get(db.doc(`staffAccess/${uid}`)),
        tx.get(op),
        tx.get(fence),
      ]);
      if (user.data()?.locked || staff.data()?.locked)
        throw new HttpsError(
          "permission-denied",
          "Không thể đối chiếu với tài khoản này.",
        );
      if (
        closed.exists &&
        (closed.data()?.commandHash !== pointer.commandHash ||
          closed.data()?.action !== pointer.action)
      )
        throw new HttpsError(
          "already-exists",
          "Thông tin lần lưu đã thay đổi.",
        );
      if (operation.exists) {
        if (closed.exists || operation.data()?.hash !== pointer.commandHash)
          throw new HttpsError(
            "failed-precondition",
            "Chưa đối chiếu được lần lưu này.",
          );
        const parsedResult = customerSaveResultSchema.safeParse(
          operation.data()?.result,
        );
        if (
          !parsedResult.success ||
          parsedResult.data.version !== pointer.expectedVersion + 1
        )
          throw new HttpsError(
            "failed-precondition",
            "Chưa đối chiếu được kết quả lưu.",
          );
        const result = parsedResult.data;
        if (pointer.action === "saveProfile" && result.id !== uid)
          throw new HttpsError(
            "permission-denied",
            "Không thể đối chiếu lần lưu này.",
          );
        if (
          pointer.action === "saveAddress" &&
          !/^[A-Za-z0-9-]{1,128}$/.test(result.id)
        )
          throw new HttpsError(
            "failed-precondition",
            "Kết quả lưu chưa hợp lệ.",
          );
        const resource =
          pointer.action === "saveProfile"
            ? user
            : await tx.get(db.doc(`addresses/${result.id}`));
        if (
          !resource.exists ||
          resource.data()?.ownerId !== uid ||
          !Number.isSafeInteger(resource.data()?.version) ||
          resource.data()!.version < result.version
        )
          throw new HttpsError(
            "failed-precondition",
            "Chưa xác minh được thông tin đã lưu.",
          );
        return { status: "saved" as const, result };
      }
      if (!closed.exists) {
        tx.create(fence, {
          commandHash: pointer.commandHash,
          action: pointer.action,
          createdAt: now,
        });
        tx.create(db.collection("auditEvents").doc(), {
          actor: uid,
          action: "resolveCustomerSave",
          resourceId: pointer.operationId,
          status: "not-saved",
          createdAt: now,
        });
      }
      return { status: "not-saved" as const };
    });
  },
);

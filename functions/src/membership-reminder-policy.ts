import { createHash } from "node:crypto";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import {
  isStringRoleArray,
  recentMfa,
  requireVerifiedGoogle,
} from "./auth/guards";
export const membershipReminderInput = z.discriminatedUnion("action", [
  z.object({ action: z.literal("read") }).strict(),
  z
    .object({
      action: z.literal("save"),
      operationId: z.string().uuid(),
      expectedVersion: z
        .number()
        .int()
        .nonnegative()
        .max(Number.MAX_SAFE_INTEGER - 1),
      approved: z.boolean(),
      daysBeforeExpiry: z.number().int().min(1).max(30).optional(),
    })
    .strict()
    .refine((p) => !p.approved || p.daysBeforeExpiry !== undefined, {
      message: "Chọn số ngày trước khi bật nhắc hết hạn.",
    }),
]);
export const membershipReminderPolicy = onCall(
  {
    region: "asia-southeast1",
    maxInstances: 2,
    concurrency: 8,
    enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
  },
  async (req) => {
    const uid = requireVerifiedGoogle(req.auth);
    const input = membershipReminderInput.safeParse(req.data);
    if (!input.success)
      throw new HttpsError(
        "invalid-argument",
        "Chọn số ngày từ 1 đến 30 và tải lại cấu hình khi cần.",
      );
    const p = input.data,
      db = getFirestore(),
      now = Date.now();
    return db.runTransaction(async (tx) => {
      const [user, access, policy] = await Promise.all([
        tx.get(db.doc(`users/${uid}`)),
        tx.get(db.doc(`staffAccess/${uid}`)),
        tx.get(db.doc("settings/membershipReminders")),
      ]);
      if (
        !user.exists ||
        user.data()?.locked ||
        access.data()?.locked ||
        access.data()?.active !== true ||
        !isStringRoleArray(access.data()?.roles) ||
        !access.data()?.roles.includes("OWNER")
      )
        throw new HttpsError(
          "permission-denied",
          "Cần quyền chủ doanh nghiệp hiện hành để cấu hình nhắc hết hạn.",
        );
      const version = policy.data()?.version ?? 0;
      if (!Number.isSafeInteger(version) || version < 0)
        throw new HttpsError(
          "failed-precondition",
          "Phiên bản cấu hình cần được kiểm tra trước khi lưu.",
        );
      const snapshot = {
        version,
        approved: policy.data()?.approved === true,
        daysBeforeExpiry:
          Number.isInteger(policy.data()?.daysBeforeExpiry) &&
          policy.data()!.daysBeforeExpiry >= 1 &&
          policy.data()!.daysBeforeExpiry <= 30
            ? (policy.data()!.daysBeforeExpiry as number)
            : null,
      };
      if (p.action === "read") return snapshot;
      if (
        process.env.FUNCTIONS_EMULATOR !== "true" &&
        !recentMfa(req.auth!.token, now)
      )
        throw new HttpsError(
          "failed-precondition",
          "Xác thực hai lớp gần đây để lưu cấu hình.",
          { reason: "RECENT_MFA_REQUIRED" },
        );
      const op = db.doc(`idempotencyKeys/${uid}-${p.operationId}`),
        previous = await tx.get(op);
      const hash = createHash("sha256")
        .update(JSON.stringify({ kind: "membershipReminderPolicy", ...p }))
        .digest("hex");
      if (previous.exists) {
        if (previous.data()?.hash !== hash)
          throw new HttpsError(
            "already-exists",
            "Mã thao tác đã được dùng cho nội dung khác.",
          );
        return previous.data()?.result;
      }
      if (version !== p.expectedVersion)
        throw new HttpsError(
          "aborted",
          "Cấu hình đã thay đổi. Tải lại trước khi lưu.",
        );
      const result = {
        version: version + 1,
        approved: p.approved,
        daysBeforeExpiry: p.daysBeforeExpiry ?? null,
      };
      tx.set(policy.ref, {
        version: result.version,
        approved: p.approved,
        ...(p.daysBeforeExpiry === undefined
          ? {}
          : { daysBeforeExpiry: p.daysBeforeExpiry }),
        changedAt: now,
        changedBy: uid,
      });
      tx.create(op, { hash, result, createdAt: now });
      tx.create(db.collection("auditEvents").doc(), {
        actor: uid,
        action: "membershipReminderPolicy.save",
        resourceId: "membershipReminders",
        previousVersion: version,
        version: result.version,
        approved: p.approved,
        daysBeforeExpiry: result.daysBeforeExpiry,
        createdAt: now,
      });
      return result;
    });
  },
);

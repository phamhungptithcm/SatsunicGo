import { createHash } from "node:crypto";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import {
  isStringRoleArray,
  recentMfa,
  requireVerifiedGoogle,
} from "./auth/guards";
const schema = z
  .object({
    id: z.string().regex(/^[a-zA-Z0-9_-]{1,256}$/),
    action: z.enum(["retry", "resolveUnknown"]),
    expectedVersion: z.number().int().nonnegative(),
    operationId: z.string().uuid(),
    outcome: z.enum(["confirmed_sent", "confirmed_not_sent"]).optional(),
    evidence: z.string().trim().min(5).max(500).optional(),
  })
  .strict();
export const outboxCommand = onCall(
  {
    region: "asia-southeast1",
    maxInstances: 2,
    enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
  },
  async (req) => {
    const uid = requireVerifiedGoogle(req.auth),
      parsed = schema.safeParse(req.data);
    if (!parsed.success)
      throw new HttpsError(
        "invalid-argument",
        "Thông tin xử lý email chưa hợp lệ.",
      );
    const d = parsed.data,
      db = getFirestore(),
      now = Date.now(),
      op = db.doc(`idempotencyKeys/${uid}-${d.operationId}`),
      hash = createHash("sha256").update(JSON.stringify(d)).digest("hex");
    return db.runTransaction(async (tx) => {
      const ref = db.doc(`outboxJobs/${d.id}`),
        [user, access, job, prior, config] = await Promise.all([
          tx.get(db.doc(`users/${uid}`)),
          tx.get(db.doc(`staffAccess/${uid}`)),
          tx.get(ref),
          tx.get(op),
          tx.get(db.doc("settings/email")),
        ]);
      if (
        user.data()?.locked ||
        access.data()?.active !== true ||
        !isStringRoleArray(access.data()?.roles) ||
        access.data()?.locked ||
        !access
          .data()
          ?.roles?.some((r: string) =>
            ["OWNER", "OPERATIONS_MANAGER"].includes(r),
          )
      )
        throw new HttpsError(
          "permission-denied",
          "Cần quyền quản lý vận hành.",
        );
      if (
        process.env.FUNCTIONS_EMULATOR !== "true" &&
        !recentMfa(req.auth!.token, now)
      )
        throw new HttpsError(
          "permission-denied",
          "Xác thực hai bước trước khi xử lý email.",
          { reason: "RECENT_MFA_REQUIRED" },
        );
      if (prior.exists) {
        if (prior.data()?.hash !== hash)
          throw new HttpsError("already-exists", "Mã thao tác đã dùng.");
        return prior.data()?.result;
      }
      const j = job.data();
      if (!j || (j.version ?? 0) !== d.expectedVersion)
        throw new HttpsError("aborted", "Bản ghi đã thay đổi. Tải lại.");
      const owner = await tx.get(db.doc(`users/${j.ownerId}`));
      if (owner.data()?.locked)
        throw new HttpsError("failed-precondition", "Khách đang bị khóa.");
      let state: string;
      if (d.action === "resolveUnknown") {
        if (j.emailState !== "unknown" || !d.evidence || !d.outcome)
          throw new HttpsError(
            "failed-precondition",
            "Cần kết quả đối soát và bằng chứng cho email chưa rõ kết quả.",
          );
        state = d.outcome === "confirmed_sent" ? "sent" : "failed";
      } else {
        if (
          !["failed", "blocked_external"].includes(j.emailState) ||
          j.reconciliationRequired ||
          ((j.emailAttempts ?? 0) > 0 && j.emailState === "blocked_external") ||
          (j.emailAttempts ?? 0) >= 3
        )
          throw new HttpsError(
            "failed-precondition",
            "Email cần đối soát hoặc đã hết số lần thử. Không tự gửi lại.",
          );
        const c = config.data();
        if (
          c?.enabled !== true ||
          !c.host ||
          !c.user ||
          !c.from ||
          !/^[a-zA-Z0-9.-]+$/.test(c.messageIdDomain ?? "")
        )
          throw new HttpsError(
            "failed-precondition",
            "Cần cấu hình email trước khi thử lại.",
          );
        state = "queued";
      }
      const version = (j.version ?? 0) + 1;
      tx.update(ref, {
        emailState: state,
        reconciliationRequired: false,
        version,
        changedAt: now,
        ...(d.action === "resolveUnknown"
          ? {
              resolution: {
                outcome: d.outcome,
                evidence: d.evidence,
                actor: uid,
                at: now,
              },
            }
          : {}),
      });
      tx.create(db.collection("auditEvents").doc(), {
        actor: uid,
        action: `outbox:${d.action}`,
        resourceId: d.id,
        createdAt: now,
      });
      const result = { version };
      tx.create(op, { hash, result, createdAt: now });
      return result;
    });
  },
);

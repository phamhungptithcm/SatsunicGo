import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { createHash } from "node:crypto";
import { z } from "zod";
import { money } from "../../packages/domain";
import {
  isStringRoleArray,
  recentMfa,
  requireVerifiedGoogle,
} from "./auth/guards";
export const financeReview = onCall(
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
      .discriminatedUnion("action", [
        z
          .object({
            action: z.literal("reverse"),
            orderId: z.string().regex(/^[a-zA-Z0-9-]{1,80}$/),
            entryId: z.string().regex(/^[a-zA-Z0-9-]{1,160}$/),
            expectedVersion: z.number().int().positive(),
            amount: money.positive(),
            bankTransactionId: z.string().trim().min(4).max(120),
            evidence: z.string().trim().min(5).max(1000),
            reason: z.string().trim().min(5).max(500),
            operationId: z.string().uuid(),
          })
          .strict(),
        z
          .object({
            action: z.literal("closeException"),
            id: z.string().regex(/^[a-zA-Z0-9-]{1,160}$/),
            evidence: z.string().trim().min(5).max(1000),
            reason: z.string().trim().min(5).max(500),
            operationId: z.string().uuid(),
          })
          .strict(),
        z
          .object({
            action: z.literal("allocateException"),
            id: z.string().regex(/^[a-zA-Z0-9-]{1,160}$/),
            orderId: z.string().regex(/^[a-zA-Z0-9-]{1,80}$/),
            expectedVersion: z.number().int().positive(),
            evidence: z.string().trim().min(5).max(1000),
            reason: z.string().trim().min(5).max(500),
            operationId: z.string().uuid(),
          })
          .strict(),
      ])
      .safeParse(req.data);
    if (!parsed.success)
      throw new HttpsError(
        "invalid-argument",
        "Thông tin đối soát chưa hợp lệ.",
      );
    const d = parsed.data,
      uid = req.auth.uid,
      db = getFirestore(),
      now = Date.now(),
      hash = createHash("sha256").update(JSON.stringify(d)).digest("hex"),
      op = db.doc(`idempotencyKeys/${uid}-${d.operationId}`);
    return db.runTransaction(async (tx) => {
      const [staff, user, previous] = await Promise.all([
        tx.get(db.doc(`staffAccess/${uid}`)),
        tx.get(db.doc(`users/${uid}`)),
        tx.get(op),
      ]);
      if (
        staff.data()?.active !== true ||
        !isStringRoleArray(staff.data()?.roles) ||
        staff.data()?.locked ||
        user.data()?.locked ||
        !staff
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
      let resourceId: string;
      if (d.action === "closeException") {
        const ref = db.doc(`paymentExceptions/${d.id}`),
          exception = await tx.get(ref);
        if (exception.data()?.state !== "open")
          throw new HttpsError("failed-precondition", "Ngoại lệ không còn mở.");
        tx.update(ref, {
          state: "closed",
          reviewedBy: uid,
          reviewedAt: now,
          evidence: d.evidence,
          resolutionReason: d.reason,
        });
        resourceId = d.id;
      } else {
        const orderRef = db.doc(`orders/${d.orderId}`),
          order = await tx.get(orderRef),
          o = order.data();
        if (!o || o.version !== d.expectedVersion)
          throw new HttpsError(
            "aborted",
            "Đơn đã thay đổi. Tải lại để đối soát.",
          );
        if (d.action === "reverse") {
          const entryRef = db.doc(`financialEntries/${d.entryId}`),
            counterRef = db.doc(`financialReversals/${d.entryId}`),
            bankRef = db.doc(
              `bankTransactions/${createHash("sha256").update(d.bankTransactionId).digest("hex")}`,
            );
          const [entry, counter, bank] = await Promise.all([
            tx.get(entryRef),
            tx.get(counterRef),
            tx.get(bankRef),
          ]);
          if (bank.exists)
            throw new HttpsError(
              "already-exists",
              "Giao dịch đã được phân bổ.",
            );
          if (
            entry.data()?.kind !== "payment" ||
            entry.data()?.orderId !== d.orderId ||
            d.amount > entry.data()!.amount - (counter.data()?.amount ?? 0) ||
            d.amount > o.collected
          )
            throw new HttpsError(
              "failed-precondition",
              "Chỉ đảo phần tiền vào đã ghi nhận và chưa bị đảo.",
            );
          tx.set(counterRef, {
            amount: (counter.data()?.amount ?? 0) + d.amount,
          });
          tx.create(bankRef, {
            kind: "reversal",
            orderId: d.orderId,
            originalEntryId: d.entryId,
            amount: d.amount,
            evidence: d.evidence,
            actor: uid,
            createdAt: now,
          });
          tx.create(db.collection("financialEntries").doc(), {
            kind: "reversal",
            orderId: d.orderId,
            originalEntryId: d.entryId,
            amount: d.amount,
            currency: "VND",
            reason: d.reason,
            actor: uid,
            createdAt: now,
          });
          tx.update(orderRef, {
            collected: money.parse(o.collected - d.amount),
            version: o.version + 1,
            hold: o.hold || "Chờ đối soát tiền bị đảo",
            ...(o.stage === "READY_TO_SHIP" ? { stage: "PACKED" } : {}),
          });
        } else {
          const exceptionRef = db.doc(`paymentExceptions/${d.id}`),
            exception = await tx.get(exceptionRef),
            e = exception.data();
          if (
            e?.state !== "open" ||
            e.inboundVerified !== true ||
            !/^[a-f0-9]{64}$/.test(e.bankReferenceHash ?? "") ||
            !o.acceptedAt
          )
            throw new HttpsError(
              "failed-precondition",
              "Chưa xác minh tiền vào đúng tài khoản hoặc đơn chưa có chấp nhận báo giá.",
            );
          const amount = money.positive().parse(e.amount),
            bankRef = db.doc(`bankTransactions/${e.bankReferenceHash}`),
            bank = await tx.get(bankRef);
          if (bank.exists)
            throw new HttpsError(
              "already-exists",
              "Giao dịch đã được phân bổ; đóng ngoại lệ sau khi đối soát.",
            );
          tx.create(bankRef, {
            kind: "payment",
            provider: "payos",
            orderId: d.orderId,
            amount,
            exceptionId: d.id,
            evidence: d.evidence,
            actor: uid,
            createdAt: now,
          });
          tx.create(db.collection("financialEntries").doc(), {
            kind: "payment",
            orderId: d.orderId,
            amount,
            currency: "VND",
            exceptionId: d.id,
            actor: uid,
            createdAt: now,
          });
          tx.update(orderRef, {
            collected: money.parse(o.collected + amount),
            version: o.version + 1,
          });
          tx.update(exceptionRef, {
            state: "allocated",
            orderId: d.orderId,
            reviewedBy: uid,
            reviewedAt: now,
            evidence: d.evidence,
            resolutionReason: d.reason,
          });
        }
        tx.create(orderRef.collection("timeline").doc(), {
          action: d.action,
          createdAt: now,
        });
        tx.create(db.collection("outboxJobs").doc(), {
          ownerId: o.ownerId,
          orderId: d.orderId,
          action: d.action,
          state: "queued",
          createdAt: now,
        });
        resourceId = d.orderId;
      }
      tx.create(db.collection("auditEvents").doc(), {
        actor: uid,
        action: d.action,
        resourceId,
        createdAt: now,
      });
      const result = { id: resourceId };
      tx.create(op, { hash, result, createdAt: now });
      return result;
    });
  },
);

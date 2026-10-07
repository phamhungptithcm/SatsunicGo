import {
  isStringRoleArray,
  recentMfa,
  requireVerifiedGoogle,
} from "./auth/guards";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { money, type Role } from "../../packages/domain";
// A renewal extends only the same live plan; changing benefits mid-term needs
// a separately approved commercial migration policy.
export function membershipTerm(
  plan: Record<string, unknown>,
  planId: string,
  current: Record<string, unknown> | undefined,
  now: number,
) {
  const days = z.number().int().min(1).max(366).safeParse(plan.periodDays);
  if (!days.success)
    throw new HttpsError("failed-precondition", "Gói chưa có kỳ hạn hợp lệ.");
  const active = current?.state === "active" && Number(current.endsAt) > now;
  if (
    active &&
    (current?.planId
      ? current.planId !== planId
      : (current?.planSnapshot as Record<string, unknown> | undefined)?.name !==
        plan.name)
  )
    throw new HttpsError(
      "failed-precondition",
      "Gói hiện tại còn hiệu lực. Liên hệ hỗ trợ để đổi gói.",
    );
  const end = active ? Number(current?.endsAt) : now;
  const startsAt = active ? Number(current?.startsAt) : now;
  const endsAt = end + days.data * 86400000;
  if (
    !Number.isSafeInteger(end) ||
    !Number.isSafeInteger(startsAt) ||
    startsAt > end ||
    !Number.isSafeInteger(endsAt)
  )
    throw new HttpsError(
      "failed-precondition",
      "Kỳ hạn membership cần được kiểm tra.",
    );
  return { startsAt, endsAt };
}
export const membershipCommand = onCall(
  {
    region: "asia-southeast1",
    maxInstances: 3,
    concurrency: 10,
    enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
  },
  async (req) => {
    requireVerifiedGoogle(req.auth);
    if (!req.auth?.uid)
      throw new HttpsError("unauthenticated", "Đăng nhập để tiếp tục.");
    const d = z
      .object({
        action: z.enum([
          "purchase",
          "confirm",
          "grant",
          "cancelRenewal",
          "requestRenewal",
          "cancelInvoice",
        ]),
        operationId: z.string().uuid(),
        planId: z
          .string()
          .regex(/^[a-zA-Z0-9-]{1,80}$/)
          .optional(),
        invoiceId: z
          .string()
          .regex(/^[a-zA-Z0-9-]{1,80}$/)
          .optional(),
        ownerId: z
          .string()
          .regex(/^[a-zA-Z0-9-]{1,128}$/)
          .optional(),
        amount: money.optional(),
        bankTransactionId: z.string().trim().min(4).max(120).optional(),
        evidence: z.string().min(5).max(1000).optional(),
        reason: z.string().min(5).max(500).optional(),
      })
      .strict()
      .safeParse(req.data);
    if (!d.success)
      throw new HttpsError("invalid-argument", "Thông tin không hợp lệ.");
    const p = d.data,
      uid = req.auth.uid,
      db = getFirestore(),
      now = Date.now(),
      hash = createHash("sha256").update(JSON.stringify(p)).digest("hex"),
      op = db.doc(`idempotencyKeys/${uid}-${p.operationId}`);
    return db.runTransaction(async (tx) => {
      const [access, user, previous] = await Promise.all([
        tx.get(db.doc(`staffAccess/${uid}`)),
        tx.get(db.doc(`users/${uid}`)),
        tx.get(op),
      ]);
      if (user.data()?.locked || access.data()?.locked)
        throw new HttpsError(
          "permission-denied",
          "Tài khoản không thể thao tác.",
        );
      const rs: Role[] =
        access.data()?.active === true &&
        isStringRoleArray(access.data()?.roles)
          ? access.data()?.roles
          : [];
      if (p.action === "grant" && !rs.includes("OWNER"))
        throw new HttpsError(
          "permission-denied",
          "Cần quyền chủ doanh nghiệp.",
        );
      if (
        p.action === "confirm" &&
        !rs.some((r) => ["OWNER", "FINANCE"].includes(r))
      )
        throw new HttpsError("permission-denied", "Cần quyền tài chính.");
      if (
        ["grant", "confirm"].includes(p.action) &&
        process.env.FUNCTIONS_EMULATOR !== "true" &&
        !recentMfa(req.auth!.token, now)
      )
        throw new HttpsError(
          "failed-precondition",
          "Cần xác thực gần đây và hai lớp.",
          { reason: "RECENT_MFA_REQUIRED" },
        );
      if (previous.exists) {
        if (previous.data()?.hash !== hash)
          throw new HttpsError("already-exists", "Mã thao tác đã được dùng.");
        return previous.data()?.result;
      }
      const invoiceRef = db.doc(
          `membershipInvoices/${p.invoiceId ?? randomUUID()}`,
        ),
        invoice = ["confirm", "cancelInvoice"].includes(p.action)
          ? await tx.get(invoiceRef)
          : null;
      if (["confirm", "cancelInvoice"].includes(p.action) && !p.invoiceId)
        throw new HttpsError("invalid-argument", "Chọn hóa đơn membership.");
      const target =
        p.action === "confirm"
          ? invoice?.data()?.ownerId
          : p.action === "grant"
            ? p.ownerId
            : uid;
      if (!target)
        throw new HttpsError("invalid-argument", "Thiếu tài khoản cần xử lý.");
      const subscriptionRef = db.doc(`membershipSubscriptions/${target}`),
        subscription = await tx.get(subscriptionRef);
      const targetUser = await tx.get(db.doc(`users/${target}`));
      if (!targetUser.exists || targetUser.data()?.locked)
        throw new HttpsError(
          "permission-denied",
          "Không thể xử lý tài khoản này.",
        );
      let result: { id: string; state?: "active" | "pending" };
      if (p.action === "cancelInvoice") {
        if (!invoice?.exists || invoice.data()?.ownerId !== uid)
          throw new HttpsError(
            "permission-denied",
            "Không thể xử lý hóa đơn này.",
          );
        if (invoice.data()?.state !== "pending")
          throw new HttpsError(
            "failed-precondition",
            "Chỉ hủy được yêu cầu chưa xác nhận thanh toán.",
          );
        tx.update(invoiceRef, {
          state: "cancelled",
          cancelledAt: now,
          cancelledBy: uid,
        });
        result = { id: invoiceRef.id };
      } else if (["cancelRenewal", "requestRenewal"].includes(p.action)) {
        if (!subscription.exists)
          throw new HttpsError(
            "failed-precondition",
            "Bạn chưa có membership.",
          );
        tx.set(
          subscriptionRef,
          {
            ownerId: uid,
            renewalIntent: p.action === "requestRenewal",
            changedAt: now,
          },
          { merge: true },
        );
        tx.create(db.collection("membershipHistory").doc(), {
          ownerId: uid,
          action: p.action,
          actor: uid,
          createdAt: now,
          endsAt: subscription.data()?.endsAt,
        });
        result = { id: target };
      } else if (p.action === "purchase") {
        if (!p.planId)
          throw new HttpsError("invalid-argument", "Chọn gói membership.");
        const plan = await tx.get(db.doc(`membershipPlans/${p.planId}`));
        if (plan.data()?.status !== "published")
          throw new HttpsError("failed-precondition", "Gói chưa mở bán.");
        const term = membershipTerm(
          plan.data()!,
          p.planId,
          subscription.data(),
          now,
        );
        const amount = money.parse(plan.data()?.price);
        if (amount === 0) {
          if (plan.data()?.name !== "FREE")
            throw new HttpsError(
              "failed-precondition",
              "Gói này cần được chủ doanh nghiệp kiểm tra giá trước khi mở bán.",
            );
          const current = subscription.data();
          const active = current?.state === "active" && current.endsAt > now;
          if (
            active &&
            (current.planSnapshot?.name !== "FREE" ||
              current.planSnapshot?.price !== 0)
          )
            throw new HttpsError(
              "failed-precondition",
              "Gói hiện tại còn hiệu lực. Liên hệ hỗ trợ để đổi gói.",
            );
          // Re-selecting an active free plan does not stack unlimited future terms
          // or silently replace the current benefit snapshot.
          if (!active) {
            const value = {
              ownerId: uid,
              planId: p.planId,
              planSnapshot: plan.data(),
              ...term,
              renewalIntent: false,
              state: "active",
              changedAt: now,
            };
            tx.set(subscriptionRef, value);
            tx.create(db.collection("membershipHistory").doc(), {
              ...value,
              action: "activateFree",
              actor: uid,
              createdAt: now,
            });
            tx.create(db.doc(`outboxJobs/membership-${uid}-${p.operationId}`), {
              ownerId: uid,
              action: "membershipActivated",
              state: "queued",
              createdAt: now,
            });
          }
          result = { id: uid, state: "active" };
        } else {
          tx.create(invoiceRef, {
            ownerId: uid,
            planId: p.planId,
            planSnapshot: plan.data(),
            amount,
            currency: "VND",
            state: "pending",
            createdAt: now,
          });
          result = { id: invoiceRef.id, state: "pending" };
        }
      } else {
        let plan: Record<string, unknown>;
        let bankRef;
        if (p.action === "confirm") {
          if (!invoice?.exists || invoice.data()?.state !== "pending")
            throw new HttpsError(
              "failed-precondition",
              "Hóa đơn không còn chờ xác nhận.",
            );
          if (invoice.data()?.amount === 0)
            throw new HttpsError(
              "failed-precondition",
              "Yêu cầu miễn phí không cần xác nhận chuyển khoản. Liên hệ hỗ trợ để xử lý yêu cầu cũ.",
            );
          if (p.amount !== invoice.data()?.amount)
            throw new HttpsError(
              "failed-precondition",
              "Số tiền không khớp hóa đơn membership.",
            );
          if (!p.bankTransactionId || !p.evidence)
            throw new HttpsError(
              "invalid-argument",
              "Cần giao dịch và bằng chứng ngân hàng.",
            );
          bankRef = db.doc(
            `bankTransactions/${createHash("sha256").update(p.bankTransactionId).digest("hex")}`,
          );
          if ((await tx.get(bankRef)).exists)
            throw new HttpsError(
              "already-exists",
              "Giao dịch ngân hàng đã được phân bổ.",
            );
          plan = invoice.data()?.planSnapshot;
        } else {
          if (!p.planId || !p.reason)
            throw new HttpsError(
              "invalid-argument",
              "Cần gói và lý do cấp tặng.",
            );
          const s = await tx.get(db.doc(`membershipPlans/${p.planId}`));
          if (s.data()?.status !== "published")
            throw new HttpsError("failed-precondition", "Gói chưa được duyệt.");
          plan = s.data()!;
        }
        const planId =
          p.action === "confirm" ? invoice?.data()?.planId : p.planId;
        if (typeof planId !== "string" || !plan)
          throw new HttpsError(
            "failed-precondition",
            "Hóa đơn chưa có gói hợp lệ.",
          );
        const term = membershipTerm(plan, planId, subscription.data(), now);
        const value = {
          ownerId: target,
          planId,
          planSnapshot: plan,
          ...term,
          renewalIntent: false,
          state: "active",
          changedAt: now,
        };
        tx.set(subscriptionRef, value);
        tx.create(db.doc(`outboxJobs/membership-${uid}-${p.operationId}`), {
          ownerId: target,
          action: "membershipActivated",
          state: "queued",
          createdAt: now,
        });
        tx.create(db.collection("membershipHistory").doc(), {
          ...value,
          action: p.action,
          actor: uid,
          reason: p.reason ?? "Confirmed bank transfer",
          createdAt: now,
        });
        if (bankRef) {
          tx.create(db.collection("financialEntries").doc(), {
            kind: "membershipPayment",
            invoiceId: invoiceRef.id,
            ownerId: target,
            amount: invoice?.data()?.amount,
            currency: "VND",
            actor: uid,
            createdAt: now,
          });
          tx.create(bankRef, {
            kind: "membershipPayment",
            invoiceId: invoiceRef.id,
            amount: invoice?.data()?.amount,
            actor: uid,
            evidence: p.evidence,
            createdAt: now,
          });
          tx.update(invoiceRef, {
            state: "paid",
            confirmedAt: now,
            confirmedBy: uid,
          });
        }
        result = { id: target };
      }
      tx.create(op, { hash, result, createdAt: now });
      tx.create(db.collection("auditEvents").doc(), {
        actor: uid,
        action: `membership.${p.action}`,
        resourceId: result.id,
        createdAt: now,
      });
      return result;
    });
  },
);

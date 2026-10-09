import { orderCustomerFields } from "./customer-notification-events";
import {
  isStringRoleArray,
  recentMfa,
  requireVerifiedGoogle,
} from "./auth/guards";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { normalizeCustomerName } from "../../packages/domain/crm";
import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import {
  requestSchema,
  evolve,
  requireRole,
  money,
  quoteSchema,
  convertFx,
  membershipDiscount,
  type Action,
  type Order,
  type Role,
  grants,
} from "../../packages/domain";
initializeApp();
const db = getFirestore();
const schema = z
  .object({
    action: z.string().min(1).max(60),
    operationId: z.string().uuid(),
    orderId: z
      .string()
      .regex(/^[a-zA-Z0-9-]{1,80}$/)
      .optional(),
    expectedVersion: z.number().int().nonnegative().optional(),
    payload: z.unknown(),
  })
  .strict();
const config = {
  region: "asia-southeast1",
  maxInstances: 5,
  concurrency: 20,
  enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
};
export const command = onCall(config, async (req) => {
  requireVerifiedGoogle(req.auth);
  if (!req.auth?.uid)
    throw new HttpsError("unauthenticated", "Đăng nhập để tiếp tục.");
  const parsed = schema.safeParse(req.data);
  if (!parsed.success)
    throw new HttpsError("invalid-argument", "Thông tin không hợp lệ.");
  const d = parsed.data,
    uid = req.auth.uid,
    now = Date.now(),
    id = d.orderId ?? randomUUID();
  const ref = db.doc(`orders/${id}`),
    op = db.doc(`idempotencyKeys/${uid}-${d.operationId}`),
    hash = createHash("sha256").update(JSON.stringify(d)).digest("hex");
  return db.runTransaction(async (tx) => {
    const [previous, access, profile, snapshot] = await Promise.all([
      tx.get(op),
      tx.get(db.doc(`staffAccess/${uid}`)),
      tx.get(db.doc(`users/${uid}`)),
      tx.get(ref),
    ]);
    if (access.data()?.locked || profile.data()?.locked)
      throw new HttpsError(
        "permission-denied",
        "Không thể thực hiện thao tác này.",
      );
    if (previous.exists) {
      if (previous.data()?.hash !== hash)
        throw new HttpsError("already-exists", "Mã thao tác đã được sử dụng.");
    }
    const rs: Role[] =
      access.data()?.active === true && isStringRoleArray(access.data()?.roles)
        ? (access.data()?.roles ?? [])
        : [];
    let o = snapshot.data() as Order;
    let finance: Record<string, unknown> | undefined;
    let bankRef;
    let bankData;
    let transferRef;
    let refundRef;
    if (d.action !== "submitRequest") {
      if(o?.checkoutId && ["verifyTransfer","transferReview"].includes(d.action)) throw new HttpsError("failed-precondition", "Tiếp tục từ lượt thanh toán checkout để đối chiếu tiền và chứng từ.");
      if (!snapshot.exists)
        throw new HttpsError(
          "permission-denied",
          "Không thể truy cập yêu cầu.",
        );
      if (
        [
          "acceptQuote",
          "approveFinal",
          "confirmReceipt",
          "cancelRequest",
          "transferReview",
        ].includes(d.action)
      ) {
        if (o.ownerId !== uid)
          throw new HttpsError(
            "permission-denied",
            "Không thể truy cập yêu cầu.",
          );
      } else {
        try {
          requireRole(d.action, rs);
        } catch {
          throw new HttpsError(
            "permission-denied",
            "Bạn không có quyền thực hiện thao tác này.",
          );
        }
        if (
          rs.includes("BUYER") &&
          !(grants[d.action] ?? []).some(
            (role) => role !== "BUYER" && rs.includes(role),
          ) &&
          (!Array.isArray(access.data()?.orderIds) ||
            !access.data()!.orderIds.includes(id))
        )
          throw new HttpsError("permission-denied", "Đơn chưa được phân công.");
      }
      if (previous.exists) return previous.data()?.result;
      if (["dispatch", "track"].includes(d.action)) {
        const allocation = await tx.get(db.doc(`packageAllocations/${id}`));
        if (allocation.exists)
          throw new HttpsError(
            "failed-precondition",
            "Đơn có kiện riêng. Cập nhật bằng luồng kiện để kiểm tra đủ số lượng.",
          );
      }
      if (o.version !== d.expectedVersion)
        throw new HttpsError(
          "aborted",
          "Dữ liệu đã thay đổi. Tải lại để tiếp tục.",
        );
    }
    if (d.action === "submitRequest" && previous.exists)
      return previous.data()?.result;
    try {
      if (d.action === "submitRequest") {
        if (snapshot.exists)
          throw new HttpsError("already-exists", "Yêu cầu đã tồn tại.");
        const p = requestSchema.parse(d.payload);
        o = {
          ...p,
          id,
          ownerId: uid,
          purchaseKind: "custom",
          stage: "REQUESTED",
          version: 1,
          createdAt: now,
          collected: 0,
          refunded: 0,
        };
      } else if (d.action === "verifyTransfer" || d.action === "refund") {
        if (d.action === "verifyTransfer" && o.stage === "CANCELLED")
          throw new HttpsError(
            "failed-precondition",
            "Đơn đã hủy. Không thể phân bổ thêm tiền.",
          );
        if (
          process.env.FUNCTIONS_EMULATOR !== "true" &&
          !recentMfa(req.auth!.token, now)
        )
          throw new HttpsError(
            "failed-precondition",
            "Cần đăng nhập lại và xác thực hai lớp.",
            { reason: "RECENT_MFA_REQUIRED" },
          );
        const p = z
          .object({
            amount: money.positive(),
            bankTransactionId: z.string().trim().min(4).max(120),
            evidence: z.string().min(5).max(1000),
            reason: z.string().min(3).max(500),
            reviewId: z
              .string()
              .regex(/^[a-zA-Z0-9-]{1,160}$/)
              .optional(),
            refundRequestId: z.string().uuid().optional(),
          })
          .strict()
          .parse(d.payload);
        if (p.reviewId) {
          if (d.action !== "verifyTransfer")
            throw Error("INVALID_REVIEW_ACTION");
          transferRef = db.doc(`transferReviews/${p.reviewId}`);
          const review = await tx.get(transferRef);
          if (
            review.data()?.status !== "pending" ||
            review.data()?.orderId !== id ||
            review.data()?.ownerId !== o.ownerId ||
            review.data()?.amount !== p.amount
          )
            throw Error("REVIEW_CONTEXT_MISMATCH");
        }
        bankRef = db.doc(
          `bankTransactions/${createHash("sha256").update(p.bankTransactionId).digest("hex")}`,
        );
        if ((await tx.get(bankRef)).exists)
          throw new HttpsError("already-exists", "Giao dịch đã được phân bổ.");
        if (!o.acceptedAt) throw Error("NO_ACCEPTANCE");
        if (p.refundRequestId && d.action !== "refund")
          throw Error("INVALID_REFUND_ACTION");
        if (d.action === "refund") {
          if (p.refundRequestId) {
            refundRef = db.doc(`refunds/${p.refundRequestId}`);
            const refund = await tx.get(refundRef);
            if (
              refund.data()?.state !== "pending" ||
              refund.data()?.orderId !== id ||
              refund.data()?.amount !== p.amount
            )
              throw Error("REFUND_CONTEXT_MISMATCH");
            if ((o.refundReserved ?? 0) < p.amount)
              throw Error("REFUND_RESERVATION_MISMATCH");
            o.refundReserved = (o.refundReserved ?? 0) - p.amount;
          }
          if (p.amount > o.collected - o.refunded - (o.refundReserved ?? 0))
            throw Error("OVER_REFUND");
          o.refunded += p.amount;
        } else o.collected = money.parse(o.collected + p.amount);
        finance = {
          kind: d.action === "refund" ? "refund" : "payment",
          amount: p.amount,
          currency: "VND",
          orderId: id,
          actor: uid,
          createdAt: now,
        };
        bankData = { ...p, ...finance };
        o.version++;
        if (
          o.stage === "PACKED" &&
          o.finalApproved &&
          o.finalTotal !== undefined &&
          o.collected - o.refunded - (o.refundReserved ?? 0) >= o.finalTotal &&
          !o.hold
        )
          o.stage = "READY_TO_SHIP";
      } else if (d.action === "transferReview") {
        const p = z
          .object({
            reference: z.string().min(3).max(100),
            amount: money.positive(),
          })
          .strict()
          .parse(d.payload);
        if (!o.acceptedAt || o.stage === "CANCELLED")
          throw Error("INVALID_STATE");
        tx.create(db.doc(`transferReviews/${uid}-${d.operationId}`), {
          ...p,
          ownerId: uid,
          orderId: id,
          status: "pending",
          createdAt: now,
        });
        o.version++;
      } else {
        if (d.action === "issueQuote") {
          const [policySnap, membership] = await Promise.all([
            tx.get(db.doc("settings/pricing")),
            tx.get(db.doc(`membershipSubscriptions/${o.ownerId}`)),
          ]);
          const policy = policySnap.data(),
            q = quoteSchema.parse(d.payload),
            rate = policy?.rates?.[q.sourceCurrency];
          if (
            q.sourceCurrency !==
            (o.market === "US" ? "USD" : o.market === "JP" ? "JPY" : "KRW")
          )
            throw new HttpsError(
              "failed-precondition",
              "Tiền nguồn không khớp thị trường.",
            );
          if (
            !policy?.approved ||
            policy.effectiveFrom > now ||
            policy.expiresAt <= now ||
            q.termsVersion !== policy.termsVersion ||
            !rate ||
            q.fxNumerator !== rate.numerator ||
            q.fxDenominator !== rate.denominator ||
            q.goods !==
              convertFx(q.sourceMinor, rate.numerator, rate.denominator)
          )
            throw new HttpsError(
              "failed-precondition",
              "Tỷ giá hoặc điều khoản chưa được duyệt, đã hết hạn hoặc không khớp.",
            );
          const m = membership.data();
          if (m?.state === "active" && m.endsAt > now) {
            const plan = m.planSnapshot;
            const discount = membershipDiscount(
              q.service,
              0,
              plan.serviceDiscountBps,
              plan.discountCap,
              0,
            );
            if (q.discount !== discount)
              throw new HttpsError(
                "failed-precondition",
                "Giảm phí phải khớp quyền lợi hiện hành.",
              );
            o.membershipSnapshot = {
              name: plan.name,
              endsAt: m.endsAt,
              serviceDiscountBps: plan.serviceDiscountBps,
              discountCap: plan.discountCap,
            };
          } else {
            delete o.membershipSnapshot;
            if (q.discount !== 0)
              throw new HttpsError(
                "failed-precondition",
                "Chưa có quyền lợi giảm phí được duyệt.",
              );
          }
        }
        o = evolve(o, d.action as Action, d.payload, now);
        if (["recordPurchase", "receive"].includes(d.action))
          tx.create(
            db
              .collection(
                d.action === "recordPurchase"
                  ? "purchaseRecords"
                  : "receivingRecords",
              )
              .doc(),
            { orderId: id, actor: uid, payload: d.payload, createdAt: now },
          );
        if (
          ["recordPurchase", "receive", "pack", "finalize"].includes(d.action)
        )
          tx.set(
            db.doc(`orderOperations/${id}`),
            { [d.action]: d.payload, changedBy: uid, changedAt: now },
            { merge: true },
          );
        if (d.action === "claimPurchase")
          tx.set(
            db.doc(`orderOperations/${id}`),
            { buyerId: uid, claimedAt: now },
            { merge: true },
          );
      }
    } catch (e) {
      if (e instanceof HttpsError) throw e;
      throw new HttpsError(
        "failed-precondition",
        "Kiểm tra thông tin, quyền và trạng thái hiện tại.",
      );
    }
    if (d.action === "issueQuote") {
      tx.create(ref.collection("quotes").doc(String(o.quoteVersion)), {
        quote: o.quote,
        quoteVersion: o.quoteVersion,
        membershipSnapshot: o.membershipSnapshot ?? null,
        createdAt: now,
        createdBy: uid,
      });
    }
    if (d.action === "acceptQuote") {
      tx.create(
        ref.collection("acceptances").doc(String(o.acceptedQuoteVersion)),
        {
          quoteVersion: o.acceptedQuoteVersion,
          deposit: o.deposit,
          acceptedAt: now,
          acceptedBy: uid,
          termsVersion: o.quote!.termsVersion,
          items: o.items,
        },
      );
    }
    const result = { id, version: o.version };
    if (d.action === "submitRequest" && !profile.exists) {
      const displayName =
        typeof req.auth!.token.name === "string"
          ? req.auth!.token.name.slice(0, 120)
          : "";
      tx.create(db.doc(`users/${uid}`), {
        ownerId: uid,
        displayName,
        searchName: normalizeCustomerName(displayName),
        businessName: "",
        marketingConsent: false,
        version: 1,
        createdAt: now,
        changedAt: now,
      });
    }
    if (bankRef && bankData) tx.create(bankRef, bankData);
    if (refundRef)
      tx.update(refundRef, {
        state: "confirmed",
        confirmedAt: now,
        confirmedBy: uid,
      });
    tx.set(ref, o);
    tx.create(op, { hash, result, createdAt: now });
    tx.create(db.collection("auditEvents").doc(), {
      actor: uid,
      action: d.action,
      resourceId: id,
      createdAt: now,
    });
    tx.create(ref.collection("timeline").doc(), {
      action: d.action,
      createdAt: now,
    });
    if (finance) {
      const entry = db.collection("financialEntries").doc();
      tx.create(entry, finance);
      if (transferRef)
        tx.update(transferRef, {
          status: "verified",
          financialEntryId: entry.id,
          reviewedAt: now,
          reviewedBy: uid,
        });
    }
    tx.create(db.collection("outboxJobs").doc(), {
      ownerId: o.ownerId,
      orderId: id,
      action: d.action,
      state: "queued",
      createdAt: now,
      ...orderCustomerFields(d.action, o, now, typeof finance?.amount === "number" ? finance.amount : undefined),
    });
    return result;
  });
});
export { ask } from "./ai/ask";
export { askWorkflow, currentAskConversation } from "./ai/ask-workflow";
export {
  listWork,
  workspaceCommand,
  readOwnerConfiguration,
  ticketMessages,
} from "./workspace";
export { membershipCommand } from "./membership";
export { publicPage, publicDiscovery } from "./public";
export { maintenance, readNotification } from "./jobs";
export {
  createPaymentLink,
  payosWebhook,
  reconcilePayments,
} from "./payments/payos";
export { deliverEmail } from "./email";
export {
  readOrderConversation,
  orderConversationCommand,
} from "./order-conversation";

export { shippingCommand } from "./shipping";
export { orderHistory } from "./order-history";
export { changeCommand } from "./changes";
export { returnCommand } from "./returns";
export { refundCommand } from "./refunds";

export { uploadContentImage, publicImage } from "./media";
export { consolidationCommand } from "./consolidation";
export { readStaffAccess } from "./workspace";
export {
  readCustomer,
  saveCustomerNotes,
  listCustomers,
  listFollowUps,
  listCrmStaff,
} from "./crm";
export { operationalDashboard } from "./crm";

export {
  uploadOrderImage,
  listOrderImages,
  readOrderImage,
} from "./order-media";

export { financeReview } from "./finance-review";

export { membershipReminderPolicy } from "./membership-reminder-policy";

export { readOrderOperations } from "./workspace";

export { catalogCheckout } from "./catalog-checkout";
export { cartCommand } from "./cart";

export { invoiceCommand, invoiceList, invoiceDetail } from "./invoices";
export { invoiceShare } from "./invoice-share";
export { outboxCommand } from "./outbox-command";

export { customerOrderTracking } from "./customer-order-tracking";
export { shippingRatesPublic, shippingRatesAdmin } from "./shipping-rates";
export {
  studioRead,
  studioCommand,
  studioMediaUpload,
  studioMediaRead,
} from "./blog-studio";

export {
  blogCommentSubmit,
  blogCommentList,
  blogCommentCommand,
  blogCommentReport,
} from "./blog-comments";
export {
  studioAdvancedRead,
  studioAdvancedCommand,
} from "./blog-studio-advanced";

export {
  websiteBannerCommand,
  websiteBannerAdmin,
  websiteBannerPreview,
  campaignBannersPublic,
} from "./campaign-banners";

export {
  productReviewRead,
  productReviewEligibility,
  productReviewWrite,
  productReviewModerate,
  productReviewAdmin,
} from "./product-reviews";

export {
  askKnowledgeCommand,
  askKnowledgePreview,
} from "./ai/approved-knowledge";

export { customerSaveResolve } from "./ai/customer-save";
export { askResearchCommand, askResearchSearch, askResearchSelect } from "./ai/research";
export { askFeedback, askFeedbackReview, askFeedbackPolicy } from "./ai/feedback";

// First-party analytics: independent consent, private projections and bounded reads.
export { analyticsSession, analyticsIngest, analyticsLinkOrder, analyticsWithdraw } from "./analytics-ingest";
export { analyticsOrderChanged, analyticsPaymentCreated, analyticsJobCreated, analyticsCompact } from "./analytics-worker";
export { dashboardAnalytics } from "./dashboard-analytics";

export { askWebDiscovery, askWebSelect } from "./ai/research-live";
export { askFeedbackWithdraw, askFeedbackInbox, askFeedbackCleanup, askFeedbackEvaluation } from "./ai/feedback-lifecycle";

export { purchaseCheckout } from "./purchase-checkout";
import { purchaseDemoPayment as guardedPurchaseDemoPayment } from "./purchase-checkout";
export const purchaseDemoPayment = process.env.FUNCTIONS_EMULATOR === "true" ? guardedPurchaseDemoPayment : undefined;
import { purchaseDemoWebhook as guardedPurchaseDemoWebhook } from "./purchase-demo-gateway";
export const purchaseDemoWebhook = process.env.FUNCTIONS_EMULATOR === "true" ? guardedPurchaseDemoWebhook : undefined;
export { purchaseBalanceCheckout } from "./purchase-checkout";
export { purchaseCheckoutSetup } from "./purchase-checkout";

export { purchaseDraftImage } from "./purchase-images";
export { purchaseOrderRead } from "./purchase-checkout";

export { purchaseReceipt, purchaseReceiptWorker, purchaseReceiptRecovery } from "./purchase-receipts";

export { purchaseSourcingChange } from "./purchase-adjustment";

// SePay sandbox endpoints are never part of a production release.
import { purchaseSePayPayment as sandboxSePayPayment, purchaseSePayIpn as sandboxSePayIpn, purchaseSePayInboxWorker as sandboxSePayInboxWorker } from "./purchase-sepay";
const localSePay = process.env.FUNCTIONS_EMULATOR === "true" && process.env.GCLOUD_PROJECT === "demo-satsunicgo";
export const purchaseSePayPayment = localSePay ? sandboxSePayPayment : undefined;
export const purchaseSePayIpn = localSePay ? sandboxSePayIpn : undefined;
export const purchaseSePayInboxWorker = localSePay ? sandboxSePayInboxWorker : undefined;

export { customerNotificationCreated } from "./customer-notification-delivery";

export { notificationPreferences } from "./notification-preferences";
export { deliverSubscriptionEmail } from "./subscription-email";

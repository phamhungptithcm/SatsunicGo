import {
  customerEvent,
  customerEventFields,
} from "./customer-notification-events";
import { productInformationShape } from "../../packages/domain/product-information";
import {
  catalogOptionsSchema,
  catalogProductSchema,
} from "../../packages/domain/catalog-checkout";
import {
  isStringRoleArray,
  recentMfa,
  requireVerifiedGoogle,
} from "./auth/guards";
import { getFirestore } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { z } from "zod";
import { randomUUID, createHash } from "node:crypto";
import { roles, money, type Role } from "../../packages/domain";
import { normalizeCustomerName } from "../../packages/domain/crm";
import { pilotReady, pilotLimits, verifyPilotProvider } from "./ai/ask-pilot";
const opts = {
  region: "asia-southeast1",
  maxInstances: 4,
  concurrency: 20,
  enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
};
export const listWork = onCall(opts, async (req) => {
  requireVerifiedGoogle(req.auth);
  if (!req.auth?.uid)
    throw new HttpsError("unauthenticated", "Đăng nhập để tiếp tục.");
  const db = getFirestore();
  return db.runTransaction(async (tx) => {
    const [accessSnapshot, customerSnapshot] = await Promise.all([
      tx.get(db.doc(`staffAccess/${req.auth!.uid}`)),
      tx.get(db.doc(`users/${req.auth!.uid}`)),
    ]);
    const access = accessSnapshot.data(),
      customer = customerSnapshot.data();
    if (
      access?.active !== true ||
      !isStringRoleArray(access.roles) ||
      access.locked ||
      customer?.locked
    )
      throw new HttpsError("permission-denied", "Cần quyền nhân viên.");
    const rs: readonly string[] = access.roles;
    const parsed = z
      .object({
        kind: z.enum([
          "orders",
          "supportTickets",
          "products",
          "posts",
          "campaigns",
          "membershipPlans",
          "packages",
          "consolidationBatches",
          "orderChanges",
          "orderReturns",
          "refunds",
          "membershipInvoices",
          "transferReviews",
          "paymentExceptions",
          "auditEvents",
          "outboxJobs",
        ]),
        after: z.string().max(256).optional(),
        id: z
          .string()
          .regex(/^[a-zA-Z0-9-]{1,80}$/)
          .optional(),
        supportStatus: z.enum(["open", "resolved"]).optional(),
        changeState: z.literal("accepted").optional(),
        queue: z
          .enum([
            "requests",
            "quotes",
            "purchasing",
            "warehouse",
            "balance",
            "ready",
            "holds",
          ])
          .optional(),
      })
      .strict()
      .refine(
        (input) =>
          !input.after ||
          (input.kind === "outboxJobs"
            ? /^[a-zA-Z0-9_-]{1,256}$/.test(input.after)
            : input.after.length <= 80),
      )
      .safeParse(req.data);
    if (!parsed.success)
      throw new HttpsError("invalid-argument", "Không hợp lệ.");
    const { kind, after, id, queue, changeState, supportStatus } = parsed.data;
    if (
      (supportStatus && kind !== "supportTickets") ||
      (changeState && kind !== "orderChanges") ||
      (queue && kind !== "orders") ||
      (id &&
        ![
          "orders",
          "supportTickets",
          "packages",
          "consolidationBatches",
        ].includes(kind)) ||
      (id && after && ["packages", "consolidationBatches"].includes(kind))
    )
      throw new HttpsError("invalid-argument", "Bộ lọc không hợp lệ.");
    const allowed = [
      "membershipInvoices",
      "refunds",
      "transferReviews",
      "paymentExceptions",
    ].includes(kind)
      ? ["OWNER", "FINANCE"]
      : ["auditEvents", "outboxJobs", "orderChanges"].includes(kind)
        ? ["OWNER", "OPERATIONS_MANAGER"]
        : ["packages", "consolidationBatches", "orderReturns"].includes(kind)
          ? ["OWNER", "WAREHOUSE", "OPERATIONS_MANAGER"]
          : kind === "orders"
            ? [
                "OWNER",
                "OPERATIONS_MANAGER",
                "BUYER",
                "WAREHOUSE",
                "FINANCE",
                "SUPPORT",
              ]
            : kind === "supportTickets"
              ? ["OWNER", "SUPPORT", "OPERATIONS_MANAGER"]
              : ["OWNER", "CONTENT_EDITOR"];
    if (!allowed.some((r) => rs.includes(r as Role)))
      throw new HttpsError("permission-denied", "Không có quyền xem hàng đợi.");
    const acceptedChanges =
      kind === "orderChanges" && changeState === "accepted";
    let q = acceptedChanges
      ? db
          .collection(kind)
          .where("state", "==", "accepted")
          .orderBy("reviewedAt", "desc")
          .orderBy("__name__", "asc")
          .limit(31)
      : (queue === "holds"
          ? db.collection(kind).orderBy("hold")
          : ["auditEvents", "outboxJobs"].includes(kind)
            ? db.collection(kind).orderBy("createdAt", "desc")
            : db.collection(kind)
        )
          .orderBy("__name__")
          .limit(30);
    const buyerOnly =
      rs.includes("BUYER") &&
      !rs.some((r) =>
        [
          "OWNER",
          "OPERATIONS_MANAGER",
          "WAREHOUSE",
          "FINANCE",
          "SUPPORT",
        ].includes(r),
      );
    let assignmentNext: string | null = null;
    const assignedIds: string[] = Array.isArray(access.orderIds)
      ? access.orderIds
      : [];
    if (kind === "orders" && buyerOnly && !id) {
      const candidates = [...new Set<string>(assignedIds)]
        .sort()
        .filter((value) => !after || value > after);
      const ids = candidates.slice(0, 30);
      assignmentNext = candidates.length > 30 ? (ids.at(-1) ?? null) : null;
      if (!ids.length) return { rows: [], next: null };
      q = q.where("__name__", "in", ids);
    }
    if (id) {
      if (buyerOnly && !assignedIds.includes(id))
        throw new HttpsError("permission-denied", "Đơn chưa được phân công.");
      q = q.where("__name__", "==", id);
    }
    if (supportStatus) q = q.where("status", "==", supportStatus);
    if (queue) {
      if (queue === "holds") q = q.where("hold", ">", "");
      else {
        const stages = {
          requests: ["REQUESTED"],
          quotes: ["QUOTED"],
          purchasing: ["QUOTE_ACCEPTED", "PURCHASING"],
          warehouse: ["PURCHASED", "ORIGIN_RECEIVED", "PACKED"],
          balance: ["PACKED"],
          ready: ["READY_TO_SHIP"],
        };
        q = q.where("stage", "in", stages[queue]);
      }
    }
    if (after && !(kind === "orders" && buyerOnly)) {
      const last = await tx.get(db.doc(`${kind}/${after}`));
      if (
        !last.exists ||
        (supportStatus && last.data()?.status !== supportStatus) ||
        (acceptedChanges &&
          (last.data()?.state !== "accepted" ||
            !Number.isSafeInteger(last.data()?.reviewedAt) ||
            last.data()!.reviewedAt <= 0))
      )
        throw new HttpsError(
          "invalid-argument",
          "Trang đã thay đổi. Tải lại danh sách.",
        );
      q = q.startAfter(last);
    }
    const s = await tx.get(q);
    const rows = acceptedChanges ? s.docs.slice(0, 30) : s.docs;
    return {
      rows: rows.map((d) => {
        const data = d.data();
        if (kind === "auditEvents")
          return {
            id: d.id,
            action: data.action,
            resourceId: data.resourceId,
            createdAt: data.createdAt,
          };
        if (kind === "outboxJobs")
          return {
            id: d.id,
            action: data.action,
            state: data.state,
            emailState: data.emailState ?? "not_queued",
            createdAt: data.createdAt,
            attempts: data.emailAttempts ?? 0,
            version: data.version ?? 0,
          };
        if (
          kind === "orders" &&
          !rs.some((r) =>
            [
              "OWNER",
              "OPERATIONS_MANAGER",
              "FINANCE",
              "SUPPORT",
              "BUYER",
            ].includes(r),
          )
        ) {
          return {
            id: d.id,
            ownerId: data.ownerId,
            items: data.items,
            market: data.market,
            stage: data.stage,
            version: data.version,
            packingComplete: data.packingComplete ?? false,
            packedQuantity: data.packedQuantity ?? 0,
            hold: data.hold ?? "",
            createdAt: data.createdAt,
          };
        }
        return { ...data, id: d.id };
      }),
      next: acceptedChanges
        ? s.size > 30
          ? (rows.at(-1)?.id ?? null)
          : null
        : kind === "orders" && buyerOnly
          ? assignmentNext
          : s.size === 30
            ? s.docs.at(-1)?.id
            : null,
    };
  });
});
const contentSchema = z
  .object({
    title: z.string().min(2).max(160),
    slug: z.string().regex(/^[a-z0-9-]{2,100}$/),
    body: z.string().min(10).max(30000),
    status: z.enum(["draft", "published", "archived", "scheduled"]),
    publishAt: z.number().int().positive().optional(),
    market: z.enum(["US", "JP", "KR"]).optional(),
    category: z.string().max(80).optional(),
    referenceUrl: z
      .string()
      .url()
      .max(2048)
      .refine((value) => /^https?:\/\//i.test(value))
      .optional(),
    variants: z.string().max(500).optional(),
    featured: z.boolean().optional(),
    featuredOrder: z.number().int().min(0).max(9999).default(9999),
    ...productInformationShape,
    origin: z.string().max(4000).optional(),
    functions: z.string().max(4000).optional(),
    usage: z.string().max(4000).optional(),
    seoTitle: z.string().min(2).max(160).optional(),
    seoDescription: z.string().min(2).max(300).optional(),
    referencePrice: money.optional(),
    listedPrice: money.positive().optional(),
    orderable: z.boolean().optional(),
    termsVersion: z.string().trim().min(1).max(80).optional(),
    catalogOptions: catalogOptionsSchema.optional(),
    priceCheckedAt: z.number().int().positive().optional(),
    mediaId: z
      .string()
      .regex(/^[a-zA-Z0-9-]{1,80}$/)
      .optional(),
  })
  .strict();
export const workspaceCommand = onCall(opts, async (req) => {
  requireVerifiedGoogle(req.auth);
  if (!req.auth?.uid)
    throw new HttpsError("unauthenticated", "Đăng nhập để tiếp tục.");
  const db = getFirestore(),
    uid = req.auth.uid,
    now = Date.now();
  const parsed = z
    .object({
      action: z.enum([
        "openTicket",
        "replyTicket",
        "saveContent",
        "saveCampaign",
        "saveProfile",
        "saveAddress",
        "saveMembershipPlan",
        "saveStaffAccess",
        "savePricingPolicy",
        "saveAskPilotPolicy",
      ]),
      operationId: z.string().uuid(),
      id: z
        .string()
        .regex(/^[a-zA-Z0-9-]{1,128}$/)
        .optional(),
      expectedVersion: z.number().int().nonnegative().optional(),
      payload: z.unknown(),
    })
    .strict()
    .refine(
      (input) =>
        !input.id ||
        input.action === "saveStaffAccess" ||
        input.id.length <= 80,
    )
    .safeParse(req.data);
  if (!parsed.success)
    throw new HttpsError("invalid-argument", "Thông tin không hợp lệ.");
  const d = parsed.data,
    id = d.id ?? randomUUID(),
    hash = createHash("sha256").update(JSON.stringify(d)).digest("hex"),
    op = db.doc(`idempotencyKeys/${uid}-${d.operationId}`);
  let providerReady = false;
  if (
    d.action === "saveAskPilotPolicy" &&
    (d.payload as { enabled?: unknown })?.enabled === true
  ) {
    const [access, profile] = await Promise.all([
      db.doc(`staffAccess/${uid}`).get(),
      db.doc(`users/${uid}`).get(),
    ]);
    if (
      access.data()?.active !== true ||
      access.data()?.locked ||
      profile.data()?.locked ||
      !isStringRoleArray(access.data()?.roles) ||
      !access.data()!.roles.includes("OWNER")
    )
      throw new HttpsError(
        "permission-denied",
        "Cần quyền chủ doanh nghiệp và xác thực hai lớp gần đây.",
      );
    if (!recentMfa(req.auth!.token, now))
      throw new HttpsError(
        "failed-precondition",
        "Cần xác thực hai lớp gần đây.",
        { reason: "RECENT_MFA_REQUIRED" },
      );
    providerReady = await verifyPilotProvider();
  }
  return db.runTransaction(async (tx) => {
    const [access, profile, oldOp, customerSaveFence] = await Promise.all([
      tx.get(db.doc(`staffAccess/${uid}`)),
      tx.get(db.doc(`users/${uid}`)),
      tx.get(op),
      ["saveProfile", "saveAddress"].includes(d.action)
        ? tx.get(db.doc(`customerSaveFences/${uid}-${d.operationId}`))
        : Promise.resolve(null),
    ]);
    if (access.data()?.locked || profile.data()?.locked)
      throw new HttpsError(
        "permission-denied",
        "Không thể thực hiện thao tác.",
      );
    const rs: Role[] =
      access.data()?.active === true && isStringRoleArray(access.data()?.roles)
        ? (access.data()?.roles ?? [])
        : [];
    const require = (allowed: Role[]) => {
      if (!allowed.some((r) => rs.includes(r)))
        throw new HttpsError(
          "permission-denied",
          "Không có quyền thực hiện thao tác.",
        );
    };
    // Replays retain current authorization; a revoked staff member cannot
    // retrieve a successful privileged operation through its old key.
    if (["saveContent", "saveCampaign"].includes(d.action))
      require(["OWNER", "CONTENT_EDITOR"]);
    if (
      [
        "saveMembershipPlan",
        "savePricingPolicy",
        "saveStaffAccess",
        "saveAskPilotPolicy",
      ].includes(d.action)
    )
      require(["OWNER"]);
    if (d.action === "replyTicket") {
      const ticket = await tx.get(db.doc(`supportTickets/${id}`));
      if (!ticket.exists)
        throw new HttpsError(
          "permission-denied",
          "Không thể truy cập hội thoại.",
        );
      if (ticket.data()?.ownerId !== uid)
        require(["OWNER", "SUPPORT", "OPERATIONS_MANAGER"]);
    }
    if (["saveStaffAccess", "saveAskPilotPolicy"].includes(d.action))
      require(["OWNER"]);
    if (
      ["saveStaffAccess", "saveAskPilotPolicy"].includes(d.action) &&
      process.env.FUNCTIONS_EMULATOR !== "true" &&
      !recentMfa(req.auth!.token, now)
    )
      throw new HttpsError(
        "failed-precondition",
        "Cần xác thực gần đây và hai lớp.",
        { reason: "RECENT_MFA_REQUIRED" },
      );
    if (customerSaveFence?.exists)
      throw new HttpsError(
        "failed-precondition",
        "Lần lưu trước đã được đóng. Gửi lại thông tin để lưu.",
        { reason: "SAVE_CANCELLED" },
      );
    if (oldOp.exists) {
      if (oldOp.data()?.hash !== hash)
        throw new HttpsError("already-exists", "Mã thao tác đã được dùng.");
      return oldOp.data()?.result;
    }
    let collection = "",
      data: Record<string, unknown> = {};
    try {
      switch (d.action) {
        case "saveAskPilotPolicy": {
          require(["OWNER"]);
          if (d.id)
            throw new HttpsError(
              "invalid-argument",
              "Không chọn tài khoản thử khác.",
            );
          const payload = z
            .object({ enabled: z.boolean() })
            .strict()
            .parse(d.payload);
          if (payload.enabled && (!providerReady || !pilotReady(now)))
            throw new HttpsError(
              "failed-precondition",
              "Chưa xác minh provider cho đợt thử.",
            );
          collection = "settings";
          data = {
            enabled: payload.enabled,
            pilotUid: uid,
            maxBudgetVnd: 10000,
            expiresAt: Math.min(now + 86400000, pilotLimits.pricingExpiresAt),
          };
          break;
        }
        case "saveCampaign":
          require(["OWNER", "CONTENT_EDITOR"]);
          collection = "campaigns";
          data = z
            .object({
              title: z.string().min(2).max(160),
              caption: z.string().min(3).max(4000),
              path: z
                .string()
                .regex(/^\/(?:products|posts)\/[a-z0-9-]{2,100}$/),
              source: z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/),
              medium: z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/),
              campaign: z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/),
              scheduledAt: z.number().int().positive().optional(),
              status: z.enum(["draft", "approved", "archived"]),
            })
            .strict()
            .parse(d.payload);
          data.socialPosting = "disabled";
          break;
        case "openTicket":
          collection = "supportTickets";
          data = {
            ...z
              .object({
                subject: z.string().min(3).max(160),
                message: z.string().min(3).max(4000),
                topic: z
                  .enum(["purchase", "data-export", "data-deletion"])
                  .optional(),
              })
              .strict()
              .parse(d.payload),
            ownerId: uid,
            status: "open",
          };
          break;
        case "replyTicket":
          collection = "supportTickets";
          data = z
            .object({
              message: z.string().min(3).max(4000),
              status: z.enum(["open", "resolved"]),
            })
            .strict()
            .parse(d.payload);
          break;
        case "saveContent": {
          require(["OWNER", "CONTENT_EDITOR"]);
          const p = z
            .object({
              kind: z.enum(["products", "posts"]),
              content: contentSchema,
            })
            .strict()
            .parse(d.payload);
          collection = p.kind;
          data = p.content;
          if (p.kind === "products" && p.content.orderable) {
            catalogProductSchema.parse({
              ...p.content,
              status: "published",
              version: 1,
            });
          }
          if (
            data.status === "scheduled" &&
            (!data.publishAt || Number(data.publishAt) <= now)
          )
            throw new HttpsError(
              "invalid-argument",
              "Cần giờ xuất bản trong tương lai.",
            );
          data.authorId = uid;
          break;
        }
        case "saveProfile":
          collection = "users";
          data = {
            ...z
              .object({
                displayName: z.string().min(1).max(120),
                businessName: z.string().max(160),
                marketingConsent: z.boolean(),
              })
              .strict()
              .parse(d.payload),
            ownerId: uid,
          };
          break;
        case "saveAddress":
          collection = "addresses";
          data = {
            ...z
              .object({
                recipient: z.string().min(2).max(120),
                phone: z.string().min(8).max(20),
                address: z.string().min(10).max(500),
              })
              .strict()
              .parse(d.payload),
            ownerId: uid,
          };
          break;
        case "saveMembershipPlan":
          require(["OWNER"]);
          collection = "membershipPlans";
          data = z
            .object({
              name: z.enum(["FREE", "PLUS", "BUSINESS"]),
              price: money,
              periodDays: z.number().int().min(1).max(366),
              serviceDiscountBps: z.number().int().min(0).max(10000),
              discountCap: money,
              status: z.enum(["draft", "published", "archived"]),
            })
            .strict()
            .parse(d.payload);
          break;
        case "savePricingPolicy":
          require(["OWNER"]);
          collection = "settings";
          data = z
            .object({
              approved: z.boolean(),
              termsVersion: z.string().min(1).max(80),
              rates: z.object({
                USD: z.object({
                  numerator: z.number().int().positive().max(1e9),
                  denominator: z.number().int().positive().max(1e9),
                }),
                JPY: z.object({
                  numerator: z.number().int().positive().max(1e9),
                  denominator: z.number().int().positive().max(1e9),
                }),
                KRW: z.object({
                  numerator: z.number().int().positive().max(1e9),
                  denominator: z.number().int().positive().max(1e9),
                }),
              }),
              effectiveFrom: z.number().int().positive(),
              expiresAt: z.number().int().positive(),
            })
            .strict()
            .parse(d.payload);
          break;
        case "saveStaffAccess":
          require(["OWNER"]);
          if (
            process.env.FUNCTIONS_EMULATOR !== "true" &&
            !recentMfa(req.auth!.token, now)
          )
            throw new HttpsError(
              "failed-precondition",
              "Cần xác thực gần đây và hai lớp.",
              { reason: "RECENT_MFA_REQUIRED" },
            );
          if (d.id === uid) {
            const own = z
              .object({
                roles: z.array(z.string()),
                active: z.boolean(),
                locked: z.boolean(),
              })
              .passthrough()
              .parse(d.payload);
            if (!own.roles.includes("OWNER") || !own.active || own.locked)
              throw new HttpsError(
                "failed-precondition",
                "Không thể tự khóa hoặc gỡ quyền chủ doanh nghiệp của mình.",
              );
          }
          collection = "staffAccess";
          data = z
            .object({
              roles: z.array(z.enum(roles)).max(8),
              active: z.boolean(),
              locked: z.boolean(),
              orderIds: z
                .array(z.string().regex(/^[a-zA-Z0-9-]{1,80}$/))
                .max(100),
            })
            .strict()
            .parse(d.payload);
          break;
      }
    } catch (e) {
      if (e instanceof HttpsError) throw e;
      throw new HttpsError("invalid-argument", "Kiểm tra thông tin đã nhập.");
    }
    if (
      d.action === "savePricingPolicy" &&
      Number(data.expiresAt) <= Number(data.effectiveFrom)
    )
      throw new HttpsError(
        "invalid-argument",
        "Giờ hết hạn phải sau giờ áp dụng.",
      );
    const entityId =
      d.action === "saveProfile"
        ? uid
        : d.action === "saveAskPilotPolicy"
          ? "askPaidPilot"
          : d.action === "savePricingPolicy"
            ? "pricing"
            : id;
    if (d.action === "saveStaffAccess" && !d.id)
      throw new HttpsError("invalid-argument", "Cần định danh nhân viên.");
    const ref = db.doc(`${collection}/${entityId}`),
      old = await tx.get(ref);
    if (["openTicket"].includes(d.action) && old.exists)
      throw new HttpsError("already-exists", "Hội thoại đã tồn tại.");
    if (old.exists && old.data()?.version !== d.expectedVersion)
      throw new HttpsError("aborted", "Dữ liệu đã thay đổi. Tải lại.");
    const storedVersion = old.data()?.version;
    if (
      storedVersion !== undefined &&
      (!Number.isSafeInteger(storedVersion) ||
        storedVersion < 0 ||
        storedVersion >= Number.MAX_SAFE_INTEGER)
    )
      throw new HttpsError("aborted", "Dữ liệu đã thay đổi. Tải lại.");
    if (
      ["saveProfile", "saveAddress"].includes(d.action) &&
      old.exists &&
      old.data()?.ownerId !== uid
    )
      throw new HttpsError("permission-denied", "Không thể truy cập dữ liệu.");
    if (d.action === "saveContent") {
      let mediaRef;
      if (data.mediaId) {
        mediaRef = db.doc(`contentMedia/${data.mediaId}`);
        const media = await tx.get(mediaRef);
        if (
          !media.exists ||
          (media.data()?.contentId && media.data()?.contentId !== entityId)
        )
          throw new HttpsError(
            "failed-precondition",
            "Ảnh không tồn tại hoặc đã gắn với nội dung khác.",
          );
        data.mediaAlt = media.data()?.alt;
      }

      const slugRef = db.doc(`contentSlugs/${collection}-${data.slug}`),
        slug = await tx.get(slugRef);
      if (slug.exists && slug.data()?.contentId !== entityId)
        throw new HttpsError("already-exists", "Slug đã được sử dụng.");
      if (old.exists && old.data()?.slug !== data.slug)
        tx.delete(db.doc(`contentSlugs/${collection}-${old.data()?.slug}`));
      tx.set(slugRef, { contentId: entityId });
      if (mediaRef)
        tx.update(mediaRef, {
          contentId: entityId,
          contentKind: collection,
          status: "linked",
        });
      tx.create(ref.collection("versions").doc(), {
        ...data,
        createdAt: now,
        createdBy: uid,
        version: (old.data()?.version ?? 0) + 1,
      });
    }
    if (d.action === "replyTicket") {
      if (!old.exists)
        throw new HttpsError(
          "permission-denied",
          "Không thể truy cập hội thoại.",
        );
      if (old.data()?.ownerId !== uid)
        require(["OWNER", "SUPPORT", "OPERATIONS_MANAGER"]);
      tx.create(ref.collection("messages").doc(), {
        text: data.message,
        authorId: uid,
        createdAt: now,
      });
      if (old.data()?.ownerId !== uid)
        tx.create(db.collection("outboxJobs").doc(), {
          ownerId: old.data()!.ownerId,
          resourceId: entityId,
          action: "replyTicket",
          state: "queued",
          createdAt: now,
          ...customerEventFields(() =>
            customerEvent(
              "support_reply",
              {
                ownerId: old.data()!.ownerId,
                entityId,
                entityVersion: (old.data()?.version ?? 0) + 1,
                occurredAt: now,
              },
              { ticketRef: entityId },
            ),
          ),
        });
      data = { status: data.status };
    }
    if (d.action === "saveProfile") {
      data.searchName = normalizeCustomerName(String(data.displayName));
      const changed = old.data()?.marketingConsent !== data.marketingConsent;
      data.marketingConsentVersion = "profile-opt-in-v1";
      data.marketingConsentAt = changed
        ? now
        : (old.data()?.marketingConsentAt ?? now);
      if (changed)
        tx.create(ref.collection("consents").doc(), {
          enabled: data.marketingConsent,
          version: "profile-opt-in-v1",
          text: "Nhận nội dung quảng bá qua kênh đã cấu hình",
          actor: uid,
          createdAt: now,
        });
    }
    const version = (old.data()?.version ?? 0) + 1;
    if (d.action === "saveCampaign")
      tx.create(ref.collection("versions").doc(), {
        ...data,
        version,
        createdAt: now,
        createdBy: uid,
      });
    tx.set(
      ref,
      {
        ...data,
        version,
        createdAt: old.data()?.createdAt ?? now,
        changedAt: now,
        changedBy: uid,
      },
      { merge: !["saveContent", "saveCampaign"].includes(d.action) },
    );
    tx.create(db.collection("auditEvents").doc(), {
      actor: uid,
      action: d.action,
      resourceId: entityId,
      createdAt: now,
    });
    const result = { id: entityId, version };
    tx.create(op, { hash, result, createdAt: now });
    return result;
  });
});
export const readOwnerConfiguration = onCall(opts, async (req) => {
  requireVerifiedGoogle(req.auth);
  if (!req.auth?.uid)
    throw new HttpsError("unauthenticated", "Đăng nhập để tiếp tục.");
  const db = getFirestore(),
    [access, user, policy, pilot, budget] = await Promise.all([
      db.doc(`staffAccess/${req.auth.uid}`).get(),
      db.doc(`users/${req.auth.uid}`).get(),
      db.doc("settings/pricing").get(),
      db.doc("settings/askPaidPilot").get(),
      db.doc("aiPilotBudget/lifetime").get(),
    ]);
  if (
    access.data()?.active !== true ||
    access.data()?.locked ||
    user.data()?.locked ||
    !isStringRoleArray(access.data()?.roles) ||
    !access.data()?.roles?.includes("OWNER")
  )
    throw new HttpsError("permission-denied", "Cần quyền chủ doanh nghiệp.");
  const data = policy.data();
  return {
    askPilot: {
      enabled:
        pilot.data()?.enabled === true &&
        pilot.data()?.pilotUid === req.auth.uid &&
        Number(pilot.data()?.expiresAt) > Date.now(),
      version: pilot.data()?.version ?? null,
      ready: await verifyPilotProvider(),
      maxBudgetVnd: 10000,
      reservedVnd: !budget.exists
        ? 0
        : Number.isSafeInteger(budget.data()?.reservedVnd) &&
            budget.data()!.reservedVnd >= 0 &&
            budget.data()!.reservedVnd <= 10000
          ? budget.data()!.reservedVnd
          : null,
      expiresAt: pilot.data()?.expiresAt ?? null,
    },
    pricing: data
      ? {
          version: data.version,
          approved: data.approved,
          termsVersion: data.termsVersion,
          rates: data.rates,
          effectiveFrom: data.effectiveFrom,
          expiresAt: data.expiresAt,
        }
      : null,
  };
});
export const ticketMessages = onCall(opts, async (req) => {
  requireVerifiedGoogle(req.auth);
  if (!req.auth?.uid)
    throw new HttpsError("unauthenticated", "Đăng nhập để tiếp tục.");
  const id = z
    .string()
    .regex(/^[a-zA-Z0-9-]{1,80}$/)
    .safeParse(req.data?.id);
  if (!id.success)
    throw new HttpsError("invalid-argument", "Thông tin không hợp lệ.");
  const db = getFirestore(),
    [access, user, ticket] = await Promise.all([
      db.doc(`staffAccess/${req.auth.uid}`).get(),
      db.doc(`users/${req.auth.uid}`).get(),
      db.doc(`supportTickets/${id.data}`).get(),
    ]);
  if (
    user.data()?.locked ||
    access.data()?.locked ||
    !ticket.exists ||
    !(
      ticket.data()?.ownerId === req.auth.uid ||
      (access.data()?.active === true &&
        isStringRoleArray(access.data()?.roles) &&
        access
          .data()
          ?.roles?.some((r: string) =>
            ["OWNER", "SUPPORT", "OPERATIONS_MANAGER"].includes(r),
          ))
    )
  )
    throw new HttpsError("permission-denied", "Không thể truy cập hội thoại.");
  const messages = await ticket.ref
    .collection("messages")
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();
  return {
    messages: messages.docs
      .map((m) => ({
        id: m.id,
        text: m.data().text,
        createdAt: m.data().createdAt,
        fromCustomer: m.data().authorId === ticket.data()?.ownerId,
      }))
      .reverse(),
  };
});
export const readStaffAccess = onCall(opts, async (req) => {
  requireVerifiedGoogle(req.auth);
  if (!req.auth?.uid)
    throw new HttpsError("unauthenticated", "Đăng nhập để tiếp tục.");
  const id = z
    .string()
    .regex(/^[a-zA-Z0-9-]{1,128}$/)
    .safeParse(req.data?.id);
  if (!id.success)
    throw new HttpsError("invalid-argument", "Định danh không hợp lệ.");
  const db = getFirestore();
  return db.runTransaction(async (tx) => {
    const [access, user, target] = await Promise.all([
      tx.get(db.doc(`staffAccess/${req.auth!.uid}`)),
      tx.get(db.doc(`users/${req.auth!.uid}`)),
      tx.get(db.doc(`staffAccess/${id.data}`)),
    ]);
    if (
      access.data()?.active !== true ||
      access.data()?.locked ||
      user.data()?.locked ||
      !isStringRoleArray(access.data()?.roles) ||
      !access.data()?.roles?.includes("OWNER")
    )
      throw new HttpsError("permission-denied", "Cần quyền chủ doanh nghiệp.");
    const t = target.data();
    return {
      access: t
        ? {
            ...(t.version !== undefined ? { version: t.version } : {}),
            roles: t.roles,
            ...(t.active !== undefined ? { active: t.active } : {}),
            ...(t.locked !== undefined ? { locked: t.locked } : {}),
            orderIds: t.orderIds ?? [],
          }
        : null,
    };
  });
});
export const readOrderOperations = onCall(opts, async (req) => {
  const uid = requireVerifiedGoogle(req.auth);
  const parsed = z
    .object({ orderId: z.string().regex(/^[a-zA-Z0-9-]{1,80}$/) })
    .strict()
    .safeParse(req.data);
  if (!parsed.success)
    throw new HttpsError("invalid-argument", "Mã đơn chưa hợp lệ.");
  const id = parsed.data.orderId,
    db = getFirestore();
  return db.runTransaction(async (tx) => {
    const [staff, user, order, operations] = await Promise.all([
      tx.get(db.doc(`staffAccess/${uid}`)),
      tx.get(db.doc(`users/${uid}`)),
      tx.get(db.doc(`orders/${id}`)),
      tx.get(db.doc(`orderOperations/${id}`)),
    ]);
    const rs: Role[] = isStringRoleArray(staff.data()?.roles)
        ? staff.data()!.roles
        : [],
      manager = rs.some((r) => ["OWNER", "OPERATIONS_MANAGER"].includes(r)),
      buyer =
        rs.includes("BUYER") &&
        Array.isArray(staff.data()?.orderIds) &&
        staff.data()!.orderIds.includes(id);
    if (
      staff.data()?.active !== true ||
      staff.data()?.locked ||
      user.data()?.locked ||
      !order.exists ||
      !(manager || buyer || rs.includes("WAREHOUSE"))
    )
      throw new HttpsError(
        "permission-denied",
        "Không có quyền xem dữ liệu nhận kho của đơn.",
      );
    const data = operations.data();
    return {
      recipient:
        manager || rs.includes("WAREHOUSE") ? (data?.recipient ?? null) : null,
      receiving: data?.receive
        ? {
            quantity: data.receive.quantity,
            condition: data.receive.condition,
            shelf: data.receive.shelf ?? "",
            changedAt: data.changedAt,
          }
        : null,
      packing: data?.pack
        ? {
            weightGrams: data.pack.weightGrams,
            dimensionsCm: data.pack.dimensionsCm,
            checklist: data.pack.checklist,
          }
        : null,
      purchase:
        (manager || buyer) && data?.recordPurchase
          ? {
              supplierOrder: data.recordPurchase.supplierOrder,
              quantity: data.recordPurchase.quantity,
              actualSourceMinor: data.recordPurchase.actualSourceMinor,
            }
          : null,
    };
  });
});

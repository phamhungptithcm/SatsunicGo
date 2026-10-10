import { requireLivePurchaseRecord } from "./purchase-test-boundary";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import type { Order } from "../../packages/domain";
import {
  documentSnapshot,
  sellerSchema,
  type SalesDocument,
} from "../../packages/domain/invoices";
import {
  isStringRoleArray,
  recentMfa,
  requireVerifiedGoogle,
} from "./auth/guards";
const opts = {
  region: "asia-southeast1",
  maxInstances: 3,
  concurrency: 20,
  enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
};
const idSchema = z.string().regex(/^[a-zA-Z0-9-]{1,80}$/);
const schema = z
  .object({
    action: z.enum([
      "configure",
      "createDraft",
      "refreshDraft",
      "issue",
      "void",
      "createShare",
      "revokeShare",
      "queueEmail",
    ]),
    operationId: z.string().uuid(),
    id: idSchema.optional(),
    orderId: idSchema.optional(),
    replacesId: idSchema.optional(),
    expectedVersion: z.number().int().positive().optional(),
    seller: sellerSchema.optional(),
    reason: z.string().trim().min(5).max(500).optional(),
  })
  .strict();
export const invoiceCommand = onCall(opts, async (req) => {
  const uid = requireVerifiedGoogle(req.auth),
    parsed = schema.safeParse(req.data);
  if (!parsed.success)
    throw new HttpsError("invalid-argument", "Thông tin chứng từ chưa hợp lệ.");
  const d = parsed.data,
    db = getFirestore(),
    now = Date.now(),
    ref = db.doc(`salesDocuments/${d.id ?? randomUUID()}`),
    op = db.doc(`idempotencyKeys/${uid}-${d.operationId}`),
    configRef = db.doc("settings/invoiceSeller");
  const hash = createHash("sha256").update(JSON.stringify(d)).digest("hex");
  const shareToken = randomBytes(32).toString("hex"),
    shareHash = createHash("sha256").update(shareToken).digest("hex");
  return db.runTransaction(async (tx) => {
    const [user, access, prior, document, config] = await Promise.all([
      tx.get(db.doc(`users/${uid}`)),
      tx.get(db.doc(`staffAccess/${uid}`)),
      tx.get(op),
      tx.get(ref),
      tx.get(configRef),
    ]);
    const roles = access.data()?.roles ?? [];
    if (
      user.data()?.locked ||
      access.data()?.active !== true ||
      !isStringRoleArray(roles) ||
      access.data()?.locked ||
      !roles.some((r: string) => ["OWNER", "FINANCE"].includes(r))
    )
      throw new HttpsError(
        "permission-denied",
        "Cần quyền chủ doanh nghiệp hoặc tài chính.",
      );
    if (
      ["configure", "issue", "void", "createShare", "queueEmail"].includes(
        d.action,
      ) &&
      process.env.FUNCTIONS_EMULATOR !== "true" &&
      !recentMfa(req.auth!.token, now)
    )
      throw new HttpsError(
        "permission-denied",
        "Xác thực hai bước gần đây để xử lý chứng từ.",
        { reason: "RECENT_MFA_REQUIRED" },
      );
    if (prior.exists) {
      if (prior.data()?.hash !== hash)
        throw new HttpsError("already-exists", "Mã thao tác đã dùng.");
      return prior.data()?.result;
    }
    let result: Record<string, unknown> = { id: ref.id },
      data = document.data() as SalesDocument | undefined;
    let tokenToReturn: string | undefined;
    requireLivePurchaseRecord(data);
    if (d.action === "configure") {
      if (!roles.includes("OWNER") || !d.seller)
        throw new HttpsError(
          "permission-denied",
          "Chủ doanh nghiệp cấu hình thông tin người bán.",
        );
      if (config.exists && config.data()?.version !== d.expectedVersion)
        throw new HttpsError("aborted", "Thông tin người bán đã thay đổi.");
      tx.set(configRef, {
        seller: d.seller,
        version: (config.data()?.version ?? 0) + 1,
        changedAt: now,
      });
      result = { version: (config.data()?.version ?? 0) + 1 };
    } else if (d.action === "createDraft" || d.action === "refreshDraft") {
      if (
        d.action === "createDraft" &&
        (!d.orderId || d.id || d.expectedVersion)
      )
        throw new HttpsError("invalid-argument", "Chọn đơn để tạo chứng từ.");
      if (
        d.action === "refreshDraft" &&
        (!d.id ||
          !data ||
          data.state !== "draft" ||
          data.version !== d.expectedVersion)
      )
        throw new HttpsError("aborted", "Bản nháp đã thay đổi hoặc đã xuất.");
      const orderId =
        d.action === "createDraft" ? d.orderId! : data!.sourceOrderId;
      const orderSnap = await tx.get(db.doc(`orders/${orderId}`)),
        order = orderSnap.data() as Order | undefined;
      if (!order) throw new HttpsError("not-found", "Không tìm thấy đơn.");
      requireLivePurchaseRecord(order);
      const buyer = await tx.get(db.doc(`users/${order.ownerId}`));
      const replacesId =
        d.action === "createDraft" ? d.replacesId : data?.replacesId;
      if (replacesId) {
        const previous = await tx.get(db.doc(`salesDocuments/${replacesId}`));
        if (
          !previous.exists ||
          previous.data()?.state === "draft" ||
          previous.data()?.sourceOrderId !== orderId ||
          previous.data()?.ownerId !== order.ownerId
        )
          throw new HttpsError(
            "failed-precondition",
            "Bản thay thế phải cùng đơn và chủ đơn với chứng từ đã xuất.",
          );
      }
      let snapshot;
      try {
        snapshot = documentSnapshot(
          order,
          sellerSchema.parse(config.data()?.seller),
          String(buyer.data()?.displayName ?? "Khách hàng"),
        );
      } catch {
        throw new HttpsError(
          "failed-precondition",
          "Cần thông tin người bán và tổng cuối đã được khách duyệt trước khi tạo chứng từ.",
        );
      }
      data = {
        ...snapshot,
        id: ref.id,
        ownerId: order.ownerId,
        sourceOrderId: orderId,
        sourceVersion: order.version,
        ...(replacesId ? { replacesId } : {}),
        sellerVersion: config.data()!.version,
        version: (data?.version ?? 0) + 1,
        state: "draft",
        kind: "internal_statement",
        currency: "VND",
        createdAt: data?.createdAt ?? now,
        changedAt: now,
        shareEpoch: 0,
      };
      tx.set(ref, data);
      result = { id: ref.id, version: data.version };
    } else {
      if (!d.id || !data || data.version !== d.expectedVersion)
        throw new HttpsError("aborted", "Chứng từ đã thay đổi. Tải lại.");
      // Re-read the authoritative order for every mutation; old documents may
      // predate execution markers. Test receipts use the purchase PDF path.
      const sourceOrder = await tx.get(db.doc(`orders/${data.sourceOrderId}`));
      if (!sourceOrder.exists)
        throw new HttpsError("not-found", "Không tìm thấy đơn.");
      requireLivePurchaseRecord(sourceOrder.data());
      if (d.action === "issue") {
        if (data.state !== "draft")
          throw new HttpsError("failed-precondition", "Chỉ xuất bản nháp.");
        const counter = await tx.get(
          db.doc("documentCounters/internalStatements"),
        );
        if (
          sourceOrder.data()?.version !== data.sourceVersion ||
          config.data()?.version !== data.sellerVersion
        )
          throw new HttpsError(
            "aborted",
            "Nguồn đơn hoặc người bán thay đổi. Cập nhật bản nháp trước khi xuất.",
          );
        const next = (counter.data()?.value ?? 0) + 1;
        if (!Number.isSafeInteger(next) || next > 1e12)
          throw new HttpsError(
            "resource-exhausted",
            "Chưa cấp được số chứng từ.",
          );
        tx.set(db.doc("documentCounters/internalStatements"), { value: next });
        tx.update(ref, {
          state: "issued",
          issueNumber: `SG-${String(next).padStart(8, "0")}`,
          issuedAt: now,
          changedAt: now,
          version: data.version + 1,
        });
      } else if (d.action === "void") {
        if (data.state !== "issued" || !d.reason)
          throw new HttpsError(
            "failed-precondition",
            "Cần chứng từ đã xuất và lý do hủy.",
          );
        tx.update(ref, {
          state: "void",
          voidReason: d.reason,
          voidedAt: now,
          changedAt: now,
          shareEpoch: data.shareEpoch + 1,
          version: data.version + 1,
        });
      } else if (d.action === "revokeShare") {
        tx.update(ref, {
          shareEpoch: data.shareEpoch + 1,
          changedAt: now,
          version: data.version + 1,
        });
      } else {
        if (data.state !== "issued")
          throw new HttpsError(
            "failed-precondition",
            "Chỉ chia sẻ/gửi chứng từ đã xuất.",
          );
        const owner = await tx.get(db.doc(`users/${data.ownerId}`));
        if (owner.data()?.locked)
          throw new HttpsError(
            "failed-precondition",
            "Tài khoản khách đang bị khóa.",
          );
        if (d.action === "createShare") {
          const expiresAt = now + 86400000,
            epoch = data.shareEpoch + 1;
          tx.create(db.doc(`salesDocumentShares/${shareHash}`), {
            documentId: ref.id,
            epoch,
            expiresAt,
          });
          tx.update(ref, {
            shareEpoch: epoch,
            changedAt: now,
            version: data.version + 1,
          });
          result = { id: ref.id, version: data.version + 1, expiresAt };
          tokenToReturn = shareToken;
        } else if (d.action === "queueEmail") {
          const emailConfig = await tx.get(db.doc("settings/email"));
          if (emailConfig.data()?.enabled !== true)
            throw new HttpsError(
              "failed-precondition",
              "Email chưa được cấu hình. Chưa xếp lịch gửi.",
            );
          tx.create(db.doc(`outboxJobs/invoice-${d.operationId}`), {
            ownerId: data.ownerId,
            orderId: data.sourceOrderId,
            documentId: ref.id,
            documentNumber: data.issueNumber,
            action: "invoiceIssued",
            state: "queued",
            emailState: "queued",
            emailAttempts: 0,
            createdAt: now,
          });
          tx.update(ref, { changedAt: now, version: data.version + 1 });
          result = { id: ref.id, version: data.version + 1, queued: true };
        }
      }
      if (!("version" in result))
        result = { id: ref.id, version: data.version + 1 };
    }
    // Capability secrets never enter operation result, audit, outbox or persistent logs.
    tx.create(op, { hash, result, createdAt: now });
    tx.create(db.collection("auditEvents").doc(), {
      actor: uid,
      action: `invoice:${d.action}`,
      resourceId: ref.id,
      createdAt: now,
    });
    return tokenToReturn ? { ...result, token: tokenToReturn } : result;
  });
});
export const invoiceList = onCall(opts, async (req) => {
  const uid = requireVerifiedGoogle(req.auth),
    d = z
      .object({ after: idSchema.optional(), orderId: idSchema.optional() })
      .strict()
      .safeParse(req.data);
  if (!d.success)
    throw new HttpsError("invalid-argument", "Bộ lọc chưa hợp lệ.");
  const db = getFirestore();
  return db.runTransaction(async (tx) => {
    const [user, access, config] = await Promise.all([
      tx.get(db.doc(`users/${uid}`)),
      tx.get(db.doc(`staffAccess/${uid}`)),
      tx.get(db.doc("settings/invoiceSeller")),
    ]);
    if (user.data()?.locked || access.data()?.locked)
      throw new HttpsError("permission-denied", "Tài khoản đang bị khóa.");
    const staff =
      access.data()?.active === true &&
      isStringRoleArray(access.data()?.roles) &&
      access
        .data()
        ?.roles?.some((r: string) =>
          ["OWNER", "FINANCE", "SUPPORT"].includes(r),
        );
    let q = db.collection("salesDocuments").orderBy("__name__").limit(30);
    if (!staff) q = q.where("ownerId", "==", uid);
    if (d.data.orderId) q = q.where("sourceOrderId", "==", d.data.orderId);
    if (d.data.after) q = q.startAfter(d.data.after);
    const rows = await tx.get(q);
    return {
      rows: rows.docs
        .map((s) => s.data() as SalesDocument)
        .filter((s) => staff || s.state !== "draft"),
      next: rows.size === 30 ? rows.docs.at(-1)!.id : null,
      canIssue: !!(
        staff &&
        access
          .data()
          ?.roles?.some((r: string) => ["OWNER", "FINANCE"].includes(r))
      ),
      canConfigure: !!(staff && access.data()?.roles?.includes("OWNER")),
      seller: staff ? (config.data() ?? null) : null,
    };
  });
});
export const invoiceDetail = onCall(opts, async (req) => {
  const uid = requireVerifiedGoogle(req.auth),
    d = z.object({ id: idSchema }).strict().safeParse(req.data);
  if (!d.success)
    throw new HttpsError("invalid-argument", "Mã chứng từ chưa hợp lệ.");
  const db = getFirestore();
  return db.runTransaction(async (tx) => {
    const [user, access, document] = await Promise.all([
      tx.get(db.doc(`users/${uid}`)),
      tx.get(db.doc(`staffAccess/${uid}`)),
      tx.get(db.doc(`salesDocuments/${d.data.id}`)),
    ]);
    const data = document.data() as SalesDocument | undefined,
      staff =
        access.data()?.active === true &&
        !access.data()?.locked &&
        isStringRoleArray(access.data()?.roles) &&
        access
          .data()
          ?.roles?.some((r: string) =>
            ["OWNER", "FINANCE", "SUPPORT"].includes(r),
          );
    if (
      user.data()?.locked ||
      access.data()?.locked ||
      !data ||
      !(staff || (data.ownerId === uid && data.state !== "draft"))
    )
      throw new HttpsError("permission-denied", "Không có quyền xem chứng từ.");
    return data;
  });
});

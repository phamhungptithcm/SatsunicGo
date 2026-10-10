import { purchaseAmount, type Order } from "../../packages/domain";
import { purchaseTestProjection } from "./purchase-test-projection";
import { purchaseTestRecord } from "../../packages/domain/purchase-checkout";
import { requireVerifiedGoogle } from "./auth/guards";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { randomUUID, createHash } from "node:crypto";
import { z } from "zod";
import { FieldPath } from "firebase-admin/firestore";
import {
  crmRoles,
  customerId,
  customerNotesSchema,
  normalizeCustomerName,
} from "../../packages/domain/crm";
const opts = {
  region: "asia-southeast1",
  maxInstances: 2,
  concurrency: 8,
  enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
};
const cursor = z
  .object({
    id: customerId,
    name: z.string().max(160).optional(),
    at: z.number().int().nonnegative().optional(),
  })
  .strict();
function customerSummary(
  id: string,
  user: FirebaseFirestore.DocumentData | undefined,
  crm: FirebaseFirestore.DocumentData | undefined,
) {
  return {
    id,
    displayName: user?.displayName ?? "",
    businessName: user?.businessName ?? "",
    tags: crm?.tags ?? [],
    assigneeId: crm?.assigneeId ?? "",
    followUpAt: crm?.followUpAt ?? 0,
  };
}

export const listCustomers = onCall(opts, async (req) => {
  requireVerifiedGoogle(req.auth);
  if (!req.auth?.uid)
    throw new HttpsError("unauthenticated", "Đăng nhập để tiếp tục.");
  const p = z
    .object({
      search: z.string().trim().max(128).default(""),
      mode: z.enum(["name", "id"]).default("name"),
      after: cursor.optional(),
    })
    .strict()
    .refine((input) => input.mode === "id" || input.search.length <= 120)
    .safeParse(req.data);
  if (!p.success)
    throw new HttpsError(
      "invalid-argument",
      "Thông tin tìm kiếm không hợp lệ.",
    );
  const db = getFirestore();
  return db.runTransaction(async (tx) => {
    await authorize(tx, req.auth!.uid);
    if (p.data.mode === "id") {
      if (!customerId.safeParse(p.data.search).success)
        return { rows: [], next: null };
      const [u, c] = await Promise.all([
        tx.get(db.doc(`users/${p.data.search}`)),
        tx.get(db.doc(`crmCustomers/${p.data.search}`)),
      ]);
      return {
        rows: u.exists ? [customerSummary(u.id, u.data(), c.data())] : [],
        next: null,
      };
    }
    const name = normalizeCustomerName(p.data.search);
    let q: FirebaseFirestore.Query = db.collection("users");
    if (name)
      q = q
        .where("searchName", ">=", name)
        .where("searchName", "<=", `${name}\uf8ff`)
        .orderBy("searchName");
    q = q.orderBy(FieldPath.documentId()).limit(31);
    if (p.data.after) {
      if (name && p.data.after.name === undefined)
        throw new HttpsError(
          "invalid-argument",
          "Tải lại danh sách để tìm kiếm.",
        );
      q = name
        ? q.startAfter(p.data.after.name, p.data.after.id)
        : q.startAfter(p.data.after.id);
    }
    const users = await tx.get(q);
    const page = users.docs.slice(0, 30);
    const notes = await Promise.all(
      page.map((u) => tx.get(db.doc(`crmCustomers/${u.id}`))),
    );
    const last = page.at(-1);
    return {
      rows: page.map((u, i) =>
        customerSummary(u.id, u.data(), notes[i].data()),
      ),
      next:
        users.size > 30 && last
          ? { id: last.id, ...(name ? { name: last.data().searchName } : {}) }
          : null,
    };
  });
});

export const listFollowUps = onCall(opts, async (req) => {
  requireVerifiedGoogle(req.auth);
  if (!req.auth?.uid)
    throw new HttpsError("unauthenticated", "Đăng nhập để tiếp tục.");
  const p = z
    .object({
      mode: z.enum(["overdue", "upcoming", "all"]).default("overdue"),
      assigneeId: customerId.optional(),
      asOf: z.number().int().positive().optional(),
      after: cursor.optional(),
    })
    .strict()
    .safeParse(req.data);
  if (!p.success || (p.data.asOf ?? 0) > Date.now() + 60000)
    throw new HttpsError("invalid-argument", "Bộ lọc không hợp lệ.");
  const db = getFirestore(),
    asOf = p.data.asOf ?? Date.now();
  return db.runTransaction(async (tx) => {
    await authorize(tx, req.auth!.uid);
    let q = db
      .collection("crmCustomers")
      .where("followUpAt", ">", p.data.mode === "upcoming" ? asOf : 0);
    if (p.data.mode === "overdue") q = q.where("followUpAt", "<=", asOf);
    if (p.data.mode === "upcoming")
      q = q.where("followUpAt", "<=", asOf + 7 * 86400000);
    if (p.data.assigneeId) q = q.where("assigneeId", "==", p.data.assigneeId);
    q = q.orderBy("followUpAt").orderBy(FieldPath.documentId()).limit(31);
    if (p.data.after) {
      if (p.data.after.at === undefined)
        throw new HttpsError("invalid-argument", "Tải lại lịch theo dõi.");
      q = q.startAfter(p.data.after.at, p.data.after.id);
    }
    const notes = await tx.get(q),
      page = notes.docs.slice(0, 30);
    const users = await Promise.all(
      page.map((c) => tx.get(db.doc(`users/${c.id}`))),
    );
    const last = page.at(-1);
    return {
      rows: page.map((c, i) =>
        customerSummary(c.id, users[i].data(), c.data()),
      ),
      asOf,
      next:
        notes.size > 30 && last
          ? { id: last.id, at: last.data().followUpAt }
          : null,
    };
  });
});

export const listCrmStaff = onCall(opts, async (req) => {
  requireVerifiedGoogle(req.auth);
  if (!req.auth?.uid)
    throw new HttpsError("unauthenticated", "Đăng nhập để tiếp tục.");
  const p = z
    .object({ after: customerId.optional() })
    .strict()
    .safeParse(req.data);
  if (!p.success) throw new HttpsError("invalid-argument", "Không hợp lệ.");
  const db = getFirestore();
  return db.runTransaction(async (tx) => {
    await authorize(tx, req.auth!.uid);
    let q = db
      .collection("staffAccess")
      .where("active", "==", true)
      .where("roles", "array-contains-any", [...crmRoles])
      .orderBy(FieldPath.documentId())
      .limit(31);
    if (p.data.after) q = q.startAfter(p.data.after);
    const staff = await tx.get(q),
      page = staff.docs.slice(0, 30);
    const users = await Promise.all(
      page.map((a) => tx.get(db.doc(`users/${a.id}`))),
    );
    return {
      rows: page
        .filter(
          (a, i) =>
            !a.data().locked &&
            !users[i].data()?.locked &&
            Array.isArray(a.data().roles) &&
            a.data().roles.every((role: unknown) => typeof role === "string"),
        )
        .map((a) => ({
          id: a.id,
          displayName: users[page.indexOf(a)].data()?.displayName || a.id,
        })),
      next: staff.size > 30 ? page.at(-1)?.id : null,
    };
  });
});
async function authorize(tx: FirebaseFirestore.Transaction, uid: string) {
  const db = getFirestore();
  const [a, u] = await Promise.all([
    tx.get(db.doc(`staffAccess/${uid}`)),
    tx.get(db.doc(`users/${uid}`)),
  ]);
  if (
    a.data()?.active !== true ||
    a.data()?.locked ||
    u.data()?.locked ||
    !Array.isArray(a.data()?.roles) ||
    !a.data()?.roles.every((role: unknown) => typeof role === "string") ||
    !a
      .data()
      ?.roles?.some((r: string) => (crmRoles as readonly string[]).includes(r))
  )
    throw new HttpsError("permission-denied", "Cần quyền quản lý khách hàng.");
}
export const readCustomer = onCall(opts, async (req) => {
  requireVerifiedGoogle(req.auth);
  if (!req.auth?.uid)
    throw new HttpsError("unauthenticated", "Đăng nhập để tiếp tục.");
  const parsed = z
    .object({
      id: customerId,
      ordersAfter: z
        .object({ createdAt: z.number().int().nonnegative(), id: customerId })
        .strict()
        .optional(),
      ticketsAfter: z
        .object({ createdAt: z.number().int().nonnegative(), id: customerId })
        .strict()
        .optional(),
    })
    .strict()
    .safeParse(req.data);
  if (!parsed.success)
    throw new HttpsError("invalid-argument", "Định danh không hợp lệ.");
  const id = { data: parsed.data.id };
  const db = getFirestore();
  return db.runTransaction(async (tx) => {
    await authorize(tx, req.auth!.uid);
    const pageQuery = (
      kind: string,
      after?: { createdAt: number; id: string },
    ) => {
      let q = db
        .collection(kind)
        .where("ownerId", "==", id.data)
        .orderBy("createdAt", "desc")
        .orderBy(FieldPath.documentId(), "desc")
        .limit(31);
      if (after) q = q.startAfter(after.createdAt, after.id);
      return q;
    };
    const [user, crm, member, orders, tickets] = await Promise.all([
      tx.get(db.doc(`users/${id.data}`)),
      tx.get(db.doc(`crmCustomers/${id.data}`)),
      tx.get(db.doc(`membershipSubscriptions/${id.data}`)),
      tx.get(pageQuery("orders", parsed.data.ordersAfter)),
      tx.get(pageQuery("supportTickets", parsed.data.ticketsAfter)),
    ]);
    const u = user.data();
    const subscription = member.data();
    let membership = subscription
      ? { state: subscription.state, endsAt: subscription.endsAt }
      : null;
    if (membership?.state === "active") {
      // Match membershipTerm's numeric-string compatibility, while rejecting
      // malformed dates in this read projection. Stored state is unchanged.
      const raw = membership.endsAt;
      const endsAt =
        typeof raw === "number" ||
        (typeof raw === "string" && raw.trim() !== "")
          ? Number(raw)
          : NaN;
      membership =
        Number.isSafeInteger(endsAt) && endsAt > 0 && endsAt <= 8640000000000000
          ? { state: endsAt <= Date.now() ? "expired" : "active", endsAt }
          : { state: "unknown", endsAt: 0 };
    }
    return {
      profile: u
        ? {
            displayName: u.displayName ?? "",
            businessName: u.businessName ?? "",
            marketingConsent: u.marketingConsent === true,
          }
        : null,
      crm: crm.data() ?? null,
      membership,
      orders: orders.docs.slice(0, 30).map((d) => ({
        id: d.id,
        ...purchaseTestProjection(d.data()),
        stage: d.data().stage,
        createdAt: d.data().createdAt,
        hold: !!d.data().hold,
        remaining:
          d.data().finalTotal === undefined
            ? null
            : Math.max(
                0,
                (d.data().finalTotal ?? 0) -
                  d.data().collected +
                  d.data().refunded,
              ),
        name: d.data().items?.[0]?.name ?? "Đơn mua hộ",
      })),
      tickets: tickets.docs.slice(0, 30).map((d) => ({
        id: d.id,
        subject: d.data().subject,
        status: d.data().status,
      })),
      ordersNext:
        orders.size > 30
          ? {
              id: orders.docs[29].id,
              createdAt: orders.docs[29].data().createdAt,
            }
          : null,
      ticketsNext:
        tickets.size > 30
          ? {
              id: tickets.docs[29].id,
              createdAt: tickets.docs[29].data().createdAt,
            }
          : null,
      limit: 30,
    };
  });
});
export const saveCustomerNotes = onCall(opts, async (req) => {
  requireVerifiedGoogle(req.auth);
  if (!req.auth?.uid)
    throw new HttpsError("unauthenticated", "Đăng nhập để tiếp tục.");
  const p = customerNotesSchema.safeParse(req.data);
  if (!p.success)
    throw new HttpsError("invalid-argument", "Thông tin không hợp lệ.");
  const db = getFirestore(),
    d = p.data,
    uid = req.auth.uid,
    hash = createHash("sha256").update(JSON.stringify(d)).digest("hex");
  return db.runTransaction(async (tx) => {
    await authorize(tx, uid);
    const ref = db.doc(`crmCustomers/${d.id}`),
      op = db.doc(`idempotencyKeys/${uid}-${d.operationId}`);
    const [old, previous] = await Promise.all([tx.get(ref), tx.get(op)]);
    if (previous.exists) {
      if (previous.data()?.hash !== hash)
        throw new HttpsError("already-exists", "Mã thao tác đã dùng.");
      return previous.data()?.result;
    }
    const storedVersion = old.data()?.version;
    if (
      old.exists &&
      (!Number.isSafeInteger(storedVersion) ||
        storedVersion <= 0 ||
        storedVersion >= Number.MAX_SAFE_INTEGER)
    )
      throw new HttpsError("aborted", "Hồ sơ đã thay đổi. Tải lại.");
    if (
      old.exists
        ? old.data()?.version !== d.expectedVersion
        : d.expectedVersion !== undefined
    )
      throw new HttpsError("aborted", "Hồ sơ đã thay đổi. Tải lại.");
    const customer = await tx.get(db.doc(`users/${d.id}`));
    if (!customer.exists)
      throw new HttpsError("failed-precondition", "Chưa có hồ sơ khách hàng.");
    if (d.assigneeId) {
      const [a, assignee] = await Promise.all([
        tx.get(db.doc(`staffAccess/${d.assigneeId}`)),
        tx.get(db.doc(`users/${d.assigneeId}`)),
      ]);
      if (
        a.data()?.active !== true ||
        a.data()?.locked ||
        assignee.data()?.locked ||
        !Array.isArray(a.data()?.roles) ||
        !a.data()?.roles.every((role: unknown) => typeof role === "string") ||
        !a
          .data()
          ?.roles?.some((r: string) =>
            (crmRoles as readonly string[]).includes(r),
          )
      )
        throw new HttpsError(
          "failed-precondition",
          "Nhân viên phụ trách chưa có quyền hoạt động.",
        );
    }
    const version = (old.data()?.version ?? 0) + 1;
    tx.set(ref, {
      tags: d.tags,
      notes: d.notes,
      assigneeId: d.assigneeId,
      followUpAt: d.followUpAt,
      version,
      changedAt: Date.now(),
      changedBy: uid,
    });
    tx.create(db.collection("auditEvents").doc(randomUUID()), {
      action: "saveCustomerNotes",
      resourceId: d.id,
      actor: uid,
      correlationId: d.operationId,
      createdAt: Date.now(),
    });
    const result = { version };
    tx.create(op, { hash, result, createdAt: Date.now() });
    return result;
  });
});
export const operationalDashboard = onCall(opts, async (req) => {
  requireVerifiedGoogle(req.auth);
  if (!req.auth?.uid)
    throw new HttpsError("unauthenticated", "Đăng nhập để tiếp tục.");
  const period = z
    .object({
      from: z.number().int().positive(),
      until: z.number().int().positive(),
    })
    .strict()
    .safeParse(req.data);
  if (
    !period.success ||
    period.data.until <= period.data.from ||
    period.data.until - period.data.from > 31 * 86400000 ||
    period.data.until > Date.now() + 60000
  )
    throw new HttpsError(
      "invalid-argument",
      "Chọn khoảng thời gian tối đa 31 ngày, không vượt hiện tại.",
    );
  const db = getFirestore();
  return db.runTransaction(async (tx) => {
    const [a, u] = await Promise.all([
      tx.get(db.doc(`staffAccess/${req.auth!.uid}`)),
      tx.get(db.doc(`users/${req.auth!.uid}`)),
    ]);
    if (
      a.data()?.active !== true ||
      a.data()?.locked ||
      u.data()?.locked ||
      !Array.isArray(a.data()?.roles) ||
      !a.data()?.roles.every((role: unknown) => typeof role === "string") ||
      !a
        .data()
        ?.roles?.some((r: string) =>
          ["OWNER", "OPERATIONS_MANAGER"].includes(r),
        )
    )
      throw new HttpsError("permission-denied", "Cần quyền quản lý vận hành.");
    const kinds = [
      "orders",
      "supportTickets",
      "transferReviews",
      "paymentExceptions",
    ];
    const snapshots = await Promise.all(
      kinds.map((kind) =>
        tx.get(
          db
            .collection(kind)
            .where("createdAt", ">=", period.data.from)
            .where("createdAt", "<=", period.data.until)
            .orderBy("createdAt", "desc")
            .limit(100),
        ),
      ),
    );
    const orders = snapshots[0].docs
      .filter((d) => !purchaseTestRecord(d.data()))
      .map((d) => d.data() as Order);
    const counts = {
      requests: orders.filter((o) => o.stage === "REQUESTED").length,
      quotes: orders.filter((o) => o.stage === "QUOTED").length,
      purchasing: orders.filter(
        (o) =>
          ["QUOTE_ACCEPTED", "PURCHASING"].includes(o.stage) &&
          o.collected - o.refunded - (o.refundReserved ?? 0) >=
            purchaseAmount(o) &&
          !o.hold,
      ).length,
      holds: orders.filter((o) => !!o.hold).length,
      balance: orders.filter(
        (o) =>
          o.finalApproved &&
          o.finalTotal !== undefined &&
          o.finalTotal > o.collected - o.refunded,
      ).length,
      ready: orders.filter(
        (o) =>
          o.stage === "READY_TO_SHIP" &&
          !o.hold &&
          o.finalApproved &&
          o.finalTotal !== undefined &&
          o.collected - o.refunded - (o.refundReserved ?? 0) >= o.finalTotal,
      ).length,
      tickets: snapshots[1].docs.filter(
        (d) => !purchaseTestRecord(d.data()) && d.data().status !== "resolved",
      ).length,
      transfers: snapshots[2].docs.filter(
        (d) => !purchaseTestRecord(d.data()) && d.data().status === "pending",
      ).length,
      exceptions: snapshots[3].docs.filter(
        (d) => !purchaseTestRecord(d.data()) && d.data().state === "open",
      ).length,
    };
    return {
      counts,
      from: period.data.from,
      until: period.data.until,
      observedAt: Date.now(),
      timezone: "UTC",
      limitPerKind: 100,
      truncated: kinds.filter((_, i) => snapshots[i].size === 100),
      basis:
        "Records created in the selected period; bounded sample, not global totals",
    };
  });
});

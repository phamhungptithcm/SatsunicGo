import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { randomUUID, createHash } from "node:crypto";
import { z } from "zod";
const opts = {
  region: "asia-southeast1",
  maxInstances: 2,
  concurrency: 8,
  enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
};
async function authorize(tx: FirebaseFirestore.Transaction, uid: string) {
  const db = getFirestore();
  const [a, u] = await Promise.all([
    tx.get(db.doc(`staffAccess/${uid}`)),
    tx.get(db.doc(`users/${uid}`)),
  ]);
  if (
    !a.data()?.active ||
    a.data()?.locked ||
    u.data()?.locked ||
    !a
      .data()
      ?.roles?.some((r: string) =>
        ["OWNER", "SUPPORT", "OPERATIONS_MANAGER"].includes(r),
      )
  )
    throw new HttpsError("permission-denied", "Cần quyền quản lý khách hàng.");
}
export const readCustomer = onCall(opts, async (req) => {
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
    await authorize(tx, req.auth!.uid);
    const [user, crm, member, orders, tickets] = await Promise.all([
      tx.get(db.doc(`users/${id.data}`)),
      tx.get(db.doc(`crmCustomers/${id.data}`)),
      tx.get(db.doc(`membershipSubscriptions/${id.data}`)),
      tx.get(db.collection("orders").where("ownerId", "==", id.data).limit(30)),
      tx.get(
        db
          .collection("supportTickets")
          .where("ownerId", "==", id.data)
          .limit(30),
      ),
    ]);
    const u = user.data();
    return {
      profile: u
        ? {
            displayName: u.displayName ?? "",
            businessName: u.businessName ?? "",
            marketingConsent: u.marketingConsent === true,
          }
        : null,
      crm: crm.data() ?? null,
      membership: member.data()
        ? { state: member.data()?.state, endsAt: member.data()?.endsAt }
        : null,
      orders: orders.docs.map((d) => ({
        id: d.id,
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
      })),
      tickets: tickets.docs.map((d) => ({
        id: d.id,
        subject: d.data().subject,
        status: d.data().status,
      })),
      limit: 30,
    };
  });
});
export const saveCustomerNotes = onCall(opts, async (req) => {
  if (!req.auth?.uid)
    throw new HttpsError("unauthenticated", "Đăng nhập để tiếp tục.");
  const p = z
    .object({
      id: z.string().regex(/^[a-zA-Z0-9-]{1,128}$/),
      operationId: z.string().uuid(),
      expectedVersion: z.number().int().positive().optional(),
      tags: z.array(z.string().min(1).max(40)).max(15),
      notes: z.string().max(4000),
      assigneeId: z
        .string()
        .regex(/^[a-zA-Z0-9-]{1,128}$/)
        .or(z.literal("")),
      followUpAt: z.number().int().nonnegative(),
    })
    .strict()
    .safeParse(req.data);
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
    if (old.exists && old.data()?.version !== d.expectedVersion)
      throw new HttpsError("aborted", "Hồ sơ đã thay đổi. Tải lại.");
    if (d.assigneeId) {
      const a = await tx.get(db.doc(`staffAccess/${d.assigneeId}`));
      if (!a.data()?.active || a.data()?.locked)
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
      createdAt: Date.now(),
    });
    const result = { version };
    tx.create(op, { hash, result, createdAt: Date.now() });
    return result;
  });
});
export const operationalDashboard = onCall(opts, async (req) => {
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
      !a.data()?.active ||
      a.data()?.locked ||
      u.data()?.locked ||
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
    const orders = snapshots[0].docs.map((d) => d.data());
    const counts = {
      requests: orders.filter((o) => o.stage === "REQUESTED").length,
      quotes: orders.filter((o) => o.stage === "QUOTED").length,
      purchasing: orders.filter(
        (o) =>
          ["QUOTE_ACCEPTED", "PURCHASING"].includes(o.stage) &&
          o.collected - o.refunded >= (o.deposit ?? Infinity) &&
          !o.hold,
      ).length,
      holds: orders.filter((o) => !!o.hold).length,
      balance: orders.filter(
        (o) => o.finalApproved && o.finalTotal > o.collected - o.refunded,
      ).length,
      ready: orders.filter(
        (o) =>
          o.stage === "READY_TO_SHIP" &&
          !o.hold &&
          o.finalApproved &&
          o.collected - o.refunded >= o.finalTotal,
      ).length,
      tickets: snapshots[1].docs.filter((d) => d.data().status !== "resolved")
        .length,
      transfers: snapshots[2].docs.filter((d) => d.data().status === "pending")
        .length,
      exceptions: snapshots[3].docs.filter((d) => d.data().state === "open")
        .length,
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

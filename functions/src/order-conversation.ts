import {
  customerEvent,
  customerEventFields,
} from "./customer-notification-events";
import { createHash } from "node:crypto";
import { getFirestore, type Transaction } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { z } from "zod";
import { requireVerifiedGoogle } from "./auth/guards";
import {
  canHandleConversation,
  conversationCommandSchema,
  conversationId,
  type ConversationAccess,
} from "../../packages/domain/order-conversation";

const opts = {
  region: "asia-southeast1",
  maxInstances: 3,
  concurrency: 20,
  enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
};

async function authorize(tx: Transaction, uid: string, orderId: string) {
  const db = getFirestore();
  const [order, user, staff] = await Promise.all([
    tx.get(db.doc(`orders/${orderId}`)),
    tx.get(db.doc(`users/${uid}`)),
    tx.get(db.doc(`staffAccess/${uid}`)),
  ]);
  const customer = order.data()?.ownerId === uid;
  const handler = canHandleConversation(
    staff.data() as ConversationAccess | undefined,
    orderId,
  );
  if (
    !order.exists ||
    user.data()?.locked ||
    staff.data()?.locked ||
    !(customer || handler)
  )
    throw new HttpsError(
      "permission-denied",
      "Không thể truy cập cuộc trao đổi này.",
    );
  // A staff member who owns the order acts as its customer, avoiding mixed-role leaks.
  return {
    ownerId: order.data()!.ownerId as string,
    staff: handler && !customer,
  };
}

export const readOrderConversation = onCall(opts, async (req) => {
  const uid = requireVerifiedGoogle(req.auth);
  const parsed = z
    .object({ orderId: conversationId })
    .strict()
    .safeParse(req.data);
  if (!parsed.success)
    throw new HttpsError("invalid-argument", "Thông tin đơn không hợp lệ.");
  const { orderId } = parsed.data,
    db = getFirestore();
  return db.runTransaction(async (tx) => {
    const access = await authorize(tx, uid, orderId);
    const ref = db.doc(`orderConversations/${orderId}`);
    const [conversation, messages, notes] = await Promise.all([
      tx.get(ref),
      tx.get(
        ref
          .collection("messages")
          .orderBy("createdAt", "desc")
          .orderBy("__name__", "desc")
          .limit(51),
      ),
      access.staff
        ? tx.get(
            ref
              .collection("notes")
              .orderBy("createdAt", "desc")
              .orderBy("__name__", "desc")
              .limit(51),
          )
        : Promise.resolve(null),
    ]);
    const project = (rows: typeof messages) =>
      rows.docs
        .slice(0, 50)
        .map((m) => ({
          id: m.id,
          text: m.data().text as string,
          createdAt: m.data().createdAt as number,
          fromCustomer: m.data().authorId === access.ownerId,
        }))
        .reverse();
    let assignee = null;
    const assigneeId = conversation.data()?.assigneeId;
    if (access.staff && typeof assigneeId === "string") {
      const [profile, staff] = await Promise.all([
        tx.get(db.doc(`users/${assigneeId}`)),
        tx.get(db.doc(`staffAccess/${assigneeId}`)),
      ]);
      assignee = {
        id: assigneeId,
        name: String(profile.data()?.displayName || "Nhân viên"),
        available:
          !profile.data()?.locked &&
          canHandleConversation(staff.data(), orderId),
      };
    }
    const staffChoices: { id: string; name: string }[] = [];
    let staffChoicesTruncated = false;
    if (access.staff) {
      const candidates = await tx.get(
        db
          .collection("staffAccess")
          .where("active", "==", true)
          .orderBy("__name__")
          .limit(51),
      );
      staffChoicesTruncated = candidates.size > 50;
      const eligible = candidates.docs
        .slice(0, 50)
        .filter(
          (s) =>
            s.id !== access.ownerId && canHandleConversation(s.data(), orderId),
        );
      const profiles = eligible.length
        ? await tx.getAll(...eligible.map((s) => db.doc(`users/${s.id}`)))
        : [];
      eligible.forEach((s, i) => {
        if (!profiles[i].data()?.locked)
          staffChoices.push({
            id: s.id,
            name: String(profiles[i].data()?.displayName || "Nhân viên"),
          });
      });
    }
    return {
      currentStaffId: access.staff ? uid : null,
      version: conversation.data()?.version ?? 0,
      staff: access.staff,
      messages: project(messages),
      hasEarlierMessages: messages.size > 50,
      notes: notes ? project(notes) : [],
      hasEarlierNotes: (notes?.size ?? 0) > 50,
      assignee,
      staffChoices,
      staffChoicesTruncated,
    };
  });
});

export const orderConversationCommand = onCall(opts, async (req) => {
  const uid = requireVerifiedGoogle(req.auth);
  const parsed = conversationCommandSchema.safeParse(req.data);
  if (!parsed.success)
    throw new HttpsError("invalid-argument", "Kiểm tra nội dung và thử lại.");
  const d = parsed.data,
    db = getFirestore(),
    now = Date.now();
  // Zod produces a stable field order; callers cannot alter authority by reordering keys.
  const hash = createHash("sha256").update(JSON.stringify(d)).digest("hex");
  const op = db.doc(`idempotencyKeys/${uid}-conversation-${d.operationId}`);
  return db.runTransaction(async (tx) => {
    const access = await authorize(tx, uid, d.orderId);
    if (d.action !== "message" && !access.staff)
      throw new HttpsError(
        "permission-denied",
        "Thao tác này dành cho nhân viên phụ trách.",
      );
    // Assignment authorization is checked on replays as well as first execution.
    if (d.action === "assign") {
      const [target, profile] = await Promise.all([
        tx.get(db.doc(`staffAccess/${d.assigneeId}`)),
        tx.get(db.doc(`users/${d.assigneeId}`)),
      ]);
      if (
        d.assigneeId === access.ownerId ||
        profile.data()?.locked ||
        !canHandleConversation(target.data(), d.orderId)
      )
        throw new HttpsError(
          "failed-precondition",
          "Nhân viên này hiện không thể nhận cuộc trao đổi.",
        );
    }
    const ref = db.doc(`orderConversations/${d.orderId}`);
    const [conversation, oldOp] = await Promise.all([tx.get(ref), tx.get(op)]);
    if (oldOp.exists) {
      if (oldOp.data()?.hash !== hash)
        throw new HttpsError(
          "already-exists",
          "Mã thao tác đã được dùng cho nội dung khác.",
        );
      return oldOp.data()!.result;
    }
    if ((conversation.data()?.version ?? 0) !== d.expectedVersion)
      throw new HttpsError(
        "aborted",
        "Có cập nhật mới. Tải lại cuộc trao đổi trước khi gửi.",
      );
    const version = d.expectedVersion + 1;
    let staffRecipient: string | null =
      d.action === "assign" ? d.assigneeId : null;
    if (
      d.action === "message" &&
      !access.staff &&
      typeof conversation.data()?.assigneeId === "string"
    ) {
      const recipient = conversation.data()!.assigneeId as string;
      const [staff, profile] = await Promise.all([
        tx.get(db.doc(`staffAccess/${recipient}`)),
        tx.get(db.doc(`users/${recipient}`)),
      ]);
      if (
        recipient !== access.ownerId &&
        !profile.data()?.locked &&
        canHandleConversation(staff.data(), d.orderId)
      )
        staffRecipient = recipient;
    }
    tx.set(
      ref,
      {
        ownerId: access.ownerId,
        orderId: d.orderId,
        version,
        changedAt: now,
        createdAt: conversation.data()?.createdAt ?? now,
        ...(d.action === "assign" ? { assigneeId: d.assigneeId } : {}),
        ...(d.action === "message" ? { lastMessageAt: now } : {}),
      },
      { merge: true },
    );
    if (d.action === "message" || d.action === "note")
      tx.create(
        ref
          .collection(d.action === "note" ? "notes" : "messages")
          .doc(d.operationId),
        {
          text: d.text,
          authorId: uid,
          createdAt: now,
        },
      );
    if (d.action === "message" && access.staff)
      tx.create(db.doc(`outboxJobs/conversation-${uid}-${d.operationId}`), {
        ownerId: access.ownerId,
        orderId: d.orderId,
        resourceId: d.orderId,
        action: "orderConversationReply",
        state: "queued",
        createdAt: now,
        ...customerEventFields(() =>
          customerEvent(
            "order_reply",
            {
              ownerId: access.ownerId,
              entityId: d.orderId,
              orderId: d.orderId,
              entityVersion: now,
              occurredAt: now,
            },
            { orderRef: d.orderId },
          ),
        ),
      });
    if (staffRecipient && staffRecipient !== uid)
      tx.create(
        db.doc(`outboxJobs/conversation-staff-${uid}-${d.operationId}`),
        {
          ownerId: staffRecipient,
          orderId: d.orderId,
          resourceId: d.orderId,
          action: "staffConversationUpdate",
          state: "queued",
          createdAt: now,
        },
      );
    tx.create(db.collection("auditEvents").doc(), {
      actor: uid,
      action: `orderConversation:${d.action}`,
      resourceId: d.orderId,
      createdAt: now,
    });
    const result = { version };
    tx.create(op, { hash, result, createdAt: now });
    return result;
  });
});

import { catalogCheckout } from "../catalog-checkout";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { requireVerifiedGoogle } from "../auth/guards";
import { command } from "../index";
import {
  conversationActionSchema,
  redactChat,
  redactDraft,
  type AskConversation,
} from "../../../packages/domain/ask-workflow";
import { type Order } from "../../../packages/domain";
const options = {
  region: "asia-southeast1",
  maxInstances: 3,
  concurrency: 10,
  enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
};
async function requireCommerceEnabled() {
  if (
    process.env.FUNCTIONS_EMULATOR === "true" &&
    process.env.GCLOUD_PROJECT === "demo-satsunicgo"
  )
    return;
  const settings = (
    await getFirestore().doc("settings/askCommerce").get()
  ).data();
  if (settings?.enabled !== true || settings?.approved !== true)
    throw new HttpsError(
      "unavailable",
      "Mua hộ trong chat chưa được kích hoạt. Anh/chị vẫn có thể dùng trang yêu cầu.",
    );
}
const envelope = z
  .object({
    conversationId: z.string().uuid(),
    operationId: z.string().uuid(),
    expectedVersion: z.number().int().nonnegative(),
    expectedOrderVersion: z.number().int().positive().optional(),
    action: z.string(),
    payload: z.unknown(),
  })
  .strict();
export const askWorkflow = onCall(
  options,
  async (
    req,
  ): Promise<{ id?: string; version: number; outcome?: "no_operation" }> => {
    const uid = requireVerifiedGoogle(req.auth);
    await requireCommerceEnabled();
    const parsed = envelope.safeParse(req.data);
    if (parsed.success && parsed.data.action === "resume") {
      const ref = getFirestore().doc(
        `askConversations/${uid}-${parsed.data.conversationId}`,
      );
      const recovery = z
        .object({ operationId: z.string().uuid().optional() })
        .strict()
        .safeParse(parsed.data.payload);
      if (!recovery.success)
        throw new HttpsError(
          "invalid-argument",
          "Thông tin đối chiếu chưa hợp lệ.",
        );
      const db = getFirestore();
      const current = await db.runTransaction(async (tx) => {
        const [user, access, conversation] = await Promise.all([
          tx.get(db.doc(`users/${uid}`)),
          tx.get(db.doc(`staffAccess/${uid}`)),
          tx.get(ref),
        ]);
        if (
          user.data()?.locked ||
          access.data()?.locked ||
          (conversation.exists && conversation.data()?.ownerId !== uid)
        )
          throw new HttpsError(
            "permission-denied",
            "Không thể mở hội thoại này.",
          );
        return conversation;
      });
      const pending =
        current.data()?.pendingOperation ?? recovery.data.operationId;
      if (!pending)
        return {
          version: current.data()?.version ?? 0,
          outcome: "no_operation",
        };
      const saved = await ref.collection("operations").doc(pending).get();
      if (!saved.exists && !current.data()?.pendingOperation)
        return {
          version: current.data()?.version ?? 0,
          outcome: "no_operation",
        };
      if (saved.data()?.state === "done") {
        const result = z
          .object({
            id: z
              .string()
              .regex(/^[A-Za-z0-9_-]{1,100}$/)
              .optional(),
            version: z.number().int().nonnegative().safe(),
          })
          .strict()
          .safeParse(saved.data()?.result);
        if (
          result.success &&
          current.exists &&
          Number.isSafeInteger(current.data()?.version) &&
          result.data.version <= current.data()!.version &&
          (!result.data.id || result.data.id === current.data()?.orderId)
        )
          return result.data;
        throw new HttpsError(
          "failed-precondition",
          "Cần hỗ trợ đối chiếu thao tác đang chờ.",
        );
      }
      if (!saved.data()?.request)
        throw new HttpsError(
          "failed-precondition",
          "Cần hỗ trợ đối chiếu thao tác đang chờ.",
        );
      return askWorkflow.run({ ...req, data: saved.data()!.request });
    }
    const selected = conversationActionSchema.safeParse(
      req.data && { action: req.data.action, payload: req.data.payload },
    );
    if (!parsed.success || !selected.success)
      throw new HttpsError(
        "invalid-argument",
        "Thông tin chưa hợp lệ. Kiểm tra và thử lại.",
      );
    const d = parsed.data,
      a = selected.data,
      db = getFirestore();
    const ref = db.doc(`askConversations/${uid}-${d.conversationId}`);
    const op = ref.collection("operations").doc(d.operationId);
    const hash = createHash("sha256").update(JSON.stringify(d)).digest("hex");
    const prepared = await db.runTransaction(async (tx) => {
      const [user, access, conversation, previous] = await Promise.all([
        tx.get(db.doc(`users/${uid}`)),
        tx.get(db.doc(`staffAccess/${uid}`)),
        tx.get(ref),
        tx.get(op),
      ]);
      if (user.data()?.locked || access.data()?.locked)
        throw new HttpsError(
          "permission-denied",
          "Không thể tiếp tục với tài khoản này.",
        );
      const c = (conversation.data() ?? {
        ownerId: uid,
        version: 0,
        turns: [],
      }) as AskConversation;
      c.turns ??= [];
      if (c.ownerId !== uid)
        throw new HttpsError(
          "permission-denied",
          "Không thể mở hội thoại này.",
        );
      if (previous.exists) {
        if (previous.data()?.hash !== hash)
          throw new HttpsError(
            "already-exists",
            "Thao tác đã thay đổi. Tải lại hội thoại.",
          );
        return {
          c,
          done: previous.data()?.result as
            { id?: string; version: number } | undefined,
        };
      }
      const immediate = ["saveTurn", "saveDraft", "saveRecipient"].includes(
        a.action,
      );
      if (
        !Number.isSafeInteger(c.version) ||
        c.version < 0 ||
        c.version > Number.MAX_SAFE_INTEGER - (immediate ? 1 : 2)
      )
        throw new HttpsError(
          "aborted",
          "Hội thoại đã thay đổi. Tải lại rồi thử lại.",
        );
      if (c.version !== d.expectedVersion)
        throw new HttpsError(
          "aborted",
          "Hội thoại đã thay đổi. Tải lại rồi thử lại.",
        );
      if (["submitRequest", "catalogCheckout"].includes(a.action) && c.orderId)
        throw new HttpsError(
          "failed-precondition",
          "Hội thoại này đã có đơn hàng.",
        );
      if (a.action === "saveDraft" && c.orderId)
        throw new HttpsError(
          "failed-precondition",
          "Yêu cầu đã gửi. Liên hệ hỗ trợ để thay đổi.",
        );
      let order: Order | undefined;
      if (
        !["saveTurn", "saveDraft", "submitRequest", "catalogCheckout"].includes(
          a.action,
        )
      ) {
        if (!c.orderId)
          throw new HttpsError(
            "failed-precondition",
            "Gửi yêu cầu trước khi tiếp tục.",
          );
        const os = await tx.get(db.doc(`orders/${c.orderId}`));
        order = os.data() as Order;
        if (order?.ownerId !== uid)
          throw new HttpsError("permission-denied", "Không thể truy cập đơn.");
        if (order.version !== d.expectedOrderVersion)
          throw new HttpsError(
            "aborted",
            "Đơn đã thay đổi. Kiểm tra thông tin mới.",
          );
        if (
          a.action === "saveRecipient" &&
          !(
            ["REQUESTED", "QUOTED"].includes(order.stage) ||
            (order.purchaseKind === "catalog" &&
              order.stage === "QUOTE_ACCEPTED" &&
              order.collected === 0 &&
              order.refunded === 0)
          )
        )
          throw new HttpsError(
            "failed-precondition",
            "Địa chỉ đã chốt. Liên hệ hỗ trợ để thay đổi.",
          );
      }
      if (a.action === "acceptQuote" && !c.recipientSaved)
        throw new HttpsError(
          "failed-precondition",
          "Lưu thông tin nhận hàng trước khi duyệt báo giá.",
        );
      const version = c.version + 1;
      const change: Record<string, unknown> = {
        ownerId: uid,
        version,
        updatedAt: Date.now(),
      };
      if (a.action === "saveTurn") {
        const turn = {
          ...a.payload,
          question: redactChat(a.payload.question),
          answer: {
            ...a.payload.answer,
            paragraphs: a.payload.answer.paragraphs.map(redactChat),
            bullets: a.payload.answer.bullets.map(redactChat),
            title: redactChat(a.payload.answer.title),
            ...(a.payload.answer.followUp !== undefined
              ? { followUp: redactChat(a.payload.answer.followUp) }
              : {}),
            ...(a.payload.answer.draft
              ? { draft: redactDraft(a.payload.answer.draft) }
              : {}),
            ...(a.payload.answer.shoppingDraft
              ? { shoppingDraft: redactDraft(a.payload.answer.shoppingDraft) }
              : {}),
          },
        };
        change.turns = [
          ...c.turns.filter((t) => t.id !== turn.id).slice(-23),
          turn,
        ];
      }
      if (a.action === "saveDraft") change.draft = a.payload;
      if (a.action === "saveRecipient") {
        tx.set(db.doc(`orderRecipients/${c.orderId}`), {
          ...a.payload,
          ownerId: uid,
          orderId: c.orderId,
          updatedAt: Date.now(),
        });
        tx.set(
          db.doc(`orderOperations/${c.orderId}`),
          { recipient: a.payload, changedAt: Date.now() },
          { merge: true },
        );
        change.recipientSaved = true;
      }
      // Reserve one mutation at a time. A lost result retries the same operation.
      if (
        c &&
        conversation.data()?.pendingOperation &&
        conversation.data()?.pendingOperation !== d.operationId
      )
        throw new HttpsError(
          "aborted",
          "Một thao tác đang chờ kết quả. Thử lại thao tác đó trước.",
        );
      tx.set(
        ref,
        {
          ...change,
          ...(immediate ? {} : { pendingOperation: d.operationId }),
        },
        { merge: true },
      );
      const result = immediate ? { version } : undefined;
      tx.set(db.doc(`askCurrent/${uid}`), { conversationId: d.conversationId });
      tx.create(op, {
        hash,
        action: a.action,
        state: immediate ? "done" : "pending",
        createdAt: Date.now(),
        ...(!immediate ? { request: d } : {}),
        ...(result ? { result } : {}),
      });
      return { c: { ...c, ...change } as AskConversation, done: result };
    });
    if (prepared.done) return prepared.done;
    let result: { id: string; version: number };
    try {
      result =
        a.action === "catalogCheckout"
          ? await catalogCheckout.run({
              ...req,
              data: { ...a.payload, operationId: d.operationId },
            })
          : await command.run({
              ...req,
              data: {
                action: a.action,
                payload: a.payload,
                operationId: d.operationId,
                ...(prepared.c.orderId
                  ? {
                      orderId: prepared.c.orderId,
                      expectedVersion: d.expectedOrderVersion,
                    }
                  : {}),
              },
            });
    } catch (error) {
      // Known failures may be retried with a fresh version; unknown outcomes must retain their identity.
      if (
        error instanceof HttpsError &&
        [
          "invalid-argument",
          "permission-denied",
          "failed-precondition",
          "aborted",
          "already-exists",
        ].includes(error.code)
      ) {
        await db.runTransaction(async (tx) => {
          const current = await tx.get(ref);
          if (current.data()?.pendingOperation === d.operationId) {
            tx.update(ref, { pendingOperation: null });
            tx.delete(op);
          }
        });
      }
      throw error;
    }
    return db.runTransaction(async (tx) => {
      const [current, previous] = await Promise.all([tx.get(ref), tx.get(op)]);
      if (previous.data()?.state === "done") return previous.data()?.result;
      if (current.data()?.pendingOperation !== d.operationId)
        throw new HttpsError("aborted", "Đang đối chiếu kết quả thao tác.");
      if (
        !Number.isSafeInteger(current.data()?.version) ||
        current.data()!.version < 0 ||
        current.data()!.version >= Number.MAX_SAFE_INTEGER
      )
        throw new HttpsError(
          "aborted",
          "Hội thoại đã thay đổi. Tải lại rồi thử lại.",
        );
      const version = current.data()!.version + 1;
      const outcome = { id: result.id, version };
      tx.update(ref, {
        orderId: result.id,
        version,
        pendingOperation: null,
        updatedAt: Date.now(),
      });
      tx.update(op, { state: "done", result: outcome, finishedAt: Date.now() });
      return outcome;
    });
  },
);

export const currentAskConversation = onCall(options, async (req) => {
  const uid = requireVerifiedGoogle(req.auth),
    db = getFirestore();
  await requireCommerceEnabled();
  return db.runTransaction(async (tx) => {
    const pointerRef = db.doc(`askCurrent/${uid}`);
    const [user, staff, pointer] = await Promise.all([
      tx.get(db.doc(`users/${uid}`)),
      tx.get(db.doc(`staffAccess/${uid}`)),
      tx.get(pointerRef),
    ]);
    if (user.data()?.locked || staff.data()?.locked)
      throw new HttpsError(
        "permission-denied",
        "Không thể mở hội thoại với tài khoản này.",
      );
    const existing = pointer.data()?.conversationId;
    if (existing) {
      const conversation = await tx.get(
        db.doc(`askConversations/${uid}-${existing}`),
      );
      if (conversation.data()?.ownerId === uid)
        return { conversationId: existing };
    }
    const conversationId = randomUUID();
    tx.create(db.doc(`askConversations/${uid}-${conversationId}`), {
      ownerId: uid,
      version: 0,
      updatedAt: Date.now(),
      turns: [],
    });
    tx.set(pointerRef, { conversationId });
    return { conversationId };
  });
});

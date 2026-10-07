import { catalogSelectionSchema } from "./catalog-checkout";
import { z } from "zod";
import { requestSchema, type Order } from "./index";
import { askAnswerSchema } from "./ask-stream";

export const recipientSchema = z
  .object({
    recipient: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(8).max(20),
    address: z.string().trim().min(10).max(500),
  })
  .strict();
export const shoppingDraftSchema = requestSchema.partial();
export const conversationTurnSchema = z
  .object({
    id: z.string().uuid(),
    question: z.string().trim().min(1).max(1000),
    answer: askAnswerSchema,
  })
  .strict();
export type ConversationTurn = z.infer<typeof conversationTurnSchema>;
export type ShoppingDraft = z.infer<typeof shoppingDraftSchema>;
export type AskConversation = {
  ownerId: string;
  version: number;
  updatedAt: number;
  turns: ConversationTurn[];
  draft?: ShoppingDraft;
  orderId?: string;
  recipientSaved?: boolean;
  pendingOperation?: string | null;
};
export const conversationActionSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("catalogCheckout"),
      payload: catalogSelectionSchema,
    })
    .strict(),
  z
    .object({
      action: z.literal("confirmReceipt"),
      payload: z.object({ received: z.literal(true) }).strict(),
    })
    .strict(),
  z
    .object({ action: z.literal("saveDraft"), payload: shoppingDraftSchema })
    .strict(),
  z
    .object({ action: z.literal("saveTurn"), payload: conversationTurnSchema })
    .strict(),
  z
    .object({ action: z.literal("submitRequest"), payload: requestSchema })
    .strict(),
  z
    .object({
      action: z.literal("acceptQuote"),
      payload: z.object({ quoteVersion: z.number().int().positive() }).strict(),
    })
    .strict(),
  z
    .object({
      action: z.literal("approveFinal"),
      payload: z.object({}).strict(),
    })
    .strict(),
  z
    .object({ action: z.literal("saveRecipient"), payload: recipientSchema })
    .strict(),
]);
export function shoppingIntent(text: string) {
  const explicitDraft =
    /(?:soạn|tạo|lập|chuẩn bị)\s+(?:một\s+)?(?:bản nháp\s+)?yêu cầu\s+mua hộ|(?:draft|prepare|create)\s+(?:a\s+)?(?:shopping|purchase|buying)\s+request/i.test(
      text,
    );
  return (
    explicitDraft ||
    (/(?:muốn|cần|tìm|đặt|mua giúp|mua hộ cho|mua cho|want|buy me|looking for|order me)|https?:\/\//i.test(
      text,
    ) &&
      !/hoạt động thế nào|how .*work|mua hộ là gì/i.test(text))
  );
}
// Addresses are collected in the separate recipient control, never model context.
export function redactChat(text: string) {
  return text
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[email]")
    .replace(/(?:\+?\d[\d .()-]{7,}\d)/g, "[private number]")
    .replace(
      /(?:địa chỉ|address|recipient|người nhận|số tài khoản|bank account|password|mật khẩu)\s*[:=][^\n]*/gi,
      "[private details]",
    );
}
export function redactDraft(draft: ShoppingDraft): ShoppingDraft {
  return {
    ...draft,
    ...(draft.notes ? { notes: redactChat(draft.notes) } : {}),
    ...(draft.preferredStore
      ? { preferredStore: redactChat(draft.preferredStore) }
      : {}),
    ...(draft.items
      ? {
          items: draft.items.map((i) => ({
            ...i,
            name: redactChat(i.name),
            variant: redactChat(i.variant),
          })),
        }
      : {}),
  };
}
export function nextCustomerAction(order: Order) {
  if (order.hold) return "hold";
  if (order.stage === "DELIVERED") return "confirmReceipt";
  if (["CANCELLED", "COMPLETED"].includes(order.stage)) return "finished";
  if (order.stage === "QUOTED" && order.purchaseKind !== "catalog")
    return "acceptQuote";
  if (
    order.purchaseKind !== "catalog" &&
    order.stage === "PACKED" &&
    order.finalTotal !== undefined &&
    !order.finalApproved
  )
    return "approveFinal";
  if (
    order.acceptedAt &&
    (order.purchaseKind === "catalog"
      ? (order.finalTotal ?? 0)
      : order.finalApproved && order.finalTotal !== undefined
        ? order.finalTotal
        : (order.deposit ?? 0)) >
      order.collected - order.refunded
  )
    return "payment";
  return "waiting";
}
export function safeCheckout(value: string) {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    !["pay.payos.vn", "payos.vn"].includes(url.hostname)
  )
    throw Error("INVALID_CHECKOUT");
  return url.href;
}

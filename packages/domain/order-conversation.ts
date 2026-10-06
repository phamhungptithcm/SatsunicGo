import { z } from "zod";

export const conversationId = z.string().regex(/^[a-zA-Z0-9-]{1,80}$/);
const staffId = z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/);
export const conversationCommandSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("message"),
      orderId: conversationId,
      operationId: z.string().uuid(),
      expectedVersion: z.number().int().nonnegative(),
      text: z.string().trim().min(1).max(4000),
    })
    .strict(),
  z
    .object({
      action: z.literal("note"),
      orderId: conversationId,
      operationId: z.string().uuid(),
      expectedVersion: z.number().int().nonnegative(),
      text: z.string().trim().min(1).max(4000),
    })
    .strict(),
  z
    .object({
      action: z.literal("assign"),
      orderId: conversationId,
      operationId: z.string().uuid(),
      expectedVersion: z.number().int().nonnegative(),
      assigneeId: staffId,
    })
    .strict(),
]);

export type ConversationAccess = {
  active?: boolean;
  locked?: boolean;
  roles?: string[];
  orderIds?: string[];
};
export function canHandleConversation(
  access: ConversationAccess | undefined,
  orderId: string,
) {
  if (
    access?.active !== true ||
    access.locked ||
    !Array.isArray(access.roles) ||
    !access.roles.every((role: unknown) => typeof role === "string")
  )
    return false;
  return (
    access.roles?.some((r) =>
      ["OWNER", "SUPPORT", "OPERATIONS_MANAGER"].includes(r),
    ) === true ||
    (access.roles?.includes("BUYER") === true &&
      Array.isArray(access.orderIds) &&
      access.orderIds.includes(orderId))
  );
}

export type ConversationEntry = {
  id: string;
  text: string;
  createdAt: number;
  fromCustomer: boolean;
};
export type OrderConversationData = {
  currentStaffId: string | null;
  version: number;
  staff: boolean;
  messages: ConversationEntry[];
  hasEarlierMessages: boolean;
  notes: ConversationEntry[];
  hasEarlierNotes: boolean;
  assignee: { id: string; name: string; available: boolean } | null;
  staffChoices: { id: string; name: string }[];
  staffChoicesTruncated: boolean;
};

export const conversationDrafts = [
  {
    label: "Xác nhận yêu cầu",
    text: "Mình đã nhận yêu cầu mua hộ của bạn. Mình sẽ kiểm tra thông tin sản phẩm và phản hồi trong cuộc trao đổi này.",
  },
  {
    label: "Hỏi thêm sản phẩm",
    text: "Bạn gửi thêm giúp mình link sản phẩm, màu hoặc kích cỡ mong muốn để mình kiểm tra đúng món nhé.",
  },
  {
    label: "Mời xem báo giá",
    text: "Bạn mở phần báo giá của đơn để xem chi phí và điều kiện mua hộ. Nếu cần làm rõ thông tin, bạn trả lời ngay tại đây nhé.",
  },
] as const;

import { expect, test } from "vitest";
import { customerChatAction } from "../../packages/domain/chat-action";
import { conversationActionSchema } from "../../packages/domain/ask-workflow";
import type { Order } from "../../packages/domain";

const order: Order = {
  id: "synthetic-intent026", ownerId: "synthetic-customer", market: "US",
  items: [{ name: "Synthetic product", quantity: 1, variant: "Blue" }], notes: "",
  stage: "REQUESTED", version: 1, createdAt: 1, collected: 0, refunded: 0,
};
const draft = { market: "US", items: order.items, notes: "Synthetic only" };

test("catalog intent never authorizes custom quote/final installment approvals across stages", () => {
  for (const stage of ["REQUESTED", "QUOTED", "QUOTE_ACCEPTED", "PACKED", "READY_TO_SHIP"] as const) {
    const catalog: Order = { ...order, purchaseKind: "catalog", stage, acceptedAt: 1, finalTotal: 1000, finalApproved: true };
    for (const text of ["chấp nhận báo giá", "accept quote", "duyệt tổng phí cuối", "approve final total", "đã trả cọc", "pay balance"]) {
      expect(customerChatAction(text, catalog, draft)).toBeNull();
    }
  }
});

test("custom approval intent follows the required next business decision, including legacy kind", () => {
  for (const purchaseKind of [undefined, "custom"] as const) {
    const quoted: Order = { ...order, purchaseKind, stage: "QUOTED" };
    expect(customerChatAction("  Chấp nhận báo giá!  ", quoted, draft)).toBe("acceptQuote");
    expect(customerChatAction("accept quote", quoted, draft)).toBe("acceptQuote");
    expect(customerChatAction("approve final total", quoted, draft)).toBeNull();
    const packed: Order = { ...order, purchaseKind, stage: "PACKED", finalTotal: 1000, finalApproved: false };
    expect(customerChatAction("duyệt tổng phí cuối", packed, draft)).toBe("approveFinal");
    expect(customerChatAction("accept quote", packed, draft)).toBeNull();
    expect(customerChatAction("approve final total", { ...packed, finalApproved: true }, draft)).toBeNull();
  }
});

test("questions, conditions and compound messages do not become irreversible confirmation", () => {
  const quoted: Order = { ...order, stage: "QUOTED" };
  for (const text of [
    "Tôi có nên chấp nhận báo giá không?", "Nếu giá giảm thì chấp nhận báo giá",
    "Khách nói chấp nhận báo giá", "accept quote if delivery is guaranteed",
    "accept quote and refund the deposit", '"accept quote"',
  ]) expect(customerChatAction(text, quoted, draft)).toBeNull();
});

test("hold and terminal orders cannot authorize approval or receipt from explicit phrases", () => {
  for (const blocked of [
    { ...order, stage: "QUOTED" as const, hold: "Pending approved change" },
    { ...order, stage: "DELIVERED" as const, hold: "Inspection" },
    { ...order, stage: "CANCELLED" as const },
    { ...order, stage: "COMPLETED" as const },
  ]) for (const text of ["accept quote", "approve final total", "confirm all items received"])
    expect(customerChatAction(text, blocked, draft)).toBeNull();
  expect(customerChatAction("confirm all items received", { ...order, stage: "IN_TRANSIT" }, draft)).toBeNull();
});

test("submit intent requires a complete bounded draft and does not create another linked order", () => {
  expect(customerChatAction("gửi yêu cầu mua hộ", null, draft)).toBe("submitRequest");
  expect(customerChatAction("submit buying request", null, draft)).toBe("submitRequest");
  for (const invalid of [{}, { ...draft, items: [] }, { ...draft, market: "VN" }, { ...draft, items: [{ ...order.items[0], quantity: 0 }] }, { ...draft, paid: true }])
    expect(customerChatAction("gửi yêu cầu", null, invalid)).toBeNull();
  expect(customerChatAction("submit request", order, draft)).toBeNull();
});

test("natural customer text and structured tools cannot grant financial or staff authority", () => {
  for (const action of ["verifyTransfer", "refund", "dispatch", "track", "saveStaffAccess", "saveContent", "grantMembership"]) {
    expect(customerChatAction(action, { ...order, stage: "QUOTED" }, draft)).toBeNull();
    expect(conversationActionSchema.safeParse({ action, payload: {} }).success).toBe(false);
  }
  for (const text of ["Tôi đã thanh toán", "đã chuyển khoản", "đã trả cọc", "mark paid", "refund me", "publish this product"])
    expect(customerChatAction(text, { ...order, acceptedAt: 1, stage: "QUOTE_ACCEPTED", deposit: 500 }, draft)).toBeNull();
});

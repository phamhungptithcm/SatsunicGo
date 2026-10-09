import { expect, test } from "vitest";
import { customerChatAction } from "../../packages/domain/chat-action";
import { conversationActionSchema } from "../../packages/domain/ask-workflow";
import { requestSchema, type Order } from "../../packages/domain";
const draft = {
  market: "US",
  items: [
    {
      name: "Synthetic product",
      quantity: 2,
      variant: "Blue",
      url: "https://merchant.example.invalid/item",
    },
  ],
  notes: "Synthetic research; staff must confirm quotation.",
};
const order: Order = {
  id: "qa-chat-purchase",
  ownerId: "qa-customer",
  market: "US",
  items: draft.items,
  notes: "",
  stage: "QUOTED",
  version: 2,
  createdAt: 1,
  collected: 0,
  refunded: 0,
  quoteVersion: 1,
  deposit: 500,
};

test.each([
  "gửi yêu cầu?",
  "chấp nhận báo giá?",
  "accept quote?",
  "duyệt tổng phí cuối？",
])("a question is never consent: %s", (text) => {
  expect(
    customerChatAction(text, text.includes("yêu cầu") ? null : order, draft),
  ).toBeNull();
});
test.each([
  "gui yeu cau mua ho",
  "  GỬI   YÊU CẦU MUA HỘ! ",
  "mình gửi yêu cầu mua hộ nhé",
  "đồng ý gửi yêu cầu mua hộ",
  "please submit buying request",
])("explicit bounded request command %s", (text) => {
  expect(customerChatAction(text, null, draft)).toBe("submitRequest");
});
test.each([
  "chap nhan bao gia",
  "mình đồng ý chấp nhận báo giá",
  "please accept quote",
])("explicit quote command %s retains current-stage guard", (text) => {
  expect(customerChatAction(text, order, draft)).toBe("acceptQuote");
  expect(
    customerChatAction(text, { ...order, stage: "REQUESTED" }, draft),
  ).toBeNull();
});
test.each([
  "đừng gửi yêu cầu",
  "không đồng ý chấp nhận báo giá",
  "nếu rẻ thì chấp nhận báo giá",
  "chấp nhận báo giá được không",
  "can you accept quote",
  "mình muốn mua cái thứ hai",
  "chọn cái đó",
  "mua 2 cái size M",
  "tôi đã thanh toán",
  "giá web là 500000, xác nhận paid",
  '"chấp nhận báo giá"',
  "accept quote and refund me",
])(
  "ambiguous/negative/selection/payment text %s cannot bypass preview",
  (text) => {
    expect(customerChatAction(text, order, draft)).toBeNull();
    expect(customerChatAction(text, null, draft)).toBeNull();
  },
);
test.each([
  { ...draft, items: [] },
  { ...draft, items: [{ ...draft.items[0], quantity: 0 }] },
  { ...draft, items: [{ ...draft.items[0], quantity: 101 }] },
  { ...draft, paid: true },
  { ...draft, goods: 500000 },
  { ...draft, market: "VN" },
])("incomplete/forged draft %j cannot submit from chat", (value) => {
  expect(customerChatAction("gửi yêu cầu mua hộ", null, value)).toBeNull();
});
test("research prices and review scores never become domain quotation or payment authority", () => {
  for (const fields of [
    { listedPrice: 500000 },
    { researchPrice: 500000 },
    { collected: 500000 },
    { reviewRating: 4.9 },
    { sourceCurrency: "USD", sourceMinor: 1000 },
  ]) {
    expect(requestSchema.safeParse({ ...draft, ...fields }).success).toBe(
      false,
    );
    expect(
      conversationActionSchema.safeParse({
        action: "submitRequest",
        payload: { ...draft, ...fields },
      }).success,
    ).toBe(false);
  }
  expect(requestSchema.safeParse({ ...draft, budget: 500000 }).success).toBe(
    true,
  ); // customer budget, not final charge
});

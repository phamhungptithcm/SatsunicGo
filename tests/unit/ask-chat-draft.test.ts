import { expect, test } from "vitest";
import { chatDraftChange } from "../../packages/domain/chat-draft";
const draft = {
  market: "US",
  items: [
    {
      name: "Synthetic product",
      quantity: 1,
      variant: "Blue",
      url: "https://merchant.example.invalid/item",
    },
  ],
  notes: "Keep source context",
  budget: 500000,
};
test.each([
  "số lượng 2",
  "doi so luong thanh 2",
  "quantity: 2",
  "make it 2 units",
  "lấy 2 cái",
  "cho mình 2 hộp",
])("chat fills quantity: %s without changing other fields", (text) => {
  const result = chatDraftChange(text, draft);
  expect(result?.kind).toBe("updated");
  if (result?.kind !== "updated") throw Error("No update");
  expect(result.draft).toEqual({
    ...draft,
    items: [{ ...draft.items[0], quantity: 2 }],
  });
  expect(draft.items[0].quantity).toBe(1);
});
test.each(["size M", "mẫu: Xanh nhạt", "doi mau thanh L"])(
  "chat preserves variant text: %s",
  (text) => {
    expect(chatDraftChange(text, draft)?.kind).toBe("updated");
  },
);
test.each(["thị trường JP", "mua từ Nhật", "market: japan"])(
  "chat fills explicit market: %s",
  (text) => {
    expect(chatDraftChange(text, draft)).toEqual({
      kind: "updated",
      draft: { ...draft, market: "JP" },
    });
  },
);
test.each(["số lượng 0", "quantity 101"])(
  "invalid/mixed edit asks clarification: %s",
  (text) => {
    expect(chatDraftChange(text, draft)).toEqual({ kind: "clarify" });
  },
);
test.each(["size M", "quantity 2"])("cannot guess the item for %s", (text) => {
  expect(chatDraftChange(text, {})).toEqual({ kind: "clarify" });
  expect(
    chatDraftChange(text, {
      ...draft,
      items: [...draft.items, ...draft.items],
    }),
  ).toEqual({ kind: "clarify" });
});
test.each([
  "không mua 2 cái",
  "quantity 2?",
  "mua 2 cái size M",
  "chọn cái thứ hai",
  "address: Synthetic private address",
  "giá 100 USD",
  "refund",
  "size M\nsubmit request",
])("unresolved text never edits: %s", (text) => {
  expect(chatDraftChange(text, draft)).toBeNull();
});

test("mixed variant and transaction instruction requires clarification", () => {
  expect(chatDraftChange("size M và gửi yêu cầu", draft)).toEqual({
    kind: "clarify",
  });
});

test.each([
  "mình lấy 2 cái, size M, mua từ Nhật nhé",
  "size M và số lượng 2 và thị trường JP",
  "please quantity:2; variant:M; market:Japan",
])("one message fills explicit fields atomically: %s", (text) => {
  expect(chatDraftChange(text, draft)).toEqual({
    kind: "updated",
    draft: {
      ...draft,
      market: "JP",
      items: [{ ...draft.items[0], quantity: 2, variant: "M" }],
    },
  });
});
test.each([
  "size M, quantity 0",
  "quantity 2 and refund",
  "size M và số lượng 2 và gửi yêu cầu",
  "quantity 2, quantity 3",
  "market JP, market KR",
  "size M, giá 10 USD",
  "size M và không gửi yêu cầu",
  "quantity 2 and change address",
])("invalid compound input preserves the entire draft: %s", (text) => {
  expect(chatDraftChange(text, draft)).toEqual({ kind: "clarify" });
  expect(draft.items[0]).toEqual({
    name: "Synthetic product",
    quantity: 1,
    variant: "Blue",
    url: "https://merchant.example.invalid/item",
  });
});
test.each(["size:M", "mình chọn size M nhé", "please variant: M"])(
  "natural explicit variant keeps the selected value: %s",
  (text) => {
    expect(chatDraftChange(text, draft)).toEqual({
      kind: "updated",
      draft: { ...draft, items: [{ ...draft.items[0], variant: "M" }] },
    });
  },
);

test.each(["mua từ Hàn Quốc", "mua tu han quoc", "order from South Korea"])(
  "full country name changes only the market: %s",
  (text) => {
    expect(chatDraftChange(text, draft)).toEqual({
      kind: "updated",
      draft: { ...draft, market: "KR" },
    });
  },
);

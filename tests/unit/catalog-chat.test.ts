import { describe, expect, it } from "vitest";
import {
  catalogChatAction,
  catalogChatSelection,
} from "../../packages/domain/catalog-chat";
const scope = { ownerId: "customer-a", conversationId: "conversation-a" };
const product = {
  id: "product-a",
  title: "Test shoes",
  slug: "test-shoes",
  status: "published",
  market: "JP",
  version: 3,
  orderable: true,
  listedPrice: 200000,
  termsVersion: "terms-v1",
  catalogOptions: ["Blue", "Red"],
};
const context = {
  ...scope,
  createdAt: 1000,
  stale: false,
  rows: [{ ...product, orderable: false }, product],
};
const selected = () => {
  const result = catalogChatAction(
    "chọn sản phẩm số 2",
    context,
    null,
    scope,
    1001,
  );
  if (result?.kind !== "updated") throw Error("expected selection");
  return result.choice;
};
describe("catalog chat selection and consent", () => {
  it.each([
    "chọn sản phẩm số 2",
    "mình chọn sản phẩm số 2 nhé",
    "select product 2",
    "please select item 2",
  ])("selects the displayed ordinal: %s", (raw) => {
    const result = catalogChatAction(raw, context, null, scope, 1001);
    expect(result?.kind).toBe("updated");
    if (result?.kind === "updated")
      expect(result.choice.product.id).toBe("product-a");
  });
  it.each([
    "chọn sản phẩm số 0",
    "chọn sản phẩm số 1",
    "chọn sản phẩm số 3",
    "chọn sản phẩm số 999",
  ])("rejects unavailable ordinal %s", (raw) =>
    expect(catalogChatAction(raw, context, null, scope, 1001)?.kind).toBe(
      "clarify",
    ),
  );
  it.each([
    "select product 2?",
    "không chọn sản phẩm số 2",
    "chọn sản phẩm số 2 và tạo đơn",
    "confirm selection and create order?",
    "do not confirm selection and create order",
    "confirm selection and create order if cheap",
  ])("never treats a question or mixed phrase as consent %s", (raw) =>
    expect(
      catalogChatAction(raw, context, selected(), scope, 1001)?.kind,
    ).not.toBe("confirm"),
  );
  it("requires a variant before confirmation", () =>
    expect(
      catalogChatAction(
        "xác nhận lựa chọn và tạo đơn",
        context,
        selected(),
        scope,
        1001,
      )?.kind,
    ).toBe("clarify"));
  it.each(["size Blue, số lượng 2", "please quantity:2; variant:blue"])(
    "edits all fields atomically %s",
    (raw) => {
      const result = catalogChatAction(raw, context, selected(), scope, 1001);
      expect(result?.kind).toBe("updated");
      if (result?.kind === "updated") {
        expect(result.choice.variant).toBe("Blue");
        expect(result.choice.quantity).toBe(2);
        expect(catalogChatSelection(result.choice, scope, 1001)).toEqual({
          productId: "product-a",
          productVersion: 3,
          variant: "Blue",
          quantity: 2,
        });
        expect(
          catalogChatAction(
            "confirm selection and create order",
            context,
            result.choice,
            scope,
            1001,
          )?.kind,
        ).toBe("confirm");
      }
    },
  );
  it.each([
    "size Green",
    "quantity 0",
    "quantity 101",
    "quantity 2; variant Green",
    "market US",
    "quantity 2; quantity 3",
    "size Blue và gửi yêu cầu",
  ])("rejects invalid edit without partial mutation %s", (raw) => {
    const before = selected();
    expect(catalogChatAction(raw, context, before, scope, 1001)?.kind).toBe(
      "clarify",
    );
    expect(before.quantity).toBe(1);
    expect(before.variant).toBe("");
  });
  it("rejects stale source", () =>
    expect(
      catalogChatAction(
        "select product 2",
        { ...context, stale: true },
        null,
        scope,
        1001,
      )?.kind,
    ).toBe("clarify"));
  it("rejects expired source", () =>
    expect(
      catalogChatAction("select product 2", context, null, scope, 301001)?.kind,
    ).toBe("clarify"));
  it("rejects future source", () =>
    expect(
      catalogChatAction("select product 2", context, null, scope, 999)?.kind,
    ).toBe("clarify"));
  it.each([
    { ...scope, ownerId: "customer-b" },
    { ...scope, conversationId: "conversation-b" },
  ])("fences context and choice %j", (wrong) => {
    expect(
      catalogChatAction("select product 2", context, null, wrong, 1001)?.kind,
    ).toBe("clarify");
    expect(
      catalogChatSelection({ ...selected(), variant: "Blue" }, wrong, 1001),
    ).toBeNull();
  });
  it("never submits expired choice", () =>
    expect(
      catalogChatSelection({ ...selected(), variant: "Blue" }, scope, 301001),
    ).toBeNull());
  it("bounds monetary total", () =>
    expect(
      catalogChatSelection(
        {
          ...selected(),
          variant: "Blue",
          quantity: 100,
          product: { ...selected().product, listedPrice: 1e12 },
        },
        scope,
        1001,
      ),
    ).toBeNull());
  it("rejects malformed product version", () =>
    expect(
      catalogChatAction(
        "select product 2",
        { ...context, rows: [product, { ...product, version: Infinity }] },
        null,
        scope,
        1001,
      )?.kind,
    ).toBe("clarify"));
  it("single option default matches the existing form", () => {
    const result = catalogChatAction(
      "select product 1",
      { ...context, rows: [{ ...product, catalogOptions: ["Blue"] }] },
      null,
      scope,
      1001,
    );
    if (result?.kind !== "updated") throw Error("expected");
    expect(result.choice.variant).toBe("Blue");
  });
  it("rejects folded ambiguous options", () => {
    const result = catalogChatAction(
      "select product 1",
      { ...context, rows: [{ ...product, catalogOptions: ["Đỏ", "Do"] }] },
      null,
      scope,
      1001,
    );
    if (result?.kind !== "updated") throw Error("expected");
    expect(
      catalogChatAction("size do", context, result.choice, scope, 1001)?.kind,
    ).toBe("clarify");
  });
});

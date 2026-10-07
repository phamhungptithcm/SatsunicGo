import { expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import {
  cartCommandSchema,
  cartItemsSchema,
  consumeCart,
  mergeCart,
  type CartItem,
} from "../../packages/domain/cart";
const row = (overrides: Partial<CartItem> = {}): CartItem => ({
  productId: "fixture-cart107",
  variant: "Blue",
  quantity: 2,
  lineId: randomUUID(),
  ...overrides,
});
it("merges matching choices, keeps different variants, and does not mutate input", () => {
  const original = row();
  const result = mergeCart([original], [row(), row({ variant: "White" })]);
  expect(result).toHaveLength(2);
  expect(result[0].quantity).toBe(4);
  expect(result[0].lineId).toBe(original.lineId);
  expect(original.quantity).toBe(2);
});
it("rejects duplicate lines, excess rows/quantities and injected price or owner", () => {
  const original = row();
  expect(cartItemsSchema.safeParse([original, original]).success).toBe(false);
  expect(() => mergeCart([row({ quantity: 100 })], [row()])).toThrow();
  expect(() =>
    mergeCart(
      [],
      Array.from({ length: 31 }, (_, n) => row({ productId: `fixture-${n}` })),
    ),
  ).toThrow();
  for (const quantity of [-1, 0, 1.5, 101, NaN])
    expect(cartItemsSchema.safeParse([row({ quantity })]).success).toBe(false);
  expect(
    cartCommandSchema.safeParse({
      action: "merge",
      operationId: randomUUID(),
      expectedRevision: 0,
      items: [row()],
      ownerId: "other",
      total: 1,
    }).success,
  ).toBe(false);
});
it("confirmed checkout subtracts only purchased quantity and preserves a concurrent increase", () => {
  const original = row({ quantity: 5 });
  expect(
    consumeCart([original], { ...original, quantity: 2 }, original.lineId)[0]
      .quantity,
  ).toBe(3);
  expect(
    consumeCart(
      [row({ lineId: original.lineId })],
      original,
      original.lineId,
    )[0].quantity,
  ).toBe(2);
});
it("a removed/re-added line and other variants survive reconciliation", () => {
  const chosen = row(),
    replacement = row(),
    different = row({ variant: "White" });
  expect(consumeCart([replacement, different], chosen, chosen.lineId)).toEqual([
    replacement,
    different,
  ]);
  expect(consumeCart([chosen], chosen, chosen.lineId)).toEqual([]);
});

import { z } from "zod";
import { catalogSelectionSchema } from "./catalog-checkout";
import { convertFx, money } from "./index";

export const cartItemSchema = catalogSelectionSchema
  .pick({ productId: true, variant: true, quantity: true })
  .extend({
    lineId: z.string().uuid(),
    kind: z.literal("custom").optional(),
    custom: z
      .object({
        draftId: z.string().uuid(),
        itemIndex: z.number().int().min(0).max(29),
        name: z.string().min(2).max(200),
        market: z.enum(["US", "JP", "KR"]),
        unitSourceMinor: z.number().int().positive().max(1000000000000),
        fxNumerator: z.number().int().positive().max(1e9),
        fxDenominator: z.number().int().positive().max(1e9),
        serviceBps: z.number().int().min(0).max(10000),
      })
      .strict()
      .optional(),
  })
  .strict()
  .refine((item) => (item.kind === "custom") === Boolean(item.custom));
export type CartItem = z.infer<typeof cartItemSchema>;
export const cartItemsSchema = z
  .array(cartItemSchema)
  .max(30)
  .refine(
    (items) =>
      new Set(items.map(cartKey)).size === items.length &&
      new Set(items.map((item) => item.lineId)).size === items.length,
  );
export const cartSchema = z.object({
  ownerId: z.string().min(1),
  revision: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
  items: cartItemsSchema,
  activeCheckoutId: z.string().uuid().nullable().optional(),
});
export type Cart = z.infer<typeof cartSchema>;
export function customCartTotal(item: CartItem) {
  if (!item.custom) throw Error("NOT_CUSTOM");
  const c = item.custom,
    goods = convertFx(
      money.parse(c.unitSourceMinor * item.quantity),
      c.fxNumerator,
      c.fxDenominator,
    );
  return money.parse(
    goods + Number((BigInt(goods) * BigInt(c.serviceBps) + 9999n) / 10000n),
  );
}
export function cartKey(
  item: Pick<CartItem, "productId" | "variant"> & Partial<CartItem>,
) {
  return item.kind === "custom"
    ? JSON.stringify(["custom", item.lineId])
    : JSON.stringify([item.productId, item.variant]);
}
export function mergeCart(items: CartItem[], incoming: CartItem[]): CartItem[] {
  const result = cartItemsSchema.parse(items).map((item) => ({ ...item }));
  for (const entry of cartItemsSchema.parse(incoming)) {
    const old = result.find((item) => cartKey(item) === cartKey(entry));
    if (old) old.quantity += entry.quantity;
    else result.push({ ...entry });
  }
  return cartItemsSchema.parse(result);
}
export function consumeCart(
  items: CartItem[],
  selection: Pick<CartItem, "productId" | "variant" | "quantity">,
  lineId: string,
): CartItem[] {
  return items.flatMap((item) => {
    // A removed/re-added line or a reduced quantity reflects a new user choice.
    if (
      item.lineId !== lineId ||
      cartKey(item) !== cartKey(selection) ||
      item.quantity < selection.quantity
    )
      return [item];
    const quantity = item.quantity - selection.quantity;
    return quantity ? [{ ...item, quantity }] : [];
  });
}
const operation = {
  operationId: z.string().uuid(),
  expectedRevision: z.number().int().nonnegative(),
};
export const cartCommandSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("merge"),
      ...operation,
      items: cartItemsSchema.min(1),
    })
    .strict(),
  z
    .object({
      action: z.literal("quantity"),
      ...operation,
      lineId: z.string().uuid(),
      quantity: z.number().int().min(1).max(100),
    })
    .strict(),
  z
    .object({
      action: z.literal("remove"),
      ...operation,
      lineId: z.string().uuid(),
    })
    .strict(),
  z
    .object({
      action: z.literal("consume"),
      operationId: z.string().uuid(),
      orderId: z.string().uuid(),
      lineId: z.string().uuid(),
    })
    .strict(),
]);
export type CartCommand = z.infer<typeof cartCommandSchema>;

import { z } from "zod";
import { catalogSelectionSchema } from "./catalog-checkout";

export const cartItemSchema = catalogSelectionSchema
  .pick({ productId: true, variant: true, quantity: true })
  .extend({ lineId: z.string().uuid() })
  .strict();
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
});
export type Cart = z.infer<typeof cartSchema>;
export function cartKey(item: Pick<CartItem, "productId" | "variant">) {
  return JSON.stringify([item.productId, item.variant]);
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

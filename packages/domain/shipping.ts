import { z } from "zod";
import { canDispatch, type Order } from "./index";
const instant = z.number().int().safe().positive().max(8640000000000000);
export const deliveryWindowSchema = z
  .object({ startAt: instant, endAt: instant })
  .strict()
  .refine((window) => window.startAt <= window.endAt);
export const manualDeliveryEstimateSchema = z
  .object({
    source: z.literal("staff"),
    startAt: instant,
    endAt: instant,
    recordedAt: instant,
  })
  .strict()
  .refine((window) => window.startAt <= window.endAt);
export type ManualDeliveryEstimate = z.infer<
  typeof manualDeliveryEstimateSchema
>;
/** Malformed legacy metadata is unknown, never a fabricated forecast. */
export function readManualDeliveryEstimate(
  value: unknown,
  observedAt: number,
): ManualDeliveryEstimate | null {
  if (
    !Number.isSafeInteger(observedAt) ||
    observedAt <= 0 ||
    observedAt > 8640000000000000
  )
    return null;
  const parsed = manualDeliveryEstimateSchema.safeParse(value);
  return parsed.success && parsed.data.recordedAt <= observedAt
    ? parsed.data
    : null;
}
export const allocationSchema = z
  .object({
    orderId: z.string().regex(/^[a-zA-Z0-9-]{1,80}$/),
    line: z.number().int().min(0).max(29),
    quantity: z.number().int().min(1).max(100),
  })
  .strict();
export type Allocation = z.infer<typeof allocationSchema>;
export type Parcel = {
  id: string;
  version: number;
  state: "packed" | "in_transit" | "delivered" | "failed" | "returned";
  allocations: Allocation[];
  weightGrams: number;
  route: string;
  warehouse: string;
  carrier?: string;
  tracking?: string;
  batchId?: string;
  deliveryEstimate?: ManualDeliveryEstimate;
};
export function verifyAllocations(
  orders: Order[],
  existing: Allocation[],
  proposed: Allocation[],
) {
  if (!proposed.length || proposed.length > 100)
    throw Error("INVALID_ALLOCATION");
  const byId = new Map(orders.map((o) => [o.id, o]));
  const totals = new Map<string, number>();
  for (const raw of [...existing, ...proposed]) {
    const a = allocationSchema.parse(raw),
      order = byId.get(a.orderId),
      item = order?.items[a.line];
    if (
      !order ||
      !item ||
      !order.packingComplete ||
      order.hold ||
      order.packedQuantity !==
        order.items.reduce((sum, i) => sum + i.quantity, 0)
    )
      throw Error("PACKING_NOT_READY");
    const key = `${a.orderId}:${a.line}`,
      quantity = (totals.get(key) ?? 0) + a.quantity;
    if (quantity > item.quantity) throw Error("DOUBLE_ALLOCATION");
    totals.set(key, quantity);
  }
}
export function verifyParcelDispatch(parcel: Parcel, orders: Order[]) {
  if (parcel.state !== "packed") throw Error("INVALID_STATE");
  for (const id of new Set(parcel.allocations.map((a) => a.orderId))) {
    const order = orders.find((o) => o.id === id);
    if (
      !order ||
      !(
        canDispatch(order) ||
        (order.stage === "IN_TRANSIT" &&
          order.finalApproved &&
          (!order.consolidatedFreight ||
            order.finalFreightVersion === order.consolidatedFreight.version) &&
          order.packingComplete &&
          !order.hold &&
          order.finalTotal !== undefined &&
          order.collected - order.refunded - (order.refundReserved ?? 0) >=
            order.finalTotal)
      )
    )
      throw Error("MEMBER_NOT_READY");
  }
}
export function fullyDelivered(order: Order, parcels: Parcel[]) {
  const delivered = new Map<number, number>();
  for (const parcel of parcels)
    if (parcel.state === "delivered")
      for (const a of parcel.allocations)
        if (a.orderId === order.id)
          delivered.set(a.line, (delivered.get(a.line) ?? 0) + a.quantity);
  return order.items.every(
    (item, line) => (delivered.get(line) ?? 0) === item.quantity,
  );
}

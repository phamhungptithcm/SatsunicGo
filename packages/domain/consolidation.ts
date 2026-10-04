import { allocateFreight, type Order } from "./index";
import { type Parcel, verifyParcelDispatch } from "./shipping";
export type Batch = {
  id: string;
  version: number;
  state: "sealed" | "dispatched";
  parcelIds: string[];
  orderIds: string[];
  freight: number;
  shares: Record<string, number>;
  warehouse: string;
  route: string;
  hub: string;
  service: string;
  cutoff: number;
};
export function freightShares(
  freight: number,
  weights: Record<string, number>,
  orders: Order[],
  parcels: Parcel[],
) {
  const ids = [
    ...new Set(parcels.flatMap((p) => p.allocations.map((a) => a.orderId))),
  ].sort();
  if (
    !ids.length ||
    ids.length > 10 ||
    orders
      .map((o) => o.id)
      .sort()
      .join("|") !== ids.join("|") ||
    Object.keys(weights).sort().join("|") !== ids.join("|") ||
    new Set(orders.map((o) => o.market)).size !== 1 ||
    new Set(parcels.map((p) => `${p.warehouse}|${p.route}`)).size !== 1 ||
    parcels.some((p) => p.state !== "packed")
  )
    throw Error("INCOMPATIBLE_BATCH");
  const sum = Object.values(weights).reduce((s, w) => s + w, 0);
  if (sum !== parcels.reduce((s, p) => s + p.weightGrams, 0))
    throw Error("WEIGHTS_NOT_CONSERVED");
  const shares = allocateFreight(
    freight,
    ids.map((id) => weights[id]),
  );
  return Object.fromEntries(ids.map((id, i) => [id, shares[i]]));
}
export function verifyBatchDispatch(
  batch: Batch,
  parcels: Parcel[],
  orders: Order[],
  now: number,
) {
  if (
    batch.state !== "sealed" ||
    orders
      .map((o) => o.id)
      .sort()
      .join("|") !== [...batch.orderIds].sort().join("|") ||
    Object.keys(batch.shares).sort().join("|") !==
      [...batch.orderIds].sort().join("|") ||
    Object.values(batch.shares).reduce((sum, share) => sum + share, 0) !==
      batch.freight ||
    now > batch.cutoff ||
    parcels.length !== batch.parcelIds.length ||
    new Set(parcels.map((p) => p.id)).size !== parcels.length ||
    parcels.some((p) => !batch.parcelIds.includes(p.id))
  )
    throw Error("INVALID_BATCH");
  for (const order of orders) {
    if (
      order.consolidatedFreight?.batchId !== batch.id ||
      order.consolidatedFreight.version !== batch.version ||
      order.finalFreightVersion !== batch.version
    )
      throw Error("UNAPPROVED_FREIGHT");
  }
  for (const parcel of parcels) verifyParcelDispatch(parcel, orders);
}

import { expect, test } from "vitest";
import type { Order } from "../../packages/domain";
import type { Parcel } from "../../packages/domain/shipping";
import {
  freightShares,
  verifyBatchDispatch,
  type Batch,
} from "../../packages/domain/consolidation";
const order: Order = {
  id: "a",
  ownerId: "customer",
  items: [{ name: "Item", variant: "", quantity: 1 }],
  market: "US",
  notes: "",
  stage: "READY_TO_SHIP",
  version: 1,
  createdAt: 1,
  collected: 100,
  refunded: 0,
  finalTotal: 100,
  finalApproved: true,
  packingComplete: true,
  packedQuantity: 1,
  consolidatedFreight: { batchId: "batch", version: 1, amount: 33 },
  finalFreightVersion: 1,
};
const parcel: Parcel = {
  id: "p",
  version: 1,
  state: "packed",
  allocations: [{ orderId: "a", line: 0, quantity: 1 }],
  weightGrams: 100,
  warehouse: "US",
  route: "US-VN",
};
const batch: Batch = {
  id: "batch",
  version: 1,
  state: "sealed",
  parcelIds: ["p"],
  orderIds: ["a"],
  freight: 33,
  shares: { a: 33 },
  warehouse: "US",
  route: "US-VN",
  hub: "VN",
  service: "Air",
  cutoff: 100,
};
test("freight rounding conserves every dong and verifies physical weight", () => {
  const b = { ...order, id: "b" };
  const p = {
    ...parcel,
    allocations: [
      ...parcel.allocations,
      { orderId: "b", line: 0, quantity: 1 },
    ],
    weightGrams: 300,
  };
  expect(freightShares(101, { a: 100, b: 200 }, [order, b], [p])).toEqual({
    a: 34,
    b: 67,
  });
  expect(() => freightShares(101, { a: 99, b: 200 }, [order, b], [p])).toThrow(
    "WEIGHTS_NOT_CONSERVED",
  );
  expect(() => freightShares(101, { a: 100, b: 200 }, [order], [p])).toThrow(
    "INCOMPATIBLE_BATCH",
  );
});
test("batch dispatch checks all members, final freight approval, hold and funds", () => {
  verifyBatchDispatch(batch, [parcel], [order], 99);
  for (const unsafe of [
    { ...order, collected: 99 },
    { ...order, hold: "inspection" },
    { ...order, finalFreightVersion: 2 },
  ])
    expect(() => verifyBatchDispatch(batch, [parcel], [unsafe], 99)).toThrow();
  expect(() => verifyBatchDispatch(batch, [parcel], [], 99)).toThrow(
    "INVALID_BATCH",
  );
  expect(() =>
    verifyBatchDispatch({ ...batch, shares: { a: 32 } }, [parcel], [order], 99),
  ).toThrow("INVALID_BATCH");
  expect(() => verifyBatchDispatch(batch, [parcel], [order], 101)).toThrow(
    "INVALID_BATCH",
  );
});

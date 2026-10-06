import { expect, test } from "vitest";
import {
  verifyAllocations,
  verifyParcelDispatch,
  fullyDelivered,
  type Parcel,
} from "../../packages/domain/shipping";
import type { Order } from "../../packages/domain";
const order: Order = {
  id: "order",
  ownerId: "a",
  items: [{ name: "Item", quantity: 2, variant: "" }],
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
  packedQuantity: 2,
};
const parcel: Parcel = {
  id: "parcel",
  version: 1,
  state: "packed",
  allocations: [{ orderId: "order", line: 0, quantity: 1 }],
  weightGrams: 200,
  warehouse: "origin",
  route: "US-VN",
};
test("allocations cannot duplicate a line beyond packed quantity", () => {
  verifyAllocations([order], [], parcel.allocations);
  expect(() =>
    verifyAllocations([order], parcel.allocations, [
      { orderId: "order", line: 0, quantity: 2 },
    ]),
  ).toThrow("DOUBLE_ALLOCATION");
});
test("dispatch rechecks every member money and hold", () => {
  verifyParcelDispatch(parcel, [order]);
  for (const unsafe of [
    { ...order, collected: 99 },
    { ...order, hold: "inspection" },
  ])
    expect(() => verifyParcelDispatch(parcel, [unsafe])).toThrow();
});
test("one delivered parcel never completes a partially delivered order", () => {
  const delivered = { ...parcel, state: "delivered" as const };
  expect(fullyDelivered(order, [delivered])).toBe(false);
  expect(
    fullyDelivered(order, [delivered, { ...delivered, id: "second" }]),
  ).toBe(true);
});

test("split parcel dispatch preserves catalog ceiling and all dispatch guards", () => {
  const catalog: Order = {
    ...order,
    purchaseKind: "catalog",
    stage: "IN_TRANSIT",
    catalogSnapshot: {
      productId: "product",
      productVersion: 1,
      slug: "product",
      title: "Item",
      variant: "",
      unitPrice: 50,
      quantity: 2,
      total: 100,
      termsVersion: "v1",
    },
  };
  expect(() => verifyParcelDispatch(parcel, [catalog])).not.toThrow();
  for (const unsafe of [
    { ...catalog, finalTotal: 101, collected: 101 },
    { ...catalog, refundReserved: 1 },
    { ...catalog, hold: "inspection" },
    { ...catalog, packingComplete: false },
    {
      ...catalog,
      consolidatedFreight: { batchId: "b", version: 2, amount: 0 },
      finalFreightVersion: 1,
    },
    { ...catalog, stage: "DELIVERED" as const },
  ])
    expect(() => verifyParcelDispatch(parcel, [unsafe])).toThrow();
});

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

import { it, expect } from "vitest";
import { evolve, type Order } from "../../packages/domain";
const order: Order = {
  id: "order",
  ownerId: "owner",
  stage: "DELIVERED",
  version: 4,
  market: "US",
  createdAt: 1,
  items: [{ name: "Synthetic", quantity: 1, variant: "" }],
  notes: "",
  collected: 100,
  refunded: 0,
  finalTotal: 100,
  finalApproved: true,
  packingComplete: true,
  packedQuantity: 1,
};
it("H10 receipt accepts authoritative parcel completion without inventing an order tracking number", () => {
  expect(
    evolve(order, "confirmReceipt", { received: true }, 100, {
      parcelDeliveryConfirmed: true,
    }).stage,
  ).toBe("COMPLETED");
  expect(order.tracking).toBeUndefined();
});
it("N06 receipt still rejects an unverified delivery or incomplete payment", () => {
  expect(() =>
    evolve(order, "confirmReceipt", { received: true }, 100),
  ).toThrow();
  expect(() =>
    evolve(
      { ...order, collected: 99 },
      "confirmReceipt",
      { received: true },
      100,
      { parcelDeliveryConfirmed: true },
    ),
  ).toThrow();
});

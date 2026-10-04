import { it, expect } from "vitest";
import { evolve, type Order, type Quote } from "../../packages/domain";
const quote: Quote = {
  goods: 1700000,
  service: 100000,
  sourceCosts: 0,
  internationalShipping: 150000,
  destinationShipping: 50000,
  discount: 0,
  sourceCurrency: "USD",
  sourceMinor: 6800,
  fxNumerator: 250,
  fxDenominator: 1,
  termsVersion: "test-v1",
  expiresAt: 999999,
  verifiedProduct: "Test verified product",
};
function initial(): Order {
  return {
    id: "a",
    ownerId: "customer-a",
    market: "US",
    items: [{ name: "Test item", url: "", quantity: 1, variant: "confirmed" }],
    notes: "",
    stage: "REQUESTED",
    createdAt: 1,
    version: 1,
    collected: 0,
    refunded: 0,
  };
}
it("runs lifecycle with increased final total and explicit approval", () => {
  let o = initial();
  o = evolve(o, "issueQuote", quote, 100);
  o = evolve(o, "acceptQuote", { quoteVersion: 1 }, 100);
  expect(() => evolve(o, "claimPurchase", {}, 100)).toThrow();
  o.collected = 1000000;
  o = evolve(o, "claimPurchase", {}, 100);
  o = evolve(
    o,
    "recordPurchase",
    {
      quantity: 1,
      supplierOrder: "test-order",
      evidence: "test-receipt",
      actualSourceMinor: 6800,
    },
    100,
  );
  o = evolve(
    o,
    "receive",
    { quantity: 1, condition: "good", evidence: "test-receiving" },
    100,
  );
  o = evolve(
    o,
    "pack",
    {
      weightGrams: 1000,
      dimensionsCm: [10, 10, 10],
      evidence: "test-packing",
      checklist: true,
    },
    100,
  );
  o = evolve(
    o,
    "finalize",
    { total: 2160000, reason: "Test final charges" },
    100,
  );
  expect(o.finalApproved).toBe(false);
  expect(() => evolve(o, "dispatch", {}, 100)).toThrow();
  o = evolve(o, "approveFinal", {}, 100);
  o.collected = 2160000;
  o = evolve(o, "hold", { reason: "" }, 100);
  expect(o.stage).toBe("READY_TO_SHIP");
  o = evolve(o, "dispatch", {}, 100);
  o = evolve(o, "track", { tracking: "test-track", delivered: true }, 100);
  expect(o.stage).toBe("DELIVERED");
});
it("rejects quote replacement after acceptance and stale/expired acceptance", () => {
  let o = evolve(initial(), "issueQuote", quote, 100);
  expect(() => evolve(o, "acceptQuote", { quoteVersion: 0 }, 100)).toThrow();
  expect(() =>
    evolve(o, "acceptQuote", { quoteVersion: 1 }, 1000000),
  ).toThrow();
  o = evolve(o, "acceptQuote", { quoteVersion: 1 }, 100);
  expect(() => evolve(o, "issueQuote", quote, 100)).toThrow();
});
it("partial receipt creates hold and cannot pack or dispatch", () => {
  let o = initial();
  o.stage = "PURCHASED";
  o.purchasedQuantity = 1;
  o.items[0].quantity = 2;
  o = evolve(
    o,
    "receive",
    { quantity: 1, condition: "good", evidence: "test-receiving" },
    100,
  );
  expect(o.hold).toBeTruthy();
  expect(() =>
    evolve(
      o,
      "pack",
      {
        weightGrams: 1000,
        dimensionsCm: [10, 10, 10],
        evidence: "test-packing",
        checklist: true,
      },
      100,
    ),
  ).toThrow();
});
it("a refund after readiness prevents dispatch", () => {
  const o = {
    ...initial(),
    stage: "READY_TO_SHIP",
    collected: 100,
    refunded: 1,
    finalTotal: 100,
    finalApproved: true,
    packingComplete: true,
  } as Order;
  expect(() => evolve(o, "dispatch", {}, 100)).toThrow();
});

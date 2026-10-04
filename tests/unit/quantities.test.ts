import { expect, test } from "vitest";
import { evolve, type Order } from "../../packages/domain";
const initial = (): Order => ({
  id: "fixture",
  ownerId: "fixture",
  market: "US",
  notes: "",
  stage: "PURCHASING",
  version: 1,
  createdAt: 1,
  collected: 100,
  refunded: 0,
  items: [
    { name: "First", quantity: 2, variant: "" },
    { name: "Second", quantity: 1, variant: "" },
  ],
});
const record = (
  quantity: number,
  lines: { line: number; quantity: number }[],
) => ({
  quantity,
  lines,
  supplierOrder: "fixture",
  evidence: "fixture only",
  actualSourceMinor: 1,
});
test("partial line purchases accumulate and cannot buy the same quantity again", () => {
  let o = evolve(
    initial(),
    "recordPurchase",
    record(1, [{ line: 0, quantity: 1 }]),
    1,
  );
  expect(o.stage).toBe("PURCHASING");
  expect(o.purchasedLines).toEqual([1, 0]);
  expect(() =>
    evolve(o, "recordPurchase", record(2, [{ line: 0, quantity: 2 }]), 1),
  ).toThrow();
  o = evolve(
    o,
    "recordPurchase",
    record(2, [
      { line: 0, quantity: 1 },
      { line: 1, quantity: 1 },
    ]),
    1,
  );
  expect(o.stage).toBe("PURCHASED");
  expect(o.purchasedQuantity).toBe(3);
});
test("multi-line aggregate receipt cannot conceal a duplicate or wrong line", () => {
  const o = evolve(
    initial(),
    "recordPurchase",
    record(3, [
      { line: 0, quantity: 2 },
      { line: 1, quantity: 1 },
    ]),
    1,
  );
  expect(() =>
    evolve(
      o,
      "receive",
      { quantity: 3, condition: "good", evidence: "fixture only" },
      1,
    ),
  ).toThrow();
  expect(() =>
    evolve(
      o,
      "receive",
      {
        quantity: 3,
        lines: [{ line: 0, quantity: 3 }],
        condition: "good",
        evidence: "fixture only",
      },
      1,
    ),
  ).toThrow();
  let received = evolve(
    o,
    "receive",
    {
      quantity: 2,
      lines: [{ line: 0, quantity: 2 }],
      condition: "good",
      evidence: "fixture only",
    },
    1,
  );
  expect(received.receivedQuantity).toBe(2);
  expect(() =>
    evolve(
      received,
      "receive",
      {
        quantity: 1,
        lines: [{ line: 0, quantity: 1 }],
        condition: "good",
        evidence: "fixture only",
      },
      1,
    ),
  ).toThrow();
  received = evolve(
    received,
    "receive",
    {
      quantity: 1,
      lines: [{ line: 1, quantity: 1 }],
      condition: "good",
      evidence: "fixture only",
    },
    1,
  );
  expect(received.receivedQuantity).toBe(3);
  expect(received.receivedLines).toEqual([2, 1]);
  expect(received.stage).toBe("ORIGIN_RECEIVED");
});

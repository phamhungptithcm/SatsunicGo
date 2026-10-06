import { expect, test } from "vitest";
import { checkProposal, proposalSchema } from "../../packages/domain/changes";
import type { Order } from "../../packages/domain";
const order: Order = {
  id: "o",
  ownerId: "a",
  market: "US",
  items: [{ name: "Item", variant: "", quantity: 2 }],
  notes: "",
  stage: "PURCHASING",
  version: 1,
  createdAt: 1,
  collected: 100,
  refunded: 0,
  acceptedAt: 1,
  quote: {
    goods: 100,
    service: 0,
    sourceCosts: 0,
    internationalShipping: 0,
    destinationShipping: 0,
    discount: 0,
    sourceCurrency: "USD",
    sourceMinor: 100,
    fxNumerator: 1,
    fxDenominator: 1,
    termsVersion: "v1",
    expiresAt: 100,
    verifiedProduct: "Fixture product",
  },
  purchasedLines: [1],
};
const p = proposalSchema.parse({
  kind: "partialCancellation",
  reason: "Unavailable size",
  termsVersion: "v1",
  lines: [{ line: 0, cancelQuantity: 1 }],
  finalPayable: 100,
  actualCosts: 40,
  evidence: "Supplier confirmation",
});
test("partial cancellation retains bought quantities and covers actual costs", () => {
  expect(() => checkProposal(order, p)).not.toThrow();
  expect(() =>
    checkProposal(order, { ...p, lines: [{ line: 0, cancelQuantity: 2 }] }),
  ).toThrow("USE_FULL_CANCELLATION");
  expect(() => checkProposal(order, { ...p, finalPayable: 39 })).toThrow(
    "UNCOVERED_COSTS",
  );
  expect(() =>
    checkProposal(order, {
      ...p,
      lines: [
        { line: 0, cancelQuantity: 1 },
        { line: 0, cancelQuantity: 1 },
      ],
    }),
  ).toThrow();
});
test("substitution cannot silently change quantities or already purchased goods", () => {
  expect(() =>
    checkProposal(order, {
      ...p,
      kind: "substitution",
      lines: [{ line: 0, cancelQuantity: 0, replacementName: "Other product" }],
    }),
  ).toThrow("ALREADY_PURCHASED");
  expect(() =>
    checkProposal(
      { ...order, purchasedLines: [] },
      {
        ...p,
        kind: "substitution",
        lines: [
          { line: 0, cancelQuantity: 1, replacementName: "Other product" },
        ],
      },
    ),
  ).toThrow("SUBSTITUTION_QUANTITY_CHANGED");
  expect(() =>
    checkProposal(order, {
      ...p,
      lines: [{ line: 0, cancelQuantity: 1, replacementName: "Other product" }],
    }),
  ).toThrow("UNEXPECTED_SUBSTITUTION");
});

test("multi-line substitution cannot rewrite a purchased variant", () => {
  const multi: Order = {
    ...order,
    items: [
      ...order.items,
      { name: "Second item", quantity: 1, variant: "old" },
    ],
    purchasedLines: [1, 0],
  };
  const substitution = {
    ...p,
    kind: "substitution" as const,
    lines: [
      { line: 0, cancelQuantity: 0, replacementVariant: "new size" },
      { line: 1, cancelQuantity: 0, replacementName: "Replacement item" },
    ],
  };
  expect(() => checkProposal(multi, substitution)).toThrow("ALREADY_PURCHASED");
  expect(() =>
    checkProposal(multi, {
      ...substitution,
      lines: [
        { line: 0, cancelQuantity: 0, replacementVariant: "" },
        substitution.lines[1],
      ],
    }),
  ).toThrow("ALREADY_PURCHASED");
  expect(() =>
    checkProposal({ ...multi, purchasedLines: [0, 0] }, substitution),
  ).not.toThrow();
  expect(() =>
    checkProposal(multi, {
      ...substitution,
      lines: [{ line: 0, cancelQuantity: 0 }, substitution.lines[1]],
    }),
  ).not.toThrow();
});

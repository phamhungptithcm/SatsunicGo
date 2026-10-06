import { describe, expect, it } from "vitest";
import type { Order } from "../../packages/domain";
import { checkProposal } from "../../packages/domain/changes";
import {
  changeProposalInput,
  changeRejection,
} from "../../src/features/orders/Changes";
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
  purchasedLines: [0],
};
function form(kind: string) {
  const data = new FormData();
  for (const [name, value] of Object.entries({
    kind,
    reason: "Supplier confirmation",
    evidence: "Actual supplier evidence",
    total: "100",
    costs: "40",
    "name-0": "Replacement product",
    "variant-0": "New size",
    "cancel-0": "1",
  }))
    data.set(name, value);
  return data;
}
describe("contextual change proposal domain", () => {
  it("substitution excludes hidden cancellation quantity", () => {
    const proposal = changeProposalInput(form("substitution"), order);
    expect(proposal.lines).toEqual([
      {
        line: 0,
        cancelQuantity: 0,
        replacementName: "Replacement product",
        replacementVariant: "New size",
      },
    ]);
    expect(() => checkProposal(order, proposal)).not.toThrow();
  });
  it("cancellation excludes hidden substitution identity", () => {
    const proposal = changeProposalInput(form("partialCancellation"), order);
    expect(proposal.lines).toEqual([{ line: 0, cancelQuantity: 1 }]);
    expect(() => checkProposal(order, proposal)).not.toThrow();
  });
  it("accepted terms, actual costs and hold resolution remain explicit", () => {
    const data = form("partialCancellation");
    data.set("resolveHold", "on");
    expect(changeProposalInput(data, order)).toMatchObject({
      termsVersion: "v1",
      actualCosts: 40,
      finalPayable: 100,
      resolveHold: true,
    });
  });
  it("missing selected lines cannot become a valid empty proposal", () => {
    const data = form("substitution");
    data.delete("name-0");
    expect(() => changeProposalInput(data, order)).toThrow();
  });
  it("retains additional variant-only lines including deliberate empty clear", () => {
    const multi: Order = {
      ...order,
      items: [
        order.items[0],
        { name: "Second", variant: "Large", quantity: 1 },
        { name: "Third", variant: "Blue", quantity: 1 },
      ],
      purchasedLines: [0, 0, 0],
    };
    const data = form("substitution");
    data.set("variant-1", "Small");
    data.set("variant-2", "");
    const proposal = changeProposalInput(data, multi);
    expect(proposal.lines).toEqual([
      {
        line: 0,
        cancelQuantity: 0,
        replacementName: "Replacement product",
        replacementVariant: "New size",
      },
      { line: 1, cancelQuantity: 0, replacementVariant: "Small" },
      { line: 2, cancelQuantity: 0, replacementVariant: "" },
    ]);
    expect(() => checkProposal(multi, proposal)).not.toThrow();
  });
  it("untouched original variants do not add hidden replacement lines", () => {
    const multi: Order = {
      ...order,
      items: [
        order.items[0],
        { name: "Second", variant: "Large", quantity: 1 },
      ],
    };
    const data = form("substitution");
    data.set("variant-1", "Large");
    expect(changeProposalInput(data, multi).lines).toHaveLength(1);
  });
  it("explicit precommit version rejection unlocks but transport outcome stays unknown", () => {
    expect(changeRejection({ code: "functions/aborted" })).toBe(true);
    expect(changeRejection({ code: "functions/permission-denied" })).toBe(true);
    for (const code of [
      "functions/unavailable",
      "functions/internal",
      "functions/deadline-exceeded",
      "functions/unknown",
    ])
      expect(changeRejection({ code })).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { createCatalogOrder } from "../../packages/domain/catalog-checkout";
import {
  canDispatch,
  evolve,
  orderStageLabel,
  paymentDue,
  paymentPurpose,
} from "../../packages/domain";
import { checkProposal } from "../../packages/domain/changes";
const product = {
  title: "Fixture product",
  slug: "fixture-product",
  status: "published",
  market: "US",
  version: 3,
  orderable: true,
  listedPrice: 100000,
  termsVersion: "fixture-v1",
  catalogOptions: ["Blue", "Red"],
};
const selection = {
  productId: "fixture-product",
  productVersion: 3,
  quantity: 2,
  variant: "Blue",
};
const context = { id: "fixture-order", ownerId: "fixture-customer", now: 100 };
const order = () => createCatalogOrder(product, selection, context);
describe("listed product full payment policy", () => {
  it("freezes authoritative price, selection and terms without quote/deposit", () => {
    const o = order();
    expect(o).toMatchObject({
      purchaseKind: "catalog",
      stage: "QUOTE_ACCEPTED",
      finalTotal: 200000,
      finalApproved: true,
      catalogSnapshot: {
        productVersion: 3,
        unitPrice: 100000,
        quantity: 2,
        total: 200000,
        variant: "Blue",
        termsVersion: "fixture-v1",
      },
    });
    expect(o.quote).toBeUndefined();
    expect(o.deposit).toBeUndefined();
    expect(paymentPurpose(o)).toBe("full");
    expect(paymentDue(o)).toBe(200000);
    expect(orderStageLabel(o)).toBe("Chờ thanh toán toàn bộ");
  });
  it.each([
    { ...product, listedPrice: undefined, referencePrice: 100000 },
    { ...product, listedPrice: 0 },
    { ...product, status: "draft" },
    { ...product, orderable: false },
    { ...product, termsVersion: "" },
    { ...product, catalogOptions: [], variants: "Unknown freeform variant" },
  ])("rejects missing binding price, unpublished or invalid products", (p) => {
    expect(() => createCatalogOrder(p, selection, context)).toThrow();
  });
  it.each([
    { ...selection, productVersion: 2 },
    { ...selection, variant: "Green" },
    { ...selection, quantity: 0 },
    { ...selection, quantity: 101 },
    { ...selection, quantity: 1.5 },
    { ...selection, amount: 1 },
  ])(
    "rejects stale version, unsupported selection or trusted client amount",
    (s) => {
      expect(() => createCatalogOrder(product, s, context)).toThrow();
    },
  );
  it("rejects total overflow and validates an unvaried product", () => {
    expect(() =>
      createCatalogOrder(
        { ...product, listedPrice: 1000000000000 },
        selection,
        context,
      ),
    ).toThrow();
    expect(
      createCatalogOrder(
        { ...product, catalogOptions: [] },
        { ...selection, variant: "" },
        context,
      ).finalTotal,
    ).toBe(200000);
  });
  it("requires full verified available money, including refund reservations", () => {
    const o = order();
    o.collected = 100000;
    expect(() => evolve(o, "claimPurchase", {}, 101)).toThrow();
    expect(paymentDue(o)).toBe(100000);
    o.collected = 200000;
    o.refundReserved = 1;
    expect(() => evolve(o, "claimPurchase", {}, 101)).toThrow();
    o.refundReserved = 0;
    o.refunded = 1;
    expect(() => evolve(o, "claimPurchase", {}, 101)).toThrow();
    o.refunded = 0;
    expect(evolve(o, "claimPurchase", {}, 101).stage).toBe("PURCHASING");
    expect(() =>
      evolve({ ...o, hold: "Fixture hold" }, "claimPurchase", {}, 101),
    ).toThrow();
  });
  it("blocks installments, re-quotation and repricing", () => {
    const o = order();
    expect(() => paymentDue(o, "deposit")).toThrow();
    expect(() => paymentDue(o, "balance")).toThrow();
    expect(() => evolve(o, "acceptQuote", { quoteVersion: 1 }, 101)).toThrow();
    expect(() =>
      evolve({ ...o, stage: "REQUESTED" }, "issueQuote", {}, 101),
    ).toThrow();
    expect(() =>
      evolve(
        { ...o, stage: "PACKED", packingComplete: true },
        "finalize",
        { total: 250000, reason: "Fixture higher freight" },
        101,
      ),
    ).toThrow();
  });
  it("fulfills without a second charge or final customer approval", () => {
    let o = order();
    o.collected = 200000;
    o = evolve(o, "claimPurchase", {}, 101);
    o = evolve(
      o,
      "recordPurchase",
      {
        quantity: 2,
        supplierOrder: "fixture-supplier",
        evidence: "fixture-receipt",
        actualSourceMinor: 1234,
      },
      102,
    );
    o = evolve(
      o,
      "receive",
      { quantity: 2, condition: "good", evidence: "fixture-receive" },
      103,
    );
    o = evolve(
      o,
      "pack",
      {
        weightGrams: 100,
        dimensionsCm: [10, 10, 10],
        evidence: "fixture-pack",
        checklist: true,
      },
      104,
    );
    expect(o.stage).toBe("READY_TO_SHIP");
    expect(paymentDue(o)).toBe(0);
    expect(canDispatch(o)).toBe(true);
    expect(canDispatch({ ...o, refunded: 1 })).toBe(false);
    expect(canDispatch({ ...o, refundReserved: 1 })).toBe(false);
    o = evolve(o, "dispatch", {}, 105);
    expect(o.stage).toBe("IN_TRANSIT");
    expect(o.finalTotal).toBe(200000);
  });
  it("permits cancellation before money arrives, blocks cancellation after partial payment", () => {
    expect(evolve(order(), "cancelRequest", {}, 101).stage).toBe("CANCELLED");
    expect(() =>
      evolve({ ...order(), collected: 1 }, "cancelRequest", {}, 101),
    ).toThrow();
  });
  it("preserves custom and legacy installment purposes", () => {
    const legacy = {
      ...order(),
      purchaseKind: undefined,
      catalogSnapshot: undefined,
      finalTotal: undefined,
      finalApproved: undefined,
      deposit: 100000,
      collected: 10000,
    };
    expect(paymentPurpose(legacy)).toBe("deposit");
    expect(paymentDue(legacy)).toBe(90000);
    expect(
      paymentPurpose({ ...legacy, finalTotal: 210000, finalApproved: true }),
    ).toBe("balance");
  });
  it("preserves customer-approved cancellation and rejects catalog increase", () => {
    const proposal = {
      kind: "cancellation" as const,
      reason: "Fixture cancellation",
      termsVersion: "fixture-v1",
      lines: [{ line: 0, cancelQuantity: 2 }],
      finalPayable: 0,
      actualCosts: 0,
      evidence: "fixture-evidence",
      resolveHold: false,
    };
    expect(() => checkProposal(order(), proposal)).not.toThrow();
    expect(() =>
      checkProposal(order(), { ...proposal, finalPayable: 200001 }),
    ).toThrow("CATALOG_REPRICING_FORBIDDEN");
  });
});

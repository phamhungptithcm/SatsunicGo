import { expect, it } from "vitest";
import { createCatalogOrder } from "../../packages/domain/catalog-checkout";
import {
  documentSnapshot,
  sharedDocument,
  type SalesDocument,
} from "../../packages/domain/invoices";
const seller = {
  name: "Fixture seller",
  address: "Synthetic address",
  contact: "example.invalid",
};
const product = {
  title: "Fixture product",
  slug: "fixture",
  status: "published",
  market: "US",
  version: 1,
  orderable: true,
  listedPrice: 100000,
  termsVersion: "fixture-v1",
};
const order = createCatalogOrder(
  product,
  { productId: "fixture", productVersion: 1, quantity: 2, variant: "" },
  { id: "fixture-order", ownerId: "fixture-owner", now: 1 },
);
it("freezes full catalog liability and net payments without introducing another collection", () => {
  const s = documentSnapshot(
    { ...order, collected: 220000, refunded: 10000 },
    seller,
    "Buyer",
  );
  expect(s).toMatchObject({
    total: 200000,
    netCollected: 210000,
    remainingDue: 0,
    overpayment: 10000,
    purchaseKind: "catalog",
  });
  expect(order.collected).toBe(0);
});
it("requires approved source, valid ledger and explicit seller; rejects higher catalog liability", () => {
  for (const bad of [
    { ...order, finalApproved: false },
    { ...order, collected: 0, refunded: 1 },
    { ...order, finalTotal: 200001 },
  ])
    expect(() => documentSnapshot(bad, seller, "Buyer")).toThrow();
  expect(() =>
    documentSnapshot(order, { ...seller, name: "" }, "Buyer"),
  ).toThrow();
});
it("capability projection excludes buyer/order/private identity and retains only explicit statement fields", () => {
  const d = {
    ...documentSnapshot(order, seller, "Private Buyer"),
    id: "doc",
    ownerId: "secret-owner",
    sourceOrderId: "secret-order",
    sourceVersion: 1,
    version: 1,
    state: "issued",
    kind: "internal_statement",
    currency: "VND",
    sellerVersion: 1,
    createdAt: 1,
    changedAt: 1,
    shareEpoch: 1,
    issueNumber: "SG-00000001",
    issuedAt: 2,
  } as SalesDocument;
  const s = sharedDocument(d);
  expect(s).not.toHaveProperty("buyerName");
  expect(s).not.toHaveProperty("ownerId");
  expect(s).not.toHaveProperty("sourceOrderId");
  expect(s.total).toBe(200000);
});

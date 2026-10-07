import { expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { SalesDocument } from "../../packages/domain/invoices";
vi.mock("../../src/shared/firebase", () => ({
  auth: null,
  callService: vi.fn(),
}));
import { StatementView } from "../../src/features/invoices/Documents";

const document: SalesDocument = {
  id: "fixture",
  ownerId: "fixture-owner",
  sourceOrderId: "fixture-order",
  sourceVersion: 1,
  version: 1,
  state: "draft",
  kind: "internal_statement",
  currency: "VND",
  purchaseKind: "catalog",
  seller: {
    name: "Fixture seller",
    address: "Synthetic address",
    contact: "example.invalid",
  },
  sellerVersion: 1,
  buyerName: "Synthetic buyer",
  lines: [{ name: "Synthetic item", variant: "Large", quantity: 2 }],
  total: 240000,
  collected: 0,
  refunded: 0,
  netCollected: 0,
  remainingDue: 240000,
  overpayment: 0,
  termsVersion: "fixture-v1",
  createdAt: 1,
  changedAt: 1,
  shareEpoch: 0,
};

it("draft amounts identify a draft snapshot and cannot be printed as an issued document", () => {
  const html = renderToStaticMarkup(createElement(StatementView, { document }));
  expect(html).toContain(
    "Số tiền được ghi nhận khi lập hoặc cập nhật bản nháp.",
  );
  expect(html).toContain("Còn phải thanh toán trong bản nháp");
  expect(html).not.toContain("tại thời điểm xuất");
  expect(html).toMatch(/<button[^>]*disabled=""/);
  expect(html).toContain("Không phải hóa đơn điện tử thuế.");
});

it("issued amounts retain their historical meaning and a voided document never becomes printable", () => {
  const html = renderToStaticMarkup(
    createElement(StatementView, {
      document: {
        ...document,
        state: "issued",
        issuedAt: 2,
        issueNumber: "SG-00000001",
      },
    }),
  );
  expect(html).toContain("Còn phải thanh toán tại thời điểm xuất");
  expect(html).toContain("hóa đơn không tạo khoản thu thứ hai");
  expect(html).not.toMatch(/<button[^>]*disabled=""/);
  const voided = renderToStaticMarkup(
    createElement(StatementView, {
      document: {
        ...document,
        state: "void",
        voidReason: "Synthetic correction",
      },
    }),
  );
  expect(voided).toContain("Synthetic correction");
  expect(voided).toMatch(/<button[^>]*disabled=""/);
});

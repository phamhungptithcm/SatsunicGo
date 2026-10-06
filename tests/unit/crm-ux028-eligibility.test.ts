import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Order } from "../../packages/domain";
vi.mock("../../src/shared/firebase", () => ({
  callService: vi.fn(),
  sendCommand: vi.fn(),
}));
import {
  ActionForm,
  claimPurchaseBlockReason,
} from "../../src/features/operations/Workbench";
const catalog = {
  id: "ux028",
  stage: "QUOTE_ACCEPTED",
  purchaseKind: "catalog",
  finalTotal: 240000,
  catalogSnapshot: { total: 240000 },
  collected: 240000,
  refunded: 0,
  refundReserved: 0,
  items: [{ name: "Fixture", quantity: 1 }],
  version: 1,
  market: "US",
} as Order;
describe("CRM purchase prerequisites reflect domain constraints", () => {
  it("permits funded catalog and custom deposit orders without changing command semantics", () => {
    expect(claimPurchaseBlockReason(catalog)).toBe("");
    expect(
      claimPurchaseBlockReason({
        ...catalog,
        purchaseKind: "custom",
        deposit: 120000,
        collected: 120000,
      }),
    ).toBe("");
  });
  it("accounts for refunds and reserved refunds before purchasing", () => {
    expect(claimPurchaseBlockReason({ ...catalog, refunded: 1 })).toContain(
      "thanh toán toàn bộ",
    );
    expect(
      claimPurchaseBlockReason({ ...catalog, refundReserved: 1 }),
    ).toContain("thanh toán toàn bộ");
  });
  it("blocks held, wrong-stage and missing financial projections", () => {
    expect(claimPurchaseBlockReason({ ...catalog, hold: "Check" })).toContain(
      "tạm giữ",
    );
    expect(
      claimPurchaseBlockReason({ ...catalog, stage: "PURCHASING" }),
    ).toContain("chưa ở bước");
    expect(
      claimPurchaseBlockReason({ ...catalog, finalTotal: undefined }),
    ).toContain("Chưa đủ thông tin");
    expect(claimPurchaseBlockReason({ ...catalog, collected: NaN })).toContain(
      "Chưa đủ thông tin",
    );
    expect(
      claimPurchaseBlockReason({
        ...catalog,
        purchaseKind: "custom",
        deposit: undefined,
      }),
    ).toContain("Chưa đủ thông tin");
  });
  it("renders unpaid action disabled with an associated explanation", () => {
    const html = renderToStaticMarkup(
      createElement(ActionForm, {
        order: { ...catalog, collected: 0 },
        roles: ["BUYER"],
        busy: false,
        submit: async () => {},
      }),
    );
    expect(html).toContain("Chưa đủ tiền để mua hàng");
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*aria-describedby=/);
  });
});

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { Order } from "../../packages/domain";
import { purchaseTestProjection } from "../../functions/src/purchase-test-projection";
import {
  matchesOrderKind,
  TestOrderBadge,
} from "../../src/features/orders/TestOrderBadge";

vi.mock("../../src/shared/firebase", () => ({
  callService: vi.fn(),
  sendCommand: vi.fn(),
}));
import {
  ActionForm,
  claimPurchaseBlockReason,
} from "../../src/features/operations/Workbench";
import { OrderTools } from "../../src/features/orders/OrderTools";

const provenance = {
  executionMode: "production_test" as const,
  executionPolicyVersion: 2,
  testRunId: "10000000-0000-4000-8000-000000000001",
};
const order = {
  id: "10000000-0000-4000-8000-000000000002",
  market: "US",
  stage: "QUOTE_ACCEPTED",
  items: [{ name: "Synthetic item", quantity: 1 }],
  version: 1,
  collected: 100,
  refunded: 0,
  deposit: 100,
} as Order;
const testRecords = [
  provenance,
  { testMode: true },
  { provider: "sepay_sandbox" },
  { paymentProvider: "sepay_sandbox" },
  { provider: "demo" },
  { paymentProvider: "demo" },
  { executionMode: "unknown" },
  { executionPolicyVersion: 2 },
  { testRunId: "invalid" },
];

describe("test record presentation boundary", () => {
  it.each(testRecords)(
    "marks and filters persisted test or unsafe provenance %j",
    (record) => {
      const html = renderToStaticMarkup(
        createElement(TestOrderBadge, { record }),
      );
      expect(html).toContain('role="note"');
      expect(html).toContain('aria-label="Đơn test"');
      expect(html).toContain(">Test</span>");
      expect(html).not.toContain("button");
      expect(matchesOrderKind(record, "test")).toBe(true);
      expect(matchesOrderKind(record, "live")).toBe(false);
      expect(matchesOrderKind(record, "all")).toBe(true);
    },
  );

  it.each([null, undefined, {}, { provider: "payos" }, { testMode: false }])(
    "keeps genuine or wholly absent provenance compatible %j",
    (record) => {
      expect(
        renderToStaticMarkup(createElement(TestOrderBadge, { record })),
      ).toBe("");
      expect(matchesOrderKind(record, "test")).toBe(false);
      expect(matchesOrderKind(record, "live")).toBe(true);
    },
  );

  it.each(testRecords)(
    "offers no real purchasing, warehouse or refund form for %j",
    (record) => {
      const testOrder = { ...order, ...record } as Order;
      const html = renderToStaticMarkup(
        createElement(ActionForm, {
          order: testOrder,
          roles: ["OWNER"],
          busy: false,
          submit: async () => {},
        }),
      );
      expect(html).toContain("Các thao tác mua và giao hàng đang tắt.");
      expect(html).not.toContain("<form");
      expect(html).not.toContain("<button");
      expect(html).not.toContain("<input");
      expect(claimPurchaseBlockReason(testOrder)).toContain("Đơn test");
    },
  );

  it("does not change role-granted live actions or empty support-only action visibility", () => {
    const render = (roles: string[]) =>
      renderToStaticMarkup(
        createElement(ActionForm, {
          order,
          roles,
          busy: false,
          submit: async () => {},
        }),
      );
    expect(render(["OWNER"])).toContain('value="recordPurchase"');
    expect(render(["SUPPORT"])).toBe("");
  });

  it("adapts the marker accessible name for feedback without adding a control", () => {
    const html = renderToStaticMarkup(
      createElement(TestOrderBadge, {
        record: { testMode: true },
        label: "Góp ý test",
      }),
    );
    expect(html).toContain('aria-label="Góp ý test"');
    expect(html).not.toContain("<button");
  });

  it("keeps test history distinct from the real sales-document workflow", () => {
    const html = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(OrderTools, {
          order: { ...order, ...provenance },
          section: "history",
          showImages: false,
        }),
      ),
    );
    expect(html).toContain("Lịch sử và thanh toán test");
    expect(html).not.toContain("/account/documents");
  });

  it("preserves the existing real-order history and document route", () => {
    const html = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(OrderTools, {
          order,
          section: "history",
          showImages: false,
        }),
      ),
    );
    expect(html).toContain("Lịch sử và bảng đối chiếu tiền");
    expect(html).toContain("/account/documents");
  });
});

describe("safe test provenance read projection", () => {
  it("returns only immutable display metadata without adding customer or financial data", () => {
    expect(
      purchaseTestProjection({
        ...provenance,
        ownerEmail: "synthetic@example.invalid",
        recipient: { phone: "synthetic" },
        collected: 100,
        testMode: true,
      }),
    ).toEqual({ ...provenance, testMode: true });
  });
  it.each(testRecords.slice(1))(
    "does not throw or reclassify legacy/partial tags as live %j",
    (record) => {
      expect(purchaseTestProjection(record)).toEqual({ testMode: true });
    },
  );
  it("adds no metadata to a genuine legacy record", () => {
    expect(
      purchaseTestProjection({ provider: "payos", ownerId: "synthetic" }),
    ).toEqual({});
  });
});

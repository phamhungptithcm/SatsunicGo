import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { OrderTools } from "../../src/features/orders/OrderTools";
import { PurchaseCompletion } from "../../src/features/cart/purchase-completion";
vi.mock("../../src/shared/firebase", () => ({
  callService: vi.fn(),
  auth: null,
}));
import {
  buildCheckout,
  assertVerifiedPayment,
  decimalSourceMinor,
  type PurchaseCheckout,
} from "../../packages/domain/purchase-checkout";
import {
  cartSchema,
  mergeCart,
  customCartTotal,
} from "../../packages/domain/cart";
import {
  evolve,
  paymentDue,
  paymentPurpose,
  purchaseAmount,
} from "../../packages/domain";
import { renderPurchaseReceipt } from "../../functions/src/purchase-pdf";
import {
  trackingMilestones,
  trackingStageLabel,
} from "../../packages/domain/order-tracking";

const custom = {
  lineId: "00000000-0000-4000-8000-000000000001",
  productId: "00000000-0000-4000-8000-000000000011",
  variant: "Trắng",
  quantity: 2,
  kind: "custom" as const,
  custom: {
    draftId: "00000000-0000-4000-8000-000000000011",
    itemIndex: 0,
    name: "Tai nghe",
    market: "US" as const,
    unitSourceMinor: 5800,
    fxNumerator: 250,
    fxDenominator: 1,
    serviceBps: 500,
  },
};
const listing = {
  lineId: "00000000-0000-4000-8000-000000000002",
  productId: "listed",
  variant: "",
  quantity: 1,
};
const policy = {
  enabled: true,
  approved: true,
  version: 1,
  serviceBps: 500,
  termsVersion: "v1",
  effectiveFrom: 0,
  expiresAt: 10000000,
  rates: {
    USD: { numerator: 250, denominator: 1 },
    JPY: { numerator: 170, denominator: 1 },
    KRW: { numerator: 20, denominator: 1 },
  },
};
const context = {
  id: "00000000-0000-4000-8000-000000000099",
  ownerId: "user",
  now: 100,
  revision: 2,
  items: [custom, listing],
  products: {
    listed: {
      title: "Tai nghe niêm yết",
      slug: "tai-nghe",
      status: "published",
      orderable: true,
      listedPrice: 1650000,
      termsVersion: "v1",
      market: "US",
      version: 1,
      catalogOptions: [],
    },
  },
  drafts: {
    [custom.custom.draftId]: {
      ownerId: "user",
      market: "US" as const,
      items: [
        {
          name: "Tai nghe",
          quantity: 2,
          variant: "Trắng",
          unitSourceMinor: 5800,
        },
      ],
      notes: "",
    },
  },
  policy,
  recipient: {
    recipient: "Khách hàng",
    phone: "0900000000",
    country: "VN",
    provinceCode: "79",
    communeCode: "26734",
    province: "TP. Hồ Chí Minh",
    commune: "Phường Bến Thành",
    street: "Số 10 đường thử",
    note: "",
  },
  orderIds: ["order-one", "order-two"],
  shipping: { state: "reference", amountUsdMinor: 1335 },
};
it("projects full upfront tracking without changing legacy deposit milestones", () => {
  const current = {
    stage: "PACKED" as const,
    purchaseKind: "custom" as const,
    upfrontPayment: true,
  };
  const steps = trackingMilestones(current, "vi").map((s) => s.label);
  expect(steps).toContain("Thanh toán ban đầu");
  expect(steps).toContain("Chốt chi phí còn lại");
  expect(steps).not.toContain("Thanh toán cọc");
  expect(steps).not.toContain("Báo giá");
  expect(trackingStageLabel(current, "en")).toBe(
    "Packed · remaining costs review",
  );
  expect(
    trackingMilestones({ ...current, upfrontPayment: false }, "vi").map(
      (s) => s.label,
    ),
  ).toContain("Thanh toán cọc");
});
it("renders paid fixed listing actions without requesting an invalid balance purpose", () => {
  const order = { ...buildCheckout(context).orders[1], collected: 1650000 };
  expect(order.finalApproved).toBe(true);
  const html = renderToString(
    createElement(
      MemoryRouter,
      null,
      createElement(OrderTools, { order, section: "actions" }),
    ),
  );
  expect(html).toContain(`/checkout/payment/${context.id}`);
  expect(html).not.toContain("Duyệt và thanh toán thêm");
  expect(html).not.toContain("Tạo link thanh toán payOS");
});
it("keeps initial and latest receipts reachable after the final funded payment", () => {
  const order = {
    ...buildCheckout(context).orders[0],
    stage: "READY_TO_SHIP" as const,
    collected: 3400000,
    finalTotal: 3400000,
    finalApproved: true,
    latestReceiptId: "latest-receipt",
  };
  const html = renderToString(
    createElement(
      MemoryRouter,
      null,
      createElement(OrderTools, { order, section: "actions" }),
    ),
  );
  expect(html).toContain(`/checkout/payment/${context.id}`);
  expect(html).toContain("/checkout/payment/latest-receipt");
  expect(html).not.toContain("Duyệt và thanh toán thêm");
  expect(html).not.toContain("Tạo link thanh toán payOS");
});
describe("mixed full upfront checkout", () => {
  it("renders a compact completed group with actual order links, one amount and an accessible PDF icon", () => {
    const checkout: PurchaseCheckout = {
      ...buildCheckout(context).snapshot,
      state: "paid",
      provider: "demo",
    };
    const html = renderToString(
      createElement(
        MemoryRouter,
        null,
        createElement(PurchaseCompletion, {
          checkout,
          receiptState: "ready",
          busy: false,
          error: "",
          onDownload: () => {},
        }),
      ),
    );
    expect(html).toContain("Thanh toán thành công");
    expect(html.match(/4\.695\.000/g)).toHaveLength(1);
    expect(html).toContain('href="/account/orders/order-one"');
    expect(html).toContain('href="/account/orders/order-two"');
    expect(html).toContain('href="/account"');
    expect(html).toContain('aria-label="Tải chứng từ PDF"');
    expect(html).not.toContain("Tiền đã được ghi nhận và phân bổ");
    expect(html).not.toContain("Thanh toán ban đầu");
    expect(html).not.toContain("hộp thư demo");
  });
  it("opens the single paid order directly and retains PDF failure recovery without duplicate payment", () => {
    const snapshot = buildCheckout(context).snapshot;
    const checkout: PurchaseCheckout = {
      ...snapshot,
      total: 255000,
      purpose: "balance",
      sourceOrderId: "order-one",
      lines: [
        {
          ...snapshot.lines[0],
          name: `Bổ sung chi phí · ${snapshot.lines[0].name}`,
          goods: 255000,
          service: 0,
          total: 255000,
        },
      ],
      state: "paid",
      provider: "demo",
    };
    const html = renderToString(
      createElement(
        MemoryRouter,
        null,
        createElement(PurchaseCompletion, {
          checkout,
          receiptState: "failed",
          busy: true,
          error: "Chứng từ cần kiểm tra lại.",
          onDownload: () => {},
        }),
      ),
    );
    expect(html.match(/255\.000/g)).toHaveLength(1);
    expect(html).not.toContain('href="/account"');
    expect(html).toContain('href="/account/orders/order-one"');
    expect(html).toContain('href="/support"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("disabled");
    expect(html).toContain('role="alert"');
    expect(html).not.toContain("Bổ sung chi phí ·");
    expect(html).not.toContain("thanh toán thêm");
  });
  it("conserves exact money, keeps freight outside initial charge and funds staff only after receipt", () => {
    const { snapshot, orders } = buildCheckout(context);
    expect(snapshot.total).toBe(4695000);
    expect(snapshot.goods).toBe(2900000);
    expect(snapshot.service).toBe(145000);
    expect(snapshot.listed).toBe(1650000);
    expect(snapshot.lines.reduce((n, l) => n + l.total, 0)).toBe(
      snapshot.total,
    );
    expect(paymentPurpose(orders[0])).toBe("full");
    expect(paymentDue(orders[0])).toBe(3045000);
    expect(purchaseAmount(orders[0])).toBe(3045000);
    expect(() => evolve(orders[0], "claimPurchase", {}, 101)).toThrow();
    expect(
      evolve({ ...orders[0], collected: 3045000 }, "claimPurchase", {}, 101)
        .stage,
    ).toBe("PURCHASING");
    expect(customCartTotal(custom)).toBe(3045000);
  });
  it("preserves legacy catalog shape and custom lines when adding a listing", () => {
    const cart = cartSchema.parse({
      ownerId: "user",
      revision: 1,
      updatedAt: 0,
      items: [custom, listing],
    });
    expect(cart.items[0].custom).toEqual(custom.custom);
    expect(
      mergeCart(cart.items, [{ ...listing, quantity: 1 }])[1].quantity,
    ).toBe(2);
    expect(mergeCart(cart.items, [{ ...listing, quantity: 1 }])[0].kind).toBe(
      "custom",
    );
    expect(
      cartSchema.safeParse({
        ownerId: "user",
        revision: 1,
        updatedAt: 0,
        items: [{ ...custom, custom: undefined }],
      }).success,
    ).toBe(false);
  });
  it("rejects unpublished/stale policy, cross-owner drafts and tampered private snapshots", () => {
    expect(() =>
      buildCheckout({ ...context, policy: { ...policy, approved: false } }),
    ).toThrow();
    expect(() => buildCheckout({ ...context, now: 10000001 })).toThrow(
      "PRICING_UNAVAILABLE",
    );
    expect(() =>
      buildCheckout({
        ...context,
        drafts: {
          [custom.custom.draftId]: {
            ...context.drafts[custom.custom.draftId],
            ownerId: "other",
          },
        },
      }),
    ).toThrow("DRAFT_OWNERSHIP");
    expect(() =>
      buildCheckout({
        ...context,
        items: [
          { ...custom, custom: { ...custom.custom, unitSourceMinor: 1 } },
          listing,
        ],
      }),
    ).toThrow("DRAFT_CHANGED");
    expect(() =>
      buildCheckout({
        ...context,
        products: { listed: { ...context.products.listed, orderable: false } },
      }),
    ).toThrow();
  });
  it("rounds money once in integer minor units and validates market precision", () => {
    expect(decimalSourceMinor("58.01", "US")).toBe(5801);
    expect(decimalSourceMinor("100", "JP")).toBe(100);
    for (const bad of ["-1", "0", "1.001", "NaN", "1e2"])
      expect(() => decimalSourceMinor(bad, "US")).toThrow();
    expect(() => decimalSourceMinor("1.1", "JP")).toThrow();
  });
  it("requires exact verified provider/merchant/currency/amount/reference", () => {
    const checkout = {
      ...buildCheckout(context).snapshot,
      state: "pending",
      provider: "demo",
    } as PurchaseCheckout;
    const proof = {
      provider: "demo",
      merchant: "demo-satsunicgo",
      currency: "VND",
      amount: 4695000,
      reference: "DEMO-ONE",
    };
    expect(() =>
      assertVerifiedPayment(checkout, proof, "demo-satsunicgo"),
    ).not.toThrow();
    for (const changed of [
      { amount: 1 },
      { currency: "USD" },
      { merchant: "other" },
      { provider: "payos" },
      { reference: "" },
    ])
      expect(() =>
        assertVerifiedPayment(
          checkout,
          { ...proof, ...changed },
          "demo-satsunicgo",
        ),
      ).toThrow();
    expect(() =>
      assertVerifiedPayment(
        { ...checkout, state: "cancelled" },
        proof,
        "demo-satsunicgo",
      ),
    ).toThrow();
  });
  it("blocks excess spending until approved and funded, then enforces the source ceiling", () => {
    const order = buildCheckout(context).orders[0];
    let sourcing = evolve(
      { ...order, collected: order.upfront!.initialTotal },
      "claimPurchase",
      {},
      200,
    );
    const record = {
      quantity: 2,
      supplierOrder: "DEMO-01",
      evidence: "Verified fixture",
      actualSourceMinor: 12400,
    };
    expect(() => evolve(sourcing, "recordPurchase", record, 201)).toThrow(
      "SOURCE_ADJUSTMENT_NOT_FUNDED",
    );
    sourcing = {
      ...sourcing,
      purchaseAdjustment: {
        version: 1,
        sourceLimitMinor: 12400,
        total: 3245000,
        reason: "Higher supplier price",
        approved: true,
      },
    };
    expect(() => evolve(sourcing, "recordPurchase", record, 201)).toThrow(
      "SOURCE_ADJUSTMENT_NOT_FUNDED",
    );
    sourcing.collected = 3245000;
    expect(() =>
      evolve(
        sourcing,
        "recordPurchase",
        { ...record, actualSourceMinor: 12401 },
        201,
      ),
    ).toThrow("SOURCE_ADJUSTMENT_NOT_FUNDED");
    const bought = evolve(sourcing, "recordPurchase", record, 201);
    expect(bought.actualSourceMinor).toBe(12400);
    expect(bought.stage).toBe("PURCHASED");
    expect(() =>
      evolve(
        { ...bought, stage: "PACKED", packingComplete: true },
        "finalize",
        { total: 3244999, reason: "Below recorded cost" },
        202,
      ),
    ).toThrow("ACTUAL_COST_NOT_COVERED");
  });
  it("renders stable bounded Unicode PDF snapshots and rejects broken allocations", () => {
    const snapshot = buildCheckout(context).snapshot,
      receipt = {
        ...snapshot,
        purpose: "initial" as const,
        provider: "demo",
        reference: "DEMO-01",
        paidAt: 1000,
        previouslyPaid: 0,
        snapshotHash: "fixture",
      };
    const pdf = renderPurchaseReceipt(receipt);
    expect(pdf.subarray(0, 8).toString()).toBe("%PDF-1.7");
    expect(pdf.equals(renderPurchaseReceipt(receipt))).toBe(true);
    expect(pdf.length).toBeLessThan(3000000);
    expect(() => renderPurchaseReceipt({ ...receipt, total: 1 })).toThrow(
      "RECEIPT_INVALID",
    );
    expect(() =>
      renderPurchaseReceipt({
        ...receipt,
        purpose: "balance",
        previouslyPaid: 1,
        finalTotal: receipt.total,
      }),
    ).toThrow("RECEIPT_BALANCE_INVALID");
    const lines = Array.from({ length: 30 }, (_, i) => ({
      ...snapshot.lines[0],
      name: `Món ${i + 1} với tên tiếng Việt có dấu dài `.repeat(5),
      total: 100000,
    }));
    const long = renderPurchaseReceipt({ ...receipt, lines, total: 3000000 });
    expect(
      (long.toString("binary").match(/\/Type \/Page \/Parent/g) ?? []).length,
    ).toBeGreaterThan(1);
  });
});

import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  availablePurchasePaymentMethods,
  isPurchasePaymentMethod,
} from "../../src/features/cart/purchase-payment-selection";
import { PurchasePaymentMethods } from "../../src/features/cart/purchase-payment-methods";
import { admitPurchaseCheckoutAcknowledgement } from "../../packages/domain/purchase-checkout";

const ready = (provider = "sepay_sandbox") => ({
  provider,
  methods: {
    BANK_TRANSFER: { available: true },
    NAPAS_BANK_TRANSFER: { available: false },
    CARD: { available: false },
  },
});

describe("server-authoritative payment selection", () => {
  it.each(["demo", "sepay_sandbox"])(
    "admits ready bank transfer for %s, including balance checkout",
    (provider) => {
      expect(availablePurchasePaymentMethods(ready(provider))).toEqual([
        "BANK_TRANSFER",
      ]);
    },
  );

  it.each([
    undefined,
    null,
    {},
    "ready",
    1,
    { provider: "sepay_sandbox" },
    { provider: "sepay_sandbox", methods: null },
    { provider: "sepay_sandbox", methods: {} },
    {
      provider: "sepay_sandbox",
      methods: { BANK_TRANSFER: { available: "true" } },
    },
    {
      provider: "sepay_sandbox",
      methods: { BANK_TRANSFER: { available: false } },
    },
    ready("unavailable"),
    ready("sepay_production"),
  ])("does not invent readiness for %j", (value) => {
    expect(availablePurchasePaymentMethods(value)).toEqual([]);
  });

  it("keeps NAPAS and card unavailable even if an unexpected capability enables them", () => {
    const value = ready();
    value.methods.NAPAS_BANK_TRANSFER.available = true;
    value.methods.CARD.available = true;
    expect(availablePurchasePaymentMethods(value)).toEqual(["BANK_TRANSFER"]);
  });

  it.each(["BANK_TRANSFER", "NAPAS_BANK_TRANSFER", "CARD"])(
    "recognizes %s without coercing a persisted pending method to bank transfer",
    (method) => expect(isPurchasePaymentMethod(method)).toBe(true),
  );
  it.each([undefined, null, "bank_transfer", "cash", {}, 1])(
    "rejects unknown persisted method %j",
    (method) => expect(isPurchasePaymentMethod(method)).toBe(false),
  );
});

describe("payment-method control semantics", () => {
  const markup = (
    enabledMethods: ("BANK_TRANSFER" | "CARD")[] = [],
    disabled = false,
  ) =>
    renderToStaticMarkup(
      createElement(PurchasePaymentMethods, {
        value: "BANK_TRANSFER",
        enabledMethods,
        disabled,
        onChange: () => {},
      }),
    );

  it("renders three labeled native radios, only the ready QR selected and enabled", () => {
    const html = markup(["BANK_TRANSFER"]);
    expect(html.match(/type="radio"/g)).toHaveLength(3);
    expect(html.match(/disabled=""/g)).toHaveLength(2);
    expect(html.match(/checked=""/g)).toHaveLength(1);
    expect(html).toContain('aria-label="QR chuyển khoản ngân hàng"');
    expect(html).toContain('aria-label="QR NAPAS chuyển khoản"');
    expect(html).toContain('aria-label="Thẻ ngân hàng"');
    expect(html).toContain("Phương thức thanh toán</legend>");
  });
  it("keeps all methods disabled and unselected when availability is missing", () => {
    const html = markup();
    expect(html.match(/disabled=""/g)).toHaveLength(3);
    expect(html).not.toContain('checked=""');
    expect(html).toContain('role="status"');
  });
  it("locks the entire group during submission without changing the chosen method", () => {
    const html = markup(["BANK_TRANSFER"], true);
    expect(html).toMatch(/^<fieldset[^>]+disabled=""/);
    expect(html.match(/checked=""/g)).toHaveLength(1);
  });
  it("does not unlock cards passed directly by a malformed caller", () => {
    const html = markup(["CARD"]);
    expect(html.match(/disabled=""/g)).toHaveLength(3);
    expect(html).not.toContain('checked=""');
  });
});

describe("selected method and commit acknowledgement binding", () => {
  const id = "00000000-0000-4000-8000-000000000001";
  const acknowledgement = {
    id,
    state: "pending",
    total: 125000,
    provider: "sepay_sandbox",
    paymentMethod: "BANK_TRANSFER",
  };
  it("admits the submitted method for the shared initial/balance contract", () => {
    expect(
      admitPurchaseCheckoutAcknowledgement(acknowledgement, id, "BANK_TRANSFER")
        .paymentMethod,
    ).toBe("BANK_TRANSFER");
  });
  it("rejects a missing or mismatched method before retiring the pending operation", () => {
    expect(() =>
      admitPurchaseCheckoutAcknowledgement(
        { ...acknowledgement, paymentMethod: undefined },
        id,
        "BANK_TRANSFER",
      ),
    ).toThrow();
    expect(() =>
      admitPurchaseCheckoutAcknowledgement(acknowledgement, id, "CARD"),
    ).toThrow();
  });
  it("retains compatibility for a legacy demo receipt and pending command without a method", () => {
    const legacy = { id, state: "pending", total: 125000, provider: "demo" };
    expect(admitPurchaseCheckoutAcknowledgement(legacy, id, undefined)).toEqual(
      legacy,
    );
  });
});

import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  admitSePayForm,
  paymentCapabilities,
  requireBankTransfer,
  SEPAY_MERCHANT,
  sepayInvoice,
  sepayIpnSchema,
  sepayPaidAt,
  sepayVnd,
  verifySePayReadback,
  type SePayIntent,
} from "../../packages/domain/purchase-sepay";
import {
  createSandboxAdapter,
  authenticSePayIpn,
} from "../../functions/src/payments/sepay-sandbox";
import { admitPurchaseCheckoutAcknowledgement } from "../../packages/domain/purchase-checkout";

const id = "00000000-0000-4000-8000-000000000001";
const now = Date.UTC(2026, 9, 9, 10, 0);
const intent: SePayIntent = {
  checkoutId: id,
  ownerId: "fixture-owner",
  invoice: sepayInvoice(id),
  merchant: SEPAY_MERCHANT,
  provider: "sepay_sandbox",
  amount: 125000,
  currency: "VND",
  paymentMethod: "BANK_TRANSFER",
  checkoutHash: "a".repeat(64),
  createdAt: now - 60000,
  expiresAt: now + 600000,
  providerOrderId: "SEPAY-123",
  providerInternalId: "123",
};
const transaction = {
  id: "456",
  transaction_id: "provider-456",
  payment_method: "BANK_TRANSFER",
  transaction_type: "PAYMENT",
  transaction_status: "APPROVED",
  transaction_amount: "125000.00",
  transaction_currency: "VND",
  transaction_date: "2026-10-09 17:00:00",
  card_number: "UNWANTED_CARD_DATA",
};
const order = {
  id: "123",
  order_id: "SEPAY-123",
  order_invoice_number: intent.invoice,
  order_status: "CAPTURED",
  order_amount: "125000.00",
  order_currency: "VND",
};
const raw = () =>
  structuredClone({ data: { ...order, transactions: [transaction] } });
const ipn = () =>
  sepayIpnSchema.parse({
    timestamp: now / 1000,
    notification_type: "ORDER_PAID",
    order,
    transaction,
    customer: { customer_id: "UNWANTED_PII" },
  });

it("preserves exact production-test provenance in authoritative sandbox proof", () => {
  const provenance = {
    executionMode: "production_test" as const,
    executionPolicyVersion: 1,
    testRunId: id,
  };
  expect(
    verifySePayReadback(raw(), { ...intent, ...provenance }, ipn(), now),
  ).toMatchObject(provenance);
  expect(() =>
    verifySePayReadback(
      raw(),
      { ...intent, executionMode: "production_test" },
      ipn(),
      now,
    ),
  ).toThrow();
});

describe("exact VND and Vietnam provider dates", () => {
  it.each(["1", "125000", "125000.0", "125000.00", "1000000000000"])(
    "accepts whole VND %s",
    (value) => expect(sepayVnd(value)).toBe(Number(value)),
  );
  it.each([
    0,
    1,
    null,
    "",
    "0",
    "0.00",
    "-1",
    "+1",
    "1.01",
    "1.001",
    "01",
    "1e5",
    " 1",
    "1 ",
    "NaN",
    "Infinity",
    "1000000000001",
    "9999999999999999999",
    "1,000",
  ])("rejects without coercion/rounding %j", (value) =>
    expect(() => sepayVnd(value)).toThrow(),
  );
  it("interprets an unzoned timestamp in Vietnam independently of host TZ", () =>
    expect(sepayPaidAt(transaction.transaction_date)).toBe(now));
  it.each([
    ["2026-10-09 00:00:00", "2026-10-08T17:00:00Z"],
    ["2026-10-09 23:59:59", "2026-10-09T16:59:59Z"],
    ["2028-02-29 00:00:00", "2028-02-28T17:00:00Z"],
    ["2026-10-09T00:00:00+07:00", "2026-10-08T17:00:00Z"],
    ["2026-10-09T12:00:00.123Z", "2026-10-09T12:00:00.123Z"],
    ["2026-10-09T00:00:00-04:00", "2026-10-09T04:00:00Z"],
  ])("preserves valid clock boundary %s", (raw, expected) =>
    expect(sepayPaidAt(raw)).toBe(Date.parse(expected)),
  );
  it.each([
    "2026-02-30 10:00:00",
    "2026-13-01 10:00:00",
    "2026-10-09",
    "yesterday",
    "2026-10-09T10:00:00",
    "2026-10-09 25:00:00",
    "2026-10-09 24:00:00",
    "2026-10-09T24:00:00+07:00",
    "2026-10-09T24:00:00Z",
    "2026-10-09 23:60:00",
    "2026-10-09 23:59:60",
  ])("rejects ambiguous/invalid dates %s", (value) =>
    expect(() => sepayPaidAt(value)).toThrow(),
  );
});
describe("readback is the only money proof", () => {
  it("binds merchant/invoice/order/transaction/method/amount and drops PII", () => {
    const proof = verifySePayReadback(raw(), intent, ipn(), now)!;
    expect(proof).toMatchObject({
      amount: 125000,
      merchant: SEPAY_MERCHANT,
      invoice: intent.invoice,
      transactionId: "456",
      paymentMethod: "BANK_TRANSFER",
      paidAt: now,
      state: "verified",
    });
    expect(JSON.stringify(proof)).not.toMatch(/UNWANTED|card_number|customer/);
    expect(JSON.stringify(ipn())).not.toMatch(/UNWANTED|card_number|customer/);
  });
  it.each(["AUTHENTICATION_NOT_NEEDED", "CANCELLED", "UNKNOWN"])(
    "does not settle status %s",
    (status) => {
      const r = raw();
      r.data.order_status = status;
      expect(verifySePayReadback(r, intent, undefined, now)).toBeNull();
    },
  );
  it.each([
    [
      "invoice",
      (r: ReturnType<typeof raw>) => {
        r.data.order_invoice_number = sepayInvoice(
          "00000000-0000-4000-8000-000000000002",
        );
      },
    ],
    [
      "order ID",
      (r: ReturnType<typeof raw>) => {
        r.data.order_id = "FOREIGN";
      },
    ],
    [
      "internal ID",
      (r: ReturnType<typeof raw>) => {
        r.data.id = "FOREIGN";
      },
    ],
    [
      "currency",
      (r: ReturnType<typeof raw>) => {
        r.data.order_currency = "USD";
      },
    ],
    [
      "order total",
      (r: ReturnType<typeof raw>) => {
        r.data.order_amount = "124999";
      },
    ],
    [
      "method",
      (r: ReturnType<typeof raw>) => {
        r.data.transactions[0].payment_method = "CARD";
      },
    ],
    [
      "refund",
      (r: ReturnType<typeof raw>) => {
        r.data.transactions[0].transaction_type = "REFUND";
      },
    ],
    [
      "declined",
      (r: ReturnType<typeof raw>) => {
        r.data.transactions[0].transaction_status = "DECLINED";
      },
    ],
    [
      "multiple payments",
      (r: ReturnType<typeof raw>) => {
        r.data.transactions.push({ ...transaction, id: "SECOND" });
      },
    ],
    [
      "transaction currency",
      (r: ReturnType<typeof raw>) => {
        r.data.transactions[0].transaction_currency = "USD";
      },
    ],
    [
      "future date",
      (r: ReturnType<typeof raw>) => {
        r.data.transactions[0].transaction_date = "2030-01-01 10:00:00";
      },
    ],
  ] as const)("rejects %s", (_, mutate) => {
    const r = raw();
    mutate(r);
    expect(() => verifySePayReadback(r, intent, undefined, now)).toThrow();
  });
  it("retains exact underpayment for review rather than rounding/allocating it", () => {
    const r = raw();
    r.data.transactions[0].transaction_amount = "124999.00";
    expect(verifySePayReadback(r, intent, undefined, now)?.amount).toBe(124999);
  });
  it("rejects readback before a trusted provider order ID is pinned", () =>
    expect(() =>
      verifySePayReadback(
        raw(),
        { ...intent, providerOrderId: undefined },
        undefined,
        now,
      ),
    ).toThrow());
  it("rejects wrong merchant scope", () =>
    expect(() =>
      verifySePayReadback(
        raw(),
        { ...intent, merchant: "FOREIGN" as typeof SEPAY_MERCHANT },
        undefined,
        now,
      ),
    ).toThrow());
  it("rejects notification transaction substitution", () => {
    const p = ipn();
    p.transaction.id = "FOREIGN";
    expect(() => verifySePayReadback(raw(), intent, p, now)).toThrow();
  });
  it("binds a notice to its own approved transaction in a multi-payment readback", () => {
    const r = raw();
    r.data.transactions.unshift({ ...transaction, id: "EARLIER" });
    expect(verifySePayReadback(r, intent, ipn(), now)?.transactionId).toBe(
      transaction.id,
    );
    expect(() => verifySePayReadback(r, intent, undefined, now)).toThrow();
  });
  it("rejects duplicate approved transaction IDs even with a notice", () => {
    const r = raw();
    r.data.transactions.push({ ...transaction });
    expect(() => verifySePayReadback(r, intent, ipn(), now)).toThrow();
  });
  it("cannot select a declined payment from a multi-payment notice", () => {
    const r = raw();
    r.data.transactions[0].transaction_status = "DECLINED";
    r.data.transactions.unshift({ ...transaction, id: "OTHER_APPROVED" });
    expect(() => verifySePayReadback(r, intent, ipn(), now)).toThrow();
  });
  it("never treats a void notice as approved payment", () => {
    const p = ipn();
    p.notification_type = "TRANSACTION_VOID";
    expect(() => verifySePayReadback(raw(), intent, p, now)).toThrow();
  });
});
describe("backend-only signing and form admission", () => {
  const adapter = createSandboxAdapter(
    "synthetic-fixture-only-never-a-credential",
  );
  it("produces SDK-compatible signature over exact ordered fields", () => {
    const form = adapter.form(intent),
      signature = form.fields.find(([k]) => k === "signature")![1];
    const bytes = form.fields
      .filter(([k]) => k !== "signature")
      .map(([k, v]) => `${k}=${v}`)
      .join(",");
    expect(signature).toBe(
      createHmac("sha256", "synthetic-fixture-only-never-a-credential")
        .update(bytes)
        .digest("base64"),
    );
    expect(admitSePayForm(form, { id, total: intent.amount })).toEqual(form);
    expect(JSON.stringify(form)).not.toContain("synthetic-fixture-only");
  });
  it.each([
    "https://pay.sepay.vn/v1/checkout/init",
    "https://evil.invalid",
    "javascript:alert(1)",
  ])("rejects form destination %s", (action) =>
    expect(() =>
      admitSePayForm(
        { ...adapter.form(intent), action },
        { id, total: intent.amount },
      ),
    ).toThrow(),
  );
  it.each([
    "order_amount",
    "merchant",
    "payment_method",
    "currency",
    "order_invoice_number",
    "success_url",
    "signature",
  ])("rejects tampered field %s", (key) => {
    const f = adapter.form(intent);
    f.fields = f.fields.map(([k, v]) => [k, k === key ? "TAMPERED" : v]);
    expect(() => admitSePayForm(f, { id, total: intent.amount })).toThrow();
  });
  it("rejects duplicate or arbitrary hidden fields", () => {
    const f = adapter.form(intent);
    f.fields.push(["order_amount", "125000"]);
    expect(() => admitSePayForm(f, { id, total: intent.amount })).toThrow();
    const g = adapter.form(intent);
    g.fields.push(["custom_data", "untrusted"]);
    expect(() => admitSePayForm(g, { id, total: intent.amount })).toThrow();
  });
  it.each([undefined, "", "wrong", ["fixture"], "x".repeat(513)])(
    "rejects invalid IPN auth %j",
    (value) => expect(authenticSePayIpn(value, "fixture")).toBe(false),
  );
  it("accepts exact IPN key and fails closed when unconfigured", () => {
    expect(authenticSePayIpn("fixture", "fixture")).toBe(true);
    expect(authenticSePayIpn("", "")).toBe(false);
  });
  it("does not enable unavailable payment methods", () => {
    expect(
      paymentCapabilities("unavailable").methods.BANK_TRANSFER.available,
    ).toBe(false);
    expect(paymentCapabilities("sepay_sandbox").methods.CARD.available).toBe(
      false,
    );
    expect(() => requireBankTransfer("CARD")).toThrow();
    expect(() => requireBankTransfer("NAPAS_BANK_TRANSFER")).toThrow();
  });
  it("binds acknowledgement to selected method; legacy demo remains compatible", () => {
    const ack = {
      id,
      state: "pending",
      total: 125000,
      provider: "sepay_sandbox",
      paymentMethod: "BANK_TRANSFER",
    };
    expect(
      admitPurchaseCheckoutAcknowledgement(ack, id, "BANK_TRANSFER"),
    ).toEqual(ack);
    expect(() =>
      admitPurchaseCheckoutAcknowledgement(ack, id, "CARD"),
    ).toThrow();
    expect(() =>
      admitPurchaseCheckoutAcknowledgement(
        { ...ack, paymentMethod: undefined },
        id,
      ),
    ).toThrow();
    expect(
      admitPurchaseCheckoutAcknowledgement(
        { ...ack, provider: "demo", paymentMethod: undefined },
        id,
      ).provider,
    ).toBe("demo");
  });
});
describe("bounded private readback transport", () => {
  it("limits form-action to the existing site and the exact sandbox checkout origin", () => {
    const config = JSON.parse(readFileSync("firebase.json", "utf8"));
    const headers = config.hosting.headers.flatMap(
      (h: { headers: { key: string; value: string }[] }) => h.headers,
    );
    const csp = headers.find(
      (h: { key: string; value: string }) =>
        h.key === "Content-Security-Policy",
    ).value as string;
    expect(
      csp
        .split(";")
        .find((d) => d.trim().startsWith("form-action"))
        ?.trim(),
    ).toBe("form-action 'self' https://pay-sandbox.sepay.vn");
    expect(csp).not.toContain("https://pay.sepay.vn");
  });
  it("uses the fixed sandbox host, provider ID and server-only Basic auth", async () => {
    let called = false;
    const a = createSandboxAdapter("fixture-key", async (url, options) => {
      called = true;
      expect(url).toBe(
        "https://pgapi-sandbox.sepay.vn/v1/order/detail/SEPAY-123",
      );
      expect(options?.redirect).toBe("error");
      expect(options?.headers).toHaveProperty("authorization");
      return new Response(JSON.stringify(raw()), {
        headers: { "content-type": "application/json" },
      });
    });
    expect(await a.readback("SEPAY-123")).toEqual(raw());
    expect(called).toBe(true);
    await expect(a.readback("../../secret")).rejects.toThrow(
      "SEPAY_ORDER_INVALID",
    );
  });
  it.each(["status", "html", "large", "malformed", "network"])(
    "redacts and releases %s failures",
    async (kind) => {
      const a = createSandboxAdapter("fixture-key", async () => {
        if (kind === "network") throw Error("Authorization SECRET PII");
        if (kind === "status") return new Response("SECRET", { status: 401 });
        if (kind === "html")
          return new Response("SECRET", {
            headers: { "content-type": "text/html" },
          });
        return new Response(kind === "large" ? "x".repeat(262145) : "SECRET", {
          headers: { "content-type": "application/json" },
        });
      });
      await expect(a.readback("SEPAY-123")).rejects.toThrow(
        /^SEPAY_READBACK_UNAVAILABLE$/,
      );
    },
  );
});

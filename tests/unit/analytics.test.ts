import { describe, it, expect } from "vitest";
import {
  analyticsEventSchema,
  firstCatalogPaidAt,
  classifyAsk,
  conversionEligible,
  DAY,
  publicRoute,
  safeSum,
  utcDay,
} from "../../packages/domain/analytics";
describe("analytics metric boundaries", () => {
  it("stores allowlisted codes, rejects raw questions, URLs and client payment flags", () => {
    const e = {
      id: crypto.randomUUID(),
      at: Date.now(),
      kind: "ask",
      topic: "shipping",
    };
    expect(analyticsEventSchema.safeParse(e).success).toBe(true);
    for (const extra of [
      { question: "secret" },
      { uid: "owner" },
      { paid: true },
      { topic: "arbitrary text" },
    ])
      expect(analyticsEventSchema.safeParse({ ...e, ...extra }).success).toBe(
        false,
      );
    expect(classifyAsk("Phí vận chuyển bao nhiêu?")).toBe("shipping");
    expect(classifyAsk("email person@example.com")).toBe("other");
  });
  it("excludes private routes and full URLs", () => {
    expect(publicRoute("/crm")).toBe(null);
    expect(publicRoute("/account/orders/x")).toBe(null);
    expect(publicRoute("/products/x/checkout")).toBe("checkout");
    expect(publicRoute("https://x/products")).toBe(null);
  });
  it("bounds conversion to the recorded-session cohort", () => {
    const start = Date.now();
    expect(conversionEligible(start, start - 1)).toBe(false);
    expect(conversionEligible(start, start + 7 * DAY)).toBe(true);
    expect(conversionEligible(start, start + 7 * DAY + 1)).toBe(false);
  });
  it("uses UTC buckets and rejects overflow", () => {
    expect(utcDay(Date.parse("2026-10-08T23:59:59-05:00"))).toBe("2026-10-09");
    expect(safeSum([20, -30])).toBe(-10);
    expect(() => safeSum([Number.MAX_SAFE_INTEGER, 1])).toThrow();
  });
});

it("assigns paid-order occurrence to the threshold installment day, not the first deposit", () => {
  const row = (amount: number, createdAt: number, kind = "payment") => ({
    kind,
    amount,
    createdAt,
    currency: "VND",
  });
  expect(firstCatalogPaidAt([row(500, 2), row(400, 1)], 900)).toBe(2);
  expect(
    firstCatalogPaidAt(
      [row(400, 1), row(500, 3), row(100, 2, "reversal")],
      900,
    ),
  ).toBe(null);
  expect(
    firstCatalogPaidAt(
      Array.from({ length: 101 }, () => row(10, 1)),
      900,
    ),
  ).toBe(null);
});

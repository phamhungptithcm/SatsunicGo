import { describe, it, expect } from "vitest";
import {
  requiredDeposit,
  balance,
  convertFx,
  allocateFreight,
  membershipDiscount,
  canDispatch,
  requireRole,
  csvCell,
  type Order,
} from "../../packages/domain";
describe("authoritative money invariants", () => {
  it("uses final charges, not the original half", () => {
    expect(requiredDeposit(2_000_000)).toBe(1_000_000);
    expect(
      balance(2_160_000, [{ kind: "payment", amount: 1_000_000 }]).remainingDue,
    ).toBe(1_160_000);
  });
  it("rounds upward and rejects invalid money", () => {
    expect(requiredDeposit(3)).toBe(2);
    expect(() => requiredDeposit(-1)).toThrow();
    expect(() => requiredDeposit(1.5)).toThrow();
    expect(convertFx(3, 10, 4)).toBe(8);
  });
  it("counts refunds and credits once", () => {
    expect(
      balance(
        100,
        [
          { kind: "payment", amount: 100 },
          { kind: "refund", amount: 20 },
        ],
        10,
      ),
    ).toEqual({ netCollected: 80, remainingDue: 10, overpayment: 0 });
    expect(balance(80, [{ kind: "payment", amount: 100 }]).overpayment).toBe(
      20,
    );
    expect(() => balance(100, [{ kind: "refund", amount: 20 }])).toThrow();
  });
  it("conserves all freight for generated weights", () => {
    for (let n = 1; n < 100; n++) {
      const weights = Array.from({ length: (n % 7) + 1 }, (_, i) => i + n + 1);
      const result = allocateFreight(n * 137, weights);
      expect(result.reduce((a, b) => a + b, 0)).toBe(n * 137);
      expect(result.every((v) => v >= 0)).toBe(true);
    }
  });
  it("does not discount goods or produce negative fees", () => {
    expect(membershipDiscount(100, 20, 10000, 1000, 30)).toBe(90);
  });
});
describe("authorization and shipping", () => {
  it("rejects customer and revoked roles", () => {
    expect(() => requireRole("verifyTransfer", [])).toThrow("FORBIDDEN");
    expect(() => requireRole("verifyTransfer", ["SUPPORT"])).toThrow();
    expect(() => requireRole("verifyTransfer", ["FINANCE"])).not.toThrow();
  });
  it("requires all dispatch guards", () => {
    const o = {
      stage: "READY_TO_SHIP",
      finalApproved: true,
      packingComplete: true,
      finalTotal: 100,
      collected: 100,
      refunded: 0,
    } as Order;
    expect(canDispatch(o)).toBe(true);
    for (const patch of [
      { hold: "review" },
      { collected: 99 },
      { refunded: 1 },
      { finalApproved: false },
      { packingComplete: false },
      { stage: "PACKED" },
    ])
      expect(canDispatch({ ...o, ...patch } as Order)).toBe(false);
  });
  it("escapes spreadsheet formulas", () => {
    expect(csvCell("=SUM(A1)")).toBe('"\'=SUM(A1)"');
    expect(csvCell('a"b')).toBe('"a""b"');
  });
});

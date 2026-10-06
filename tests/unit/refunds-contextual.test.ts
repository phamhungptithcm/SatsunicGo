import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("../../src/shared/firebase", () => ({
  callService: vi.fn(),
  sendCommand: vi.fn(),
}));
import {
  refundDecision,
  RefundDecisionFields,
  definiteRefundRejection,
  type Refund,
} from "../../src/features/payments/Refunds";
const row: Refund = {
  id: "fixture-refund",
  orderId: "fixture-order",
  amount: 240000,
  reason: "Approved fixture reason",
  state: "pending",
};
function form(action: string) {
  const f = new FormData();
  f.set("action", action);
  f.set("evidence", "Fixture proof");
  f.set("bank", "bank-proof-001");
  f.set("amount", "1");
  return f;
}
describe("Refund contextual decision design", () => {
  it("cancel excludes bank and money confirmation fields", () => {
    expect(refundDecision(form("cancel"), row, 3, "op-fixed")).toEqual({
      action: "cancel",
      id: row.id,
      orderId: row.orderId,
      expectedVersion: 3,
      operationId: "op-fixed",
      reason: "Fixture proof",
    });
  });
  it("confirm uses authoritative reserved amount and reason, not browser amount", () => {
    expect(refundDecision(form("confirm"), row, 3, "op-fixed")).toEqual({
      action: "refund",
      orderId: row.orderId,
      expectedVersion: 3,
      operationId: "op-fixed",
      payload: {
        refundRequestId: row.id,
        amount: 240000,
        bankTransactionId: "bank-proof-001",
        evidence: "Fixture proof",
        reason: row.reason,
      },
    });
  });
  it("rejects unrelated decisions rather than defaulting to real-money confirmation", () => {
    expect(() => refundDecision(form("other"), row, 3, "op-fixed")).toThrow();
  });
  it("cancellation shows reason without bank reference", () => {
    const html = renderToStaticMarkup(
      createElement(RefundDecisionFields, { action: "cancel" }),
    );
    expect(html).toContain("Lý do hủy");
    expect(html).not.toContain('name="bank"');
  });
  it("confirmation requires actual bank proof and labels evidence precisely", () => {
    const html = renderToStaticMarkup(
      createElement(RefundDecisionFields, { action: "confirm" }),
    );
    expect(html).toContain('name="bank"');
    expect(html).toContain('required=""');
    expect(html).toContain("Bằng chứng đối soát");
    expect(html).not.toContain("Lý do hủy");
  });
  it("network, timeout and unknown errors retain uncertain operation identity", () => {
    for (const e of [
      new Error("offline"),
      { code: "functions/deadline-exceeded" },
      { code: "functions/internal" },
    ])
      expect(definiteRefundRejection(e)).toBe(false);
  });
  it("explicit permission/version/validation rejection may release frozen controls", () => {
    for (const code of [
      "permission-denied",
      "aborted",
      "invalid-argument",
      "failed-precondition",
    ])
      expect(definiteRefundRejection({ code: `functions/${code}` })).toBe(true);
  });
});

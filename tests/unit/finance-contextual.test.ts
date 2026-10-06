import { describe, expect, it } from "vitest";
import {
  financeReviewInput,
  financeRejection,
} from "../../src/features/payments/FinancialReview";
import { financeStateLabel } from "../../src/features/payments/Finance";
function input(action: string) {
  const form = new FormData();
  for (const [name, value] of Object.entries({
    action,
    orderId: " full-order-id ",
    entryId: " original-entry ",
    amount: "250000",
    bank: "bank-proof-123",
    reason: "Verified original transaction",
    evidence: "Original bank evidence",
  }))
    form.set(name, value);
  return form;
}
describe("contextual finance authority", () => {
  it("closing an exception excludes order and reversal money fields", () => {
    expect(
      financeReviewInput(input("closeException"), {
        id: "exception-a",
        state: "open",
      }),
    ).toEqual({
      action: "closeException",
      id: "exception-a",
      reason: "Verified original transaction",
      evidence: "Original bank evidence",
    });
  });
  it("allocation requires verified inbound and retains the exact destination", () => {
    expect(() =>
      financeReviewInput(input("allocateException"), {
        id: "exception-a",
        state: "open",
        inboundVerified: false,
      }),
    ).toThrow();
    const payload = financeReviewInput(input("allocateException"), {
      id: "exception-a",
      state: "open",
      inboundVerified: true,
    });
    expect(payload.orderId).toBe("full-order-id");
    expect(payload).not.toHaveProperty("amount");
    expect(payload).not.toHaveProperty("bankTransactionId");
  });
  it("reversal retains original entry, actual amount and bank proof", () => {
    expect(financeReviewInput(input("reverse"))).toMatchObject({
      action: "reverse",
      orderId: "full-order-id",
      entryId: "original-entry",
      amount: 250000,
      bankTransactionId: "bank-proof-123",
    });
  });
  it("closed and unknown exception actions never project a new decision", () => {
    expect(() =>
      financeReviewInput(input("closeException"), {
        id: "exception-a",
        state: "closed",
      }),
    ).toThrow();
    expect(() =>
      financeReviewInput(input("reverse"), {
        id: "exception-a",
        state: "open",
        inboundVerified: true,
      }),
    ).toThrow();
  });
  it("unknown service outcomes remain unresolved rather than being discarded", () => {
    for (const code of [
      "functions/unavailable",
      "functions/internal",
      "functions/deadline-exceeded",
      "functions/unknown",
    ])
      expect(financeRejection({ code }, "financeReview")).toBe(false);
    expect(financeRejection(new Error("Offline"), "financeReview")).toBe(false);
    expect(
      financeRejection(
        { code: "functions/failed-precondition" },
        "financeReview",
      ),
    ).toBe(true);
    expect(
      financeRejection(
        { code: "functions/permission-denied" },
        "financeReview",
      ),
    ).toBe(true);
  });
  it("explicit CAS rejection is terminal only for the verified endpoints", () => {
    expect(
      financeRejection({ code: "functions/aborted" }, "financeReview"),
    ).toBe(true);
    expect(
      financeRejection({ code: "functions/aborted" }, "verifyTransfer"),
    ).toBe(true);
    expect(
      financeRejection({ code: "functions/aborted" }, "membershipCommand"),
    ).toBe(false);
    for (const service of [
      "financeReview",
      "verifyTransfer",
      "membershipCommand",
    ] as const) {
      for (const code of [
        "functions/unavailable",
        "functions/internal",
        "functions/deadline-exceeded",
        "functions/unknown",
      ])
        expect(financeRejection({ code }, service)).toBe(false);
    }
  });
  it("unknown invoice and exception states do not imply pending or completion", () => {
    expect(financeStateLabel("future-state", "invoice")).toBe(
      "Cần kiểm tra trạng thái",
    );
    expect(financeStateLabel("future-state", "exception")).toBe(
      "Cần kiểm tra trạng thái",
    );
    expect(financeStateLabel("constructor", "invoice")).toBe(
      "Cần kiểm tra trạng thái",
    );
    expect(financeStateLabel("__proto__", "exception")).toBe(
      "Cần kiểm tra trạng thái",
    );
    expect(financeStateLabel("closed", "exception")).toBe(
      "Đã đóng sau đối soát",
    );
    expect(financeStateLabel("paid", "invoice")).toBe("Đã xác nhận tiền");
  });
});

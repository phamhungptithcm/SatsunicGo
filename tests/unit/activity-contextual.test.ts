import { describe, expect, it } from "vitest";
import {
  activityLabel,
  outboxDecision,
  outboxRejection,
} from "../../src/features/crm/Activity";
const unknown = {
  id: "job-a",
  action: "invoiceIssued",
  createdAt: 1,
  emailState: "unknown",
  version: 4,
};
describe("activity outbox decisions", () => {
  it("unknown delivery cannot be blindly requeued", () => {
    expect(() => outboxDecision(unknown, "op")).toThrow();
    expect(() =>
      outboxDecision(unknown, "op", "guessed", "provider proof"),
    ).toThrow();
    expect(() =>
      outboxDecision(unknown, "op", "confirmed_sent", " "),
    ).toThrow();
  });
  it("reconciliation retains exact job/version/operation with actual provider evidence", () => {
    expect(
      outboxDecision(
        unknown,
        "fixed-op",
        "confirmed_not_sent",
        " provider reference ",
      ),
    ).toEqual({
      id: "job-a",
      expectedVersion: 4,
      operationId: "fixed-op",
      action: "resolveUnknown",
      outcome: "confirmed_not_sent",
      evidence: "provider reference",
    });
  });
  it("queue retry excludes reconciliation authority fields", () => {
    expect(outboxDecision({ ...unknown, emailState: "failed" }, "op")).toEqual({
      id: "job-a",
      expectedVersion: 4,
      operationId: "op",
      action: "retry",
    });
  });
  it("unknown transport remains pending but explicit version rejection does not", () => {
    for (const code of [
      "functions/unavailable",
      "functions/internal",
      "functions/deadline-exceeded",
      "functions/unknown",
    ])
      expect(outboxRejection({ code })).toBe(false);
    expect(outboxRejection({ code: "functions/aborted" })).toBe(true);
    expect(outboxRejection({ code: "functions/permission-denied" })).toBe(true);
  });
  it("future and inherited status/action keys never imply a known outcome", () => {
    for (const value of ["future", "constructor", "__proto__"]) {
      expect(activityLabel(value, "state")).toBe("Chưa xác định");
      expect(activityLabel(value, "action")).toBe("Cập nhật nghiệp vụ");
    }
    expect(activityLabel("sending", "state")).toBe("Đang gửi email");
  });
});

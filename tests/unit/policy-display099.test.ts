import { expect, it } from "vitest";
import {
  policyDateLabel,
  policyVersionLabel,
} from "../../src/features/settings/policy-display099";

it("does not turn missing policy metadata into an epoch date or literal null", () => {
  for (const value of [null, undefined, NaN, Infinity, 0, -1, "123"])
    expect(policyDateLabel(value)).toBe("Chưa có thời gian");
  for (const value of [null, undefined, NaN, 0, -1, 1.5])
    expect(policyVersionLabel(value)).toBe("Chưa có phiên bản");
});

it("retains real version and localized dates", () => {
  expect(policyVersionLabel(3)).toBe("Phiên bản 3");
  const timestamp = Date.UTC(2026, 9, 6);
  expect(policyDateLabel(timestamp)).toBe(
    new Date(timestamp).toLocaleString("vi-VN"),
  );
  expect(policyDateLabel(Number.MAX_VALUE)).toBe("Chưa có thời gian");
});

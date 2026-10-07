import { describe, expect, it } from "vitest";
import {
  dashboardMetrics,
  formatCount,
  parseSnapshot,
  periodForDays,
  resolvePeriod,
} from "../../src/features/crm/dashboard094-model";

const now = Date.parse("2026-10-07T02:30:00Z");
const day = 86400000;
describe("dashboard UTC periods", () => {
  it("includes today once, independent of the device timezone", () => {
    expect(periodForDays(7, now)).toEqual({
      from: "2026-10-01",
      until: "2026-10-07",
    });
    const range = resolvePeriod(periodForDays(1, now), now);
    expect(range).toEqual({
      from: Date.parse("2026-10-07T00:00:00Z"),
      until: now,
    });
  });
  it("includes the last millisecond of a completed day", () => {
    const range = resolvePeriod(
      { from: "2026-10-01", until: "2026-10-02" },
      now,
    );
    expect(range.until).toBe(Date.parse("2026-10-02T23:59:59.999Z"));
  });
  it("accepts 31 inclusive calendar days and rejects 32", () => {
    const range = resolvePeriod(
      { from: "2026-09-01", until: "2026-10-01" },
      now,
    );
    expect(range.until - range.from).toBe(31 * day - 1);
    expect(() =>
      resolvePeriod({ from: "2026-09-01", until: "2026-10-02" }, now),
    ).toThrow("31 ngày");
  });
  it.each([
    ["2026-02-30", "2026-03-01"],
    ["invalid", "2026-10-07"],
    ["2026-10-07", "2026-10-06"],
    ["2026-10-07", "2026-10-08"],
  ])("rejects impossible, reversed or future range %s -> %s", (from, until) => {
    expect(() => resolvePeriod({ from, until }, now)).toThrow();
  });
  it("rejects the zero-duration UTC midnight edge without sending an invalid callable", () => {
    const midnight = Date.parse("2026-10-07T00:00:00Z");
    expect(() => resolvePeriod(periodForDays(1, midnight), midnight)).toThrow(
      "Chưa có khoảng thời gian",
    );
  });
});
describe("dashboard sampled response integrity", () => {
  const range = resolvePeriod(periodForDays(7, now), now);
  const response = () => ({
    ...range,
    observedAt: now,
    truncated: [],
    counts: Object.fromEntries(
      Object.keys(dashboardMetrics).map((key) => [key, 0]),
    ),
  });
  it("preserves observed zero; missing/negative/fractional/oversized/non-numeric values remain unavailable", () => {
    const raw = response();
    delete raw.counts.quotes;
    Object.assign(raw.counts, {
      purchasing: -1,
      ready: 1.5,
      exceptions: 101,
      holds: "4",
      transfers: NaN,
    });
    const result = parseSnapshot(raw, range)!;
    expect(result.counts.requests).toBe(0);
    for (const key of [
      "quotes",
      "purchasing",
      "ready",
      "exceptions",
      "holds",
      "transfers",
    ] as const)
      expect(result.counts[key]).toBeNull();
    expect(formatCount(null)).toBe("—");
    expect(formatCount(0)).toBe("0");
  });
  it("rejects mismatched period and malformed coverage/time metadata", () => {
    expect(parseSnapshot({ ...response(), from: 1 }, range)).toBeNull();
    expect(
      parseSnapshot({ ...response(), truncated: ["unknown"] }, range),
    ).toBeNull();
    expect(
      parseSnapshot({ ...response(), observedAt: Infinity }, range),
    ).toBeNull();
    expect(
      parseSnapshot({ ...response(), observedAt: 9e15 }, range),
    ).toBeNull();
  });
  it("preserves overlapping queues without computing totals or conversion", () => {
    const raw = response();
    Object.assign(raw.counts, { holds: 4, balance: 4, requests: 4 });
    const result = parseSnapshot(
      { ...raw, truncated: ["orders", "orders"] },
      range,
    )!;
    expect(result.counts.holds).toBe(4);
    expect(result.counts.balance).toBe(4);
    expect(result.truncated).toEqual(["orders"]);
    expect(result).not.toHaveProperty("total");
    expect(result).not.toHaveProperty("conversion");
  });
});

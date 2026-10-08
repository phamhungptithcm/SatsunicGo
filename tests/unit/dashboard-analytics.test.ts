import { it, expect } from "vitest";
import { parseAnalyticsSnapshot } from "../../packages/domain/analytics";
const range = {
  from: Date.parse("2026-10-01"),
  until: Date.parse("2026-10-02"),
};
const snapshot = {
  version: 1,
  ...range,
  asOf: Date.now(),
  startedAt: range.from,
  enabled: true,
  complete: true,
  workingAvailable: true,
  finance: false,
  availability: {
    traffic: true,
    products: true,
    topics: true,
    stages: true,
    reason: "ready",
  },
  days: [],
  products: [],
  topics: [],
  stages: {},
  sessions: 10,
  browsers: 8,
  accounts: 2,
  buyers: 3,
  convertedSessions: 2,
  productSessions: 4,
  convertedProductSessions: 1,
  paidOrders: 3,
  linkedPaidOrders: 2,
  provisional: true,
  backlog: 0,
  deadLetters: 0,
  oldestPendingAt: 0,
  lastWorkerAt: 0,
};
it("rejects mismatched periods, impossible funnels and leaked money", () => {
  expect(parseAnalyticsSnapshot(snapshot, range)).not.toBe(null);
  for (const delta of [
    { until: 1 },
    { convertedSessions: 11 },
    { productSessions: 11 },
    { convertedProductSessions: 5 },
    { days: [{ day: "2026-10-01", counts: { payments: 30 } }] },
  ])
    expect(parseAnalyticsSnapshot({ ...snapshot, ...delta }, range)).toBe(null);
});
it("retains unavailable distinct metrics rather than synthesizing zero", () => {
  const s = parseAnalyticsSnapshot(
    {
      ...snapshot,
      sessions: null,
      browsers: null,
      convertedSessions: null,
      productSessions: null,
      convertedProductSessions: null,
      workingAvailable: false,
    },
    range,
  );
  expect(s?.sessions).toBe(null);
});

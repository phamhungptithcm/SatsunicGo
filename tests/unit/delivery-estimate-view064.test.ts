import { createElement } from "react";
import { it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  DeliveryEstimate,
  DeliveryEstimateForm,
} from "../../src/features/shipping/DeliveryEstimate";
const now = 1800000000000,
  window = {
    source: "staff",
    startAt: now + 1000,
    endAt: now + 2000,
    recordedAt: now - 100,
  };
it("malformed optional metadata stays unknown without exposing private fields", () => {
  for (const value of [
    null,
    undefined,
    { ...window, actor: "PRIVATE_ACTOR" },
  ]) {
    const text = renderToStaticMarkup(
      createElement(DeliveryEstimate, {
        value: value,
        state: "in_transit",
        observedAt: now,
      }),
    );
    expect(text).toContain("Chưa có thời gian giao dự kiến.");
    expect(text).not.toContain("PRIVATE_ACTOR");
  }
});
it("expired and failed parcel estimates never claim delivery or active notification", () => {
  const expired = renderToStaticMarkup(
    createElement(DeliveryEstimate, {
      value: { ...window, startAt: now - 1000, endAt: now - 500 },
      state: "in_transit",
      observedAt: now,
    }),
  );
  expect(expired).toContain("Đã qua khoảng dự kiến");
  const failed = renderToStaticMarkup(
    createElement(DeliveryEstimate, {
      value: window,
      state: "failed",
      observedAt: now,
    }),
  );
  expect(failed).toContain("Khoảng dự kiến cần được cập nhật");
  expect(failed).not.toContain("Đã giao");
  expect(failed).not.toContain("thông báo");
});
it("whole range preserves contributing update range and manual uncertainty in English", () => {
  const text = renderToStaticMarkup(
    createElement(DeliveryEstimate, {
      aggregate: true,
      value: {
        source: "staff_aggregate",
        startAt: now + 1000,
        endAt: now + 2000,
        oldestRecordedAt: now - 500,
        latestRecordedAt: now - 100,
      },
      observedAt: now,
      language: "en",
    }),
  );
  expect(text).toContain("Staff estimate; dates may change.");
  expect(text).toContain("Oldest estimate:");
  expect(text).toContain("Recorded:");
});
it("terminal parcel and expired whole window remain unknown", () => {
  const terminal = renderToStaticMarkup(
    createElement(DeliveryEstimate, {
      value: window,
      state: "delivered",
      observedAt: now,
    }),
  );
  expect(terminal).toContain("Chưa có thời gian giao dự kiến.");
  const whole = renderToStaticMarkup(
    createElement(DeliveryEstimate, {
      aggregate: true,
      value: {
        source: "staff_aggregate",
        startAt: now - 2000,
        endAt: now - 1000,
        oldestRecordedAt: now - 3000,
        latestRecordedAt: now - 3000,
      },
      observedAt: now,
    }),
  );
  expect(whole).toContain("Chưa có thời gian giao dự kiến được xác nhận.");
  const englishUnknown = renderToStaticMarkup(
    createElement(DeliveryEstimate, {
      aggregate: true,
      value: null,
      observedAt: now,
      language: "en",
    }),
  );
  expect(englishUnknown).toContain(
    "No confirmed delivery estimate is available.",
  );
});
it("compact staff form keeps persistent labels, disabled fence and no fabricated remove control", () => {
  const text = renderToStaticMarkup(
    createElement(DeliveryEstimateForm, {
      parcel: {
        id: "parcel",
        version: 1,
        state: "in_transit",
        allocations: [],
        route: "US-VN",
        warehouse: "Fixture",
        weightGrams: 1,
      },
      disabled: true,
      drafts: new Map(),
      capture: () => {},
      onSubmit: () => {},
    }),
  );
  expect(text).toContain("Thời gian giao dự kiến");
  expect(text).toContain("datetime-local");
  expect(text).toContain("Lý do cập nhật");
  expect(text).toContain("disabled");
  expect(text).not.toContain("Gỡ thời gian dự kiến");
});
it("staff overlap shows required no-default offset choice and explicit remove only with canonical estimate", () => {
  const clock = vi.spyOn(Date, "now").mockReturnValue(now);
  try {
    const drafts = new Map([
      [
        "parcel",
        {
          start: "2026-11-01T01:30",
          end: "2026-11-01T02:30",
          startChoice: "",
          endChoice: "",
          zone: "America/Chicago",
          evidence: "",
        },
      ],
    ]);
    const text = renderToStaticMarkup(
      createElement(DeliveryEstimateForm, {
        parcel: {
          id: "parcel",
          version: 1,
          state: "in_transit",
          allocations: [],
          route: "US-VN",
          warehouse: "Fixture",
          weightGrams: 1,
          deliveryEstimate: { ...window, source: "staff" },
        },
        disabled: false,
        drafts: drafts,
        capture: () => {},
        onSubmit: () => {},
      }),
    );
    expect(text).toContain("Chọn độ lệch UTC");
    expect(text).toContain("UTC−05:00");
    expect(text).toContain("UTC−06:00");
    expect(text).toContain("Gỡ thời gian dự kiến");
    expect(text).toContain('value="" selected');
  } finally {
    clock.mockRestore();
  }
});
it("accepts redacted tracking DTO with freshness but revalidates date/state and rejects extra keys", () => {
  const current = renderToStaticMarkup(
    createElement(DeliveryEstimate, {
      value: { ...window, freshness: "current" },
      state: "in_transit",
      observedAt: now,
    }),
  );
  expect(current).toContain("Dự kiến giao");
  const expired = renderToStaticMarkup(
    createElement(DeliveryEstimate, {
      value: {
        ...window,
        startAt: now - 1000,
        endAt: now - 500,
        freshness: "current",
      },
      state: "in_transit",
      observedAt: now,
    }),
  );
  expect(expired).toContain("Ước tính trước đó");
  expect(expired).toContain("Đã qua khoảng dự kiến");
  const malformed = renderToStaticMarkup(
    createElement(DeliveryEstimate, {
      value: { ...window, freshness: "current", actor: "PRIVATE" },
      state: "in_transit",
      observedAt: now,
    }),
  );
  expect(malformed).toContain("Chưa có thời gian giao dự kiến.");
  expect(malformed).not.toContain("PRIVATE");
});
it("compact aggregate keeps exact instants and recording range in accessible details", () => {
  const text = renderToStaticMarkup(
    createElement(DeliveryEstimate, {
      aggregate: true,
      compact: true,
      value: {
        source: "staff_aggregate",
        startAt: now + 1000,
        endAt: now + 2000,
        oldestRecordedAt: now - 500,
        latestRecordedAt: now - 100,
      },
      observedAt: now,
      language: "en",
    }),
  );
  expect(text).toContain("Estimated delivery");
  expect(text).toContain("Time details");
  expect(text).toContain("Staff estimate; dates may change.");
  expect(text).toContain("Oldest estimate:");
  expect(text).toContain(new Date(now + 1000).toISOString());
  expect(text).toContain(new Date(now + 2000).toISOString());
});

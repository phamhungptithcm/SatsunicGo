import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import {
  trackingMilestones,
  trackingMilestoneUpdates,
  type CustomerOrderTracking,
} from "../../packages/domain/order-tracking";
import { OrderTracking } from "../../src/features/ask/OrderTracking";
const base: CustomerOrderTracking = {
  orderId: "fixture-order",
  stage: "IN_TRANSIT",
  purchaseKind: "custom",
  upfrontPayment: true,
  version: 3,
  observedAt: 1800000000000,
  onHold: false,
  timeline: [],
  timelinePartial: false,
  shipments: [],
  shipmentsPartial: false,
  estimate: null,
};
const row = (action: string, createdAt: number) => ({ action, createdAt });
const html = (tracking: CustomerOrderTracking, language: "vi" | "en" = "vi") =>
  renderToStaticMarkup(
    createElement(
      MemoryRouter,
      {},
      createElement(OrderTracking, { tracking, language }),
    ),
  );
describe("event-backed compact tracking", () => {
  it("matches approved six upfront milestones without losing a requested current stage", () => {
    expect(trackingMilestones(base, "vi").map((s) => s.label)).toEqual([
      "Thanh toán ban đầu",
      "Mua hàng",
      "Kho & đóng gói",
      "Chốt chi phí còn lại",
      "Vận chuyển",
      "Giao hàng",
    ]);
    expect(
      trackingMilestones({ ...base, stage: "REQUESTED" }, "en").filter(
        (s) => s.state === "current",
      )[0].label,
    ).toBe("Request");
  });
  it("uses recorded activity, separates initial from final payments, keeps future delivery unknown", () => {
    const value = {
      ...base,
      timeline: [
        row("verifyTransfer", 10),
        row("claimPurchase", 20),
        row("recordPurchase", 30),
        row("receive", 40),
        row("pack", 50),
        row("verifyTransfer", 60),
        row("dispatch", 70),
        row("track", 80),
      ],
    };
    expect(trackingMilestoneUpdates(value, "vi")).toEqual([
      10,
      30,
      50,
      null,
      80,
      null,
    ]);
  });
  it("cannot infer payment from accepting a quote, partial history, or observedAt", () => {
    expect(
      trackingMilestoneUpdates(
        {
          ...base,
          timelinePartial: true,
          timeline: [row("verifyTransfer", 60), row("dispatch", 70)],
        },
        "vi",
      )[0],
    ).toBeNull();
    expect(
      trackingMilestoneUpdates(
        {
          ...base,
          timeline: [row("acceptQuote", 10), row("verifyTransfer", 60)],
        },
        "vi",
      )[0],
    ).toBeNull();
    expect(trackingMilestoneUpdates(base, "vi")).toEqual([
      null,
      null,
      null,
      null,
      null,
      null,
    ]);
  });
  it("ignores future dates, maps terminal/cancelled activity and never treats a delivered parcel as a delivered order", () => {
    expect(
      trackingMilestoneUpdates(
        { ...base, timeline: [row("dispatch", base.observedAt + 1)] },
        "vi",
      ),
    ).toEqual([null, null, null, null, null, null]);
    expect(
      trackingMilestoneUpdates(
        {
          ...base,
          stage: "DELIVERED",
          timeline: [row("track", 80), row("track", 90)],
        },
        "vi",
      ).at(-1),
    ).toBe(90);
    expect(
      trackingMilestoneUpdates(
        { ...base, stage: "CANCELLED", timeline: [row("cancelRequest", 50)] },
        "vi",
      ),
    ).toEqual([50]);
    const partiallyDelivered = {
      ...base,
      shipments: [{ id: "p", state: "delivered" as const, route: "JP-VN" }],
    };
    expect(trackingMilestones(partiallyDelivered, "vi").at(-1)?.state).toBe(
      "upcoming",
    );
  });
  it("retains privacy-safe text, escaped fields, unknown and partial disclosures, newest-first history", () => {
    const text = html({
      ...base,
      onHold: true,
      shipmentsPartial: true,
      timelinePartial: true,
      timeline: [row("dispatch", 10), row("track", 20)],
      shipments: [
        { id: "p", state: "failed", route: "<script>private</script>" },
      ],
    });
    expect(text).not.toContain("contextstrip");
    expect(text).not.toContain("Giao hàng đến bạn");
    expect(text).toContain("Đang tạm giữ xử lý");
    expect(text).toContain("Thông tin kiện chưa đầy đủ");
    expect(text).toContain("tối đa 50 cập nhật");
    expect(text).toContain("Chưa có thời gian giao dự kiến được xác nhận.");
    expect(text).toContain("&lt;script&gt;");
    expect(text).not.toContain("<script>");
    expect(text.indexOf("Đã cập nhật vận chuyển")).toBeLessThan(
      text.indexOf("Đã xuất gửi"),
    );
  });
  it("preserves catalog financial meaning and English recovery copy", () => {
    const text = html(
      { ...base, purchaseKind: "catalog", upfrontPayment: false },
      "en",
    );
    expect(text).not.toContain("Deposit payment");
    expect(text).not.toContain("Balance payment");
    expect(text).toContain("No update history yet.");
    expect(text).toContain("No parcel information yet.");
    expect(text).toContain("Recorded time unavailable");
  });
});
it("suppresses aggregate promises on hold, incomplete and terminal orders", () => {
  const estimate = {
    source: "staff_aggregate" as const,
    startAt: base.observedAt + 1000,
    endAt: base.observedAt + 2000,
    oldestRecordedAt: base.observedAt - 500,
    latestRecordedAt: base.observedAt - 100,
  };
  for (const delta of [
    { onHold: true },
    { shipmentsPartial: true },
    { stage: "DELIVERED" as const },
    { stage: "CANCELLED" as const },
  ]) {
    const text = html({ ...base, estimate, ...delta });
    expect(text).not.toContain("deliveryEstimateRange");
    expect(text).toContain("Chưa có thời gian giao dự kiến được xác nhận.");
  }
});

it.each(["receive", "pack", "dispatch"])(
  "imported history with only %s must not classify a late transfer as initial payment",
  (action) => {
    expect(
      trackingMilestoneUpdates(
        { ...base, timeline: [row("verifyTransfer", 60), row(action, 70)] },
        "vi",
      )[0],
    ).toBeNull();
  },
);

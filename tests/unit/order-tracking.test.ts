import { describe, expect, it } from "vitest";
import {
  extractOrderTrackingIntent,
  trackingMilestones,
  trackingStageLabel,
  validTrackingId,
} from "../../packages/domain/order-tracking";

describe("deterministic tracking intent", () => {
  const id = "550e8400-e29b-41d4-a716-446655440000";
  it("accepts typed UUID punctuation and explicitly labeled bounded codes", () => {
    expect(extractOrderTrackingIntent("Đơn (" + id + ") đang ở đâu?")).toEqual({
      kind: "order",
      orderId: id,
    });
    expect(extractOrderTrackingIntent("Order ID: order-42.")).toEqual({
      kind: "order",
      orderId: "order-42",
    });
    expect(extractOrderTrackingIntent("mã đơn hàng: " + id)).toEqual({
      kind: "order",
      orderId: id,
    });
  });
  it("deduplicates one ID but does not choose among multiple references", () => {
    expect(extractOrderTrackingIntent("mã đơn " + id + " " + id)).toEqual({
      kind: "order",
      orderId: id,
    });
    expect(
      extractOrderTrackingIntent("order id: order-1 và order code: order-2"),
    ).toEqual({ kind: "ambiguous", orderIds: ["order-1", "order-2"] });
  });
  it("ordinary buying text and an embedded UUID are not tracking references", () => {
    expect(extractOrderTrackingIntent("Tôi muốn mua áo mã xanh")).toEqual({
      kind: "none",
    });
    expect(extractOrderTrackingIntent("mã đơn chưa có")).toEqual({
      kind: "none",
    });
    expect(extractOrderTrackingIntent("prefix" + id + "suffix")).toEqual({
      kind: "none",
    });
    expect(extractOrderTrackingIntent("x".repeat(1001))).toEqual({
      kind: "none",
    });
  });
  it("rejects path traversal and IDs beyond the server bound", () => {
    for (const invalid of ["", "../orders", "a/b", "a".repeat(81), null])
      expect(validTrackingId(invalid)).toBe(false);
    expect(validTrackingId("a".repeat(80))).toBe(true);
  });
});
describe("stage projection meaning", () => {
  it("catalog avoids quote/deposit/balance while custom retains two payment steps", () => {
    const catalog = trackingMilestones(
      { stage: "PACKED", purchaseKind: "catalog" },
      "en",
    );
    expect(catalog.map((step) => step.label)).not.toContain("Deposit payment");
    expect(catalog.map((step) => step.label)).not.toContain("Balance payment");
    expect(
      catalog
        .filter((step) => step.state === "current")
        .map((step) => step.label),
    ).toEqual(["Warehouse & packing"]);
    const custom = trackingMilestones(
      { stage: "PACKED", purchaseKind: "custom" },
      "en",
    );
    expect(
      custom
        .filter((step) => step.state === "current")
        .map((step) => step.label),
    ).toEqual(["Balance payment"]);
    expect(
      trackingStageLabel(
        { stage: "QUOTE_ACCEPTED", purchaseKind: "catalog" },
        "en",
      ),
    ).not.toMatch(/paid|deposit/i);
  });
  it("in transit keeps delivery upcoming and cancellation is terminal", () => {
    expect(
      trackingMilestones(
        { stage: "IN_TRANSIT", purchaseKind: "catalog" },
        "en",
      ).at(-1),
    ).toEqual({ label: "Delivery", state: "upcoming" });
    expect(
      trackingMilestones({ stage: "CANCELLED", purchaseKind: "custom" }, "vi"),
    ).toEqual([{ label: "Đã hủy", state: "current" }]);
  });
});

it("reads unaccented order labels without truncating mixed Unicode IDs", () => {
  expect(extractOrderTrackingIntent("ma don ABC-123.")).toEqual({
    kind: "order",
    orderId: "ABC-123",
  });
  for (const text of [
    "ma don ABC-123４",
    "ma don ABC-123é",
    "ma don ABC-123.４",
    "ma don ABC-123\u0301",
    "ma don ＡBC-123",
  ])
    expect(extractOrderTrackingIntent(text)).toEqual({ kind: "none" });
});

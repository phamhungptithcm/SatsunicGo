import { performance } from "node:perf_hooks";
import { writeFileSync } from "node:fs";
import { it, expect } from "vitest";
import {
  aggregateDeliveryEstimate,
  trackingMilestoneUpdates,
  type CustomerOrderTracking,
} from "../../packages/domain/order-tracking";
it("60-parcel complete allocation and 50-event projection stay bounded without mutating input", () => {
  const now = 1800000000000;
  const parcels = Array.from({ length: 60 }, (_, i) => ({
    id: `p${i}`,
    version: 1,
    state: "in_transit" as const,
    allocations: [{ orderId: "order", line: 0, quantity: 1 }],
    deliveryEstimate: {
      source: "staff" as const,
      startAt: now + 1000,
      endAt: now + 2000,
      recordedAt: now - 100,
    },
  }));
  const value = {
    orderId: "order",
    ownerId: "owner",
    stage: "IN_TRANSIT" as const,
    onHold: false,
    items: [{ quantity: 60 }],
    allocation: {
      parcelIds: parcels.map((p) => p.id),
      allocations: parcels.flatMap((p) => p.allocations),
    },
    parcels,
    projections: parcels.map((p) => ({ ...p, ownerId: "owner" })),
    observedAt: now,
  };
  const tracking: CustomerOrderTracking = {
    orderId: "order",
    purchaseKind: "custom",
    upfrontPayment: true,
    version: 1,
    stage: "IN_TRANSIT",
    onHold: false,
    observedAt: now,
    timeline: Array.from({ length: 50 }, (_, i) => ({
      action: i === 0 ? "recordPurchase" : "track",
      createdAt: now - 100 + i,
    })),
    timelinePartial: true,
    shipmentsPartial: false,
    shipments: [],
    estimate: null,
  };
  const original = JSON.stringify(value);
  const samples: number[] = [];
  const benchmark = process.env.ORDER_TRACKING_BENCH_REPORT === "1";
  const iterations = benchmark ? 200 : 10;
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    const result = aggregateDeliveryEstimate(value);
    trackingMilestoneUpdates(tracking, "vi");
    samples.push(performance.now() - start);
    expect(result?.endAt).toBe(now + 2000);
  }
  expect(JSON.stringify(value)).toBe(original);
  expect(
    aggregateDeliveryEstimate({ ...value, parcels: [...parcels, parcels[0]] }),
  ).toBeNull();
  samples.sort((a, b) => a - b);
  if (benchmark)
    writeFileSync(
      "docs/reviews/ORDER-TRACKING-HARDENING-20261009/PERFORMANCE.json",
      JSON.stringify(
        {
          environment:
            "local Node; domain only; no provider/network/load guarantee",
          iterations,
          parcels: 60,
          events: 50,
          p50Ms: samples[100],
          p95Ms: samples[190],
          maxMs: samples[199],
        },
        null,
        2,
      ),
    );
});

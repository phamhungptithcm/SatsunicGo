import { describe, it, expect } from "vitest";
import {
  aggregateDeliveryEstimate,
  shipmentDeliveryEstimate,
} from "../../packages/domain/order-tracking";
import { deliveryWindowSchema } from "../../packages/domain/shipping";

const now = 1800000000000;
const window = (startAt = now + 1000, endAt = now + 3000) => ({
  source: "staff" as const,
  startAt,
  endAt,
  recordedAt: now - 100,
});
function fixture() {
  const parcels = [0, 1].map((line) => ({
    id: `parcel-${line}`,
    version: 2,
    state: "in_transit" as const,
    allocations: [{ orderId: "order-1", line, quantity: 1 }],
    deliveryEstimate: window(now + (line + 1) * 1000, now + (line + 3) * 1000),
  }));
  return {
    orderId: "order-1",
    ownerId: "owner-1",
    stage: "IN_TRANSIT" as const,
    onHold: false,
    items: [{ quantity: 1 }, { quantity: 1 }],
    allocation: {
      parcelIds: parcels.map((p) => p.id),
      allocations: parcels.flatMap((p) => p.allocations),
    },
    parcels,
    projections: parcels.map((p) => ({
      ...p,
      allocations: p.allocations.map((a) => ({ ...a })),
      deliveryEstimate: { ...p.deliveryEstimate },
      ownerId: "owner-1",
    })),
    observedAt: now,
  };
}
describe("manual delivery ETA", () => {
  it("rejects reversed, invalid date and unknown input fields", () => {
    expect(
      deliveryWindowSchema.safeParse({ startAt: now, endAt: now - 1 }).success,
    ).toBe(false);
    expect(
      deliveryWindowSchema.safeParse({ startAt: now, endAt: 8640000000000001 })
        .success,
    ).toBe(false);
    expect(
      deliveryWindowSchema.safeParse({
        startAt: now,
        endAt: now + 1,
        source: "carrier",
      }).success,
    ).toBe(false);
  });
  it("preserves unknown and exposes expired/failed uncertainty without renewing time", () => {
    expect(shipmentDeliveryEstimate(undefined, "in_transit", now)).toBeNull();
    expect(
      shipmentDeliveryEstimate(
        { ...window(), actor: "private" },
        "in_transit",
        now,
      ),
    ).toBeNull();
    expect(
      shipmentDeliveryEstimate(window(now - 300, now - 200), "in_transit", now)
        ?.freshness,
    ).toBe("expired");
    expect(shipmentDeliveryEstimate(window(), "failed", now)?.freshness).toBe(
      "needs_update",
    );
    expect(shipmentDeliveryEstimate(window(), "delivered", now)).toBeNull();
    expect(
      shipmentDeliveryEstimate(
        { ...window(), recordedAt: now + 1 },
        "in_transit",
        now,
      ),
    ).toBeNull();
    for (const clock of [Infinity, NaN, -1, 0, 1.5, 8640000000000001])
      expect(
        shipmentDeliveryEstimate(window(), "in_transit", clock),
      ).toBeNull();
  });
  it("uses the latest outstanding parcel range only after exact quantity proof", () => {
    expect(aggregateDeliveryEstimate(fixture())).toEqual({
      source: "staff_aggregate",
      startAt: now + 2000,
      endAt: now + 4000,
      oldestRecordedAt: now - 100,
      latestRecordedAt: now - 100,
    });
  });
  it("never converts partial/excess quantities or mismatched version into whole ETA", () => {
    const partial = fixture();
    partial.items[0].quantity = 2;
    expect(aggregateDeliveryEstimate(partial)).toBeNull();
    const extra = fixture();
    extra.items[0].quantity = 0;
    expect(aggregateDeliveryEstimate(extra)).toBeNull();
    const stale = fixture();
    stale.projections[0].version = 1;
    expect(aggregateDeliveryEstimate(stale)).toBeNull();
    const missing = fixture();
    missing.projections.pop();
    expect(aggregateDeliveryEstimate(missing)).toBeNull();
    const duplicate = fixture();
    duplicate.allocation.parcelIds[1] = duplicate.allocation.parcelIds[0];
    expect(aggregateDeliveryEstimate(duplicate)).toBeNull();
  });
  it("rejects unrelated projection quantities, foreign owner, stale or malformed estimate", () => {
    const foreign = fixture();
    foreign.projections[0].ownerId = "other";
    expect(aggregateDeliveryEstimate(foreign)).toBeNull();
    const mismatch = fixture();
    mismatch.projections[0].allocations[0].quantity = 2;
    expect(aggregateDeliveryEstimate(mismatch)).toBeNull();
    const stale = fixture();
    stale.parcels[0].deliveryEstimate = window(now - 300, now - 200);
    stale.projections[0].deliveryEstimate = stale.parcels[0].deliveryEstimate;
    expect(aggregateDeliveryEstimate(stale)).toBeNull();
    const different = fixture();
    different.projections[0].deliveryEstimate = window(now + 9000, now + 10000);
    expect(aggregateDeliveryEstimate(different)).toBeNull();
  });
  it("retains unknown for held, pre-shipping or failed/returned orders", () => {
    expect(
      aggregateDeliveryEstimate({ ...fixture(), onHold: true }),
    ).toBeNull();
    expect(
      aggregateDeliveryEstimate({ ...fixture(), stage: "PACKED" }),
    ).toBeNull();
    for (const state of ["failed", "returned", "packed"] as const) {
      const f = fixture();
      expect(
        aggregateDeliveryEstimate({
          ...f,
          parcels: f.parcels.map((p) => ({ ...p, state })),
          projections: f.projections.map((p) => ({ ...p, state })),
        }),
      ).toBeNull();
    }
  });
  it("one delivered parcel is quantity coverage, never whole delivery or a future estimate", () => {
    const f = fixture();
    const partly = {
      ...f,
      parcels: f.parcels.map((p, i) => ({
        ...p,
        state: i ? "in_transit" : "delivered",
      })),
      projections: f.projections.map((p, i) => ({
        ...p,
        state: i ? "in_transit" : "delivered",
      })),
    };
    expect(aggregateDeliveryEstimate(partly)?.endAt).toBe(now + 4000);
    expect(
      aggregateDeliveryEstimate({
        ...partly,
        parcels: partly.parcels.map((p) => ({ ...p, state: "delivered" })),
        projections: partly.projections.map((p) => ({
          ...p,
          state: "delivered",
        })),
      }),
    ).toBeNull();
  });
});

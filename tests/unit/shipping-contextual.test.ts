import { describe, expect, it, vi } from "vitest";
vi.mock("../../src/shared/firebase", () => ({ callService: vi.fn() }));
import type { Parcel } from "../../packages/domain/shipping";
import { parcelDecision } from "../../src/features/shipping/Shipping";
import { consolidationSelection } from "../../src/features/shipping/Consolidation";
const p: Parcel = {
  id: "p",
  version: 1,
  state: "packed",
  allocations: [
    { orderId: "a", line: 0, quantity: 1 },
    { orderId: "a", line: 1, quantity: 1 },
  ],
  weightGrams: 250,
  route: "fixture",
  warehouse: "fixture",
};
describe("Shipping contextual selection", () => {
  it("does not offer individual dispatch for a parcel owned by a batch", () => {
    expect(parcelDecision({ ...p, batchId: "batch" }, true, true)).toBeNull();
  });
  it("offers dispatch only to pack roles for a packed unbatched parcel", () => {
    expect(parcelDecision(p, true, false)).toBe("dispatch");
    expect(parcelDecision(p, false, true)).toBeNull();
  });
  it("offers tracking only for in-transit or failed states and authorized roles", () => {
    expect(parcelDecision({ ...p, state: "failed" }, false, true)).toBe(
      "track",
    );
    expect(parcelDecision({ ...p, state: "delivered" }, true, true)).toBeNull();
    expect(
      parcelDecision({ ...p, state: "in_transit" }, true, false),
    ).toBeNull();
  });
  it("shows weights only for selected parcel members, deduplicated by actual order ID", () => {
    const other = {
      ...p,
      id: "q",
      allocations: [{ orderId: "b", line: 0, quantity: 1 }],
    };
    expect(
      consolidationSelection([p, other], [{ id: "a" }, { id: "b" }], ["p"]),
    ).toEqual({ orderIds: ["a"], weightGrams: 250, missingOrders: false });
  });
  it("does not silently omit an unloaded order in the selected batch", () => {
    expect(consolidationSelection([p], [], ["p"]).missingOrders).toBe(true);
  });
  it("stale, dispatched, and batched selections contribute no invented weight", () => {
    expect(
      consolidationSelection(
        [
          { ...p, state: "in_transit" },
          { ...p, id: "q", batchId: "batch" },
        ],
        [],
        ["p", "q", "missing"],
      ),
    ).toEqual({ orderIds: [], weightGrams: 0, missingOrders: false });
  });
});

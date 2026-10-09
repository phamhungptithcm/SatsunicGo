import { z } from "zod";
import {
  trackingStages,
  type CustomerOrderTracking,
} from "../../../packages/domain/order-tracking";
const time = z.number().int().positive().max(8_640_000_000_000_000);
const estimate = z
  .object({
    source: z.literal("staff"),
    startAt: time,
    endAt: time,
    recordedAt: time,
    freshness: z.enum(["current", "expired", "needs_update"]),
  })
  .strict();
const dto = z
  .object({
    orderId: z.string(),
    stage: z.enum(trackingStages),
    purchaseKind: z.enum(["catalog", "custom"]),
    upfrontPayment: z.boolean().optional(),
    version: z.number().int().nonnegative(),
    observedAt: time,
    onHold: z.boolean(),
    timeline: z
      .array(
        z.object({ action: z.string().max(100), createdAt: time }).strict(),
      )
      .max(50),
    timelinePartial: z.boolean(),
    shipmentsPartial: z.boolean(),
    shipments: z
      .array(
        z.object({
          id: z.string().max(80),
          state: z.enum([
            "packed",
            "in_transit",
            "delivered",
            "failed",
            "returned",
          ]),
          route: z.string().max(200),
          carrier: z.string().max(100).optional(),
          tracking: z.string().max(100).optional(),
          updatedAt: time.optional(),
          deliveryEstimate: estimate.optional(),
        }),
      )
      .max(60),
    estimate: z
      .object({
        source: z.literal("staff_aggregate"),
        startAt: time,
        endAt: time,
        oldestRecordedAt: time,
        latestRecordedAt: time,
      })
      .strict()
      .nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.timeline.some((event) => event.createdAt > value.observedAt))
      ctx.addIssue({ code: "custom", message: "Future history timestamp" });
    if (
      value.shipments.some(
        (parcel) => (parcel.updatedAt ?? 0) > value.observedAt,
      )
    )
      ctx.addIssue({ code: "custom", message: "Future parcel timestamp" });
    if (
      new Set(value.shipments.map((p) => p.id)).size !== value.shipments.length
    )
      ctx.addIssue({ code: "custom", message: "Duplicate parcels" });
  });
/** A-B-A, retry and unmount use distinct generations even for the same order. */
export class AccountTrackingRequest {
  private generation = 0;
  invalidate() {
    this.generation++;
  }
  async run(input: {
    orderId: string;
    version: number;
    owns: () => boolean;
    read: () => Promise<unknown>;
    success: (value: CustomerOrderTracking) => void;
    failure: () => void;
  }) {
    const generation = ++this.generation;
    const current = () => generation === this.generation && input.owns();
    if (!current()) return;
    try {
      const result = dto.safeParse(await input.read());
      if (!current()) return;
      if (
        !result.success ||
        result.data.orderId !== input.orderId ||
        result.data.version < input.version
      ) {
        input.failure();
        return;
      }
      input.success(result.data);
    } catch {
      if (current()) input.failure();
    }
  }
}

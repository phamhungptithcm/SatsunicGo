import { explicitOrderReferences } from "./ask-language-query";
import type { Stage } from "./index";
import { z } from "zod";
import {
  allocationSchema,
  readManualDeliveryEstimate,
  type ManualDeliveryEstimate,
} from "./shipping";

export type ShipmentDeliveryEstimate = ManualDeliveryEstimate & {
  freshness: "current" | "expired" | "needs_update";
};
export type OrderDeliveryEstimate = {
  source: "staff_aggregate";
  startAt: number;
  endAt: number;
  oldestRecordedAt: number;
  latestRecordedAt: number;
};
export function shipmentDeliveryEstimate(
  value: unknown,
  state: TrackingShipment["state"],
  observedAt: number,
): ShipmentDeliveryEstimate | null {
  if (!["in_transit", "failed"].includes(state)) return null;
  const estimate = readManualDeliveryEstimate(value, observedAt);
  return estimate
    ? {
        ...estimate,
        freshness:
          state === "failed"
            ? "needs_update"
            : observedAt > estimate.endAt
              ? "expired"
              : "current",
      }
    : null;
}
const estimateParcelSchema = z.object({
  id: z.string().refine(validTrackingId),
  version: z.number().int().positive(),
  state: z.enum(["packed", "in_transit", "delivered", "failed", "returned"]),
  allocations: z.array(allocationSchema).min(1).max(100),
  deliveryEstimate: z.unknown().optional(),
});
/** Owner-only caller supplies transaction-consistent canonical and redacted projections. */
export function aggregateDeliveryEstimate(input: {
  orderId: string;
  ownerId: string;
  stage: Stage;
  onHold: boolean;
  items: unknown;
  allocation: unknown;
  parcels: unknown[];
  projections: unknown[];
  observedAt: number;
}): OrderDeliveryEstimate | null {
  if (
    input.stage !== "IN_TRANSIT" ||
    input.onHold ||
    !Number.isSafeInteger(input.observedAt) ||
    input.observedAt <= 0
  )
    return null;
  const items = z
    .array(z.object({ quantity: z.number().int().min(1).max(100) }))
    .min(1)
    .max(30)
    .safeParse(input.items);
  const allocation = z
    .object({
      parcelIds: z.array(z.string().refine(validTrackingId)).min(1).max(60),
      allocations: z.array(allocationSchema).min(1).max(6000),
    })
    .safeParse(input.allocation);
  if (!items.success || !allocation.success) return null;
  const ids = allocation.data.parcelIds;
  if (
    new Set(ids).size !== ids.length ||
    input.parcels.length !== ids.length ||
    input.projections.length !== ids.length
  )
    return null;
  const totals = Array<number>(items.data.length).fill(0),
    recorded = Array<number>(items.data.length).fill(0);
  const windows: ManualDeliveryEstimate[] = [];
  for (const a of allocation.data.allocations) {
    if (a.orderId !== input.orderId || a.line >= recorded.length) return null;
    recorded[a.line] += a.quantity;
  }
  const fingerprint = (allocations: z.infer<typeof allocationSchema>[]) =>
    JSON.stringify(
      allocations
        .filter((a) => a.orderId === input.orderId)
        .map((a) => [a.line, a.quantity])
        .sort((a, b) => a[0] - b[0] || a[1] - b[1]),
    );
  for (let i = 0; i < ids.length; i++) {
    const parcel = estimateParcelSchema.safeParse(input.parcels[i]);
    const projection = estimateParcelSchema
      .extend({ ownerId: z.string() })
      .safeParse(input.projections[i]);
    if (
      !parcel.success ||
      !projection.success ||
      parcel.data.id !== ids[i] ||
      projection.data.id !== ids[i] ||
      projection.data.ownerId !== input.ownerId ||
      parcel.data.version !== projection.data.version ||
      parcel.data.state !== projection.data.state ||
      fingerprint(parcel.data.allocations) !==
        fingerprint(projection.data.allocations)
    )
      return null;
    const owned = parcel.data.allocations.filter(
      (a) => a.orderId === input.orderId,
    );
    if (!owned.length) return null;
    for (const a of owned) {
      if (a.line >= totals.length) return null;
      totals[a.line] += a.quantity;
    }
    if (parcel.data.state === "delivered") continue;
    if (parcel.data.state !== "in_transit") return null;
    const canonical = readManualDeliveryEstimate(
      parcel.data.deliveryEstimate,
      input.observedAt,
    );
    const projected = readManualDeliveryEstimate(
      projection.data.deliveryEstimate,
      input.observedAt,
    );
    if (
      !canonical ||
      !projected ||
      JSON.stringify(canonical) !== JSON.stringify(projected) ||
      canonical.endAt < input.observedAt
    )
      return null;
    windows.push(canonical);
  }
  if (
    !windows.length ||
    items.data.some(
      (item, line) =>
        totals[line] !== item.quantity || recorded[line] !== item.quantity,
    )
  )
    return null;
  return {
    source: "staff_aggregate",
    startAt: Math.max(...windows.map((w) => w.startAt)),
    endAt: Math.max(...windows.map((w) => w.endAt)),
    oldestRecordedAt: Math.min(...windows.map((w) => w.recordedAt)),
    latestRecordedAt: Math.max(...windows.map((w) => w.recordedAt)),
  };
}

export const trackingStages = [
  "REQUESTED",
  "QUOTED",
  "QUOTE_ACCEPTED",
  "PURCHASING",
  "PURCHASED",
  "ORIGIN_RECEIVED",
  "PACKED",
  "READY_TO_SHIP",
  "IN_TRANSIT",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
] as const satisfies readonly Stage[];
export type TrackingShipment = {
  id: string;
  state: "packed" | "in_transit" | "delivered" | "failed" | "returned";
  route: string;
  carrier?: string;
  tracking?: string;
  updatedAt?: number;
  deliveryEstimate?: ShipmentDeliveryEstimate;
};
export type CustomerOrderTracking = {
  orderId: string;
  stage: Stage;
  purchaseKind: "catalog" | "custom";
  version: number;
  observedAt: number;
  onHold: boolean;
  timeline: { action: string; createdAt: number }[];
  timelinePartial: boolean;
  shipments: TrackingShipment[];
  shipmentsPartial: boolean;
  estimate: OrderDeliveryEstimate | null;
};
export function validTrackingId(value: unknown): value is string {
  return typeof value === "string" && /^[a-zA-Z0-9-]{1,80}$/.test(value);
}
export type TrackingIntent =
  | { kind: "none" }
  | { kind: "order"; orderId: string }
  | { kind: "ambiguous"; orderIds: string[] };
/** Explicit references and UUIDs only: ordinary product names are never IDs. */
export function extractOrderTrackingIntent(text: string): TrackingIntent {
  if (text.length > 1000) return { kind: "none" };
  const orderIds = explicitOrderReferences(text);
  return orderIds.length === 1
    ? { kind: "order", orderId: orderIds[0] }
    : orderIds.length > 1
      ? { kind: "ambiguous", orderIds }
      : { kind: "none" };
}
export function trackingStageLabel(
  tracking: Pick<CustomerOrderTracking, "stage" | "purchaseKind">,
  language: "vi" | "en",
) {
  const vi: Record<Stage, string> = {
    REQUESTED: "Đã gửi yêu cầu",
    QUOTED: "Chờ duyệt báo giá",
    QUOTE_ACCEPTED:
      tracking.purchaseKind === "catalog"
        ? "Đã tạo đơn theo giá niêm yết"
        : "Đã chấp nhận báo giá · bước thanh toán cọc",
    PURCHASING: "Đang mua hàng",
    PURCHASED: "Đã mua hàng",
    ORIGIN_RECEIVED: "Đã nhận tại kho nguồn",
    PACKED:
      tracking.purchaseKind === "catalog"
        ? "Đã đóng gói"
        : "Đã đóng gói · bước thanh toán số dư",
    READY_TO_SHIP: "Sẵn sàng xuất gửi",
    IN_TRANSIT: "Đang vận chuyển",
    DELIVERED: "Đã giao hàng",
    COMPLETED: "Hoàn tất",
    CANCELLED: "Đã hủy",
  };
  const en: Record<Stage, string> = {
    REQUESTED: "Request submitted",
    QUOTED: "Waiting for quote approval",
    QUOTE_ACCEPTED:
      tracking.purchaseKind === "catalog"
        ? "Order created at the listed price"
        : "Quote accepted · deposit payment step",
    PURCHASING: "Purchasing",
    PURCHASED: "Purchased",
    ORIGIN_RECEIVED: "Received at origin warehouse",
    PACKED:
      tracking.purchaseKind === "catalog"
        ? "Packed"
        : "Packed · balance payment step",
    READY_TO_SHIP: "Ready to ship",
    IN_TRANSIT: "In transit",
    DELIVERED: "Delivered",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };
  return (
    (language === "vi" ? vi : en)[tracking.stage] ??
    (language === "vi" ? "Chưa xác định trạng thái" : "Status unavailable")
  );
}
export function trackingMilestones(
  tracking: Pick<CustomerOrderTracking, "stage" | "purchaseKind">,
  language: "vi" | "en",
) {
  if (!trackingStages.includes(tracking.stage)) return [];
  if (tracking.stage === "CANCELLED")
    return [
      {
        label: trackingStageLabel(tracking, language),
        state: "current" as const,
      },
    ];
  const vi = language === "vi",
    custom = tracking.purchaseKind === "custom";
  const steps = [
    { stages: ["REQUESTED"], label: vi ? "Yêu cầu" : "Request" },
    ...(custom
      ? [{ stages: ["QUOTED"], label: vi ? "Báo giá" : "Quote" }]
      : []),
    {
      stages: ["QUOTE_ACCEPTED"],
      label: vi
        ? custom
          ? "Thanh toán cọc"
          : "Thanh toán toàn bộ"
        : custom
          ? "Deposit payment"
          : "Full payment",
    },
    {
      stages: ["PURCHASING", "PURCHASED"],
      label: vi ? "Mua hàng" : "Purchase",
    },
    {
      stages: custom ? ["ORIGIN_RECEIVED"] : ["ORIGIN_RECEIVED", "PACKED"],
      label: vi ? "Kho & đóng gói" : "Warehouse & packing",
    },
    ...(custom
      ? [
          {
            stages: ["PACKED"],
            label: vi ? "Thanh toán số dư" : "Balance payment",
          },
        ]
      : []),
    {
      stages: ["READY_TO_SHIP", "IN_TRANSIT"],
      label: vi ? "Vận chuyển" : "Shipping",
    },
    {
      stages: ["DELIVERED", "COMPLETED"],
      label: vi ? "Giao hàng" : "Delivery",
    },
  ];
  const current = steps.findIndex((step) =>
    step.stages.includes(tracking.stage),
  );
  if (current < 0) return [];
  return steps.map((step, index) => ({
    label: step.label,
    state:
      index < current
        ? ("completed" as const)
        : index === current
          ? ("current" as const)
          : ("upcoming" as const),
  }));
}

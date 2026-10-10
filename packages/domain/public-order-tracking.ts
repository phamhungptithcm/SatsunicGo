import { z } from "zod";
import { trackingStages, aggregateDeliveryEstimate } from "./order-tracking";
const time = z.number().int().positive().max(8_640_000_000_000_000);
export const publicTrackingCode = z.string().regex(/^SGT-[a-f0-9]{64}$/);
export const publicTrackingSchema = z
  .object({
    publicStatus: z.enum([
      "received",
      "preparing",
      "shipping",
      "delivered",
      "cancelled",
      "temporarily_unavailable",
    ]),
    updatedAt: time.nullable(),
    observedAt: time,
    eta: z
      .object({
        source: z.literal("staff"),
        startAt: time,
        endAt: time,
        recordedAt: time,
      })
      .strict()
      .nullable(),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (
      (v.updatedAt ?? 0) > v.observedAt ||
      (v.eta &&
        (v.publicStatus !== "shipping" ||
          v.eta.recordedAt > v.observedAt ||
          v.eta.startAt > v.eta.endAt ||
          v.eta.endAt < v.observedAt))
    )
      ctx.addIssue({ code: "custom", message: "Invalid public time" });
  });
export type PublicOrderTracking = z.infer<typeof publicTrackingSchema>;
export function projectPublicTracking(input: {
  orderId: string;
  order: Record<string, unknown>;
  allocation: unknown;
  parcels: unknown[];
  projections: unknown[];
  timeline: unknown[];
  observedAt: number;
}): PublicOrderTracking {
  const stage = z.enum(trackingStages).parse(input.order.stage);
  const ownerId = z.string().min(1).parse(input.order.ownerId);
  const held = !!input.order.hold;
  const unsafeParcel = input.parcels.some(
    (p) =>
      !p ||
      typeof p !== "object" ||
      ["failed", "returned"].includes(
        String((p as Record<string, unknown>).state),
      ),
  );
  const publicStatus: PublicOrderTracking["publicStatus"] =
    held || unsafeParcel
      ? "temporarily_unavailable"
      : ["DELIVERED", "COMPLETED"].includes(stage)
        ? "delivered"
        : stage === "CANCELLED"
          ? "cancelled"
          : stage === "IN_TRANSIT"
            ? "shipping"
            : ["REQUESTED", "QUOTED", "QUOTE_ACCEPTED"].includes(stage)
              ? "received"
              : "preparing";
  const actions: Record<PublicOrderTracking["publicStatus"], string[]> = {
    received: ["submitRequest", "catalogCheckout"],
    preparing: [
      "claimPurchase",
      "recordPurchase",
      "receive",
      "pack",
      "dispatch",
    ],
    shipping: ["dispatch", "track"],
    delivered: ["track", "confirmReceipt"],
    cancelled: ["cancelRequest"],
    temporarily_unavailable: [],
  };
  const dates = input.timeline.flatMap((raw) => {
    const e = z
      .object({ action: z.string(), createdAt: time.max(input.observedAt) })
      .safeParse(raw);
    return e.success && actions[publicStatus].includes(e.data.action)
      ? [e.data.createdAt]
      : [];
  });
  // All displayed values are reconstructed; private order/parcel fields never spread.
  const aggregate =
    publicStatus === "shipping" &&
    input.projections.every((raw) => {
      if (!raw || typeof raw !== "object") return false;
      const updatedAt = (raw as Record<string, unknown>).updatedAt;
      return (
        updatedAt === undefined ||
        time.max(input.observedAt).safeParse(updatedAt).success
      );
    })
      ? aggregateDeliveryEstimate({
          orderId: input.orderId,
          ownerId,
          stage,
          onHold: held,
          items: input.order.items,
          allocation: input.allocation,
          parcels: input.parcels,
          projections: input.projections,
          observedAt: input.observedAt,
        })
      : null;
  return publicTrackingSchema.parse({
    publicStatus,
    updatedAt: dates.length ? Math.max(...dates) : null,
    observedAt: input.observedAt,
    eta: aggregate
      ? {
          source: "staff",
          startAt: aggregate.startAt,
          endAt: aggregate.endAt,
          recordedAt: aggregate.latestRecordedAt,
        }
      : null,
  });
}
export function guestTrackingQuery(
  text: string,
  selected: string | null,
):
  | { kind: "none" }
  | { kind: "tracking"; code: string | null; ambiguous: boolean } {
  if (text.length > 1000) return { kind: "none" };
  const codes = [
    ...new Set(
      (text.match(/(?<![a-z0-9-])SGT-[a-f0-9]{64}(?![a-z0-9-])/gi) ?? []).map(
        (c) => "SGT-" + c.slice(4).toLowerCase(),
      ),
    ),
  ];
  const folded = text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/gi, "d")
    .toLowerCase();
  const follow =
    /\b(?:don nay|don do|this order|that order|khi nao.*(?:giao|ve)|toi dau|when.*arriv)\b/.test(
      folded,
    );
  const request =
    /\b(?:tra (?:cuu )?don|tien do don|don(?: hang)? (?:cua toi|cua minh|toi).*|don hang.*(?:dau|nao)|order (?:tracking|status)|track.*order)\b/.test(
      folded,
    );
  if (codes.length || /SGT-/i.test(text) || request || (selected && follow))
    return {
      kind: "tracking",
      code: codes[0] ?? (follow && !/SGT-/i.test(text) ? selected : null),
      ambiguous: codes.length > 1,
    };
  return { kind: "none" };
}

/** A signed-in owner keeps the private route unless explicitly using a guest alias. */
export function useGuestTracking(
  query: ReturnType<typeof guestTrackingQuery>,
  signedIn: boolean,
  explicitOrder: boolean,
  hasGuestMarker = false,
): boolean {
  return query.kind === "tracking"
    ? !signedIn || !!query.code || query.ambiguous || hasGuestMarker
    : !signedIn && explicitOrder;
}

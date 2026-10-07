import { z } from "zod";
const id = z.string().regex(/^[a-zA-Z0-9-]{1,80}$/);
const meaningful = z
  .string()
  .trim()
  .min(10)
  .max(2000)
  .refine((v) => v.replace(/[\s\u200b-\u200d\ufeff]/gu, "").length >= 10);
export const reviewDraftSchema = z
  .object({
    rating: z.number().int().min(1).max(5),
    name: z.string().trim().min(2).max(40),
    text: meaningful,
  })
  .strict();
export type ReviewDraft = z.infer<typeof reviewDraftSchema>;
const base = {
  productId: id,
  operationId: id,
  expectedVersion: z.number().int().nonnegative(),
};
export const reviewWriteSchema = z.discriminatedUnion("action", [
  z
    .object({
      ...base,
      action: z.literal("submit"),
      orderId: id.optional(),
      draft: reviewDraftSchema,
    })
    .strict(),
  z.object({ ...base, action: z.literal("withdraw") }).strict(),
]);
export const reviewReadSchema = z
  .object({ productId: id, after: id.optional() })
  .strict();
export const reviewEligibilitySchema = z
  .object({ productId: id, orderId: id.optional(), after: id.optional() })
  .strict();
export const reviewModerateSchema = z
  .object({
    id,
    operationId: id,
    expectedVersion: z.number().int().positive(),
    action: z.enum(["approve", "reject", "hide", "reply"]),
    reason: z.string().trim().max(1000).default(""),
  })
  .strict()
  .refine((d) => d.action === "approve" || d.reason.length >= 3);
export const reviewAdminSchema = z.object({ after: id.optional() }).strict();
export type PublicProductReview = ReviewDraft & {
  id: string;
  productId: string;
  variant: string;
  verifiedPurchase: true;
  publishedAt: number;
  reply?: string;
};
export type ProductReview = {
  id: string;
  productId: string;
  uid: string;
  orderId: string;
  variant: string;
  version: number;
  status: "pending" | "approved" | "rejected" | "withdrawn" | "hidden";
  draft: ReviewDraft;
  approved: PublicProductReview | null;
  createdAt: number;
  updatedAt: number;
  reason: string;
};
export type RatingSummary = { count: number; sum: number; histogram: number[] };
export function ratingSummary(value: unknown): RatingSummary {
  const p = z
    .object({
      count: z.number().int().nonnegative().max(100000000),
      sum: z.number().int().nonnegative(),
      histogram: z.array(z.number().int().nonnegative()).length(5),
    })
    .safeParse(value);
  if (
    !p.success ||
    p.data.histogram.reduce((a, b) => a + b, 0) !== p.data.count ||
    p.data.histogram.reduce((a, b, i) => a + b * (i + 1), 0) !== p.data.sum
  )
    throw Error("REVIEW_SUMMARY_UNAVAILABLE");
  return p.data;
}
export function updateRating(
  value: unknown,
  oldRating?: number,
  nextRating?: number,
) {
  const s = ratingSummary(value);
  const histogram = [...s.histogram];
  for (const r of [oldRating, nextRating])
    if (r !== undefined && (!Number.isInteger(r) || r < 1 || r > 5))
      throw Error("INVALID_RATING");
  if (oldRating !== undefined) {
    if (!histogram[oldRating - 1]) throw Error("REVIEW_SUMMARY_UNAVAILABLE");
    histogram[oldRating - 1]--;
  }
  if (nextRating !== undefined) histogram[nextRating - 1]++;
  return ratingSummary({
    count:
      s.count -
      Number(oldRating !== undefined) +
      Number(nextRating !== undefined),
    sum: s.sum - (oldRating ?? 0) + (nextRating ?? 0),
    histogram,
  });
}
export function publicReview(r: PublicProductReview): PublicProductReview {
  return {
    id: r.id,
    productId: r.productId,
    name: r.name,
    text: r.text,
    rating: r.rating,
    variant: r.variant,
    verifiedPurchase: true,
    publishedAt: r.publishedAt,
    ...(r.reply ? { reply: r.reply } : {}),
  };
}
const a = z.object({
  orderId: id,
  line: z.number().int().min(0).max(29),
  quantity: z.number().int().min(1).max(100),
});
const parcel = z.object({
  id,
  version: z.number().int().positive(),
  state: z.enum(["packed", "in_transit", "delivered", "failed", "returned"]),
  allocations: z.array(a).min(1).max(100),
});
/** No title matching. All inputs come from server transaction reads. */
export function purchaseEligibility(input: {
  uid: string;
  productId: string;
  orderId: string;
  order: unknown;
  allocation: unknown;
  parcels: unknown[];
  projections: unknown[];
}): "eligible" | "not_received" | "unknown" {
  const order = z
    .object({
      ownerId: z.string(),
      purchaseKind: z.literal("catalog"),
      stage: z.string(),
      acceptedAt: z.number().int().positive(),
      collected: z.number().int().nonnegative(),
      finalTotal: z.number().int().positive(),
      catalogSnapshot: z.object({
        productId: id,
        variant: z.string().max(200),
        quantity: z.number().int().min(1).max(100),
        total: z.number().int().positive(),
      }),
      items: z
        .array(z.object({ quantity: z.number().int().min(1).max(100) }))
        .length(1),
    })
    .safeParse(input.order);
  if (
    !order.success ||
    order.data.ownerId !== input.uid ||
    order.data.catalogSnapshot.productId !== input.productId
  )
    return "unknown";
  const o = order.data;
  if (
    o.stage === "CANCELLED" ||
    o.collected < o.finalTotal ||
    o.finalTotal !== o.catalogSnapshot.total ||
    o.items[0].quantity !== o.catalogSnapshot.quantity
  )
    return "unknown";
  const alloc = z
    .object({
      parcelIds: z.array(id).min(1).max(60),
      allocations: z.array(a).min(1).max(6000),
    })
    .safeParse(input.allocation);
  if (!alloc.success)
    return ["IN_TRANSIT", "DELIVERED", "COMPLETED"].includes(o.stage)
      ? "unknown"
      : "not_received";
  const ids = alloc.data.parcelIds;
  if (
    new Set(ids).size !== ids.length ||
    input.parcels.length !== ids.length ||
    input.projections.length !== ids.length
  )
    return "unknown";
  const fp = (rows: z.infer<typeof a>[]) =>
    JSON.stringify(
      rows
        .filter((x) => x.orderId === input.orderId)
        .map((x) => [x.line, x.quantity])
        .sort((x, y) => x[0] - y[0] || x[1] - y[1]),
    );
  let delivered = 0,
    total = 0;
  for (let i = 0; i < ids.length; i++) {
    const p = parcel.safeParse(input.parcels[i]),
      q = parcel
        .extend({ ownerId: z.string() })
        .safeParse(input.projections[i]);
    if (
      !p.success ||
      !q.success ||
      p.data.id !== ids[i] ||
      q.data.id !== ids[i] ||
      q.data.ownerId !== input.uid ||
      p.data.version !== q.data.version ||
      p.data.state !== q.data.state ||
      fp(p.data.allocations) !== fp(q.data.allocations)
    )
      return "unknown";
    const owned = p.data.allocations.filter((x) => x.orderId === input.orderId);
    if (!owned.length || owned.some((x) => x.line !== 0)) return "unknown";
    for (const x of owned) {
      total += x.quantity;
      if (p.data.state === "delivered") delivered += x.quantity;
    }
  }
  if (
    fp(alloc.data.allocations) !==
      fp(
        (input.parcels as z.infer<typeof parcel>[]).flatMap(
          (x) => x.allocations,
        ),
      ) ||
    total > o.items[0].quantity
  )
    return "unknown";
  if (
    delivered > 0 &&
    !["IN_TRANSIT", "DELIVERED", "COMPLETED"].includes(o.stage)
  )
    return "unknown";
  return delivered > 0 ? "eligible" : "not_received";
}
export type ReviewPage = {
  items: PublicProductReview[];
  next: string | null;
  summary: {
    count: number;
    average: number | null;
    histogram: number[];
  } | null;
  mine: Pick<ProductReview, "version" | "status" | "draft" | "reason"> | null;
};
export type EligibilityPage = {
  state: "eligible" | "not_received" | "unknown";
  orders: { id: string; label: string }[];
  next: string | null;
};

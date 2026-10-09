import { z } from "zod";

export const ANALYTICS_VERSION = 1;
export const CONSENT_VERSION = "2026-10-08";
export const DAY = 86_400_000;
export const SESSION_IDLE = 30 * 60_000;
export const WORKING_RETENTION = 45 * DAY;
export const analyticsId = z.string().regex(/^[A-Za-z0-9_-]{1,100}$/);
export const analyticsTopics = {
  shipping: "Vận chuyển",
  payment: "Thanh toán",
  buying: "Mua hộ",
  tracking: "Theo dõi đơn",
  returns: "Hoàn / đổi hàng",
  membership: "Hội viên",
  pricing: "Giá và phí",
  other: "Khác / chưa phân loại",
} as const;
export const topicSchema = z.enum(
  Object.keys(analyticsTopics) as [
    keyof typeof analyticsTopics,
    ...(keyof typeof analyticsTopics)[],
  ],
);
export const publicRouteSchema = z.enum([
  "home",
  "products",
  "product",
  "checkout",
  "ask",
  "content",
  "cart",
]);
export const analyticsEventSchema = z.discriminatedUnion("kind", [
  z
    .object({
      id: z.string().uuid(),
      at: z.number().int().positive().safe(),
      kind: z.literal("page"),
      route: publicRouteSchema,
    })
    .strict(),
  z
    .object({
      id: z.string().uuid(),
      at: z.number().int().positive().safe(),
      kind: z.enum(["product_view", "product_click"]),
      productId: analyticsId,
    })
    .strict(),
  z
    .object({
      id: z.string().uuid(),
      at: z.number().int().positive().safe(),
      kind: z.literal("ask"),
      topic: topicSchema,
    })
    .strict(),
]);
export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>;
export const sessionSchema = z
  .object({
    version: z.literal(1),
    consent: z.literal(CONSENT_VERSION),
    browserId: z.string().uuid(),
    requestId: z.string().uuid(),
  })
  .strict();
export const ingestSchema = z
  .object({
    version: z.literal(1),
    session: z.string().uuid(),
    events: z.array(analyticsEventSchema).min(1).max(20),
  })
  .strict();
export const linkSchema = z
  .object({ session: z.string().uuid(), orderId: analyticsId })
  .strict();
export function utcDay(at: number) {
  return new Date(at).toISOString().slice(0, 10);
}
export function publicRoute(
  path: string,
): z.infer<typeof publicRouteSchema> | null {
  if (path === "/") return "home";
  if (/^\/products\/?$/.test(path)) return "products";
  if (/^\/products\/[^/]+\/checkout\/?$/.test(path)) return "checkout";
  if (/^\/products\/[^/]+\/?$/.test(path)) return "product";
  if (path === "/cart") return "cart";
  if (path === "/ask") return "ask";
  if (/^\/(blog|privacy|terms|shipping|about|contact)(\/|$)/.test(path))
    return "content";
  return null;
}
/** Bounded taxonomy only. Never return or persist a substring of a question. */
export function classifyAsk(text: string): keyof typeof analyticsTopics {
  const t = text
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
  const patterns: [keyof typeof analyticsTopics, RegExp][] = [
    ["tracking", /theo doi|tracking|don hang|ma don/],
    ["returns", /hoan tien|doi hang|tra hang|refund/],
    ["shipping", /van chuyen|ship|giao hang|cuoc/],
    ["payment", /thanh toan|chuyen khoan|dat coc|payment/],
    ["membership", /hoi vien|membership/],
    ["pricing", /gia|phi|ty gia|price/],
    ["buying", /mua ho|dat mua|purchase/],
  ];
  return patterns.find(([, pattern]) => pattern.test(t))?.[0] ?? "other";
}
export function conversionEligible(start: number, firstPayment: number) {
  return firstPayment >= start && firstPayment <= start + 7 * DAY;
}
export function safeSum(values: number[]): number {
  const sum = values.reduce((a, b) => a + b, 0);
  if (!values.every(Number.isSafeInteger) || !Number.isSafeInteger(sum))
    throw Error("ANALYTICS_OVERFLOW");
  return sum;
}
export const counterKeys = [
  "views",
  "sessions",
  "questions",
  "payments",
  "refunds",
  "reversals",
  "orders",
  "US",
  "JP",
  "KR",
  "unknown",
] as const;
export type CounterKey = (typeof counterKeys)[number];
const count = z.number().int().nonnegative().safe();
const dayRow = z
  .object({
    day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    counts: z.record(z.string(), count),
  })
  .strict();
const productRow = z
  .object({
    id: analyticsId,
    title: z.string().max(160).optional(),
    slug: z
      .string()
      .regex(/^[a-zA-Z0-9-]{1,160}$/)
      .optional(),
    views: count,
    clicks: count,
    paidOrders: count.nullable(),
  })
  .strict();
const topicRow = z
  .object({ id: topicSchema, questions: count, sessions: count })
  .strict();
export const analyticsSnapshotSchema = z
  .object({
    version: z.literal(1),
    from: z.number().int().positive(),
    until: z.number().int().positive(),
    asOf: z.number().int().positive(),
    startedAt: z.number().int().nonnegative(),
    enabled: z.boolean(),
    complete: z.boolean(),
    workingAvailable: z.boolean(),
    finance: z.boolean(),
    availability: z
      .object({
        traffic: z.boolean(),
        products: z.boolean(),
        topics: z.boolean(),
        stages: z.boolean(),
        reason: z.enum(["ready", "not_collected", "retention", "read_limit"]),
      })
      .strict(),
    days: z.array(dayRow).max(31),
    products: z.array(productRow).max(10),
    topics: z.array(topicRow).max(10),
    stages: z.record(z.string(), count),
    sessions: count.nullable(),
    browsers: count.nullable(),
    accounts: count.nullable(),
    buyers: count.nullable(),
    convertedSessions: count.nullable(),
    productSessions: count.nullable(),
    convertedProductSessions: count.nullable(),
    paidOrders: count.nullable(),
    linkedPaidOrders: count.nullable(),
    provisional: z.boolean(),
    backlog: count,
    deadLetters: count,
    oldestPendingAt: z.number().int().nonnegative(),
    lastWorkerAt: z.number().int().nonnegative(),
  })
  .strict();
export type AnalyticsSnapshot = z.infer<typeof analyticsSnapshotSchema>;
export function parseAnalyticsSnapshot(
  raw: unknown,
  range: { from: number; until: number },
) {
  const parsed = analyticsSnapshotSchema.safeParse(raw);
  if (
    !parsed.success ||
    parsed.data.from !== range.from ||
    parsed.data.until !== range.until ||
    parsed.data.asOf > Date.now() + 60_000
  )
    return null;
  const s = parsed.data;
  if (
    s.convertedSessions !== null &&
    s.sessions !== null &&
    s.convertedSessions > s.sessions
  )
    return null;
  if (
    s.productSessions !== null &&
    s.sessions !== null &&
    s.productSessions > s.sessions
  )
    return null;
  if (
    s.convertedProductSessions !== null &&
    s.productSessions !== null &&
    s.convertedProductSessions > s.productSessions
  )
    return null;
  if (
    !s.finance &&
    s.days.some((d) =>
      ["payments", "refunds", "reversals"].some((k) => k in d.counts),
    )
  )
    return null;
  return s;
}

/** First time verified net allocation reached catalog payable; installments are not orders. */
export function firstCatalogPaidAt(
  entries: {
    kind: string;
    currency: string;
    amount: number;
    createdAt: number;
  }[],
  payable: number,
): number | null {
  if (!Number.isSafeInteger(payable) || payable <= 0 || entries.length > 100)
    return null;
  let net = 0;
  for (const e of [...entries].sort((a, b) => a.createdAt - b.createdAt)) {
    if (
      !["payment", "refund", "reversal"].includes(e.kind) ||
      e.currency !== "VND" ||
      !Number.isSafeInteger(e.amount) ||
      e.amount <= 0 ||
      !Number.isSafeInteger(e.createdAt)
    )
      return null;
    net = safeSum([net, e.kind === "payment" ? e.amount : -e.amount]);
    if (net >= payable) return e.createdAt;
  }
  return null;
}

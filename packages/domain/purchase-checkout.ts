import { z } from "zod";
import {
  convertFx,
  itemSchema,
  money,
  requestSchema,
  type Order,
} from "./index";
import { cartItemsSchema, type CartItem } from "./cart";
import { catalogProductSchema, createCatalogOrder } from "./catalog-checkout";

export const researchedRequestSchema = requestSchema
  .extend({
    items: z
      .array(itemSchema.extend({ unitSourceMinor: money.positive() }))
      .min(1)
      .max(30),
  })
  .strict();
export type ResearchedRequest = z.infer<typeof researchedRequestSchema>;
export const checkoutRecipientSchema = z
  .object({
    recipient: z.string().trim().min(2).max(120),
    phone: z
      .string()
      .trim()
      .regex(/^(?:\+84|0)[0-9]{9,10}$/),
    country: z.literal("VN"),
    provinceCode: z.string().regex(/^[0-9]{2}$/),
    communeCode: z.string().regex(/^[0-9]{5}$/),
    province: z.string().trim().min(2).max(120),
    commune: z.string().trim().min(2).max(120),
    street: z.string().trim().min(5).max(300),
    note: z.string().trim().max(500).default(""),
  })
  .strict();
export type CheckoutRecipient = z.infer<typeof checkoutRecipientSchema>;
export const checkoutPolicySchema = z
  .object({
    enabled: z.literal(true),
    approved: z.literal(true),
    version: z.number().int().positive(),
    serviceBps: z.number().int().min(0).max(10000),
    termsVersion: z.string().min(1).max(80),
    effectiveFrom: z.number().int().nonnegative(),
    expiresAt: z.number().int().positive(),
    rates: z.object({
      USD: z.object({
        numerator: z.number().int().positive().max(1e9),
        denominator: z.number().int().positive().max(1e9),
      }),
      JPY: z.object({
        numerator: z.number().int().positive().max(1e9),
        denominator: z.number().int().positive().max(1e9),
      }),
      KRW: z.object({
        numerator: z.number().int().positive().max(1e9),
        denominator: z.number().int().positive().max(1e9),
      }),
    }),
  })
  .strict();
export type CheckoutPolicy = z.infer<typeof checkoutPolicySchema>;
export type CheckoutLine = {
  lineId: string;
  orderId: string;
  kind: "catalog" | "custom";
  name: string;
  variant: string;
  quantity: number;
  market: "US" | "JP" | "KR";
  goods: number;
  service: number;
  total: number;
  termsVersion: string;
  productVersion?: number;
  productId?: string;
  draftId?: string;
  itemIndex?: number;
  unitSourceMinor?: number;
  fxNumerator?: number;
  fxDenominator?: number;
  mediaId?: string;
};
export type CheckoutSnapshot = {
  purpose?: "balance";
  balanceReason?: "sourcing" | "final";
  sourceOrderVersion?: number;
  sourceOrderId?: string;
  previouslyPaid?: number;
  finalTotal?: number;
  id: string;
  ownerId: string;
  version: number;
  cartRevision: number;
  policyVersion: number;
  createdAt: number;
  expiresAt: number;
  currency: "VND";
  lines: CheckoutLine[];
  total: number;
  listed: number;
  goods: number;
  service: number;
  recipient: CheckoutRecipient;
  shipping: {
    state: string;
    amountUsdMinor?: number;
    basis?: string;
    version?: number | null;
  };
};
export type PurchaseCheckout = CheckoutSnapshot & {
  state: "pending" | "unknown" | "paid" | "cancelled" | "review_required";
  provider: "demo" | "payos_unavailable" | "sepay_sandbox";
  paymentMethod?: "BANK_TRANSFER";
  sepayInvoice?: string;
  paidAt?: number;
  paymentReference?: string;
  receiptId?: string;
  demoPaymentLinkId?: string;
  receivedAmount?: number;
};
const checkoutAcknowledgementSchema = z.object({
  id: z.string().uuid(),
  state: z.literal("pending"),
  total: money.positive(),
  provider: z.enum(["demo", "sepay_sandbox"]),
  paymentMethod: z.literal("BANK_TRANSFER").optional(),
});
const sourcingAcknowledgementSchema = z.object({
  id: z.string().uuid(),
  version: z.number().int().positive().safe(),
});
const sourcingAcknowledgementContextSchema = z.object({
  orderId: z.string().uuid(),
  expectedVersion: z.number().int().positive().safe(),
});
/** Admit the existing initial/balance commit receipt before retiring its UUID. */
export function admitPurchaseCheckoutAcknowledgement(
  value: unknown,
  previewId: string,
  expectedMethod?: "BANK_TRANSFER" | "NAPAS_BANK_TRANSFER" | "CARD",
) {
  const result = checkoutAcknowledgementSchema.parse(value);
  if (
    (expectedMethod && result.paymentMethod !== expectedMethod) ||
    (result.provider === "sepay_sandbox" &&
      result.paymentMethod !== "BANK_TRANSFER") ||
    result.id !== previewId
  )
    throw Error("INVALID_CHECKOUT_ACKNOWLEDGEMENT");
  return result;
}
/** Replay is bound to the submitted version, even after a newer order read. */
export function admitPurchaseSourcingAcknowledgement(
  value: unknown,
  command: unknown,
) {
  const result = sourcingAcknowledgementSchema.parse(value);
  const expected = sourcingAcknowledgementContextSchema.parse(command);
  if (
    result.id !== expected.orderId ||
    result.version !== expected.expectedVersion + 1
  )
    throw Error("INVALID_SOURCING_ACKNOWLEDGEMENT");
  return result;
}
export function buildCheckout(input: {
  id: string;
  ownerId: string;
  now: number;
  revision: number;
  items: CartItem[];
  products: Record<string, unknown>;
  drafts: Record<string, ResearchedRequest & { ownerId: string }>;
  policy: unknown;
  recipient: unknown;
  orderIds: string[];
  shipping: CheckoutSnapshot["shipping"];
}): { snapshot: CheckoutSnapshot; orders: Order[] } {
  const policy = checkoutPolicySchema.parse(input.policy);
  if (policy.effectiveFrom > input.now || policy.expiresAt <= input.now)
    throw Error("PRICING_UNAVAILABLE");
  const items = cartItemsSchema.min(1).parse(input.items),
    recipient = checkoutRecipientSchema.parse(input.recipient);
  if (
    input.orderIds.length !== items.length ||
    new Set(input.orderIds).size !== items.length
  )
    throw Error("INVALID_ORDER_IDS");
  const orders: Order[] = [];
  const lines = items.map((item, i): CheckoutLine => {
    const orderId = input.orderIds[i];
    if (item.kind !== "custom") {
      const p = catalogProductSchema.parse(input.products[item.productId]);
      const order = createCatalogOrder(
        p,
        {
          productId: item.productId,
          productVersion: p.version,
          variant: item.variant,
          quantity: item.quantity,
        },
        { id: orderId, ownerId: input.ownerId, now: input.now },
      );
      order.checkoutId = input.id;
      orders.push(order);
      const raw = input.products[item.productId] as { mediaId?: unknown };
      return {
        lineId: item.lineId,
        orderId,
        kind: "catalog",
        name: p.title,
        variant: item.variant,
        quantity: item.quantity,
        market: p.market,
        goods: order.catalogSnapshot!.total,
        service: 0,
        total: order.catalogSnapshot!.total,
        termsVersion: p.termsVersion,
        productId: item.productId,
        productVersion: p.version,
        ...(typeof raw.mediaId === "string" ? { mediaId: raw.mediaId } : {}),
      };
    }
    const c = item.custom!,
      draft = input.drafts[c.draftId];
    if (!draft || draft.ownerId !== input.ownerId)
      throw Error("DRAFT_OWNERSHIP");
    const row = researchedRequestSchema.parse(draftWithoutOwner(draft)).items[
      c.itemIndex
    ];
    if (
      !row ||
      row.name !== c.name ||
      row.unitSourceMinor !== c.unitSourceMinor ||
      draft.market !== c.market ||
      row.variant !== item.variant
    )
      throw Error("DRAFT_CHANGED");
    const currency =
        draft.market === "US" ? "USD" : draft.market === "JP" ? "JPY" : "KRW",
      rate = policy.rates[currency];
    const goods = convertFx(
      money.parse(row.unitSourceMinor * item.quantity),
      rate.numerator,
      rate.denominator,
    );
    const service = money.parse(
      Number((BigInt(goods) * BigInt(policy.serviceBps) + 9999n) / 10000n),
    );
    const total = money.positive().parse(goods + service);
    const { unitSourceMinor, ...orderItem } = row;
    orders.push({
      id: orderId,
      ownerId: input.ownerId,
      createdAt: input.now,
      version: 1,
      checkoutId: input.id,
      purchaseKind: "custom",
      market: draft.market,
      items: [{ ...orderItem, quantity: item.quantity }],
      notes: draft.notes,
      ...(draft.budget ? { budget: draft.budget } : {}),
      ...(draft.desiredAt ? { desiredAt: draft.desiredAt } : {}),
      ...(draft.preferredStore ? { preferredStore: draft.preferredStore } : {}),
      stage: "QUOTE_ACCEPTED",
      acceptedAt: input.now,
      deposit: total,
      collected: 0,
      refunded: 0,
      upfront: {
        initialTotal: total,
        goods,
        service,
        policyVersion: policy.version,
        termsVersion: policy.termsVersion,
        unitSourceMinor,
        fxNumerator: rate.numerator,
        fxDenominator: rate.denominator,
        sourceCurrency: currency,
      },
      requiresSourcing: true,
    });
    return {
      lineId: item.lineId,
      orderId,
      kind: "custom",
      name: row.name,
      variant: row.variant,
      quantity: item.quantity,
      market: draft.market,
      goods,
      service,
      total,
      termsVersion: policy.termsVersion,
      draftId: c.draftId,
      itemIndex: c.itemIndex,
      unitSourceMinor,
      fxNumerator: rate.numerator,
      fxDenominator: rate.denominator,
    };
  });
  const total = money.positive().parse(lines.reduce((s, l) => s + l.total, 0));
  return {
    orders,
    snapshot: {
      id: input.id,
      ownerId: input.ownerId,
      version: 1,
      cartRevision: input.revision,
      policyVersion: policy.version,
      createdAt: input.now,
      expiresAt: Math.min(input.now + 600000, policy.expiresAt),
      currency: "VND",
      lines,
      total,
      listed: lines
        .filter((l) => l.kind === "catalog")
        .reduce((s, l) => s + l.total, 0),
      goods: lines
        .filter((l) => l.kind === "custom")
        .reduce((s, l) => s + l.goods, 0),
      service: lines.reduce((s, l) => s + l.service, 0),
      recipient,
      shipping: input.shipping,
    },
  };
}
function draftWithoutOwner(draft: ResearchedRequest & { ownerId: string }) {
  const { ownerId, ...request } = draft;
  void ownerId;
  return request;
}
export function assertVerifiedPayment(
  checkout: PurchaseCheckout,
  proof: {
    provider: string;
    merchant: string;
    reference: string;
    currency: string;
    amount: number;
  },
  merchant: string,
) {
  if (
    proof.provider !== checkout.provider ||
    proof.merchant !== merchant ||
    proof.currency !== "VND" ||
    proof.amount !== checkout.total ||
    !proof.reference ||
    checkout.state === "cancelled"
  )
    throw Error("PAYMENT_REQUIRES_REVIEW");
}
export function decimalSourceMinor(raw: string, market: "US" | "JP" | "KR") {
  const digits = market === "US" ? 2 : 0;
  if (!(digits ? /^\d+(?:\.\d{1,2})?$/ : /^\d+$/).test(raw))
    throw Error("INVALID_SOURCE_PRICE");
  const [whole, fraction = ""] = raw.split(".");
  return money
    .positive()
    .parse(
      Number(
        BigInt(whole) * BigInt(digits ? 100 : 1) +
          BigInt(fraction.padEnd(digits, "0") || "0"),
      ),
    );
}

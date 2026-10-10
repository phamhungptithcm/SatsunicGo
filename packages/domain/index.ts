import { z } from "zod";
export const money = z.number().int().nonnegative().max(1_000_000_000_000);
export const market = z.enum(["US", "JP", "KR"]);
export const roles = [
  "OWNER",
  "OPERATIONS_MANAGER",
  "BUYER",
  "WAREHOUSE",
  "FINANCE",
  "SUPPORT",
  "CONTENT_EDITOR",
] as const;
export type Role = (typeof roles)[number];
export const itemSchema = z
  .object({
    name: z.string().trim().min(2).max(200),
    url: z
      .string()
      .url()
      .max(2048)
      .refine((value) => /^https?:\/\//i.test(value))
      .optional()
      .or(z.literal("")),
    quantity: z.number().int().min(1).max(100),
    variant: z.string().max(200).default(""),
    condition: z.enum(["new", "used", "any"]).optional(),
    unitSourceMinor: money.positive().optional(),
  })
  .strict();
export const requestSchema = z
  .object({
    market,
    items: z.array(itemSchema).min(1).max(30),
    notes: z.string().max(2000).default(""),
    preferredStore: z.string().max(160).optional(),
    budget: money.optional(),
    desiredAt: z.number().int().positive().optional(),
  })
  .strict();
export const quoteSchema = z
  .object({
    goods: money,
    service: money,
    sourceCosts: money,
    internationalShipping: money,
    destinationShipping: money,
    discount: money,
    sourceCurrency: z.enum(["USD", "JPY", "KRW"]),
    sourceMinor: money,
    fxNumerator: z.number().int().positive().max(1e9),
    fxDenominator: z.number().int().positive().max(1e9),
    termsVersion: z.string().min(1).max(80),
    expiresAt: z.number().int().positive(),
    verifiedProduct: z.string().min(2).max(1000),
  })
  .strict();
export type Quote = z.infer<typeof quoteSchema>;
export function safeMoney(value: number) {
  return money.parse(value);
}
export function convertFx(
  sourceMinor: number,
  numerator: number,
  denominator: number,
): number {
  safeMoney(sourceMinor);
  if (
    !Number.isSafeInteger(numerator) ||
    !Number.isSafeInteger(denominator) ||
    numerator <= 0 ||
    denominator <= 0
  )
    throw Error("INVALID_FX");
  return safeMoney(
    Number(
      (BigInt(sourceMinor) * BigInt(numerator) + BigInt(denominator) - 1n) /
        BigInt(denominator),
    ),
  );
}
export function quoteTotal(q: Quote) {
  quoteSchema.parse(q);
  const gross =
    q.goods +
    q.service +
    q.sourceCosts +
    q.internationalShipping +
    q.destinationShipping;
  if (q.discount > q.service + q.internationalShipping)
    throw Error("INVALID_DISCOUNT");
  return safeMoney(gross - q.discount);
}
export function requiredDeposit(total: number) {
  return Math.ceil(safeMoney(total) / 2);
}
export function balance(
  finalPayable: number,
  entries: { kind: "payment" | "refund" | "reversal"; amount: number }[],
  credits = 0,
) {
  safeMoney(finalPayable);
  safeMoney(credits);
  if (credits > finalPayable) throw Error("INVALID_CREDIT");
  let net = 0;
  for (const e of entries) {
    safeMoney(e.amount);
    net += e.kind === "payment" ? e.amount : -e.amount;
  }
  if (net < 0) throw Error("INVALID_LEDGER");
  const due = finalPayable - credits - net;
  return {
    netCollected: net,
    remainingDue: Math.max(0, due),
    overpayment: Math.max(0, -due),
  };
}
export function allocateFreight(total: number, weights: number[]) {
  safeMoney(total);
  if (
    !weights.length ||
    weights.some((w) => !Number.isSafeInteger(w) || w <= 0)
  )
    throw Error("INVALID_WEIGHT");
  const sum = weights.reduce((a, b) => a + BigInt(b), 0n);
  const rows = weights.map((w, i) => ({
    i,
    n: (BigInt(total) * BigInt(w)) / sum,
    r: (BigInt(total) * BigInt(w)) % sum,
  }));
  let rest = total - rows.reduce((a, b) => a + Number(b.n), 0);
  for (const r of [...rows].sort((a, b) =>
    a.r === b.r ? a.i - b.i : a.r > b.r ? -1 : 1,
  )) {
    if (rest-- <= 0) break;
    r.n++;
  }
  return rows.map((r) => Number(r.n));
}
export type Stage =
  | "REQUESTED"
  | "QUOTED"
  | "QUOTE_ACCEPTED"
  | "PURCHASING"
  | "PURCHASED"
  | "ORIGIN_RECEIVED"
  | "PACKED"
  | "READY_TO_SHIP"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED";
export const stageLabels: Record<Stage, string> = {
  REQUESTED: "Đã gửi yêu cầu",
  QUOTED: "Chờ duyệt báo giá",
  QUOTE_ACCEPTED: "Chờ xác nhận cọc",
  PURCHASING: "Đang mua hàng",
  PURCHASED: "Đã mua hàng",
  ORIGIN_RECEIVED: "Đã nhận tại kho nguồn",
  PACKED: "Chờ thanh toán số dư",
  READY_TO_SHIP: "Sẵn sàng xuất gửi",
  IN_TRANSIT: "Đang vận chuyển",
  DELIVERED: "Đã giao hàng",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
};
export type Order = {
  executionMode?: "production_test";
  executionPolicyVersion?: number;
  testRunId?: string;
  testMode?: boolean;
  paymentProvider?: "sepay_sandbox";
  checkoutId?: string;
  latestReceiptId?: string;
  balanceCheckoutId?: string | null;
  actualSourceMinor?: number;
  requiresSourcing?: boolean;
  purchaseAdjustment?: {
    version: number;
    sourceLimitMinor: number;
    total: number;
    reason: string;
    approved: boolean;
  };
  upfront?: {
    initialTotal: number;
    goods: number;
    service: number;
    policyVersion: number;
    termsVersion: string;
    unitSourceMinor: number;
    fxNumerator: number;
    fxDenominator: number;
    sourceCurrency: "USD" | "JPY" | "KRW";
  };
  purchaseKind?: "catalog" | "custom";
  catalogSnapshot?: import("./catalog-checkout").CatalogSnapshot;
  id: string;
  ownerId: string;
  market: z.infer<typeof market>;
  items: z.infer<typeof itemSchema>[];
  notes: string;
  preferredStore?: string;
  budget?: number;
  desiredAt?: number;
  stage: Stage;
  version: number;
  createdAt: number;
  quote?: Quote;
  quoteVersion?: number;
  acceptedQuoteVersion?: number;
  acceptedAt?: number;
  deposit?: number;
  collected: number;
  refunded: number;
  refundReserved?: number;
  finalTotal?: number;
  finalApproved?: boolean;
  hold?: string;
  packingComplete?: boolean;
  membershipSnapshot?: {
    name: string;
    endsAt: number;
    serviceDiscountBps: number;
    discountCap: number;
  };
  tracking?: string;
  receivedQuantity?: number;
  packedQuantity?: number;
  purchasedQuantity?: number;
  purchasedLines?: number[];
  consolidatedFreight?: { batchId: string; version: number; amount: number };
  finalFreightVersion?: number;
  receivedLines?: number[];
};
export const grants: Record<string, readonly Role[]> = {
  issueQuote: ["OWNER", "OPERATIONS_MANAGER", "BUYER"],
  claimPurchase: ["OWNER", "BUYER"],
  recordPurchase: ["OWNER", "BUYER"],
  receive: ["OWNER", "WAREHOUSE"],
  pack: ["OWNER", "WAREHOUSE"],
  finalize: ["OWNER", "OPERATIONS_MANAGER"],
  verifyTransfer: ["OWNER", "FINANCE"],
  dispatch: ["OWNER", "WAREHOUSE"],
  track: ["OWNER", "OPERATIONS_MANAGER"],
  refund: ["OWNER", "FINANCE"],
  hold: ["OWNER", "OPERATIONS_MANAGER"],
};
export function requireRole(action: string, currentRoles: Role[]) {
  if (!(grants[action] ?? []).some((r) => currentRoles.includes(r)))
    throw Error("FORBIDDEN");
}
export function canDispatch(o: Order) {
  return (
    (o.purchaseKind !== "catalog" || catalogPayable(o) === o.finalTotal) &&
    o.stage === "READY_TO_SHIP" &&
    o.finalApproved === true &&
    o.packingComplete === true &&
    (!o.consolidatedFreight ||
      o.finalFreightVersion === o.consolidatedFreight.version) &&
    !o.hold &&
    o.finalTotal !== undefined &&
    o.collected - o.refunded - (o.refundReserved ?? 0) >= o.finalTotal
  );
}
export function orderStageLabel(o: Order) {
  if (o.upfront && o.stage === "PACKED")
    return o.finalApproved ? "Chờ thanh toán chi phí còn lại" : "Chờ duyệt chi phí cuối";
  if (o.upfront && o.stage === "QUOTE_ACCEPTED")
    return o.collected - o.refunded - (o.refundReserved ?? 0) >=
      purchaseAmount(o)
      ? "Đã thanh toán · cần tìm mua"
      : "Chờ thanh toán toàn bộ ban đầu";
  if (o.purchaseKind === "catalog" && o.stage === "QUOTE_ACCEPTED")
    return o.collected - o.refunded - (o.refundReserved ?? 0) >=
      purchaseAmount(o)
      ? "Đã thanh toán · chờ mua hàng"
      : "Chờ thanh toán toàn bộ";
  if (o.purchaseKind === "catalog" && o.stage === "PACKED")
    return "Đã đóng gói";
  return stageLabels[o.stage];
}
export function catalogPayable(o: Order) {
  if (
    !o.catalogSnapshot ||
    o.finalTotal === undefined ||
    o.finalTotal > o.catalogSnapshot.total
  )
    throw Error("INVALID_CATALOG_TOTAL");
  return safeMoney(o.finalTotal);
}
export function purchaseAmount(o: Order) {
  return o.upfront
    ? o.upfront.initialTotal
    : o.purchaseKind === "catalog"
      ? catalogPayable(o)
      : (o.deposit ?? Infinity);
}
export function paymentPurpose(o: Order): "full" | "deposit" | "balance" {
  return o.upfront && !o.finalApproved
    ? "full"
    : o.purchaseKind === "catalog"
      ? "full"
      : o.finalApproved && o.finalTotal !== undefined
        ? "balance"
        : "deposit";
}
export function paymentDue(o: Order, purpose = paymentPurpose(o)) {
  if (purpose !== paymentPurpose(o)) throw Error("INVALID_PAYMENT_PURPOSE");
  const target =
    purpose === "full"
      ? o.upfront
        ? o.upfront.initialTotal
        : catalogPayable(o)
      : purpose === "deposit"
        ? o.deposit
        : o.finalTotal;
  if (target === undefined) throw Error("NO_PAYMENT_TARGET");
  return safeMoney(Math.max(0, target - o.collected + o.refunded));
}
export function membershipDiscount(
  service: number,
  shipping: number,
  bps: number,
  cap: number,
  minimumService: number,
) {
  [service, shipping, cap, minimumService].forEach(safeMoney);
  if (!Number.isInteger(bps) || bps < 0 || bps > 10000)
    throw Error("INVALID_BENEFIT");
  return Math.min(
    cap,
    Math.max(0, service - minimumService) + shipping,
    Number((BigInt(service + shipping) * BigInt(bps)) / 10000n),
  );
}
export function csvCell(value: string) {
  const protectedValue = /^[\s]*[=+@-]/.test(value) ? `'${value}` : value;
  return `"${protectedValue.replaceAll('"', '""')}"`;
}
export type Action =
  | "issueQuote"
  | "acceptQuote"
  | "claimPurchase"
  | "recordPurchase"
  | "receive"
  | "pack"
  | "finalize"
  | "approveFinal"
  | "confirmReceipt"
  | "dispatch"
  | "track"
  | "hold"
  | "cancelRequest";
const lineCountsSchema = z
  .array(
    z
      .object({
        line: z.number().int().min(0).max(29),
        quantity: z.number().int().positive().max(100),
      })
      .strict(),
  )
  .min(1)
  .max(30);
function addLineCounts(
  items: Order["items"],
  current: number[] | undefined,
  lines: z.infer<typeof lineCountsSchema> | undefined,
  quantity: number,
  ceilings: number[],
) {
  const entries = lines ?? (items.length === 1 ? [{ line: 0, quantity }] : []);
  if (
    !entries.length ||
    entries.reduce((sum, a) => sum + a.quantity, 0) !== quantity ||
    new Set(entries.map((a) => a.line)).size !== entries.length
  )
    throw Error("LINE_QUANTITIES_REQUIRED");
  const next = items.map((_, line) => current?.[line] ?? 0);
  for (const a of entries) {
    if (
      !items[a.line] ||
      !Number.isSafeInteger(ceilings[a.line]) ||
      next[a.line] + a.quantity > ceilings[a.line]
    )
      throw Error("QUANTITY_EXCEEDED");
    next[a.line] += a.quantity;
  }
  return next;
}
export function evolve(
  input: Order,
  action: Action,
  payload: unknown,
  now: number,
): Order {
  const o = { ...input };
  const guard = (ok: unknown) => {
    if (!ok) throw Error("INVALID_STATE");
  };
  const count = o.items.reduce((s, i) => s + i.quantity, 0);
  switch (action) {
    case "issueQuote": {
      guard(
        o.purchaseKind !== "catalog" &&
          ["REQUESTED", "QUOTED"].includes(o.stage),
      );
      const q = quoteSchema.parse(payload);
      guard(q.expiresAt > now);
      quoteTotal(q);
      o.quote = q;
      o.quoteVersion = (o.quoteVersion ?? 0) + 1;
      o.stage = "QUOTED";
      break;
    }
    case "acceptQuote": {
      const p = z
        .object({ quoteVersion: z.number().int() })
        .strict()
        .parse(payload);
      guard(
        o.purchaseKind !== "catalog" &&
          o.stage === "QUOTED" &&
          o.quote &&
          o.quote.expiresAt > now &&
          p.quoteVersion === o.quoteVersion,
      );
      o.acceptedAt = now;
      o.acceptedQuoteVersion = o.quoteVersion;
      o.deposit = requiredDeposit(quoteTotal(o.quote!));
      o.stage = "QUOTE_ACCEPTED";
      break;
    }
    case "claimPurchase":
      guard(
        o.stage === "QUOTE_ACCEPTED" &&
          o.collected - o.refunded - (o.refundReserved ?? 0) >=
            purchaseAmount(o) &&
          !o.hold,
      );
      o.stage = "PURCHASING";
      break;
    case "recordPurchase": {
      const p = z
        .object({
          quantity: z.number().int().positive(),
          supplierOrder: z.string().min(2).max(100),
          evidence: z.string().min(5).max(1000),
          actualSourceMinor: money,
          lines: lineCountsSchema.optional(),
        })
        .strict()
        .parse(payload);
      guard(
        o.stage === "PURCHASING" &&
          !o.hold &&
          p.quantity <= count &&
          (!o.upfront ||
            o.collected - o.refunded - (o.refundReserved ?? 0) >=
              purchaseAmount(o)),
      );
      if (o.upfront) {
        const nextCost = safeMoney(
            (o.actualSourceMinor ?? 0) + p.actualSourceMinor,
          ),
          original = o.upfront.unitSourceMinor * count;
        if (
          nextCost > original &&
          (!o.purchaseAdjustment?.approved ||
            nextCost > o.purchaseAdjustment.sourceLimitMinor ||
            o.collected - o.refunded - (o.refundReserved ?? 0) <
              o.purchaseAdjustment.total)
        )
          throw Error("SOURCE_ADJUSTMENT_NOT_FUNDED");
      }
      if (o.upfront)
        o.actualSourceMinor = safeMoney(
          (o.actualSourceMinor ?? 0) + p.actualSourceMinor,
        );
      o.purchasedLines = addLineCounts(
        o.items,
        o.purchasedLines,
        p.lines,
        p.quantity,
        o.items.map((i) => i.quantity),
      );
      o.purchasedQuantity = o.purchasedLines.reduce((sum, n) => sum + n, 0);
      o.stage = o.purchasedQuantity === count ? "PURCHASED" : "PURCHASING";
      break;
    }
    case "receive": {
      const p = z
        .object({
          quantity: z.number().int().positive(),
          condition: z.enum(["good", "damaged"]),
          shelf: z.string().trim().max(80).optional(),
          lines: lineCountsSchema.optional(),
          evidence: z.string().min(5).max(1000),
        })
        .strict()
        .parse(payload);
      guard(
        ["PURCHASED", "PURCHASING"].includes(o.stage) &&
          p.quantity <= (o.purchasedQuantity ?? 0),
      );
      o.receivedLines = addLineCounts(
        o.items,
        o.receivedLines,
        p.lines,
        p.quantity,
        o.purchasedLines ??
          (o.items.length === 1 ? [o.purchasedQuantity ?? 0] : []),
      );
      o.receivedQuantity = o.receivedLines.reduce((sum, n) => sum + n, 0);
      if (o.receivedQuantity === count) o.stage = "ORIGIN_RECEIVED";
      if (o.receivedQuantity !== count || p.condition === "damaged")
        o.hold ||= "Hàng thiếu hoặc hỏng";
      break;
    }
    case "pack":
      z.object({
        weightGrams: z.number().int().positive(),
        dimensionsCm: z.array(z.number().positive()).length(3),
        evidence: z.string().min(5).max(1000),
        checklist: z.literal(true),
      })
        .strict()
        .parse(payload);
      guard(
        o.stage === "ORIGIN_RECEIVED" &&
          !o.hold &&
          o.receivedQuantity === count,
      );
      o.packedQuantity = count;
      o.packingComplete = true;
      o.stage = "PACKED";
      break;
    case "finalize": {
      const p = z
        .object({
          total: money,
          reason: z.string().min(5).max(1000),
          freightShare: money.optional(),
        })
        .strict()
        .parse(payload);
      guard(
        o.stage === "PACKED" &&
          o.packingComplete &&
          o.purchaseKind !== "catalog",
      );
      if (
        o.consolidatedFreight &&
        (p.freightShare !== o.consolidatedFreight.amount ||
          p.total < p.freightShare)
      )
        throw Error("FREIGHT_MISMATCH");
      if (
        o.upfront &&
        p.total <
          convertFx(
            o.actualSourceMinor ?? 0,
            o.upfront.fxNumerator,
            o.upfront.fxDenominator,
          ) +
            o.upfront.service
      )
        throw Error("ACTUAL_COST_NOT_COVERED");
      if (o.consolidatedFreight)
        o.finalFreightVersion = o.consolidatedFreight.version;
      o.finalTotal = p.total;
      o.finalApproved =
        !!o.quote &&
        quoteTotal(o.quote) === p.total &&
        (!o.consolidatedFreight ||
          o.consolidatedFreight.amount === o.quote.internationalShipping);
      break;
    }
    case "approveFinal":
      guard(
        o.stage === "PACKED" &&
          o.finalTotal !== undefined &&
          o.purchaseKind !== "catalog",
      );
      o.finalApproved = true;
      break;
    case "dispatch":
      guard(canDispatch(o));
      o.stage = "IN_TRANSIT";
      break;
    case "track": {
      const p = z
        .object({
          tracking: z.string().min(3).max(100),
          delivered: z.boolean(),
        })
        .strict()
        .parse(payload);
      guard(o.stage === "IN_TRANSIT");
      o.tracking = p.tracking;
      if (p.delivered) o.stage = "DELIVERED";
      break;
    }
    case "confirmReceipt":
      z.object({ received: z.literal(true) })
        .strict()
        .parse(payload);
      guard(
        o.stage === "DELIVERED" &&
          !!o.tracking &&
          canDispatch({ ...o, stage: "READY_TO_SHIP" }),
      );
      o.stage = "COMPLETED";
      break;
    case "hold":
      o.hold = z
        .object({ reason: z.string().max(500) })
        .strict()
        .parse(payload).reason;
      break;
    case "cancelRequest":
      guard(
        o.stage === "REQUESTED" ||
          (o.purchaseKind === "catalog" &&
            o.stage === "QUOTE_ACCEPTED" &&
            o.collected === 0 &&
            o.refunded === 0),
      );
      o.stage = "CANCELLED";
      break;
    default:
      throw Error("INVALID_ACTION");
  }
  if (
    o.stage === "PACKED" &&
    o.finalApproved &&
    o.finalTotal !== undefined &&
    o.collected - o.refunded - (o.refundReserved ?? 0) >= o.finalTotal &&
    !o.hold
  )
    o.stage = "READY_TO_SHIP";
  o.version++;
  return o;
}

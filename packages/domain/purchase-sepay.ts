import { z } from "zod";

export const SEPAY_MERCHANT = "SP-TEST-HL5339A9";
export const SEPAY_CHECKOUT_URL =
  "https://pay-sandbox.sepay.vn/v1/checkout/init";
export const paymentMethodSchema = z.enum([
  "BANK_TRANSFER",
  "NAPAS_BANK_TRANSFER",
  "CARD",
]);
export type PurchasePaymentMethod = z.infer<typeof paymentMethodSchema>;
export type PaymentCapabilities = {
  provider: "demo" | "sepay_sandbox" | "unavailable";
  methods: Record<PurchasePaymentMethod, { available: boolean }>;
};
export function paymentCapabilities(
  provider: PaymentCapabilities["provider"],
): PaymentCapabilities {
  return {
    provider,
    methods: {
      BANK_TRANSFER: { available: provider !== "unavailable" },
      NAPAS_BANK_TRANSFER: { available: false },
      CARD: { available: false },
    },
  };
}
export function requireBankTransfer(method: unknown) {
  if (method !== "BANK_TRANSFER") throw Error("PAYMENT_METHOD_UNAVAILABLE");
  return "BANK_TRANSFER" as const;
}
/** VND has no fractional settlement unit. Never round a provider decimal. */
export function sepayVnd(value: unknown): number {
  if (
    typeof value !== "string" ||
    !/^(?:0|[1-9][0-9]{0,14})(?:\.0{1,2})?$/.test(value)
  )
    throw Error("SEPAY_AMOUNT_INVALID");
  const n = Number(value.split(".")[0]);
  if (!Number.isSafeInteger(n) || n <= 0 || n > 1e12)
    throw Error("SEPAY_AMOUNT_INVALID");
  return n;
}
const providerId = z.string().regex(/^[A-Za-z0-9_-]{1,100}$/);
export const sepayInvoiceSchema = z.string().regex(/^SSG-SBX-[a-f0-9]{32}$/);
export function sepayInvoice(checkoutId: string) {
  return sepayInvoiceSchema.parse(
    `SSG-SBX-${z.string().uuid().parse(checkoutId).replaceAll("-", "")}`,
  );
}
const transactionSchema = z.object({
  id: providerId,
  transaction_id: providerId.optional(),
  payment_method: paymentMethodSchema,
  transaction_type: z.string().max(40),
  transaction_status: z.string().max(40),
  transaction_amount: z.string().max(40),
  transaction_currency: z.string().max(10),
  transaction_date: z.string().max(40),
});
const orderSchema = z.object({
  id: providerId,
  order_id: providerId,
  order_invoice_number: sepayInvoiceSchema,
  order_status: z.string().max(50),
  order_amount: z.string().max(40),
  order_currency: z.string().max(10),
});
/** Unknown customer/card fields are deliberately stripped at admission. */
export const sepayIpnSchema = z.object({
  timestamp: z.number().int().nonnegative().safe(),
  notification_type: z.enum(["ORDER_PAID", "TRANSACTION_VOID"]),
  order: orderSchema,
  transaction: transactionSchema,
});
export type SePayIpn = z.infer<typeof sepayIpnSchema>;
export const sepayReadbackSchema = z.object({
  data: orderSchema.extend({
    transactions: z.array(transactionSchema).max(50),
  }),
});
export type SePayIntent = {
  checkoutId: string;
  ownerId: string;
  invoice: string;
  merchant: typeof SEPAY_MERCHANT;
  provider: "sepay_sandbox";
  amount: number;
  currency: "VND";
  paymentMethod: "BANK_TRANSFER";
  checkoutHash: string;
  createdAt: number;
  expiresAt: number;
  providerOrderId?: string;
  providerInternalId?: string;
};
export type SePayProof = {
  checkoutId: string;
  ownerId: string;
  provider: "sepay_sandbox";
  merchant: typeof SEPAY_MERCHANT;
  invoice: string;
  providerOrderId: string;
  providerInternalId: string;
  transactionId: string;
  reference: string;
  amount: number;
  expectedAmount: number;
  currency: "VND";
  paymentMethod: "BANK_TRANSFER";
  paidAt: number;
  verifiedAt: number;
  checkoutHash: string;
  state: "verified";
};
/** Provider's unzoned timestamps are Vietnam local time, never host local time. */
export function sepayPaidAt(raw: string) {
  const calendar = /^(\d{4})-(\d{2})-(\d{2})[ T]/.exec(raw);
  if (
    !calendar ||
    Number(calendar[1]) < 1970 ||
    Number(calendar[2]) < 1 ||
    Number(calendar[2]) > 12 ||
    Number(calendar[3]) < 1 ||
    Number(calendar[3]) >
      new Date(
        Date.UTC(Number(calendar[1]), Number(calendar[2]), 0),
      ).getUTCDate()
  )
    throw Error("SEPAY_DATE_INVALID");
  // Date.parse normalizes 24:00:00 into tomorrow. A payment timestamp must
  // describe the supplied calendar day, not silently roll into another one.
  const clock = /[ T](\d{2}):(\d{2}):(\d{2})/.exec(raw);
  if (
    !clock ||
    Number(clock[1]) > 23 ||
    Number(clock[2]) > 59 ||
    Number(clock[3]) > 59
  )
    throw Error("SEPAY_DATE_INVALID");
  const iso = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw)
    ? `${raw.replace(" ", "T")}+07:00`
    : raw;
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(
      iso,
    )
  )
    throw Error("SEPAY_DATE_INVALID");
  const n = Date.parse(iso);
  if (!Number.isSafeInteger(n) || n < 0) throw Error("SEPAY_DATE_INVALID");
  return n;
}
export function verifySePayReadback(
  raw: unknown,
  intent: SePayIntent,
  notification?: SePayIpn,
  now = Date.now(),
): SePayProof | null {
  const { data } = sepayReadbackSchema.parse(raw);
  if (
    intent.provider !== "sepay_sandbox" ||
    intent.merchant !== SEPAY_MERCHANT ||
    intent.currency !== "VND" ||
    intent.paymentMethod !== "BANK_TRANSFER" ||
    data.order_invoice_number !== intent.invoice ||
    data.order_currency !== "VND" ||
    sepayVnd(data.order_amount) !== intent.amount ||
    !intent.providerOrderId ||
    data.order_id !== intent.providerOrderId ||
    data.id !== intent.providerInternalId
  )
    throw Error("SEPAY_BINDING_MISMATCH");
  if (
    notification &&
    (notification.order.order_id !== data.order_id ||
      notification.order.id !== data.id ||
      notification.order.order_invoice_number !== intent.invoice)
  )
    throw Error("SEPAY_BINDING_MISMATCH");
  if (data.order_status !== "CAPTURED") return null;
  const paid = data.transactions.filter(
    (t) =>
      t.transaction_type === "PAYMENT" &&
      t.transaction_status === "APPROVED" &&
      (!notification || t.id === notification.transaction.id),
  );
  // A normalized authenticated notice identifies one transaction within the
  // readback. Without it, multiple approved payments remain ambiguous.
  if (paid.length !== 1) throw Error("SEPAY_AMBIGUOUS_PAYMENT");
  const t = paid[0];
  if (
    t.payment_method !== intent.paymentMethod ||
    t.transaction_currency !== "VND" ||
    (notification &&
      (notification.notification_type !== "ORDER_PAID" ||
        notification.transaction.id !== t.id ||
        notification.order.order_currency !== "VND" ||
        sepayVnd(notification.order.order_amount) !== intent.amount ||
        notification.transaction.transaction_type !== "PAYMENT" ||
        notification.transaction.transaction_status !== "APPROVED" ||
        notification.transaction.transaction_currency !== "VND" ||
        sepayPaidAt(notification.transaction.transaction_date) !==
          sepayPaidAt(t.transaction_date) ||
        notification.transaction.payment_method !== t.payment_method ||
        sepayVnd(notification.transaction.transaction_amount) !==
          sepayVnd(t.transaction_amount)))
  )
    throw Error("SEPAY_TRANSACTION_MISMATCH");
  const paidAt = sepayPaidAt(t.transaction_date);
  if (paidAt > now + 300000 || paidAt < intent.createdAt - 300000)
    throw Error("SEPAY_DATE_INVALID");
  return {
    checkoutId: intent.checkoutId,
    ownerId: intent.ownerId,
    provider: "sepay_sandbox",
    merchant: SEPAY_MERCHANT,
    invoice: intent.invoice,
    providerOrderId: data.order_id,
    providerInternalId: data.id,
    transactionId: t.id,
    reference: `SEPAY-SBX-${t.id}`,
    amount: sepayVnd(t.transaction_amount),
    expectedAmount: intent.amount,
    currency: "VND",
    paymentMethod: "BANK_TRANSFER",
    paidAt,
    verifiedAt: now,
    checkoutHash: intent.checkoutHash,
    state: "verified",
  };
}
export const sepayFormSchema = z
  .object({
    action: z.literal(SEPAY_CHECKOUT_URL),
    fields: z
      .array(z.tuple([z.string().regex(/^[a-z_]{1,40}$/), z.string().max(500)]))
      .min(8)
      .max(16),
  })
  .strict();
/** Ordered pairs preserve the SDK's signed field order. No arbitrary hidden fields. */
export function admitSePayForm(
  raw: unknown,
  intent: { id: string; total: number },
) {
  const form = sepayFormSchema.parse(raw),
    fields = Object.fromEntries(form.fields);
  const allowed = [
    "merchant",
    "operation",
    "payment_method",
    "order_invoice_number",
    "order_amount",
    "currency",
    "order_description",
    "success_url",
    "error_url",
    "cancel_url",
    "signature",
  ];
  if (
    new Set(form.fields.map(([k]) => k)).size !== form.fields.length ||
    form.fields.some(([k]) => !allowed.includes(k)) ||
    fields.merchant !== SEPAY_MERCHANT ||
    fields.operation !== "PURCHASE" ||
    fields.payment_method !== "BANK_TRANSFER" ||
    fields.currency !== "VND" ||
    fields.order_invoice_number !== sepayInvoice(intent.id) ||
    fields.order_amount !== String(intent.total) ||
    !/^[A-Za-z0-9+/]{43}=$/.test(fields.signature ?? "")
  )
    throw Error("SEPAY_FORM_INVALID");
  for (const name of ["success", "error", "cancel"])
    if (
      fields[`${name}_url`] !==
      `http://127.0.0.1:5207/checkout/payment/${intent.id}?sepay=${name}`
    )
      throw Error("SEPAY_RETURN_INVALID");
  return form;
}

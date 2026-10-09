import { customerEmailCatalog } from "./customer-email-catalog";
export { customerEmailCatalog };
export type CustomerTemplateId = keyof typeof customerEmailCatalog;
type Field<K extends CustomerTemplateId> =
  (typeof customerEmailCatalog)[K]["fields"][number];
const moneyFields = [
  "quotedTotal",
  "paidAmount",
  "differenceAmount",
  "previousTotal",
  "proposedTotal",
  "balanceDue",
  "finalTotal",
  "netPaid",
  "zeroAmount",
  "excessAmount",
  "refundAmount",
] as const;
const dateFields = ["observedAt", "refundRecordedAt", "endsAt"] as const;
type MoneyField = (typeof moneyFields)[number];
type DateField = (typeof dateFields)[number];
export type PaymentScope =
  | "catalog_full"
  | "custom_initial"
  | "sourcing_difference"
  | "final_balance"
  | "mixed_checkout"
  | "legacy_payment";
export type CustomerPayload<K extends CustomerTemplateId> =
  K extends CustomerTemplateId
    ? {
        [F in Field<K>]: F extends MoneyField | DateField
          ? number
          : F extends "paymentScope"
            ? PaymentScope
            : string;
      }
    : never;
export type CustomerEvent = {
  [K in CustomerTemplateId]: {
    schemaVersion: 1;
    templateId: K;
    templateVersion: 2;
    ownerId: string;
    entityId: string;
    entityVersion: number;
    eventId: string;
    occurredAt: number;
    orderId?: string;
    payload: CustomerPayload<K>;
    // Policies requiring unread/material-change evidence intentionally remain disabled.
  };
}[CustomerTemplateId];
export const paymentScopeCopy: Record<PaymentScope, string> = {
  catalog_full: "Khoản thanh toán sản phẩm đã được ghi nhận.",
  custom_initial:
    "Khoản thanh toán ban đầu cho đơn mua hộ đã được ghi nhận. Chi phí phát sinh sẽ được cập nhật trong đơn.",
  sourcing_difference: "Khoản trả thêm theo giá mua đã duyệt đã được ghi nhận.",
  final_balance:
    "Khoản thanh toán phần còn lại theo chi phí cuối đã được ghi nhận.",
  mixed_checkout: "Chi tiết phân bổ theo từng đơn nằm trong tài khoản.",
  legacy_payment:
    "Khoản thanh toán đã được ghi nhận vào đơn. Bạn có thể xem số dư trong tài khoản.",
};
export const customerResourceId = (value: unknown): value is string =>
  typeof value === "string" && /^[a-zA-Z0-9_-]{1,128}$/.test(value);
const validText = (value: unknown) =>
  typeof value === "string" &&
  value.trim().length > 0 &&
  value.length <= 1000 &&
  !Array.from(value).some(
    (char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127,
  ) &&
  !/\{\{/.test(value);
/** Strict, bounded server event contract. Never accept client HTML, destination URLs or arbitrary payment copy. */
export function parseCustomerEvent(value: unknown): CustomerEvent {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("INVALID_CUSTOMER_EVENT");
  const e = value as Record<string, unknown>;
  if (
    Object.keys(e).some(
      (k) =>
        ![
          "schemaVersion",
          "templateId",
          "templateVersion",
          "ownerId",
          "entityId",
          "entityVersion",
          "eventId",
          "occurredAt",
          "orderId",
          "payload",
        ].includes(k),
    ) ||
    e.schemaVersion !== 1 ||
    e.templateVersion !== 2 ||
    typeof e.templateId !== "string" ||
    !Object.hasOwn(customerEmailCatalog, e.templateId) ||
    !customerResourceId(e.ownerId) ||
    !customerResourceId(e.entityId) ||
    !customerResourceId(e.eventId) ||
    (e.orderId !== undefined && !customerResourceId(e.orderId)) ||
    !Number.isSafeInteger(e.entityVersion) ||
    (e.entityVersion as number) < 1 ||
    !Number.isSafeInteger(e.occurredAt) ||
    (e.occurredAt as number) < 0 ||
    (e.occurredAt as number) > 8640000000000000 ||
    !e.payload ||
    typeof e.payload !== "object" ||
    Array.isArray(e.payload)
  )
    throw Error("INVALID_CUSTOMER_EVENT");
  const template = customerEmailCatalog[e.templateId as CustomerTemplateId];
  const payload = e.payload as Record<string, unknown>;
  if (
    Object.keys(payload).length !== template.fields.length ||
    Object.keys(payload).some(
      (k) => !(template.fields as readonly string[]).includes(k),
    )
  )
    throw Error("INVALID_CUSTOMER_FIELDS");
  for (const field of template.fields) {
    const v = payload[field];
    if ((moneyFields as readonly string[]).includes(field)) {
      if (
        !Number.isSafeInteger(v) ||
        (v as number) < 0 ||
        (field === "zeroAmount" && v !== 0)
      )
        throw Error("INVALID_CUSTOMER_MONEY");
    } else if ((dateFields as readonly string[]).includes(field)) {
      if (
        !Number.isSafeInteger(v) ||
        (v as number) <= 0 ||
        (v as number) > 8640000000000000
      )
        throw Error("INVALID_CUSTOMER_DATE");
    } else if (field === "paymentScope") {
      if (typeof v !== "string" || !Object.hasOwn(paymentScopeCopy, v))
        throw Error("INVALID_PAYMENT_SCOPE");
    } else if (!validText(v)) throw Error("INVALID_CUSTOMER_TEXT");
  }
  if (
    e.templateId === "price_change_proposed" &&
    (!(Number(payload.differenceAmount) > 0) ||
      Number(payload.proposedTotal) - Number(payload.previousTotal) !==
        payload.differenceAmount)
  )
    throw Error("INVALID_PRICE_DIFFERENCE");
  if (
    e.templateId === "final_balance_due" &&
    (!(Number(payload.balanceDue) > 0) ||
      Number(payload.finalTotal) - Number(payload.netPaid) !==
        payload.balanceDue)
  )
    throw Error("INVALID_FINAL_BALANCE");
  for (const field of ["paidAmount", "refundAmount", "excessAmount"]) {
    if (Object.hasOwn(payload, field) && !(Number(payload[field]) > 0))
      throw Error("INVALID_POSITIVE_AMOUNT");
  }
  return e as CustomerEvent;
}
export function customerEmailEligible(event: CustomerEvent) {
  // Conditional/unread/progress/document-request policies require evidence not present in v1.
  return (
    customerEmailCatalog[event.templateId].policy === "email_and_in_app" &&
    event.templateId !== "receipt_ready"
  );
}
export function customerEventTarget(event: CustomerEvent) {
  const destination = customerEmailCatalog[event.templateId].destination;
  if (destination === "order" && event.orderId)
    return `/account/orders/${encodeURIComponent(event.orderId)}`;
  return {
    order: "/account",
    account: "/account",
    support: "/support",
    membership: "/membership",
    documents: "/account/documents",
  }[destination];
}
export function customerFormattedFields(
  event: CustomerEvent,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(event.payload)) {
    result[key] = (moneyFields as readonly string[]).includes(key)
      ? `${new Intl.NumberFormat("vi-VN").format(value as number)} ₫`
      : (dateFields as readonly string[]).includes(key)
        ? new Intl.DateTimeFormat("vi-VN", {
            timeZone: "Asia/Ho_Chi_Minh",
            dateStyle: "medium",
            ...(key === "observedAt" ? { timeStyle: "short" as const } : {}),
          }).format(value as number)
        : key === "paymentScope"
          ? paymentScopeCopy[value as PaymentScope]
          : String(value);
  }
  return result;
}

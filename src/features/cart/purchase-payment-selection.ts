import type {
  PaymentCapabilities,
  PurchasePaymentMethod,
} from "../../../packages/domain/purchase-sepay";
export type { PurchasePaymentMethod } from "../../../packages/domain/purchase-sepay";
export type PurchasePaymentCapabilities = PaymentCapabilities;

/** An absent or malformed server response never implies gateway readiness. */
export function availablePurchasePaymentMethods(
  capabilities: unknown,
): PurchasePaymentMethod[] {
  if (!capabilities || typeof capabilities !== "object") return [];
  const value = capabilities as Partial<PurchasePaymentCapabilities>;
  return (value.provider === "demo" || value.provider === "sepay_sandbox") &&
    value.methods?.BANK_TRANSFER?.available === true
    ? ["BANK_TRANSFER"]
    : [];
}

export function isPurchasePaymentMethod(
  value: unknown,
): value is PurchasePaymentMethod {
  return (
    value === "BANK_TRANSFER" ||
    value === "NAPAS_BANK_TRANSFER" ||
    value === "CARD"
  );
}

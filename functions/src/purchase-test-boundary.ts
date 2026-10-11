import { HttpsError } from "firebase-functions/v2/https";
import {
  purchaseExecutionProvenance,
  purchaseTestRecord,
} from "../../packages/domain/purchase-checkout";

/** Conservative classification: partial or unknown provenance never gains live authority. */
export const isPurchaseTestRecord = purchaseTestRecord;

function validatedExecution(record: unknown) {
  try {
    return purchaseExecutionProvenance(record);
  } catch {
    throw new HttpsError(
      "failed-precondition",
      "Đơn và lượt thanh toán chưa khớp.",
      { reason: "PURCHASE_EXECUTION_INVALID" },
    );
  }
}

/** Only validated, server-pinned provenance may be propagated to a new record. */
export function purchaseExecutionFields(record: unknown) {
  const provenance = validatedExecution(record);
  return provenance
    ? { ...provenance, testMode: true as const }
    : isPurchaseTestRecord(record)
      ? { testMode: true as const }
      : {};
}

/** A sandbox proof cannot authorize real money, stock or physical fulfillment. */
export function requireLivePurchaseRecord(record: unknown) {
  if (isPurchaseTestRecord(record))
    throw new HttpsError(
      "failed-precondition",
      "Đơn thử không dùng cho thao tác này.",
      { reason: "TEST_OPERATION_NOT_SUPPORTED" },
    );
}

export function purchaseFinancialCollection(record: unknown) {
  return isPurchaseTestRecord(record)
    ? "purchaseTestFinancialEntries"
    : "financialEntries";
}

/** Matching mode and run are required before a balance can touch its source order. */
export function matchingPurchaseExecution(left: unknown, right: unknown) {
  const a = validatedExecution(left);
  const b = validatedExecution(right);
  if (!a || !b)
    return (
      !a && !b && isPurchaseTestRecord(left) === isPurchaseTestRecord(right)
    );
  return (
    a.executionMode === b.executionMode &&
    a.executionPolicyVersion === b.executionPolicyVersion &&
    a.testRunId === b.testRunId
  );
}

import { isPurchaseTestRecord, purchaseExecutionFields, requireLivePurchaseRecord } from "./purchase-test-boundary";
/** Artifact v1 must never fall through to live creation after failed test admission. */
export function productionTestCommandAdmissionRequired(
  environment: Readonly<Record<string, string | undefined>> = process.env,
) {
  return environment.PURCHASE_PRODUCTION_TEST_ARTIFACT === "v1";
}
/** These transitions simulate decisions; physical and financial actions stay unavailable. */
const simulatedActions = new Set([
  "issueQuote", "acceptQuote", "cancelRequest", "claimPurchase", "hold",
  "releaseHold", "finalize", "approveFinal",
]);
export function assertProductionTestCommand(record: unknown, action: string) {
  if (!isPurchaseTestRecord(record)) return;
  purchaseExecutionFields(record);
  if (!simulatedActions.has(action)) requireLivePurchaseRecord(record);
}

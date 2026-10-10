import { isPurchaseTestRecord, purchaseExecutionFields, requireLivePurchaseRecord } from "./purchase-test-boundary";
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

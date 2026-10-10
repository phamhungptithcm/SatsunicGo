import {
  purchaseExecutionProvenanceSchema,
  purchaseTestRecord,
} from "../../packages/domain/purchase-checkout";

/** Safe display metadata. Invalid provenance stays visibly test-only; this
 * projection never authorizes settlement or any business mutation. */
export function purchaseTestProjection(record: unknown) {
  const provenance = purchaseExecutionProvenanceSchema.safeParse(record);
  return {
    ...(provenance.success ? provenance.data : {}),
    ...(purchaseTestRecord(record) ? { testMode: true as const } : {}),
  };
}

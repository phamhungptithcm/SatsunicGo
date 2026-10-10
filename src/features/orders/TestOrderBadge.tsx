import { purchaseTestRecord } from "../../../packages/domain/purchase-checkout";
import "./test-order.css";

/** A display cue only. Every mutation still checks persisted server provenance. */
export function TestOrderBadge({
  record,
  label = "Đơn test",
}: {
  record: unknown;
  label?: string;
}) {
  return purchaseTestRecord(record) ? (
    <span className="testOrderBadge" role="note" aria-label={label}>
      Test
    </span>
  ) : null;
}

export function matchesOrderKind(record: unknown, kind: string) {
  return kind === "test"
    ? purchaseTestRecord(record)
    : kind === "live"
      ? !purchaseTestRecord(record)
      : true;
}

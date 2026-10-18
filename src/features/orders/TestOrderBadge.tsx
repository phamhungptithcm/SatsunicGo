import { purchaseTestRecord } from "../../../packages/domain/purchase-checkout";
import "./test-order.css";

/** A display cue only. Every mutation still checks persisted server provenance. */
export function TestOrderBadge({
  record,
  label,
}: {
  record: unknown;
  label?: string;
}) {
  const simulated =
    (record as { paymentProvider?: string; provider?: string } | null)
      ?.paymentProvider === "production_demo" ||
    (record as { provider?: string } | null)?.provider === "production_demo";
  return purchaseTestRecord(record) ? (
    <span
      className="testOrderBadge"
      role="note"
      aria-label={label ?? (simulated ? "Đơn mô phỏng" : "Đơn test")}
    >
      {simulated ? "Mô phỏng" : "Test"}
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

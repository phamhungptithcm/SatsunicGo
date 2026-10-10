import { CrmIcon, CrmState } from "../crm/CrmPresentation";
import { useEffect, useRef, useState } from "react";
import { callService } from "../../shared/firebase";
import { TestOrderBadge } from "../orders/TestOrderBadge";
import type { PurchaseExecutionProvenance } from "../../../packages/domain/purchase-checkout";
type Operations = Partial<PurchaseExecutionProvenance> & {
  testMode?: boolean;
  recipient?: { recipient: string; phone: string; address: string } | null;
  receiving: { quantity: number; condition: string; shelf: string } | null;
  packing: {
    weightGrams: number;
    dimensionsCm: number[];
    checklist: boolean;
  } | null;
  purchase: { supplierOrder: string; quantity: number } | null;
};
export function OperationsDetails({ orderId }: { orderId: string }) {
  const [data, setData] = useState<Operations | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const generation = useRef(0);
  useEffect(
    () => () => {
      generation.current++;
    },
    [orderId],
  );
  async function load() {
    const current = ++generation.current;
    setBusy(true);
    setError("");
    setData(null);
    try {
      const result = await callService<Operations>("readOrderOperations", {
        orderId,
      });
      if (current === generation.current) setData(result);
    } catch {
      if (current !== generation.current) return;
      setError(
        "Chưa tải được dữ liệu kho. Kiểm tra quyền hiện hành và thử lại.",
      );
    } finally {
      if (current === generation.current) setBusy(false);
    }
  }
  return (
    <details
      className="crmItemDetails"
      onToggle={(event) => {
        if (event.currentTarget.open && !data && !busy) void load();
      }}
    >
      <summary>
        <CrmIcon name="box" /> Dữ liệu mua, nhận kho và đóng gói
      </summary>
      <p className="muted">
        Thông tin của lần ghi nhận gần nhất, không thay tổng số lượng trong đơn.
        Nhãn in nội bộ không phải shipping label đã mua của hãng vận chuyển.
      </p>
      {busy && <CrmState kind="loading" title="Đang tải dữ liệu kho…" />}
      {error && (
        <CrmState kind="error" title="Chưa tải được dữ liệu kho">
          {error}
        </CrmState>
      )}
      {data && (
        <div className="crmFacts">
          <TestOrderBadge record={data} />
          {data.recipient && (
            <p>
              Người nhận: {data.recipient.recipient} · {data.recipient.phone}
              <br />
              {data.recipient.address}
            </p>
          )}
          <p>
            {data.purchase
              ? `Đơn cửa hàng ${data.purchase.supplierOrder} · lần ghi nhận ${data.purchase.quantity} món`
              : "Chưa có thông tin mua trong phạm vi được xem."}
          </p>
          <p>
            {data.receiving
              ? `Lần nhận ${data.receiving.quantity} món · ${data.receiving.condition === "damaged" ? "Có hàng hỏng" : "Đạt kiểm tra"} · kệ ${data.receiving.shelf || "chưa ghi vị trí"}`
              : "Chưa ghi nhận thông tin kho."}
          </p>
          <p>
            {data.packing
              ? `${data.packing.weightGrams} g · ${data.packing.dimensionsCm.join(" × ")} cm · ${data.packing.checklist ? "Đã xác nhận checklist" : "Checklist chưa xác nhận"}`
              : "Chưa ghi nhận đóng gói."}
          </p>
          <button type="button" onClick={() => window.print()}>
            <CrmIcon name="document" /> In thông tin kho nội bộ
          </button>
        </div>
      )}
      <button type="button" disabled={busy} onClick={() => void load()}>
        <CrmIcon name="refresh" /> Tải lại dữ liệu kho
      </button>
    </details>
  );
}

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../shared/firebase";
import { DeliveryEstimate } from "./DeliveryEstimate";
import type { Parcel } from "../../../packages/domain/shipping";
const labels = {
  packed: "Đã đóng kiện",
  in_transit: "Đang vận chuyển",
  delivered: "Đã giao kiện",
  failed: "Giao không thành công",
  returned: "Đã trả lại",
};
export function CustomerShipments({ uid }: { uid: string }) {
  const [rows, setRows] = useState<Parcel[]>([]),
    [error, setError] = useState(false),
    [loading, setLoading] = useState(true);
  const [observedAt, setObservedAt] = useState(0);
  useEffect(() => {
    setRows([]);
    setError(false);
    setLoading(true);
    if (!db) {
      setLoading(false);
      setError(true);
      return;
    }
    return onSnapshot(
      query(
        collection(db, "customerShipments"),
        where("ownerId", "==", uid),
        limit(30),
      ),
      (s) => {
        setObservedAt(Date.now());
        setRows(s.docs.map((d) => d.data() as Parcel));
        setLoading(false);
      },
      () => {
        setError(true);
        setLoading(false);
      },
    );
  }, [uid]);
  return (
    <section>
      <h2>Kiện vận chuyển của bạn</h2>
      {loading && <p role="status">Đang tải kiện hàng…</p>}
      {!loading && !error && rows.length === 0 && (
        <p>Chưa có kiện được phân bổ.</p>
      )}
      {rows.map((p) => (
        <article className="panel order" key={p.id}>
          <h3>Kiện {p.id}</h3>
          <p>
            {labels[p.state]} · {p.route}
          </p>
          <p>
            {p.allocations.reduce((sum, a) => sum + a.quantity, 0)} sản phẩm của
            bạn
          </p>
          {p.tracking && (
            <p>
              {p.carrier} · vận đơn {p.tracking}
            </p>
          )}
          <DeliveryEstimate
            value={p.deliveryEstimate}
            state={p.state}
            observedAt={observedAt}
          />
          <p className="quietNote">
            Trạng thái được nhân viên cập nhật thủ công. Một kiện đã giao chưa
            có nghĩa toàn bộ đơn đã giao đủ.
          </p>
        </article>
      ))}
      {error && <p role="alert">Chưa tải được kiện vận chuyển.</p>}
    </section>
  );
}

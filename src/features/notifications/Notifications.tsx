import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { Link } from "react-router-dom";
import { db, callService } from "../../shared/firebase";
const labels: Record<string, string> = {
  issueQuote: "Có báo giá cần bạn xem",
  verifyTransfer: "Tiền vào đã được xác nhận",
  finalize: "Chi phí cuối đã được cập nhật",
  dispatch: "Đơn đã bàn giao xuất gửi",
  track: "Vận chuyển có cập nhật",
  refund: "Hoàn tiền đã được ghi nhận",
  submitRequest: "Yêu cầu đã được lưu",
  acceptQuote: "Báo giá đã được chấp nhận",
  transferReview: "Thông báo chuyển khoản đang chờ đối soát",
};
export function Notifications({ uid }: { uid: string }) {
  const [rows, setRows] = useState<
      {
        id: string;
        orderId: string;
        action: string;
        read: boolean;
        createdAt: number;
      }[]
    >([]),
    [error, setError] = useState("");
  useEffect(() => {
    setRows([]);
    if (!db) return;
    return onSnapshot(
      query(
        collection(db, "notifications"),
        where("ownerId", "==", uid),
        limit(30),
      ),
      (s) =>
        setRows(
          s.docs.map(
            (d) => ({ ...d.data(), id: d.id }) as (typeof rows)[number],
          ),
        ),
      () => setError("Chưa tải được thông báo."),
    );
  }, [uid]);
  async function read(id: string) {
    try {
      await callService("readNotification", { id });
    } catch {
      setError("Chưa đánh dấu đã đọc được.");
    }
  }
  return (
    <details className="panel">
      <summary>Thông báo của bạn · tối đa 30 bản ghi</summary>
      {rows.map((n) => (
        <article className="order" key={n.id}>
          <p>
            {labels[n.action] ?? "Đơn có cập nhật"} ·{" "}
            {new Date(n.createdAt).toLocaleString("vi-VN")}
          </p>
          <Link to={`/account/orders/${n.orderId}`}>Xem đơn</Link>
          {!n.read && (
            <button onClick={() => void read(n.id)}>Đánh dấu đã đọc</button>
          )}
        </article>
      ))}
      {!rows.length && <p>Chưa có thông báo được gửi vào hộp thư.</p>}
      {error && <p role="alert">{error}</p>}
    </details>
  );
}

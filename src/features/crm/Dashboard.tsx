import { useState, type FormEvent } from "react";
import { callService } from "../../shared/firebase";
const labels: Record<string, string> = {
  requests: "Yêu cầu mới",
  quotes: "Báo giá chờ khách duyệt",
  purchasing: "Đã đủ cọc, cần mua",
  holds: "Đơn đang hold",
  balance: "Tổng cuối đã duyệt, còn thu",
  ready: "Sẵn sàng xuất gửi",
  tickets: "Ticket đang mở",
  transfers: "Chuyển khoản chờ xác minh",
  exceptions: "Ngoại lệ tài chính",
};
type Snapshot = {
  counts: Record<string, number>;
  observedAt: number;
  from: number;
  until: number;
  truncated: string[];
};
export function Dashboard() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function load(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      setSnapshot(
        await callService<Snapshot>("operationalDashboard", {
          from: new Date(`${f.get("from")}T00:00:00Z`).getTime(),
          until: Math.min(
            Date.now(),
            new Date(`${f.get("until")}T23:59:59Z`).getTime(),
          ),
        }),
      );
    } catch {
      setError(
        "Chưa tải được số liệu. Chọn khoảng tối đa 31 ngày và kiểm tra quyền vận hành.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel">
      <h2>Tổng quan vận hành</h2>
      <p>
        Đếm trạng thái hiện tại của bản ghi tạo trong khoảng đã chọn (UTC), tối
        đa 100 bản ghi mỗi loại. Không phải tổng toàn hệ thống. Chưa có ETA được
        xác nhận để tính đơn giao trễ.
      </p>
      <form className="form" onSubmit={(e) => void load(e)}>
        <label>
          Từ ngày (UTC)
          <input
            type="date"
            name="from"
            defaultValue={new Date(Date.now() - 7 * 86400000)
              .toISOString()
              .slice(0, 10)}
            required
          />
        </label>
        <label>
          Đến ngày (UTC)
          <input
            type="date"
            name="until"
            defaultValue={new Date().toISOString().slice(0, 10)}
            required
          />
        </label>
        <button disabled={busy}>{busy ? "Đang tải…" : "Xem số liệu"}</button>
      </form>
      {snapshot && (
        <>
          <p>
            Đọc lúc {new Date(snapshot.observedAt).toISOString()} · snapshot,
            chưa cập nhật trực tiếp
          </p>
          {snapshot.truncated.length > 0 && (
            <p role="status">
              Một số hàng đợi đạt giới hạn 100; cần thu hẹp khoảng để kiểm tra
              đầy đủ.
            </p>
          )}
          <dl>
            {Object.entries(snapshot.counts).map(([key, value]) => (
              <div key={key}>
                <dt>{labels[key]}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}

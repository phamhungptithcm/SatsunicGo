import { CrmHeading, CrmIcon, CrmState } from "./CrmPresentation";
import { useState, type FormEvent } from "react";
import { callService } from "../../shared/firebase";
import { Link } from "react-router-dom";
const destinations: Record<string, string> = {
  requests: "/crm/orders?queue=requests",
  quotes: "/crm/orders?queue=quotes",
  purchasing: "/crm/purchasing",
  holds: "/crm/orders?queue=holds",
  balance: "/crm/orders?queue=balance",
  ready: "/crm/orders?queue=ready",
  tickets: "/crm/support",
  transfers: "/crm/finance",
  exceptions: "/crm/finance",
};
const labels: Record<string, string> = {
  requests: "Yêu cầu mới",
  quotes: "Báo giá chờ khách duyệt",
  purchasing: "Đủ tiền theo loại đơn, cần mua",
  holds: "Đơn đang tạm giữ",
  balance: "Đơn còn tiền cần thanh toán",
  ready: "Sẵn sàng xuất gửi",
  tickets: "Hội thoại đang mở",
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
    <section className="crmDashboard">
      <CrmHeading
        title="Tổng quan vận hành"
        actions={
          <>
            <Link to="/crm/follow-ups">
              <CrmIcon name="clock" />
              Lịch chăm sóc →
            </Link>
            <Link to="/crm/customers">
              <CrmIcon name="person" />
              Khách hàng →
            </Link>
          </>
        }
      />
      <form className="crmDashboardToolbar" onSubmit={(e) => void load(e)}>
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
        <button className="primary" disabled={busy}>
          {busy ? "Đang tải…" : "Xem số liệu"}
        </button>
      </form>
      <p className="crmDashboardScope">
        Trạng thái hiện tại của bản ghi tạo trong khoảng đã chọn (UTC), tối đa
        100 bản ghi mỗi loại. Không phải tổng toàn hệ thống. Chưa có thời gian
        giao dự kiến được xác nhận để tính đơn giao trễ.
      </p>
      {!snapshot && !busy && !error && (
        <CrmState kind="empty" title="Chọn khoảng ngày để xem công việc">
          Chọn tối đa 31 ngày, rồi bấm Xem số liệu.
        </CrmState>
      )}
      {snapshot && (
        <>
          <p className="crmDashboardFreshness">
            Đọc lúc {new Date(snapshot.observedAt).toLocaleString("vi-VN")} ·
            giờ thiết bị · chưa cập nhật trực tiếp
          </p>
          {snapshot.truncated.length > 0 && (
            <p role="status">
              Một số hàng đợi đạt giới hạn 100; cần thu hẹp khoảng để kiểm tra
              đầy đủ.
            </p>
          )}
          <dl className="crmMetrics">
            {Object.entries(snapshot.counts).map(([key, value]) => (
              <div key={key}>
                <dt>
                  <Link to={destinations[key]}>{labels[key]}</Link>
                </dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
      {busy && <CrmState kind="loading" title="Đang tải…" />}
      {error && <CrmState kind="error" title={error} />}
    </section>
  );
}

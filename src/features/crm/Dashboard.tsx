import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Link } from "react-router-dom";
import { callService } from "../../shared/firebase";
import { CrmHeading, CrmIcon, type CrmIconName } from "./CrmPresentation";
import {
  dashboardMetrics,
  formatCount,
  parseSnapshot,
  periodForDays,
  periodLabel,
  resolvePeriod,
  type DashboardPeriod,
  type MetricKey,
  type Snapshot,
} from "./dashboard094-model";
import "./dashboard094.css";

const primary: { key: MetricKey; icon: CrmIconName; note: string }[] = [
  { key: "requests", icon: "document", note: "Tiếp nhận và chuẩn bị báo giá" },
  { key: "quotes", icon: "clock", note: "Theo dõi phản hồi của khách" },
  { key: "purchasing", icon: "box", note: "Đủ tiền, không bị tạm giữ" },
  { key: "ready", icon: "check", note: "Đủ điều kiện xuất gửi" },
];
const actions: { key: MetricKey; icon: CrmIconName; note: string }[] = [
  { key: "exceptions", icon: "warning", note: "Kiểm tra và đối soát" },
  {
    key: "transfers",
    icon: "document",
    note: "Xác minh trước khi ghi nhận tiền",
  },
  { key: "holds", icon: "box", note: "Kiểm tra lý do tạm giữ" },
  { key: "balance", icon: "clock", note: "Theo dõi phần tiền còn thiếu" },
  { key: "tickets", icon: "message", note: "Tiếp tục trao đổi với khách" },
];
type Failure = "connection" | "permission" | "response";

export function Dashboard() {
  const [period, setPeriod] = useState<DashboardPeriod>(() => periodForDays(7));
  const [preset, setPreset] = useState<number | null>(7);
  const [custom, setCustom] = useState(false);
  const [draft, setDraft] = useState(period);
  const [validation, setValidation] = useState("");
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [busy, setBusy] = useState(true);
  const [failure, setFailure] = useState<Failure | null>(null);
  const requestVersion = useRef(0);

  const load = useCallback(async (selected: DashboardPeriod) => {
    const version = ++requestVersion.current;
    setBusy(true);
    setFailure(null);
    try {
      const range = resolvePeriod(selected);
      const raw = await callService<unknown>("operationalDashboard", range);
      if (version !== requestVersion.current) return;
      const next = parseSnapshot(raw, range);
      if (!next) {
        setFailure("response");
        return;
      }
      setSnapshot(next);
    } catch (error) {
      if (version !== requestVersion.current) return;
      const code = (error as { code?: string } | null)?.code;
      if (
        code === "functions/permission-denied" ||
        code === "functions/unauthenticated"
      ) {
        setSnapshot(null);
        setFailure("permission");
      } else {
        setFailure("connection");
      }
    } finally {
      if (version === requestVersion.current) setBusy(false);
    }
  }, []);

  useEffect(() => {
    void load(period);
    return () => {
      requestVersion.current++;
    };
  }, [period, load]);

  function chooseDays(days: number) {
    const next = periodForDays(days);
    setPreset(days);
    setCustom(false);
    setValidation("");
    setDraft(next);
    setPeriod(next);
  }
  function applyCustom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      resolvePeriod(draft);
      setValidation("");
      setPreset(null);
      setPeriod({ ...draft });
    } catch (error) {
      setValidation((error as Error).message);
    }
  }

  const stale = !!snapshot && (busy || !!failure);
  const currentKeys = Object.keys(dashboardMetrics) as MetricKey[];
  const missing = snapshot
    ? currentKeys.filter((key) => snapshot.counts[key] === null)
    : [];
  const allZero =
    !!snapshot && currentKeys.every((key) => snapshot.counts[key] === 0);
  const chartMax = Math.max(
    1,
    ...primary.map(({ key }) => snapshot?.counts[key] ?? 0),
  );
  const count = (key: MetricKey) => formatCount(snapshot?.counts[key] ?? null);
  const partial =
    !!snapshot && (snapshot.truncated.length > 0 || missing.length > 0);

  return (
    <section
      className="crmDashboard dashboard094"
      aria-label="Tổng quan vận hành"
    >
      <CrmHeading
        title="Tổng quan vận hành"
        description="Nắm tình hình đơn hàng. Chọn việc cần xử lý tiếp theo."
        actions={
          <>
            <Link to="/crm/follow-ups">
              <CrmIcon name="clock" />
              Lịch chăm sóc
            </Link>
            <Link to="/crm/customers">
              <CrmIcon name="person" />
              Khách hàng
            </Link>
          </>
        }
      />
      <div className="d94Toolbar">
        <div className="d94Presets" role="group" aria-label="Khoảng thời gian">
          {[
            [1, "Hôm nay"],
            [7, "7 ngày"],
            [30, "30 ngày"],
          ].map(([days, label]) => (
            <button
              key={days}
              type="button"
              aria-pressed={!custom && preset === days}
              onClick={() => chooseDays(Number(days))}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={custom}
            aria-expanded={custom}
            aria-controls="d94CustomPeriod"
            onClick={() => {
              setCustom(!custom);
              setDraft(period);
              setValidation("");
            }}
          >
            Tùy chọn
          </button>
        </div>
        <button
          className="d94Refresh"
          type="button"
          disabled={busy}
          onClick={() => void load(period)}
        >
          <CrmIcon name="refresh" />
          {busy ? "Đang tải số liệu…" : "Làm mới"}
        </button>
      </div>
      {custom && (
        <form id="d94CustomPeriod" className="d94Custom" onSubmit={applyCustom}>
          <label>
            <span className="formLabelText">
              Từ ngày (UTC){" "}
              <span className="requiredMark" aria-hidden="true">
                *
              </span>
            </span>
            <input
              type="date"
              required
              value={draft.from}
              aria-describedby="d94DateHelp"
              onChange={(event) =>
                setDraft({ ...draft, from: event.target.value })
              }
            />
          </label>
          <label>
            <span className="formLabelText">
              Đến ngày (UTC){" "}
              <span className="requiredMark" aria-hidden="true">
                *
              </span>
            </span>
            <input
              type="date"
              required
              value={draft.until}
              aria-describedby="d94DateHelp"
              onChange={(event) =>
                setDraft({ ...draft, until: event.target.value })
              }
            />
          </label>
          <button type="submit" className="primary">
            Áp dụng
          </button>
          <p id="d94DateHelp">
            Chọn tối đa 31 ngày, không vượt hôm nay theo UTC.
          </p>
          {validation && (
            <p className="d94Validation" role="alert">
              {validation}
            </p>
          )}
        </form>
      )}
      <div className="d94Context">
        <span>
          {periodLabel(snapshot ? snapshot.period : period)}{" "}
          <span className="d94Timezone">UTC</span>
        </span>
        <span
          className={`d94Status${stale ? " d94Status--stale" : ""}`}
          role="status"
        >
          {busy ? (
            snapshot ? (
              `Đang tải ${periodLabel(period)} · đang hiển thị lần đọc trước`
            ) : (
              "Đang tải số liệu"
            )
          ) : failure ? (
            snapshot ? (
              `Chưa tải được ${periodLabel(period)} · số liệu lần đọc trước`
            ) : (
              "Chưa có số liệu"
            )
          ) : snapshot ? (
            <>
              Đọc lúc{" "}
              <time dateTime={new Date(snapshot.observedAt).toISOString()}>
                {new Date(snapshot.observedAt).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "UTC",
                })}
              </time>{" "}
              UTC · cập nhật khi làm mới
            </>
          ) : (
            "Chưa có số liệu"
          )}
        </span>
      </div>
      {failure && (
        <div className="d94Notice d94Notice--error" role="alert">
          <CrmIcon name="warning" />
          <div>
            <strong>
              {failure === "permission"
                ? "Chưa có quyền xem tổng quan vận hành"
                : failure === "response"
                  ? "Số liệu trả về chưa hợp lệ"
                  : "Chưa tải được số liệu"}
            </strong>
            <p>
              {failure === "permission"
                ? "Cần tài khoản chủ sở hữu hoặc quản lý vận hành. Kiểm tra tài khoản đang đăng nhập."
                : "Kiểm tra kết nối và thử lại. Khoảng ngày bạn chọn vẫn được giữ."}
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void load(period)}
          >
            Thử lại
          </button>
        </div>
      )}
      {partial && (
        <div className="d94Notice" role="status">
          <CrmIcon name="warning" />
          <div>
            <strong>Số liệu chưa đầy đủ</strong>
            <p>
              {snapshot.truncated.length > 0
                ? "Có nguồn đạt giới hạn 100 bản ghi. Thu hẹp khoảng ngày để kiểm tra thêm."
                : "Một số chỉ số chưa có dữ liệu hợp lệ. Chúng được hiển thị bằng dấu —."}
            </p>
            {snapshot.truncated.length > 0 && missing.length > 0 && (
              <p>
                Một số chỉ số chưa có dữ liệu hợp lệ và được hiển thị bằng dấu
                —.
              </p>
            )}
          </div>
        </div>
      )}
      <div
        className={`d94Data${!snapshot ? " d94Data--unavailable" : ""}`}
        aria-busy={busy}
      >
        <div className="d94Kpis">
          {primary.map(({ key, icon, note }) => (
            <Link
              className={`d94Kpi d94Kpi--${key}`}
              key={key}
              to={dashboardMetrics[key].destination}
            >
              <div className="d94KpiTop">
                <span className="d94Icon">
                  <CrmIcon name={icon} />
                </span>
                <CrmIcon name="arrow" />
              </div>
              <span className="d94KpiLabel">{dashboardMetrics[key].label}</span>
              <strong className="d94KpiValue">
                {count(key)}
                <small>đơn</small>
              </strong>
              <span className="d94KpiNote">{note}</span>
            </Link>
          ))}
        </div>
        {allZero && !stale && !partial && (
          <div className="d94Zero" role="status">
            <CrmIcon name="check" />
            <div>
              <strong>
                Không có công việc thuộc các hàng đợi trong mẫu đã đọc
              </strong>
              <p>
                Chọn khoảng khác để xem thêm. Đây không phải tổng công việc toàn
                hệ thống.
              </p>
            </div>
          </div>
        )}
        <div className="d94Panels">
          <section
            className="d94Panel d94Chart"
            aria-labelledby="d94ChartTitle"
          >
            <div className="d94PanelHeading">
              <div>
                <h2 id="d94ChartTitle">Đơn hàng cần xử lý</h2>
                <p>Số đơn theo từng hàng đợi hiện tại</p>
              </div>
              <span className="d94Tag">Đơn hàng</span>
            </div>
            <div className="d94ChartRows">
              {primary.map(({ key }, index) => (
                <div className="d94ChartRow" key={key}>
                  <div className="d94ChartLabel">
                    <Link to={dashboardMetrics[key].destination}>
                      {dashboardMetrics[key].label}
                    </Link>
                    <strong>{count(key)}</strong>
                  </div>
                  <div className="d94Track" aria-hidden="true">
                    <div
                      className={`d94Bar d94Bar--${index}`}
                      style={{
                        width: `${((snapshot?.counts[key] ?? 0) / chartMax) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="d94ChartNote">
              So sánh khối lượng từng hàng đợi, không phải tỷ lệ chuyển đổi.
            </p>
          </section>
          <section
            className="d94Panel d94Actions"
            aria-labelledby="d94ActionsTitle"
          >
            <div className="d94PanelHeading">
              <div>
                <h2 id="d94ActionsTitle">Cần theo dõi</h2>
                <p>Thanh toán, đơn tạm giữ và chăm sóc khách</p>
              </div>
              <CrmIcon name="clock" />
            </div>
            <div className="d94ActionRows">
              {actions.map(({ key, icon, note }) => (
                <Link
                  key={key}
                  to={dashboardMetrics[key].destination}
                  className="d94Action"
                >
                  <span
                    className={`d94Icon${key === "exceptions" ? " d94Icon--attention" : ""}`}
                  >
                    <CrmIcon name={icon} />
                  </span>
                  <span className="d94ActionText">
                    <strong>{dashboardMetrics[key].label}</strong>
                    <small>{note}</small>
                  </span>
                  <span className="d94ActionValue">{count(key)}</span>
                  <CrmIcon name="arrow" />
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
      <details className="d94Definition">
        <summary>Phạm vi và cách đọc số liệu</summary>
        <div>
          <p>
            Đây là trạng thái hiện tại của các bản ghi được tạo trong khoảng
            ngày đã chọn (UTC), tối đa 100 bản ghi mới nhất mỗi nguồn. Không
            phải tổng toàn hệ thống.
          </p>
          <p>
            Một đơn có thể nằm ở nhiều hàng đợi, ví dụ vừa tạm giữ vừa còn tiền
            cần thanh toán. Không cộng các số đếm thành tổng đơn hàng.
          </p>
          <p>
            Chưa có dữ liệu tổng hợp doanh thu, lợi nhuận, xu hướng theo ngày
            hoặc thời gian giao dự kiến đã xác nhận. Không suy ra các chỉ số này
            từ số đếm hàng đợi.
          </p>
          <p>
            Các liên kết mở hàng đợi vận hành với bộ lọc riêng của trang đích;
            khoảng ngày tại đây không được áp dụng sang trang đích. Dấu — nghĩa
            là chưa có số liệu; 0 nghĩa là không có bản ghi phù hợp trong mẫu đã
            đọc.
          </p>
        </div>
      </details>
      <p className="d94Footer">
        <CrmIcon name="document" />
        Bản ghi tạo trong khoảng đã chọn · tối đa 100 bản ghi mỗi nguồn · các
        trang đích có bộ lọc riêng
      </p>
    </section>
  );
}

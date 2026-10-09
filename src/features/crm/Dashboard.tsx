import { useSearchParams } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../shared/firebase";
import { PageTabs } from "../../shared/PageTabs";
import { fetchDashboardAnalytics } from "../../shared/analytics";
import {
  parseAnalyticsSnapshot,
  type AnalyticsSnapshot,
} from "../../../packages/domain/analytics";
import {
  TrendChart,
  StageChart,
  MarketChart,
  ProductRanking,
  TopicRanking,
} from "./DashboardCharts";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Link } from "react-router-dom";
import { notify } from "../../shared/feedback";
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

export function OperationalDashboard({
  externalPeriod,
}: { externalPeriod?: DashboardPeriod } = {}) {
  const [period, setPeriod] = useState<DashboardPeriod>(
    () => externalPeriod ?? periodForDays(7),
  );
  const [preset, setPreset] = useState<number | null>(7);
  const [custom, setCustom] = useState(false);
  const [draft, setDraft] = useState(period);
  const [validation, setValidation] = useState("");
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [busy, setBusy] = useState(true);
  const [failure, setFailure] = useState<Failure | null>(null);
  const requestVersion = useRef(0);

  useEffect(() => {
    if (externalPeriod) setPeriod(externalPeriod);
  }, [externalPeriod]);

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
      if (
        next.truncated.length === 0 &&
        (Object.keys(dashboardMetrics) as MetricKey[]).every(
          (key) => next.counts[key] === 0,
        )
      ) {
        notify(
          "Không có việc cần xử lý trong mẫu đã đọc. Chọn khoảng khác để xem thêm.",
          "info",
        );
      }
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
      {!externalPeriod && (
        <div className="d94Toolbar">
          <CrmHeading
            title="Tổng quan"
            reload={
              <button
                className="d94Refresh"
                type="button"
                disabled={busy}
                onClick={() => void load(period)}
              >
                <CrmIcon name="refresh" />
                {busy ? "Đang tải số liệu…" : "Làm mới"}
              </button>
            }
          />

          <div
            className="d94Presets"
            role="group"
            aria-label="Khoảng thời gian"
          >
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
          {custom && (
            <form
              id="d94CustomPeriod"
              className="d94Custom"
              onSubmit={applyCustom}
            >
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
        </div>
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

export function Dashboard() {
  return <AnalyticsOverview />;
}

function AnalyticsOverview() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "operations" ? "operations" : "customers";
  const from = params.get("from"),
    until = params.get("until");
  let selection = periodForDays(7),
    invalid = false;
  if (from || until) {
    try {
      if (!from || !until) throw Error();
      resolvePeriod({ from, until });
      selection = { from, until };
    } catch {
      invalid = true;
    }
  }
  const period = selection;
  const [draft, setDraft] = useState(period),
    [custom, setCustom] = useState(false),
    [validation, setValidation] = useState("");
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(null),
    [busy, setBusy] = useState(true),
    [failure, setFailure] = useState("");
  const [reload, setReload] = useState(0),
    request = useRef(0);
  useEffect(() => {
    setDraft({ from: period.from, until: period.until });
  }, [period.from, period.until]);
  useEffect(() => {
    const version = ++request.current;
    let live = true;
    setBusy(true);
    setFailure("");
    const range = resolvePeriod({ from: period.from, until: period.until });
    void fetchDashboardAnalytics(range)
      .then((raw) => {
        if (!live || version !== request.current) return;
        const next = parseAnalyticsSnapshot(raw, range);
        if (!next) {
          setFailure("Số liệu trả về chưa hợp lệ. Thử làm mới.");
          return;
        }
        setSnapshot(next);
      })
      .catch((e) => {
        if (!live || version !== request.current) return;
        const code = (e as { code?: string }).code;
        if (
          ["functions/permission-denied", "functions/unauthenticated"].includes(
            code ?? "",
          )
        ) {
          setSnapshot(null);
          setFailure(
            "Bạn chưa có quyền xem thống kê. Kiểm tra tài khoản đang đăng nhập.",
          );
        } else
          setFailure("Chưa tải được thống kê. Kiểm tra kết nối rồi làm mới.");
      })
      .finally(() => {
        if (live && version === request.current) setBusy(false);
      });
    return () => {
      live = false;
      request.current++;
    };
  }, [period.from, period.until, reload]);
  useEffect(
    () =>
      auth
        ? onAuthStateChanged(auth, () => {
            request.current++;
            setSnapshot(null);
            setReload((n) => n + 1);
          })
        : undefined,
    [],
  );
  function choose(next: DashboardPeriod) {
    try {
      resolvePeriod(next);
      setValidation("");
      const p = new URLSearchParams(params);
      p.set("from", next.from);
      p.set("until", next.until);
      setParams(p);
    } catch (e) {
      setValidation((e as Error).message);
    }
  }
  const retained = snapshot && (busy || failure),
    sameRange =
      snapshot?.from === resolvePeriod(period).from &&
      new Date(snapshot?.until ?? 0).toISOString().slice(0, 10) ===
        period.until;
  const usable = snapshot && sameRange ? snapshot : null;
  const collected = !!usable?.startedAt && usable.until >= usable.startedAt;
  const aggregateAvailable = collected && !!usable?.availability.traffic;
  const days =
    collected && usable?.availability.traffic
      ? usable!.days.filter(
          (r) => Date.parse(r.day + "T23:59:59.999Z") >= usable!.startedAt,
        )
      : [];
  const value = (n: number | null | undefined) => formatCount(n ?? null);
  const rate =
    usable?.sessions && usable.convertedSessions !== null
      ? `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format((usable.convertedSessions / usable.sessions) * 100)}%`
      : "—";
  const sum = (key: string) =>
    days.reduce((a, r) => a + (r.counts[key] ?? 0), 0);
  const money = (n: number) => `${new Intl.NumberFormat("vi-VN").format(n)} ₫`;
  const changeTab = (value: "customers" | "operations") => {
    const p = new URLSearchParams(params);
    p.set("tab", value);
    setParams(p);
  };
  return (
    <section
      className="crmDashboard dashboard094 analyticsOverview"
      aria-label="Tổng quan SatsunicGo"
    >
      <CrmHeading
        title="Tổng quan"
        reload={
          <button
            className="d94Refresh"
            type="button"
            disabled={busy}
            onClick={() => setReload((n) => n + 1)}
          >
            <CrmIcon name="refresh" />
            {busy ? "Đang tải…" : "Làm mới"}
          </button>
        }
      />
      <div className="aTopline">
        <div>
          <p className="aEyebrow">HIỆU QUẢ WEBSITE VÀ MUA HÀNG</p>
          <p>Hiểu nhu cầu của khách, theo dõi đơn và tiền đã ghi nhận.</p>
        </div>
        <div
          className="d94Presets"
          role="group"
          aria-label="Khoảng thời gian thống kê"
        >
          {[1, 7, 30].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => {
                choose(periodForDays(n));
                setCustom(false);
              }}
              aria-pressed={!custom && period.from === periodForDays(n).from}
            >
              {n === 1 ? "Hôm nay" : `${n} ngày`}
            </button>
          ))}
          <button
            type="button"
            aria-expanded={custom}
            onClick={() => setCustom((n) => !n)}
          >
            Tùy chọn
          </button>
        </div>
      </div>
      {custom && (
        <form
          className="d94Custom"
          onSubmit={(e) => {
            e.preventDefault();
            choose(draft);
          }}
        >
          <label>
            <span>
              Từ ngày (UTC){" "}
              <span className="requiredMark" aria-hidden="true">
                *
              </span>
            </span>
            <input
              type="date"
              required
              value={draft.from}
              onChange={(e) => setDraft({ ...draft, from: e.target.value })}
            />
          </label>
          <label>
            <span>
              Đến ngày (UTC){" "}
              <span className="requiredMark" aria-hidden="true">
                *
              </span>
            </span>
            <input
              type="date"
              required
              value={draft.until}
              onChange={(e) => setDraft({ ...draft, until: e.target.value })}
            />
          </label>
          <button type="submit">Áp dụng</button>
          <p>Chọn tối đa 31 ngày theo UTC.</p>
        </form>
      )}
      {(validation || invalid) && (
        <p className="aNotice" role="alert">
          {validation ||
            "Khoảng ngày trong đường dẫn chưa hợp lệ; đang dùng 7 ngày gần nhất."}
        </p>
      )}
      <PageTabs
        id="analytics"
        label="Nội dung tổng quan"
        value={tab}
        onChange={changeTab}
        items={[
          { value: "customers", label: "Khách hàng & mua hàng" },
          { value: "operations", label: "Vận hành" },
        ]}
      />
      <div className="aCoverage" role="status">
        <span>{periodLabel(period)} · UTC</span>
        <span>
          {retained ? "Đang hiển thị lần đọc trước · " : ""}
          {snapshot
            ? `Tổng hợp lúc ${new Date(snapshot.asOf).toLocaleString("vi-VN", { timeZone: "UTC" })} UTC`
            : busy
              ? "Đang đọc dữ liệu…"
              : "Chưa có số liệu"}
        </span>
      </div>
      {failure && (
        <p className="aNotice aError" role="alert">
          {failure}
        </p>
      )}
      {usable && !usable.enabled && (
        <p className="aNotice">
          Thu thập đang tắt. Không có lịch sử truy cập trước khi thu thập được
          bật.
        </p>
      )}
      {(usable?.startedAt ?? 0) > 0 && (
        <p className="aFootnote">
          Bắt đầu thu thập:{" "}
          {new Date(usable!.startedAt).toLocaleString("vi-VN", {
            timeZone: "UTC",
          })}{" "}
          UTC. Chỉ tính các lượt đã ghi nhận và các nguồn được xử lý sau khi
          bật.
        </p>
      )}
      {usable && !usable.complete && (
        <p className="aNotice">
          Số liệu chưa bao phủ toàn kỳ
          {usable.backlog
            ? ` · ${usable.backlog >= 101 ? "ít nhất 101" : usable.backlog} tác vụ đang chờ`
            : ""}
          {usable.deadLetters
            ? ` · ${usable.deadLetters >= 101 ? "ít nhất 101" : usable.deadLetters} tác vụ cần kiểm tra`
            : ""}
          . Các chỉ số không đủ dữ liệu hiển thị —.
        </p>
      )}
      {tab === "customers" ? (
        <div
          role="tabpanel"
          id="analytics-panel-customers"
          aria-labelledby="analytics-tab-customers"
        >
          <div className="aKpis">
            {[
              {
                label: "Phiên truy cập",
                number: value(usable?.sessions),
                note: "Phiên đã ghi nhận, kết thúc sau 30 phút không hoạt động",
              },
              {
                label: "Trình duyệt truy cập",
                number: value(usable?.browsers),
                note: "Mã trình duyệt khác nhau; không phải số người chính xác",
              },
              {
                label: "Khách có đơn thanh toán",
                number: value(usable?.buyers),
                note: "Tài khoản có thanh toán đã xác minh trong kỳ, gồm tiền cọc",
              },
              {
                label: "Phiên có đơn thanh toán",
                number: rate,
                note: `${value(usable?.convertedSessions)} / ${value(usable?.sessions)} phiên thuộc cùng nhóm thời gian`,
              },
            ].map((k, i) => (
              <article className={`aKpi aKpi${i}`} key={k.label}>
                <span>{k.label}</span>
                <strong>{k.number}</strong>
                <small>{k.note}</small>
              </article>
            ))}
          </div>
          <div className="aGrid">
            <TrendChart
              title="Lượt truy cập theo ngày"
              rows={days}
              series={[
                { key: "views", label: "Lượt xem trang" },
                { key: "sessions", label: "Phiên mới", color: "#159079" },
              ]}
            />
            <section className="aChart">
              <h2>Từ truy cập đến mua hàng</h2>
              <p className="aSub">
                Đối chiếu với lần thanh toán đầu tiên trong 7 ngày từ lúc bắt
                đầu phiên.
              </p>
              <ol className="aFunnel">
                <li>
                  <span>Phiên đã ghi nhận</span>
                  <strong>{value(usable?.sessions)}</strong>
                </li>
                <li>
                  <span>Phiên xem sản phẩm</span>
                  <strong>{value(usable?.productSessions)}</strong>
                </li>
                <li>
                  <span>Trong đó có đơn thanh toán</span>
                  <strong>{value(usable?.convertedProductSessions)}</strong>
                </li>
              </ol>
              <p className="aFootnote">
                Mua hộ không qua trang sản phẩm vẫn được tính trong tỷ lệ phiên
                có đơn thanh toán ở trên.
              </p>
              {usable?.provisional && (
                <p className="aNotice">
                  Tạm thời: các phiên gần đây chưa đủ 7 ngày theo dõi.
                </p>
              )}
              <p className="aFootnote">
                Đơn có liên kết phiên / đơn có thanh toán trong kỳ:{" "}
                {value(usable?.linkedPaidOrders)} / {value(usable?.paidOrders)}.
                Tài khoản truy cập: {value(usable?.accounts)}.
              </p>
            </section>
          </div>
          <div className="aGrid">
            <ProductRanking
              available={!!usable?.availability.products}
              rows={collected ? usable!.products : []}
            />
            <TopicRanking
              available={!!usable?.availability.topics}
              rows={collected ? usable!.topics : []}
            />
          </div>
          {usable?.finance && (
            <>
              <TrendChart
                title="Tiền đã ghi nhận"
                rows={days}
                unit="VND"
                series={[
                  { key: "payments", label: "Thu đã ghi nhận" },
                  { key: "refunds", label: "Hoàn tiền", color: "#d37820" },
                  {
                    key: "reversals",
                    label: "Đảo giao dịch",
                    color: "#d85270",
                  },
                ]}
              />
              <p className="aFootnote">
                Thu {aggregateAvailable ? money(sum("payments")) : "—"} · Hoàn{" "}
                {aggregateAvailable ? money(sum("refunds")) : "—"} · Đảo{" "}
                {aggregateAvailable ? money(sum("reversals")) : "—"} · Ròng{" "}
                {aggregateAvailable
                  ? money(sum("payments") - sum("refunds") - sum("reversals"))
                  : "—"}
                . Đây là biến động tiền trong kỳ, không phải doanh thu hay lợi
                nhuận.
              </p>
            </>
          )}
        </div>
      ) : (
        <div
          role="tabpanel"
          id="analytics-panel-operations"
          aria-labelledby="analytics-tab-operations"
        >
          <div className="aGrid">
            <MarketChart rows={days} />
            <StageChart
              available={!!usable?.availability.stages}
              stages={collected ? usable!.stages : {}}
            />
          </div>
          <h2 className="aQueueHeading">Việc cần xử lý</h2>
          <p className="aFootnote">
            Các hàng đợi có thể trùng đơn và chỉ đọc tối đa 100 bản ghi mỗi
            nguồn; không phải tổng số đơn.
          </p>
          <OperationalDashboard externalPeriod={period} />
        </div>
      )}
      <p className="aFootnote">
        Quyền thống kê, chặn theo dõi, mất kết nối và thiếu liên kết đơn có thể
        làm số liệu thấp hơn thực tế. Lượt chọn không đồng nghĩa với mua hàng.
      </p>
    </section>
  );
}

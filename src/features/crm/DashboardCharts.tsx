import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { analyticsTopics } from "../../../packages/domain/analytics";
import { stageLabels, type Stage } from "../../../packages/domain";
const colors = [
  "#163cff",
  "#d37820",
  "#159079",
  "#9351c6",
  "#d85270",
  "#5283a2",
  "#a58a15",
  "#304862",
  "#bd6247",
  "#6673ce",
  "#588438",
  "#748299",
];
const format = (n: number | null) =>
  n === null ? "—" : new Intl.NumberFormat("vi-VN").format(n);
export type ChartSeries = { key: string; label: string; color?: string };
export function TrendChart({
  title,
  rows,
  series,
  unit = "lượt",
}: {
  title: string;
  rows: { day: string; counts: Record<string, number> }[];
  series: ChartSeries[];
  unit?: string;
}) {
  const id = useId(),
    [selected, setSelected] = useState(0),
    width = 640,
    height = 210,
    left = 62,
    top = 14,
    bottom = 180;
  const max = Math.max(
    1,
    ...rows.flatMap((r) => series.map((s) => r.counts[s.key] ?? 0)),
  );
  const x = (i: number) =>
      left + (i * (width - left - 16)) / Math.max(1, rows.length - 1),
    y = (v: number) => bottom - (v / max) * (bottom - top);
  const active = rows[Math.min(selected, rows.length - 1)];
  return (
    <section className="aChart" aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      <div className="aLegend">
        {series.map((s, i) => (
          <span key={s.key}>
            <i style={{ background: s.color ?? colors[i] }} />
            {s.label}
          </span>
        ))}
        <span>{unit} · UTC</span>
      </div>
      {rows.length > 0 ? (
        <>
          <div
            className="aPlot"
            tabIndex={0}
            role="group"
            aria-label={`${title}. Dùng phím trái phải chọn ngày.`}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                e.preventDefault();
                setSelected((n) =>
                  Math.max(
                    0,
                    Math.min(
                      rows.length - 1,
                      n + (e.key === "ArrowRight" ? 1 : -1),
                    ),
                  ),
                );
              }
            }}
          >
            <svg
              viewBox={`0 0 ${width} ${height}`}
              role="img"
              aria-label={`${title}, ${rows.length} ngày. Số liệu chi tiết bên dưới.`}
            >
              <defs>
                {series.map((s, i) => (
                  <linearGradient
                    id={`${id}-${i}`}
                    key={s.key}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={s.color ?? colors[i]}
                      stopOpacity=".16"
                    />
                    <stop
                      offset="100%"
                      stopColor={s.color ?? colors[i]}
                      stopOpacity="0"
                    />
                  </linearGradient>
                ))}
              </defs>
              {[0, 0.5, 1].map((t) => (
                <g key={t}>
                  <line
                    x1={left}
                    x2={width - 16}
                    y1={y(t * max)}
                    y2={y(t * max)}
                    stroke="#dfe6f1"
                  />
                  <text x={left - 8} y={y(t * max) + 4} textAnchor="end">
                    {new Intl.NumberFormat("vi-VN", {
                      notation: "compact",
                    }).format(t * max)}
                  </text>
                </g>
              ))}
              {series.map((s, i) => {
                const points = rows
                  .map((r, j) => `${x(j)},${y(r.counts[s.key] ?? 0)}`)
                  .join(" ");
                return (
                  <g key={s.key}>
                    <polygon
                      points={`${left},${bottom} ${points} ${x(rows.length - 1)},${bottom}`}
                      fill={`url(#${id}-${i})`}
                    />
                    <polyline
                      points={points}
                      fill="none"
                      stroke={s.color ?? colors[i]}
                      strokeWidth="2.5"
                    />
                    {rows.map((r, j) => (
                      <circle
                        key={r.day}
                        cx={x(j)}
                        cy={y(r.counts[s.key] ?? 0)}
                        r={j === selected ? 5 : 3}
                        fill={s.color ?? colors[i]}
                        onClick={() => setSelected(j)}
                      />
                    ))}
                  </g>
                );
              })}
              {rows
                .filter(
                  (_, i) =>
                    i === 0 ||
                    i === rows.length - 1 ||
                    i === Math.floor(rows.length / 2),
                )
                .map((r) => (
                  <text
                    key={r.day}
                    x={x(rows.indexOf(r))}
                    y={height - 8}
                    textAnchor="middle"
                  >
                    {r.day.slice(5).split("-").reverse().join("/")}
                  </text>
                ))}
            </svg>
          </div>
          <div className="aPoint">
            <button
              type="button"
              aria-label="Ngày trước"
              disabled={selected === 0}
              onClick={() => setSelected((n) => n - 1)}
            >
              ←
            </button>
            <output aria-live="polite">
              {active?.day}:{" "}
              {series
                .map((s) => `${s.label} ${format(active?.counts[s.key] ?? 0)}`)
                .join(" · ")}
            </output>
            <button
              type="button"
              aria-label="Ngày sau"
              disabled={selected >= rows.length - 1}
              onClick={() => setSelected((n) => n + 1)}
            >
              →
            </button>
          </div>
          <details>
            <summary>Xem số liệu theo ngày</summary>
            <div className="aTableScroll">
              <table>
                <caption>
                  {title} · {unit} · UTC
                </caption>
                <thead>
                  <tr>
                    <th>Ngày</th>
                    {series.map((s) => (
                      <th key={s.key}>{s.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.day}>
                      <th>{r.day}</th>
                      {series.map((s) => (
                        <td key={s.key}>{format(r.counts[s.key] ?? 0)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      ) : (
        <p className="aEmpty">Chưa có số liệu cho khoảng này.</p>
      )}
    </section>
  );
}
export function StageChart({
  stages,
  available = true,
}: {
  stages: Record<string, number>;
  available?: boolean;
}) {
  const rows = available ? Object.entries(stages).filter(([, n]) => n > 0) : [],
    total = rows.reduce((a, [, n]) => a + n, 0);
  let start = 0;
  return (
    <section className="aChart">
      <h2>Trạng thái đơn trong kỳ</h2>
      <p className="aSub">
        Trạng thái hiện tại của các đơn được tạo trong khoảng đã chọn.
      </p>
      <div className="aDonutLayout">
        <svg
          viewBox="0 0 200 200"
          role="img"
          aria-label={
            !available
              ? "Chưa có số liệu trạng thái đơn"
              : total
                ? `${format(total)} đơn, các trạng thái trong bảng`
                : "Chưa có đơn được ghi nhận"
          }
        >
          <circle
            cx="100"
            cy="100"
            r="72"
            fill="none"
            stroke="#edf1f7"
            strokeWidth="22"
          />
          {rows.map(([key, n], i) => {
            const offset = start;
            start += n / total;
            return (
              <circle
                key={key}
                cx="100"
                cy="100"
                r="72"
                fill="none"
                stroke={colors[i % colors.length]}
                strokeWidth="22"
                strokeDasharray={`${(n / total) * 452.39} 452.39`}
                strokeDashoffset={-offset * 452.39}
                transform="rotate(-90 100 100)"
              />
            );
          })}
          <text x="100" y="101" textAnchor="middle" className="aDonutNumber">
            {format(available ? total : null)}
          </text>
          <text x="100" y="122" textAnchor="middle">
            đơn được ghi nhận
          </text>
        </svg>
        <table>
          <caption className="srOnly">Trạng thái và số đơn</caption>
          <tbody>
            {rows.map(([key, n], i) => (
              <tr key={key}>
                <th>
                  <i style={{ background: colors[i % colors.length] }} />
                  {stageLabels[key as Stage] ?? "Chưa phân loại"}
                </th>
                <td>{format(n)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!total && (
        <p className="aEmpty">
          {available
            ? "Chưa có đơn được ghi nhận trong kỳ."
            : "Chưa có số liệu trạng thái đơn."}
        </p>
      )}
    </section>
  );
}
export function MarketChart({
  rows,
}: {
  rows: { day: string; counts: Record<string, number> }[];
}) {
  const series = [
    { key: "US", label: "Mỹ" },
    { key: "JP", label: "Nhật Bản" },
    { key: "KR", label: "Hàn Quốc" },
    { key: "unknown", label: "Chưa phân loại" },
  ];
  const max = Math.max(
    1,
    ...rows.map((r) => series.reduce((a, s) => a + (r.counts[s.key] ?? 0), 0)),
  );
  return (
    <section className="aChart">
      <h2>Đơn mới theo nguồn hàng</h2>
      <div className="aLegend">
        {series.map((s, i) => (
          <span key={s.key}>
            <i style={{ background: colors[i] }} />
            {s.label}
          </span>
        ))}
      </div>
      {rows.length ? (
        <>
          <div
            className="aStack"
            role="img"
            aria-label="Số đơn mới theo ngày và quốc gia. Xem bảng để đọc giá trị."
          >
            {rows.map((r) => (
              <div key={r.day} title={r.day}>
                <div className="aStackColumn">
                  {series.map((s, i) => (
                    <span
                      key={s.key}
                      style={{
                        height: `${((r.counts[s.key] ?? 0) / max) * 100}%`,
                        background: colors[i],
                      }}
                    />
                  ))}
                </div>
                <small>{r.day.slice(8)}</small>
              </div>
            ))}
          </div>
          <details>
            <summary>Xem số liệu theo nguồn hàng</summary>
            <div className="aTableScroll">
              <table>
                <caption>Đơn mới · UTC</caption>
                <thead>
                  <tr>
                    <th>Ngày</th>
                    {series.map((s) => (
                      <th key={s.key}>{s.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.day}>
                      <th>{r.day}</th>
                      {series.map((s) => (
                        <td key={s.key}>{format(r.counts[s.key] ?? 0)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      ) : (
        <p className="aEmpty">Chưa có dữ liệu đơn mới.</p>
      )}
    </section>
  );
}
export function ProductRanking({
  rows,
  available = true,
}: {
  available?: boolean;
  rows: {
    id: string;
    title?: string;
    slug?: string;
    views: number;
    clicks: number;
    paidOrders: number | null;
  }[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.clicks));
  const [sort, setSort] = useState<{
    key: "title" | "views" | "clicks" | "paidOrders";
    descending: boolean;
  }>({ key: "clicks", descending: true });
  const sorted = [...rows].sort((a, b) => {
    const av = sort.key === "title" ? (a.title ?? a.id) : a[sort.key],
      bv = sort.key === "title" ? (b.title ?? b.id) : b[sort.key];
    if (av === null) return bv === null ? 0 : 1;
    if (bv === null) return -1;
    const delta =
      typeof av === "string" && typeof bv === "string"
        ? av.localeCompare(bv, "vi")
        : Number(av) - Number(bv);
    return (sort.descending ? -delta : delta) || a.id.localeCompare(b.id);
  });
  return (
    <section className="aChart">
      <h2>Sản phẩm được quan tâm</h2>
      <p className="aSub">
        Chọn tối đa 10 sản phẩm theo lượt chọn; bấm tiêu đề cột để sắp xếp các
        dòng. Đơn thanh toán đủ chỉ đếm một lần cho mỗi sản phẩm trong đơn.
      </p>
      {available && rows.length ? (
        <div className="aTableScroll">
          <table>
            <caption className="srOnly">
              Lượt xem, lượt chọn và đơn thanh toán đủ
            </caption>
            <thead>
              <tr>
                {(
                  [
                    { key: "title", label: "Sản phẩm" },
                    { key: "views", label: "Xem" },
                    { key: "clicks", label: "Chọn" },
                    { key: "paidOrders", label: "Đơn đủ tiền" },
                  ] as const
                ).map((c) => (
                  <th
                    key={c.key}
                    aria-sort={
                      sort.key === c.key
                        ? sort.descending
                          ? "descending"
                          : "ascending"
                        : "none"
                    }
                  >
                    <button
                      type="button"
                      className="aSortButton"
                      aria-label={`Sắp xếp theo ${c.label}`}
                      onClick={() =>
                        setSort((current) => ({
                          key: c.key,
                          descending:
                            current.key === c.key
                              ? !current.descending
                              : c.key !== "title",
                        }))
                      }
                    >
                      {c.label}
                      <span aria-hidden="true">
                        {sort.key === c.key
                          ? sort.descending
                            ? " ↓"
                            : " ↑"
                          : ""}
                      </span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.id}>
                  <th>
                    {r.slug ? (
                      <Link to={`/products/${r.slug}`}>{r.title ?? r.id}</Link>
                    ) : (
                      <span>{r.title ?? r.id}</span>
                    )}
                    <span
                      className="aRankBar"
                      style={{ width: `${(r.clicks / max) * 100}%` }}
                    />
                  </th>
                  <td>{format(r.views)}</td>
                  <td>{format(r.clicks)}</td>
                  <td>{format(r.paidOrders)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="aEmpty">
          {available
            ? "Chưa ghi nhận tương tác sản phẩm trong khoảng này."
            : "Chưa có dữ liệu sản phẩm đủ phạm vi để thống kê. Thử chọn khoảng ngắn hơn."}
        </p>
      )}
    </section>
  );
}
export function TopicRanking({
  rows,
  available = true,
}: {
  available?: boolean;
  rows: {
    id: keyof typeof analyticsTopics;
    questions: number;
    sessions: number;
  }[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.questions));
  return (
    <section className="aChart">
      <h2>Chủ đề được hỏi trong Ask</h2>
      <p className="aSub">
        Chỉ hiển thị chủ đề có từ 5 phiên khác nhau. Câu hỏi được phân nhóm,
        không lưu nguyên văn trong thống kê.
      </p>
      {available && rows.length ? (
        <table>
          <caption className="srOnly">Chủ đề, số câu hỏi và phiên</caption>
          <thead>
            <tr>
              <th>Chủ đề</th>
              <th>Câu hỏi</th>
              <th>Phiên</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <th>
                  {analyticsTopics[r.id]}
                  <span
                    className="aRankBar"
                    aria-hidden="true"
                    style={{ width: `${(r.questions / max) * 100}%` }}
                  />
                </th>
                <td>{format(r.questions)}</td>
                <td>{format(r.sessions)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="aEmpty">
          {available
            ? "Chưa có chủ đề đủ số phiên để hiển thị."
            : "Dữ liệu phiên và chủ đề chưa khả dụng trong khoảng này."}
        </p>
      )}
    </section>
  );
}

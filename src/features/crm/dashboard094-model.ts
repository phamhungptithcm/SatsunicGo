export const dashboardMetrics = {
  requests: { label: "Yêu cầu mới", destination: "/crm/orders?queue=requests" },
  quotes: {
    label: "Báo giá chờ khách duyệt",
    destination: "/crm/orders?queue=quotes",
  },
  purchasing: { label: "Sẵn sàng mua hàng", destination: "/crm/purchasing" },
  ready: { label: "Sẵn sàng xuất gửi", destination: "/crm/orders?queue=ready" },
  exceptions: { label: "Ngoại lệ tài chính", destination: "/crm/finance" },
  transfers: {
    label: "Chuyển khoản chờ xác minh",
    destination: "/crm/finance",
  },
  holds: { label: "Đơn đang tạm giữ", destination: "/crm/orders?queue=holds" },
  balance: {
    label: "Đơn còn tiền cần thanh toán",
    destination: "/crm/orders?queue=balance",
  },
  tickets: { label: "Hội thoại đang mở", destination: "/crm/support" },
} as const;
export type MetricKey = keyof typeof dashboardMetrics;
export type DashboardPeriod = { from: string; until: string };
export type Snapshot = {
  counts: Record<MetricKey, number | null>;
  observedAt: number;
  from: number;
  until: number;
  truncated: string[];
  period: DashboardPeriod;
};
const day = 86400000;
const dateOnly = (timestamp: number) =>
  new Date(timestamp).toISOString().slice(0, 10);

export function periodForDays(days: number, now = Date.now()): DashboardPeriod {
  if (!Number.isInteger(days) || days < 1 || days > 31)
    throw Error("Khoảng ngày không hợp lệ.");
  return { from: dateOnly(now - (days - 1) * day), until: dateOnly(now) };
}

export function resolvePeriod(period: DashboardPeriod, now = Date.now()) {
  const parse = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
    const result = Date.parse(`${value}T00:00:00Z`);
    return Number.isFinite(result) && dateOnly(result) === value ? result : NaN;
  };
  const from = parse(period.from),
    end = parse(period.until);
  if (!Number.isFinite(from) || !Number.isFinite(end) || from <= 0)
    throw Error("Chọn ngày bắt đầu và ngày kết thúc hợp lệ.");
  if (end < from) throw Error("Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.");
  if (end - from >= 31 * day) throw Error("Chọn khoảng tối đa 31 ngày.");
  if (period.until > dateOnly(now))
    throw Error("Ngày kết thúc không được vượt hôm nay theo UTC.");
  const until = Math.min(now, end + day - 1);
  if (until <= from)
    throw Error(
      "Chưa có khoảng thời gian để xem. Thử lại sau hoặc chọn ngày trước.",
    );
  return { from, until };
}

export function parseSnapshot(
  raw: unknown,
  expected: { from: number; until: number },
): Snapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  if (
    value.from !== expected.from ||
    value.until !== expected.until ||
    typeof value.observedAt !== "number" ||
    !Number.isSafeInteger(value.observedAt) ||
    value.observedAt <= 0 ||
    value.observedAt > 8640000000000000 ||
    !value.counts ||
    typeof value.counts !== "object" ||
    Array.isArray(value.counts) ||
    !Array.isArray(value.truncated) ||
    !value.truncated.every((kind) =>
      [
        "orders",
        "supportTickets",
        "transferReviews",
        "paymentExceptions",
      ].includes(kind),
    )
  )
    return null;
  const source = value.counts as Record<string, unknown>;
  const counts = Object.fromEntries(
    Object.keys(dashboardMetrics).map((key) => {
      const count = source[key];
      return [
        key,
        typeof count === "number" &&
        Number.isSafeInteger(count) &&
        count >= 0 &&
        count <= 100
          ? count
          : null,
      ];
    }),
  ) as Snapshot["counts"];
  return {
    counts,
    observedAt: value.observedAt,
    ...expected,
    truncated: [...new Set(value.truncated as string[])],
    period: { from: dateOnly(expected.from), until: dateOnly(expected.until) },
  };
}

export function formatCount(value: number | null) {
  return value === null ? "—" : new Intl.NumberFormat("vi-VN").format(value);
}
export function periodLabel(period: DashboardPeriod) {
  const format = (value: string) => value.split("-").reverse().join("/");
  return period.from === period.until
    ? format(period.from)
    : `${format(period.from)} – ${format(period.until)}`;
}

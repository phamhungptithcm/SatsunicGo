import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/features/crm/Dashboard.tsx");const _jsxDEV = __vite__cjsImport14_react_jsxDevRuntime["jsxDEV"]; const _Fragment = __vite__cjsImport14_react_jsxDevRuntime["Fragment"];const useCallback = __vite__cjsImport7_react["useCallback"]; const useEffect = __vite__cjsImport7_react["useEffect"]; const useRef = __vite__cjsImport7_react["useRef"]; const useState = __vite__cjsImport7_react["useState"];import { useSearchParams } from "/node_modules/.vite/deps/react-router-dom.js?v=4d23a217";
import { onAuthStateChanged } from "/node_modules/.vite/deps/firebase_auth.js?v=4d23a217";
import { auth } from "/src/shared/firebase.ts";
import { PageTabs } from "/src/shared/PageTabs.tsx";
import { fetchDashboardAnalytics } from "/src/shared/analytics.ts?t=1791470867057";
import { parseAnalyticsSnapshot } from "/packages/domain/analytics.ts";
import { TrendChart, StageChart, MarketChart, ProductRanking, TopicRanking } from "/src/features/crm/DashboardCharts.tsx?t=1791469717054";
import __vite__cjsImport7_react from "/node_modules/.vite/deps/react.js?v=4d23a217";
import { Link } from "/node_modules/.vite/deps/react-router-dom.js?v=4d23a217";
import { notify } from "/src/shared/feedback.ts";
import { callService } from "/src/shared/firebase.ts";
import { CrmHeading, CrmIcon } from "/src/features/crm/CrmPresentation.tsx";
import { dashboardMetrics, formatCount, parseSnapshot, periodForDays, periodLabel, resolvePeriod } from "/src/features/crm/dashboard094-model.ts";
import "/src/features/crm/dashboard094.css?t=1791469717057";
var _jsxFileName = "/Users/hunpeo97/Desktop/Workspace/Coder/SatsunicGo/src/features/crm/Dashboard.tsx";
import __vite__cjsImport14_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=4d23a217";
var _s = $RefreshSig$(), _s2 = $RefreshSig$();
const primary = [
	{
		key: "requests",
		icon: "document",
		note: "Tiếp nhận và chuẩn bị báo giá"
	},
	{
		key: "quotes",
		icon: "clock",
		note: "Theo dõi phản hồi của khách"
	},
	{
		key: "purchasing",
		icon: "box",
		note: "Đủ tiền, không bị tạm giữ"
	},
	{
		key: "ready",
		icon: "check",
		note: "Đủ điều kiện xuất gửi"
	}
];
const actions = [
	{
		key: "exceptions",
		icon: "warning",
		note: "Kiểm tra và đối soát"
	},
	{
		key: "transfers",
		icon: "document",
		note: "Xác minh trước khi ghi nhận tiền"
	},
	{
		key: "holds",
		icon: "box",
		note: "Kiểm tra lý do tạm giữ"
	},
	{
		key: "balance",
		icon: "clock",
		note: "Theo dõi phần tiền còn thiếu"
	},
	{
		key: "tickets",
		icon: "message",
		note: "Tiếp tục trao đổi với khách"
	}
];
export function OperationalDashboard({ externalPeriod } = {}) {
	_s();
	const [period, setPeriod] = useState(() => externalPeriod ?? periodForDays(7));
	const [preset, setPreset] = useState(7);
	const [custom, setCustom] = useState(false);
	const [draft, setDraft] = useState(period);
	const [validation, setValidation] = useState("");
	const [snapshot, setSnapshot] = useState(null);
	const [busy, setBusy] = useState(true);
	const [failure, setFailure] = useState(null);
	const requestVersion = useRef(0);
	useEffect(() => {
		if (externalPeriod) setPeriod(externalPeriod);
	}, [externalPeriod]);
	const load = useCallback(async (selected) => {
		const version = ++requestVersion.current;
		setBusy(true);
		setFailure(null);
		try {
			const range = resolvePeriod(selected);
			const raw = await callService("operationalDashboard", range);
			if (version !== requestVersion.current) return;
			const next = parseSnapshot(raw, range);
			if (!next) {
				setFailure("response");
				return;
			}
			setSnapshot(next);
			if (next.truncated.length === 0 && Object.keys(dashboardMetrics).every((key) => next.counts[key] === 0)) {
				notify("Không có việc cần xử lý trong mẫu đã đọc. Chọn khoảng khác để xem thêm.", "info");
			}
		} catch (error) {
			if (version !== requestVersion.current) return;
			const code = error?.code;
			if (code === "functions/permission-denied" || code === "functions/unauthenticated") {
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
	function chooseDays(days) {
		const next = periodForDays(days);
		setPreset(days);
		setCustom(false);
		setValidation("");
		setDraft(next);
		setPeriod(next);
	}
	function applyCustom(event) {
		event.preventDefault();
		try {
			resolvePeriod(draft);
			setValidation("");
			setPreset(null);
			setPeriod({ ...draft });
		} catch (error) {
			setValidation(error.message);
		}
	}
	const stale = !!snapshot && (busy || !!failure);
	const currentKeys = Object.keys(dashboardMetrics);
	const missing = snapshot ? currentKeys.filter((key) => snapshot.counts[key] === null) : [];
	const chartMax = Math.max(1, ...primary.map(({ key }) => snapshot?.counts[key] ?? 0));
	const count = (key) => formatCount(snapshot?.counts[key] ?? null);
	const partial = !!snapshot && (snapshot.truncated.length > 0 || missing.length > 0);
	return /* @__PURE__ */ _jsxDEV("section", {
		className: "crmDashboard dashboard094",
		"aria-label": "Tổng quan vận hành",
		children: [
			!externalPeriod && /* @__PURE__ */ _jsxDEV("div", {
				className: "d94Toolbar",
				children: [
					/* @__PURE__ */ _jsxDEV(CrmHeading, {
						title: "Tổng quan",
						reload: /* @__PURE__ */ _jsxDEV("button", {
							className: "d94Refresh",
							type: "button",
							disabled: busy,
							onClick: () => void load(period),
							children: [/* @__PURE__ */ _jsxDEV(CrmIcon, { name: "refresh" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 177,
								columnNumber: 17
							}, this), busy ? "Đang tải số liệu…" : "Làm mới"]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 171,
							columnNumber: 15
						}, this)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 168,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("div", {
						className: "d94Presets",
						role: "group",
						"aria-label": "Khoảng thời gian",
						children: [[
							[1, "Hôm nay"],
							[7, "7 ngày"],
							[30, "30 ngày"]
						].map(([days, label]) => /* @__PURE__ */ _jsxDEV("button", {
							type: "button",
							"aria-pressed": !custom && preset === days,
							onClick: () => chooseDays(Number(days)),
							children: label
						}, days, false, {
							fileName: _jsxFileName,
							lineNumber: 193,
							columnNumber: 15
						}, this)), /* @__PURE__ */ _jsxDEV("button", {
							type: "button",
							"aria-pressed": custom,
							"aria-expanded": custom,
							"aria-controls": "d94CustomPeriod",
							onClick: () => {
								setCustom(!custom);
								setDraft(period);
								setValidation("");
							},
							children: "Tùy chọn"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 202,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 183,
						columnNumber: 11
					}, this),
					custom && /* @__PURE__ */ _jsxDEV("form", {
						id: "d94CustomPeriod",
						className: "d94Custom",
						onSubmit: applyCustom,
						children: [
							/* @__PURE__ */ _jsxDEV("label", { children: [/* @__PURE__ */ _jsxDEV("span", {
								className: "formLabelText",
								children: [
									"Từ ngày (UTC)",
									" ",
									/* @__PURE__ */ _jsxDEV("span", {
										className: "requiredMark",
										"aria-hidden": "true",
										children: "*"
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 225,
										columnNumber: 19
									}, this)
								]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 223,
								columnNumber: 17
							}, this), /* @__PURE__ */ _jsxDEV("input", {
								type: "date",
								required: true,
								value: draft.from,
								"aria-describedby": "d94DateHelp",
								onChange: (event) => setDraft({
									...draft,
									from: event.target.value
								})
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 229,
								columnNumber: 17
							}, this)] }, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 222,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV("label", { children: [/* @__PURE__ */ _jsxDEV("span", {
								className: "formLabelText",
								children: [
									"Đến ngày (UTC)",
									" ",
									/* @__PURE__ */ _jsxDEV("span", {
										className: "requiredMark",
										"aria-hidden": "true",
										children: "*"
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 242,
										columnNumber: 19
									}, this)
								]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 240,
								columnNumber: 17
							}, this), /* @__PURE__ */ _jsxDEV("input", {
								type: "date",
								required: true,
								value: draft.until,
								"aria-describedby": "d94DateHelp",
								onChange: (event) => setDraft({
									...draft,
									until: event.target.value
								})
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 246,
								columnNumber: 17
							}, this)] }, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 239,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV("button", {
								type: "submit",
								className: "primary",
								children: "Áp dụng"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 256,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV("p", {
								id: "d94DateHelp",
								children: "Chọn tối đa 31 ngày, không vượt hôm nay theo UTC."
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 259,
								columnNumber: 15
							}, this),
							validation && /* @__PURE__ */ _jsxDEV("p", {
								className: "d94Validation",
								role: "alert",
								children: validation
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 263,
								columnNumber: 17
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 217,
						columnNumber: 13
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 167,
				columnNumber: 9
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "d94Context",
				children: [/* @__PURE__ */ _jsxDEV("span", { children: [
					periodLabel(snapshot ? snapshot.period : period),
					" ",
					/* @__PURE__ */ _jsxDEV("span", {
						className: "d94Timezone",
						children: "UTC"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 274,
						columnNumber: 11
					}, this)
				] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 272,
					columnNumber: 9
				}, this), /* @__PURE__ */ _jsxDEV("span", {
					className: `d94Status${stale ? " d94Status--stale" : ""}`,
					role: "status",
					children: busy ? snapshot ? `Đang tải ${periodLabel(period)} · đang hiển thị lần đọc trước` : "Đang tải số liệu" : failure ? snapshot ? `Chưa tải được ${periodLabel(period)} · số liệu lần đọc trước` : "Chưa có số liệu" : snapshot ? /* @__PURE__ */ _jsxDEV(_Fragment, { children: [
						"Đọc lúc",
						" ",
						/* @__PURE__ */ _jsxDEV("time", {
							dateTime: new Date(snapshot.observedAt).toISOString(),
							children: new Date(snapshot.observedAt).toLocaleTimeString("vi-VN", {
								hour: "2-digit",
								minute: "2-digit",
								timeZone: "UTC"
							})
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 295,
							columnNumber: 15
						}, this),
						" ",
						"UTC · cập nhật khi làm mới"
					] }, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 293,
						columnNumber: 13
					}, this) : "Chưa có số liệu"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 276,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 271,
				columnNumber: 7
			}, this),
			failure && /* @__PURE__ */ _jsxDEV("div", {
				className: "d94Notice d94Notice--error",
				role: "alert",
				children: [
					/* @__PURE__ */ _jsxDEV(CrmIcon, { name: "warning" }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 311,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("strong", { children: failure === "permission" ? "Chưa có quyền xem tổng quan vận hành" : failure === "response" ? "Số liệu trả về chưa hợp lệ" : "Chưa tải được số liệu" }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 313,
						columnNumber: 13
					}, this), /* @__PURE__ */ _jsxDEV("p", { children: failure === "permission" ? "Cần tài khoản chủ sở hữu hoặc quản lý vận hành. Kiểm tra tài khoản đang đăng nhập." : "Kiểm tra kết nối và thử lại. Khoảng ngày bạn chọn vẫn được giữ." }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 320,
						columnNumber: 13
					}, this)] }, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 312,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("button", {
						type: "button",
						disabled: busy,
						onClick: () => void load(period),
						children: "Thử lại"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 326,
						columnNumber: 11
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 310,
				columnNumber: 9
			}, this),
			partial && /* @__PURE__ */ _jsxDEV("div", {
				className: "d94Notice",
				role: "status",
				children: [/* @__PURE__ */ _jsxDEV(CrmIcon, { name: "warning" }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 337,
					columnNumber: 11
				}, this), /* @__PURE__ */ _jsxDEV("div", { children: [
					/* @__PURE__ */ _jsxDEV("strong", { children: "Số liệu chưa đầy đủ" }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 339,
						columnNumber: 13
					}, this),
					/* @__PURE__ */ _jsxDEV("p", { children: snapshot.truncated.length > 0 ? "Có nguồn đạt giới hạn 100 bản ghi. Thu hẹp khoảng ngày để kiểm tra thêm." : "Một số chỉ số chưa có dữ liệu hợp lệ. Chúng được hiển thị bằng dấu —." }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 340,
						columnNumber: 13
					}, this),
					snapshot.truncated.length > 0 && missing.length > 0 && /* @__PURE__ */ _jsxDEV("p", { children: "Một số chỉ số chưa có dữ liệu hợp lệ và được hiển thị bằng dấu —." }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 346,
						columnNumber: 15
					}, this)
				] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 338,
					columnNumber: 11
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 336,
				columnNumber: 9
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: `d94Data${!snapshot ? " d94Data--unavailable" : ""}`,
				"aria-busy": busy,
				children: [/* @__PURE__ */ _jsxDEV("div", {
					className: "d94Kpis",
					children: primary.map(({ key, icon, note }) => /* @__PURE__ */ _jsxDEV(Link, {
						className: `d94Kpi d94Kpi--${key}`,
						to: dashboardMetrics[key].destination,
						children: [
							/* @__PURE__ */ _jsxDEV("div", {
								className: "d94KpiTop",
								children: [/* @__PURE__ */ _jsxDEV("span", {
									className: "d94Icon",
									children: /* @__PURE__ */ _jsxDEV(CrmIcon, { name: icon }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 367,
										columnNumber: 19
									}, this)
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 366,
									columnNumber: 17
								}, this), /* @__PURE__ */ _jsxDEV(CrmIcon, { name: "arrow" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 369,
									columnNumber: 17
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 365,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV("span", {
								className: "d94KpiLabel",
								children: dashboardMetrics[key].label
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 371,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV("strong", {
								className: "d94KpiValue",
								children: [count(key), /* @__PURE__ */ _jsxDEV("small", { children: "đơn" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 374,
									columnNumber: 17
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 372,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV("span", {
								className: "d94KpiNote",
								children: note
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 376,
								columnNumber: 15
							}, this)
						]
					}, key, true, {
						fileName: _jsxFileName,
						lineNumber: 360,
						columnNumber: 13
					}, this))
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 358,
					columnNumber: 9
				}, this), /* @__PURE__ */ _jsxDEV("div", {
					className: "d94Panels",
					children: [/* @__PURE__ */ _jsxDEV("section", {
						className: "d94Panel d94Chart",
						"aria-labelledby": "d94ChartTitle",
						children: [
							/* @__PURE__ */ _jsxDEV("div", {
								className: "d94PanelHeading",
								children: [/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("h2", {
									id: "d94ChartTitle",
									children: "Đơn hàng cần xử lý"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 387,
									columnNumber: 17
								}, this), /* @__PURE__ */ _jsxDEV("p", { children: "Số đơn theo từng hàng đợi hiện tại" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 388,
									columnNumber: 17
								}, this)] }, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 386,
									columnNumber: 15
								}, this), /* @__PURE__ */ _jsxDEV("span", {
									className: "d94Tag",
									children: "Đơn hàng"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 390,
									columnNumber: 15
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 385,
								columnNumber: 13
							}, this),
							/* @__PURE__ */ _jsxDEV("div", {
								className: "d94ChartRows",
								children: primary.map(({ key }, index) => /* @__PURE__ */ _jsxDEV("div", {
									className: "d94ChartRow",
									children: [/* @__PURE__ */ _jsxDEV("div", {
										className: "d94ChartLabel",
										children: [/* @__PURE__ */ _jsxDEV(Link, {
											to: dashboardMetrics[key].destination,
											children: dashboardMetrics[key].label
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 396,
											columnNumber: 21
										}, this), /* @__PURE__ */ _jsxDEV("strong", { children: count(key) }, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 399,
											columnNumber: 21
										}, this)]
									}, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 395,
										columnNumber: 19
									}, this), /* @__PURE__ */ _jsxDEV("div", {
										className: "d94Track",
										"aria-hidden": "true",
										children: /* @__PURE__ */ _jsxDEV("div", {
											className: `d94Bar d94Bar--${index}`,
											style: { width: `${(snapshot?.counts[key] ?? 0) / chartMax * 100}%` }
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 402,
											columnNumber: 21
										}, this)
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 401,
										columnNumber: 19
									}, this)]
								}, key, true, {
									fileName: _jsxFileName,
									lineNumber: 394,
									columnNumber: 17
								}, this))
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 392,
								columnNumber: 13
							}, this),
							/* @__PURE__ */ _jsxDEV("p", {
								className: "d94ChartNote",
								children: "So sánh khối lượng từng hàng đợi, không phải tỷ lệ chuyển đổi."
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 412,
								columnNumber: 13
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 381,
						columnNumber: 11
					}, this), /* @__PURE__ */ _jsxDEV("section", {
						className: "d94Panel d94Actions",
						"aria-labelledby": "d94ActionsTitle",
						children: [/* @__PURE__ */ _jsxDEV("div", {
							className: "d94PanelHeading",
							children: [/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("h2", {
								id: "d94ActionsTitle",
								children: "Cần theo dõi"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 422,
								columnNumber: 17
							}, this), /* @__PURE__ */ _jsxDEV("p", { children: "Thanh toán, đơn tạm giữ và chăm sóc khách" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 423,
								columnNumber: 17
							}, this)] }, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 421,
								columnNumber: 15
							}, this), /* @__PURE__ */ _jsxDEV(CrmIcon, { name: "clock" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 425,
								columnNumber: 15
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 420,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV("div", {
							className: "d94ActionRows",
							children: actions.map(({ key, icon, note }) => /* @__PURE__ */ _jsxDEV(Link, {
								to: dashboardMetrics[key].destination,
								className: "d94Action",
								children: [
									/* @__PURE__ */ _jsxDEV("span", {
										className: `d94Icon${key === "exceptions" ? " d94Icon--attention" : ""}`,
										children: /* @__PURE__ */ _jsxDEV(CrmIcon, { name: icon }, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 437,
											columnNumber: 21
										}, this)
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 434,
										columnNumber: 19
									}, this),
									/* @__PURE__ */ _jsxDEV("span", {
										className: "d94ActionText",
										children: [/* @__PURE__ */ _jsxDEV("strong", { children: dashboardMetrics[key].label }, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 440,
											columnNumber: 21
										}, this), /* @__PURE__ */ _jsxDEV("small", { children: note }, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 441,
											columnNumber: 21
										}, this)]
									}, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 439,
										columnNumber: 19
									}, this),
									/* @__PURE__ */ _jsxDEV("span", {
										className: "d94ActionValue",
										children: count(key)
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 443,
										columnNumber: 19
									}, this),
									/* @__PURE__ */ _jsxDEV(CrmIcon, { name: "arrow" }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 444,
										columnNumber: 19
									}, this)
								]
							}, key, true, {
								fileName: _jsxFileName,
								lineNumber: 429,
								columnNumber: 17
							}, this))
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 427,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 416,
						columnNumber: 11
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 380,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 354,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("details", {
				className: "d94Definition",
				children: [/* @__PURE__ */ _jsxDEV("summary", { children: "Phạm vi và cách đọc số liệu" }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 452,
					columnNumber: 9
				}, this), /* @__PURE__ */ _jsxDEV("div", { children: [
					/* @__PURE__ */ _jsxDEV("p", { children: "Đây là trạng thái hiện tại của các bản ghi được tạo trong khoảng ngày đã chọn (UTC), tối đa 100 bản ghi mới nhất mỗi nguồn. Không phải tổng toàn hệ thống." }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 454,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("p", { children: "Một đơn có thể nằm ở nhiều hàng đợi, ví dụ vừa tạm giữ vừa còn tiền cần thanh toán. Không cộng các số đếm thành tổng đơn hàng." }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 459,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("p", { children: "Chưa có dữ liệu tổng hợp doanh thu, lợi nhuận, xu hướng theo ngày hoặc thời gian giao dự kiến đã xác nhận. Không suy ra các chỉ số này từ số đếm hàng đợi." }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 463,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("p", { children: "Các liên kết mở hàng đợi vận hành với bộ lọc riêng của trang đích; khoảng ngày tại đây không được áp dụng sang trang đích. Dấu — nghĩa là chưa có số liệu; 0 nghĩa là không có bản ghi phù hợp trong mẫu đã đọc." }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 468,
						columnNumber: 11
					}, this)
				] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 453,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 451,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("p", {
				className: "d94Footer",
				children: [/* @__PURE__ */ _jsxDEV(CrmIcon, { name: "document" }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 477,
					columnNumber: 9
				}, this), "Bản ghi tạo trong khoảng đã chọn · tối đa 100 bản ghi mỗi nguồn · các trang đích có bộ lọc riêng"]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 476,
				columnNumber: 7
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 162,
		columnNumber: 5
	}, this);
}
_s(OperationalDashboard, "mwIvJkgYEVsi1vS+de/kRS1EnnY=");
_c = OperationalDashboard;
export function Dashboard() {
	return /* @__PURE__ */ _jsxDEV(AnalyticsOverview, {}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 486,
		columnNumber: 10
	}, this);
}
_c2 = Dashboard;
function AnalyticsOverview() {
	_s2();
	const [params, setParams] = useSearchParams();
	const tab = params.get("tab") === "operations" ? "operations" : "customers";
	const from = params.get("from"), until = params.get("until");
	let selection = periodForDays(7), invalid = false;
	if (from || until) {
		try {
			if (!from || !until) throw Error();
			resolvePeriod({
				from,
				until
			});
			selection = {
				from,
				until
			};
		} catch {
			invalid = true;
		}
	}
	const period = selection;
	const [draft, setDraft] = useState(period), [custom, setCustom] = useState(false), [validation, setValidation] = useState("");
	const [snapshot, setSnapshot] = useState(null), [busy, setBusy] = useState(true), [failure, setFailure] = useState("");
	const [reload, setReload] = useState(0), request = useRef(0);
	useEffect(() => {
		setDraft({
			from: period.from,
			until: period.until
		});
	}, [period.from, period.until]);
	useEffect(() => {
		const version = ++request.current;
		let live = true;
		setBusy(true);
		setFailure("");
		const range = resolvePeriod({
			from: period.from,
			until: period.until
		});
		void fetchDashboardAnalytics(range).then((raw) => {
			if (!live || version !== request.current) return;
			const next = parseAnalyticsSnapshot(raw, range);
			if (!next) {
				setFailure("Số liệu trả về chưa hợp lệ. Thử làm mới.");
				return;
			}
			setSnapshot(next);
		}).catch((e) => {
			if (!live || version !== request.current) return;
			const code = e.code;
			if (["functions/permission-denied", "functions/unauthenticated"].includes(code ?? "")) {
				setSnapshot(null);
				setFailure("Bạn chưa có quyền xem thống kê. Kiểm tra tài khoản đang đăng nhập.");
			} else setFailure("Chưa tải được thống kê. Kiểm tra kết nối rồi làm mới.");
		}).finally(() => {
			if (live && version === request.current) setBusy(false);
		});
		return () => {
			live = false;
			request.current++;
		};
	}, [
		period.from,
		period.until,
		reload
	]);
	useEffect(() => auth ? onAuthStateChanged(auth, () => {
		request.current++;
		setSnapshot(null);
		setReload((n) => n + 1);
	}) : undefined, []);
	function choose(next) {
		try {
			resolvePeriod(next);
			setValidation("");
			const p = new URLSearchParams(params);
			p.set("from", next.from);
			p.set("until", next.until);
			setParams(p);
		} catch (e) {
			setValidation(e.message);
		}
	}
	const retained = snapshot && (busy || failure), sameRange = snapshot?.from === resolvePeriod(period).from && new Date(snapshot?.until ?? 0).toISOString().slice(0, 10) === period.until;
	const usable = snapshot && sameRange ? snapshot : null;
	const collected = !!usable?.startedAt && usable.until >= usable.startedAt;
	const aggregateAvailable = collected && !!usable?.availability.traffic;
	const days = collected && usable?.availability.traffic ? usable.days.filter((r) => Date.parse(r.day + "T23:59:59.999Z") >= usable.startedAt) : [];
	const value = (n) => formatCount(n ?? null);
	const rate = usable?.sessions && usable.convertedSessions !== null ? `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(usable.convertedSessions / usable.sessions * 100)}%` : "—";
	const sum = (key) => days.reduce((a, r) => a + (r.counts[key] ?? 0), 0);
	const money = (n) => `${new Intl.NumberFormat("vi-VN").format(n)} ₫`;
	const changeTab = (value) => {
		const p = new URLSearchParams(params);
		p.set("tab", value);
		setParams(p);
	};
	return /* @__PURE__ */ _jsxDEV("section", {
		className: "crmDashboard dashboard094 analyticsOverview",
		"aria-label": "Tổng quan SatsunicGo",
		children: [
			/* @__PURE__ */ _jsxDEV(CrmHeading, {
				title: "Tổng quan",
				reload: /* @__PURE__ */ _jsxDEV("button", {
					className: "d94Refresh",
					type: "button",
					disabled: busy,
					onClick: () => setReload((n) => n + 1),
					children: [/* @__PURE__ */ _jsxDEV(CrmIcon, { name: "refresh" }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 620,
						columnNumber: 13
					}, this), busy ? "Đang tải…" : "Làm mới"]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 614,
					columnNumber: 11
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 611,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "aTopline",
				children: [/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
					className: "aEyebrow",
					children: "HIỆU QUẢ WEBSITE VÀ MUA HÀNG"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 627,
					columnNumber: 11
				}, this), /* @__PURE__ */ _jsxDEV("p", { children: "Hiểu nhu cầu của khách, theo dõi đơn và tiền đã ghi nhận." }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 628,
					columnNumber: 11
				}, this)] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 626,
					columnNumber: 9
				}, this), /* @__PURE__ */ _jsxDEV("div", {
					className: "d94Presets",
					role: "group",
					"aria-label": "Khoảng thời gian thống kê",
					children: [[
						1,
						7,
						30
					].map((n) => /* @__PURE__ */ _jsxDEV("button", {
						type: "button",
						onClick: () => {
							choose(periodForDays(n));
							setCustom(false);
						},
						"aria-pressed": !custom && period.from === periodForDays(n).from,
						children: n === 1 ? "Hôm nay" : `${n} ngày`
					}, n, false, {
						fileName: _jsxFileName,
						lineNumber: 636,
						columnNumber: 13
					}, this)), /* @__PURE__ */ _jsxDEV("button", {
						type: "button",
						"aria-expanded": custom,
						onClick: () => setCustom((n) => !n),
						children: "Tùy chọn"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 648,
						columnNumber: 11
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 630,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 625,
				columnNumber: 7
			}, this),
			custom && /* @__PURE__ */ _jsxDEV("form", {
				className: "d94Custom",
				onSubmit: (e) => {
					e.preventDefault();
					choose(draft);
				},
				children: [
					/* @__PURE__ */ _jsxDEV("label", { children: ["Từ ngày (UTC)", /* @__PURE__ */ _jsxDEV("input", {
						type: "date",
						required: true,
						value: draft.from,
						onChange: (e) => setDraft({
							...draft,
							from: e.target.value
						})
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 667,
						columnNumber: 13
					}, this)] }, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 665,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("label", { children: ["Đến ngày (UTC)", /* @__PURE__ */ _jsxDEV("input", {
						type: "date",
						required: true,
						value: draft.until,
						onChange: (e) => setDraft({
							...draft,
							until: e.target.value
						})
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 676,
						columnNumber: 13
					}, this)] }, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 674,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("button", {
						type: "submit",
						children: "Áp dụng"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 683,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("p", { children: "Chọn tối đa 31 ngày theo UTC." }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 684,
						columnNumber: 11
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 658,
				columnNumber: 9
			}, this),
			(validation || invalid) && /* @__PURE__ */ _jsxDEV("p", {
				className: "aNotice",
				role: "alert",
				children: validation || "Khoảng ngày trong đường dẫn chưa hợp lệ; đang dùng 7 ngày gần nhất."
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 688,
				columnNumber: 9
			}, this),
			/* @__PURE__ */ _jsxDEV(PageTabs, {
				id: "analytics",
				label: "Nội dung tổng quan",
				value: tab,
				onChange: changeTab,
				items: [{
					value: "customers",
					label: "Khách hàng & mua hàng"
				}, {
					value: "operations",
					label: "Vận hành"
				}]
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 693,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "aCoverage",
				role: "status",
				children: [/* @__PURE__ */ _jsxDEV("span", { children: [periodLabel(period), " · UTC"] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 704,
					columnNumber: 9
				}, this), /* @__PURE__ */ _jsxDEV("span", { children: [retained ? "Đang hiển thị lần đọc trước · " : "", snapshot ? `Tổng hợp lúc ${new Date(snapshot.asOf).toLocaleString("vi-VN", { timeZone: "UTC" })} UTC` : busy ? "Đang đọc dữ liệu…" : "Chưa có số liệu"] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 705,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 703,
				columnNumber: 7
			}, this),
			failure && /* @__PURE__ */ _jsxDEV("p", {
				className: "aNotice aError",
				role: "alert",
				children: failure
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 715,
				columnNumber: 9
			}, this),
			usable && !usable.enabled && /* @__PURE__ */ _jsxDEV("p", {
				className: "aNotice",
				children: "Thu thập đang tắt. Không có lịch sử truy cập trước khi thu thập được bật."
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 720,
				columnNumber: 9
			}, this),
			(usable?.startedAt ?? 0) > 0 && /* @__PURE__ */ _jsxDEV("p", {
				className: "aFootnote",
				children: [
					"Bắt đầu thu thập:",
					" ",
					new Date(usable.startedAt).toLocaleString("vi-VN", { timeZone: "UTC" }),
					" ",
					"UTC. Chỉ tính các lượt đã ghi nhận và các nguồn được xử lý sau khi bật."
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 726,
				columnNumber: 9
			}, this),
			usable && !usable.complete && /* @__PURE__ */ _jsxDEV("p", {
				className: "aNotice",
				children: [
					"Số liệu chưa bao phủ toàn kỳ",
					usable.backlog ? ` · ${usable.backlog >= 101 ? "ít nhất 101" : usable.backlog} tác vụ đang chờ` : "",
					usable.deadLetters ? ` · ${usable.deadLetters >= 101 ? "ít nhất 101" : usable.deadLetters} tác vụ cần kiểm tra` : "",
					". Các chỉ số không đủ dữ liệu hiển thị —."
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 736,
				columnNumber: 9
			}, this),
			tab === "customers" ? /* @__PURE__ */ _jsxDEV("div", {
				role: "tabpanel",
				id: "analytics-panel-customers",
				"aria-labelledby": "analytics-tab-customers",
				children: [
					/* @__PURE__ */ _jsxDEV("div", {
						className: "aKpis",
						children: [
							{
								label: "Phiên truy cập",
								number: value(usable?.sessions),
								note: "Phiên đã ghi nhận, kết thúc sau 30 phút không hoạt động"
							},
							{
								label: "Trình duyệt truy cập",
								number: value(usable?.browsers),
								note: "Mã trình duyệt khác nhau; không phải số người chính xác"
							},
							{
								label: "Khách có đơn thanh toán",
								number: value(usable?.buyers),
								note: "Tài khoản có thanh toán đã xác minh trong kỳ, gồm tiền cọc"
							},
							{
								label: "Phiên có đơn thanh toán",
								number: rate,
								note: `${value(usable?.convertedSessions)} / ${value(usable?.sessions)} phiên thuộc cùng nhóm thời gian`
							}
						].map((k, i) => /* @__PURE__ */ _jsxDEV("article", {
							className: `aKpi aKpi${i}`,
							children: [
								/* @__PURE__ */ _jsxDEV("span", { children: k.label }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 777,
									columnNumber: 17
								}, this),
								/* @__PURE__ */ _jsxDEV("strong", { children: k.number }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 778,
									columnNumber: 17
								}, this),
								/* @__PURE__ */ _jsxDEV("small", { children: k.note }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 779,
									columnNumber: 17
								}, this)
							]
						}, k.label, true, {
							fileName: _jsxFileName,
							lineNumber: 776,
							columnNumber: 15
						}, this))
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 753,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("div", {
						className: "aGrid",
						children: [/* @__PURE__ */ _jsxDEV(TrendChart, {
							title: "Lượt truy cập theo ngày",
							rows: days,
							series: [{
								key: "views",
								label: "Lượt xem trang"
							}, {
								key: "sessions",
								label: "Phiên mới",
								color: "#159079"
							}]
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 784,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV("section", {
							className: "aChart",
							children: [
								/* @__PURE__ */ _jsxDEV("h2", { children: "Từ truy cập đến mua hàng" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 793,
									columnNumber: 15
								}, this),
								/* @__PURE__ */ _jsxDEV("p", {
									className: "aSub",
									children: "Đối chiếu với lần thanh toán đầu tiên trong 7 ngày từ lúc bắt đầu phiên."
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 794,
									columnNumber: 15
								}, this),
								/* @__PURE__ */ _jsxDEV("ol", {
									className: "aFunnel",
									children: [
										/* @__PURE__ */ _jsxDEV("li", { children: [/* @__PURE__ */ _jsxDEV("span", { children: "Phiên đã ghi nhận" }, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 800,
											columnNumber: 19
										}, this), /* @__PURE__ */ _jsxDEV("strong", { children: value(usable?.sessions) }, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 801,
											columnNumber: 19
										}, this)] }, void 0, true, {
											fileName: _jsxFileName,
											lineNumber: 799,
											columnNumber: 17
										}, this),
										/* @__PURE__ */ _jsxDEV("li", { children: [/* @__PURE__ */ _jsxDEV("span", { children: "Phiên xem sản phẩm" }, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 804,
											columnNumber: 19
										}, this), /* @__PURE__ */ _jsxDEV("strong", { children: value(usable?.productSessions) }, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 805,
											columnNumber: 19
										}, this)] }, void 0, true, {
											fileName: _jsxFileName,
											lineNumber: 803,
											columnNumber: 17
										}, this),
										/* @__PURE__ */ _jsxDEV("li", { children: [/* @__PURE__ */ _jsxDEV("span", { children: "Trong đó có đơn thanh toán" }, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 808,
											columnNumber: 19
										}, this), /* @__PURE__ */ _jsxDEV("strong", { children: value(usable?.convertedProductSessions) }, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 809,
											columnNumber: 19
										}, this)] }, void 0, true, {
											fileName: _jsxFileName,
											lineNumber: 807,
											columnNumber: 17
										}, this)
									]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 798,
									columnNumber: 15
								}, this),
								/* @__PURE__ */ _jsxDEV("p", {
									className: "aFootnote",
									children: "Mua hộ không qua trang sản phẩm vẫn được tính trong tỷ lệ phiên có đơn thanh toán ở trên."
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 812,
									columnNumber: 15
								}, this),
								usable?.provisional && /* @__PURE__ */ _jsxDEV("p", {
									className: "aNotice",
									children: "Tạm thời: các phiên gần đây chưa đủ 7 ngày theo dõi."
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 817,
									columnNumber: 17
								}, this),
								/* @__PURE__ */ _jsxDEV("p", {
									className: "aFootnote",
									children: [
										"Đơn có liên kết phiên / đơn có thanh toán trong kỳ:",
										" ",
										value(usable?.linkedPaidOrders),
										" / ",
										value(usable?.paidOrders),
										". Tài khoản truy cập: ",
										value(usable?.accounts),
										"."
									]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 821,
									columnNumber: 15
								}, this)
							]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 792,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 783,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("div", {
						className: "aGrid",
						children: [/* @__PURE__ */ _jsxDEV(ProductRanking, {
							available: !!usable?.availability.products,
							rows: collected ? usable.products : []
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 829,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV(TopicRanking, {
							available: !!usable?.availability.topics,
							rows: collected ? usable.topics : []
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 833,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 828,
						columnNumber: 11
					}, this),
					usable?.finance && /* @__PURE__ */ _jsxDEV(_Fragment, { children: [/* @__PURE__ */ _jsxDEV(TrendChart, {
						title: "Tiền đã ghi nhận",
						rows: days,
						unit: "VND",
						series: [
							{
								key: "payments",
								label: "Thu đã ghi nhận"
							},
							{
								key: "refunds",
								label: "Hoàn tiền",
								color: "#d37820"
							},
							{
								key: "reversals",
								label: "Đảo giao dịch",
								color: "#d85270"
							}
						]
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 840,
						columnNumber: 15
					}, this), /* @__PURE__ */ _jsxDEV("p", {
						className: "aFootnote",
						children: [
							"Thu ",
							aggregateAvailable ? money(sum("payments")) : "—",
							" · Hoàn",
							" ",
							aggregateAvailable ? money(sum("refunds")) : "—",
							" · Đảo",
							" ",
							aggregateAvailable ? money(sum("reversals")) : "—",
							" · Ròng",
							" ",
							aggregateAvailable ? money(sum("payments") - sum("refunds") - sum("reversals")) : "—",
							". Đây là biến động tiền trong kỳ, không phải doanh thu hay lợi nhuận."
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 854,
						columnNumber: 15
					}, this)] }, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 839,
						columnNumber: 13
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 748,
				columnNumber: 9
			}, this) : /* @__PURE__ */ _jsxDEV("div", {
				role: "tabpanel",
				id: "analytics-panel-operations",
				"aria-labelledby": "analytics-tab-operations",
				children: [
					/* @__PURE__ */ _jsxDEV("div", {
						className: "aGrid",
						children: [/* @__PURE__ */ _jsxDEV(MarketChart, { rows: days }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 874,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV(StageChart, {
							available: !!usable?.availability.stages,
							stages: collected ? usable.stages : {}
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 875,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 873,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("h2", {
						className: "aQueueHeading",
						children: "Việc cần xử lý"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 880,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("p", {
						className: "aFootnote",
						children: "Các hàng đợi có thể trùng đơn và chỉ đọc tối đa 100 bản ghi mỗi nguồn; không phải tổng số đơn."
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 881,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV(OperationalDashboard, { externalPeriod: period }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 885,
						columnNumber: 11
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 868,
				columnNumber: 9
			}, this),
			/* @__PURE__ */ _jsxDEV("p", {
				className: "aFootnote",
				children: "Quyền thống kê, chặn theo dõi, mất kết nối và thiếu liên kết đơn có thể làm số liệu thấp hơn thực tế. Lượt chọn không đồng nghĩa với mua hàng."
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 888,
				columnNumber: 7
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 607,
		columnNumber: 5
	}, this);
}
_s2(AnalyticsOverview, "nD98C2pGo4jBy9yZi9qOIB47AXI=", false, function() {
	return [useSearchParams];
});
_c3 = AnalyticsOverview;
var _c, _c2, _c3;
$RefreshReg$(_c, "OperationalDashboard");
$RefreshReg$(_c2, "Dashboard");
$RefreshReg$(_c3, "AnalyticsOverview");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/features/crm/Dashboard.tsx?t=1791470867057";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/hunpeo97/Desktop/Workspace/Coder/SatsunicGo/src/features/crm/Dashboard.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/hunpeo97/Desktop/Workspace/Coder/SatsunicGo/src/features/crm/Dashboard.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/hunpeo97/Desktop/Workspace/Coder/SatsunicGo/src/features/crm/Dashboard.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,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QyxRQUFRLFlBQVksT0FBUSxTQUFTLENBQUM7TUFDdkM7Ozs7Y0FDRTs7Ozs7O0tBQ0wsd0JBQUMsTUFBRDtNQUFJLFdBQVU7Z0JBQWdCO0tBQWtCOzs7OztLQUNoRCx3QkFBQyxLQUFEO01BQUcsV0FBVTtnQkFBWTtLQUd0Qjs7Ozs7S0FDSCx3QkFBQyxzQkFBRCxFQUFzQixnQkFBZ0IsT0FBUzs7Ozs7SUFDNUM7Ozs7OztHQUVQLHdCQUFDLEtBQUQ7SUFBRyxXQUFVO2NBQVk7R0FHdEI7Ozs7O0VBQ0k7Ozs7OztBQUViIiwibmFtZXMiOltdLCJzb3VyY2VzIjpbIkRhc2hib2FyZC50c3giXSwidmVyc2lvbiI6Mywic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdXNlU2VhcmNoUGFyYW1zIH0gZnJvbSBcInJlYWN0LXJvdXRlci1kb21cIjtcbmltcG9ydCB7IG9uQXV0aFN0YXRlQ2hhbmdlZCB9IGZyb20gXCJmaXJlYmFzZS9hdXRoXCI7XG5pbXBvcnQgeyBhdXRoIH0gZnJvbSBcIi4uLy4uL3NoYXJlZC9maXJlYmFzZVwiO1xuaW1wb3J0IHsgUGFnZVRhYnMgfSBmcm9tIFwiLi4vLi4vc2hhcmVkL1BhZ2VUYWJzXCI7XG5pbXBvcnQgeyBmZXRjaERhc2hib2FyZEFuYWx5dGljcyB9IGZyb20gXCIuLi8uLi9zaGFyZWQvYW5hbHl0aWNzXCI7XG5pbXBvcnQge1xuICBwYXJzZUFuYWx5dGljc1NuYXBzaG90LFxuICB0eXBlIEFuYWx5dGljc1NuYXBzaG90LFxufSBmcm9tIFwiLi4vLi4vLi4vcGFja2FnZXMvZG9tYWluL2FuYWx5dGljc1wiO1xuaW1wb3J0IHtcbiAgVHJlbmRDaGFydCxcbiAgU3RhZ2VDaGFydCxcbiAgTWFya2V0Q2hhcnQsXG4gIFByb2R1Y3RSYW5raW5nLFxuICBUb3BpY1JhbmtpbmcsXG59IGZyb20gXCIuL0Rhc2hib2FyZENoYXJ0c1wiO1xuaW1wb3J0IHtcbiAgdXNlQ2FsbGJhY2ssXG4gIHVzZUVmZmVjdCxcbiAgdXNlUmVmLFxuICB1c2VTdGF0ZSxcbiAgdHlwZSBGb3JtRXZlbnQsXG59IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IHsgTGluayB9IGZyb20gXCJyZWFjdC1yb3V0ZXItZG9tXCI7XG5pbXBvcnQgeyBub3RpZnkgfSBmcm9tIFwiLi4vLi4vc2hhcmVkL2ZlZWRiYWNrXCI7XG5pbXBvcnQgeyBjYWxsU2VydmljZSB9IGZyb20gXCIuLi8uLi9zaGFyZWQvZmlyZWJhc2VcIjtcbmltcG9ydCB7IENybUhlYWRpbmcsIENybUljb24sIHR5cGUgQ3JtSWNvbk5hbWUgfSBmcm9tIFwiLi9Dcm1QcmVzZW50YXRpb25cIjtcbmltcG9ydCB7XG4gIGRhc2hib2FyZE1ldHJpY3MsXG4gIGZvcm1hdENvdW50LFxuICBwYXJzZVNuYXBzaG90LFxuICBwZXJpb2RGb3JEYXlzLFxuICBwZXJpb2RMYWJlbCxcbiAgcmVzb2x2ZVBlcmlvZCxcbiAgdHlwZSBEYXNoYm9hcmRQZXJpb2QsXG4gIHR5cGUgTWV0cmljS2V5LFxuICB0eXBlIFNuYXBzaG90LFxufSBmcm9tIFwiLi9kYXNoYm9hcmQwOTQtbW9kZWxcIjtcbmltcG9ydCBcIi4vZGFzaGJvYXJkMDk0LmNzc1wiO1xuXG5jb25zdCBwcmltYXJ5OiB7IGtleTogTWV0cmljS2V5OyBpY29uOiBDcm1JY29uTmFtZTsgbm90ZTogc3RyaW5nIH1bXSA9IFtcbiAgeyBrZXk6IFwicmVxdWVzdHNcIiwgaWNvbjogXCJkb2N1bWVudFwiLCBub3RlOiBcIlRp4bq/cCBuaOG6rW4gdsOgIGNodeG6qW4gYuG7iyBiw6FvIGdpw6FcIiB9LFxuICB7IGtleTogXCJxdW90ZXNcIiwgaWNvbjogXCJjbG9ja1wiLCBub3RlOiBcIlRoZW8gZMO1aSBwaOG6o24gaOG7k2kgY+G7p2Ega2jDoWNoXCIgfSxcbiAgeyBrZXk6IFwicHVyY2hhc2luZ1wiLCBpY29uOiBcImJveFwiLCBub3RlOiBcIsSQ4bunIHRp4buBbiwga2jDtG5nIGLhu4sgdOG6oW0gZ2nhu69cIiB9LFxuICB7IGtleTogXCJyZWFkeVwiLCBpY29uOiBcImNoZWNrXCIsIG5vdGU6IFwixJDhu6cgxJFp4buBdSBraeG7h24geHXhuqV0IGfhu61pXCIgfSxcbl07XG5jb25zdCBhY3Rpb25zOiB7IGtleTogTWV0cmljS2V5OyBpY29uOiBDcm1JY29uTmFtZTsgbm90ZTogc3RyaW5nIH1bXSA9IFtcbiAgeyBrZXk6IFwiZXhjZXB0aW9uc1wiLCBpY29uOiBcIndhcm5pbmdcIiwgbm90ZTogXCJLaeG7g20gdHJhIHbDoCDEkeG7kWkgc2/DoXRcIiB9LFxuICB7XG4gICAga2V5OiBcInRyYW5zZmVyc1wiLFxuICAgIGljb246IFwiZG9jdW1lbnRcIixcbiAgICBub3RlOiBcIljDoWMgbWluaCB0csaw4bubYyBraGkgZ2hpIG5o4bqtbiB0aeG7gW5cIixcbiAgfSxcbiAgeyBrZXk6IFwiaG9sZHNcIiwgaWNvbjogXCJib3hcIiwgbm90ZTogXCJLaeG7g20gdHJhIGzDvSBkbyB04bqhbSBnaeG7r1wiIH0sXG4gIHsga2V5OiBcImJhbGFuY2VcIiwgaWNvbjogXCJjbG9ja1wiLCBub3RlOiBcIlRoZW8gZMO1aSBwaOG6p24gdGnhu4FuIGPDsm4gdGhp4bq/dVwiIH0sXG4gIHsga2V5OiBcInRpY2tldHNcIiwgaWNvbjogXCJtZXNzYWdlXCIsIG5vdGU6IFwiVGnhur9wIHThu6VjIHRyYW8gxJHhu5VpIHbhu5tpIGtow6FjaFwiIH0sXG5dO1xudHlwZSBGYWlsdXJlID0gXCJjb25uZWN0aW9uXCIgfCBcInBlcm1pc3Npb25cIiB8IFwicmVzcG9uc2VcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIE9wZXJhdGlvbmFsRGFzaGJvYXJkKHtcbiAgZXh0ZXJuYWxQZXJpb2QsXG59OiB7IGV4dGVybmFsUGVyaW9kPzogRGFzaGJvYXJkUGVyaW9kIH0gPSB7fSkge1xuICBjb25zdCBbcGVyaW9kLCBzZXRQZXJpb2RdID0gdXNlU3RhdGU8RGFzaGJvYXJkUGVyaW9kPihcbiAgICAoKSA9PiBleHRlcm5hbFBlcmlvZCA/PyBwZXJpb2RGb3JEYXlzKDcpLFxuICApO1xuICBjb25zdCBbcHJlc2V0LCBzZXRQcmVzZXRdID0gdXNlU3RhdGU8bnVtYmVyIHwgbnVsbD4oNyk7XG4gIGNvbnN0IFtjdXN0b20sIHNldEN1c3RvbV0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtkcmFmdCwgc2V0RHJhZnRdID0gdXNlU3RhdGUocGVyaW9kKTtcbiAgY29uc3QgW3ZhbGlkYXRpb24sIHNldFZhbGlkYXRpb25dID0gdXNlU3RhdGUoXCJcIik7XG4gIGNvbnN0IFtzbmFwc2hvdCwgc2V0U25hcHNob3RdID0gdXNlU3RhdGU8U25hcHNob3QgfCBudWxsPihudWxsKTtcbiAgY29uc3QgW2J1c3ksIHNldEJ1c3ldID0gdXNlU3RhdGUodHJ1ZSk7XG4gIGNvbnN0IFtmYWlsdXJlLCBzZXRGYWlsdXJlXSA9IHVzZVN0YXRlPEZhaWx1cmUgfCBudWxsPihudWxsKTtcbiAgY29uc3QgcmVxdWVzdFZlcnNpb24gPSB1c2VSZWYoMCk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoZXh0ZXJuYWxQZXJpb2QpIHNldFBlcmlvZChleHRlcm5hbFBlcmlvZCk7XG4gIH0sIFtleHRlcm5hbFBlcmlvZF0pO1xuXG4gIGNvbnN0IGxvYWQgPSB1c2VDYWxsYmFjayhhc3luYyAoc2VsZWN0ZWQ6IERhc2hib2FyZFBlcmlvZCkgPT4ge1xuICAgIGNvbnN0IHZlcnNpb24gPSArK3JlcXVlc3RWZXJzaW9uLmN1cnJlbnQ7XG4gICAgc2V0QnVzeSh0cnVlKTtcbiAgICBzZXRGYWlsdXJlKG51bGwpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByYW5nZSA9IHJlc29sdmVQZXJpb2Qoc2VsZWN0ZWQpO1xuICAgICAgY29uc3QgcmF3ID0gYXdhaXQgY2FsbFNlcnZpY2U8dW5rbm93bj4oXCJvcGVyYXRpb25hbERhc2hib2FyZFwiLCByYW5nZSk7XG4gICAgICBpZiAodmVyc2lvbiAhPT0gcmVxdWVzdFZlcnNpb24uY3VycmVudCkgcmV0dXJuO1xuICAgICAgY29uc3QgbmV4dCA9IHBhcnNlU25hcHNob3QocmF3LCByYW5nZSk7XG4gICAgICBpZiAoIW5leHQpIHtcbiAgICAgICAgc2V0RmFpbHVyZShcInJlc3BvbnNlXCIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBzZXRTbmFwc2hvdChuZXh0KTtcbiAgICAgIGlmIChcbiAgICAgICAgbmV4dC50cnVuY2F0ZWQubGVuZ3RoID09PSAwICYmXG4gICAgICAgIChPYmplY3Qua2V5cyhkYXNoYm9hcmRNZXRyaWNzKSBhcyBNZXRyaWNLZXlbXSkuZXZlcnkoXG4gICAgICAgICAgKGtleSkgPT4gbmV4dC5jb3VudHNba2V5XSA9PT0gMCxcbiAgICAgICAgKVxuICAgICAgKSB7XG4gICAgICAgIG5vdGlmeShcbiAgICAgICAgICBcIktow7RuZyBjw7Mgdmnhu4djIGPhuqduIHjhu60gbMO9IHRyb25nIG3huqt1IMSRw6MgxJHhu41jLiBDaOG7jW4ga2hv4bqjbmcga2jDoWMgxJHhu4MgeGVtIHRow6ptLlwiLFxuICAgICAgICAgIFwiaW5mb1wiLFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBpZiAodmVyc2lvbiAhPT0gcmVxdWVzdFZlcnNpb24uY3VycmVudCkgcmV0dXJuO1xuICAgICAgY29uc3QgY29kZSA9IChlcnJvciBhcyB7IGNvZGU/OiBzdHJpbmcgfSB8IG51bGwpPy5jb2RlO1xuICAgICAgaWYgKFxuICAgICAgICBjb2RlID09PSBcImZ1bmN0aW9ucy9wZXJtaXNzaW9uLWRlbmllZFwiIHx8XG4gICAgICAgIGNvZGUgPT09IFwiZnVuY3Rpb25zL3VuYXV0aGVudGljYXRlZFwiXG4gICAgICApIHtcbiAgICAgICAgc2V0U25hcHNob3QobnVsbCk7XG4gICAgICAgIHNldEZhaWx1cmUoXCJwZXJtaXNzaW9uXCIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0RmFpbHVyZShcImNvbm5lY3Rpb25cIik7XG4gICAgICB9XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGlmICh2ZXJzaW9uID09PSByZXF1ZXN0VmVyc2lvbi5jdXJyZW50KSBzZXRCdXN5KGZhbHNlKTtcbiAgICB9XG4gIH0sIFtdKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIHZvaWQgbG9hZChwZXJpb2QpO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICByZXF1ZXN0VmVyc2lvbi5jdXJyZW50Kys7XG4gICAgfTtcbiAgfSwgW3BlcmlvZCwgbG9hZF0pO1xuXG4gIGZ1bmN0aW9uIGNob29zZURheXMoZGF5czogbnVtYmVyKSB7XG4gICAgY29uc3QgbmV4dCA9IHBlcmlvZEZvckRheXMoZGF5cyk7XG4gICAgc2V0UHJlc2V0KGRheXMpO1xuICAgIHNldEN1c3RvbShmYWxzZSk7XG4gICAgc2V0VmFsaWRhdGlvbihcIlwiKTtcbiAgICBzZXREcmFmdChuZXh0KTtcbiAgICBzZXRQZXJpb2QobmV4dCk7XG4gIH1cbiAgZnVuY3Rpb24gYXBwbHlDdXN0b20oZXZlbnQ6IEZvcm1FdmVudDxIVE1MRm9ybUVsZW1lbnQ+KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB0cnkge1xuICAgICAgcmVzb2x2ZVBlcmlvZChkcmFmdCk7XG4gICAgICBzZXRWYWxpZGF0aW9uKFwiXCIpO1xuICAgICAgc2V0UHJlc2V0KG51bGwpO1xuICAgICAgc2V0UGVyaW9kKHsgLi4uZHJhZnQgfSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNldFZhbGlkYXRpb24oKGVycm9yIGFzIEVycm9yKS5tZXNzYWdlKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBzdGFsZSA9ICEhc25hcHNob3QgJiYgKGJ1c3kgfHwgISFmYWlsdXJlKTtcbiAgY29uc3QgY3VycmVudEtleXMgPSBPYmplY3Qua2V5cyhkYXNoYm9hcmRNZXRyaWNzKSBhcyBNZXRyaWNLZXlbXTtcbiAgY29uc3QgbWlzc2luZyA9IHNuYXBzaG90XG4gICAgPyBjdXJyZW50S2V5cy5maWx0ZXIoKGtleSkgPT4gc25hcHNob3QuY291bnRzW2tleV0gPT09IG51bGwpXG4gICAgOiBbXTtcbiAgY29uc3QgY2hhcnRNYXggPSBNYXRoLm1heChcbiAgICAxLFxuICAgIC4uLnByaW1hcnkubWFwKCh7IGtleSB9KSA9PiBzbmFwc2hvdD8uY291bnRzW2tleV0gPz8gMCksXG4gICk7XG4gIGNvbnN0IGNvdW50ID0gKGtleTogTWV0cmljS2V5KSA9PiBmb3JtYXRDb3VudChzbmFwc2hvdD8uY291bnRzW2tleV0gPz8gbnVsbCk7XG4gIGNvbnN0IHBhcnRpYWwgPVxuICAgICEhc25hcHNob3QgJiYgKHNuYXBzaG90LnRydW5jYXRlZC5sZW5ndGggPiAwIHx8IG1pc3NpbmcubGVuZ3RoID4gMCk7XG5cbiAgcmV0dXJuIChcbiAgICA8c2VjdGlvblxuICAgICAgY2xhc3NOYW1lPVwiY3JtRGFzaGJvYXJkIGRhc2hib2FyZDA5NFwiXG4gICAgICBhcmlhLWxhYmVsPVwiVOG7lW5nIHF1YW4gduG6rW4gaMOgbmhcIlxuICAgID5cbiAgICAgIHshZXh0ZXJuYWxQZXJpb2QgJiYgKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImQ5NFRvb2xiYXJcIj5cbiAgICAgICAgICA8Q3JtSGVhZGluZ1xuICAgICAgICAgICAgdGl0bGU9XCJU4buVbmcgcXVhblwiXG4gICAgICAgICAgICByZWxvYWQ9e1xuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZDk0UmVmcmVzaFwiXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgZGlzYWJsZWQ9e2J1c3l9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gdm9pZCBsb2FkKHBlcmlvZCl9XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8Q3JtSWNvbiBuYW1lPVwicmVmcmVzaFwiIC8+XG4gICAgICAgICAgICAgICAge2J1c3kgPyBcIsSQYW5nIHThuqNpIHPhu5EgbGnhu4d14oCmXCIgOiBcIkzDoG0gbeG7m2lcIn1cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICB9XG4gICAgICAgICAgLz5cblxuICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgIGNsYXNzTmFtZT1cImQ5NFByZXNldHNcIlxuICAgICAgICAgICAgcm9sZT1cImdyb3VwXCJcbiAgICAgICAgICAgIGFyaWEtbGFiZWw9XCJLaG/huqNuZyB0aOG7nWkgZ2lhblwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAge1tcbiAgICAgICAgICAgICAgWzEsIFwiSMO0bSBuYXlcIl0sXG4gICAgICAgICAgICAgIFs3LCBcIjcgbmfDoHlcIl0sXG4gICAgICAgICAgICAgIFszMCwgXCIzMCBuZ8OgeVwiXSxcbiAgICAgICAgICAgIF0ubWFwKChbZGF5cywgbGFiZWxdKSA9PiAoXG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICBrZXk9e2RheXN9XG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgYXJpYS1wcmVzc2VkPXshY3VzdG9tICYmIHByZXNldCA9PT0gZGF5c31cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBjaG9vc2VEYXlzKE51bWJlcihkYXlzKSl9XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7bGFiZWx9XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICBhcmlhLXByZXNzZWQ9e2N1c3RvbX1cbiAgICAgICAgICAgICAgYXJpYS1leHBhbmRlZD17Y3VzdG9tfVxuICAgICAgICAgICAgICBhcmlhLWNvbnRyb2xzPVwiZDk0Q3VzdG9tUGVyaW9kXCJcbiAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgIHNldEN1c3RvbSghY3VzdG9tKTtcbiAgICAgICAgICAgICAgICBzZXREcmFmdChwZXJpb2QpO1xuICAgICAgICAgICAgICAgIHNldFZhbGlkYXRpb24oXCJcIik7XG4gICAgICAgICAgICAgIH19XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIFTDuXkgY2jhu41uXG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICB7Y3VzdG9tICYmIChcbiAgICAgICAgICAgIDxmb3JtXG4gICAgICAgICAgICAgIGlkPVwiZDk0Q3VzdG9tUGVyaW9kXCJcbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZDk0Q3VzdG9tXCJcbiAgICAgICAgICAgICAgb25TdWJtaXQ9e2FwcGx5Q3VzdG9tfVxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICA8bGFiZWw+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZm9ybUxhYmVsVGV4dFwiPlxuICAgICAgICAgICAgICAgICAgVOG7qyBuZ8OgeSAoVVRDKXtcIiBcIn1cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInJlcXVpcmVkTWFya1wiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPlxuICAgICAgICAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgdHlwZT1cImRhdGVcIlxuICAgICAgICAgICAgICAgICAgcmVxdWlyZWRcbiAgICAgICAgICAgICAgICAgIHZhbHVlPXtkcmFmdC5mcm9tfVxuICAgICAgICAgICAgICAgICAgYXJpYS1kZXNjcmliZWRieT1cImQ5NERhdGVIZWxwXCJcbiAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZXZlbnQpID0+XG4gICAgICAgICAgICAgICAgICAgIHNldERyYWZ0KHsgLi4uZHJhZnQsIGZyb206IGV2ZW50LnRhcmdldC52YWx1ZSB9KVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgIDwvbGFiZWw+XG4gICAgICAgICAgICAgIDxsYWJlbD5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmb3JtTGFiZWxUZXh0XCI+XG4gICAgICAgICAgICAgICAgICDEkOG6v24gbmfDoHkgKFVUQyl7XCIgXCJ9XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJyZXF1aXJlZE1hcmtcIiBhcmlhLWhpZGRlbj1cInRydWVcIj5cbiAgICAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJkYXRlXCJcbiAgICAgICAgICAgICAgICAgIHJlcXVpcmVkXG4gICAgICAgICAgICAgICAgICB2YWx1ZT17ZHJhZnQudW50aWx9XG4gICAgICAgICAgICAgICAgICBhcmlhLWRlc2NyaWJlZGJ5PVwiZDk0RGF0ZUhlbHBcIlxuICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhldmVudCkgPT5cbiAgICAgICAgICAgICAgICAgICAgc2V0RHJhZnQoeyAuLi5kcmFmdCwgdW50aWw6IGV2ZW50LnRhcmdldC52YWx1ZSB9KVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgIDwvbGFiZWw+XG4gICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cInN1Ym1pdFwiIGNsYXNzTmFtZT1cInByaW1hcnlcIj5cbiAgICAgICAgICAgICAgICDDgXAgZOG7pW5nXG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8cCBpZD1cImQ5NERhdGVIZWxwXCI+XG4gICAgICAgICAgICAgICAgQ2jhu41uIHThu5FpIMSRYSAzMSBuZ8OgeSwga2jDtG5nIHbGsOG7o3QgaMO0bSBuYXkgdGhlbyBVVEMuXG4gICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAge3ZhbGlkYXRpb24gJiYgKFxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cImQ5NFZhbGlkYXRpb25cIiByb2xlPVwiYWxlcnRcIj5cbiAgICAgICAgICAgICAgICAgIHt2YWxpZGF0aW9ufVxuICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDwvZm9ybT5cbiAgICAgICAgICApfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImQ5NENvbnRleHRcIj5cbiAgICAgICAgPHNwYW4+XG4gICAgICAgICAge3BlcmlvZExhYmVsKHNuYXBzaG90ID8gc25hcHNob3QucGVyaW9kIDogcGVyaW9kKX17XCIgXCJ9XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZDk0VGltZXpvbmVcIj5VVEM8L3NwYW4+XG4gICAgICAgIDwvc3Bhbj5cbiAgICAgICAgPHNwYW5cbiAgICAgICAgICBjbGFzc05hbWU9e2BkOTRTdGF0dXMke3N0YWxlID8gXCIgZDk0U3RhdHVzLS1zdGFsZVwiIDogXCJcIn1gfVxuICAgICAgICAgIHJvbGU9XCJzdGF0dXNcIlxuICAgICAgICA+XG4gICAgICAgICAge2J1c3kgPyAoXG4gICAgICAgICAgICBzbmFwc2hvdCA/IChcbiAgICAgICAgICAgICAgYMSQYW5nIHThuqNpICR7cGVyaW9kTGFiZWwocGVyaW9kKX0gwrcgxJFhbmcgaGnhu4NuIHRo4buLIGzhuqduIMSR4buNYyB0csaw4bubY2BcbiAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgIFwixJBhbmcgdOG6o2kgc+G7kSBsaeG7h3VcIlxuICAgICAgICAgICAgKVxuICAgICAgICAgICkgOiBmYWlsdXJlID8gKFxuICAgICAgICAgICAgc25hcHNob3QgPyAoXG4gICAgICAgICAgICAgIGBDaMawYSB04bqjaSDEkcaw4bujYyAke3BlcmlvZExhYmVsKHBlcmlvZCl9IMK3IHPhu5EgbGnhu4d1IGzhuqduIMSR4buNYyB0csaw4bubY2BcbiAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgIFwiQ2jGsGEgY8OzIHPhu5EgbGnhu4d1XCJcbiAgICAgICAgICAgIClcbiAgICAgICAgICApIDogc25hcHNob3QgPyAoXG4gICAgICAgICAgICA8PlxuICAgICAgICAgICAgICDEkOG7jWMgbMO6Y3tcIiBcIn1cbiAgICAgICAgICAgICAgPHRpbWUgZGF0ZVRpbWU9e25ldyBEYXRlKHNuYXBzaG90Lm9ic2VydmVkQXQpLnRvSVNPU3RyaW5nKCl9PlxuICAgICAgICAgICAgICAgIHtuZXcgRGF0ZShzbmFwc2hvdC5vYnNlcnZlZEF0KS50b0xvY2FsZVRpbWVTdHJpbmcoXCJ2aS1WTlwiLCB7XG4gICAgICAgICAgICAgICAgICBob3VyOiBcIjItZGlnaXRcIixcbiAgICAgICAgICAgICAgICAgIG1pbnV0ZTogXCIyLWRpZ2l0XCIsXG4gICAgICAgICAgICAgICAgICB0aW1lWm9uZTogXCJVVENcIixcbiAgICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgICAgPC90aW1lPntcIiBcIn1cbiAgICAgICAgICAgICAgVVRDIMK3IGPhuq1wIG5o4bqtdCBraGkgbMOgbSBt4bubaVxuICAgICAgICAgICAgPC8+XG4gICAgICAgICAgKSA6IChcbiAgICAgICAgICAgIFwiQ2jGsGEgY8OzIHPhu5EgbGnhu4d1XCJcbiAgICAgICAgICApfVxuICAgICAgICA8L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICAgIHtmYWlsdXJlICYmIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkOTROb3RpY2UgZDk0Tm90aWNlLS1lcnJvclwiIHJvbGU9XCJhbGVydFwiPlxuICAgICAgICAgIDxDcm1JY29uIG5hbWU9XCJ3YXJuaW5nXCIgLz5cbiAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgPHN0cm9uZz5cbiAgICAgICAgICAgICAge2ZhaWx1cmUgPT09IFwicGVybWlzc2lvblwiXG4gICAgICAgICAgICAgICAgPyBcIkNoxrBhIGPDsyBxdXnhu4FuIHhlbSB04buVbmcgcXVhbiB24bqtbiBow6BuaFwiXG4gICAgICAgICAgICAgICAgOiBmYWlsdXJlID09PSBcInJlc3BvbnNlXCJcbiAgICAgICAgICAgICAgICAgID8gXCJT4buRIGxp4buHdSB0cuG6oyB24buBIGNoxrBhIGjhu6NwIGzhu4dcIlxuICAgICAgICAgICAgICAgICAgOiBcIkNoxrBhIHThuqNpIMSRxrDhu6NjIHPhu5EgbGnhu4d1XCJ9XG4gICAgICAgICAgICA8L3N0cm9uZz5cbiAgICAgICAgICAgIDxwPlxuICAgICAgICAgICAgICB7ZmFpbHVyZSA9PT0gXCJwZXJtaXNzaW9uXCJcbiAgICAgICAgICAgICAgICA/IFwiQ+G6p24gdMOgaSBraG/huqNuIGNo4bunIHPhu58gaOG7r3UgaG/hurdjIHF14bqjbiBsw70gduG6rW4gaMOgbmguIEtp4buDbSB0cmEgdMOgaSBraG/huqNuIMSRYW5nIMSRxINuZyBuaOG6rXAuXCJcbiAgICAgICAgICAgICAgICA6IFwiS2nhu4NtIHRyYSBr4bq/dCBu4buRaSB2w6AgdGjhu60gbOG6oWkuIEtob+G6o25nIG5nw6B5IGLhuqFuIGNo4buNbiB24bqrbiDEkcaw4bujYyBnaeG7ry5cIn1cbiAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGRpc2FibGVkPXtidXN5fVxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gdm9pZCBsb2FkKHBlcmlvZCl9XG4gICAgICAgICAgPlxuICAgICAgICAgICAgVGjhu60gbOG6oWlcbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuICAgICAge3BhcnRpYWwgJiYgKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImQ5NE5vdGljZVwiIHJvbGU9XCJzdGF0dXNcIj5cbiAgICAgICAgICA8Q3JtSWNvbiBuYW1lPVwid2FybmluZ1wiIC8+XG4gICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgIDxzdHJvbmc+U+G7kSBsaeG7h3UgY2jGsGEgxJHhuqd5IMSR4bunPC9zdHJvbmc+XG4gICAgICAgICAgICA8cD5cbiAgICAgICAgICAgICAge3NuYXBzaG90LnRydW5jYXRlZC5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgPyBcIkPDsyBuZ3Xhu5NuIMSR4bqhdCBnaeG7m2kgaOG6oW4gMTAwIGLhuqNuIGdoaS4gVGh1IGjhurlwIGtob+G6o25nIG5nw6B5IMSR4buDIGtp4buDbSB0cmEgdGjDqm0uXCJcbiAgICAgICAgICAgICAgICA6IFwiTeG7mXQgc+G7kSBjaOG7iSBz4buRIGNoxrBhIGPDsyBk4buvIGxp4buHdSBo4bujcCBs4buHLiBDaMO6bmcgxJHGsOG7o2MgaGnhu4NuIHRo4buLIGLhurFuZyBk4bqldSDigJQuXCJ9XG4gICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICB7c25hcHNob3QudHJ1bmNhdGVkLmxlbmd0aCA+IDAgJiYgbWlzc2luZy5sZW5ndGggPiAwICYmIChcbiAgICAgICAgICAgICAgPHA+XG4gICAgICAgICAgICAgICAgTeG7mXQgc+G7kSBjaOG7iSBz4buRIGNoxrBhIGPDsyBk4buvIGxp4buHdSBo4bujcCBs4buHIHbDoCDEkcaw4bujYyBoaeG7g24gdGjhu4sgYuG6sW5nIGThuqV1XG4gICAgICAgICAgICAgICAg4oCULlxuICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG4gICAgICA8ZGl2XG4gICAgICAgIGNsYXNzTmFtZT17YGQ5NERhdGEkeyFzbmFwc2hvdCA/IFwiIGQ5NERhdGEtLXVuYXZhaWxhYmxlXCIgOiBcIlwifWB9XG4gICAgICAgIGFyaWEtYnVzeT17YnVzeX1cbiAgICAgID5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkOTRLcGlzXCI+XG4gICAgICAgICAge3ByaW1hcnkubWFwKCh7IGtleSwgaWNvbiwgbm90ZSB9KSA9PiAoXG4gICAgICAgICAgICA8TGlua1xuICAgICAgICAgICAgICBjbGFzc05hbWU9e2BkOTRLcGkgZDk0S3BpLS0ke2tleX1gfVxuICAgICAgICAgICAgICBrZXk9e2tleX1cbiAgICAgICAgICAgICAgdG89e2Rhc2hib2FyZE1ldHJpY3Nba2V5XS5kZXN0aW5hdGlvbn1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkOTRLcGlUb3BcIj5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJkOTRJY29uXCI+XG4gICAgICAgICAgICAgICAgICA8Q3JtSWNvbiBuYW1lPXtpY29ufSAvPlxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8Q3JtSWNvbiBuYW1lPVwiYXJyb3dcIiAvPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZDk0S3BpTGFiZWxcIj57ZGFzaGJvYXJkTWV0cmljc1trZXldLmxhYmVsfTwvc3Bhbj5cbiAgICAgICAgICAgICAgPHN0cm9uZyBjbGFzc05hbWU9XCJkOTRLcGlWYWx1ZVwiPlxuICAgICAgICAgICAgICAgIHtjb3VudChrZXkpfVxuICAgICAgICAgICAgICAgIDxzbWFsbD7Ekcahbjwvc21hbGw+XG4gICAgICAgICAgICAgIDwvc3Ryb25nPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJkOTRLcGlOb3RlXCI+e25vdGV9PC9zcGFuPlxuICAgICAgICAgICAgPC9MaW5rPlxuICAgICAgICAgICkpfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkOTRQYW5lbHNcIj5cbiAgICAgICAgICA8c2VjdGlvblxuICAgICAgICAgICAgY2xhc3NOYW1lPVwiZDk0UGFuZWwgZDk0Q2hhcnRcIlxuICAgICAgICAgICAgYXJpYS1sYWJlbGxlZGJ5PVwiZDk0Q2hhcnRUaXRsZVwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkOTRQYW5lbEhlYWRpbmdcIj5cbiAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8aDIgaWQ9XCJkOTRDaGFydFRpdGxlXCI+xJDGoW4gaMOgbmcgY+G6p24geOG7rSBsw708L2gyPlxuICAgICAgICAgICAgICAgIDxwPlPhu5EgxJHGoW4gdGhlbyB04burbmcgaMOgbmcgxJHhu6NpIGhp4buHbiB04bqhaTwvcD5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImQ5NFRhZ1wiPsSQxqFuIGjDoG5nPC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImQ5NENoYXJ0Um93c1wiPlxuICAgICAgICAgICAgICB7cHJpbWFyeS5tYXAoKHsga2V5IH0sIGluZGV4KSA9PiAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkOTRDaGFydFJvd1wiIGtleT17a2V5fT5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZDk0Q2hhcnRMYWJlbFwiPlxuICAgICAgICAgICAgICAgICAgICA8TGluayB0bz17ZGFzaGJvYXJkTWV0cmljc1trZXldLmRlc3RpbmF0aW9ufT5cbiAgICAgICAgICAgICAgICAgICAgICB7ZGFzaGJvYXJkTWV0cmljc1trZXldLmxhYmVsfVxuICAgICAgICAgICAgICAgICAgICA8L0xpbms+XG4gICAgICAgICAgICAgICAgICAgIDxzdHJvbmc+e2NvdW50KGtleSl9PC9zdHJvbmc+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZDk0VHJhY2tcIiBhcmlhLWhpZGRlbj1cInRydWVcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YGQ5NEJhciBkOTRCYXItLSR7aW5kZXh9YH1cbiAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IGAkeygoc25hcHNob3Q/LmNvdW50c1trZXldID8/IDApIC8gY2hhcnRNYXgpICogMTAwfSVgLFxuICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cImQ5NENoYXJ0Tm90ZVwiPlxuICAgICAgICAgICAgICBTbyBzw6FuaCBraOG7kWkgbMaw4bujbmcgdOG7q25nIGjDoG5nIMSR4bujaSwga2jDtG5nIHBo4bqjaSB04bu3IGzhu4cgY2h1eeG7g24gxJHhu5VpLlxuICAgICAgICAgICAgPC9wPlxuICAgICAgICAgIDwvc2VjdGlvbj5cbiAgICAgICAgICA8c2VjdGlvblxuICAgICAgICAgICAgY2xhc3NOYW1lPVwiZDk0UGFuZWwgZDk0QWN0aW9uc1wiXG4gICAgICAgICAgICBhcmlhLWxhYmVsbGVkYnk9XCJkOTRBY3Rpb25zVGl0bGVcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZDk0UGFuZWxIZWFkaW5nXCI+XG4gICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgPGgyIGlkPVwiZDk0QWN0aW9uc1RpdGxlXCI+Q+G6p24gdGhlbyBkw7VpPC9oMj5cbiAgICAgICAgICAgICAgICA8cD5UaGFuaCB0b8OhbiwgxJHGoW4gdOG6oW0gZ2nhu68gdsOgIGNoxINtIHPDs2Mga2jDoWNoPC9wPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPENybUljb24gbmFtZT1cImNsb2NrXCIgLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkOTRBY3Rpb25Sb3dzXCI+XG4gICAgICAgICAgICAgIHthY3Rpb25zLm1hcCgoeyBrZXksIGljb24sIG5vdGUgfSkgPT4gKFxuICAgICAgICAgICAgICAgIDxMaW5rXG4gICAgICAgICAgICAgICAgICBrZXk9e2tleX1cbiAgICAgICAgICAgICAgICAgIHRvPXtkYXNoYm9hcmRNZXRyaWNzW2tleV0uZGVzdGluYXRpb259XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJkOTRBY3Rpb25cIlxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YGQ5NEljb24ke2tleSA9PT0gXCJleGNlcHRpb25zXCIgPyBcIiBkOTRJY29uLS1hdHRlbnRpb25cIiA6IFwiXCJ9YH1cbiAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgPENybUljb24gbmFtZT17aWNvbn0gLz5cbiAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImQ5NEFjdGlvblRleHRcIj5cbiAgICAgICAgICAgICAgICAgICAgPHN0cm9uZz57ZGFzaGJvYXJkTWV0cmljc1trZXldLmxhYmVsfTwvc3Ryb25nPlxuICAgICAgICAgICAgICAgICAgICA8c21hbGw+e25vdGV9PC9zbWFsbD5cbiAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImQ5NEFjdGlvblZhbHVlXCI+e2NvdW50KGtleSl9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPENybUljb24gbmFtZT1cImFycm93XCIgLz5cbiAgICAgICAgICAgICAgICA8L0xpbms+XG4gICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9zZWN0aW9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRldGFpbHMgY2xhc3NOYW1lPVwiZDk0RGVmaW5pdGlvblwiPlxuICAgICAgICA8c3VtbWFyeT5QaOG6oW0gdmkgdsOgIGPDoWNoIMSR4buNYyBz4buRIGxp4buHdTwvc3VtbWFyeT5cbiAgICAgICAgPGRpdj5cbiAgICAgICAgICA8cD5cbiAgICAgICAgICAgIMSQw6J5IGzDoCB0cuG6oW5nIHRow6FpIGhp4buHbiB04bqhaSBj4bunYSBjw6FjIGLhuqNuIGdoaSDEkcaw4bujYyB04bqhbyB0cm9uZyBraG/huqNuZ1xuICAgICAgICAgICAgbmfDoHkgxJHDoyBjaOG7jW4gKFVUQyksIHThu5FpIMSRYSAxMDAgYuG6o24gZ2hpIG3hu5tpIG5o4bqldCBt4buXaSBuZ3Xhu5NuLiBLaMO0bmdcbiAgICAgICAgICAgIHBo4bqjaSB04buVbmcgdG/DoG4gaOG7hyB0aOG7kW5nLlxuICAgICAgICAgIDwvcD5cbiAgICAgICAgICA8cD5cbiAgICAgICAgICAgIE3hu5l0IMSRxqFuIGPDsyB0aOG7gyBu4bqxbSDhu58gbmhp4buBdSBow6BuZyDEkeG7o2ksIHbDrSBk4bulIHbhu6thIHThuqFtIGdp4buvIHbhu6thIGPDsm4gdGnhu4FuXG4gICAgICAgICAgICBj4bqnbiB0aGFuaCB0b8Ohbi4gS2jDtG5nIGPhu5luZyBjw6FjIHPhu5EgxJHhur9tIHRow6BuaCB04buVbmcgxJHGoW4gaMOgbmcuXG4gICAgICAgICAgPC9wPlxuICAgICAgICAgIDxwPlxuICAgICAgICAgICAgQ2jGsGEgY8OzIGThu68gbGnhu4d1IHThu5VuZyBo4bujcCBkb2FuaCB0aHUsIGzhu6NpIG5odeG6rW4sIHh1IGjGsOG7m25nIHRoZW8gbmfDoHlcbiAgICAgICAgICAgIGhv4bq3YyB0aOG7nWkgZ2lhbiBnaWFvIGThu7Ega2nhur9uIMSRw6MgeMOhYyBuaOG6rW4uIEtow7RuZyBzdXkgcmEgY8OhYyBjaOG7iSBz4buRIG7DoHlcbiAgICAgICAgICAgIHThu6sgc+G7kSDEkeG6v20gaMOgbmcgxJHhu6NpLlxuICAgICAgICAgIDwvcD5cbiAgICAgICAgICA8cD5cbiAgICAgICAgICAgIEPDoWMgbGnDqm4ga+G6v3QgbeG7nyBow6BuZyDEkeG7o2kgduG6rW4gaMOgbmggduG7m2kgYuG7mSBs4buNYyByacOqbmcgY+G7p2EgdHJhbmcgxJHDrWNoO1xuICAgICAgICAgICAga2hv4bqjbmcgbmfDoHkgdOG6oWkgxJHDonkga2jDtG5nIMSRxrDhu6NjIMOhcCBk4bulbmcgc2FuZyB0cmFuZyDEkcOtY2guIEThuqV1IOKAlCBuZ2jEqWFcbiAgICAgICAgICAgIGzDoCBjaMawYSBjw7Mgc+G7kSBsaeG7h3U7IDAgbmdoxKlhIGzDoCBraMO0bmcgY8OzIGLhuqNuIGdoaSBwaMO5IGjhu6NwIHRyb25nIG3huqt1IMSRw6NcbiAgICAgICAgICAgIMSR4buNYy5cbiAgICAgICAgICA8L3A+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kZXRhaWxzPlxuICAgICAgPHAgY2xhc3NOYW1lPVwiZDk0Rm9vdGVyXCI+XG4gICAgICAgIDxDcm1JY29uIG5hbWU9XCJkb2N1bWVudFwiIC8+XG4gICAgICAgIELhuqNuIGdoaSB04bqhbyB0cm9uZyBraG/huqNuZyDEkcOjIGNo4buNbiDCtyB04buRaSDEkWEgMTAwIGLhuqNuIGdoaSBt4buXaSBuZ3Xhu5NuIMK3IGPDoWNcbiAgICAgICAgdHJhbmcgxJHDrWNoIGPDsyBi4buZIGzhu41jIHJpw6puZ1xuICAgICAgPC9wPlxuICAgIDwvc2VjdGlvbj5cbiAgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIERhc2hib2FyZCgpIHtcbiAgcmV0dXJuIDxBbmFseXRpY3NPdmVydmlldyAvPjtcbn1cblxuZnVuY3Rpb24gQW5hbHl0aWNzT3ZlcnZpZXcoKSB7XG4gIGNvbnN0IFtwYXJhbXMsIHNldFBhcmFtc10gPSB1c2VTZWFyY2hQYXJhbXMoKTtcbiAgY29uc3QgdGFiID0gcGFyYW1zLmdldChcInRhYlwiKSA9PT0gXCJvcGVyYXRpb25zXCIgPyBcIm9wZXJhdGlvbnNcIiA6IFwiY3VzdG9tZXJzXCI7XG4gIGNvbnN0IGZyb20gPSBwYXJhbXMuZ2V0KFwiZnJvbVwiKSxcbiAgICB1bnRpbCA9IHBhcmFtcy5nZXQoXCJ1bnRpbFwiKTtcbiAgbGV0IHNlbGVjdGlvbiA9IHBlcmlvZEZvckRheXMoNyksXG4gICAgaW52YWxpZCA9IGZhbHNlO1xuICBpZiAoZnJvbSB8fCB1bnRpbCkge1xuICAgIHRyeSB7XG4gICAgICBpZiAoIWZyb20gfHwgIXVudGlsKSB0aHJvdyBFcnJvcigpO1xuICAgICAgcmVzb2x2ZVBlcmlvZCh7IGZyb20sIHVudGlsIH0pO1xuICAgICAgc2VsZWN0aW9uID0geyBmcm9tLCB1bnRpbCB9O1xuICAgIH0gY2F0Y2gge1xuICAgICAgaW52YWxpZCA9IHRydWU7XG4gICAgfVxuICB9XG4gIGNvbnN0IHBlcmlvZCA9IHNlbGVjdGlvbjtcbiAgY29uc3QgW2RyYWZ0LCBzZXREcmFmdF0gPSB1c2VTdGF0ZShwZXJpb2QpLFxuICAgIFtjdXN0b20sIHNldEN1c3RvbV0gPSB1c2VTdGF0ZShmYWxzZSksXG4gICAgW3ZhbGlkYXRpb24sIHNldFZhbGlkYXRpb25dID0gdXNlU3RhdGUoXCJcIik7XG4gIGNvbnN0IFtzbmFwc2hvdCwgc2V0U25hcHNob3RdID0gdXNlU3RhdGU8QW5hbHl0aWNzU25hcHNob3QgfCBudWxsPihudWxsKSxcbiAgICBbYnVzeSwgc2V0QnVzeV0gPSB1c2VTdGF0ZSh0cnVlKSxcbiAgICBbZmFpbHVyZSwgc2V0RmFpbHVyZV0gPSB1c2VTdGF0ZShcIlwiKTtcbiAgY29uc3QgW3JlbG9hZCwgc2V0UmVsb2FkXSA9IHVzZVN0YXRlKDApLFxuICAgIHJlcXVlc3QgPSB1c2VSZWYoMCk7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgc2V0RHJhZnQoeyBmcm9tOiBwZXJpb2QuZnJvbSwgdW50aWw6IHBlcmlvZC51bnRpbCB9KTtcbiAgfSwgW3BlcmlvZC5mcm9tLCBwZXJpb2QudW50aWxdKTtcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCB2ZXJzaW9uID0gKytyZXF1ZXN0LmN1cnJlbnQ7XG4gICAgbGV0IGxpdmUgPSB0cnVlO1xuICAgIHNldEJ1c3kodHJ1ZSk7XG4gICAgc2V0RmFpbHVyZShcIlwiKTtcbiAgICBjb25zdCByYW5nZSA9IHJlc29sdmVQZXJpb2QoeyBmcm9tOiBwZXJpb2QuZnJvbSwgdW50aWw6IHBlcmlvZC51bnRpbCB9KTtcbiAgICB2b2lkIGZldGNoRGFzaGJvYXJkQW5hbHl0aWNzKHJhbmdlKVxuICAgICAgLnRoZW4oKHJhdykgPT4ge1xuICAgICAgICBpZiAoIWxpdmUgfHwgdmVyc2lvbiAhPT0gcmVxdWVzdC5jdXJyZW50KSByZXR1cm47XG4gICAgICAgIGNvbnN0IG5leHQgPSBwYXJzZUFuYWx5dGljc1NuYXBzaG90KHJhdywgcmFuZ2UpO1xuICAgICAgICBpZiAoIW5leHQpIHtcbiAgICAgICAgICBzZXRGYWlsdXJlKFwiU+G7kSBsaeG7h3UgdHLhuqMgduG7gSBjaMawYSBo4bujcCBs4buHLiBUaOG7rSBsw6BtIG3hu5tpLlwiKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgc2V0U25hcHNob3QobmV4dCk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlKSA9PiB7XG4gICAgICAgIGlmICghbGl2ZSB8fCB2ZXJzaW9uICE9PSByZXF1ZXN0LmN1cnJlbnQpIHJldHVybjtcbiAgICAgICAgY29uc3QgY29kZSA9IChlIGFzIHsgY29kZT86IHN0cmluZyB9KS5jb2RlO1xuICAgICAgICBpZiAoXG4gICAgICAgICAgW1wiZnVuY3Rpb25zL3Blcm1pc3Npb24tZGVuaWVkXCIsIFwiZnVuY3Rpb25zL3VuYXV0aGVudGljYXRlZFwiXS5pbmNsdWRlcyhcbiAgICAgICAgICAgIGNvZGUgPz8gXCJcIixcbiAgICAgICAgICApXG4gICAgICAgICkge1xuICAgICAgICAgIHNldFNuYXBzaG90KG51bGwpO1xuICAgICAgICAgIHNldEZhaWx1cmUoXG4gICAgICAgICAgICBcIkLhuqFuIGNoxrBhIGPDsyBxdXnhu4FuIHhlbSB0aOG7kW5nIGvDqi4gS2nhu4NtIHRyYSB0w6BpIGtob+G6o24gxJFhbmcgxJHEg25nIG5o4bqtcC5cIixcbiAgICAgICAgICApO1xuICAgICAgICB9IGVsc2VcbiAgICAgICAgICBzZXRGYWlsdXJlKFwiQ2jGsGEgdOG6o2kgxJHGsOG7o2MgdGjhu5FuZyBrw6ouIEtp4buDbSB0cmEga+G6v3QgbuG7kWkgcuG7k2kgbMOgbSBt4bubaS5cIik7XG4gICAgICB9KVxuICAgICAgLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICBpZiAobGl2ZSAmJiB2ZXJzaW9uID09PSByZXF1ZXN0LmN1cnJlbnQpIHNldEJ1c3koZmFsc2UpO1xuICAgICAgfSk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGxpdmUgPSBmYWxzZTtcbiAgICAgIHJlcXVlc3QuY3VycmVudCsrO1xuICAgIH07XG4gIH0sIFtwZXJpb2QuZnJvbSwgcGVyaW9kLnVudGlsLCByZWxvYWRdKTtcbiAgdXNlRWZmZWN0KFxuICAgICgpID0+XG4gICAgICBhdXRoXG4gICAgICAgID8gb25BdXRoU3RhdGVDaGFuZ2VkKGF1dGgsICgpID0+IHtcbiAgICAgICAgICAgIHJlcXVlc3QuY3VycmVudCsrO1xuICAgICAgICAgICAgc2V0U25hcHNob3QobnVsbCk7XG4gICAgICAgICAgICBzZXRSZWxvYWQoKG4pID0+IG4gKyAxKTtcbiAgICAgICAgICB9KVxuICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICBbXSxcbiAgKTtcbiAgZnVuY3Rpb24gY2hvb3NlKG5leHQ6IERhc2hib2FyZFBlcmlvZCkge1xuICAgIHRyeSB7XG4gICAgICByZXNvbHZlUGVyaW9kKG5leHQpO1xuICAgICAgc2V0VmFsaWRhdGlvbihcIlwiKTtcbiAgICAgIGNvbnN0IHAgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKHBhcmFtcyk7XG4gICAgICBwLnNldChcImZyb21cIiwgbmV4dC5mcm9tKTtcbiAgICAgIHAuc2V0KFwidW50aWxcIiwgbmV4dC51bnRpbCk7XG4gICAgICBzZXRQYXJhbXMocCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgc2V0VmFsaWRhdGlvbigoZSBhcyBFcnJvcikubWVzc2FnZSk7XG4gICAgfVxuICB9XG4gIGNvbnN0IHJldGFpbmVkID0gc25hcHNob3QgJiYgKGJ1c3kgfHwgZmFpbHVyZSksXG4gICAgc2FtZVJhbmdlID1cbiAgICAgIHNuYXBzaG90Py5mcm9tID09PSByZXNvbHZlUGVyaW9kKHBlcmlvZCkuZnJvbSAmJlxuICAgICAgbmV3IERhdGUoc25hcHNob3Q/LnVudGlsID8/IDApLnRvSVNPU3RyaW5nKCkuc2xpY2UoMCwgMTApID09PVxuICAgICAgICBwZXJpb2QudW50aWw7XG4gIGNvbnN0IHVzYWJsZSA9IHNuYXBzaG90ICYmIHNhbWVSYW5nZSA/IHNuYXBzaG90IDogbnVsbDtcbiAgY29uc3QgY29sbGVjdGVkID0gISF1c2FibGU/LnN0YXJ0ZWRBdCAmJiB1c2FibGUudW50aWwgPj0gdXNhYmxlLnN0YXJ0ZWRBdDtcbiAgY29uc3QgYWdncmVnYXRlQXZhaWxhYmxlID0gY29sbGVjdGVkICYmICEhdXNhYmxlPy5hdmFpbGFiaWxpdHkudHJhZmZpYztcbiAgY29uc3QgZGF5cyA9XG4gICAgY29sbGVjdGVkICYmIHVzYWJsZT8uYXZhaWxhYmlsaXR5LnRyYWZmaWNcbiAgICAgID8gdXNhYmxlIS5kYXlzLmZpbHRlcihcbiAgICAgICAgICAocikgPT4gRGF0ZS5wYXJzZShyLmRheSArIFwiVDIzOjU5OjU5Ljk5OVpcIikgPj0gdXNhYmxlIS5zdGFydGVkQXQsXG4gICAgICAgIClcbiAgICAgIDogW107XG4gIGNvbnN0IHZhbHVlID0gKG46IG51bWJlciB8IG51bGwgfCB1bmRlZmluZWQpID0+IGZvcm1hdENvdW50KG4gPz8gbnVsbCk7XG4gIGNvbnN0IHJhdGUgPVxuICAgIHVzYWJsZT8uc2Vzc2lvbnMgJiYgdXNhYmxlLmNvbnZlcnRlZFNlc3Npb25zICE9PSBudWxsXG4gICAgICA/IGAke25ldyBJbnRsLk51bWJlckZvcm1hdChcInZpLVZOXCIsIHsgbWF4aW11bUZyYWN0aW9uRGlnaXRzOiAxIH0pLmZvcm1hdCgodXNhYmxlLmNvbnZlcnRlZFNlc3Npb25zIC8gdXNhYmxlLnNlc3Npb25zKSAqIDEwMCl9JWBcbiAgICAgIDogXCLigJRcIjtcbiAgY29uc3Qgc3VtID0gKGtleTogc3RyaW5nKSA9PlxuICAgIGRheXMucmVkdWNlKChhLCByKSA9PiBhICsgKHIuY291bnRzW2tleV0gPz8gMCksIDApO1xuICBjb25zdCBtb25leSA9IChuOiBudW1iZXIpID0+IGAke25ldyBJbnRsLk51bWJlckZvcm1hdChcInZpLVZOXCIpLmZvcm1hdChuKX0g4oKrYDtcbiAgY29uc3QgY2hhbmdlVGFiID0gKHZhbHVlOiBcImN1c3RvbWVyc1wiIHwgXCJvcGVyYXRpb25zXCIpID0+IHtcbiAgICBjb25zdCBwID0gbmV3IFVSTFNlYXJjaFBhcmFtcyhwYXJhbXMpO1xuICAgIHAuc2V0KFwidGFiXCIsIHZhbHVlKTtcbiAgICBzZXRQYXJhbXMocCk7XG4gIH07XG4gIHJldHVybiAoXG4gICAgPHNlY3Rpb25cbiAgICAgIGNsYXNzTmFtZT1cImNybURhc2hib2FyZCBkYXNoYm9hcmQwOTQgYW5hbHl0aWNzT3ZlcnZpZXdcIlxuICAgICAgYXJpYS1sYWJlbD1cIlThu5VuZyBxdWFuIFNhdHN1bmljR29cIlxuICAgID5cbiAgICAgIDxDcm1IZWFkaW5nXG4gICAgICAgIHRpdGxlPVwiVOG7lW5nIHF1YW5cIlxuICAgICAgICByZWxvYWQ9e1xuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIGNsYXNzTmFtZT1cImQ5NFJlZnJlc2hcIlxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBkaXNhYmxlZD17YnVzeX1cbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldFJlbG9hZCgobikgPT4gbiArIDEpfVxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxDcm1JY29uIG5hbWU9XCJyZWZyZXNoXCIgLz5cbiAgICAgICAgICAgIHtidXN5ID8gXCLEkGFuZyB04bqjaeKAplwiIDogXCJMw6BtIG3hu5tpXCJ9XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIH1cbiAgICAgIC8+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImFUb3BsaW5lXCI+XG4gICAgICAgIDxkaXY+XG4gICAgICAgICAgPHAgY2xhc3NOYW1lPVwiYUV5ZWJyb3dcIj5ISeG7hlUgUVXhuqIgV0VCU0lURSBWw4AgTVVBIEjDgE5HPC9wPlxuICAgICAgICAgIDxwPkhp4buDdSBuaHUgY+G6p3UgY+G7p2Ega2jDoWNoLCB0aGVvIGTDtWkgxJHGoW4gdsOgIHRp4buBbiDEkcOjIGdoaSBuaOG6rW4uPC9wPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdlxuICAgICAgICAgIGNsYXNzTmFtZT1cImQ5NFByZXNldHNcIlxuICAgICAgICAgIHJvbGU9XCJncm91cFwiXG4gICAgICAgICAgYXJpYS1sYWJlbD1cIktob+G6o25nIHRo4budaSBnaWFuIHRo4buRbmcga8OqXCJcbiAgICAgICAgPlxuICAgICAgICAgIHtbMSwgNywgMzBdLm1hcCgobikgPT4gKFxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAga2V5PXtufVxuICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgY2hvb3NlKHBlcmlvZEZvckRheXMobikpO1xuICAgICAgICAgICAgICAgIHNldEN1c3RvbShmYWxzZSk7XG4gICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgIGFyaWEtcHJlc3NlZD17IWN1c3RvbSAmJiBwZXJpb2QuZnJvbSA9PT0gcGVyaW9kRm9yRGF5cyhuKS5mcm9tfVxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICB7biA9PT0gMSA/IFwiSMO0bSBuYXlcIiA6IGAke259IG5nw6B5YH1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICkpfVxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgYXJpYS1leHBhbmRlZD17Y3VzdG9tfVxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0Q3VzdG9tKChuKSA9PiAhbil9XG4gICAgICAgICAgPlxuICAgICAgICAgICAgVMO5eSBjaOG7jW5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICAgIHtjdXN0b20gJiYgKFxuICAgICAgICA8Zm9ybVxuICAgICAgICAgIGNsYXNzTmFtZT1cImQ5NEN1c3RvbVwiXG4gICAgICAgICAgb25TdWJtaXQ9eyhlKSA9PiB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBjaG9vc2UoZHJhZnQpO1xuICAgICAgICAgIH19XG4gICAgICAgID5cbiAgICAgICAgICA8bGFiZWw+XG4gICAgICAgICAgICBU4burIG5nw6B5IChVVEMpXG4gICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgdHlwZT1cImRhdGVcIlxuICAgICAgICAgICAgICByZXF1aXJlZFxuICAgICAgICAgICAgICB2YWx1ZT17ZHJhZnQuZnJvbX1cbiAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXREcmFmdCh7IC4uLmRyYWZ0LCBmcm9tOiBlLnRhcmdldC52YWx1ZSB9KX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgICA8bGFiZWw+XG4gICAgICAgICAgICDEkOG6v24gbmfDoHkgKFVUQylcbiAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICB0eXBlPVwiZGF0ZVwiXG4gICAgICAgICAgICAgIHJlcXVpcmVkXG4gICAgICAgICAgICAgIHZhbHVlPXtkcmFmdC51bnRpbH1cbiAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXREcmFmdCh7IC4uLmRyYWZ0LCB1bnRpbDogZS50YXJnZXQudmFsdWUgfSl9XG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvbGFiZWw+XG4gICAgICAgICAgPGJ1dHRvbiB0eXBlPVwic3VibWl0XCI+w4FwIGThu6VuZzwvYnV0dG9uPlxuICAgICAgICAgIDxwPkNo4buNbiB04buRaSDEkWEgMzEgbmfDoHkgdGhlbyBVVEMuPC9wPlxuICAgICAgICA8L2Zvcm0+XG4gICAgICApfVxuICAgICAgeyh2YWxpZGF0aW9uIHx8IGludmFsaWQpICYmIChcbiAgICAgICAgPHAgY2xhc3NOYW1lPVwiYU5vdGljZVwiIHJvbGU9XCJhbGVydFwiPlxuICAgICAgICAgIHt2YWxpZGF0aW9uIHx8XG4gICAgICAgICAgICBcIktob+G6o25nIG5nw6B5IHRyb25nIMSRxrDhu51uZyBk4bqrbiBjaMawYSBo4bujcCBs4buHOyDEkWFuZyBkw7luZyA3IG5nw6B5IGfhuqduIG5o4bqldC5cIn1cbiAgICAgICAgPC9wPlxuICAgICAgKX1cbiAgICAgIDxQYWdlVGFic1xuICAgICAgICBpZD1cImFuYWx5dGljc1wiXG4gICAgICAgIGxhYmVsPVwiTuG7mWkgZHVuZyB04buVbmcgcXVhblwiXG4gICAgICAgIHZhbHVlPXt0YWJ9XG4gICAgICAgIG9uQ2hhbmdlPXtjaGFuZ2VUYWJ9XG4gICAgICAgIGl0ZW1zPXtbXG4gICAgICAgICAgeyB2YWx1ZTogXCJjdXN0b21lcnNcIiwgbGFiZWw6IFwiS2jDoWNoIGjDoG5nICYgbXVhIGjDoG5nXCIgfSxcbiAgICAgICAgICB7IHZhbHVlOiBcIm9wZXJhdGlvbnNcIiwgbGFiZWw6IFwiVuG6rW4gaMOgbmhcIiB9LFxuICAgICAgICBdfVxuICAgICAgLz5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYUNvdmVyYWdlXCIgcm9sZT1cInN0YXR1c1wiPlxuICAgICAgICA8c3Bhbj57cGVyaW9kTGFiZWwocGVyaW9kKX0gwrcgVVRDPC9zcGFuPlxuICAgICAgICA8c3Bhbj5cbiAgICAgICAgICB7cmV0YWluZWQgPyBcIsSQYW5nIGhp4buDbiB0aOG7iyBs4bqnbiDEkeG7jWMgdHLGsOG7m2MgwrcgXCIgOiBcIlwifVxuICAgICAgICAgIHtzbmFwc2hvdFxuICAgICAgICAgICAgPyBgVOG7lW5nIGjhu6NwIGzDumMgJHtuZXcgRGF0ZShzbmFwc2hvdC5hc09mKS50b0xvY2FsZVN0cmluZyhcInZpLVZOXCIsIHsgdGltZVpvbmU6IFwiVVRDXCIgfSl9IFVUQ2BcbiAgICAgICAgICAgIDogYnVzeVxuICAgICAgICAgICAgICA/IFwixJBhbmcgxJHhu41jIGThu68gbGnhu4d14oCmXCJcbiAgICAgICAgICAgICAgOiBcIkNoxrBhIGPDsyBz4buRIGxp4buHdVwifVxuICAgICAgICA8L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICAgIHtmYWlsdXJlICYmIChcbiAgICAgICAgPHAgY2xhc3NOYW1lPVwiYU5vdGljZSBhRXJyb3JcIiByb2xlPVwiYWxlcnRcIj5cbiAgICAgICAgICB7ZmFpbHVyZX1cbiAgICAgICAgPC9wPlxuICAgICAgKX1cbiAgICAgIHt1c2FibGUgJiYgIXVzYWJsZS5lbmFibGVkICYmIChcbiAgICAgICAgPHAgY2xhc3NOYW1lPVwiYU5vdGljZVwiPlxuICAgICAgICAgIFRodSB0aOG6rXAgxJFhbmcgdOG6r3QuIEtow7RuZyBjw7MgbOG7i2NoIHPhu60gdHJ1eSBj4bqtcCB0csaw4bubYyBraGkgdGh1IHRo4bqtcCDEkcaw4bujY1xuICAgICAgICAgIGLhuq10LlxuICAgICAgICA8L3A+XG4gICAgICApfVxuICAgICAgeyh1c2FibGU/LnN0YXJ0ZWRBdCA/PyAwKSA+IDAgJiYgKFxuICAgICAgICA8cCBjbGFzc05hbWU9XCJhRm9vdG5vdGVcIj5cbiAgICAgICAgICBC4bqvdCDEkeG6p3UgdGh1IHRo4bqtcDp7XCIgXCJ9XG4gICAgICAgICAge25ldyBEYXRlKHVzYWJsZSEuc3RhcnRlZEF0KS50b0xvY2FsZVN0cmluZyhcInZpLVZOXCIsIHtcbiAgICAgICAgICAgIHRpbWVab25lOiBcIlVUQ1wiLFxuICAgICAgICAgIH0pfXtcIiBcIn1cbiAgICAgICAgICBVVEMuIENo4buJIHTDrW5oIGPDoWMgbMaw4bujdCDEkcOjIGdoaSBuaOG6rW4gdsOgIGPDoWMgbmd14buTbiDEkcaw4bujYyB44butIGzDvSBzYXUga2hpXG4gICAgICAgICAgYuG6rXQuXG4gICAgICAgIDwvcD5cbiAgICAgICl9XG4gICAgICB7dXNhYmxlICYmICF1c2FibGUuY29tcGxldGUgJiYgKFxuICAgICAgICA8cCBjbGFzc05hbWU9XCJhTm90aWNlXCI+XG4gICAgICAgICAgU+G7kSBsaeG7h3UgY2jGsGEgYmFvIHBo4bunIHRvw6BuIGvhu7NcbiAgICAgICAgICB7dXNhYmxlLmJhY2tsb2dcbiAgICAgICAgICAgID8gYCDCtyAke3VzYWJsZS5iYWNrbG9nID49IDEwMSA/IFwiw610IG5o4bqldCAxMDFcIiA6IHVzYWJsZS5iYWNrbG9nfSB0w6FjIHbhu6UgxJFhbmcgY2jhu51gXG4gICAgICAgICAgICA6IFwiXCJ9XG4gICAgICAgICAge3VzYWJsZS5kZWFkTGV0dGVyc1xuICAgICAgICAgICAgPyBgIMK3ICR7dXNhYmxlLmRlYWRMZXR0ZXJzID49IDEwMSA/IFwiw610IG5o4bqldCAxMDFcIiA6IHVzYWJsZS5kZWFkTGV0dGVyc30gdMOhYyB24bulIGPhuqduIGtp4buDbSB0cmFgXG4gICAgICAgICAgICA6IFwiXCJ9XG4gICAgICAgICAgLiBDw6FjIGNo4buJIHPhu5Ega2jDtG5nIMSR4bunIGThu68gbGnhu4d1IGhp4buDbiB0aOG7iyDigJQuXG4gICAgICAgIDwvcD5cbiAgICAgICl9XG4gICAgICB7dGFiID09PSBcImN1c3RvbWVyc1wiID8gKFxuICAgICAgICA8ZGl2XG4gICAgICAgICAgcm9sZT1cInRhYnBhbmVsXCJcbiAgICAgICAgICBpZD1cImFuYWx5dGljcy1wYW5lbC1jdXN0b21lcnNcIlxuICAgICAgICAgIGFyaWEtbGFiZWxsZWRieT1cImFuYWx5dGljcy10YWItY3VzdG9tZXJzXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYUtwaXNcIj5cbiAgICAgICAgICAgIHtbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBsYWJlbDogXCJQaGnDqm4gdHJ1eSBj4bqtcFwiLFxuICAgICAgICAgICAgICAgIG51bWJlcjogdmFsdWUodXNhYmxlPy5zZXNzaW9ucyksXG4gICAgICAgICAgICAgICAgbm90ZTogXCJQaGnDqm4gxJHDoyBnaGkgbmjhuq1uLCBr4bq/dCB0aMO6YyBzYXUgMzAgcGjDunQga2jDtG5nIGhv4bqhdCDEkeG7mW5nXCIsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBsYWJlbDogXCJUcsOsbmggZHV54buHdCB0cnV5IGPhuq1wXCIsXG4gICAgICAgICAgICAgICAgbnVtYmVyOiB2YWx1ZSh1c2FibGU/LmJyb3dzZXJzKSxcbiAgICAgICAgICAgICAgICBub3RlOiBcIk3DoyB0csOsbmggZHV54buHdCBraMOhYyBuaGF1OyBraMO0bmcgcGjhuqNpIHPhu5EgbmfGsOG7nWkgY2jDrW5oIHjDoWNcIixcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGxhYmVsOiBcIktow6FjaCBjw7MgxJHGoW4gdGhhbmggdG/DoW5cIixcbiAgICAgICAgICAgICAgICBudW1iZXI6IHZhbHVlKHVzYWJsZT8uYnV5ZXJzKSxcbiAgICAgICAgICAgICAgICBub3RlOiBcIlTDoGkga2hv4bqjbiBjw7MgdGhhbmggdG/DoW4gxJHDoyB4w6FjIG1pbmggdHJvbmcga+G7sywgZ+G7k20gdGnhu4FuIGPhu41jXCIsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBsYWJlbDogXCJQaGnDqm4gY8OzIMSRxqFuIHRoYW5oIHRvw6FuXCIsXG4gICAgICAgICAgICAgICAgbnVtYmVyOiByYXRlLFxuICAgICAgICAgICAgICAgIG5vdGU6IGAke3ZhbHVlKHVzYWJsZT8uY29udmVydGVkU2Vzc2lvbnMpfSAvICR7dmFsdWUodXNhYmxlPy5zZXNzaW9ucyl9IHBoacOqbiB0aHXhu5ljIGPDuW5nIG5ow7NtIHRo4budaSBnaWFuYCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0ubWFwKChrLCBpKSA9PiAoXG4gICAgICAgICAgICAgIDxhcnRpY2xlIGNsYXNzTmFtZT17YGFLcGkgYUtwaSR7aX1gfSBrZXk9e2subGFiZWx9PlxuICAgICAgICAgICAgICAgIDxzcGFuPntrLmxhYmVsfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3Ryb25nPntrLm51bWJlcn08L3N0cm9uZz5cbiAgICAgICAgICAgICAgICA8c21hbGw+e2subm90ZX08L3NtYWxsPlxuICAgICAgICAgICAgICA8L2FydGljbGU+XG4gICAgICAgICAgICApKX1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFHcmlkXCI+XG4gICAgICAgICAgICA8VHJlbmRDaGFydFxuICAgICAgICAgICAgICB0aXRsZT1cIkzGsOG7o3QgdHJ1eSBj4bqtcCB0aGVvIG5nw6B5XCJcbiAgICAgICAgICAgICAgcm93cz17ZGF5c31cbiAgICAgICAgICAgICAgc2VyaWVzPXtbXG4gICAgICAgICAgICAgICAgeyBrZXk6IFwidmlld3NcIiwgbGFiZWw6IFwiTMaw4bujdCB4ZW0gdHJhbmdcIiB9LFxuICAgICAgICAgICAgICAgIHsga2V5OiBcInNlc3Npb25zXCIsIGxhYmVsOiBcIlBoacOqbiBt4bubaVwiLCBjb2xvcjogXCIjMTU5MDc5XCIgfSxcbiAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJhQ2hhcnRcIj5cbiAgICAgICAgICAgICAgPGgyPlThu6sgdHJ1eSBj4bqtcCDEkeG6v24gbXVhIGjDoG5nPC9oMj5cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwiYVN1YlwiPlxuICAgICAgICAgICAgICAgIMSQ4buRaSBjaGnhur91IHbhu5tpIGzhuqduIHRoYW5oIHRvw6FuIMSR4bqndSB0acOqbiB0cm9uZyA3IG5nw6B5IHThu6sgbMO6YyBi4bqvdFxuICAgICAgICAgICAgICAgIMSR4bqndSBwaGnDqm4uXG4gICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgPG9sIGNsYXNzTmFtZT1cImFGdW5uZWxcIj5cbiAgICAgICAgICAgICAgICA8bGk+XG4gICAgICAgICAgICAgICAgICA8c3Bhbj5QaGnDqm4gxJHDoyBnaGkgbmjhuq1uPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPHN0cm9uZz57dmFsdWUodXNhYmxlPy5zZXNzaW9ucyl9PC9zdHJvbmc+XG4gICAgICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgICAgICA8bGk+XG4gICAgICAgICAgICAgICAgICA8c3Bhbj5QaGnDqm4geGVtIHPhuqNuIHBo4bqpbTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDxzdHJvbmc+e3ZhbHVlKHVzYWJsZT8ucHJvZHVjdFNlc3Npb25zKX08L3N0cm9uZz5cbiAgICAgICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgICAgIDxsaT5cbiAgICAgICAgICAgICAgICAgIDxzcGFuPlRyb25nIMSRw7MgY8OzIMSRxqFuIHRoYW5oIHRvw6FuPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPHN0cm9uZz57dmFsdWUodXNhYmxlPy5jb252ZXJ0ZWRQcm9kdWN0U2Vzc2lvbnMpfTwvc3Ryb25nPlxuICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgIDwvb2w+XG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cImFGb290bm90ZVwiPlxuICAgICAgICAgICAgICAgIE11YSBo4buZIGtow7RuZyBxdWEgdHJhbmcgc+G6o24gcGjhuqltIHbhuqtuIMSRxrDhu6NjIHTDrW5oIHRyb25nIHThu7cgbOG7hyBwaGnDqm5cbiAgICAgICAgICAgICAgICBjw7MgxJHGoW4gdGhhbmggdG/DoW4g4bufIHRyw6puLlxuICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICAgIHt1c2FibGU/LnByb3Zpc2lvbmFsICYmIChcbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJhTm90aWNlXCI+XG4gICAgICAgICAgICAgICAgICBU4bqhbSB0aOG7nWk6IGPDoWMgcGhpw6puIGfhuqduIMSRw6J5IGNoxrBhIMSR4bunIDcgbmfDoHkgdGhlbyBkw7VpLlxuICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwiYUZvb3Rub3RlXCI+XG4gICAgICAgICAgICAgICAgxJDGoW4gY8OzIGxpw6puIGvhur90IHBoacOqbiAvIMSRxqFuIGPDsyB0aGFuaCB0b8OhbiB0cm9uZyBr4buzOntcIiBcIn1cbiAgICAgICAgICAgICAgICB7dmFsdWUodXNhYmxlPy5saW5rZWRQYWlkT3JkZXJzKX0gLyB7dmFsdWUodXNhYmxlPy5wYWlkT3JkZXJzKX0uXG4gICAgICAgICAgICAgICAgVMOgaSBraG/huqNuIHRydXkgY+G6rXA6IHt2YWx1ZSh1c2FibGU/LmFjY291bnRzKX0uXG4gICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgIDwvc2VjdGlvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFHcmlkXCI+XG4gICAgICAgICAgICA8UHJvZHVjdFJhbmtpbmdcbiAgICAgICAgICAgICAgYXZhaWxhYmxlPXshIXVzYWJsZT8uYXZhaWxhYmlsaXR5LnByb2R1Y3RzfVxuICAgICAgICAgICAgICByb3dzPXtjb2xsZWN0ZWQgPyB1c2FibGUhLnByb2R1Y3RzIDogW119XG4gICAgICAgICAgICAvPlxuICAgICAgICAgICAgPFRvcGljUmFua2luZ1xuICAgICAgICAgICAgICBhdmFpbGFibGU9eyEhdXNhYmxlPy5hdmFpbGFiaWxpdHkudG9waWNzfVxuICAgICAgICAgICAgICByb3dzPXtjb2xsZWN0ZWQgPyB1c2FibGUhLnRvcGljcyA6IFtdfVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICB7dXNhYmxlPy5maW5hbmNlICYmIChcbiAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgIDxUcmVuZENoYXJ0XG4gICAgICAgICAgICAgICAgdGl0bGU9XCJUaeG7gW4gxJHDoyBnaGkgbmjhuq1uXCJcbiAgICAgICAgICAgICAgICByb3dzPXtkYXlzfVxuICAgICAgICAgICAgICAgIHVuaXQ9XCJWTkRcIlxuICAgICAgICAgICAgICAgIHNlcmllcz17W1xuICAgICAgICAgICAgICAgICAgeyBrZXk6IFwicGF5bWVudHNcIiwgbGFiZWw6IFwiVGh1IMSRw6MgZ2hpIG5o4bqtblwiIH0sXG4gICAgICAgICAgICAgICAgICB7IGtleTogXCJyZWZ1bmRzXCIsIGxhYmVsOiBcIkhvw6BuIHRp4buBblwiLCBjb2xvcjogXCIjZDM3ODIwXCIgfSxcbiAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAga2V5OiBcInJldmVyc2Fsc1wiLFxuICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCLEkOG6o28gZ2lhbyBk4buLY2hcIixcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6IFwiI2Q4NTI3MFwiLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBdfVxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJhRm9vdG5vdGVcIj5cbiAgICAgICAgICAgICAgICBUaHUge2FnZ3JlZ2F0ZUF2YWlsYWJsZSA/IG1vbmV5KHN1bShcInBheW1lbnRzXCIpKSA6IFwi4oCUXCJ9IMK3IEhvw6Bue1wiIFwifVxuICAgICAgICAgICAgICAgIHthZ2dyZWdhdGVBdmFpbGFibGUgPyBtb25leShzdW0oXCJyZWZ1bmRzXCIpKSA6IFwi4oCUXCJ9IMK3IMSQ4bqjb3tcIiBcIn1cbiAgICAgICAgICAgICAgICB7YWdncmVnYXRlQXZhaWxhYmxlID8gbW9uZXkoc3VtKFwicmV2ZXJzYWxzXCIpKSA6IFwi4oCUXCJ9IMK3IFLDsm5ne1wiIFwifVxuICAgICAgICAgICAgICAgIHthZ2dyZWdhdGVBdmFpbGFibGVcbiAgICAgICAgICAgICAgICAgID8gbW9uZXkoc3VtKFwicGF5bWVudHNcIikgLSBzdW0oXCJyZWZ1bmRzXCIpIC0gc3VtKFwicmV2ZXJzYWxzXCIpKVxuICAgICAgICAgICAgICAgICAgOiBcIuKAlFwifVxuICAgICAgICAgICAgICAgIC4gxJDDonkgbMOgIGJp4bq/biDEkeG7mW5nIHRp4buBbiB0cm9uZyBr4buzLCBraMO0bmcgcGjhuqNpIGRvYW5oIHRodSBoYXkgbOG7o2lcbiAgICAgICAgICAgICAgICBuaHXhuq1uLlxuICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICA8Lz5cbiAgICAgICAgICApfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICkgOiAoXG4gICAgICAgIDxkaXZcbiAgICAgICAgICByb2xlPVwidGFicGFuZWxcIlxuICAgICAgICAgIGlkPVwiYW5hbHl0aWNzLXBhbmVsLW9wZXJhdGlvbnNcIlxuICAgICAgICAgIGFyaWEtbGFiZWxsZWRieT1cImFuYWx5dGljcy10YWItb3BlcmF0aW9uc1wiXG4gICAgICAgID5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFHcmlkXCI+XG4gICAgICAgICAgICA8TWFya2V0Q2hhcnQgcm93cz17ZGF5c30gLz5cbiAgICAgICAgICAgIDxTdGFnZUNoYXJ0XG4gICAgICAgICAgICAgIGF2YWlsYWJsZT17ISF1c2FibGU/LmF2YWlsYWJpbGl0eS5zdGFnZXN9XG4gICAgICAgICAgICAgIHN0YWdlcz17Y29sbGVjdGVkID8gdXNhYmxlIS5zdGFnZXMgOiB7fX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGgyIGNsYXNzTmFtZT1cImFRdWV1ZUhlYWRpbmdcIj5WaeG7h2MgY+G6p24geOG7rSBsw708L2gyPlxuICAgICAgICAgIDxwIGNsYXNzTmFtZT1cImFGb290bm90ZVwiPlxuICAgICAgICAgICAgQ8OhYyBow6BuZyDEkeG7o2kgY8OzIHRo4buDIHRyw7luZyDEkcahbiB2w6AgY2jhu4kgxJHhu41jIHThu5FpIMSRYSAxMDAgYuG6o24gZ2hpIG3hu5dpXG4gICAgICAgICAgICBuZ3Xhu5NuOyBraMO0bmcgcGjhuqNpIHThu5VuZyBz4buRIMSRxqFuLlxuICAgICAgICAgIDwvcD5cbiAgICAgICAgICA8T3BlcmF0aW9uYWxEYXNoYm9hcmQgZXh0ZXJuYWxQZXJpb2Q9e3BlcmlvZH0gLz5cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuICAgICAgPHAgY2xhc3NOYW1lPVwiYUZvb3Rub3RlXCI+XG4gICAgICAgIFF1eeG7gW4gdGjhu5FuZyBrw6osIGNo4bq3biB0aGVvIGTDtWksIG3huqV0IGvhur90IG7hu5FpIHbDoCB0aGnhur91IGxpw6puIGvhur90IMSRxqFuIGPDsyB0aOG7g1xuICAgICAgICBsw6BtIHPhu5EgbGnhu4d1IHRo4bqlcCBoxqFuIHRo4buxYyB04bq/LiBMxrDhu6N0IGNo4buNbiBraMO0bmcgxJHhu5NuZyBuZ2jEqWEgduG7m2kgbXVhIGjDoG5nLlxuICAgICAgPC9wPlxuICAgIDwvc2VjdGlvbj5cbiAgKTtcbn1cbiJdfQ==
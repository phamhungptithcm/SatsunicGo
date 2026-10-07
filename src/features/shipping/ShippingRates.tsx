import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, callService, configured, login } from "../../shared/firebase";
import {
  calculateShippingRate,
  shippingRateConfigSchema,
  vietCargoReferenceRates,
  type ShippingRateConfig,
  type ShippingRateRow,
  type ShippingRatesSnapshot,
  type ShippingRatesPublicSnapshot,
} from "../../../packages/domain/shipping-rates";
import { CrmHeading, CrmState } from "../crm/CrmPresentation";
import {
  filterRateRows,
  filterConditions,
  type PriceAvailability,
} from "./rate-detail-view";
import "./shipping-rates.css";
const serviceLabels = {
  standard: "Thông thường · 8–12 ngày",
  express: "Nhanh · 6–8 ngày",
  cargo: "Hàng theo kg",
};
const warehouseLabels = {
  vietnam: "Kho Việt Nam",
  texas_cali: "Texas / California",
  oregon: "Oregon",
};
const money = (n: number, currency: "VND" | "USD") =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency }).format(
    currency === "USD" ? n / 100 : n,
  );
type Attempt = {
  key: string;
  payload: {
    action: "save" | "publish" | "delete";
    operationId: string;
    expectedVersion: number;
    config?: ShippingRateConfig;
  };
};
export function ShippingRates({ staff = false }: { staff?: boolean }) {
  const [publicSnapshot, setPublicSnapshot] =
    useState<ShippingRatesPublicSnapshot | null>(null);
  const [snapshot, setSnapshot] = useState<ShippingRatesSnapshot | null>(null);
  const [draft, setDraft] = useState<ShippingRateConfig | null>(null);
  const [selected, setSelected] = useState("");
  const [direction, setDirection] = useState<"VN_US" | "US_VN">("VN_US");
  const [service, setService] = useState<"standard" | "express" | "cargo">(
    "standard",
  );
  const [warehouse, setWarehouse] = useState<
    "vietnam" | "texas_cali" | "oregon"
  >("vietnam");
  const inputId = useId();
  const [detailSearch, setDetailSearch] = useState("");
  const [availability, setAvailability] = useState<PriceAvailability>("all");
  const [conditionSearch, setConditionSearch] = useState("");
  const [weight, setWeight] = useState(staff ? "1" : "2"),
    [product, setProduct] = useState("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [confirmation, setConfirmation] = useState<"publish" | "delete" | null>(
    null,
  );
  const epoch = useRef(0),
    mounted = useRef(false),
    running = useRef(false),
    attempt = useRef<Attempt | null>(null);
  async function load() {
    if (running.current || attempt.current) return;
    const current = ++epoch.current,
      uid = auth?.currentUser?.uid;
    running.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    setSnapshot(null);
    setDraft(null);
    setPublicSnapshot(null);
    try {
      if (staff) {
        const result = await callService<ShippingRatesSnapshot>(
          "shippingRatesAdmin",
          { action: "read" },
        );
        if (
          !mounted.current ||
          current !== epoch.current ||
          uid !== auth?.currentUser?.uid
        )
          return;
        setSnapshot(result);
        const config =
          result.config ?? structuredClone(vietCargoReferenceRates);
        setDraft(config);
        setSelected(config.rows[0].id);
      } else {
        const result = await callService<ShippingRatesPublicSnapshot>(
          "shippingRatesPublic",
          {},
        );
        if (!mounted.current || current !== epoch.current) return;
        if (
          result.config &&
          !shippingRateConfigSchema.safeParse(result.config).success
        )
          throw new Error("Invalid shipping configuration");
        setPublicSnapshot(result);
      }
    } catch (e) {
      if (mounted.current && current === epoch.current)
        setError(
          staff && e instanceof Error
            ? e.message
            : (e as { code?: string })?.code === "functions/failed-precondition"
              ? "Bảng giá cần được kiểm tra. Nhờ xác nhận cước."
              : "Chưa tải được bảng giá. Thử lại.",
        );
    } finally {
      if (current === epoch.current) {
        running.current = false;
        if (mounted.current) setBusy(false);
      }
    }
  }
  useEffect(() => {
    mounted.current = true;
    void load();
    const unsubscribe =
      staff && auth
        ? onAuthStateChanged(auth, () => {
            epoch.current++;
            running.current = false;
            attempt.current = null;
            setBusy(false);
            setSnapshot(null);
            setDraft(null);
            setConfirmation(null);
            setError("");
            setMessage("");
            void load();
          })
        : undefined;
    return () => {
      mounted.current = false;
      epoch.current++;
      // Invalidate the old request and release its lock for StrictMode setup.
      // Its finally block cannot clear a newer request because epochs differ.
      running.current = false;
      unsubscribe?.();
    };
    // Component route identity is fixed; asynchronous completions are fenced by epoch and UID.
  }, [staff]);
  async function mutate(action: "save" | "publish" | "delete") {
    if (running.current || !snapshot || !draft) return;
    if (
      action === "save" &&
      !shippingRateConfigSchema.safeParse(draft).success
    ) {
      setError(
        "Kiểm tra đơn vị, khoảng khối lượng và các dòng giá trước khi lưu.",
      );
      return;
    }
    const key = JSON.stringify({
      action,
      expectedVersion: snapshot.version,
      ...(action === "save" ? { config: draft } : {}),
    });
    if (attempt.current && attempt.current.key !== key) {
      setError("Thử lại thao tác chưa có kết quả trước khi sửa nội dung khác.");
      return;
    }
    attempt.current ??= {
      key,
      payload: {
        action,
        operationId: crypto.randomUUID(),
        expectedVersion: snapshot.version,
        ...(action === "save" ? { config: draft } : {}),
      },
    };
    const current = epoch.current,
      uid = auth?.currentUser?.uid;
    running.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await callService<ShippingRatesSnapshot>(
        "shippingRatesAdmin",
        attempt.current.payload,
      );
      if (
        !mounted.current ||
        current !== epoch.current ||
        uid !== auth?.currentUser?.uid
      )
        return;
      attempt.current = null;
      setSnapshot(result);
      setDraft(result.config);
      setConfirmation(null);
      setMessage(
        action === "save"
          ? "Đã lưu bản nháp. Bảng giá công khai chưa thay đổi."
          : action === "publish"
            ? "Đã công bố bảng giá đã lưu."
            : "Đã xóa bản nháp và gỡ bảng giá công khai.",
      );
    } catch (e) {
      if (
        mounted.current &&
        current === epoch.current &&
        uid === auth?.currentUser?.uid
      ) {
        const code = (e as { code?: string }).code;
        if (
          code &&
          ![
            "functions/internal",
            "functions/unavailable",
            "functions/unknown",
            "functions/deadline-exceeded",
          ].includes(code)
        ) {
          attempt.current = null;
          if (
            [
              "functions/aborted",
              "functions/permission-denied",
              "functions/unauthenticated",
            ].includes(code)
          ) {
            setSnapshot(null);
            setDraft(null);
            setConfirmation(null);
          }
        }
        setError(
          e instanceof Error
            ? e.message
            : "Chưa nhận được kết quả. Thử lại cùng thao tác.",
        );
      }
    } finally {
      if (current === epoch.current) {
        running.current = false;
        if (mounted.current) setBusy(false);
      }
    }
  }
  const config = staff ? draft : publicSnapshot?.config;
  const rows =
    config?.rows.filter(
      (r) =>
        r.direction === direction &&
        r.warehouse === warehouse &&
        r.service === service,
    ) ?? [];
  const scaledGrams = Number(weight) * 1000;
  // Decimal kg values such as 1.001 must not fail because of binary float noise.
  const grams =
    Number.isFinite(scaledGrams) &&
    Math.abs(scaledGrams - Math.round(scaledGrams)) < 0.000001
      ? Math.round(scaledGrams)
      : Number.NaN;
  const quote =
    config && Number.isSafeInteger(grams) && grams > 0 && grams <= 1_000_000_000
      ? calculateShippingRate(config, {
          direction,
          warehouse,
          service,
          weightGrams: grams,
          ...(direction === "US_VN" ? { rowId: product } : {}),
        })
      : null;
  const selectedRow = draft?.rows.find((r) => r.id === selected);
  const uncertain = !!attempt.current;
  const dirty =
    snapshot && draft
      ? JSON.stringify(snapshot.config) !== JSON.stringify(draft)
      : false;
  function updateRow(patch: Partial<ShippingRateRow>) {
    if (!draft || uncertain) return;
    setDraft({
      ...draft,
      rows: draft.rows.map((r) => (r.id === selected ? { ...r, ...patch } : r)),
    });
    setConfirmation(null);
  }
  const detailRows = filterRateRows(rows, detailSearch, availability);
  const conditions = filterConditions(
    config?.conditions ?? [],
    conditionSearch,
  );
  const rowResults = useResultFade(
    JSON.stringify(detailRows.map((row) => row.id)),
  );
  const conditionResults = useResultFade(
    JSON.stringify(conditions.map((item) => item.index)),
  );
  if (!staff) {
    const commonClearance =
      rows.length && rows.every((row) => row.clearance === rows[0].clearance)
        ? rows[0].clearance
        : null;
    const validWeight =
      Number.isSafeInteger(grams) && grams > 0 && grams <= 1_000_000_000;
    const routeLabel =
      direction === "VN_US" ? "Việt Nam → Mỹ" : "Mỹ → Việt Nam";
    const estimate = quote?.status === "estimate" ? quote : null;
    const amountLabel = busy
      ? "Đang tải…"
      : !config
        ? "Chưa có cước"
        : !validWeight
          ? "Kiểm tra khối lượng"
          : estimate
            ? money(estimate.freightMinor, estimate.currency)
            : "Cần xác nhận cước";
    const explanation =
      busy || !config || estimate
        ? ""
        : !validWeight
          ? "Nhập từ 0,001 đến 1.000.000 kg."
          : direction === "US_VN" && !product
            ? "Chọn nhóm hàng để xem cước."
            : warehouse === "oregon"
              ? "Kho Oregon cần xác nhận phụ thu."
              : "Lựa chọn này cần báo giá riêng.";
    const supportContext = [
      routeLabel,
      warehouseLabels[warehouse],
      service === "standard"
        ? "Thông thường"
        : service === "express"
          ? "Nhanh"
          : "Hàng theo kg",
      validWeight ? `${weight} kg` : "Chưa xác nhận khối lượng",
      direction === "US_VN"
        ? rows.find((row) => row.id === product)?.label
        : null,
      estimate
        ? `Cước tham khảo: ${money(estimate.freightMinor, estimate.currency)}; chưa gồm thuế, thông quan, phụ thu và bảo hiểm.`
        : "Cần báo giá riêng.",
      config
        ? `${config.sourceLabel} · ${publicSnapshot?.origin === "reference" ? "Bảng tham khảo" : "Bảng đã công bố"}`
        : "Chưa có bảng giá.",
    ]
      .filter(Boolean)
      .join("\n");
    return (
      <section
        className="shippingRates shippingRates--public"
        aria-labelledby={`${inputId}-title`}
      >
        <h1 id={`${inputId}-title`}>Cước vận chuyển</h1>
        {error && (
          <div className="rateNotice" role="alert">
            <span>{error}</span>
            <button disabled={busy} onClick={() => void load()}>
              Tải lại
            </button>
          </div>
        )}
        {!busy && !error && !config && (
          <p className="rateNotice" role="status">
            Chưa có bảng giá. Nhờ xác nhận cước theo kiện hàng.
          </p>
        )}
        <div className="rateCalculator" aria-busy={busy}>
          <div className="rateInputs">
            <div
              className="rateDirections"
              data-direction={direction}
              aria-label="Chiều gửi"
            >
              {(["VN_US", "US_VN"] as const).map((next) => (
                <button
                  key={next}
                  type="button"
                  aria-pressed={direction === next}
                  onClick={() => {
                    if (direction === next) return;
                    setDirection(next);
                    setWarehouse(next === "VN_US" ? "vietnam" : "texas_cali");
                    setService(next === "VN_US" ? "standard" : "cargo");
                    setProduct("");
                  }}
                >
                  {next === "VN_US" ? "Việt Nam → Mỹ" : "Mỹ → Việt Nam"}
                </button>
              ))}
            </div>
            <div className="ratePublicFields">
              {direction === "VN_US" ? (
                <label>
                  Dịch vụ
                  <select
                    value={service}
                    onChange={(event) =>
                      setService(event.target.value as typeof service)
                    }
                  >
                    <option value="standard">Thông thường</option>
                    <option value="express">Nhanh</option>
                    <option value="cargo">Hàng theo kg</option>
                  </select>
                </label>
              ) : (
                <>
                  <label>
                    Kho gửi
                    <select
                      value={warehouse}
                      onChange={(event) => {
                        setWarehouse(event.target.value as typeof warehouse);
                        setProduct("");
                      }}
                    >
                      <option value="texas_cali">Texas / California</option>
                      <option value="oregon">Oregon</option>
                    </select>
                  </label>
                  <label>
                    Nhóm hàng
                    <select
                      value={product}
                      disabled={!config}
                      onChange={(event) => setProduct(event.target.value)}
                    >
                      <option value="">Chọn nhóm hàng</option>
                      {rows.map((row) => (
                        <option key={row.id} value={row.id}>
                          {row.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}
              <label htmlFor={inputId}>Khối lượng tính cước</label>
              <div className="rateWeight">
                <input
                  id={inputId}
                  type="number"
                  inputMode="decimal"
                  min="0.001"
                  max="1000000"
                  step="0.001"
                  value={weight}
                  aria-label="Khối lượng tính cước (kg)"
                  aria-describedby={`${inputId}-help`}
                  aria-invalid={!validWeight}
                  onChange={(event) => setWeight(event.target.value)}
                />
                <span aria-hidden="true">kg</span>
              </div>
            </div>
            <div className="ratePresets" aria-label="Chọn nhanh khối lượng">
              {[1, 2, 5, 10].map((kg) => (
                <button
                  type="button"
                  key={kg}
                  aria-pressed={Number(weight) === kg}
                  onClick={() => setWeight(String(kg))}
                >
                  {kg} kg
                </button>
              ))}
            </div>
            <details className="rateWeightHelp">
              <summary>Cách tính khối lượng</summary>
              <p id={`${inputId}-help`}>
                Khối lượng quy đổi = dài × rộng × cao / 5000 (cm). Nhân viên xác
                nhận khối lượng tính cước trước khi gửi.
              </p>
            </details>
          </div>
          <div className="rateResult">
            <span className="rateResultLabel">Cước tham khảo</span>
            <div role="status" aria-live="polite" aria-atomic="true">
              <div className="rateFeedback" key={amountLabel}>
                <p
                  className={`rateAmount${estimate ? "" : " rateAmount--message"}`}
                >
                  {amountLabel}
                </p>
                {explanation && (
                  <p className="rateExplanation">{explanation}</p>
                )}
              </div>
            </div>
            <div className="rateResultLine">
              <span>{routeLabel}</span>
              <strong>
                {estimate
                  ? `${(estimate.chargeableGrams / 1000).toLocaleString("vi-VN")} kg tính cước`
                  : validWeight
                    ? `${Number(weight).toLocaleString("vi-VN")} kg`
                    : "—"}
              </strong>
            </div>
            <p className="rateQualification">
              Chưa gồm thuế, thông quan, phụ thu và bảo hiểm.
              <br />
              Tổng phí được xác nhận trước khi gửi.
            </p>
            <ShippingRateSupport context={supportContext} />
          </div>
        </div>
        {config && (
          <>
            <details className="ratePublicDetails">
              <summary>Bảng giá chi tiết</summary>
              <div className="rateDetailMeta">
                <span className="rateDetailMetaSource">
                  {config.sourceLabel}
                </span>
                <span className="rateDetailMetaBadge rateDetailMetaStatus">
                  {publicSnapshot?.origin === "reference"
                    ? "Bảng tham khảo"
                    : "Bảng đã công bố"}
                </span>
                <span className="rateDetailMetaBadge">{routeLabel}</span>
                <span className="rateDetailMetaBadge">
                  {warehouseLabels[warehouse]}
                </span>
                <span className="rateDetailMetaBadge">
                  {service === "standard"
                    ? "Thông thường"
                    : service === "express"
                      ? "Nhanh"
                      : "Hàng theo kg"}
                </span>
              </div>
              <p className="rateDetailHint">
                Chiều gửi, kho và dịch vụ dùng chung với phần tính cước ở trên.
              </p>
              <div className="rateDetailToolbar">
                <label>
                  Chiều gửi
                  <select
                    value={direction}
                    onChange={(event) => {
                      const next = event.target.value as typeof direction;
                      setDirection(next);
                      setWarehouse(next === "VN_US" ? "vietnam" : "texas_cali");
                      setService(next === "VN_US" ? "standard" : "cargo");
                      setProduct("");
                    }}
                  >
                    <option value="VN_US">Việt Nam → Mỹ</option>
                    <option value="US_VN">Mỹ → Việt Nam</option>
                  </select>
                </label>
                <label>
                  {direction === "VN_US" ? "Dịch vụ" : "Kho gửi"}
                  {direction === "VN_US" ? (
                    <select
                      value={service}
                      onChange={(event) =>
                        setService(event.target.value as typeof service)
                      }
                    >
                      <option value="standard">Thông thường</option>
                      <option value="express">Nhanh</option>
                      <option value="cargo">Hàng theo kg</option>
                    </select>
                  ) : (
                    <select
                      value={warehouse}
                      onChange={(event) => {
                        setWarehouse(event.target.value as typeof warehouse);
                        setProduct("");
                      }}
                    >
                      <option value="texas_cali">Texas / California</option>
                      <option value="oregon">Oregon</option>
                    </select>
                  )}
                </label>
                <label className="rateDetailSearch">
                  Tìm trong bảng
                  <input
                    type="search"
                    value={detailSearch}
                    placeholder="Khối lượng, nhóm hàng, điều kiện…"
                    onChange={(event) => setDetailSearch(event.target.value)}
                  />
                </label>
                <label>
                  Hiển thị
                  <select
                    value={availability}
                    onChange={(event) =>
                      setAvailability(event.target.value as PriceAvailability)
                    }
                  >
                    <option value="all">Tất cả mức cước</option>
                    <option value="listed">Có giá niêm yết</option>
                    <option value="confirm">Cần xác nhận giá</option>
                  </select>
                </label>
              </div>
              <div className="rateDetailCount">
                <span role="status">
                  {detailRows.length} / {rows.length} dòng giá
                </span>
                {(detailSearch || availability !== "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setDetailSearch("");
                      setAvailability("all");
                    }}
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
              {commonClearance && (
                <p className="rateCommonCondition">
                  <strong>Thông quan / điều kiện</strong>
                  <span>{commonClearance}</span>
                </p>
              )}
              <div ref={rowResults} className="rateTableWrap rateDetailedTable">
                <table>
                  <caption className="rateDetailCaption">
                    {routeLabel} · {warehouseLabels[warehouse]} ·{" "}
                    {service === "standard"
                      ? "Thông thường"
                      : service === "express"
                        ? "Nhanh"
                        : "Hàng theo kg"}
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Khối lượng / nhóm hàng</th>
                      <th scope="col">Cước</th>
                      {commonClearance === null && (
                        <th scope="col">Thông quan / điều kiện</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {detailRows.map((row) => (
                      <tr
                        key={row.id}
                        className={
                          estimate?.rowId === row.id
                            ? "rateRow--selected"
                            : undefined
                        }
                        aria-current={
                          estimate?.rowId === row.id ? "true" : undefined
                        }
                      >
                        <th scope="row">{row.label}</th>
                        <td>
                          {row.pricing === "quote" || row.amountMinor === null
                            ? row.priceDisplay
                            : `${money(row.amountMinor, row.currency)} / ${row.pricing === "per_kg" ? "kg" : "mốc"}`}
                        </td>
                        {commonClearance === null && <td>{row.clearance}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!detailRows.length && (
                <p className="rateDetailEmpty">
                  {rows.length
                    ? "Không tìm thấy dòng giá. Thử từ khóa khác hoặc xóa bộ lọc."
                    : "Chưa có giá cho lựa chọn này."}
                </p>
              )}
            </details>
            <details className="ratePublicDetails">
              <summary>Điều kiện vận chuyển</summary>
              <label className="rateConditionSearch">
                Tìm điều kiện
                <input
                  type="search"
                  value={conditionSearch}
                  placeholder="Thuế, khối lượng, bảo hiểm…"
                  onChange={(event) => setConditionSearch(event.target.value)}
                />
              </label>
              <div className="rateDetailCount">
                <span role="status">
                  {conditions.length} / {config.conditions.length} điều kiện
                </span>
                {conditionSearch && (
                  <button type="button" onClick={() => setConditionSearch("")}>
                    Xóa tìm kiếm
                  </button>
                )}
              </div>
              <div ref={conditionResults} className="rateConditionGroups">
                {(["general", "VN_US", "US_VN"] as const).map((group) => {
                  const items = conditions.filter(
                    (item) => item.group === group,
                  );
                  return items.length ? (
                    <section key={group}>
                      <h3>
                        {group === "general"
                          ? "Điều kiện chung"
                          : group === "VN_US"
                            ? "Việt Nam → Mỹ"
                            : "Mỹ → Việt Nam"}
                      </h3>
                      <ul>
                        {items.map((item) => (
                          <li key={item.index}>{item.text}</li>
                        ))}
                      </ul>
                    </section>
                  ) : null;
                })}
              </div>
              {!conditions.length && (
                <p className="rateDetailEmpty">
                  {config.conditions.length
                    ? "Không tìm thấy điều kiện. Thử từ khóa khác hoặc xóa tìm kiếm."
                    : "Chưa có điều kiện vận chuyển trong bảng giá."}
                </p>
              )}
              <div className="rateSourceLinks">
                {[...new Set(config.sourceUrls)].map((url, index) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Nguồn VietCargo ·{" "}
                    {url.includes("vietnam-di-my") ||
                    url.includes("viet-nam-di-my")
                      ? "Việt Nam → Mỹ"
                      : url.includes("my-ve-viet-nam") ||
                          url.includes("my-di-viet-nam") ||
                          url.includes("bang-gia-ship-hang-tu-my")
                        ? "Mỹ → Việt Nam"
                        : `Nguồn ${index + 1}`}
                  </a>
                ))}
              </div>
            </details>
          </>
        )}
      </section>
    );
  }

  return (
    <section className="shippingRates">
      <CrmHeading
        title={staff ? "Cấu hình cước vận chuyển" : "Cước vận chuyển"}
        actions={
          <button disabled={busy || uncertain} onClick={() => void load()}>
            Tải lại bảng giá
          </button>
        }
      />
      <p>
        Cước vận chuyển theo biểu phí VietCargo, chiều vận chuyển và khối lượng.
        Nhân viên xác nhận tổng phí trước khi gửi; bảng giá không xác nhận ngày
        đến của đơn.
      </p>
      {busy && <CrmState kind="loading" title="Đang tải hoặc lưu bảng giá…" />}
      {error && (
        <div role="alert" className="error">
          {error}
          {uncertain && (
            <button
              disabled={busy}
              onClick={() => void mutate(attempt.current!.payload.action)}
            >
              Thử lại thao tác
            </button>
          )}
        </div>
      )}
      {message && <p role="status">{message}</p>}
      {!busy && !error && !config && (
        <CrmState kind="empty" title="Chưa có bảng giá công khai">
          Liên hệ để được báo giá theo kiện hàng.
        </CrmState>
      )}
      {config && (
        <>
          <p className="muted">
            {config.sourceLabel} ·{" "}
            {staff
              ? "Bản nháp; chỉ thay đổi công khai sau khi công bố"
              : publicSnapshot?.origin === "reference"
                ? "Biểu phí áp dụng theo nguồn VietCargo"
                : "Bảng giá đã công bố"}
          </p>
          <div className="rateFilters">
            <label>
              Chiều vận chuyển
              <select
                value={direction}
                onChange={(e) => {
                  const next = e.target.value as typeof direction;
                  setDirection(next);
                  setWarehouse(next === "VN_US" ? "vietnam" : "texas_cali");
                  setService(next === "VN_US" ? "standard" : "cargo");
                  setProduct("");
                }}
              >
                <option value="VN_US">Việt Nam → Mỹ</option>
                <option value="US_VN">Mỹ → Việt Nam</option>
              </select>
            </label>
            <label>
              Kho
              <select
                value={warehouse}
                onChange={(e) => {
                  setWarehouse(e.target.value as typeof warehouse);
                  setProduct("");
                }}
              >
                {(direction === "VN_US"
                  ? (["vietnam"] as const)
                  : (["texas_cali", "oregon"] as const)
                ).map((w) => (
                  <option key={w} value={w}>
                    {warehouseLabels[w]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Dịch vụ
              <select
                value={service}
                onChange={(e) => setService(e.target.value as typeof service)}
              >
                {(direction === "VN_US"
                  ? (["standard", "express", "cargo"] as const)
                  : (["cargo"] as const)
                ).map((s) => (
                  <option key={s} value={s}>
                    {serviceLabels[s]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Khối lượng tính cước (kg)
              <input
                type="number"
                min="0.001"
                max="1000000"
                step="0.001"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </label>
            {direction === "US_VN" && (
              <label>
                Nhóm hàng
                <select
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                >
                  <option value="">Chọn nhóm hàng</option>
                  {rows.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <p role="status">
            {quote?.status === "estimate"
              ? `Cước vận chuyển theo biểu phí VietCargo: ${money(quote.freightMinor, quote.currency)}. Chưa cộng thông quan, thuế, phụ thu hoặc bảo hiểm.`
              : "Cần xác nhận báo giá cho lựa chọn này; không nội suy hoặc làm tròn lên mốc giá khác."}
          </p>
          <div className="rateTableWrap">
            <table>
              <caption>
                {direction === "VN_US" ? "Việt Nam → Mỹ" : "Mỹ → Việt Nam"} ·{" "}
                {warehouseLabels[warehouse]} · {serviceLabels[service]}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Khối lượng / nhóm hàng</th>
                  <th scope="col">Cước vận chuyển</th>
                  <th scope="col">Thông quan / điều kiện</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <th scope="row">{r.label}</th>
                    <td>
                      {r.pricing === "quote" || r.amountMinor === null
                        ? r.priceDisplay
                        : `${money(r.amountMinor, r.currency)} / ${r.pricing === "per_kg" ? "kg" : "mốc"}`}
                    </td>
                    <td>{r.clearance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!rows.length && (
            <p>Không có dòng giá cho lựa chọn này. Liên hệ để được báo giá.</p>
          )}
          <details>
            <summary>Điều kiện và nguồn giá</summary>
            <ul>
              {config.conditions.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
            {config.sourceUrls.map((url) => (
              <p key={url}>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  Nguồn VietCargo ·{" "}
                  {url.includes("vietnam-di-my") ||
                  url.includes("viet-nam-di-my")
                    ? "Việt Nam → Mỹ"
                    : "Mỹ → Việt Nam"}
                </a>
              </p>
            ))}
          </details>
        </>
      )}
      {staff && snapshot && (
        <section className="rateEditor">
          <h2>Bản nháp bảng giá</h2>
          <p>
            Chỉ chủ doanh nghiệp được lưu và công bố. Lưu nháp không đổi bảng
            đang công khai.{" "}
            {snapshot.publishedVersion === null
              ? "Chưa có bản cấu hình đã công bố."
              : `Bản công khai: ${snapshot.publishedVersion}.`}
          </p>
          {!draft && (
            <button
              disabled={busy || uncertain}
              onClick={() => {
                setDraft(structuredClone(vietCargoReferenceRates));
                setSelected(vietCargoReferenceRates.rows[0].id);
              }}
            >
              Tạo bản nháp từ bảng nguồn
            </button>
          )}
          {draft && (
            <>
              <fieldset disabled={busy || uncertain}>
                <legend>Nguồn và điều kiện</legend>
                <label>
                  Nhãn nguồn
                  <input
                    value={draft.sourceLabel}
                    maxLength={160}
                    onChange={(e) =>
                      setDraft({ ...draft, sourceLabel: e.target.value })
                    }
                  />
                </label>
                <label>
                  Điều kiện (mỗi dòng một điều kiện)
                  <textarea
                    value={draft.conditions.join("\n")}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        conditions: e.target.value.split("\n"),
                      })
                    }
                  />
                </label>
              </fieldset>
              <fieldset disabled={busy || uncertain}>
                <legend>Dòng giá</legend>
                <label>
                  Chọn dòng
                  <select
                    value={selected}
                    onChange={(e) => setSelected(e.target.value)}
                  >
                    {draft.rows.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.id} · {r.label}
                      </option>
                    ))}
                  </select>
                </label>
                {selectedRow && (
                  <div className="rateFields">
                    <label>
                      Tên mốc / nhóm hàng
                      <input
                        maxLength={240}
                        value={selectedRow.label}
                        onChange={(e) => updateRow({ label: e.target.value })}
                      />
                    </label>
                    <label>
                      Chiều
                      <select
                        value={selectedRow.direction}
                        onChange={(e) =>
                          updateRow(
                            e.target.value === "VN_US"
                              ? {
                                  direction: "VN_US",
                                  warehouse: "vietnam",
                                  currency: "VND",
                                  service: "standard",
                                }
                              : {
                                  direction: "US_VN",
                                  warehouse: "texas_cali",
                                  currency: "USD",
                                  service: "cargo",
                                },
                          )
                        }
                      >
                        <option value="VN_US">Việt Nam → Mỹ</option>
                        <option value="US_VN">Mỹ → Việt Nam</option>
                      </select>
                    </label>
                    <label>
                      Kho
                      <select
                        value={selectedRow.warehouse}
                        onChange={(e) =>
                          updateRow({
                            warehouse: e.target
                              .value as ShippingRateRow["warehouse"],
                          })
                        }
                      >
                        {(selectedRow.direction === "VN_US"
                          ? (["vietnam"] as const)
                          : (["texas_cali", "oregon"] as const)
                        ).map((w) => (
                          <option key={w} value={w}>
                            {warehouseLabels[w]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Dịch vụ
                      <select
                        value={selectedRow.service}
                        onChange={(e) =>
                          updateRow({
                            service: e.target
                              .value as ShippingRateRow["service"],
                          })
                        }
                      >
                        {Object.entries(serviceLabels).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Kiểu tính
                      <select
                        value={selectedRow.pricing}
                        onChange={(e) => {
                          const pricing = e.target
                            .value as ShippingRateRow["pricing"];
                          updateRow({
                            pricing,
                            amountMinor:
                              pricing === "quote"
                                ? null
                                : (selectedRow.amountMinor ?? 0),
                          });
                        }}
                      >
                        <option value="total">Tổng cước đúng mốc</option>
                        <option value="per_kg">Cước mỗi kg</option>
                        <option value="quote">Cần xác nhận giá</option>
                      </select>
                    </label>
                    <label>
                      Giá ({selectedRow.currency === "USD" ? "cent USD" : "VND"}
                      )
                      <input
                        type="number"
                        min="0"
                        max="100000000000"
                        step="1"
                        disabled={selectedRow.pricing === "quote"}
                        value={selectedRow.amountMinor ?? ""}
                        onChange={(e) =>
                          updateRow({ amountMinor: Number(e.target.value) })
                        }
                      />
                    </label>
                    <label>
                      Giá hiển thị và đơn vị
                      <input
                        maxLength={80}
                        value={selectedRow.priceDisplay}
                        onChange={(e) =>
                          updateRow({ priceDisplay: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Khối lượng từ (gram)
                      <input
                        type="number"
                        min="1"
                        max="1000000000"
                        step="1"
                        value={selectedRow.minGrams}
                        onChange={(e) =>
                          updateRow({ minGrams: Number(e.target.value) })
                        }
                      />
                    </label>
                    <label>
                      Khối lượng đến (gram; để trống nếu không có trần)
                      <input
                        type="number"
                        min="1"
                        max="1000000000"
                        step="1"
                        value={selectedRow.maxGrams ?? ""}
                        onChange={(e) =>
                          updateRow({
                            maxGrams:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                          })
                        }
                      />
                    </label>
                    <label>
                      Thông quan / điều kiện
                      <input
                        maxLength={80}
                        value={selectedRow.clearance}
                        onChange={(e) =>
                          updateRow({ clearance: e.target.value })
                        }
                      />
                    </label>
                  </div>
                )}
                <div className="rateActions">
                  <button
                    disabled={draft.rows.length >= 160}
                    onClick={() => {
                      const row = {
                        ...vietCargoReferenceRates.rows[0],
                        id: `custom-${crypto.randomUUID()}`,
                        label: "Dòng giá mới",
                        pricing: "quote" as const,
                        amountMinor: null,
                        priceDisplay: "Liên hệ xác nhận",
                      };
                      setDraft({ ...draft, rows: [...draft.rows, row] });
                      setSelected(row.id);
                    }}
                  >
                    Thêm dòng giá
                  </button>
                  <button
                    disabled={draft.rows.length <= 1}
                    onClick={() => {
                      const rows = draft.rows.filter((r) => r.id !== selected);
                      setDraft({ ...draft, rows });
                      setSelected(rows[0].id);
                    }}
                  >
                    Xóa dòng khỏi bản nháp
                  </button>
                </div>
              </fieldset>
              <div className="rateActions">
                <button
                  disabled={busy || uncertain}
                  onClick={() => void mutate("save")}
                >
                  Lưu bản nháp
                </button>
                <button
                  disabled={busy || uncertain || dirty || !snapshot.config}
                  onClick={() => setConfirmation("publish")}
                >
                  Công bố bản đã lưu
                </button>
                <button
                  disabled={busy || uncertain}
                  onClick={() => setConfirmation("delete")}
                >
                  Xóa và gỡ bảng công khai
                </button>
              </div>
            </>
          )}
          {confirmation && (
            <div
              className="rateConfirm"
              role="group"
              aria-label="Xác nhận thay đổi bảng giá"
            >
              <p>
                {confirmation === "publish"
                  ? "Công bố bản đã lưu sẽ thay bảng giá khách hàng đang xem."
                  : "Xóa bản nháp và gỡ bảng giá công khai. Khách hàng sẽ cần liên hệ để được báo giá."}
              </p>
              <button
                disabled={busy || uncertain}
                onClick={() => void mutate(confirmation)}
              >
                Xác nhận {confirmation === "publish" ? "công bố" : "xóa và gỡ"}
              </button>
              <button
                disabled={busy || uncertain}
                onClick={() => setConfirmation(null)}
              >
                Giữ nguyên
              </button>
            </div>
          )}
        </section>
      )}
    </section>
  );
}

/** Animate only committed result identity changes; never delay authoritative text. */
function useResultFade(signature: string) {
  const ref = useRef<HTMLDivElement>(null);
  const previous = useRef<string | null>(null);
  useLayoutEffect(() => {
    const changed = previous.current !== null && previous.current !== signature;
    previous.current = signature;
    const element = ref.current;
    if (!changed || !element || typeof element.animate !== "function") return;
    const preference = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (preference?.matches) return;
    const animation = element.animate([{ opacity: 0.82 }, { opacity: 1 }], {
      duration: 140,
      easing: "ease-out",
    });
    const cancel = () => animation.cancel();
    const preferenceChanged = () => {
      if (preference?.matches) cancel();
    };
    preference?.addEventListener?.("change", preferenceChanged);
    return () => {
      cancel();
      preference?.removeEventListener?.("change", preferenceChanged);
    };
  }, [signature]);
  return ref;
}

/** Uses the existing private support-ticket contract, not an order or payment. */
function ShippingRateSupport({ context }: { context: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [user, setUser] = useState<User | null>(auth?.currentUser ?? null);
  const [details, setDetails] = useState("");
  const [summary, setSummary] = useState(context);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const running = useRef(false);
  const generation = useRef(0);
  const attempt = useRef<{
    uid: string;
    payload: {
      action: "openTicket";
      operationId: string;
      payload: { subject: string; message: string };
    };
  } | null>(null);
  useEffect(() => {
    let previousUid = auth?.currentUser?.uid ?? null;
    const unsubscribe = auth
      ? onAuthStateChanged(auth, (next) => {
          const uid = next?.uid ?? null;
          if (attempt.current && attempt.current.uid !== uid) {
            attempt.current = null;
            setUncertain(false);
          }
          if (uid !== previousUid) {
            previousUid = uid;
            generation.current++;
            running.current = false;
            setBusy(false);
            setDetails("");
            setError("");
            setSent(false);
          }
          setUser(next);
        })
      : undefined;
    return () => {
      generation.current++;
      unsubscribe?.();
    };
    // Subscription lifetime is independent of rendering; UID checks also fence replies.
  }, []);
  async function signIn() {
    if (running.current) return;
    const current = generation.current;
    running.current = true;
    setBusy(true);
    setError("");
    try {
      await login();
    } catch {
      if (current === generation.current)
        setError("Chưa đăng nhập được. Thử lại.");
    } finally {
      if (current === generation.current) {
        running.current = false;
        setBusy(false);
      }
    }
  }
  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const uid = auth?.currentUser?.uid;
    if (running.current || sent || !uid || uid !== user?.uid) return;
    attempt.current ??= {
      uid,
      payload: {
        action: "openTicket",
        operationId: crypto.randomUUID(),
        payload: {
          subject: "Xác nhận cước vận chuyển",
          message: [summary, details.trim()].filter(Boolean).join("\n\n"),
        },
      },
    };
    if (attempt.current.uid !== uid) return;
    const current = generation.current;
    running.current = true;
    setBusy(true);
    setError("");
    try {
      await callService("workspaceCommand", attempt.current.payload);
      if (current !== generation.current || auth?.currentUser?.uid !== uid)
        return;
      attempt.current = null;
      setUncertain(false);
      setSent(true);
    } catch (failure) {
      if (current !== generation.current || auth?.currentUser?.uid !== uid)
        return;
      const code = (failure as { code?: string })?.code;
      const unknownResult =
        !code ||
        [
          "functions/internal",
          "functions/unavailable",
          "functions/unknown",
          "functions/deadline-exceeded",
        ].includes(code);
      if (!unknownResult) attempt.current = null;
      setUncertain(unknownResult);
      setError(
        unknownResult
          ? "Chưa nhận được kết quả. Thử lại cùng yêu cầu."
          : "Chưa gửi được yêu cầu. Kiểm tra tài khoản và thử lại.",
      );
    } finally {
      if (current === generation.current) {
        running.current = false;
        setBusy(false);
      }
    }
  }
  return (
    <>
      <button
        type="button"
        className="rateContact"
        onClick={() => {
          if (!attempt.current && !busy) {
            setSummary(context);
            setSent(false);
            setError("");
          }
          dialog.current?.showModal();
        }}
      >
        Nhờ xác nhận cước
      </button>
      <dialog
        className="rateSupportDialog"
        ref={dialog}
        aria-labelledby={titleId}
      >
        <form onSubmit={(event) => void send(event)} aria-busy={busy}>
          <h2 id={titleId}>Nhờ xác nhận cước</h2>
          {sent ? (
            <>
              <p role="status">Đã gửi yêu cầu.</p>
              <Link className="rateContact" to="/support">
                Xem phản hồi
              </Link>
            </>
          ) : (
            <>
              <p className="rateSupportSummary">{summary}</p>
              <label>
                Mô tả hàng (không bắt buộc)
                <textarea
                  value={details}
                  disabled={busy || uncertain}
                  maxLength={3000}
                  placeholder="Loại hàng, kích thước kiện…"
                  onChange={(event) => setDetails(event.target.value)}
                />
              </label>
              {error && (
                <p role="alert" className="rateSupportError">
                  {error}
                </p>
              )}
              {!configured ? (
                <p role="status">Chưa thể gửi yêu cầu lúc này.</p>
              ) : user ? (
                <button className="rateContact" type="submit" disabled={busy}>
                  {busy
                    ? "Đang gửi…"
                    : uncertain
                      ? "Thử gửi lại"
                      : "Gửi yêu cầu"}
                </button>
              ) : (
                <>
                  <p className="rateQualification">
                    Đăng nhập để gửi và xem phản hồi riêng.
                  </p>
                  <button
                    className="rateContact"
                    type="button"
                    disabled={busy}
                    onClick={() => void signIn()}
                  >
                    {busy ? "Đang đăng nhập…" : "Đăng nhập để gửi"}
                  </button>
                </>
              )}
            </>
          )}
          <button
            type="button"
            className="rateDialogClose"
            onClick={() => dialog.current?.close()}
          >
            Đóng
          </button>
        </form>
      </dialog>
    </>
  );
}

import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, callService } from "../../shared/firebase";
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
  const [weight, setWeight] = useState("1"),
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
        setPublicSnapshot(result);
      }
    } catch (e) {
      if (mounted.current && current === epoch.current)
        setError(
          e instanceof Error
            ? e.message
            : "Chưa tải được bảng giá. Thử tải lại.",
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
  const grams = Number(weight) * 1000;
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
                  {url.includes("vietnam-di-my")
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

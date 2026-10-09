import { useEffect, useState } from "react";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { catalogProductSchema } from "../../../packages/domain/catalog-checkout";
import { db } from "../../shared/firebase";
import type { ContentRow } from "../../shared/public-content";
import type { Commerce } from "./Commerce";
import styles from "./Ask.module.css";
export function CatalogPurchase({
  commerce: c,
  vi,
}: {
  commerce: Commerce;
  vi: boolean;
}) {
  const [rows, setRows] = useState<ContentRow[]>([]),
    [selected, setSelected] = useState(""),
    [variant, setVariant] = useState(""),
    [quantity, setQuantity] = useState(1),
    [error, setError] = useState(""),
    [readAttempt, setReadAttempt] = useState(0);
  // Equivalent citations across chat turns must not erase reviewed choices.
  const catalogKey = JSON.stringify(
    [...new Set(c.catalogSlugs)].slice(0, 8).sort(),
  );
  useEffect(() => {
    let live = true;
    setRows([]);
    setSelected("");
    setVariant("");
    setQuantity(1);
    setError("");
    if (!db) return;
    void Promise.all(
      (JSON.parse(catalogKey) as string[]).map((slug) =>
        getDocs(
          query(
            collection(db!, "products"),
            where("status", "==", "published"),
            where("slug", "==", slug),
            limit(1),
          ),
        ),
      ),
    ).then(
      (snaps) => {
        if (!live) return;
        const validRows = snaps
          .flatMap((s) =>
            s.docs.map((d) => ({ ...d.data(), id: d.id }) as ContentRow),
          )
          .filter((p) => catalogProductSchema.safeParse(p).success);
        setRows(validRows);
        // Preview unambiguous choices; checkout still requires confirmation.
        if (validRows.length === 1) {
          setSelected(validRows[0].id);
          const product = catalogProductSchema.parse(validRows[0]);
          if (product.catalogOptions.length === 1)
            setVariant(product.catalogOptions[0]);
        }
      },
      () => {
        if (live)
          setError(
            vi
              ? "Chưa kiểm tra được giá niêm yết. Thử lại khi có kết nối."
              : "Listed prices could not be verified. Retry when connected.",
          );
      },
    );
    return () => {
      live = false;
    };
  }, [catalogKey, readAttempt]);
  const row = rows.find((r) => r.id === selected),
    parsed = catalogProductSchema.safeParse(row);
  if (error)
    return (
      <div>
        <p role="alert">{error}</p>
        <button
          className={styles.catalogRetry}
          type="button"
          onClick={() => setReadAttempt((n) => n + 1)}
        >
          {vi ? "Thử tải lại sản phẩm" : "Retry loading products"}
        </button>
      </div>
    );
  if (!rows.length) return null;
  const total = parsed.success ? parsed.data.listedPrice * quantity : undefined;
  return (
    <form
      className={`${styles.inlineForm} ${styles.catalogForm}`}
      onSubmit={(e) => {
        e.preventDefault();
        if (row)
          void c.run({
            action: "catalogCheckout",
            payload: {
              productId: row.id,
              productVersion: row.version,
              quantity,
              variant,
            },
          });
      }}
    >
      <h3>{vi ? "Chọn mua sản phẩm niêm yết" : "Buy a listed product"}</h3>
      <label>
        <span className="formLabelText">
          {vi ? "Sản phẩm" : "Product"}{" "}
          <span className="requiredMark" aria-hidden="true">
            *
          </span>
        </span>
        <select
          value={selected}
          required
          disabled={c.busy || !!c.pendingOperation}
          onChange={(e) => {
            setSelected(e.target.value);
            const next = catalogProductSchema.safeParse(
              rows.find((r) => r.id === e.target.value),
            );
            setVariant(
              next.success && next.data.catalogOptions.length === 1
                ? next.data.catalogOptions[0]
                : "",
            );
          }}
        >
          <option value="">{vi ? "Chọn sản phẩm" : "Choose product"}</option>
          {rows.map((r) => (
            <option key={r.id} value={r.id}>
              {r.title}
            </option>
          ))}
        </select>
      </label>
      {parsed.success && (
        <>
          <p>
            {vi ? "Giá trọn gói" : "All-inclusive price"}:{" "}
            {parsed.data.listedPrice.toLocaleString(vi ? "vi-VN" : "en-US")} ₫
          </p>
          <div className={styles.catalogFields}>
            {parsed.data.catalogOptions.length > 0 && (
              <label>
                <span className="formLabelText">
                  {vi ? "Mẫu" : "Variant"}{" "}
                  <span className="requiredMark" aria-hidden="true">
                    *
                  </span>
                </span>
                <select
                  required
                  value={variant}
                  disabled={c.busy || !!c.pendingOperation}
                  onChange={(e) => setVariant(e.target.value)}
                >
                  <option value="">{vi ? "Chọn mẫu" : "Choose variant"}</option>
                  {parsed.data.catalogOptions.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
            )}
            <label>
              <span className="formLabelText">
                {vi ? "Số lượng" : "Quantity"}{" "}
                <span className="requiredMark" aria-hidden="true">
                  *
                </span>
              </span>
              <input
                type="number"
                required
                min={1}
                max={100}
                step={1}
                value={quantity}
                disabled={c.busy || !!c.pendingOperation}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </label>
          </div>
          <p>
            {vi ? "Tổng thanh toán" : "Total"}:{" "}
            {Number.isSafeInteger(total) && total! <= 1e12
              ? `${total!.toLocaleString(vi ? "vi-VN" : "en-US")} ₫`
              : vi
                ? "Chưa xác định"
                : "Unavailable"}
          </p>
          <p>
            {vi
              ? "Thanh toán toàn bộ một lần, không chờ báo giá. Sau khi tạo đơn, nhập người nhận rồi thanh toán; nhân viên mua khi tiền được xác nhận."
              : "Pay in full once, without a quote. After creating the order, enter recipient details and pay; staff buy after funds are verified."}
          </p>
          <p>
            {vi ? "Điều khoản" : "Terms"}: {parsed.data.termsVersion}
          </p>
        </>
      )}
      <button
        className={styles.primaryAction}
        disabled={
          !c.user ||
          c.busy ||
          !!c.pendingOperation ||
          !parsed.success ||
          (parsed.data.catalogOptions.length > 0 && !variant) ||
          !Number.isInteger(quantity) ||
          quantity < 1 ||
          quantity > 100 ||
          !Number.isSafeInteger(total) ||
          total! > 1e12
        }
      >
        {vi ? "Kiểm tra lựa chọn" : "Review selection"}
      </button>
      {!c.user && (
        <p>
          {vi
            ? "Đăng nhập để đặt mua ngay trong chat."
            : "Sign in to order within this chat."}
        </p>
      )}
    </form>
  );
}

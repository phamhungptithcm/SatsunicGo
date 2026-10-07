import { LoadingState } from "../../shared/Loading";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { catalogProductSchema } from "../../../packages/domain/catalog-checkout";
import type { Commerce } from "./Commerce";
import { CatalogPurchase } from "./CatalogPurchase";
import {
  searchPublishedCatalog,
  type CatalogSearchResult,
} from "./catalog-search";
import styles from "./Ask.module.css";
export function CatalogSearch({
  result,
  question,
  commerce,
  vi,
  active,
}: {
  result: CatalogSearchResult;
  question: string;
  commerce: Commerce;
  vi: boolean;
  active: boolean;
}) {
  const [data, setData] = useState(result),
    [selected, setSelected] = useState(""),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const abort = useRef<AbortController | null>(null);
  const searching = useRef(false);
  const automaticPages = useRef(0);
  useEffect(() => () => {
    abort.current?.abort();
    abort.current = null;
    searching.current = false;
  }, []);
  const more = useCallback(async () => {
    if (searching.current) return;
    searching.current = true;
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setLoading(true);
    setError("");
    try {
      const next = await searchPublishedCatalog(
        question,
        AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]),
        data.cursor,
      );
      if (!controller.signal.aborted)
        setData((old) => ({
          ...next,
          stale: old.stale || next.stale,
          rows: [
            ...old.rows,
            ...next.rows.filter(
              (row) => !old.rows.some((r) => r.id === row.id),
            ),
          ],
        }));
    } catch {
      if (!controller.signal.aborted)
        setError(
          vi
            ? "Chưa tải thêm được sản phẩm. Thử lại khi có kết nối."
            : "Could not load more products. Retry when connected.",
        );
    } finally {
      if (abort.current === controller) {
        searching.current = false;
        if (!controller.signal.aborted) setLoading(false);
      }
    }
  }, [question, data.cursor, vi]);
  useEffect(() => {
    if (!active) {
      abort.current?.abort();
      searching.current = false;
      setLoading(false);
      return;
    }
    if (
      !data.rows.length &&
      data.hasMore &&
      !error &&
      automaticPages.current < 10
    ) {
      automaticPages.current++;
      void more();
    }
  }, [data.cursor, data.rows.length, data.hasMore, active, error, more]);
  return (
    <div className={styles.catalogResults}>
      {data.stale && (
        <p role="status">
          {vi
            ? "Nội dung lần tải trước. Giá sẽ được kiểm tra lại khi tạo đơn."
            : "Previously loaded content. Prices are checked again when creating an order."}
        </p>
      )}
      {!data.rows.length && (
        <>{loading ? <LoadingState overlay={false}>{vi
              ? "Đang tìm tiếp trong danh mục…"
              : "Searching more of the catalog…"}</LoadingState> : <p role="status">{data.hasMore
              ? vi
                ? "Chưa thấy sản phẩm trong phần đã kiểm tra. Có thể tìm tiếp."
                : "No match in the products checked so far. You can search further."
              : vi
                ? "Chưa có sản phẩm phù hợp. Anh/chị có thể gửi yêu cầu mua hộ ngay trong chat."
                : "No matching products yet. You can request an item within this chat."}</p>}</>
      )}
      <ul className={styles.catalogResultList}>
        {data.rows.map((row) => {
          const price = catalogProductSchema.safeParse(row);
          return (
            <li key={row.id}>
              {/^[a-zA-Z0-9-]{1,80}$/.test(row.mediaId ?? "") ? (
                <img
                  src={`/media/${row.mediaId}`}
                  alt={row.mediaAlt || row.title}
                  loading="lazy"
                  width="64"
                  height="64"
                />
              ) : (
                <span className={styles.catalogPlaceholder} aria-hidden="true">
                  ▧
                </span>
              )}
              <div>
                <Link to={`/products/${row.slug}`}>{row.title}</Link>
                <p>
                  {price.success
                    ? `${price.data.listedPrice.toLocaleString(vi ? "vi-VN" : "en-US")} ₫`
                    : vi
                      ? "Cần xem xét báo giá"
                      : "Quote review required"}
                </p>
              </div>
              {price.success && active && !commerce.order && (
                <button
                  type="button"
                  aria-pressed={selected === row.slug}
                  onClick={() => setSelected(row.slug)}
                >
                  {vi ? "Chọn mua" : "Buy"}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {data.hasMore && (
        <button type="button" disabled={loading} onClick={() => void more()}>
          {loading
            ? vi
              ? "Đang tìm tiếp…"
              : "Searching…"
            : vi
              ? "Tìm trong các sản phẩm tiếp theo"
              : "Search more products"}
        </button>
      )}
      {error && <p role="alert">{error}</p>}
      {selected && active && !commerce.order && (
        <CatalogPurchase
          key={selected}
          commerce={{ ...commerce, catalogSlugs: [selected] }}
          vi={vi}
        />
      )}
    </div>
  );
}

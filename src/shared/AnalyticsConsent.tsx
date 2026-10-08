import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  analyticsTracker,
  analyticsNavigation,
  productRouteMatches,
  readAnalyticsConsent,
  setAnalyticsConsent,
  trackPage,
  trackProduct,
} from "./analytics";
import { publicRoute } from "../../packages/domain/analytics";
import "./analytics-consent.css";
export function AnalyticsConsent({
  account,
  ready,
}: {
  account: string | null;
  ready: boolean;
}) {
  const location = useLocation(),
    [consent, setConsent] = useState(readAnalyticsConsent),
    [expanded, setExpanded] = useState(false);
  const publicPage = publicRoute(location.pathname) !== null;
  useEffect(() => {
    const sync = (e: Event) =>
      setConsent(
        (e as CustomEvent<"yes" | "no">).detail ?? readAnalyticsConsent(),
      );
    const storage = (e: StorageEvent) => {
      if (e.key === "sg:analytics-consent:v1")
        setConsent(readAnalyticsConsent());
    };
    window.addEventListener("sg:analytics-consent", sync);
    window.addEventListener("storage", storage);
    return () => {
      window.removeEventListener("sg:analytics-consent", sync);
      window.removeEventListener("storage", storage);
    };
  }, []);
  useEffect(() => {
    const navigation = analyticsNavigation(location);
    if (!ready) return;
    analyticsTracker.configure(consent === "yes", account, ready && publicPage);
    if (ready && publicPage) {
      trackPage(location.pathname, navigation);
      const detail = document.querySelector<HTMLElement>(
        "[data-analytics-product-view]",
      );
      if (
        detail?.dataset.analyticsProductView &&
        productRouteMatches(
          location.pathname,
          detail.dataset.analyticsProductSlug,
        )
      )
        trackProduct(
          detail.dataset.analyticsProductView,
          "product_view",
          `${navigation}:${detail.dataset.analyticsProductView}`,
        );
    }
  }, [consent, account, ready, publicPage, location]);
  useEffect(() => {
    const flush = () => {
      if (document.visibilityState === "hidden") void analyticsTracker.flush();
    };
    const click = (e: MouseEvent) => {
      const el = e.target instanceof Element ? e.target : null;
      const anchor = el?.closest("a[href]");
      if (!anchor?.getAttribute("href")?.startsWith("/products/")) return;
      const row = anchor?.closest<HTMLElement>("[data-analytics-product]");
      if (row?.dataset.analyticsProduct)
        trackProduct(row.dataset.analyticsProduct, "product_click");
    };
    document.addEventListener("visibilitychange", flush);
    document.addEventListener("click", click);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      document.removeEventListener("click", click);
      analyticsTracker.dispose();
    };
  }, []);
  if (!ready || !publicPage) return null;
  if (consent !== null && !expanded)
    return (
      <button
        className="analyticsSettings"
        type="button"
        onClick={() => setExpanded(true)}
      >
        Quyền thống kê
      </button>
    );
  function choose(value: "yes" | "no") {
    setAnalyticsConsent(value);
    setConsent(value);
    setExpanded(false);
  }
  return (
    <aside className="analyticsConsent" aria-label="Quyền thống kê truy cập">
      <div>
        <strong>Cho phép thống kê để cải thiện SatsunicGo?</strong>
        <p>
          Ghi nhận phiên truy cập, lựa chọn sản phẩm và chủ đề Ask. Không lưu
          nguyên văn câu hỏi trong thống kê. Bạn vẫn mua hàng bình thường khi từ
          chối.
        </p>
        <small lang="en">
          Optional analytics. Declining does not affect shopping.
        </small>
        <Link to="/privacy">Cách sử dụng dữ liệu</Link>
      </div>
      <div className="analyticsConsentActions">
        <button type="button" onClick={() => choose("no")}>
          {consent === "yes" ? "Dừng ghi nhận" : "Từ chối"}
        </button>
        <button type="button" onClick={() => choose("yes")}>
          Cho phép thống kê
        </button>
        {expanded && (
          <button type="button" onClick={() => setExpanded(false)}>
            Đóng
          </button>
        )}
      </div>
    </aside>
  );
}

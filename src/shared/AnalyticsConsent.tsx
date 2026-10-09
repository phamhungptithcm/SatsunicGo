import { useEffect, useId, useRef, useState } from "react";
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
    [dismissed, setDismissed] = useState(false),
    [dismissedAt, setDismissedAt] = useState<string | null>(null);
  const titleId = useId(),
    descriptionId = useId();
  const returnFocus = useRef(false);
  const [bottom, setBottom] = useState<number | null>(null);
  const publicPage = publicRoute(location.pathname) !== null;
  useEffect(() => {
    // Keep this corner control above the existing floating Ask surface.
    let observed: Element | null = null;
    const resize = new ResizeObserver(measure);
    function measure() {
      const floating = document.querySelector<HTMLElement>(
        'aside[aria-label="Hỏi SatsunicGo"], aside[aria-label="Ask SatsunicGo"], button[aria-label="Hỏi SatsunicGo"], button[aria-label="Ask SatsunicGo"]',
      );
      if (floating !== observed) {
        resize.disconnect();
        observed = floating;
        if (floating) resize.observe(floating);
      }
      const rect = floating?.getBoundingClientRect();
      const edge = window.innerWidth <= 480 ? 16 : 20;
      const cardLeft =
        window.innerWidth - edge - Math.min(320, window.innerWidth - 32);
      setBottom(
        rect && rect.width > 0 && rect.height > 0 && rect.right > cardLeft
          ? Math.max(edge, window.innerHeight - rect.top + 12)
          : null,
      );
    }
    const mutations = new MutationObserver(measure);
    mutations.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", measure);
    measure();
    return () => {
      mutations.disconnect();
      resize.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);
  const placement =
    bottom === null
      ? undefined
      : {
          bottom,
          maxHeight: `calc(100dvh - ${bottom + 16}px)`,
        };
  useEffect(() => {
    if (returnFocus.current) document.getElementById("main")?.focus();
    returnFocus.current = false;
  }, [dismissedAt]);
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
  // Present the choice before auth resolves; tracker effects remain gated by ready.
  if (!publicPage) return null;
  const privacyPage = location.pathname.replace(/\/+$/, "") === "/privacy";
  if (
    privacyPage ? dismissedAt === location.key : consent !== null || dismissed
  )
    return null;
  function dismiss() {
    returnFocus.current = true;
    setDismissed(true);
    setDismissedAt(location.key);
  }
  function choose(value: "yes" | "no") {
    setAnalyticsConsent(value);
    setConsent(value);
    dismiss();
  }
  return (
    <aside
      className="analyticsConsent"
      style={placement}
      role="dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div className="analyticsConsentHeading">
        <h2 id={titleId}>Tôn trọng riêng tư của bạn</h2>
        <button
          className="analyticsConsentClose"
          type="button"
          aria-label="Đóng"
          onClick={dismiss}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
      <p id={descriptionId}>
        Khi chọn “Đồng ý”, bạn cho phép lưu dữ liệu trên trình duyệt để chúng
        mình hiểu cách bạn dùng website và cải thiện trải nghiệm mua sắm. Bạn có
        thể đổi lựa chọn bất cứ lúc nào tại trang “Quyền riêng tư”.
      </p>
      <Link to="/privacy">Cách dùng dữ liệu</Link>
      <div className="analyticsConsentActions">
        <button type="button" onClick={() => choose("no")}>
          {consent === "yes" ? "Dừng ghi nhận" : "Từ chối"}
        </button>
        <button type="button" onClick={() => choose("yes")}>
          Đồng ý
        </button>
      </div>
    </aside>
  );
}

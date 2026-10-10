import { AnalyticsConsent } from "../shared/AnalyticsConsent";
import { RestrictedPage } from "../features/content/RestrictedPage";
import { PrivacyPage } from "../features/content/PrivacyPage";
import { TermsPage } from "../features/content/TermsPage";
import { AuthFeedbackToast } from "../features/auth/AuthFeedbackToast";
import { CrmAccessScreen } from "../features/auth/CrmAccessScreen";
import {
  authFeedbackSnapshot,
  subscribeAuthFeedback,
  clearAuthFeedback,
} from "../features/auth/auth-feedback";
import { pendingMfa, subscribeMfa } from "../features/auth/mfa";
import { ActionMfa } from "../features/auth/ActionMfa";
import { LoginChallenge } from "../features/auth/LoginChallenge";
import {
  StaffMfaSetup,
  useStaffMfaReady,
  useStaffMfaRecovery,
} from "../features/auth/StaffMfaSetup";
import { routeModules } from "./route-modules";
import { LoadingState } from "../shared/Loading";
import { CampaignBanner } from "../features/content/CampaignBanner";
import { AccountRail } from "../features/account/AccountRail";
import { TestOrderBadge } from "../features/orders/TestOrderBadge";
import { purchaseTestRecord } from "../../packages/domain/purchase-checkout";
import {
  customerOrderFilters,
  parseCustomerOrderFilter,
  matchesCustomerOrderFilter,
} from "../../packages/domain/customer-order-filter";
const AccountTracking = lazy(() =>
  import("../features/orders/AccountTracking").then((m) => ({
    default: m.AccountTracking,
  })),
);
import { staffRoles } from "../shared/staff-access";
const Documents = lazy(() =>
  routeModules.documents().then((m) => ({
    default: m.Documents,
  })),
);
const SharedDocument = lazy(() =>
  routeModules.documents().then((m) => ({
    default: m.SharedDocument,
  })),
);
import {
  isCrmPath,
  legacyStaffTarget,
} from "../../packages/domain/staff-route";
const PurchaseCheckout = lazy(() => import("../features/cart/purchase-checkout").then(m => ({default:m.PurchaseCheckout})));
const PurchasePayment = lazy(() => import("../features/cart/purchase-payment").then(m => ({default:m.PurchasePayment})));
const ProductCheckout = lazy(() =>
  import("../features/products/Checkout").then((m) => ({
    default: m.ProductCheckout,
  })),
);
const Workspace = lazy(() =>
  import("../features/crm/Workspace").then((m) => ({ default: m.Workspace })),
);
import "../styles/account.css";
import "../shared/public-tabs.css";
import "../styles/security.css";
import { EmulatorLogin } from "../features/auth/EmulatorLogin";
import { SiteHeader, SiteFooter } from "./SiteChrome";
import { CartProvider } from "../features/cart/cart-store";
const CartPage = lazy(() => import("../features/cart/Cart").then(m => ({ default: m.CartPage })));
import { notify, withProgress } from "../shared/feedback";
import { publicCopy } from "../../packages/domain/public-content";
import {
  useEffect,
  useState,
  useRef,
  useSyncExternalStore,
  lazy,
  Suspense,
} from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  collection,
  query,
  where,
  limit,
  onSnapshot,
  doc,
} from "firebase/firestore";
import {
  auth,
  db,
  configured,
  login,
  logout,
  sendCommand,
} from "../shared/firebase";
import {
  canDispatch,
  orderStageLabel,
  quoteTotal,
  type Order,
} from "../../packages/domain";
const RequestForm = lazy(() =>
  routeModules.request().then((m) => ({
    default: m.RequestForm,
  })),
);
const TransferNotice = lazy(() =>
  import("../features/requests/TransferNotice").then((m) => ({
    default: m.TransferNotice,
  })),
);
const ShippingRates = lazy(() =>
  import("../features/shipping/ShippingRates").then((m) => ({
    default: m.ShippingRates,
  })),
);
const CustomerShipments = lazy(() =>
  routeModules.shipments().then((m) => ({
    default: m.CustomerShipments,
  })),
);

const OrderConversation = lazy(() =>
  import("../features/support/OrderConversation").then((m) => ({
    default: m.OrderConversation,
  })),
);
const OrderTools = lazy(() =>
  import("../features/orders/OrderTools").then((m) => ({
    default: m.OrderTools,
  })),
);
import { OneTap } from "../features/auth/OneTap";
const Security = lazy(() =>
  routeModules.security().then((m) => ({ default: m.Security })),
);
const CustomerChanges = lazy(() =>
  import("../features/orders/Changes").then((m) => ({
    default: m.CustomerChanges,
  })),
);

const Notifications = lazy(() =>
  routeModules.notifications().then((m) => ({
    default: m.Notifications,
  })),
);
const Profile = lazy(() =>
  routeModules.profile().then((m) => ({ default: m.Profile })),
);

const Catalog = lazy(() =>
  routeModules.content().then((m) => ({ default: m.Catalog })),
);
const ContentDetail = lazy(() =>
  routeModules.content().then((m) => ({
    default: m.ContentDetail,
  })),
);

const Membership = lazy(() =>
  routeModules.membership().then((m) => ({
    default: m.Membership,
  })),
);
const Support = lazy(() =>
  routeModules.support().then((m) => ({ default: m.Support })),
);
import { Ask } from "../features/ask/Ask";
const money = (n: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);
function useOrders(user: User | null, selectedId?: string) {
  const [orders, setOrders] = useState<Order[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(!!user && !!db);
  useEffect(() => {
    setOrders([]);
    setError("");
    setLoading(!!user && !!db);
    if (!db || !user) return;
    let active = true;
    const success = (rows: Order[]) => {
      if (!active) return;
      setOrders(rows);
      setLoading(false);
    };
    const failure = () => {
      if (!active) return;
      setOrders([]);
      setError("Chưa tải được đơn hàng. Thử lại sau.");
      setLoading(false);
    };
    const unsubscribe = selectedId
      ? onSnapshot(
          doc(db, "orders", selectedId),
          (snapshot) => {
            const order = snapshot.data() as Order | undefined;
            success(
              order?.ownerId === user.uid
                ? [{ ...order, id: snapshot.id }]
                : [],
            );
          },
          failure,
        )
      : onSnapshot(
          query(
            collection(db, "orders"),
            where("ownerId", "==", user.uid),
            limit(50),
          ),
          (s) => success(s.docs.map((d) => d.data() as Order)),
          failure,
        );
    return () => {
      active = false;
      unsubscribe();
    };
  }, [user?.uid, selectedId]);
  return { orders, error, loading };
}
function Icon({ kind = "arrow" }: { kind?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {kind === "box" ? (
        <>
          <path d="m12 3 9 5-9 5-9-5 9-5Z" />
          <path d="M3 8v9l9 5 9-5V8M12 13v9M7 5l9 5" />
        </>
      ) : kind === "plus" ? (
        <path d="M12 5v14M5 12h14" />
      ) : (
        <path d="M5 12h14m-6-6 6 6-6 6" />
      )}
    </svg>
  );
}
export function App() {
  const [user, setUser] = useState<User | null>(null),
    [authError, setAuthError] = useState(""),
    [authBusy, setAuthBusy] = useState(false),
    [authReady, setAuthReady] = useState(!auth);
  const location = useLocation();
  const redirectError = useSyncExternalStore(
    subscribeAuthFeedback,
    authFeedbackSnapshot,
    () => "",
  );
  const authFlight = useRef(false);
  const accountView =
    location.pathname === "/account"
      ? new URLSearchParams(location.search).get("view")
      : null;
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.getElementById("main")?.focus({ preventScroll: true });
  }, [location.pathname, accountView]);
  useEffect(() => {
    if (auth)
      return onAuthStateChanged(auth, (current) => {
        setUser(current);
        setAuthReady(true);
      });
  }, []);
  async function signIn() {
    if (authBusy || authFlight.current) return;
    authFlight.current = true;
    clearAuthFeedback();
    setAuthBusy(true);
    setAuthError("");
    try {
      await withProgress(login, { overlay: !isCrmPath(location.pathname) });
      if (auth?.currentUser && !pendingMfa())
        notify("Đã đăng nhập.", "success");
    } catch (e) {
      setAuthError((e as Error).message);
    } finally {
      authFlight.current = false;
      setAuthBusy(false);
    }
  }
  async function signOut() {
    if (authBusy) return;
    setAuthError("");
    clearAuthFeedback();
    setAuthBusy(true);
    try {
      await withProgress(logout, { overlay: !isCrmPath(location.pathname) });
      notify("Đã đăng xuất.", "success");
    } catch {
      setAuthError("Chưa đăng xuất được. Thử lại.");
    } finally {
      setAuthBusy(false);
    }
  }
  return (
    <CartProvider key={`${authReady}:${user?.uid ?? "guest"}`} user={user} ready={authReady}>
    <StaffMfaSetup user={user} signOut={signOut} busy={authBusy}>
      <AnalyticsConsent account={user?.uid ?? null} ready={authReady} />
      <OneTap user={user} onError={setAuthError} />
      <AuthFeedbackToast
        message={authError || redirectError}
        staff={isCrmPath(location.pathname)}
      />
      <ActionMfa pageKey={location.key} />
      <LoginChallenge
        onOpen={() => {
          setAuthError("");
          clearAuthFeedback();
        }}
      />
      <a className="skip" href="#main">
        Đến nội dung chính
      </a>
      {!isCrmPath(location.pathname) && (
        <SiteHeader user={user} signOut={signOut} busy={authBusy} />
      )}
      <main
        id="main"
        tabIndex={-1}
        className={isCrmPath(location.pathname) ? "crmRoot" : undefined}
      >
        <Suspense
          fallback={
            <LoadingState variant="panel" className="page routeLoading">
              Đang mở trang…
            </LoadingState>
          }
        >
          {!authReady &&
          /^(?:\/account|\/staff|\/crm)(?:\/|$)/.test(location.pathname) ? (
            isCrmPath(location.pathname) ? (
              <CrmAccessScreen state="restoring" />
            ) : (
              <LoadingState variant="panel" className="page">
                Đang khôi phục tài khoản…
              </LoadingState>
            )
          ) : (
            <Routes>
              <Route path="/" element={<Home />} />
              <Route
                path="/request"
                element={
                  <RequestForm
                    key={user?.uid ?? "anonymous"}
                    user={user}
                    signIn={signIn}
                  />
                }
              />
              <Route
                path="/account/security"
                element={
                  <section className="accountWorkspace securityWorkspace">
                    <AccountRail active="security" />
                    <div className="accountPage">
                      <Suspense
                        fallback={
                          <LoadingState className="accountLoading">
                            Đang mở mục này…
                          </LoadingState>
                        }
                      >
                        <Security key={user?.uid ?? "anonymous"} user={user} />
                      </Suspense>
                    </div>
                  </section>
                }
              />
              <Route
                path="/account/profile"
                element={
                  <section className="accountWorkspace securityWorkspace">
                    <AccountRail active="profile" />
                    <div className="accountPage">
                      <Suspense
                        fallback={
                          <LoadingState className="accountLoading">
                            Đang mở mục này…
                          </LoadingState>
                        }
                      >
                        <Profile key={user?.uid ?? "anonymous"} user={user} />
                      </Suspense>
                    </div>
                  </section>
                }
              />
              <Route
                path="/account"
                element={
                  <Account
                    key={user?.uid ?? "anonymous"}
                    user={user}
                    signIn={signIn}
                  />
                }
              />
              <Route
                path="/account/orders/:id"
                element={
                  <Account
                    key={user?.uid ?? "anonymous"}
                    user={user}
                    signIn={signIn}
                  />
                }
              />
              <Route
                path="/account/documents"
                element={<Documents key={user?.uid ?? "anonymous"} />}
              />
              <Route path="/documents/shared" element={<SharedDocument />} />
              <Route path="/products" element={<Catalog kind="products" />} />
              <Route path="/cart" element={<CartPage signIn={signIn} />} />
              <Route path="/checkout" element={<PurchaseCheckout key={user?.uid ?? "guest"} user={user} signIn={signIn} />} />
              <Route path="/checkout/payment/:id" element={<PurchasePayment key={user?.uid ?? "guest"} user={user} signIn={signIn} />} />
              <Route
                path="/products/:slug/checkout"
                element={<ProductCheckout key={user?.uid ?? "guest"} user={user} signIn={signIn} />}
              />
              <Route path="/posts" element={<Catalog kind="posts" />} />
              <Route
                path="/posts/:slug"
                element={<ContentDetail kind="posts" />}
              />
              <Route
                path="/products/:slug"
                element={<ContentDetail kind="products" />}
              />
              <Route
                path="/membership"
                element={
                  <Membership
                    key={user?.uid ?? "anonymous"}
                    user={user}
                    signIn={signIn}
                  />
                }
              />
              <Route
                path="/support"
                element={<Support key={user?.uid ?? "anonymous"} user={user} />}
              />
              <Route
                path="/crm/*"
                element={
                  <Suspense
                    fallback={
                      <LoadingState variant="panel">
                        Đang mở không gian vận hành…
                      </LoadingState>
                    }
                  >
                    <Staff
                      key={user?.uid ?? "anonymous"}
                      user={user}
                      signIn={signIn}
                      signOut={signOut}
                      busy={authBusy}
                      authError={authError || redirectError}
                    />
                  </Suspense>
                }
              />
              <Route path="/staff/*" element={<LegacyStaffRedirect />} />
              <Route path="/:page" element={<PublicPage />} />
              <Route
                path="*"
                element={
                  <section className="page">
                    <h1>Không tìm thấy trang</h1>
                    <Link to="/">Về trang chủ</Link>
                  </section>
                }
              />
            </Routes>
          )}
        </Suspense>
      </main>
      {!isCrmPath(location.pathname) && <SiteFooter />}
      {authReady && !isCrmPath(location.pathname) && (
        <Ask
          key={`${location.pathname}:${user?.uid ?? "anonymous"}`}
          startCollapsed={
            location.pathname.startsWith("/posts") ||
            location.pathname.startsWith("/account") ||
            location.pathname === "/request" ||
            location.pathname === "/cart"
          }
        />
      )}
    </StaffMfaSetup>
    </CartProvider>
  );
}
function JourneyTimeline() {
  const root = useRef<HTMLDivElement>(null);
  const parcel = useRef<HTMLSpanElement>(null);
  const motion = useRef<Animation | null>(null);
  useEffect(() => {
    const card = root.current;
    const box = parcel.current;
    if (!card || !box) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const sync = () => {
      if (
        !visible ||
        document.hidden ||
        preference.matches ||
        card.matches(":hover") ||
        card.contains(document.activeElement)
      )
        motion.current?.pause();
      else motion.current?.play();
    };
    const measure = () => {
      const track = card.querySelector<HTMLElement>(".journeyTrack");
      const markers = [...card.querySelectorAll<HTMLElement>("li > span")];
      if (!track || markers.length !== 4 || !box.animate) return;
      const previousTime = motion.current?.currentTime ?? 0;
      motion.current?.cancel();
      const origin = track.getBoundingClientRect().top;
      const positions = markers.map(
        (marker) => marker.getBoundingClientRect().top - origin,
      );
      const frames: Keyframe[] = [];
      positions.forEach((y, index) => {
        const start = index * 0.25;
        frames.push({
          transform: `translateY(${y}px)`,
          opacity: 1,
          offset: start,
        });
        frames.push({
          transform: `translateY(${y}px)`,
          opacity: 1,
          offset: start + 0.17,
        });
        if (index < 3)
          frames.push({
            transform: `translate(9px, ${(y + positions[index + 1]) / 2 - 12}px) rotate(${index % 2 ? -8 : 8}deg)`,
            opacity: 1,
            offset: start + 0.21,
          });
      });
      frames.push({
        transform: `translateY(${positions[3]}px)`,
        opacity: 0,
        offset: 0.96,
      });
      frames.push({
        transform: `translateY(${positions[0]}px)`,
        opacity: 0,
        offset: 0.98,
      });
      frames.push({
        transform: `translateY(${positions[0]}px)`,
        opacity: 1,
        offset: 1,
      });
      motion.current = box.animate(frames, {
        duration: 12000,
        iterations: Infinity,
        easing: "ease-in-out",
      });
      motion.current.currentTime = previousTime;
      sync();
    };
    const resize = new ResizeObserver(measure);
    resize.observe(card);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    intersection.observe(card);
    card.addEventListener("pointerenter", sync);
    card.addEventListener("pointerleave", sync);
    card.addEventListener("focusin", sync);
    // focusout fires before the browser updates activeElement.
    const focusOut = () => queueMicrotask(sync);
    card.addEventListener("focusout", focusOut);
    document.addEventListener("visibilitychange", sync);
    preference.addEventListener("change", sync);
    measure();
    return () => {
      resize.disconnect();
      intersection.disconnect();
      card.removeEventListener("pointerenter", sync);
      card.removeEventListener("pointerleave", sync);
      card.removeEventListener("focusin", sync);
      card.removeEventListener("focusout", focusOut);
      document.removeEventListener("visibilitychange", sync);
      preference.removeEventListener("change", sync);
      motion.current?.cancel();
      motion.current = null;
    };
  }, []);
  return (
    <div
      className="journey journeyTimeline"
      aria-label="Quy trình mua hộ"
      aria-description="Minh họa tự động. Đặt con trỏ hoặc focus vào khung để tạm ngưng chuyển động."
      tabIndex={0}
      ref={root}
    >
      <div className="journeyTop">
        <span>
          Bạn chọn món,
          <br />
          <strong>chúng mình lo.</strong>
        </span>
      </div>
      <div className="journeyTrack">
        <span className="journeyParcel" aria-hidden="true" ref={parcel}>
          <Icon kind="box" />
        </span>
        <ol>
          {[
            [
              "01",
              "Chọn món",
              "Chọn sản phẩm đã đăng hoặc gửi món cần mua hộ.",
            ],
            [
              "02",
              "Xem giá và thanh toán",
              "Rõ chi phí, đồng ý rồi thanh toán.",
            ],
            [
              "03",
              "Mua và gửi hàng",
              "Chúng mình mua, kiểm tra và đóng gói.",
            ],
            [
              "04",
              "Nhận hàng",
              "Theo dõi đơn, đợi hàng về tận nhà.",
            ],
          ].map(([n, t, d]) => (
            <li key={n}>
              <span>{n}</span>
              <div>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <Link className="journeyMore" to="/how-it-works">
        Xem cách hoạt động <Icon />
      </Link>
    </div>
  );
}

function Home() {
  return (
    <>
      <section className="hero">
        <div className="heroCopy">
          <span className="eyebrow">
            <span /> Mua hộ Mỹ · Nhật · Hàn
          </span>
          <h1>
            Chính hãng từ xa.
            <br />
            <span>Ưng ý về nhà.</span>
          </h1>
          <p>
            Món bạn thích từ Mỹ, Nhật, Hàn — rõ nguồn gốc, an tâm chọn mua.
          </p>
          <div className="heroActions">
            <Link className="primary" to="/products">
              Xem sản phẩm <Icon />
            </Link>
            <Link className="secondary" to="/request">
              Gửi yêu cầu mua hộ
            </Link>
          </div>
          <div className="origins">
            <span>
              Mỹ <b>US</b>
            </span>
            <span>
              Nhật Bản <b>JP</b>
            </span>
            <span>
              Hàn Quốc <b>KR</b>
            </span>
          </div>
        </div>
        <JourneyTimeline />
      </section>
      <CampaignBanner placement="home" />
      <section className="marketSection" aria-labelledby="market-title">
        <div className="sectionHeading">
          <div>
            <span className="eyebrow">Món hàng, không khoảng cách</span>
            <h2 id="market-title">Bạn muốn mua từ đâu?</h2>
          </div>
          <Link className="browseLink" to="/products">
            Khám phá sản phẩm <Icon />
          </Link>
        </div>
        <div className="marketGrid">
          {[
            ["US", "Mỹ", "Món bạn tìm, từ thương hiệu bạn thích."],
            ["JP", "Nhật Bản", "Từ đồ dùng hằng ngày đến món sưu tầm."],
            ["KR", "Hàn Quốc", "Khám phá phong cách và món đồ mới."],
          ].map(([code, title, copy]) => (
            <Link className="marketCard" key={code} to="/request">
              <div className="marketArt" data-market={code} aria-hidden="true">
                <span className="marketCode">{code}</span>
                <img
                  src={`/images/markets/${code.toLowerCase()}-v2.webp`}
                  alt=""
                  width="960"
                  height="640"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="marketCopy">
                <div>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </div>
                <span className="marketArrow">
                  <Icon />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="explain">
        <h2>Mua hộ, dễ hơn bạn nghĩ</h2>
        <div className="featureRow">
          <article>
            <h3>Chưa có link cũng được</h3>
            <p>
              Kể món bạn muốn mua và ngân sách. Mình sẽ trao đổi thêm trước khi
              báo giá.
            </p>
          </article>
          <article>
            <h3>Chi phí rõ ràng</h3>
            <p>
              Giá hàng, phí mua hộ và vận chuyển ghi riêng. Khoản chưa chốt sẽ
              ghi là ước tính.
            </p>
          </article>
          <article>
            <h3>Xem đơn ở một nơi</h3>
            <p>
              Xem báo giá, thanh toán và tình trạng giao hàng ngay trong đơn của
              bạn.
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
function Account({
  user,
  signIn,
}: {
  user: User | null;
  signIn: () => Promise<void>;
}) {
  const location = useLocation();
  const selectedId = location.pathname.match(
    /^\/account\/orders\/([a-zA-Z0-9-]+)$/,
  )?.[1];
  const { orders, error, loading } = useOrders(user, selectedId);
  const filter = parseCustomerOrderFilter(
    new URLSearchParams(location.search).get("filter"),
  );
  const ownerOrders = orders.filter((o) => o.ownerId === user?.uid);
  const visibleOrders = selectedId
    ? ownerOrders.filter((o) => o.id === selectedId)
    : ownerOrders.filter((o) => matchesCustomerOrderFilter(o.stage, filter));
  const view = new URLSearchParams(location.search).get("view");
  const space =
    view === "shipments" || view === "notifications" ? view : "orders";
  const title =
    space === "shipments"
      ? "Vận chuyển"
      : space === "notifications"
        ? "Thông báo"
        : selectedId
          ? "Chi tiết đơn"
          : "Đơn của tôi";
  return (
    <section className="accountWorkspace">
      <AccountRail active={space} />
      <div className="accountPage">
        {selectedId && space === "orders" && (
          <Link className="accountBack" to="/account">
            ← Tất cả đơn của tôi
          </Link>
        )}
        {(!selectedId || space !== "orders") && (
          <header className="pageHeading">
            <div>
              <h1>{title}</h1>
              <p>
                {space === "orders"
                  ? selectedId
                    ? "Mọi thông tin của đơn, trong một nơi."
                    : "Theo dõi món hàng bạn đang chờ."
                  : space === "shipments"
                    ? "Các kiện hàng và vận đơn của bạn."
                    : "Cập nhật mới từ SatsunicGo."}
              </p>
            </div>
            {space === "orders" && !selectedId && (
              <Link className="primary" to="/request">
                Yêu cầu mới <Icon kind="plus" />
              </Link>
            )}
          </header>
        )}
        {user && space === "orders" && !selectedId && (
          <nav
            className="customerOrderFilters publicTabs"
            aria-label="Lọc đơn hàng"
            aria-describedby="customer-order-count-scope"
          >
            {customerOrderFilters.map((value) => (
              <Link
                key={value}
                to={value === "all" ? "/account" : `/account?filter=${value}`}
                aria-current={filter === value ? "page" : undefined}
              >
                {
                  {
                    all: "Tất cả",
                    undelivered: "Chưa giao",
                    delivered: "Đã giao",
                    cancelled: "Đã hủy",
                  }[value]
                }
                {db && !loading && !error && (
                  <span className="publicTabCount">
                    {
                      ownerOrders.filter((order) =>
                        matchesCustomerOrderFilter(order.stage, value),
                      ).length
                    }
                  </span>
                )}
              </Link>
            ))}
          </nav>
        )}
        {user && space === "orders" && !selectedId && (
          <p id="customer-order-count-scope" className="listScope">
            Bộ lọc và số lượng áp dụng cho tối đa 50 đơn đã tải trong tài khoản.
          </p>
        )}
        <Suspense
          fallback={
            <LoadingState className="accountLoading">
              Đang mở mục này…
            </LoadingState>
          }
        >
          {import.meta.env.DEV && !user && <EmulatorLogin />}
          {!user ? (
            <div className="empty">
              <h2>Đăng nhập để xem đơn của bạn</h2>
              <button
                className="primary"
                disabled={!configured}
                onClick={() => void signIn()}
              >
                Đăng nhập với Google
              </button>
            </div>
          ) : space === "shipments" ? (
            <CustomerShipments uid={user.uid} />
          ) : space === "notifications" ? (
            <Notifications uid={user.uid} expanded />
          ) : loading ? (
            <LoadingState className="accountLoading">
              Đang tải đơn của bạn…
            </LoadingState>
          ) : visibleOrders.length ? (
            <>
              {selectedId ? (
                visibleOrders.map((o) => (
                  <OrderCard
                    key={`${user.uid}:${o.id}`}
                    order={o}
                    uid={user.uid}
                  />
                ))
              ) : (
                <div className="customerOrderList">
                  {[...visibleOrders]
                    .sort(
                      (a, b) =>
                        b.createdAt - a.createdAt || a.id.localeCompare(b.id),
                    )
                    .map((o) => (
                      <Link
                        className="customerOrderRow"
                        key={o.id}
                        to={`/account/orders/${o.id}`}
                      >
                        <span className="orderMarket">{o.market}</span>
                        <span className="orderRowTitle">
                          <strong>
                            {o.items[0]?.name || "Yêu cầu mua hộ"}
                          </strong>
                          <small>
                            <TestOrderBadge record={o} />{" "}
                            {new Intl.DateTimeFormat("vi-VN").format(
                              o.createdAt,
                            )}{" "}
                            · {o.items.reduce((s, i) => s + i.quantity, 0)} sản
                            phẩm
                          </small>
                        </span>
                        <span className="statusTag">{orderStageLabel(o)}</span>
                        <Icon />
                      </Link>
                    ))}
                </div>
              )}
            </>
          ) : (
            <div className="empty">
              <h2>
                {error
                  ? "Chưa tải được đơn hàng"
                  : selectedId
                    ? "Chưa mở được đơn này"
                    : filter !== "all"
                      ? "Không có đơn trong nhóm này"
                      : "Chưa có yêu cầu nào"}
              </h2>
              <p>
                {error ||
                  (selectedId
                    ? "Kiểm tra liên kết hoặc quay lại danh sách đơn của bạn."
                    : filter !== "all"
                      ? "Bộ lọc áp dụng cho tối đa 50 đơn đã tải. Xem tất cả để đổi nhóm đơn."
                      : "Bắt đầu bằng món hàng bạn muốn mua.")}
              </p>
              <Link
                to={selectedId || filter !== "all" ? "/account" : "/request"}
              >
                {selectedId
                  ? "Về danh sách đơn"
                  : filter !== "all"
                    ? "Xem tất cả đơn"
                    : "Gửi yêu cầu mua hộ"}
              </Link>
            </div>
          )}
        </Suspense>
      </div>
    </section>
  );
}
function OrderCard({ order: o, uid }: { order: Order; uid: string }) {
  const testOrder = purchaseTestRecord(o);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [section, setSection] = useState<"overview" | "files" | "history">(
      "overview",
    ),
    [visited, setVisited] = useState<string[]>(["overview"]);
  async function act(action: string, payload: unknown) {
    setBusy(true);
    setError("");
    try {
      await sendCommand(action, payload, o.id, o.version);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const total =
    o.upfront
      ? o.finalTotal ?? o.upfront.initialTotal
      : o.purchaseKind === "catalog"
      ? o.finalTotal
      : o.quote
        ? quoteTotal(o.quote)
        : undefined;
  return (
    <article className="order orderDetail">
      <div className="pageHeading">
        <h1>{o.items[0]?.name}</h1>
        <span className="orderStatusGroup">
          <TestOrderBadge record={o} />
          <span className="statusTag">{orderStageLabel(o)}</span>
        </span>
      </div>
      <p>
        {o.market} · {new Intl.DateTimeFormat("vi-VN").format(o.createdAt)} ·{" "}
        {o.items.reduce((s, i) => s + i.quantity, 0)} sản phẩm
      </p>
      {o.hold && (
        <p role="status" className="orderHold">
          Tạm giữ: {o.hold}
        </p>
      )}
      <nav className="orderSections publicTabs" aria-label="Thông tin đơn hàng">
        {(
          [
            ["overview", "Tổng quan"],
            ["files", "Ảnh & chứng từ"],
            ["history", "Lịch sử & tiền"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            aria-pressed={section === value}
            onClick={() => {
              setSection(value);
              setVisited((current) =>
                current.includes(value) ? current : [...current, value],
              );
            }}
          >
            {label}
          </button>
        ))}
      </nav>
      <div
        className={`detailSection ${section === "overview" ? "isVisible" : ""}`}
        hidden={section !== "overview"}
      >
        <>
          {o.stage === "REQUESTED" && !o.hold && (
            <div className="orderNextStep">
              <span className="orderStatusDot" />
              <div>
                <h2>Đã nhận yêu cầu của bạn</h2>
                <p>
                  Nhân viên sẽ làm rõ sản phẩm và gửi báo giá. Bạn chưa cần
                  thanh toán ở bước này.
                </p>
              </div>
            </div>
          )}
          <Suspense
            fallback={
              <LoadingState overlay={false}>
                Đang mở tiến trình đơn hàng…
              </LoadingState>
            }
          >
            <AccountTracking uid={uid} orderId={o.id} version={o.version} />
          </Suspense>
          <section className="orderItems">
            <h2>Sản phẩm</h2>
            {o.items.map((item, index) => (
              <div className="orderItem" key={index}>
                <div>
                  <strong>{item.name}</strong>
                  {item.variant && <p>{item.variant}</p>}
                </div>
                <span>× {item.quantity}</span>
              </div>
            ))}
          </section>
          {o.purchaseKind === "catalog" && (
            <section aria-label="Thanh toán sản phẩm niêm yết">
              <h2>Đặt mua theo giá niêm yết</h2>
              <p>
                Tổng trọn gói: <strong>{money(total!)}</strong>.
                {!testOrder && " Thanh toán toàn bộ để SatsunicGo tiến hành mua hộ."}
              </p>
              <p>
                Điều khoản: {o.catalogSnapshot?.termsVersion}. Không cần báo giá
                và không thu thêm đợt hai.
              </p>
              {o.stage === "QUOTE_ACCEPTED" &&
                o.collected - o.refunded >= total! && (
                  <p role="status">
                    {testOrder
                      ? "Đã xác nhận thanh toán test."
                      : "Đã xác nhận thanh toán. Nhân viên sẽ tiến hành mua hộ."}
                  </p>
                )}
              {!testOrder && o.stage === "QUOTE_ACCEPTED" && o.collected === 0 && (
                <button
                  disabled={busy}
                  onClick={() => void act("cancelRequest", {})}
                >
                  Hủy đơn chưa thanh toán
                </button>
              )}
            </section>
          )}
          {o.quote && (
            <>
              <h2>
                {o.acceptedAt ? "Báo giá đã chấp nhận" : "Báo giá để bạn duyệt"}
              </h2>
              <p>{o.quote.verifiedProduct}</p>
              <dl className="prices">
                {[
                  ["Giá hàng", o.quote.goods],
                  ["Phí mua hộ", o.quote.service],
                  ["Phí/thuế nội địa nguồn", o.quote.sourceCosts],
                  ["Cước quốc tế dự kiến", o.quote.internationalShipping],
                  ["Giao nội địa dự kiến", o.quote.destinationShipping],
                  ["Giảm phí", -o.quote.discount],
                  ["Tổng dự kiến", total!],
                ].map(([label, n]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{money(Number(n))}</dd>
                  </div>
                ))}
              </dl>
              <p>
                Điều khoản: {o.quote.termsVersion} · Báo giá v{o.quoteVersion} ·
                Hết hạn {new Date(o.quote.expiresAt).toLocaleString("vi-VN")}
              </p>
            </>
          )}
          {!testOrder && o.stage === "QUOTED" && (
            <button
              className="primary"
              disabled={busy}
              onClick={() =>
                void act("acceptQuote", { quoteVersion: o.quoteVersion })
              }
            >
              Chấp nhận báo giá và điều khoản
            </button>
          )}
          {o.deposit !== undefined && (
            <p>
              {o.upfront ? "Thanh toán ban đầu" : "Cọc cần xác nhận"}: <strong>{money(o.deposit)}</strong> · {testOrder ? "Thanh toán test" : "Đã thu ròng"}: <strong>{money(o.collected - o.refunded)}</strong>
            </p>
          )}
          {o.consolidatedFreight && o.purchaseKind !== "catalog" && (
            <p>
              Cước quốc tế phân bổ từ lô gom:{" "}
              {money(o.consolidatedFreight.amount)}. Tổng cuối cần được duyệt
              trước khi xuất gửi.
            </p>
          )}
          {o.finalTotal !== undefined && (
            <p>
              {o.purchaseKind === "catalog" ? "Tổng trọn gói" : "Tổng cuối"}:{" "}
              {money(o.finalTotal)} · Còn thu:{" "}
              <strong>
                {money(Math.max(0, o.finalTotal - o.collected + o.refunded))}
              </strong>
            </p>
          )}
          {!testOrder && o.stage === "PACKED" && o.finalApproved === false && (
            <button
              disabled={busy}
              onClick={() => void act("approveFinal", {})}
            >
              Duyệt tổng phí cuối
            </button>
          )}
          <Suspense
            fallback={
              <LoadingState overlay={false}>
                Đang mở thao tác của đơn…
              </LoadingState>
            }
          >
            {!testOrder && <CustomerChanges order={o} />}
            {!testOrder && !o.checkoutId && <TransferNotice order={o} />}
            <OrderTools order={o} section="actions" />
            <OrderConversation key={o.id} orderId={o.id} />
          </Suspense>
          {o.tracking && <p>Vận đơn: {o.tracking} · Cập nhật bởi nhân viên</p>}
          {!testOrder && o.stage === "DELIVERED" &&
            o.tracking &&
            canDispatch({ ...o, stage: "READY_TO_SHIP" }) && (
              <section aria-label="Xác nhận nhận hàng">
                <p>
                  Chỉ xác nhận sau khi bạn đã nhận và kiểm tra đủ sản phẩm trong
                  đơn.
                </p>
                <button
                  className="primary"
                  disabled={busy}
                  onClick={() => void act("confirmReceipt", { received: true })}
                >
                  Xác nhận đã nhận đủ hàng
                </button>
              </section>
            )}
        </>
      </div>
      {(["files", "history"] as const).map(
        (value) =>
          visited.includes(value) && (
            <div
              key={value}
              className={`detailSection ${section === value ? "isVisible" : ""}`}
              hidden={section !== value}
            >
              <Suspense
                fallback={
                  <LoadingState overlay={false}>
                    Đang mở thông tin của đơn…
                  </LoadingState>
                }
              >
                <OrderTools order={o} section={value} />
              </Suspense>
            </div>
          ),
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </article>
  );
}
function LegacyStaffRedirect() {
  const { pathname, search, hash } = useLocation();
  return <Navigate replace to={legacyStaffTarget(pathname, search, hash)} />;
}
function Staff({
  user,
  signIn,
  signOut,
  busy,
  authError,
}: {
  user: User | null;
  signIn: () => void;
  signOut: () => void;
  busy: boolean;
  authError: string;
}) {
  const [access, setAccess] = useState<{
      roles?: string[];
      active?: boolean;
      locked?: boolean;
    } | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(!!user && !!db);
  const [revision, setRevision] = useState(0);
  const challenge = useSyncExternalStore(subscribeMfa, pendingMfa, () => null);
  const mfaReady = useStaffMfaReady(user);
  const mfaRecovery = useStaffMfaRecovery(user);
  useEffect(() => {
    if (!user || !db) {
      setAccess(null);
      setError("");
      setLoading(false);
      return;
    }
    let current = true;
    setAccess(null);
    setError("");
    setLoading(true);
    const stop = onSnapshot(
      doc(db, "staffAccess", user.uid),
      (s) => {
        if (!current) return;
        setAccess(s.data() ?? null);
        setLoading(false);
        setError("");
      },
      () => {
        if (!current) return;
        setAccess(null);
        setLoading(false);
        setError(
          "Không thể kiểm tra quyền nhân viên. Tải lại trang để thử lại.",
        );
      },
    );
    return () => {
      current = false;
      stop();
    };
  }, [user, revision]);
  if (user && loading) return <CrmAccessScreen state="checking" />;
  const roles = staffRoles(access);
  if (error || !user || roles === null || roles.length === 0)
    return (
      <CrmAccessScreen
        state={!user ? "anonymous" : error || !db ? "error" : "denied"}
        busy={busy}
        mfa={Boolean(challenge)}
        error={authError}
        signIn={signIn}
        signOut={signOut}
        retry={
          !db
            ? undefined
            : () => {
                setLoading(true);
                setRevision((value) => value + 1);
              }
        }
      />
    );
  if (!mfaReady)
    return (
      <CrmAccessScreen
        state={mfaRecovery.unavailable ? "error" : "checking"}
        retry={mfaRecovery.unavailable ? mfaRecovery.retry : undefined}
        signOut={signOut}
        busy={busy}
      />
    );
  return (
    <Workspace
      key={`${user.uid}:${roles.join(",")}`}
      roles={roles}
      uid={user.uid}
      user={user}
      name={user.displayName || "Nhân viên"}
      signOut={signOut}
      busy={busy}
    />
  );
}

function PublicPage() {
  const path = useLocation().pathname.slice(1);
  if (path === "fees") return <ShippingRates />;
  if (path === "privacy") return <PrivacyPage />;
  if (path === "terms") return <TermsPage />;
  if (path === "restricted") return <RestrictedPage />;
  const content = publicCopy[path];
  if (!content)
    return (
      <section className="page">
        <h1>Không tìm thấy trang</h1>
        <Link to="/">Trang chủ</Link>
      </section>
    );
  return (
    <section className="page editorial">
      <h1>{content[0]}</h1>
      <p>{content[1]}</p>
      <Link className="primary" to="/request">
        Gửi yêu cầu mua hộ <Icon />
      </Link>
    </section>
  );
}

import { SiteHeader, SiteFooter } from "./SiteChrome";
import { notify, withProgress } from "../shared/feedback";
import { publicCopy } from "../../packages/domain/public-content";
import { useEffect, useState, lazy, Suspense } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
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
  betaRelease,
  login,
  logout,
  sendCommand,
} from "../shared/firebase";
import { stageLabels, quoteTotal, type Order } from "../../packages/domain";
const RequestForm = lazy(() =>
  import("../features/requests/RequestForm").then((m) => ({
    default: m.RequestForm,
  })),
);
const TransferNotice = lazy(() =>
  import("../features/requests/TransferNotice").then((m) => ({
    default: m.TransferNotice,
  })),
);
const CustomerShipments = lazy(() =>
  import("../features/shipping/CustomerShipments").then((m) => ({
    default: m.CustomerShipments,
  })),
);
const Shipping = lazy(() =>
  import("../features/shipping/Shipping").then((m) => ({
    default: m.Shipping,
  })),
);
const StaffSupport = lazy(() =>
  import("../features/support/Thread").then((m) => ({
    default: m.StaffSupport,
  })),
);
const Finance = lazy(() =>
  import("../features/payments/Finance").then((m) => ({ default: m.Finance })),
);
const PlanEditor = lazy(() =>
  import("../features/membership/PlanEditor").then((m) => ({
    default: m.PlanEditor,
  })),
);
const StaffAccess = lazy(() =>
  import("../features/settings/StaffAccess").then((m) => ({
    default: m.StaffAccess,
  })),
);
const Dashboard = lazy(() =>
  import("../features/crm/Dashboard").then((m) => ({ default: m.Dashboard })),
);
const Customer = lazy(() =>
  import("../features/crm/Customer").then((m) => ({ default: m.Customer })),
);
const Campaigns = lazy(() =>
  import("../features/content/Campaigns").then((m) => ({
    default: m.Campaigns,
  })),
);
const Settings = lazy(() =>
  import("../features/settings/Settings").then((m) => ({
    default: m.Settings,
  })),
);
const OrderTools = lazy(() =>
  import("../features/orders/OrderTools").then((m) => ({
    default: m.OrderTools,
  })),
);
import { OneTap } from "../features/auth/OneTap";
const Security = lazy(() =>
  import("../features/auth/Security").then((m) => ({ default: m.Security })),
);
const CustomerChanges = lazy(() =>
  import("../features/orders/Changes").then((m) => ({
    default: m.CustomerChanges,
  })),
);
const ChangeQueue = lazy(() =>
  import("../features/orders/Changes").then((m) => ({
    default: m.ChangeQueue,
  })),
);
const Notifications = lazy(() =>
  import("../features/notifications/Notifications").then((m) => ({
    default: m.Notifications,
  })),
);
const Profile = lazy(() =>
  import("../features/profile/Profile").then((m) => ({ default: m.Profile })),
);
const Workbench = lazy(() =>
  import("../features/operations/Workbench").then((m) => ({
    default: m.Workbench,
  })),
);
import { Catalog, ContentDetail } from "../features/content/Content";
const ContentEditor = lazy(() =>
  import("../features/content/ContentEditor").then((m) => ({
    default: m.ContentEditor,
  })),
);
const Membership = lazy(() =>
  import("../features/membership/Membership").then((m) => ({
    default: m.Membership,
  })),
);
const Support = lazy(() =>
  import("../features/support/Support").then((m) => ({ default: m.Support })),
);
import { Ask } from "../features/ask/Ask";
const money = (n: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);
function useOrders(user: User | null) {
  const [orders, setOrders] = useState<Order[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    setOrders([]);
    setError("");
    if (!db || !user) return;
    return onSnapshot(
      query(
        collection(db, "orders"),
        where("ownerId", "==", user.uid),
        limit(50),
      ),
      (s) => setOrders(s.docs.map((d) => d.data() as Order)),
      () => setError("Chưa tải được đơn hàng. Thử lại sau."),
    );
  }, [user]);
  return { orders, error };
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
    [authBusy, setAuthBusy] = useState(false);
  const location = useLocation();
  useEffect(() => {
    if (auth) return onAuthStateChanged(auth, setUser);
  }, []);
  async function signIn() {
    if (authBusy) return;
    setAuthBusy(true);
    setAuthError("");
    try {
      await withProgress(login);
      if (auth?.currentUser) notify("Đã đăng nhập.", "success");
    } catch (e) {
      setAuthError((e as Error).message);
      notify((e as Error).message, "error");
    } finally {
      setAuthBusy(false);
    }
  }
  async function signOut() {
    if (authBusy) return;
    setAuthBusy(true);
    try {
      await withProgress(logout);
      notify("Đã đăng xuất.", "success");
    } catch {
      setAuthError("Chưa đăng xuất được. Thử lại.");
      notify("Chưa đăng xuất được. Thử lại.", "error");
    } finally {
      setAuthBusy(false);
    }
  }
  return (
    <>
      <OneTap user={user} onError={setAuthError} />
      <a className="skip" href="#main">
        Đến nội dung chính
      </a>
      <SiteHeader
        user={user}
        signIn={signIn}
        signOut={signOut}
        busy={authBusy}
      />
      {betaRelease && (
        <div className="betaNotice" role="status">
          <strong>Beta 0.1</strong>
          <span>
            Đang kiểm tra giao diện. Đăng nhập, gửi yêu cầu và thanh toán chưa
            mở.
          </span>
        </div>
      )}
      {authError && (
        <p className="banner" role="alert">
          {authError} <Link to="/account/security">Bảo mật tài khoản</Link>
        </p>
      )}
      <main id="main" tabIndex={-1}>
        <Suspense
          fallback={
            <section className="page routeLoading" role="status">
              Đang mở trang…
            </section>
          }
        >
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
              element={<Security user={user} />}
            />
            <Route path="/account/profile" element={<Profile user={user} />} />
            <Route
              path="/account"
              element={<Account user={user} signIn={signIn} />}
            />
            <Route
              path="/account/orders/:id"
              element={<Account user={user} signIn={signIn} />}
            />
            <Route path="/products" element={<Catalog kind="products" />} />
            <Route path="/posts" element={<Catalog kind="posts" />} />
            <Route
              path="/posts/:slug"
              element={<ContentDetail kind="posts" />}
            />
            <Route
              path="/products/:slug"
              element={<ContentDetail kind="products" />}
            />
            <Route path="/membership" element={<Membership user={user} />} />
            <Route path="/support" element={<Support user={user} />} />
            <Route
              path="/staff/*"
              element={
                <Suspense
                  fallback={<p role="status">Đang mở không gian vận hành…</p>}
                >
                  <Staff user={user} />
                </Suspense>
              }
            />
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
        </Suspense>
      </main>
      <SiteFooter />
      {!location.pathname.startsWith("/staff") && (
        <Ask
          key={location.pathname}
          startCollapsed={location.pathname.startsWith("/posts")}
        />
      )}
    </>
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
            Bạn chọn.
            <br />
            Chúng mình lo
            <br />
            <span>phần còn lại.</span>
          </h1>
          <p>
            Gửi tên hoặc link món hàng bạn muốn mua tại Mỹ, Nhật, Hàn. Nhận báo
            giá rõ ràng trước khi quyết định.
          </p>
          <Link className="primary" to="/request">
            Gửi yêu cầu mua hộ <Icon />
          </Link>
          <Link className="secondary" to="/how-it-works">
            Xem cách hoạt động
          </Link>
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
        <div className="journey" aria-label="Quy trình mua hộ">
          <div className="journeyTop">
            <Icon kind="box" />
            <span>
              Từ món hàng bạn muốn
              <br />
              <strong>đến tận tay bạn.</strong>
            </span>
          </div>
          <ol>
            {[
              [
                "01",
                "Bạn gửi yêu cầu",
                "Tên sản phẩm hoặc link, số lượng, biến thể.",
              ],
              [
                "02",
                "Xem và duyệt báo giá",
                "Chi phí dự kiến và điều khoản trước khi cọc.",
              ],
              [
                "03",
                "Mua và kiểm hàng",
                "Nhân viên mua hộ, nhận kho và đóng gói.",
              ],
              [
                "04",
                "Thanh toán số dư, nhận hàng",
                "Tổng cuối đã duyệt, trả đủ trước xuất gửi.",
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
          <div className="journeyFoot">
            <span>
              Cọc <strong>50%</strong>
            </span>
            <p>
              Theo báo giá bạn đã chấp nhận.
              <br />
              Số dư tính theo chi phí cuối đã duyệt.
            </p>
          </div>
        </div>
      </section>
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
                <span className="parcelGraphic">
                  <span />
                  <span />
                  <span />
                </span>
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
        <h2>Rõ ràng trước mỗi quyết định.</h2>
        <div className="featureRow">
          <article>
            <h3>Chưa có link? Vẫn gửi được.</h3>
            <p>
              Mô tả món hàng, mẫu mã và ngân sách. Nhân viên sẽ làm rõ trước khi
              báo giá.
            </p>
          </article>
          <article>
            <h3>Biết tiền đi đâu.</h3>
            <p>
              Giá hàng, phí mua hộ và vận chuyển được tách riêng. Khoản chưa xác
              định được ghi là ước tính.
            </p>
          </article>
          <article>
            <h3>Theo dõi một nơi.</h3>
            <p>
              Báo giá, thanh toán, tình trạng kiểm hàng và vận đơn nằm trong đơn
              của bạn.
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
  const { orders, error } = useOrders(user);
  const location = useLocation();
  const selectedId = location.pathname.match(
    /^\/account\/orders\/([a-zA-Z0-9-]+)$/,
  )?.[1];
  const visibleOrders = selectedId
    ? orders.filter((o) => o.id === selectedId)
    : orders;
  return (
    <section className="page">
      <div className="pageHeading">
        <div>
          <h1>Đơn của tôi</h1>
          <Link to="/account/profile">Hồ sơ và địa chỉ</Link>
          <Link to="/account/security">Bảo mật tài khoản</Link>
          <p>Báo giá, thanh toán và hành trình hàng về.</p>
        </div>
        <Link className="primary" to="/request">
          Yêu cầu mới <Icon kind="plus" />
        </Link>
      </div>
      {!user ? (
        <div className="empty">
          <Icon kind="box" />
          <h2>Đăng nhập để xem đơn của bạn</h2>
          <button
            className="primary"
            disabled={!configured}
            onClick={() => void signIn()}
          >
            Đăng nhập với Google
          </button>
        </div>
      ) : visibleOrders.length ? (
        <>
          {visibleOrders.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
          {user && (
            <>
              <CustomerShipments uid={user.uid} />
              <Notifications uid={user.uid} />
            </>
          )}
        </>
      ) : (
        <div className="empty">
          <Icon kind="box" />
          <h2>{error ? "Chưa tải được đơn hàng" : "Chưa có yêu cầu nào"}</h2>
          <p>{error || "Bắt đầu bằng món hàng bạn muốn mua."}</p>
          <Link to="/request">Gửi yêu cầu mua hộ</Link>
        </div>
      )}
    </section>
  );
}
function OrderCard({ order: o }: { order: Order }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
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
  const total = o.quote ? quoteTotal(o.quote) : undefined;
  return (
    <article className="panel order">
      <div className="pageHeading">
        <h2>{o.items[0]?.name}</h2>
        <span className="statusTag">{stageLabels[o.stage]}</span>
      </div>
      <p>
        {o.market} · {new Intl.DateTimeFormat("vi-VN").format(o.createdAt)} ·{" "}
        {o.items.reduce((s, i) => s + i.quantity, 0)} sản phẩm
      </p>
      {o.quote && (
        <>
          <h3>Sản phẩm trong báo giá đã chấp nhận</h3>
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
            Điều khoản: {o.quote.termsVersion} · Báo giá v{o.quoteVersion} · Hết
            hạn {new Date(o.quote.expiresAt).toLocaleString("vi-VN")}
          </p>
        </>
      )}
      {o.stage === "QUOTED" && (
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
          Cọc cần xác nhận: <strong>{money(o.deposit)}</strong> · Đã thu ròng:{" "}
          <strong>{money(o.collected - o.refunded)}</strong>
        </p>
      )}
      {o.consolidatedFreight && (
        <p>
          Cước quốc tế phân bổ từ lô gom: {money(o.consolidatedFreight.amount)}.
          Tổng cuối cần được duyệt trước khi xuất gửi.
        </p>
      )}
      {o.finalTotal !== undefined && (
        <p>
          Tổng cuối: {money(o.finalTotal)} · Còn thu:{" "}
          <strong>
            {money(Math.max(0, o.finalTotal - o.collected + o.refunded))}
          </strong>
        </p>
      )}
      {o.stage === "PACKED" && o.finalApproved === false && (
        <button disabled={busy} onClick={() => void act("approveFinal", {})}>
          Duyệt tổng phí cuối
        </button>
      )}
      <CustomerChanges order={o} />
      <TransferNotice order={o} />
      <OrderTools order={o} />
      {o.hold && <p className="error">Tạm giữ: {o.hold}</p>}
      {o.tracking && <p>Vận đơn: {o.tracking} · Cập nhật bởi nhân viên</p>}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </article>
  );
}
function Staff({ user }: { user: User | null }) {
  const [access, setAccess] = useState<{
      roles?: string[];
      active?: boolean;
      locked?: boolean;
    } | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    if (!user || !db) {
      setAccess(null);
      return;
    }
    return onSnapshot(
      doc(db, "staffAccess", user.uid),
      (s) => setAccess(s.data() ?? null),
      () => setError("Không thể kiểm tra quyền nhân viên."),
    );
  }, [user]);
  return (
    <section className="page">
      <h1>Không gian vận hành</h1>
      {error ? (
        <p role="alert">{error}</p>
      ) : !access?.active || access?.locked ? (
        <div className="empty">
          <h2>Cần tài khoản nhân viên được cấp quyền</h2>
          <p>
            Quyền vận hành do chủ doanh nghiệp cấp. Đăng nhập khách hàng không
            cấp quyền nhân viên.
          </p>
        </div>
      ) : (
        <>
          {access.roles?.some((r) =>
            ["OWNER", "OPERATIONS_MANAGER"].includes(r),
          ) && <Dashboard />}
          {access.roles?.some((r) =>
            ["OWNER", "WAREHOUSE", "OPERATIONS_MANAGER"].includes(r),
          ) && <Shipping roles={access.roles ?? []} />}
          {access.roles?.includes("OWNER") && (
            <>
              <Settings />
              <StaffAccess />
              <PlanEditor />
            </>
          )}
          {access.roles?.some((r) => ["OWNER", "FINANCE"].includes(r)) && (
            <Finance />
          )}
          {access.roles?.some((r) =>
            ["OWNER", "SUPPORT", "OPERATIONS_MANAGER"].includes(r),
          ) && (
            <>
              <Customer />
              <StaffSupport />
            </>
          )}
          {access.roles?.some((r) =>
            ["OWNER", "OPERATIONS_MANAGER"].includes(r),
          ) && <ChangeQueue />}
          <p>Quyền hiện hành: {access.roles?.join(", ")}</p>
          {access.roles?.some((r) =>
            [
              "OWNER",
              "OPERATIONS_MANAGER",
              "BUYER",
              "WAREHOUSE",
              "FINANCE",
              "SUPPORT",
            ].includes(r),
          ) && <Workbench roles={access.roles ?? []} />}
          {access.roles?.some((r) =>
            ["OWNER", "CONTENT_EDITOR"].includes(r),
          ) && (
            <>
              <ContentEditor />
              <Campaigns />
            </>
          )}
        </>
      )}
    </section>
  );
}

function PublicPage() {
  const path = useLocation().pathname.slice(1);
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

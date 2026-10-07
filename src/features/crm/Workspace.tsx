import { CrmHeaderTarget } from "./CrmPresentation";
import type { User } from "firebase/auth";
import { AccountProfile } from "../../app/SiteChrome";
import { LoadingState } from "../../shared/Loading";
import { Documents } from "../invoices/Documents";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import "./Workspace.css";
import "./crm-ux028.css";
import {
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
const Dashboard = lazy(() =>
  import("./Dashboard").then((m) => ({ default: m.Dashboard })),
);
const Customer = lazy(() =>
  import("./Customer").then((m) => ({ default: m.Customer })),
);
const Customers = lazy(() =>
  import("./Customers").then((m) => ({ default: m.Customers })),
);
const Workbench = lazy(() =>
  import("../operations/Workbench").then((m) => ({ default: m.Workbench })),
);
const Returns = lazy(() =>
  import("../operations/Returns").then((m) => ({ default: m.Returns })),
);
const Shipping = lazy(() =>
  import("../shipping/Shipping").then((m) => ({ default: m.Shipping })),
);
const Refunds = lazy(() =>
  import("../payments/Refunds").then((m) => ({ default: m.Refunds })),
);
const Finance = lazy(() =>
  import("../payments/Finance").then((m) => ({ default: m.Finance })),
);
const StaffSupport = lazy(() =>
  import("../support/Thread").then((m) => ({ default: m.StaffSupport })),
);
const Settings = lazy(() =>
  import("../settings/Settings").then((m) => ({ default: m.Settings })),
);
const StaffAccess = lazy(() =>
  import("../settings/StaffAccess").then((m) => ({ default: m.StaffAccess })),
);
const PlanEditor = lazy(() =>
  import("../membership/PlanEditor").then((m) => ({ default: m.PlanEditor })),
);
const ChangeQueue = lazy(() =>
  import("../orders/Changes").then((m) => ({ default: m.ChangeQueue })),
);
const ShippingRates = lazy(() =>
  import("../shipping/ShippingRates").then((m) => ({
    default: m.ShippingRates,
  })),
);
const Studio = lazy(() =>
  import("../content/studio/Studio").then((m) => ({ default: m.Studio })),
);
const ContentEditor = lazy(() =>
  import("../content/ContentEditor").then((m) => ({
    default: m.ContentEditor,
  })),
);
const Campaigns = lazy(() =>
  import("../content/Campaigns").then((m) => ({ default: m.Campaigns })),
);
const Activity = lazy(() =>
  import("./Activity").then((m) => ({ default: m.Activity })),
);

const operational = [
  "OWNER",
  "OPERATIONS_MANAGER",
  "BUYER",
  "WAREHOUSE",
  "FINANCE",
  "SUPPORT",
];
const crm = ["OWNER", "OPERATIONS_MANAGER", "SUPPORT"];
function NavIcon({ path }: { path: string }) {
  const drawing =
    path === "overview" ? (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ) : ["customers", "staff", "membership"].includes(path) ? (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6m3 10v-3a6 6 0 0 0-2-4" />
      </>
    ) : ["support", "campaigns"].includes(path) ? (
      <path d="M21 11a8 8 0 0 1-8 8H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4ZM7 8h10M7 12h6" />
    ) : ["follow-ups", "activity"].includes(path) ? (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v4M17 3v4M3 11h18M7 15h3M14 15h3" />
      </>
    ) : ["finance", "refunds", "documents"].includes(path) ? (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h4" />
      </>
    ) : path === "settings" ? (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" />
      </>
    ) : (
      <>
        <path d="m3 7 9-4 9 4v10l-9 4-9-4ZM3 7l9 4 9-4M12 11v10" />
      </>
    );
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {drawing}
    </svg>
  );
}
export const workspacePages = [
  {
    path: "documents",
    label: "Hóa đơn",
    group: "Tài chính",
    roles: ["OWNER", "FINANCE", "SUPPORT"],
  },
  {
    path: "overview",
    label: "Tổng quan",
    group: "Vận hành",
    roles: ["OWNER", "OPERATIONS_MANAGER"],
  },
  {
    path: "orders",
    label: "Yêu cầu & báo giá",
    group: "Vận hành",
    roles: operational,
  },
  {
    path: "purchasing",
    label: "Mua hàng",
    group: "Vận hành",
    roles: ["OWNER", "OPERATIONS_MANAGER", "BUYER"],
  },
  {
    path: "warehouse",
    label: "Nhận kho & đóng gói",
    group: "Vận hành",
    roles: ["OWNER", "WAREHOUSE", "OPERATIONS_MANAGER"],
  },
  {
    path: "returns",
    label: "Nhận & kiểm tra hàng trả",
    group: "Vận hành",
    roles: ["OWNER", "WAREHOUSE", "OPERATIONS_MANAGER"],
  },
  {
    path: "shipping",
    label: "Kiện & vận chuyển",
    group: "Vận hành",
    roles: ["OWNER", "WAREHOUSE", "OPERATIONS_MANAGER"],
  },
  {
    path: "changes",
    label: "Thay đổi chờ áp dụng",
    group: "Vận hành",
    roles: ["OWNER", "OPERATIONS_MANAGER"],
  },
  {
    path: "refunds",
    label: "Yêu cầu hoàn tiền",
    group: "Tài chính",
    roles: ["OWNER", "FINANCE"],
  },
  {
    path: "finance",
    label: "Thanh toán & đối soát",
    group: "Tài chính",
    roles: ["OWNER", "FINANCE"],
  },
  { path: "customers", label: "Khách hàng", group: "Khách hàng", roles: crm },
  {
    path: "follow-ups",
    label: "Lịch chăm sóc",
    group: "Khách hàng",
    roles: crm,
  },
  {
    path: "support",
    label: "Hội thoại hỗ trợ",
    group: "Khách hàng",
    roles: crm,
  },
  {
    path: "content",
    label: "Sản phẩm & bài viết",
    group: "Nội dung",
    roles: ["OWNER", "CONTENT_EDITOR"],
  },
  {
    path: "campaigns",
    label: "Chiến dịch",
    group: "Nội dung",
    roles: ["OWNER", "CONTENT_EDITOR"],
  },
  {
    path: "membership",
    label: "Gói thành viên",
    group: "Quản trị",
    roles: ["OWNER"],
  },
  {
    path: "staff",
    label: "Nhân viên & quyền",
    group: "Quản trị",
    roles: ["OWNER"],
  },
  {
    path: "activity",
    label: "Nhật ký & thông báo",
    group: "Quản trị",
    roles: ["OWNER", "OPERATIONS_MANAGER"],
  },
  {
    path: "studio",
    label: "Blog Studio",
    group: "Nội dung",
    roles: ["OWNER", "CONTENT_EDITOR"],
  },
  {
    path: "shipping-rates",
    label: "Biểu phí vận chuyển",
    group: "Quản trị",
    roles: ["OWNER"],
  },
  { path: "settings", label: "Cấu hình", group: "Quản trị", roles: ["OWNER"] },
];
export function Workspace({
  roles,
  uid,
  user,
  name,
  signOut,
  busy,
}: {
  roles: string[];
  uid: string;
  user: User;
  name: string;
  signOut: () => void;
  busy: boolean;
}) {
  const pages = workspacePages.filter((p) =>
    p.roles.some((r) => roles.includes(r)),
  );
  const defaultPage = pages.find((p) => p.path === "overview") ?? pages[0];
  const { pathname } = useLocation();
  const current = pages.find(
    (p) =>
      pathname === `/crm/${p.path}` || pathname.startsWith(`/crm/${p.path}/`),
  );
  const [menu, setMenu] = useState(false);
  const [headerTarget, setHeaderTarget] = useState<HTMLDivElement | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (menu) dialog.current?.showModal();
    else dialog.current?.close();
  }, [menu]);
  const navigation = (
    <nav aria-label="Không gian vận hành">
      {["Vận hành", "Khách hàng", "Tài chính", "Nội dung", "Quản trị"]
        .filter((group) => pages.some((p) => p.group === group))
        .map((group) => (
          <div key={group} className="workspaceNavGroup">
            <p>{group}</p>
            {pages
              .filter((p) => p.group === group)
              .map((p) => (
                <NavLink
                  key={p.path}
                  to={`/crm/${p.path}`}
                  onClick={() => setMenu(false)}
                >
                  <span className="workspaceNavMark" aria-hidden="true">
                    <NavIcon path={p.path} />
                  </span>
                  <span>{p.label}</span>
                </NavLink>
              ))}
          </div>
        ))}
    </nav>
  );
  function screen(path: string) {
    switch (path) {
      case "documents":
        return <Documents staff />;
      case "overview":
        return <Dashboard />;
      case "orders":
        return <Workbench key={pathname} roles={roles} />;
      case "purchasing":
        return <Workbench key={pathname} roles={roles} queue="purchasing" />;
      case "warehouse":
        return <Workbench key={pathname} roles={roles} queue="warehouse" />;
      case "returns":
        return <Returns roles={roles} />;
      case "shipping":
        return <Shipping roles={roles} />;
      case "changes":
        return <ChangeQueue />;
      case "refunds":
        return <Refunds />;
      case "finance":
        return <Finance />;
      case "customers":
        return <Customers key="customers" />;
      case "follow-ups":
        return <Customers key="follow-ups" followUps uid={uid} />;
      case "support":
        return <StaffSupport />;
      case "content":
        return <ContentEditor />;
      case "campaigns":
        return <Campaigns />;
      case "membership":
        return <PlanEditor />;
      case "staff":
        return <StaffAccess />;
      case "activity":
        return <Activity />;
      case "shipping-rates":
        return <ShippingRates staff />;
      case "studio":
        return <Studio uid={uid} roles={roles} name={name} />;
      case "settings":
        return <Settings />;
      default:
        return null;
    }
  }
  if (current?.path === "studio") {
    return (
      <Suspense
        fallback={<LoadingState variant="panel">Đang mở Studio…</LoadingState>}
      >
        <Studio uid={uid} roles={roles} name={name} />
      </Suspense>
    );
  }
  return (
    <section className="workspaceShell">
      <aside className="workspaceSidebar">
        <Link className="workspaceBrand" to="/crm">
          Satsunic<span>Go</span>
          <small>CRM</small>
        </Link>
        {navigation}
        <div className="workspaceSidebarBottom">
          <Link to="/account/security">Bảo mật tài khoản</Link>
          <Link to="/">Xem website ↗</Link>
        </div>
      </aside>
      <div className="workspaceMain">
        <header className="workspaceTop">
          <button
            type="button"
            className="workspaceMenuButton"
            aria-label="Mở menu vận hành"
            aria-haspopup="dialog"
            onClick={() => setMenu(true)}
          >
            ☰
          </button>
          <div className="workspaceContext" ref={setHeaderTarget}>
            <h1 className="crmHeaderFallback">
              {current?.label ?? "Khách hàng"}
            </h1>
          </div>
          <AccountProfile
            user={user}
            signOut={async () => {
              await signOut();
            }}
            busy={busy}
            onOpen={() => setMenu(false)}
            navigationOpen={menu}
          />
        </header>
        <CrmHeaderTarget.Provider value={headerTarget}>
          <div className="workspaceContent">
            <Suspense
              fallback={
                <LoadingState variant="panel">Đang mở công việc…</LoadingState>
              }
            >
              <Routes>
                <Route
                  index
                  element={
                    defaultPage ? (
                      <Navigate replace to={defaultPage.path} />
                    ) : (
                      <p>Chưa có công việc trong phạm vi được cấp.</p>
                    )
                  }
                />
                {pages.map((p) => (
                  <Route
                    key={p.path}
                    path={`${p.path}/*`}
                    element={screen(p.path)}
                  />
                ))}
                {pages.some((p) => p.path === "customers") && (
                  <Route
                    path="customers/:id"
                    element={<Customer key={pathname} />}
                  />
                )}
                <Route
                  path="*"
                  element={
                    <div className="empty">
                      <h1>Không thể mở công việc này</h1>
                      <p>
                        Kiểm tra quyền hiện hành hoặc chọn công việc trong menu.
                      </p>
                      <Link to="/crm">Về không gian vận hành</Link>
                    </div>
                  }
                />
              </Routes>
            </Suspense>
          </div>
        </CrmHeaderTarget.Provider>
      </div>
      <dialog
        className="workspaceDialog"
        ref={dialog}
        onCancel={() => setMenu(false)}
        onClose={() => setMenu(false)}
      >
        <div className="pageHeading">
          <strong>Menu vận hành</strong>
          <button autoFocus type="button" onClick={() => setMenu(false)}>
            Đóng menu
          </button>
        </div>
        {navigation}
      </dialog>
    </section>
  );
}

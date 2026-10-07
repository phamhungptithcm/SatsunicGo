import "./account-rail.css";
import { Link } from "react-router-dom";
import { preloadNavigation } from "../../app/route-modules";
function RailIcon({
  kind,
}: {
  kind:
    | "orders"
    | "shipments"
    | "notifications"
    | "documents"
    | "profile"
    | "security"
    | "support";
}) {
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
      {kind === "orders" ? (
        <>
          <path d="m12 3 9 5-9 5-9-5 9-5Z" />
          <path d="M3 8v9l9 5 9-5V8M12 13v9M7 5l9 5" />
        </>
      ) : kind === "shipments" ? (
        <>
          <path d="M3 5h11v12H3zM14 9h4l3 4v4h-7" />
          <circle cx="7" cy="18" r="2" />
          <circle cx="18" cy="18" r="2" />
        </>
      ) : kind === "notifications" ? (
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
      ) : kind === "documents" ? (
        <>
          <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3ZM9 8h6M9 12h6" />
        </>
      ) : kind === "profile" ? (
        <>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
        </>
      ) : kind === "security" ? (
        <>
          <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" />
          <path d="m9 12 2 2 4-4" />
        </>
      ) : (
        <>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="4" />
          <path d="m6 6 3 3m6 6 3 3M6 18l3-3m6-6 3-3" />
        </>
      )}
    </svg>
  );
}
export function AccountRail({
  active,
}: {
  active: "orders" | "shipments" | "notifications" | "profile" | "security";
}) {
  return (
    <aside
      className="customerRail"
      onPointerOver={preloadNavigation}
      onFocusCapture={preloadNavigation}
    >
      <span className="customerRailLabel">TÀI KHOẢN</span>
      <nav aria-label="Không gian khách hàng">
        <Link
          to="/account"
          aria-current={active === "orders" ? "page" : undefined}
        >
          <RailIcon kind="orders" />
          Đơn của tôi
        </Link>
        <Link
          to="/account?view=shipments"
          aria-current={active === "shipments" ? "page" : undefined}
        >
          <RailIcon kind="shipments" />
          Vận chuyển
        </Link>
        <Link
          to="/account?view=notifications"
          aria-current={active === "notifications" ? "page" : undefined}
        >
          <RailIcon kind="notifications" />
          Thông báo
        </Link>
        <div className="customerRailDivider" />
        <Link className="customerSecondary" to="/account/documents">
          <RailIcon kind="documents" />
          Chứng từ của tôi
        </Link>
        <Link
          className="customerSecondary"
          to="/account/profile"
          aria-current={active === "profile" ? "page" : undefined}
        >
          <RailIcon kind="profile" />
          Hồ sơ và địa chỉ
        </Link>
        <Link
          className="customerSecondary"
          to="/account/security"
          aria-current={active === "security" ? "page" : undefined}
        >
          <RailIcon kind="security" />
          Bảo mật tài khoản
        </Link>
      </nav>
      <Link className="customerHelp" to="/support">
        <span className="customerHelpLabel">
          <RailIcon kind="support" />
          Cần hỗ trợ?
        </span>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          aria-hidden="true"
        >
          <path d="M5 12h14m-6-6 6 6-6 6" />
        </svg>
      </Link>
    </aside>
  );
}

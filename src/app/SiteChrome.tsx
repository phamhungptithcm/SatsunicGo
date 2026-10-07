import { staffRoles } from "../shared/staff-access";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import type { User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../shared/firebase";
import { preloadNavigation } from "./route-modules";
import { useCart } from "../features/cart/cart-store";
import { CartIcon } from "../features/cart/AddToCart";
const navigation = [
  ["Sản phẩm", "/products"],
  ["Mua hộ", "/request"],
  ["Biểu phí", "/fees"],
  ["Membership", "/membership"],
  ["Bài viết", "/posts"],
  ["Hỗ trợ", "/support"],
] as const;
const accountNavigation = [
  ["Hồ sơ và địa chỉ", "/account/profile"],
  ["Đơn của tôi", "/account"],
  ["Gửi yêu cầu mua hộ", "/request"],
  ["Membership", "/membership"],
  ["Hỗ trợ", "/support"],
  ["Bảo mật tài khoản", "/account/security"],
] as const;
export function AccountProfile({
  user,
  signOut,
  busy,
  onOpen,
  navigationOpen,
}: {
  user: User;
  signOut: () => Promise<void>;
  busy: boolean;
  onOpen: () => void;
  navigationOpen: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [failedPhoto, setFailedPhoto] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const google = user.providerData.find(
    (provider) => provider.providerId === "google.com",
  );
  const name =
    google?.displayName?.trim() ||
    user.displayName?.trim() ||
    "Tài khoản của bạn";
  const photo = google?.photoURL || user.photoURL;
  const email = google?.email?.trim() || user.email?.trim();
  const safePhoto = photo?.startsWith("https://") ? photo : null;
  const initials =
    name === "Tài khoản của bạn"
      ? "SG"
      : name
          .split(/\s+/)
          .slice(0, 2)
          .map((word) => Array.from(word)[0])
          .join("")
          .toLocaleUpperCase("vi-VN");
  useEffect(() => {
    setOpen(false);
  }, [location.key, user.uid]);
  useEffect(() => {
    if (navigationOpen) setOpen(false);
  }, [navigationOpen]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target))
        setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  return (
    <div
      className="accountProfile"
      ref={root}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        type="button"
        className="accountProfileTrigger"
        ref={trigger}
        aria-expanded={open}
        aria-controls="customer-account-navigation"
        aria-label={
          name === "Tài khoản của bạn" ? name : `Tài khoản của ${name}`
        }
        onClick={() => {
          if (!open) onOpen();
          setOpen((value) => !value);
        }}
      >
        <span className="accountAvatar" aria-hidden="true">
          {safePhoto && failedPhoto !== safePhoto ? (
            <img
              src={safePhoto}
              alt=""
              width="36"
              height="36"
              referrerPolicy="no-referrer"
              onError={() => setFailedPhoto(safePhoto)}
            />
          ) : (
            initials
          )}
        </span>
        <span className="accountProfileName">{name}</span>
        <svg
          className="accountChevron"
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m4 6 4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div
          className="accountDropdown"
          onPointerOver={preloadNavigation}
          onFocusCapture={preloadNavigation}
        >
          <div className="accountIdentity">
            <strong>{name}</strong>
            {email && <span>{email}</span>}
            {google && <span>Google</span>}
          </div>
          <nav
            id="customer-account-navigation"
            aria-label="Chức năng tài khoản"
          >
            {accountNavigation.map(([label, path]) => (
              <Link key={path} to={path} onClick={() => setOpen(false)}>
                {label}
                <span aria-hidden="true">↗</span>
              </Link>
            ))}
          </nav>
          <div className="accountSignOut">
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setOpen(false);
                void signOut();
              }}
            >
              {busy ? "Đang đăng xuất…" : "Đăng xuất"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export function SiteHeader({
  user,
  signOut,
  busy,
}: {
  user: User | null;
  signOut: () => Promise<void>;
  busy: boolean;
}) {
  const { cart, loading, error, cached } = useCart();
  const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    let small = false;
    const scroll = () => {
      if (window.scrollY > 32) small = true;
      else if (window.scrollY < 8) small = false;
      setCompact(small);
    };
    scroll();
    window.addEventListener("scroll", scroll, { passive: true });
    return () => window.removeEventListener("scroll", scroll);
  }, []);
  const [staffId, setStaffId] = useState("");
  useEffect(() => {
    if (!user || !db) return;
    return onSnapshot(
      doc(db, "staffAccess", user.uid),
      (s) => setStaffId(staffRoles(s.data()) !== null ? user.uid : ""),
      () => setStaffId(""),
    );
  }, [user]);
  const { pathname } = useLocation();
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    const media = window.matchMedia("(min-width: 1201px)");
    const resize = () => {
      if (media.matches) setOpen(false);
    };
    const outside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !header.current?.contains(event.target)
      )
        setOpen(false);
    };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", outside);
    media.addEventListener("change", resize);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("pointerdown", outside);
      media.removeEventListener("change", resize);
    };
  }, [open]);
  return (
    <header
      ref={header}
      className="topbar"
      data-menu-open={open}
      data-compact={compact}
    >
      <div className="navShell">
        <Link
          className="brand"
          to="/"
          aria-label="SatsunicGo — Trang chủ"
          onClick={() => setOpen(false)}
        >
          <svg
            className="brandMark"
            viewBox="0 0 32 32"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m16 3 12 7-12 7-12-7 12-7Z" />
            <path d="M4 10v13l12 7 12-7V10M16 17v13M10 6l12 7" />
          </svg>
          <span className="brandWord">
            Satsunic<span>Go</span>
          </span>
        </Link>
        <nav
          id="primary-navigation"
          aria-label="Điều hướng chính"
          data-open={open}
          onPointerOver={preloadNavigation}
          onFocusCapture={preloadNavigation}
        >
          {navigation.map(([label, path]) => (
            <NavLink key={path} to={path} onClick={() => setOpen(false)}>
              {label}
            </NavLink>
          ))}
          {user && staffId === user.uid && (
            <NavLink to="/crm" onClick={() => setOpen(false)}>
              CRM
            </NavLink>
          )}
        </nav>
        <div className="headerActions">
          <NavLink
            className="headerCart107"
            to="/cart"
            onClick={() => setOpen(false)}
            aria-label={
              error
                ? "Giỏ hàng chưa tải được"
                : loading
                  ? "Giỏ hàng đang tải"
                  : cached
                    ? `Giỏ hàng, ${cartCount} sản phẩm từ bản lưu`
                    : `Giỏ hàng, ${cartCount} sản phẩm`
            }
          >
            <CartIcon />
            {!loading && !error && cartCount > 0 && (
              <span aria-hidden="true">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </NavLink>
          <Link
            className="headerRequest"
            to="/request"
            onPointerEnter={preloadNavigation}
            onFocus={preloadNavigation}
          >
            Mua hộ <span aria-hidden="true">↗</span>
          </Link>
          {user && (
            <AccountProfile
              key={user.uid}
              user={user}
              signOut={signOut}
              busy={busy}
              onOpen={() => setOpen(false)}
              navigationOpen={open}
            />
          )}
          <button
            type="button"
            className="menuToggle"
            ref={toggle}
            aria-controls="primary-navigation"
            aria-expanded={open}
            aria-label={open ? "Đóng menu" : "Mở menu"}
            onClick={() => setOpen((value) => !value)}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
export function SiteFooter() {
  return (
    <footer className="siteFooter compactFooter">
      <div className="compactFooterInner">
        <div className="footerBrandBlock">
          <Link className="brand" to="/">
            Satsunic<span>Go</span>
          </Link>
          <span className="footerAttribution">by HunpeoLabs</span>
        </div>
        <nav aria-label="Thông tin và hỗ trợ">
          <Link to="/support">Hỗ trợ</Link>
          <Link to="/privacy">Quyền riêng tư</Link>
          <Link to="/terms">Điều khoản & hoàn tiền</Link>
          <Link to="/restricted">Hàng hạn chế</Link>
        </nav>
      </div>
      <div className="footerLegalRow">
        <p>© {new Date().getFullYear()} HunpeoLabs.</p>
      </div>
    </footer>
  );
}

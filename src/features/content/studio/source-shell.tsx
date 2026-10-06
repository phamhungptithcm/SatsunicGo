import { useState, type ReactNode, type MouseEvent } from "react";
import { BlogIcon, Avatar } from "./source-ui";
import { BlogDialog as StudioDialog } from "./source-dialog";
import "./source-design.css";
const safeAvatar = (url?: string) => {
  try {
    const u = new URL(url ?? "");
    return u.protocol === "https:" &&
      u.hostname.endsWith(".googleusercontent.com") &&
      !u.username &&
      !u.password
      ? u.href
      : undefined;
  } catch {
    return undefined;
  }
};
function StudioLink({
  href,
  navigate,
  children,
  ...props
}: {
  href: string;
  navigate: (path: string) => void;
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <a
      {...props}
      href={href}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
          return;
        e.preventDefault();
        navigate(href);
      }}
    >
      {children}
    </a>
  );
}
function BlogBrand({ navigate }: { navigate: (path: string) => void }) {
  return (
    <div className="studio-brand">
      <StudioLink
        className="brand"
        href="/crm/studio"
        navigate={navigate}
        aria-label="Hunpeo Labs"
      >
        <span className="brand__mark" aria-hidden="true">
          <span />
          <span />
        </span>
        <span>Hunpeo Labs</span>
      </StudioLink>
      <span className="studio-brand__label">Studio</span>
    </div>
  );
}
function SourceDialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <StudioDialog title={title} onClose={onClose}>
      {children}
    </StudioDialog>
  );
}
function StudioLinks({
  path,
  role,
  navigate,
  pendingTarget,
}: {
  path: string;
  pendingTarget?: string | null;
  role?: string;
  navigate: (path: string) => void;
}) {
  return (
    <nav className="side-nav" aria-label="Studio">
      {[
        ["/crm/studio", "file", "Bài viết"],
        ["/crm/studio/comments", "comment", "Bình luận"],
        ["/crm/studio/settings", "settings", "Cài đặt"],
        ["/posts", "external", "Xem blog"],
        ["/crm/studio/account", "users", "Tài khoản"],
      ]
        .filter(([href]) =>
          href === "/crm/studio/settings"
            ? role === "admin"
            : href === "/crm/studio/comments"
              ? role === "admin" || role === "publisher"
              : true,
        )
        .map(([href, icon, label]) => (
          <StudioLink
            key={href}
            className={path === href ? "active" : ""}
            href={href}
            navigate={navigate}
          >
            <BlogIcon name={icon} size={16} />
            {label}
            <span
              className={`studio-navigation-hint${pendingTarget === href ? " is-pending" : ""}`}
              aria-hidden="true"
            />
          </StudioLink>
        ))}
    </nav>
  );
}
export function StudioShell({
  children,
  user,
  path,
  navigate,
  pendingTarget,
}: {
  children: ReactNode;
  path: string;
  pendingTarget?: string | null;
  navigate: (path: string) => void;
  user: { name: string; role: string; avatar?: string } | null;
}) {
  const [menu, setMenu] = useState(false);
  const [failedAvatar, setFailedAvatar] = useState("");
  const avatar = safeAvatar(user?.avatar);
  const editor =
    /^\/crm\/studio\/(?!comments$|settings$|account$|login$|new$)[^/]+$/.test(
      path,
    );
  if (editor || path.endsWith("/preview") || path.endsWith("/login"))
    return (
      <div className="blog-surface" lang="vi">
        {children}
      </div>
    );
  return (
    <div className="blog-surface" lang="vi">
      <div className="studio">
        <aside className="sidebar">
          <BlogBrand navigate={navigate} />
          <div>
            <div className="sidebar-label">Không gian biên tập</div>
            <StudioLinks
              path={path}
              role={user?.role}
              navigate={navigate}
              pendingTarget={pendingTarget}
            />
          </div>
          <div className="sidebar-bottom">
            <StudioLink className="arrow-link" href="/crm" navigate={navigate}>
              <BlogIcon name="back" size={15} /> Trở về CRM
            </StudioLink>
            <StudioLink
              className="workspace-user"
              href="/crm/studio/account"
              navigate={navigate}
            >
              {avatar && avatar !== failedAvatar ? (
                <img
                  className="workspace-avatar"
                  src={avatar}
                  alt=""
                  referrerPolicy="no-referrer"
                  onError={() => setFailedAvatar(avatar)}
                />
              ) : (
                <Avatar name={user?.name ?? "?"} className="dark" />
              )}
              <div className="workspace-identity">
                <span className="workspace-name">
                  {user?.name ?? "Tài khoản"}
                </span>
                <small
                  style={{
                    display: "block",
                    color: "var(--muted)",
                    fontSize: 10,
                  }}
                >
                  {user
                    ? ({
                        admin: "Quản trị viên",
                        publisher: "Người duyệt",
                        author: "Tác giả",
                      }[user.role] ?? "Độc giả")
                    : "Đăng nhập"}
                </small>
              </div>
              <BlogIcon name="arrow" size={15} />
            </StudioLink>
          </div>
        </aside>
        <div className="studio-main">
          <header className="studio-top">
            <div className="flex">
              <button
                className="mobile-only"
                onClick={() => setMenu(true)}
                aria-label="Mở menu Studio"
              >
                <BlogIcon name="grid" />
              </button>
              <span>Studio</span>
              <span>/</span>
              <span>
                {path.endsWith("comments")
                  ? "Bình luận"
                  : path.endsWith("account")
                    ? "Tài khoản"
                    : path.endsWith("settings")
                      ? "Cài đặt"
                      : "Bài viết"}
              </span>
            </div>
            <StudioLink
              href="/posts"
              navigate={navigate}
              className="arrow-link"
            >
              Xem blog <BlogIcon name="external" size={13} />
            </StudioLink>
          </header>
          <div className="studio-content">{children}</div>
          <footer className="studio-footer">
            <span className="studio-footer-credit">
              <strong>Hunpeo Labs</strong>
              <span>© {new Date().getFullYear()}</span>
            </span>
            <nav aria-label="Liên kết cuối trang">
              <StudioLink href="/privacy" navigate={navigate}>
                Quyền riêng tư
              </StudioLink>
              <StudioLink href="/posts" navigate={navigate}>
                Ghé thăm blog <BlogIcon name="external" size={12} />
              </StudioLink>
            </nav>
          </footer>
        </div>
      </div>
      {menu && (
        <SourceDialog title="Studio" onClose={() => setMenu(false)}>
          <StudioLinks
            path={path}
            role={user?.role}
            navigate={navigate}
            pendingTarget={pendingTarget}
          />
          <StudioLink className="arrow-link" href="/crm" navigate={navigate}>
            <BlogIcon name="back" size={15} /> Trở về CRM
          </StudioLink>
        </SourceDialog>
      )}
    </div>
  );
}

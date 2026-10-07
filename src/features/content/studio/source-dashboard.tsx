"use client";
import { BlogToast, useToastNotice } from "./toast";
import {
  useEffect,
  useState,
  useSyncExternalStore,
  type AnchorHTMLAttributes,
} from "react";

import { scheduleLabel } from "./schedule-time";
import type { StudioPost as Post } from "../../../../packages/domain/blog-studio";
type WorkspacePost = Post & { schedule?: { dueAt: string; revision: number } };
const message = (error: unknown) =>
  error instanceof Error ? error.message : "Chưa thực hiện được thao tác.";
import { Avatar, Cover, BlogIcon, StatusBadge, stateNames } from "./source-ui";
const subscribe = () => () => {};
export function Dashboard({
  posts,
  next,
  query,
  summary,
  authors,
  router,
  request,
}: {
  router: { push: (url: string) => void; refresh: () => void };
  request: <T>(url: string, method?: string, payload?: unknown) => Promise<T>;
  posts: WorkspacePost[];
  next: string | null;
  query: { q?: string; state?: string; category?: string };
  summary: Record<string, number | null>;
  authors: Record<string, string>;
}) {
  const { notice, noticeKind, setNotice } = useToastNotice();
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  useEffect(() => {
    // The Go adapter owns global action progress.
    if (creating)
      document.documentElement.setAttribute("data-studio-pending", "true");
    return () =>
      document.documentElement.removeAttribute("data-studio-pending");
  }, [creating]);
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const filterQuery = (changes: Record<string, string>) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query))
      if (typeof value === "string" && value) params.set(key, value);
    for (const [key, value] of Object.entries(changes))
      if (value) params.set(key, value);
      else params.delete(key);
    return params;
  };
  return (
    <>
      <div className="between studio-title">
        <div>
          <div className="eyebrow muted" style={{ fontSize: 9 }}>
            Journal / Quản lý nội dung
          </div>
          <h1>Bài viết của bạn</h1>
          <p>Viết bài, sửa bản nháp và theo dõi bài đã đăng.</p>
        </div>
        <button
          className="button primary"
          disabled={!ready || creating}
          onClick={async () => {
            setCreating(true);
            try {
              const p = await request<Post>("/api/admin/blog/posts", "POST");
              router.push(`/crm/studio/${p.id}`);
            } catch (e) {
              setNotice(message(e), "error");
              setCreating(false);
            }
          }}
        >
          <BlogIcon name="plus" size={15} />
          {creating ? "Đang tạo…" : "Viết bài mới"}
        </button>
      </div>
      <div className="stats">
        <div className="stat">
          <div className="stat-label">Đã xuất bản</div>
          <span className="stat-value">
            {summary.published == null
              ? "—"
              : String(summary.published).padStart(2, "0")}
          </span>
          <span className="stat-note">Bài bạn quản lý</span>
        </div>
        <div className="stat">
          <div className="stat-label">Đang biên tập</div>
          <span className="stat-value">
            {summary.draft == null || summary.review == null
              ? "—"
              : String(summary.draft + summary.review).padStart(2, "0")}
          </span>
          <span className="stat-note">
            {summary.draft} bản nháp · {summary.review} chờ duyệt
          </span>
        </div>
        <div className="stat">
          <div className="stat-label">Bình luận chờ duyệt</div>
          <span className="stat-value">
            {summary.pending === null
              ? "—"
              : String(summary.pending).padStart(2, "0")}
          </span>
          {summary.pending !== null ? (
            <StudioLink
              navigate={router.push}
              className="stat-note"
              style={{ color: "var(--blue)" }}
              href="/crm/studio/comments"
            >
              Xem bình luận →
            </StudioLink>
          ) : (
            <span className="stat-note">Dành cho người duyệt</span>
          )}
        </div>
      </div>
      {notice && (
        <BlogToast
          text={notice}
          kind={noticeKind}
          onClose={() => setNotice("")}
        />
      )}
      <section className="panel">
        <div className="panel-top">
          <nav className="panel-tabs" aria-label="Trạng thái bài">
            {[
              ["", "Tất cả"],
              ["draft", "Bản nháp"],
              ["review", "Chờ duyệt"],
              ["published", "Đã xuất bản"],
              ["archived", "Thùng rác"],
            ].map(([state, label]) => (
              <StudioLink
                navigate={router.push}
                key={state}
                className={(query.state ?? "") === state ? "active" : ""}
                href={`/crm/studio?${filterQuery({ state })}`}
              >
                {label}
                <span className="count">
                  {state
                    ? summary[state]
                    : Object.entries(summary)
                        .filter(([k]) => k !== "pending")
                        .reduce((n, [, v]) => n + (v ?? 0), 0)}
                </span>
              </StudioLink>
            ))}
          </nav>
        </div>
        <form
          className="list-controls"
          action="/crm/studio"
          onSubmit={(event) => {
            event.preventDefault();
            const values = new FormData(event.currentTarget);
            router.push(
              `/crm/studio?${new URLSearchParams({ q: String(values.get("q") ?? ""), state: String(values.get("state") ?? ""), category: String(values.get("category") ?? "") })}`,
            );
          }}
        >
          <label className="search">
            <span className="studioFilterLabel">Tiêu đề bài viết</span>
            <BlogIcon name="search" size={15} />
            <input
              name="q"
              aria-label="Tìm bài"
              defaultValue={query.q}
              placeholder="Tìm theo tiêu đề bài viết…"
            />
          </label>
          <input type="hidden" name="state" value={query.state ?? ""} />
          <label className="studioCategoryFilter">
            <span className="studioFilterLabel">Chuyên mục</span>
            <input
              className="filter-input"
              name="category"
              aria-label="Chuyên mục"
              defaultValue={query.category}
              placeholder="Nhập chuyên mục"
            />
          </label>
          <button className="button small" type="submit">
            Áp dụng
          </button>
          {(query.q || query.state || query.category) && <button className="button small" type="button" onClick={() => router.push("/crm/studio")}>Xóa bộ lọc</button>}
        </form>
        <table className="post-table">
          <thead>
            <tr>
              <th>Bài viết</th>
              <th>Trạng thái</th>
              <th className="optional">Người viết</th>
              <th>Cập nhật</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id}>
                <td>
                  <StudioLink
                    navigate={router.push}
                    className="post-title"
                    href={`/crm/studio/${p.id}`}
                  >
                    <span className="post-mini">
                      <Cover id={p.coverId} />
                    </span>
                    <span>
                      <strong>{p.title || "Bài chưa đặt tên"}</strong>
                      <small>
                        {p.category || "Chưa chọn chuyên mục"} ·{" "}
                        {p.language === "vi" ? "Tiếng Việt" : "English"}
                      </small>
                    </span>
                  </StudioLink>
                </td>
                <td>
                  <StatusBadge state={p.state} />
                  {p.schedule && (
                    <div className="post-schedule">
                      <span>
                        <BlogIcon name="clock" size={12} />
                        Đã lên lịch
                      </span>
                      <time dateTime={p.schedule.dueAt}>
                        {scheduleLabel(
                          p.schedule.dueAt,
                          ready ? undefined : "UTC",
                        )}
                      </time>
                      {p.schedule.revision !== p.revision && (
                        <small className="schedule-stale">
                          Bài đã thay đổi · cần cập nhật lịch
                        </small>
                      )}
                    </div>
                  )}
                </td>
                <td className="optional">
                  <Avatar name={authors[p.authorId] ?? "?"} />
                </td>
                <td>
                  {new Date(p.updatedAt).toLocaleString("vi", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: ready ? undefined : "UTC",
                  })}
                </td>
                <td>
                  {p.state === "archived" ? (
                    <button
                      type="button"
                      className="icon-button"
                      disabled={restoringId !== null}
                      aria-label={`Khôi phục ${p.title || "bài viết"}`}
                      title="Khôi phục bản nháp"
                      onClick={async () => {
                        setRestoringId(p.id);
                        try {
                          const current = await request<Post>(
                            `/api/admin/blog/posts/${p.id}`,
                          );
                          if (current.state !== "archived") {
                            setNotice("Bài này đã được khôi phục.");
                            router.refresh();
                            return;
                          }
                          await request(
                            `/api/admin/blog/posts/${p.id}`,
                            "PUT",
                            { draft: current, revision: current.revision },
                          );
                          setNotice("Đã khôi phục bản nháp.", "success");
                          router.refresh();
                        } catch (error) {
                          setNotice(message(error), "error");
                        } finally {
                          setRestoringId(null);
                        }
                      }}
                    >
                      <BlogIcon
                        name={restoringId === p.id ? "clock" : "history"}
                        size={16}
                      />
                    </button>
                  ) : (
                    <StudioLink
                      navigate={router.push}
                      aria-label={`Sửa ${p.title || "bài viết"}`}
                      href={`/crm/studio/${p.id}`}
                    >
                      <BlogIcon name="more" />
                    </StudioLink>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!posts.length && (
          <div className="state-card state-card--empty">
            <div className="state-icon">
              <BlogIcon name="file" />
            </div>
            <h2>
              {query.q || query.state
                ? "Chưa có bài phù hợp."
                : "Chưa có bài viết"}
            </h2>
            <p>
              {query.q || query.state
                ? `Thử bộ lọc khác${query.state ? ` hoặc tạo bài ${stateNames[query.state] ?? "mới"}` : ""}.`
                : "Bấm “Viết bài mới” để bắt đầu."}
            </p>
          </div>
        )}
        <div className="panel-footer">
          <span>
            <strong>{posts.length}</strong> bài viết trên trang này
          </span>
          {next ? (
            <StudioLink
              navigate={router.push}
              className="button small"
              href={`/crm/studio?${filterQuery({ cursor: next })}`}
            >
              Trang tiếp <BlogIcon name="arrow" size={12} />
            </StudioLink>
          ) : (
            <span className="pagination-end">Đã xem hết</span>
          )}
        </div>
      </section>
    </>
  );
}

function StudioLink({
  href,
  navigate,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  navigate: (path: string) => void;
}) {
  return (
    <a
      {...props}
      href={href}
      onClick={(e) => {
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

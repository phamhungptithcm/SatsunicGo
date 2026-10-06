"use client";
import { BlogToast, useToastNotice } from "./toast";
import { useState } from "react";
import { SourceLink as Link } from "./source-link";
import { sourceMessage as message, type SourceRequest } from "./source-adapter";
import { Avatar, BlogIcon, StatusBadge } from "./source-ui";
import { BlogDialog } from "./source-dialog";
type Item = {
  id: string;
  postId: string;
  name: string;
  text: string;
  revision: number;
  createdAt?: string;
  status?: string;
  moderationReasons?: string[];
};
export function Moderation({
  items,
  reports,
  status = "pending",
  postTitles,
  request,
  navigate,
  next = null,
}: {
  next?: string | null;
  request: SourceRequest;
  navigate: (url: string) => void;
  items: Item[];
  reports:
    | {
        id: string;
        commentId: string;
        reason: string;
        text: string;
        revision: number;
        reportRevision?: number;
      }[]
    | null;
  status?: string;
  postTitles: Record<string, string>;
}) {
  const { notice, noticeKind, setNotice } = useToastNotice();
  const [selected, setSelected] = useState(0),
    [busy, setBusy] = useState(false),
    [confirm, setConfirm] = useState<"rejected" | "hidden" | null>(null);
  const c = items[selected];
  async function moderate(action: "approved" | "rejected" | "hidden") {
    if (!c) return;
    setBusy(true);
    try {
      await request(`/api/admin/blog/comments/${c.id}/moderate`, "POST", {
        action,
        revision: c.revision,
      });
      window.location.reload();
    } catch (e) {
      setNotice(message(e), "error");
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  }
  return (
    <>
      <div className="studio-title">
        <div className="eyebrow muted" style={{ fontSize: 9 }}>
          Journal / Cộng đồng
        </div>
        <h1>Giữ cuộc trò chuyện có giá trị.</h1>
        <p>Duyệt phản hồi, trao đổi và quản lý các báo cáo từ độc giả.</p>
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
          <nav className="panel-tabs" aria-label="Trạng thái bình luận">
            {[
              ["pending", "Chờ duyệt"],
              ["approved", "Đã duyệt"],
              ["reports", "Bị báo cáo"],
              ["hidden", "Đã ẩn"],
              ["rejected", "Từ chối"],
            ].map(([s, label]) => (
              <Link
                navigate={navigate}
                key={s}
                className={s === status ? "active" : ""}
                href={`/crm/studio/comments?status=${s}`}
              >
                {label}
                {s === status && (
                  <span className="count">
                    {s === "reports" ? (reports?.length ?? "—") : items.length}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>
        {status === "reports" ? (
          <div className="mod-detail">
            {reports === null ? (
              <p role="status">Chưa tải được số báo cáo.</p>
            ) : !reports.length ? (
              <div className="state-card state-card--empty">
                <h2>Không có báo cáo đang mở.</h2>
                <p>Báo cáo từ độc giả sẽ xuất hiện ở đây.</p>
              </div>
            ) : (
              reports.map((r) => (
                <section className="state-card" key={r.id}>
                  <h2>{r.reason}</h2>
                  <blockquote>{r.text}</blockquote>
                  <div className="flex">
                    {r.revision > 0 && (
                      <button
                        className="button"
                        disabled={busy}
                        onClick={async () => {
                          setBusy(true);
                          try {
                            await request(
                              "/api/admin/blog/comment-reports",
                              "POST",
                              {
                                id: r.id,
                                hideComment: true,
                                commentId: r.commentId,
                                commentRevision: r.revision,
                                reportRevision: r.reportRevision,
                              },
                            );
                            window.location.reload();
                          } catch (e) {
                            setNotice(message(e), "error");
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        Ẩn và xử lý báo cáo
                      </button>
                    )}
                    <button
                      className="button primary"
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        try {
                          await request(
                            "/api/admin/blog/comment-reports",
                            "POST",
                            { id: r.id },
                          );
                          window.location.reload();
                        } catch (e) {
                          setNotice(message(e), "error");
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Đánh dấu đã xử lý
                    </button>
                  </div>
                </section>
              ))
            )}
          </div>
        ) : !c ? (
          <div className="state-card state-card--empty">
            <div className="state-icon">
              <BlogIcon name="check" />
            </div>
            <h2>Không có bình luận trong mục này.</h2>
            <p>Các phản hồi phù hợp sẽ xuất hiện tại đây.</p>
          </div>
        ) : (
          <div className="moderation-layout">
            <div className="mod-list">
              {items.map((m, i) => (
                <button
                  key={m.id}
                  className={`mod-item ${i === selected ? "active" : ""}`}
                  onClick={() => setSelected(i)}
                >
                  <div className="between">
                    <span className="flex">
                      <Avatar name={m.name} className="blue" />
                      <span className="name">{m.name}</span>
                    </span>
                    <span className="small">
                      {m.createdAt
                        ? new Date(m.createdAt).toLocaleDateString("vi")
                        : ""}
                    </span>
                  </div>
                  <p>
                    {m.text.length > 90 ? `${m.text.slice(0, 90)}…` : m.text}
                  </p>
                  <div className="article-ref">
                    <BlogIcon name="file" size={11} />
                    {postTitles[m.postId]}
                  </div>
                </button>
              ))}
            </div>
            <div className="mod-detail">
              <div className="between">
                <h2>Chi tiết bình luận</h2>
                <StatusBadge state={c.status ?? status} />
              </div>
              <div className="mod-context">
                <div
                  className="eyebrow muted"
                  style={{ fontSize: 9, marginBottom: 7 }}
                >
                  Trong bài viết
                </div>
                <Link
                  navigate={navigate}
                  className="between"
                  href={`/crm/studio/${c.postId}/preview`}
                >
                  <strong style={{ fontWeight: 550, fontSize: 12 }}>
                    {postTitles[c.postId]}
                  </strong>
                  <BlogIcon name="external" size={13} />
                </Link>
              </div>
              <div className="flex">
                <Avatar name={c.name} className="blue big" />
                <div className="small">
                  <strong>{c.name}</strong>
                  <div className="muted">
                    Độc giả ·{" "}
                    {c.createdAt
                      ? new Date(c.createdAt).toLocaleString("vi")
                      : ""}
                  </div>
                </div>
              </div>
              <blockquote style={{ whiteSpace: "pre-wrap" }}>
                {c.text}
              </blockquote>
              {c.moderationReasons?.length ? (
                <div className="notice" role="note">
                  <strong>Lý do kiểm tra tự động</strong>
                  <ul>
                    {c.moderationReasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="mod-actions">
                <button
                  className="button primary"
                  disabled={busy || status === "approved"}
                  onClick={() => void moderate("approved")}
                >
                  <BlogIcon name="check" size={14} />
                  Duyệt bình luận
                </button>
                <button
                  className="button"
                  disabled={busy}
                  onClick={() => setConfirm("rejected")}
                >
                  Từ chối
                </button>
                <button
                  className="button ghost"
                  disabled={busy}
                  onClick={() => setConfirm("hidden")}
                >
                  Ẩn / spam
                </button>
              </div>
              <p className="private-note" style={{ marginTop: 17 }}>
                Sau khi duyệt, bình luận sẽ xuất hiện dưới bài viết.
              </p>
            </div>
          </div>
        )}
      </section>
      <p className="private-note">
        Hiển thị tối đa 100 mục. Xử lý hàng chờ để tải các mục tiếp theo.
      </p>
      <div className="panel-footer">
        <span>
          {status === "reports" ? (reports?.length ?? "—") : items.length} mục
          trên trang này
        </span>
        {next && (
          <Link
            navigate={navigate}
            className="button small"
            href={`/crm/studio/comments?${new URLSearchParams({ status, cursor: next })}`}
          >
            Trang tiếp <BlogIcon name="arrow" size={12} />
          </Link>
        )}
      </div>
      {confirm && (
        <BlogDialog
          title={confirm === "hidden" ? "Ẩn bình luận?" : "Từ chối bình luận?"}
          onClose={() => setConfirm(null)}
        >
          <p>Bình luận sẽ được ẩn. Bạn có thể xem lại trong mục đã xử lý.</p>
          <button
            className="button dark"
            disabled={busy}
            onClick={() => void moderate(confirm)}
          >
            Xác nhận
          </button>
        </BlogDialog>
      )}
    </>
  );
}

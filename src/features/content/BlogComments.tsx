import { LoadingState } from "../../shared/Loading";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, callService, login } from "../../shared/firebase";
import type { publicBlogComment } from "../../../packages/domain/blog-comments";
import { BlogIcon } from "./studio/source-ui";
import { BlogToast, useToastNotice } from "./studio/toast";
import { StudioDialog } from "./studio/dialog";
import { commentHash, commentRetry, commentStatus } from "./comments-ui/state";
import "./blog-comments027.css";

type Comment = ReturnType<typeof publicBlogComment> & {
  badge?: string;
  avatar?: string;
  approvedReplyCount?: number;
};
type Page = {
  items: Comment[];
  next: string | null;
  count: number;
  commentsEnabled: boolean;
  mine: Comment[];
  thread?: { parent: Comment; reply: Comment | null } | null;
};
type Action = { kind: "edit" | "delete" | "report"; comment: Comment };
type Write = { service: string; payload: Record<string, unknown> };

/** Keep private identity results fenced even through A → B → A account switches. */
export function BlogComments({ postId }: { postId: string }) {
  const [uid, setUid] = useState(auth?.currentUser?.uid ?? "");
  const [page, setPage] = useState<Page | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [parent, setParent] = useState("");
  const [busy, setBusy] = useState(false);
  const [action, setAction] = useState<Action | null>(null);
  const [editText, setEditText] = useState("");
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState<Write | null>(null);
  const { notice, noticeKind, setNotice } = useToastNotice();
  const inputId = useId();
  const identity = useRef(0),
    requestEpoch = useRef(0),
    running = useRef(false);
  const authUid = useRef(auth?.currentUser?.uid ?? "");
  const retry = useRef(commentRetry());
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(
    () =>
      auth
        ? onAuthStateChanged(auth, (user) => {
            const nextUid = user?.uid ?? "";
            if (nextUid === authUid.current) return;
            authUid.current = nextUid;
            // Clear private state synchronously with the auth event, before React's next effect.
            identity.current++;
            requestEpoch.current++;
            retry.current.clear();
            running.current = false;
            setBusy(false);
            setPending(null);
            setPage(null);
            setAction(null);
            setName("");
            setText("");
            setParent("");
            setNotice("");
            setUid(user?.uid ?? "");
          })
        : undefined,
    [setNotice],
  );

  const load = useCallback(
    async (after?: string) => {
      const generation = identity.current,
        request = ++requestEpoch.current;
      const owner = auth?.currentUser?.uid ?? "";
      setLoading(true);
      setLoadError(false);
      try {
        const commentId = commentHash(window.location.hash);
        const result = await callService<Page>("blogCommentList", {
          postId,
          sort: "newest",
          ...(after ? { after } : {}),
          ...(commentId && !after ? { commentId } : {}),
        });
        if (
          generation !== identity.current ||
          request !== requestEpoch.current ||
          owner !== (auth?.currentUser?.uid ?? "")
        )
          return;
        setPage((old) =>
          after && old
            ? {
                ...result,
                thread: old.thread,
                items: [
                  ...old.items,
                  ...result.items.filter(
                    (item) => !old.items.some((row) => row.id === item.id),
                  ),
                ],
              }
            : result,
        );
      } catch {
        if (
          generation === identity.current &&
          request === requestEpoch.current
        ) {
          setLoadError(true);
          setNotice("Chưa tải được bình luận. Thử tải lại.", "error");
        }
      } finally {
        if (generation === identity.current && request === requestEpoch.current)
          setLoading(false);
      }
    },
    [postId, setNotice],
  );

  useEffect(() => {
    identity.current++;
    requestEpoch.current++;
    retry.current.clear();
    running.current = false;
    setPage(null);
    setName("");
    setText("");
    setParent("");
    setBusy(false);
    setAction(null);
    setPending(null);
    setNotice("");
    void load();
    const hashChanged = () => void load();
    window.addEventListener("hashchange", hashChanged);
    return () => {
      identity.current++;
      requestEpoch.current++;
      window.removeEventListener("hashchange", hashChanged);
    };
  }, [postId, uid, load, setNotice]);

  async function write(command: Write, message: string) {
    if (!uid || running.current) return;
    let operationId: string;
    try {
      operationId = retry.current.begin(command);
    } catch {
      setNotice("Cần gửi lại thao tác đang chờ để đối chiếu kết quả.", "error");
      return;
    }
    const owner = uid,
      generation = identity.current;
    const current = () =>
      generation === identity.current && auth?.currentUser?.uid === owner;
    running.current = true;
    setBusy(true);
    setNotice("");
    setPending(command);
    try {
      await callService(command.service, { ...command.payload, operationId });
      if (!current()) return;
      retry.current.clear();
      setPending(null);
      if (command.service === "blogCommentSubmit") {
        setText("");
        setParent("");
      }
      setAction(null);
      setNotice(message, "success");
      await load();
    } catch (error) {
      if (!current()) return;
      const code = (error as { code?: string }).code;
      const terminal =
        !!code &&
        [
          "functions/invalid-argument",
          "functions/failed-precondition",
          "functions/permission-denied",
          "functions/unauthenticated",
          "functions/not-found",
          "functions/resource-exhausted",
          "functions/aborted",
        ].includes(code);
      if (terminal) {
        retry.current.clear();
        setPending(null);
        setNotice(
          code === "functions/aborted"
            ? "Bình luận đã thay đổi. Tải lại trước khi sửa hoặc xóa."
            : code === "functions/resource-exhausted"
              ? "Bạn gửi quá nhanh. Chờ một lúc rồi thử lại."
              : "Thao tác chưa hoàn tất. Nội dung của bạn vẫn được giữ lại.",
          "error",
        );
      } else {
        setNotice(
          "Chưa nhận được kết quả. Nội dung vẫn được giữ lại; thử lại nguyên thao tác để đối chiếu.",
          "error",
        );
      }
    } finally {
      if (current()) {
        running.current = false;
        setBusy(false);
      }
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void write(
      {
        service: "blogCommentSubmit",
        payload: {
          postId,
          parentId: parent,
          name: name.trim(),
          text: text.trim(),
        },
      },
      "Đã gửi bình luận, đang chờ duyệt trước khi hiển thị công khai.",
    );
  }
  function reply(id: string) {
    if (pending) return;
    setParent(id);
    textRef.current?.focus();
  }
  function open(kind: Action["kind"], comment: Comment) {
    if (pending) return;
    setAction({ kind, comment });
    setEditText(comment.text);
    setReason("");
  }
  const own = page?.mine ?? [];
  const focused = page?.thread;
  const blocked = busy || pending !== null;

  return (
    <section
      className="blogComments027"
      id="comments"
      aria-label="Bình luận bài viết"
    >
      <div className="between discussion-header">
        <h2>
          Bình luận{" "}
          <span className="muted" style={{ font: "16px var(--sans)" }}>
            {page ? String(page.count).padStart(2, "0") : ""}
          </span>
        </h2>
        <span className="muted small">
          Mới nhất trước <BlogIcon name="down" size={12} />
        </span>
      </div>
      {notice && (
        <BlogToast
          text={notice}
          kind={noticeKind}
          language="vi"
          pending={busy}
          onClose={() => setNotice("")}
        />
      )}
      {!page && !loadError && (
        <div>
          <div className="skeleton" aria-hidden="true" />
          <LoadingState className="private-note" overlay={false}>Đang tải bình luận…</LoadingState>
        </div>
      )}
      {loadError && (
        <button
          type="button"
          className="button small"
          disabled={loading || busy}
          onClick={() => void load()}
        >
          Tải lại bình luận
        </button>
      )}
      {pending && !busy && (
        <div className="notice" role="status">
          Chưa xác nhận được kết quả của thao tác trước.
          <button
            type="button"
            className="button"
            onClick={() =>
              void write(
                pending,
                pending.service === "blogCommentSubmit"
                  ? "Đã gửi bình luận, đang chờ duyệt trước khi hiển thị công khai."
                  : pending.service === "blogCommentReport"
                    ? "Đã gửi báo cáo."
                    : pending.payload.action === "delete"
                      ? "Đã xóa bình luận."
                      : "Đã gửi bản sửa để duyệt.",
              )
            }
          >
            Thử lại thao tác đang chờ
          </button>
        </div>
      )}
      {page &&
        (page.commentsEnabled ? (
          <form className="composer" onSubmit={submit}>
            {parent && (
              <div className="between reply-context">
                <span>Đang trả lời bình luận</span>
                <button
                  type="button"
                  disabled={blocked}
                  onClick={() => setParent("")}
                >
                  Hủy trả lời
                </button>
              </div>
            )}
            {uid && (
              <label className="public-name" htmlFor={inputId + "-name"}>
                Tên hiển thị công khai
                <input
                  id={inputId + "-name"}
                  value={name}
                  required
                  maxLength={80}
                  disabled={blocked}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
            )}
            <label className="public-name" htmlFor={inputId}>
              Bình luận (tối đa 2.000 ký tự)
            </label>
            <textarea
              ref={textRef}
              id={inputId}
              value={text}
              maxLength={2000}
              required
              disabled={blocked}
              onChange={(e) => setText(e.target.value)}
              placeholder="Viết bình luận…"
            />
            <div className="composer-bottom">
              <span className="small muted">Tối đa 2.000 ký tự.</span>
              {uid ? (
                <button
                  className="button primary"
                  disabled={blocked || !name.trim() || !text.trim()}
                >
                  {busy ? "Đang gửi…" : "Gửi bình luận để duyệt"}{" "}
                  <BlogIcon name="arrow" size={13} />
                </button>
              ) : (
                <button
                  type="button"
                  className="button primary"
                  aria-haspopup="dialog"
                  onClick={() =>
                    void login().catch(() =>
                      setNotice("Chưa đăng nhập được. Thử lại sau.", "error"),
                    )
                  }
                >
                  Đăng nhập để bình luận <BlogIcon name="arrow" size={13} />
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="notice">Bài viết này đã đóng bình luận.</div>
        ))}
      <p className="private-note">
        <BlogIcon name="shield" size={12} /> Bình luận được duyệt trước khi
        đăng. Không gửi thông tin đơn hàng, số điện thoại hoặc chứng từ công
        khai.
      </p>
      {uid && own.length > 0 && (
        <details
          className="own-comments"
          open={own.some((comment) => comment.status === "pending")}
        >
          <summary>Bình luận của bạn ({own.length})</summary>
          {own.map((comment) => (
            <div className="notice" key={comment.id}>
              <span className="status-badge">
                {commentStatus(comment.status)}
              </span>
              <p
                style={{ whiteSpace: "pre-wrap", fontSize: 13, marginTop: 10 }}
              >
                {comment.text || "Nội dung đã xóa"}
              </p>
              <div className="comment-actions">
                {!["hidden", "rejected", "deleted"].includes(
                  comment.status,
                ) && (
                  <button
                    type="button"
                    disabled={blocked}
                    onClick={() => open("edit", comment)}
                  >
                    Sửa
                  </button>
                )}
                {comment.status !== "deleted" && (
                  <button
                    type="button"
                    disabled={blocked}
                    onClick={() => open("delete", comment)}
                  >
                    Xóa
                  </button>
                )}
              </div>
            </div>
          ))}
        </details>
      )}
      {focused && (
        <aside className="shared-comment" aria-label="Bình luận được chia sẻ">
          <p className="private-note">Bình luận được chia sẻ</p>
          <CommentItem
            item={focused.parent}
            postId={postId}
            signed={!!uid}
            identity={identity}
            session={uid}
            reply={reply}
            open={open}
            disabled={blocked}
          />
          {focused.reply && (
            <CommentItem
              item={focused.reply}
              postId={postId}
              signed={!!uid}
              identity={identity}
              session={uid}
              reply={reply}
              open={open}
              disabled={blocked}
              nested
            />
          )}
        </aside>
      )}
      {page?.items
        .filter((comment) => comment.id !== focused?.parent.id)
        .map((comment) => (
          <CommentItem
            key={comment.id}
            item={comment}
            postId={postId}
            signed={!!uid}
            identity={identity}
            session={uid}
            reply={reply}
            open={open}
            disabled={blocked}
          />
        ))}
      {page && !page.items.length && !focused && (
        <p className="private-note" style={{ marginTop: 27 }}>
          Chưa có bình luận. Bạn nghĩ sao về bài viết?
        </p>
      )}
      {page?.next && (
        <button
          type="button"
          className="button small"
          disabled={loading || busy}
          onClick={() => void load(page.next ?? undefined)}
        >
          {loading ? "Đang tải…" : "Xem thêm bình luận"}
        </button>
      )}
      {action && (
        <StudioDialog
          title={
            action.kind === "edit"
              ? "Sửa bình luận"
              : action.kind === "delete"
                ? "Xóa bình luận này?"
                : "Báo cáo bình luận"
          }
          className="blogCommentsDialog"
          onClose={() => {
            if (!busy) setAction(null);
          }}
        >
          {action.kind === "delete" ? (
            <>
              <p>
                Nội dung bình luận sẽ bị xóa. Các trả lời có thể vẫn hiển thị
                bên dưới thông báo đã xóa.
              </p>
              <button
                type="button"
                disabled={blocked}
                onClick={() =>
                  void write(
                    {
                      service: "blogCommentCommand",
                      payload: {
                        action: "delete",
                        id: action.comment.id,
                        expectedVersion: action.comment.revision,
                      },
                    },
                    "Đã xóa bình luận.",
                  )
                }
              >
                Xác nhận xóa
              </button>
            </>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void write(
                  action.kind === "edit"
                    ? {
                        service: "blogCommentCommand",
                        payload: {
                          action: "edit",
                          id: action.comment.id,
                          expectedVersion: action.comment.revision,
                          text: editText.trim(),
                        },
                      }
                    : {
                        service: "blogCommentReport",
                        payload: {
                          id: action.comment.id,
                          reason: reason.trim(),
                        },
                      },
                  action.kind === "edit"
                    ? "Đã gửi bản sửa để duyệt."
                    : "Đã gửi báo cáo.",
                );
              }}
            >
              <p>
                {action.kind === "edit"
                  ? "Bản sửa sẽ được duyệt trước khi đăng."
                  : "Giúp giữ cuộc trò chuyện tôn trọng mọi người."}
              </p>
              <label>
                {action.kind === "edit"
                  ? "Nội dung bình luận"
                  : "Lý do báo cáo"}
                <textarea
                  required
                  maxLength={action.kind === "edit" ? 2000 : 500}
                  disabled={blocked}
                  value={action.kind === "edit" ? editText : reason}
                  onChange={(event) =>
                    action.kind === "edit"
                      ? setEditText(event.target.value)
                      : setReason(event.target.value)
                  }
                />
              </label>
              <button
                disabled={
                  blocked ||
                  !(action.kind === "edit" ? editText : reason).trim()
                }
              >
                {busy
                  ? "Đang gửi…"
                  : action.kind === "edit"
                    ? "Gửi bản sửa để duyệt"
                    : "Gửi báo cáo"}
              </button>
            </form>
          )}
        </StudioDialog>
      )}
    </section>
  );
}

function CommentItem({
  item,
  postId,
  signed,
  session,
  identity,
  reply,
  open,
  disabled,
  nested = false,
}: {
  item: Comment;
  postId: string;
  signed: boolean;
  session: string;
  identity: { current: number };
  reply: (id: string) => void;
  open: (kind: Action["kind"], comment: Comment) => void;
  disabled: boolean;
  nested?: boolean;
}) {
  const [replies, setReplies] = useState<Page | null>(null);
  const [loading, setLoading] = useState(false),
    [error, setError] = useState(false);
  const epoch = useRef(0),
    running = useRef(false);
  useEffect(() => {
    epoch.current++;
    running.current = false;
    setReplies(null);
    setLoading(false);
    setError(false);
    return () => {
      epoch.current++;
    };
  }, [postId, item.id, session]);
  async function loadReplies() {
    if (running.current) return;
    const request = ++epoch.current,
      generation = identity.current;
    running.current = true;
    setLoading(true);
    setError(false);
    try {
      const result = await callService<Page>("blogCommentList", {
        postId,
        parentId: item.id,
        sort: "newest",
        ...(replies?.next ? { after: replies.next } : {}),
      });
      if (request !== epoch.current || generation !== identity.current) return;
      setReplies((old) => ({
        ...result,
        items: [
          ...(old?.next ? old.items : []),
          ...result.items.filter(
            (row) => !old?.items.some((previous) => previous.id === row.id),
          ),
        ],
      }));
    } catch {
      if (request === epoch.current && generation === identity.current)
        setError(true);
    } finally {
      if (request === epoch.current && generation === identity.current) {
        running.current = false;
        setLoading(false);
      }
    }
  }
  return (
    <article
      className={"comment" + (nested ? " reply" : "")}
      id={"comment-" + item.id}
    >
      <span className="avatar" aria-hidden="true">
        {item.name
          .trim()
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part[0])
          .join("")
          .toUpperCase() || "•"}
      </span>
      <div className="comment-content">
        <div className="comment-top">
          <strong>{item.name || "Bình luận đã xóa"}</strong>
          {(item.badge === "moderator" || item.badge === "author") && (
            <span className="status-badge">
              {item.badge === "moderator"
                ? "Biên tập viên"
                : item.badge === "author"
                  ? "Tác giả"
                  : "Thành viên"}
            </span>
          )}
          <time dateTime={item.createdAt}>
            {new Date(item.createdAt).toLocaleDateString("vi-VN")}
          </time>
        </div>
        <p style={{ whiteSpace: "pre-wrap" }}>
          {item.text || (item.status === "deleted" ? "Nội dung đã xóa" : "")}
        </p>
        <div className="comment-actions">
          {signed && item.status === "approved" && !nested && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => reply(item.id)}
            >
              Trả lời
            </button>
          )}
          <a href={"#comment-" + item.id}>Liên kết</a>
          {signed && item.status === "approved" && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => open("report", item)}
            >
              Báo cáo
            </button>
          )}
          {!nested && (!replies || replies.next) && (
            <button
              type="button"
              disabled={loading || disabled}
              onClick={() => void loadReplies()}
            >
              {loading
                ? "Đang tải…"
                : replies?.next
                  ? "Xem thêm trả lời"
                  : "Xem trả lời"}
            </button>
          )}
        </div>
        {error && (
          <p role="alert" className="private-note">
            Chưa tải được trả lời.
            <button
              type="button"
              disabled={loading}
              onClick={() => void loadReplies()}
            >
              Thử lại
            </button>
          </p>
        )}
        {replies && (
          <div>
            {replies.items.map((row) => (
              <CommentItem
                key={row.id}
                item={row}
                postId={postId}
                signed={signed}
                session={session}
                identity={identity}
                reply={reply}
                open={open}
                disabled={disabled}
                nested
              />
            ))}
            {!replies.items.length && (
              <p className="private-note">Chưa có trả lời.</p>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

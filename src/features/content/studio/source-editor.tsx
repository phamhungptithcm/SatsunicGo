"use client";
import { publicationChecks } from "./state";
import { openSavedPreview } from "./open-preview";
import { TaxonomyFields } from "./taxonomy-fields";
import { parseRecovery, recoveryKey } from "./source-recovery";
import { SchedulePicker } from "./schedule-picker";
import { localScheduleInstant, validScheduleTime } from "./schedule-time";
import { BlogToast, useToastNotice } from "./toast";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { RichEditor } from "./rich-editor";
import { SourceLink as Link } from "./source-link";

import type {
  StudioPost as Post,
  StudioDraft as Draft,
} from "../../../../packages/domain/blog-studio";
import {
  sourceMessage as message,
  isSourceRevisionConflict,
  isSourceTerminalFailure,
  confirmedSourceSave,
  type SourceRequest,
  type SourceRouter,
} from "./source-adapter";
import { Avatar, Cover, BlogIcon, StatusBadge } from "./source-ui";
import { BlogDialog } from "./source-dialog";
import { bodyText } from "../../../../packages/domain/blog-studio";
import { titleSlug } from "./state";
const subscribe = () => () => {};
export function Editor({
  initial,
  viewerUid,
  authors,
  publisher,
  members,
  categories,
  canCreateCategory,
  router,
  request,
  progressFetch,
  onCreateCategory,
}: {
  router: SourceRouter;
  request: SourceRequest;
  progressFetch: (url: string, init: RequestInit) => Promise<Response>;
  onCreateCategory: (name: string) => Promise<{ name: string }>;
  initial: Post;
  viewerUid: string;
  authors: { id: string; name: string }[];
  publisher: boolean;
  members: { id: string; name: string }[];
  categories: string[];
  canCreateCategory: boolean;
}) {
  const [compactHeader, setCompactHeader] = useState(false);
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        // Separate thresholds avoid flicker when the header's height changes.
        setCompactHeader((previous) =>
          previous ? window.scrollY > 24 : window.scrollY > 64,
        );
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.cancelAnimationFrame(frame);
    };
  }, []);
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const [modal, setModal] = useState<
    "history" | "seo" | "publish" | "unpublish" | "archive" | null
  >(null);
  const [post, setPost] = useState(initial);
  const [recovery, setRecovery] =
    useState<ReturnType<typeof parseRecovery>>(null);
  const [recoveryGeneration, setRecoveryGeneration] = useState(0);
  const [sourceText, setSourceText] = useState(
    initial.sources.map((s) => `${s.title} | ${s.url}`).join("\n"),
  );
  const { notice, noticeKind, setNotice } = useToastNotice();
  const [taxonomyToastRevision, setTaxonomyToastRevision] = useState(0);
  const dismissNotice = useCallback(() => setNotice(""), [setNotice]);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleReady, setScheduleReady] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  useEffect(() => {
    if (!publisher) return;
    void request<{ dueAt: string | null; error: string | null }>(
      `/api/admin/blog/posts/${initial.id}/schedule`,
    )
      .then((r) => {
        setScheduledAt(r.dueAt);
        if (r.error)
          setNotice(
            `Bài chưa được đăng theo lịch. ${message(new Error(r.error))}`,
            "error",
          );
      })
      .catch(() => {});
  }, [initial.id, publisher, setNotice]);
  const [publicationAction, setPublicationAction] = useState<
    "publish" | "schedule" | null
  >(null);
  const publicationLock = useRef(false);
  const leavingEditor = useRef(false);
  useEffect(() => {
    const keepPublicationOpen = (event: Event) => {
      if (publicationLock.current) event.preventDefault();
    };
    document.addEventListener("cancel", keepPublicationOpen, true);
    return () =>
      document.removeEventListener("cancel", keepPublicationOpen, true);
  }, []);
  async function schedulePublication() {
    if (publicationLock.current || busy) return;
    const instant = localScheduleInstant(scheduleDate);
    if (!instant || !validScheduleTime(instant)) {
      setNotice("Chọn giờ đăng sau hiện tại ít nhất một phút.", "warning");
      return;
    }
    publicationLock.current = true;
    setPublicationAction("schedule");
    try {
      const before = generation.current;
      const saved = dirty ? await save() : current.current;
      if (!saved || generation.current !== before) return;
      setBusy(true);
      await request(`/api/admin/blog/posts/${post.id}/schedule`, "POST", {
        revision: saved.revision,
        dueAt: instant,
      });
      if (generation.current !== before) {
        setNotice(
          "Đã lên lịch. Lưu thay đổi vừa sửa trước khi rời bài viết.",
          "warning",
        );
        return;
      }
      leavingEditor.current = true;
      router.push("/crm/studio");
      router.refresh();
    } catch (e) {
      setNotice(message(e), "error");
    } finally {
      if (!leavingEditor.current) {
        setBusy(false);
        setPublicationAction(null);
        publicationLock.current = false;
      }
    }
  }
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const publishTrigger = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (modal === null && !busy) {
      publishTrigger.current?.focus();
      publishTrigger.current = null;
    }
  }, [modal, busy]);

  const [history, setHistory] = useState<Post[]>([]);
  const current = useRef(post);
  const manualSlug = useRef(Boolean(initial.slug));
  const saving = useRef(false);
  const pendingSave = useRef<Promise<void> | null>(null);
  const savedGeneration = useRef(0);
  const previewLock = useRef(false);
  const [openingPreview, setOpeningPreview] = useState(false);
  const categoryPending = useRef(false);
  const generation = useRef(0);
  const conflicted = useRef(false);
  const pendingSubmission = useRef<{
    draft: Post;
    revision: number;
    state?: "review" | "archived";
    generation: number;
  } | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const resolveUpload = useRef<((value: string | null) => void) | null>(null);
  const [coverUpload, setCoverUpload] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (dirty) return;
      try {
        const key = recoveryKey(viewerUid, initial.id);
        const backup = parseRecovery(
          localStorage.getItem(key),
          viewerUid,
          initial.id,
        );
        if (
          backup &&
          JSON.stringify(backup.draft) !==
            JSON.stringify(
              parseRecovery(
                JSON.stringify({
                  uid: viewerUid,
                  postId: initial.id,
                  revision: initial.revision,
                  at: backup.at,
                  draft: initial,
                }),
                viewerUid,
                initial.id,
              )?.draft,
            )
        )
          setRecovery(backup);
        else localStorage.removeItem(key);
      } catch {
        /* Storage may be disabled; server autosave still works. */
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [viewerUid, initial, dirty]);
  useEffect(() => {
    if (!dirty) return;
    try {
      localStorage.setItem(
        recoveryKey(viewerUid, initial.id),
        JSON.stringify({
          uid: viewerUid,
          postId: initial.id,
          revision: post.revision,
          at: Date.now(),
          draft: post,
        }),
      );
    } catch {
      /* A private/full storage must never interrupt editing. */
    }
  }, [dirty, post, viewerUid, initial.id]);
  useEffect(() => {
    const input = file.current;
    const cancel = () => {
      resolveUpload.current?.(null);
      resolveUpload.current = null;
    };
    input?.addEventListener("cancel", cancel);
    return () => input?.removeEventListener("cancel", cancel);
  }, []);
  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    generation.current++;
    if (key === "slug") manualSlug.current = true;
    setPost((p) => {
      const n = {
        ...p,
        [key]: value,
        ...(key === "title" && !manualSlug.current && !p.publishedSlug
          ? { slug: titleSlug(String(value)) }
          : {}),
      };
      current.current = n;
      return n;
    });
    setDirty(true);
  }
  function restoreRecovery() {
    if (!recovery) return;
    manualSlug.current = true;
    for (const key of Object.keys(recovery.draft) as (keyof Draft)[])
      update(key, recovery.draft[key]);
    setSourceText(
      recovery.draft.sources.map((s) => `${s.title} | ${s.url}`).join("\n"),
    );
    setRecovery(null);
    setRecoveryGeneration((n) => n + 1);
    if (recovery.revision !== initial.revision) {
      conflicted.current = true;
      setNotice(
        "Bản trên máy chủ đã thay đổi. Sao chép nội dung phục hồi trước khi tải lại để đối chiếu.",
        "warning",
      );
    }
  }
  const save = useCallback(
    async (state?: "review" | "archived") => {
      if (saving.current || conflicted.current || categoryPending.current)
        return null;
      saving.current = true;
      let finishSave!: () => void;
      pendingSave.current = new Promise<void>((resolve) => {
        finishSave = resolve;
      });
      setBusy(true);
      pendingSubmission.current ??= {
        draft: JSON.parse(JSON.stringify(current.current)) as Post,
        revision: current.current.revision,
        state,
        generation: generation.current,
      };
      const submitted = pendingSubmission.current;
      const start = submitted.generation;
      setNotice("Đang lưu…");
      try {
        const saved = await request<Post>(
          `/api/admin/blog/posts/${initial.id}`,
          "PUT",
          {
            draft: submitted.draft,
            revision: submitted.revision,
            state: submitted.state,
          },
        );
        current.current = {
          ...current.current,
          revision: saved.revision,
          state: saved.state,
        };
        setPost((p) => ({
          ...p,
          revision: saved.revision,
          state: saved.state,
        }));
        pendingSubmission.current = null;
        savedGeneration.current = start;
        if (start === generation.current) {
          setDirty(false);
          try {
            localStorage.removeItem(recoveryKey(viewerUid, initial.id));
          } catch {
            /* Optional local backup. */
          }
        }
        setNotice("Đã lưu.", "success");
        return start === generation.current ? saved : null;
      } catch (e) {
        if (isSourceTerminalFailure(e)) {
          const confirmed = confirmedSourceSave(e);
          if (confirmed) {
            current.current = {
              ...current.current,
              revision: confirmed.revision,
              state: confirmed.state as Post["state"],
            };
            setPost((p) => ({
              ...p,
              revision: confirmed.revision,
              state: confirmed.state as Post["state"],
            }));
          }
          pendingSubmission.current = null;
        }
        if (isSourceRevisionConflict(e)) {
          conflicted.current = true;
          pendingSubmission.current = null;
        }
        setNotice(message(e), "error");
        return null;
      } finally {
        saving.current = false;
        pendingSave.current = null;
        finishSave();
        setBusy(false);
      }
    },
    [initial.id, viewerUid, setNotice],
  );
  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(() => {
      void save();
    }, 1800);
    return () => clearTimeout(timer);
  }, [post, dirty, save]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  async function publish(action: "publish" | "unpublish") {
    if (publicationLock.current || busy) return;
    publicationLock.current = true;
    if (action === "publish") setPublicationAction("publish");
    try {
      const before = generation.current;
      const saved = dirty ? await save() : current.current;
      if (!saved || generation.current !== before) {
        setNotice(
          "Bạn vừa sửa thêm nội dung. Lưu lại trước khi đăng.",
          "warning",
        );
        return;
      }
      setBusy(true);
      await request(`/api/admin/blog/posts/${post.id}/${action}`, "POST", {
        revision: saved.revision,
        operationId: crypto.randomUUID(),
      });
      if (generation.current === before) {
        if (action === "publish") {
          leavingEditor.current = true;
          router.push("/crm/studio");
          router.refresh();
        } else window.location.reload();
      } else
        setNotice(
          "Đã cập nhật bài đăng. Phần vừa sửa thêm vẫn là bản nháp.",
          "warning",
        );
    } catch (e) {
      setNotice(message(e), "error");
    } finally {
      if (!leavingEditor.current) {
        setBusy(false);
        setPublicationAction(null);
        publicationLock.current = false;
      }
    }
  }
  const lastUploadedAlt = useRef("");
  async function upload(f: File) {
    const r = await progressFetch(`/api/admin/blog/media?postId=${post.id}`, {
      method: "POST",
      headers: { "x-blog-request": "1", "Content-Type": f.type },
      body: f,
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error);
    lastUploadedAlt.current = typeof data.alt === "string" ? data.alt : "";
    return data as { id: string; url: string; alt?: string };
  }
  async function openHistory() {
    try {
      setHistory(
        await request<Post[]>(`/api/admin/blog/posts/${post.id}/revisions`),
      );
      setModal("history");
    } catch (e) {
      setNotice(message(e), "error");
    }
  }
  const authorName =
    authors.find((a) => a.id === post.authorId)?.name ?? "Chưa chọn tác giả";
  return (
    <div
      className={`editor-shell${compactHeader ? " editor-shell--compact" : ""}`}
    >
      <fieldset
        className="editor-frame"
        disabled={!ready || publicationAction !== null}
      >
        <header className="editor-top">
          <div className="flex">
            <Link
              navigate={router.push}
              href="/crm/studio"
              onClick={async (e) => {
                if (!dirty && !busy) return;
                e.preventDefault();
                if (busy) return;
                const before = generation.current;
                const saved = await save();
                if (saved && generation.current === before)
                  router.push("/crm/studio");
              }}
              className="icon-button"
              aria-label="Trở về bài viết"
            >
              <BlogIcon name="back" />
            </Link>
            <span className="desktop-only small">Bài viết</span>
            <StatusBadge state={post.state} />
            <span className="saved">
              <BlogIcon name={busy ? "clock" : "check"} size={13} />
              <span>
                {busy
                  ? "Đang lưu…"
                  : dirty
                    ? "Chưa lưu thay đổi"
                    : "Đã lưu bản nháp"}
              </span>
            </span>
          </div>
          <div className="flex">
            <button
              className="icon-button"
              disabled={busy}
              aria-label="Lưu bản nháp"
              title="Lưu bản nháp"
              onClick={() => void save()}
            >
              <BlogIcon name="check" size={16} />
            </button>
            <button
              className="icon-button desktop-only"
              aria-label="Lịch sử phiên bản"
              onClick={() => void openHistory()}
            >
              <BlogIcon name="history" size={16} />
            </button>
            <a
              className="button"
              href={`/crm/studio/${post.id}/preview`}
              target="_blank"
              rel="noopener"
              aria-busy={openingPreview}
              onClick={async (e) => {
                e.preventDefault();
                if (previewLock.current) return;
                if ((busy && !saving.current) || categoryPending.current) {
                  setNotice(
                    "Đang xử lý thay đổi. Bạn thử xem trước sau ít giây nhé.",
                  );
                  return;
                }
                previewLock.current = true;
                setOpeningPreview(true);
                try {
                  await openSavedPreview({
                    url: `/crm/studio/${post.id}/preview`,
                    open: () => {
                      const tab = window.open("about:blank", "_blank");
                      if (tab) {
                        tab.opener = null;
                        try {
                          tab.document.title = "Đang mở bản xem trước…";
                          const text = tab.document.createElement("p");
                          text.textContent = "Đang chuẩn bị bản xem trước…";
                          tab.document.body.append(text);
                        } catch {
                          /* The browser may restrict placeholder access. */
                        }
                      }
                      return tab;
                    },
                    prepare: async () => {
                      await pendingSave.current;
                      if (conflicted.current) {
                        setNotice(
                          "Bài đã thay đổi ở nơi khác. Lưu bản đang sửa trước khi xem trước.",
                          "warning",
                        );
                        return false;
                      }
                      const before = generation.current;
                      const saved =
                        savedGeneration.current === before
                          ? current.current
                          : await save();
                      if (!saved) return false;
                      if (generation.current !== before) {
                        setNotice(
                          "Bạn vừa sửa thêm nội dung. Mở xem trước lại nhé.",
                          "warning",
                        );
                        return false;
                      }
                      return true;
                    },
                    navigate: (url) => router.push(url),
                    onError: (error) => setNotice(message(error), "error"),
                  });
                } finally {
                  previewLock.current = false;
                  setOpeningPreview(false);
                }
              }}
            >
              <BlogIcon name="eye" size={15} />
              {openingPreview ? "Đang mở…" : "Xem trước"}
            </a>
            {publisher ? (
              <button
                className="button primary"
                disabled={busy}
                onClick={(event) => {
                  publishTrigger.current = event.currentTarget;
                  setModal("publish");
                }}
              >
                {post.publishedAt ? "Cập nhật" : "Xuất bản"}
                <BlogIcon name="arrow" size={14} />
              </button>
            ) : (
              <button
                className="button primary"
                disabled={busy}
                onClick={() => void save("review")}
              >
                Gửi duyệt <BlogIcon name="arrow" size={14} />
              </button>
            )}
          </div>
        </header>
        {notice && (
          <BlogToast
            key={taxonomyToastRevision}
            text={notice}
            kind={noticeKind}
            onClose={dismissNotice}
          />
        )}
        {scheduledAt && (
          <div className="notice">
            Đăng lúc {new Date(scheduledAt).toLocaleString("vi")}{" "}
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await request(
                    `/api/admin/blog/posts/${post.id}/schedule`,
                    "DELETE",
                    { revision: post.revision },
                  );
                  setScheduledAt(null);
                  setNotice("Đã hủy lịch đăng.", "success");
                } catch (e) {
                  setNotice(message(e), "error");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Hủy lịch
            </button>
          </div>
        )}
        {recovery && (
          <div className="notice" role="status">
            Có nội dung chưa lưu trên thiết bị này.
            {recovery.revision !== initial.revision
              ? " Bản trên máy chủ đã thay đổi; kiểm tra kỹ trước khi lưu."
              : ""}
            <button
              type="button"
              disabled={dirty || busy}
              onClick={restoreRecovery}
            >
              Phục hồi
            </button>
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.removeItem(recoveryKey(viewerUid, initial.id));
                } catch {
                  /* Optional local recovery cleanup. */
                }
                setRecovery(null);
              }}
            >
              Bỏ bản tạm
            </button>
          </div>
        )}
        <div className="editor-layout">
          <section className="editor-canvas">
            <div className="editor-page">
              <div className="editor-breadcrumb">
                JOURNAL &nbsp; / &nbsp;{" "}
                {post.category || "CHƯA CHỌN CHUYÊN MỤC"}
                <span className="desktop-only" style={{ float: "right" }}>
                  Chưa đăng <BlogIcon name="shield" size={12} />
                </span>
              </div>
              <div className="editor-cover">
                <Cover id={post.coverId} />
                <button
                  className="button small"
                  onClick={() => {
                    setCoverUpload(true);
                    file.current?.click();
                  }}
                >
                  <BlogIcon name="image" size={13} />
                  {post.coverId ? "Đổi ảnh bìa" : "Chọn ảnh bìa"}
                </button>
              </div>
              <textarea
                className="editor-title"
                aria-label="Tiêu đề"
                placeholder="Tiêu đề bài viết"
                rows={1}
                ref={(el) => {
                  if (el) {
                    el.style.height = "0px";
                    el.style.height = el.scrollHeight + "px";
                  }
                }}
                value={post.title}
                maxLength={180}
                onChange={(e) => update("title", e.target.value)}
              />
              <textarea
                className="editor-summary"
                aria-label="Tóm tắt"
                placeholder="Giới thiệu ngắn về bài viết…"
                rows={1}
                ref={(el) => {
                  if (el) {
                    el.style.height = "0px";
                    el.style.height = el.scrollHeight + "px";
                  }
                }}
                value={post.summary}
                maxLength={500}
                onChange={(e) => update("summary", e.target.value)}
              />
              <div className="editor-author">
                <Avatar name={authorName} className="dark" />
                <span>{authorName}</span>
                <span>·</span>
                <span>
                  {Math.max(
                    1,
                    Math.ceil(
                      bodyText(post.body).split(/\s+/).filter(Boolean).length /
                        220,
                    ),
                  )}{" "}
                  phút đọc
                </span>
              </div>
              <RichEditor
                key={recoveryGeneration}
                body={post.body}
                onChange={(b) => update("body", b)}
                onUploadedAlt={() => lastUploadedAlt.current}
                onUploadImage={async (imageFile) =>
                  (await upload(imageFile)).url
                }
                onError={(error) => setNotice(error, "error")}
                onImage={() =>
                  new Promise((resolve) => {
                    setCoverUpload(false);
                    resolveUpload.current = resolve;
                    file.current?.click();
                  })
                }
              />
              <input
                ref={file}
                type="file"
                hidden
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try {
                    const m = await upload(f);
                    if (coverUpload) update("coverId", m.id);
                    else resolveUpload.current?.(m.url);
                    setNotice("Đã tải ảnh lên.", "success");
                  } catch (e) {
                    setNotice(message(e), "error");
                    resolveUpload.current?.(null);
                  } finally {
                    e.target.value = "";
                    resolveUpload.current = null;
                  }
                }}
              />
              <div className="editor-foot">
                <span>
                  {post.language === "vi" ? "Tiếng Việt" : "English"} ·{" "}
                  {bodyText(post.body).split(/\s+/).filter(Boolean).length} từ
                </span>
                <span>Phiên bản {post.revision}</span>
              </div>
              <details className="editor-extra" open>
                <summary>Nguồn tham khảo & ý chính</summary>
                <div className="field">
                  <label>
                    Nguồn tham khảo — mỗi dòng: tên | URL
                    <textarea
                      value={sourceText}
                      onChange={(e) => {
                        setSourceText(e.target.value);
                        update(
                          "sources",
                          e.target.value
                            .split("\n")
                            .filter(Boolean)
                            .map((s) => {
                              const [title, ...url] = s.split("|");
                              return {
                                title: title.trim(),
                                url: url.join("|").trim(),
                              };
                            }),
                        );
                      }}
                    />
                  </label>
                </div>
                <div className="field">
                  <label>
                    Ý chính
                    <textarea
                      value={post.answer}
                      onChange={(e) => update("answer", e.target.value)}
                    />
                  </label>
                </div>
              </details>
            </div>
          </section>
          <aside className="editor-settings">
            <div className="settings-head">
              <span className="active">Thiết lập bài viết</span>
              <button onClick={() => void openHistory()}>Lịch sử</button>
            </div>
            <div className="field">
              <label>
                Tác giả
                <select
                  aria-label="Tác giả"
                  value={post.authorId}
                  onChange={(e) => update("authorId", e.target.value)}
                >
                  <option value="">Chọn tác giả</option>
                  {authors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="field">
              <label>
                Người phụ trách
                <select
                  aria-label="Người phụ trách"
                  value={post.assignee}
                  disabled={!publisher}
                  onChange={(e) => update("assignee", e.target.value)}
                >
                  <option value="">Chưa giao</option>
                  {!members.some((m) => m.id === post.assignee) &&
                    post.assignee && (
                      <option value={post.assignee}>
                        Người phụ trách hiện tại
                      </option>
                    )}
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <TaxonomyFields
              onCreateCategory={onCreateCategory}
              category={post.category}
              categories={categories}
              canCreate={canCreateCategory}
              tags={post.tags}
              onCategory={(name) => update("category", name)}
              onTags={(tags) => update("tags", tags)}
              notify={(text, kind) => {
                setNotice(text, kind);
                setTaxonomyToastRevision((value) => value + 1);
              }}
              onPending={(pending) => {
                categoryPending.current = pending;
              }}
            />
            <div className="field-rule" />
            <div className="field">
              <label>
                Đường dẫn bài viết
                <input
                  aria-label="Slug"
                  value={post.slug}
                  disabled={Boolean(post.publishedSlug)}
                  onChange={(e) => update("slug", e.target.value)}
                />
              </label>
              <small>
                /posts/{post.slug || "duong-dan-bai-viet"}
                {post.publishedSlug && " · Đã khóa sau xuất bản"}
              </small>
            </div>
            <div className="field">
              <label>
                Ngôn ngữ
                <select
                  aria-label="Ngôn ngữ"
                  value={post.language}
                  onChange={(e) =>
                    update("language", e.target.value as "vi" | "en")
                  }
                >
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">English</option>
                </select>
              </label>
            </div>
            <div className="field-rule" />
            <label className="toggle-row">
              Cho phép bình luận
              <input
                className="toggle"
                aria-label="Bình luận"
                type="checkbox"
                checked={post.commentsEnabled}
                onChange={(e) => update("commentsEnabled", e.target.checked)}
              />
            </label>
            <p className="private-note">
              Bình luận được kiểm tra spam tự động. Nội dung đáng ngờ sẽ chờ
              duyệt.
            </p>
            <div className="field-rule" />
            <section
              className="editor-publish-check"
              aria-label="Chuẩn bị xuất bản"
            >
              <div className="between small">
                <strong>Chuẩn bị xuất bản</strong>
                <span className="badge">
                  {publicationChecks(post).filter((check) => check.ok).length} /{" "}
                  {publicationChecks(post).length}
                </span>
              </div>
              <div className="checklist">
                {publicationChecks(post).map(({ ok, label }) => (
                  <div key={String(label)}>
                    <BlogIcon name={ok ? "check" : "clock"} size={12} />
                    {label}
                  </div>
                ))}
              </div>
              <p className="small">
                Đây là nhắc việc biên tập, không thay kiểm tra xuất bản. Hãy xem
                trước mobile, kiểm tra link có hoạt động và đặt series-dsa +
                part-1 cho chuỗi bài. Thêm heading Checklist khi bài có bước áp
                dụng.
              </p>
              <button
                className="button small editor-seo-preview"
                onClick={() => setModal("seo")}
              >
                <BlogIcon name="search" size={13} />
                Xem trước SEO & chia sẻ
              </button>
            </section>
            <div className="editor-secondary-actions">
              <button
                className="button small"
                disabled={busy}
                onClick={() => void save("review")}
              >
                <BlogIcon name="check" size={14} />
                Gửi duyệt
              </button>
              {post.coverId && (
                <button
                  className="button small"
                  onClick={() => update("coverId", "")}
                >
                  Bỏ ảnh bìa
                </button>
              )}
              {publisher && post.publishedAt && (
                <button
                  className="button small"
                  disabled={busy}
                  onClick={() => setModal("unpublish")}
                >
                  Gỡ bài
                </button>
              )}
              <button
                className="button small editor-archive-action"
                disabled={busy}
                onClick={() => setModal("archive")}
              >
                Chuyển vào thùng rác
              </button>
            </div>
          </aside>
        </div>
      </fieldset>
      {modal && (
        <BlogDialog
          title={
            modal === "history"
              ? "Lịch sử bài viết"
              : modal === "seo"
                ? "Ấn tượng đầu tiên."
                : modal === "unpublish"
                  ? "Gỡ bài viết?"
                  : modal === "archive"
                    ? "Chuyển vào thùng rác?"
                    : "Xuất bản bài viết"
          }
          onClose={() => {
            if (!publicationLock.current) setModal(null);
          }}
        >
          {modal === "history" ? (
            <>
              <p>
                Khôi phục tạo một bản nháp mới. Lưu thay đổi hiện tại trước khi
                khôi phục.
              </p>
              {history.length === 0 && <p>Chưa có phiên bản trước đó.</p>}
              <ol className="revision-timeline">
                {[...history]
                  .sort((a, b) => b.revision - a.revision)
                  .map((h) => (
                    <li className="revision-timeline__item" key={h.revision}>
                      <span>
                        <strong>Phiên bản {h.revision}</strong>
                        <time dateTime={h.updatedAt}>
                          {new Date(h.updatedAt).toLocaleString("vi")}
                        </time>
                      </span>
                      <button
                        className="revision-restore"
                        aria-label={`Khôi phục phiên bản ${h.revision}`}
                        title={
                          dirty
                            ? "Lưu thay đổi hiện tại trước khi khôi phục"
                            : `Khôi phục phiên bản ${h.revision}`
                        }
                        disabled={dirty || busy}
                        onClick={async () => {
                          setBusy(true);
                          try {
                            await request(
                              `/api/admin/blog/posts/${post.id}/restore`,
                              "POST",
                              { revision: post.revision, target: h.revision },
                            );
                            window.location.reload();
                          } catch (e) {
                            setNotice(message(e), "error");
                            setModal(null);
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        <BlogIcon name="history" size={15} />
                      </button>
                    </li>
                  ))}
              </ol>
            </>
          ) : modal === "seo" ? (
            <>
              <p>Thiết lập nội dung cho tìm kiếm và liên kết chia sẻ.</p>
              <div className="field">
                <label>
                  Tiêu đề SEO
                  <input
                    value={post.seoTitle}
                    onChange={(e) => update("seoTitle", e.target.value)}
                  />
                </label>
              </div>
              <div className="field">
                <label>
                  Mô tả SEO
                  <textarea
                    value={post.seoDescription}
                    onChange={(e) => update("seoDescription", e.target.value)}
                  />
                </label>
              </div>
              <div className="seo-preview">
                /posts/{post.slug}
                <strong>{post.seoTitle || post.title}</strong>
                {post.seoDescription || post.summary}
              </div>
              <div
                className="studio-social-preview"
                aria-label="Xem trước liên kết chia sẻ"
              >
                <div className="studio-social-image">
                  <span>HUNPEO LABS / {post.category || "JOURNAL"}</span>
                  <strong>{post.title || "Tiêu đề bài viết"}</strong>
                  <small>
                    {authorName} <span>{window.location.host}</span>
                  </small>
                </div>
                <div className="studio-social-copy">
                  <small>HUNPEOLABS.COM</small>
                  <strong>
                    {post.seoTitle || post.title || "Tiêu đề bài viết"}
                  </strong>
                  <p>
                    {post.seoDescription ||
                      post.summary ||
                      "Thêm tóm tắt để người đọc biết bài viết nói về điều gì."}
                  </p>
                </div>
              </div>
              <p className="private-note">
                Thẻ dùng tiêu đề, mô tả và ảnh chia sẻ tạo từ bài viết. Hình
                trên mạng xã hội có thể khác tùy nền tảng; thay đổi có hiệu lực
                sau khi cập nhật bài đăng.
              </p>
            </>
          ) : (
            <>
              {modal !== "publish" && (
                <>
                  <p>
                    {modal === "unpublish"
                      ? "Bài viết và bình luận sẽ được ẩn. Bạn vẫn giữ bản nháp."
                      : "Bài được giữ trong thùng rác và có thể khôi phục. Bài đang công khai cần được gỡ trước."}
                  </p>
                  <div className="mod-context">
                    <strong>{post.title || "Bài chưa đặt tên"}</strong>
                    <div className="muted small">
                      {authorName} · {post.category}
                    </div>
                  </div>
                </>
              )}
              {modal === "publish" && (
                <SchedulePicker
                  value={scheduleDate}
                  onChange={setScheduleDate}
                  onValidityChange={setScheduleReady}
                  disabled={busy || publicationAction !== null}
                />
              )}
              <div
                className={modal === "publish" ? "publish-actions" : undefined}
              >
                <button
                  className="button primary publish-action"
                  disabled={busy || publicationAction !== null}
                  aria-busy={publicationAction === "publish"}
                  onClick={() => {
                    const action = modal;
                    if (action !== "publish") setModal(null);
                    if (action === "archive") void save("archived");
                    else
                      void publish(
                        action === "unpublish" ? "unpublish" : "publish",
                      );
                  }}
                >
                  <BlogIcon name="arrow" size={14} />
                  {modal === "publish"
                    ? publicationAction === "publish"
                      ? "Đang xuất bản…"
                      : "Xuất bản ngay"
                    : "Xác nhận"}
                  {publicationAction === "publish" && (
                    <span
                      className="publish-button-progress"
                      aria-hidden="true"
                    />
                  )}
                </button>
                {modal === "publish" && (
                  <button
                    type="button"
                    className="button primary publish-action"
                    aria-busy={publicationAction === "schedule"}
                    disabled={
                      busy ||
                      publicationAction !== null ||
                      !scheduleReady ||
                      !localScheduleInstant(scheduleDate) ||
                      !validScheduleTime(localScheduleInstant(scheduleDate)!)
                    }
                    onClick={() => void schedulePublication()}
                  >
                    <BlogIcon name="clock" size={14} />
                    {publicationAction === "schedule"
                      ? "Đang lên lịch…"
                      : "Lên lịch"}
                    {publicationAction === "schedule" && (
                      <span
                        className="publish-button-progress"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </BlogDialog>
      )}
    </div>
  );
}

import { notify } from "../../../shared/feedback";
import { LoadingState } from "../../../shared/Loading";
import { TaxonomyFields } from "./taxonomy-fields";
import { auth } from "../../../shared/firebase";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  bodyText,
  type StudioPost,
  type StudioDraft,
} from "../../../../packages/domain/blog-studio";
import {
  readStudio,
  studioCommands,
  type StudioSettings,
  type StudioSchedule,
} from "./api";
import {
  createStudioFence,
  draftOf,
  parseRecovery,
  publicationChecks,
  recoveryKey,
  titleSlug,
} from "./state";
import { StudioDialog } from "./dialog";
import { SchedulePicker } from "./schedule-picker";
import {
  localScheduleInstant,
  validScheduleTime,
  scheduleLabel,
} from "./schedule-time";
import { RichPreview } from "./RichPreview";

const RichEditor = lazy(() =>
  import("./rich-editor").then((m) => ({ default: m.RichEditor })),
);
export type StudioMediaAdapter = {
  upload: (
    file: File,
    context: { postId: string; alt: string; rightsConfirmed: true },
  ) => Promise<{ id: string; url: string }>;
};
const stateLabels = {
  draft: "Bản nháp",
  review: "Chờ duyệt",
  published: "Đã xuất bản",
  archived: "Đã lưu trữ",
};
export function StudioEditor({
  initial,
  initialSchedule = null,
  uid,
  settings,
  onBack,
  onSaved,
  media,
  canCreateCategory = false,
  onSettingsSaved,
}: {
  initial: StudioPost;
  initialSchedule?: StudioSchedule;
  uid: string;
  settings: StudioSettings;
  onBack: () => void;
  onSaved: (post: StudioPost) => void;
  media?: StudioMediaAdapter;
  canCreateCategory?: boolean;
  onSettingsSaved?: (settings: StudioSettings) => void;
}) {
  const [post, setPost] = useState(initial),
    current = useRef(initial),
    fence = useRef(createStudioFence()),
    commands = useRef(studioCommands());
  const [scheduleState, setScheduleState] =
    useState<StudioSchedule>(initialSchedule);
  const [dirty, setDirty] = useState(false),
    [busy, setBusy] = useState(false),
    [conflicted, setConflicted] = useState(false),
    [error, setError] = useState("");
  const [modal, setModal] = useState<
      "preview" | "publish" | "history" | "seo" | "unpublish" | "archive" | null
    >(null),
    [preview, setPreview] = useState<StudioPost | null>(null),
    [history, setHistory] = useState<StudioPost[]>([]),
    [historyNext, setHistoryNext] = useState<string | null>(null);
  const [schedule, setSchedule] = useState(""),
    [scheduleValid, setScheduleValid] = useState(false),
    [recovery, setRecovery] = useState<ReturnType<typeof parseRecovery>>(null),
    [editorKey, setEditorKey] = useState(0);
  const lastUploadedAlt = useRef("");
  const categoryPending = useRef(false),
    categoryCommands = useRef(studioCommands());
  const manualSlug = useRef(!!initial.slug),
    working = useRef(false),
    lastDirty = useRef(false),
    pending = useRef<Promise<StudioPost | null> | null>(null),
    alive = useRef(true),
    publication = useRef(false);
  const [sourceText, setSourceText] = useState(
    initial.sources.map((s) => `${s.title} | ${s.url}`).join("\n"),
  );
  const [imageRequest, setImageRequest] = useState<{
      file?: File;
      resolve: (url: string | null) => void;
      reject?: (e: Error) => void;
    } | null>(null),
    [imageAlt, setImageAlt] = useState(""),
    [imageRights, setImageRights] = useState(false),
    [uploadBusy, setUploadBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null),
    cover = useRef(false);
  useEffect(() => {
    alive.current = true;
    try {
      const r = parseRecovery(
        sessionStorage.getItem(recoveryKey(uid, initial.id)),
        uid,
        initial.id,
      );
      if (r && JSON.stringify(r.draft) !== JSON.stringify(draftOf(initial)))
        setRecovery(r);
    } catch {
      /* optional private-tab recovery */
    }
    return () => {
      alive.current = false;
      fence.current.invalidate();
      commands.current.clear();
    };
  }, [uid, initial.id]);
  useEffect(() => {
    lastDirty.current = dirty;
    if (!dirty) return;
    try {
      sessionStorage.setItem(
        recoveryKey(uid, post.id),
        JSON.stringify({
          uid,
          id: post.id,
          revision: post.revision,
          at: Date.now(),
          draft: draftOf(post),
        }),
      );
    } catch {
      /* backup must not interrupt editing */
    }
  }, [dirty, post, uid]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (lastDirty.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);
  const update = useCallback(
    <K extends keyof StudioDraft>(key: K, value: StudioDraft[K]) => {
      if (publication.current) return;
      fence.current.edit();
      if (key === "slug") manualSlug.current = true;
      const p = {
        ...current.current,
        [key]: value,
        ...(key === "title" &&
        !manualSlug.current &&
        !current.current.publishedSlug
          ? { slug: titleSlug(String(value)) }
          : {}),
      };
      current.current = p;
      setPost(p);
      setDirty(true);
      lastDirty.current = true;
    },
    [],
  );
  const save = useCallback(
    async (announce = false): Promise<StudioPost | null> => {
      if (
        conflicted ||
        categoryPending.current ||
        !alive.current ||
        auth?.currentUser?.uid !== uid
      )
        return null;
      if (working.current) return pending.current;
      const epoch = fence.current.epoch(),
        generation = fence.current.generation(),
        submitted = current.current;
      working.current = true;
      setBusy(true);
      setError("");
      const task = (async () => {
        try {
          const result = await commands.current.send(
            "save",
            submitted.id,
            submitted.revision,
            draftOf(submitted),
          );
          if (
            !alive.current ||
            auth?.currentUser?.uid !== uid ||
            !fence.current.current(epoch)
          )
            return null;
          // Preserve edits made while save was in flight; only server-owned metadata advances.
          current.current = {
            ...current.current,
            revision: result.draft.revision,
            state: result.draft.state,
            updatedAt: result.draft.updatedAt,
          };
          delete current.current.scheduledAt;
          setScheduleState(null);
          setPost(current.current);
          if (fence.current.unchanged(epoch, generation)) {
            setDirty(false);
            lastDirty.current = false;
            try {
              sessionStorage.removeItem(recoveryKey(uid, submitted.id));
            } catch {
              /* optional */
            }
          }
          onSaved(result.draft);
          if (announce)
            notify("Đã lưu bản nháp. Bài công khai chưa thay đổi.", "success");
          return result.draft;
        } catch (e) {
          if (
            alive.current &&
            auth?.currentUser?.uid === uid &&
            fence.current.current(epoch)
          ) {
            setError((e as Error).message);
            if (
              /đã thay đổi|phiên bản|revision|conflict/i.test(
                (e as Error).message,
              )
            )
              setConflicted(true);
          }
          return null;
        } finally {
          if (
            alive.current &&
            auth?.currentUser?.uid === uid &&
            fence.current.current(epoch)
          ) {
            working.current = false;
            pending.current = null;
            setBusy(false);
          }
        }
      })();
      pending.current = task;
      return task;
    },
    [conflicted, uid, onSaved],
  );
  useEffect(() => {
    if (!dirty || conflicted || modal || recovery) return;
    const timer = setTimeout(() => void save(), 1800);
    return () => clearTimeout(timer);
  }, [post, dirty, conflicted, modal, recovery, save]);
  const cleanSaved = async () => {
    const epoch = fence.current.epoch(),
      generation = fence.current.generation();
    if (working.current) await pending.current;
    const saved = lastDirty.current ? await save() : current.current;
    return saved &&
      alive.current &&
      fence.current.unchanged(epoch, generation) &&
      !lastDirty.current
      ? saved
      : null;
  };
  async function openPreview() {
    if (working.current || publication.current) return;
    setError("");
    const saved = await cleanSaved();
    if (!saved) return;
    const epoch = fence.current.epoch();
    setBusy(true);
    working.current = true;
    try {
      const r = await readStudio<{ draft: StudioPost }>({
        kind: "get",
        id: saved.id,
      });
      if (
        alive.current &&
        auth?.currentUser?.uid === uid &&
        fence.current.current(epoch)
      ) {
        setPreview(r.draft);
        setModal("preview");
      }
    } catch (e) {
      if (
        alive.current &&
        auth?.currentUser?.uid === uid &&
        fence.current.current(epoch)
      )
        setError((e as Error).message);
    } finally {
      if (
        alive.current &&
        auth?.currentUser?.uid === uid &&
        fence.current.current(epoch)
      ) {
        working.current = false;
        setBusy(false);
      }
    }
  }
  async function revisions(after?: string) {
    if (working.current) return;
    const epoch = fence.current.epoch();
    setBusy(true);
    working.current = true;
    try {
      const r = await readStudio<{ items: StudioPost[]; next: string | null }>({
        kind: "revisions",
        id: post.id,
        ...(after ? { after } : {}),
      });
      if (
        alive.current &&
        auth?.currentUser?.uid === uid &&
        fence.current.current(epoch)
      ) {
        setHistory((h) => (after ? [...h, ...r.items] : r.items));
        setHistoryNext(r.next);
        setModal("history");
      }
    } catch (e) {
      if (
        alive.current &&
        auth?.currentUser?.uid === uid &&
        fence.current.current(epoch)
      )
        setError((e as Error).message);
    } finally {
      if (
        alive.current &&
        auth?.currentUser?.uid === uid &&
        fence.current.current(epoch)
      ) {
        working.current = false;
        setBusy(false);
      }
    }
  }
  async function action(
    name:
      "review" | "publish" | "schedule" | "unpublish" | "archive" | "restore",
    payload?: unknown,
  ) {
    if (
      publication.current ||
      working.current ||
      conflicted ||
      auth?.currentUser?.uid !== uid
    )
      return;
    publication.current = true;
    const epoch = fence.current.epoch();
    setError("");
    try {
      const saved = await cleanSaved();
      if (!saved) {
        setError("Lưu phần vừa thay đổi trước khi tiếp tục.");
        return;
      }
      setBusy(true);
      working.current = true;
      const r = await commands.current.send(
        name,
        saved.id,
        saved.revision,
        payload,
      );
      if (
        !alive.current ||
        auth?.currentUser?.uid !== uid ||
        !fence.current.current(epoch)
      )
        return;
      current.current = r.draft;
      setPost(r.draft);
      setDirty(false);
      lastDirty.current = false;
      onSaved(r.draft);
      setModal(null);
      setScheduleState(
        name === "schedule" ? { dueAt: r.draft.scheduledAt } : null,
      );
      setEditorKey((k) => k + 1);
      notify(
        name === "publish"
          ? "Đã xuất bản bài viết."
          : name === "schedule"
            ? "Đã lên lịch xuất bản."
            : name === "review"
              ? "Đã gửi duyệt."
              : name === "restore"
                ? "Đã khôi phục thành bản nháp mới."
                : name === "unpublish"
                  ? "Đã gỡ bài công khai. Bản nháp được giữ lại."
                  : "Đã lưu trữ bản nháp.",
        "success",
      );
    } catch (e) {
      if (
        alive.current &&
        auth?.currentUser?.uid === uid &&
        fence.current.current(epoch)
      )
        setError((e as Error).message);
    } finally {
      if (
        alive.current &&
        auth?.currentUser?.uid === uid &&
        fence.current.current(epoch)
      ) {
        publication.current = false;
        working.current = false;
        setBusy(false);
      }
    }
  }
  async function uploadRequested() {
    if (!imageRequest || uploadBusy) return;
    const epoch = fence.current.epoch();
    setUploadBusy(true);
    setError("");
    try {
      if (!media) throw Error("Chưa kết nối chức năng tải ảnh Studio.");
      if (!imageRequest.file || !imageRights || imageAlt.trim().length < 2)
        throw Error("Chọn ảnh, thêm mô tả và xác nhận quyền sử dụng.");
      const r = await media.upload(imageRequest.file, {
        postId: post.id,
        alt: imageAlt.trim(),
        rightsConfirmed: true,
      });
      if (
        !alive.current ||
        auth?.currentUser?.uid !== uid ||
        !fence.current.current(epoch)
      )
        return;
      if (!/^\/media\/[a-zA-Z0-9-]{1,80}$/.test(r.url))
        throw Error("Đường dẫn ảnh không hợp lệ.");
      if (cover.current) {
        update("coverId", r.id);
        cover.current = false;
      }
      lastUploadedAlt.current = imageAlt.trim();
      imageRequest.resolve(r.url);
      setImageRequest(null);
      notify("Đã tải ảnh vào bản nháp.", "success");
    } catch (e) {
      if (
        alive.current &&
        auth?.currentUser?.uid === uid &&
        fence.current.current(epoch)
      )
        setError((e as Error).message);
    } finally {
      if (
        alive.current &&
        auth?.currentUser?.uid === uid &&
        fence.current.current(epoch)
      )
        setUploadBusy(false);
    }
  }
  function requestImage(file?: File): Promise<string | null> {
    setImageAlt("");
    setImageRights(false);
    return new Promise((resolve) => {
      setImageRequest({ file, resolve });
      if (!file) setTimeout(() => fileRefClick(), 0);
    });
  }
  function fileRefClick() {
    file.current?.click();
  }
  function restoreLocal() {
    if (!recovery) return;
    const p = { ...current.current, ...recovery.draft };
    current.current = p;
    setPost(p);
    fence.current.edit();
    setDirty(true);
    lastDirty.current = true;
    manualSlug.current = true;
    setSourceText(p.sources.map((s) => `${s.title} | ${s.url}`).join("\n"));
    setEditorKey((k) => k + 1);
    if (recovery.revision !== initial.revision) {
      setConflicted(true);
      setError(
        "Bản trên máy chủ đã thay đổi. Sao chép bản phục hồi để đối chiếu trước khi tải lại.",
      );
    }
    setRecovery(null);
  }
  const checks = publicationChecks(draftOf(post));
  return (
    <section className="studioEditor">
      <header className="studioToolbar">
        <div>
          <button
            disabled={busy}
            onClick={async () => {
              if (!lastDirty.current) {
                onBack();
                return;
              }
              if (await cleanSaved()) onBack();
            }}
          >
            Trở về danh sách
          </button>
          <span className="crmBadge">{stateLabels[post.state]}</span>
          <span role="status">
            {busy
              ? "Đang xử lý…"
              : dirty
                ? "Chưa lưu thay đổi"
                : "Đã lưu bản nháp"}
          </span>
        </div>
        <div>
          <button disabled={busy || conflicted} onClick={() => void save(true)}>
            Lưu bản nháp
          </button>
          <button disabled={busy} onClick={() => void revisions()}>
            Lịch sử
          </button>
          <button
            disabled={busy || conflicted}
            onClick={() => void openPreview()}
          >
            Xem trước bản đã lưu
          </button>
          <button
            className="primary"
            disabled={busy || conflicted}
            onClick={() => setModal("publish")}
          >
            Xuất bản / lên lịch
          </button>
        </div>
      </header>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {scheduleState?.status === "blocked" && (
        <p role="alert" className="error">
          Bài chưa được xuất bản theo lịch. Kiểm tra nội dung, tác giả, ảnh và
          quyền biên tập rồi lên lịch lại.
        </p>
      )}
      {post.scheduledAt && (
        <p className="notice">
          Lịch xuất bản: {scheduleLabel(post.scheduledAt)}. Lưu thay đổi sẽ hủy
          lịch hiện tại; cần lên lịch lại bản mới.
        </p>
      )}
      {conflicted && (
        <p className="notice">
          Bản thảo đã thay đổi. Sao chép nội dung cần giữ trước khi tải lại.
          Không tự ghi đè phiên bản khác.
        </p>
      )}
      {recovery && (
        <div className="notice">
          <p>Có bản tạm trong phiên trình duyệt này.</p>
          <button onClick={restoreLocal}>Khôi phục bản tạm</button>
          <button
            onClick={() => {
              try {
                sessionStorage.removeItem(recoveryKey(uid, post.id));
              } catch {
                /* optional */
              }
              setRecovery(null);
            }}
          >
            Bỏ bản tạm
          </button>
        </div>
      )}
      <fieldset className="studioLayout" disabled={publication.current}>
        <div className="studioCanvas panel form">
          <label>
            Tiêu đề
            <textarea
              value={post.title}
              maxLength={180}
              onChange={(e) => update("title", e.target.value)}
            />
          </label>
          <label>
            Tóm tắt
            <textarea
              value={post.summary}
              maxLength={500}
              onChange={(e) => update("summary", e.target.value)}
            />
          </label>
          <p>
            {Math.max(
              1,
              Math.ceil(
                bodyText(post.body).split(/\s+/).filter(Boolean).length / 220,
              ),
            )}{" "}
            phút đọc · Phiên bản {post.revision}
          </p>
          <Suspense
            fallback={
              <LoadingState overlay={false}>
                Đang mở trình soạn thảo…
              </LoadingState>
            }
          >
            <RichEditor
              key={editorKey}
              body={post.body}
              onChange={(b) => update("body", b)}
              onError={setError}
              onImage={() => requestImage()}
              onUploadedAlt={() => lastUploadedAlt.current}
              onUploadImage={async (f) => {
                const result = await requestImage(f);
                if (!result) throw Error("Đã hủy tải ảnh.");
                return result;
              }}
            />
          </Suspense>
          <details>
            <summary>Nguồn tham khảo và ý chính</summary>
            <label>
              Nguồn tham khảo · mỗi dòng: tên | URL
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
            <label>
              Ý chính
              <textarea
                value={post.answer}
                maxLength={1200}
                onChange={(e) => update("answer", e.target.value)}
              />
            </label>
          </details>
        </div>
        <aside className="panel form studioSettings">
          <h2>Thiết lập bài viết</h2>
          <label>
            Tác giả
            <select
              value={post.authorId}
              onChange={(e) => update("authorId", e.target.value)}
            >
              <option value="">Chọn tác giả</option>
              {!settings.authors.some((a) => a.id === post.authorId) &&
                post.authorId && (
                  <option value={post.authorId}>
                    Tác giả hiện tại chưa được cấu hình
                  </option>
                )}
              {settings.authors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Người phụ trách · UID
            <input
              value={post.assignee}
              maxLength={128}
              onChange={(e) => update("assignee", e.target.value)}
            />
          </label>
          <TaxonomyFields
            category={post.category}
            categories={settings.categories}
            canCreate={canCreateCategory}
            tags={post.tags}
            onCategory={(v) => update("category", v)}
            onTags={(v) => update("tags", v)}
            notify={(text) => notify(text, "info")}
            onPending={(v) => {
              categoryPending.current = v;
            }}
            onCreateCategory={async (name) => {
              const { commentsEnabled, requireReview, authors, categories } =
                settings;
              const epoch = fence.current.epoch();
              const r = await categoryCommands.current.send<{
                settings: StudioSettings;
              }>("settings", undefined, settings.revision, {
                commentsEnabled,
                requireReview,
                authors,
                categories: [...categories, name],
              });
              if (
                !alive.current ||
                auth?.currentUser?.uid !== uid ||
                !fence.current.current(epoch)
              )
                throw Error("Phiên biên tập đã thay đổi.");
              onSettingsSaved?.(r.settings);
              return { name };
            }}
          />
          <label>
            Đường dẫn bài viết
            <input
              value={post.slug}
              disabled={!!post.publishedSlug}
              maxLength={100}
              onChange={(e) => update("slug", e.target.value)}
            />
          </label>
          <small>
            /posts/{post.slug || "duong-dan-bai-viet"}
            {post.publishedSlug ? " · Đã khóa sau xuất bản" : ""}
          </small>
          <label>
            Ngôn ngữ
            <select
              value={post.language}
              onChange={(e) =>
                update("language", e.target.value as "vi" | "en")
              }
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={post.commentsEnabled}
              onChange={(e) => update("commentsEnabled", e.target.checked)}
            />{" "}
            Cho phép bình luận
          </label>
          <button
            disabled={busy}
            onClick={() => {
              cover.current = true;
              void requestImage();
            }}
          >
            {post.coverId ? "Đổi ảnh bìa" : "Chọn ảnh bìa"}
          </button>
          {post.coverId && (
            <>
              <small>Mã ảnh bìa: {post.coverId}</small>
              <button onClick={() => update("coverId", "")}>Bỏ ảnh bìa</button>
            </>
          )}
          <h3>Chuẩn bị xuất bản</h3>
          <ul>
            {checks.map((c) => (
              <li key={c.label}>
                {c.ok ? "✓" : "○"} {c.label}
              </li>
            ))}
          </ul>
          <p className="muted">
            Nhắc việc biên tập; máy chủ vẫn kiểm tra quyền và nội dung khi xuất
            bản.
          </p>
          <button onClick={() => setModal("seo")}>
            SEO và liên kết chia sẻ
          </button>
          <button
            disabled={busy || conflicted}
            onClick={() => void action("review")}
          >
            Gửi duyệt
          </button>
          {post.publishedAt && (
            <button disabled={busy} onClick={() => setModal("unpublish")}>
              Gỡ bài công khai
            </button>
          )}
          <button disabled={busy} onClick={() => setModal("archive")}>
            Lưu trữ bản nháp
          </button>
        </aside>
      </fieldset>
      {modal && (
        <StudioDialog
          title={
            modal === "preview"
              ? "Xem trước bản đã lưu"
              : modal === "history"
                ? "Lịch sử phiên bản"
                : modal === "seo"
                  ? "SEO và liên kết chia sẻ"
                  : modal === "unpublish"
                    ? "Gỡ bài công khai?"
                    : modal === "archive"
                      ? "Lưu trữ bản nháp?"
                      : "Xuất bản bài viết"
          }
          onClose={() => {
            if (!publication.current && !busy) setModal(null);
          }}
        >
          {modal === "preview" && preview && (
            <>
              <p className="notice">
                Bản đã lưu · phiên bản {preview.revision}. Xem trước riêng tư,
                chưa phải bài công khai.
              </p>
              <h1>{preview.title}</h1>
              <p>{preview.summary}</p>
              <RichPreview body={preview.body} privateImages />
            </>
          )}
          {modal === "history" && (
            <>
              <p>
                Khôi phục tạo một bản nháp mới. Lưu thay đổi hiện tại trước khi
                khôi phục.
              </p>
              {!history.length && <p>Chưa có phiên bản trước đó.</p>}
              <ol>
                {history.map((h) => (
                  <li key={h.revision}>
                    Phiên bản {h.revision} ·{" "}
                    {new Date(h.updatedAt).toLocaleString("vi-VN")}
                    <button
                      disabled={dirty || busy || conflicted}
                      onClick={() =>
                        void action("restore", { revision: h.revision })
                      }
                    >
                      Khôi phục phiên bản {h.revision}
                    </button>
                  </li>
                ))}
              </ol>
              {historyNext && (
                <button
                  disabled={busy}
                  onClick={() => void revisions(historyNext)}
                >
                  Xem thêm phiên bản
                </button>
              )}
            </>
          )}
          {modal === "seo" && (
            <div className="form">
              <label>
                Tiêu đề SEO
                <input
                  value={post.seoTitle}
                  maxLength={180}
                  onChange={(e) => update("seoTitle", e.target.value)}
                />
              </label>
              <label>
                Mô tả SEO
                <textarea
                  value={post.seoDescription}
                  maxLength={500}
                  onChange={(e) => update("seoDescription", e.target.value)}
                />
              </label>
              <article className="panel">
                <small>/posts/{post.slug}</small>
                <h3>{post.seoTitle || post.title}</h3>
                <p>{post.seoDescription || post.summary}</p>
              </article>
              <p>Thẻ liên kết thực tế có thể khác tùy nền tảng.</p>
            </div>
          )}
          {modal === "publish" && (
            <>
              <p>
                Xuất bản hiển thị công khai bản đã lưu. Không đưa thông tin
                khách, chứng từ hoặc nội dung chưa được duyệt vào bài.
              </p>
              <SchedulePicker
                value={schedule}
                onChange={setSchedule}
                onValidityChange={setScheduleValid}
                disabled={busy}
              />
              {post.scheduledAt && (
                <p>Lịch hiện tại: {scheduleLabel(post.scheduledAt)}</p>
              )}
              <div className="crmActions">
                <button
                  className="primary"
                  disabled={busy || conflicted}
                  onClick={() => void action("publish")}
                >
                  Xuất bản ngay
                </button>
                <button
                  disabled={busy || conflicted || !scheduleValid}
                  onClick={() => {
                    const dueAt = localScheduleInstant(schedule);
                    if (dueAt && validScheduleTime(dueAt))
                      void action("schedule", { dueAt });
                  }}
                >
                  Lên lịch xuất bản
                </button>
              </div>
            </>
          )}
          {(modal === "unpublish" || modal === "archive") && (
            <>
              <p>
                {modal === "unpublish"
                  ? "Bài công khai sẽ được ẩn. Bản nháp vẫn được giữ lại."
                  : "Bản nháp được lưu trữ. Bài đang công khai phải được gỡ trước."}
              </p>
              <strong>{post.title || "Bài chưa đặt tên"}</strong>
              <button
                disabled={busy || conflicted}
                onClick={() => void action(modal)}
              >
                {" "}
                {modal === "unpublish"
                  ? "Gỡ bài công khai"
                  : "Lưu trữ bản nháp"}
              </button>
            </>
          )}
        </StudioDialog>
      )}
      {imageRequest && (
        <StudioDialog
          title="Tải ảnh vào bản nháp"
          onClose={() => {
            if (uploadBusy) return;
            imageRequest.resolve(null);
            setImageRequest(null);
            cover.current = false;
          }}
        >
          <div className="form">
            <label>
              Ảnh
              <input
                ref={file}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                disabled={uploadBusy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setImageRequest((r) => (r ? { ...r, file: f } : null));
                  e.target.value = "";
                }}
              />
            </label>
            {imageRequest.file && <p>{imageRequest.file.name}</p>}
            <label>
              Mô tả ảnh
              <input
                value={imageAlt}
                maxLength={300}
                onChange={(e) => setImageAlt(e.target.value)}
              />
            </label>
            <label>
              <input
                type="checkbox"
                checked={imageRights}
                onChange={(e) => setImageRights(e.target.checked)}
              />{" "}
              Tôi có quyền dùng ảnh này trên website
            </label>
            <p>
              Ảnh bản nháp chưa được phục vụ công khai. Không tải thông tin cá
              nhân hoặc bằng chứng giao dịch.
            </p>
            <button
              disabled={
                uploadBusy ||
                !imageRequest.file ||
                !imageRights ||
                imageAlt.trim().length < 2
              }
              onClick={() => void uploadRequested()}
            >
              {uploadBusy ? "Đang tải ảnh…" : "Tải ảnh"}
            </button>
            {error && <p role="alert">{error}</p>}
          </div>
        </StudioDialog>
      )}
    </section>
  );
}

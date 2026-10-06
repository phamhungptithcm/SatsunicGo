import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../shared/firebase";
import { beginProgress } from "../../../shared/feedback";
import type { StudioPost } from "../../../../packages/domain/blog-studio";
import { createSourceServices } from "./source-services";
import { StudioShell } from "./source-shell";
import { Dashboard } from "./source-dashboard";
import { Editor } from "./source-editor";
import { Settings, type Entry } from "./source-settings";
import { Account } from "./source-account";
import { BlogContent } from "./source-preview";
import { SourceLink } from "./source-link";
import { bodyText } from "../../../../packages/domain/blog-studio";
import { sourceMessage, sourceReportItem } from "./source-adapter";
import { BlogDialog as StudioDialog } from "./source-dialog";
import { callService } from "../../../shared/firebase";
import { Moderation } from "./source-moderation";
import {
  readModerationWindow,
  readModerationTitles,
} from "./moderation-pagination";
import { imageFileError } from "./editor-actions";
import "./source-host-compat.css";
import "./source-design.css";
type State = {
  role: "author" | "publisher" | "admin";
  posts: StudioPost[];
  next: string | null;
  summary: Record<string, number | null>;
  authors: Entry[];
  taxonomy: Entry[];
  members: Entry[];
  assignable: { id: string; name: string }[];
  post?: StudioPost;
  comments?: {
    id: string;
    postId: string;
    name: string;
    text: string;
    revision: number;
    createdAt?: string;
    status?: string;
    moderationReasons?: string[];
  }[];
  reports?: {
    id: string;
    commentId: string;
    reason: string;
    text: string;
    revision: number;
    reportRevision: number;
  }[];
  moderationNext?: string | null;
  postTitles?: Record<string, string>;
};
type Upload = {
  file: File;
  postId?: string;
  authorId?: string;
  resolve: (response: Response) => void;
  reject: (error: Error) => void;
};
/** Faithful source views; all operations cross verified Go callable authority. */
export function SourceStudio({
  uid,
  name = "Tài khoản",
  avatar,
  signOut,
}: {
  uid: string;
  name?: string;
  avatar?: string;
  signOut: () => Promise<void>;
}) {
  const location = useLocation(),
    navigate = useNavigate(),
    services = useMemo(() => createSourceServices(uid), [uid]);
  const [state, setState] = useState<State | null>(null),
    [error, setError] = useState(""),
    [refresh, setRefresh] = useState(0);
  type StateProvenance = {
    uid: string;
    path: string;
    search: string;
    role: State["role"];
  };
  const stateProvenance = useRef<StateProvenance | null>(null),
    settingsRefreshIntent = useRef<StateProvenance | null>(null);
  type Navigation = {
    uid: string;
    sequence: number;
    key: string;
    target: string;
    showHint: boolean;
    finish: () => void;
  };
  const navigationRef = useRef<Navigation | null>(null),
    navigationSequence = useRef(0),
    requestEpoch = useRef(0),
    uploadRef = useRef<Upload | null>(null);
  const [pendingNavigation, setPendingNavigation] = useState<Navigation | null>(
      null,
    ),
    [verifiedShellRole, setVerifiedShellRole] = useState<{
      uid: string;
      role: State["role"];
    } | null>(null);
  const finishNavigation = useCallback((sequence?: number) => {
    const current = navigationRef.current;
    if (sequence !== undefined && current?.sequence !== sequence) return;
    current?.finish();
    navigationRef.current = null;
    setPendingNavigation(null);
  }, []);
  const [upload, setUpload] = useState<Upload | null>(null),
    [alt, setAlt] = useState(""),
    [rights, setRights] = useState(false),
    [uploadBusy, setUploadBusy] = useState(false),
    [uploadError, setUploadError] = useState("");
  useEffect(
    () =>
      auth
        ? onAuthStateChanged(auth, (user) => {
            if (user?.uid !== uid) {
              requestEpoch.current++;
              finishNavigation();
              setVerifiedShellRole(null);
              stateProvenance.current = null;
              settingsRefreshIntent.current = null;
              setState(null);
              services.clear();
              try {
                for (const key of Object.keys(localStorage))
                  if (key.startsWith(`satsunicgo:studio:source:${uid}:`))
                    localStorage.removeItem(key);
              } catch {
                /* Private recovery storage may be unavailable. */
              }
            }
          })
        : undefined,
    [uid, services, finishNavigation],
  );
  const path = location.pathname,
    query = useMemo(
      () => new URLSearchParams(location.search),
      [location.search],
    );
  const go = useCallback(
    (url: string, replace = false, showHint = false) => {
      const target = new URL(url, window.location.href);
      finishNavigation();
      if (target.origin !== window.location.origin) {
        window.location.assign(target.href);
        return;
      }
      const key = target.pathname + target.search;
      const destination = key + target.hash;
      if (key === path + location.search) {
        if (target.hash !== location.hash || replace)
          navigate(destination, { replace });
        return;
      }
      requestEpoch.current++;
      settingsRefreshIntent.current = null;
      if (
        auth?.currentUser?.uid === uid &&
        (target.pathname === "/crm/studio" ||
          target.pathname.startsWith("/crm/studio/"))
      ) {
        const navigation: Navigation = {
          uid,
          sequence: ++navigationSequence.current,
          key,
          target: target.pathname,
          showHint,
          finish: showHint ? beginProgress() : () => {},
        };
        navigationRef.current = navigation;
        setPendingNavigation(navigation);
        try {
          navigate(destination, { replace });
        } catch (error) {
          finishNavigation(navigation.sequence);
          throw error;
        }
      } else {
        navigate(destination, { replace });
      }
    },
    [uid, path, location.search, location.hash, navigate, finishNavigation],
  );
  const router = useMemo(
    () => ({
      push: (url: string) => go(url),
      replace: (url: string) => go(url, true),
      refresh: () => {
        const previous = stateProvenance.current;
        settingsRefreshIntent.current =
          auth?.currentUser?.uid === uid &&
          path === "/crm/studio/settings" &&
          previous?.uid === uid &&
          previous.path === path &&
          previous.search === location.search &&
          previous.role === "admin" &&
          state?.role === "admin" &&
          !error
            ? previous
            : null;
        setRefresh((n) => n + 1);
      },
    }),
    [go, uid, path, location.search, state, error],
  );
  useEffect(() => {
    uploadRef.current = upload;
  }, [upload]);
  useEffect(
    () => () => {
      requestEpoch.current++;
      stateProvenance.current = null;
      settingsRefreshIntent.current = null;
      if (navigationRef.current?.uid === uid) {
        navigationRef.current.finish();
        navigationRef.current = null;
      }
      services.clear();
      uploadRef.current?.reject(Error("Đã đóng Studio."));
    },
    [services, uid],
  );
  useEffect(() => {
    const epoch = ++requestEpoch.current;
    const navigation = navigationRef.current;
    // Browser history can supersede a link without going through our click wrapper.
    if (
      navigation &&
      (navigation.uid !== uid || navigation.key !== path + location.search)
    )
      finishNavigation(navigation.sequence);
    const intent = settingsRefreshIntent.current;
    settingsRefreshIntent.current = null;
    const previous = stateProvenance.current;
    const retainSettings =
      intent !== null &&
      intent === previous &&
      intent.uid === uid &&
      intent.path === path &&
      intent.search === location.search &&
      intent.role === "admin" &&
      path === "/crm/studio/settings" &&
      auth?.currentUser?.uid === uid;
    setError("");
    if (!retainSettings) {
      stateProvenance.current = null;
      setState(null);
    }
    const valid = () =>
      requestEpoch.current === epoch && auth?.currentUser?.uid === uid;
    void (async () => {
      try {
        const summary = await services.advancedRead<
          Record<string, number | null>
        >({ kind: "summary" });
        let role: State["role"] =
            summary.pending === null ? "author" : "publisher",
          members: Entry[] = [];
        if (role === "author" && valid()) {
          stateProvenance.current = null;
          settingsRefreshIntent.current = null;
          setState(null);
          setVerifiedShellRole(null);
        }
        if (role !== "author")
          try {
            members = await services.listPeople<Entry>("members", valid);
            role = "admin";
          } catch (e) {
            if ((e as { code?: string }).code !== "functions/permission-denied")
              throw e;
            if (valid()) {
              stateProvenance.current = null;
              settingsRefreshIntent.current = null;
              setState(null);
              setVerifiedShellRole(null);
            }
          }
        const [authors, taxonomy] = await Promise.all([
          services.listCatalog("authors"),
          services.listCatalog("taxonomy"),
        ]);
        const assignable =
          role === "author"
            ? []
            : await services.listPeople<{ id: string; name: string }>(
                "assignable",
                valid,
              );
        const result: State = {
          role,
          members,
          authors,
          taxonomy,
          assignable,
          summary,
          posts: [],
          next: null,
        };
        const suffix = path.replace(/^\/crm\/studio\/?/, ""),
          postId = suffix.split("/")[0];
        if (!suffix) {
          const list = await services.advancedRead<{
            items: StudioPost[];
            next: string | null;
          }>({
            kind: "list",
            ...(query.get("q") ? { q: query.get("q") } : {}),
            ...(query.get("state") ? { state: query.get("state") } : {}),
            ...(query.get("category")
              ? { category: query.get("category") }
              : {}),
            ...(query.get("cursor") ? { after: query.get("cursor") } : {}),
          });
          result.posts = list.items;
          result.next = list.next;
        } else if (postId === "comments") {
          if (role === "author") throw Error("Cần quyền duyệt nội dung.");
          const status = query.get("status") ?? "pending";

          const comments: NonNullable<State["comments"]> = [];
          if (status === "reports") {
            const page = await services.advancedRead<{
              items: {
                id: string;
                commentId: string;
                reason: string;
                revision: number;
                comment?: NonNullable<State["comments"]>[number] | null;
              }[];
              next: string | null;
            }>({
              kind: "reports",
              reportState: "open",
              ...(query.get("cursor") ? { after: query.get("cursor") } : {}),
            });
            if (!valid()) return;
            result.reports = page.items.map(sourceReportItem);
            result.moderationNext = page.next;
          } else {
            const page = await readModerationWindow(
              (after) =>
                services.moderationPage<NonNullable<State["comments"]>[number]>(
                  status,
                  after,
                ),
              valid,
              query.get("cursor") ?? undefined,
            );
            if (!page || !valid()) return;
            comments.push(...page.items);
            result.moderationNext = page.next;
          }
          result.comments = comments;
          const titles = await readModerationTitles(
            comments,
            (id) => services.request<StudioPost>(`/api/admin/blog/posts/${id}`),
            valid,
          );
          if (!titles || !valid()) return;
          result.postTitles = titles;
        } else if (!["settings", "comments", "account"].includes(postId))
          result.post = await services.request<StudioPost>(
            `/api/admin/blog/posts/${postId}`,
          );
        if (valid()) {
          stateProvenance.current = {
            uid,
            path,
            search: location.search,
            role: result.role,
          };
          setVerifiedShellRole({ uid, role: result.role });
          setState(result);
        }
      } catch (e) {
        if (valid()) {
          stateProvenance.current = null;
          settingsRefreshIntent.current = null;
          setState(null);
          setVerifiedShellRole(null);
          setError(sourceMessage(e));
        }
      } finally {
        if (
          valid() &&
          navigation?.uid === uid &&
          navigation.key === path + location.search
        )
          finishNavigation(navigation.sequence);
      }
    })();
  }, [uid, path, location.search, query, refresh, services, finishNavigation]);
  const uploadAdapter = (url: string, init: RequestInit) =>
    new Promise<Response>((resolve, reject) => {
      if (auth?.currentUser?.uid !== uid) {
        reject(Error("Tài khoản đã thay đổi."));
        return;
      }
      if (uploadRef.current) {
        reject(Error("Hoàn tất ảnh đang chọn trước nhé."));
        return;
      }
      const file = init.body;
      if (!(file instanceof File)) {
        reject(Error("Thiếu file ảnh."));
        return;
      }
      const issue = imageFileError(file);
      if (issue) {
        reject(Error(issue));
        return;
      }
      const parsed = new URL(url, "https://studio.invalid"),
        item = {
          file,
          ...(parsed.searchParams.get("postId")
            ? { postId: parsed.searchParams.get("postId")! }
            : {}),
          ...(parsed.searchParams.get("authorId")
            ? { authorId: parsed.searchParams.get("authorId")! }
            : {}),
          resolve,
          reject,
        };
      uploadRef.current = item;
      setUpload(item);
      setAlt("");
      setRights(false);
      setUploadError("");
    });
  async function confirmUpload() {
    if (!upload || !rights || uploadBusy) return;
    const item = upload;
    setUploadBusy(true);
    setUploadError("");
    try {
      const bytes = new Uint8Array(await item.file.arrayBuffer());
      let binary = "";
      for (let i = 0; i < bytes.length; i += 8192)
        binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
      if (auth?.currentUser?.uid !== uid) throw Error("Tài khoản đã thay đổi.");
      const result = await callService("studioMediaUpload", {
        mime: item.file.type,
        base64: btoa(binary),
        alt: alt.trim(),
        rightsConfirmed: true,
        ...(item.postId ? { postId: item.postId } : {}),
        ...(item.authorId ? { authorId: item.authorId } : {}),
      });
      if (auth?.currentUser?.uid !== uid || uploadRef.current !== item)
        throw Error("Tài khoản đã thay đổi.");
      item.resolve(
        new Response(JSON.stringify(result), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
      uploadRef.current = null;
      setUpload(null);
    } catch (e) {
      setUploadError(sourceMessage(e));
    } finally {
      setUploadBusy(false);
    }
  }
  async function exportContent() {
    const data = await services.advancedRead({ kind: "export" });
    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      }),
      url = URL.createObjectURL(blob);
    try {
      const a = document.createElement("a");
      a.href = url;
      a.download = "satsunicgo-studio.json";
      a.click();
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }
  if (auth?.currentUser?.uid !== uid)
    return <p role="alert">Đăng nhập tài khoản biên tập để mở Studio.</p>;
  const suffix = path.replace(/^\/crm\/studio\/?/, ""),
    queryValues = {
      q: query.get("q") ?? undefined,
      state: query.get("state") ?? undefined,
      category: query.get("category") ?? undefined,
    };
  const content = error ? (
    <div className="notice" role="alert">
      {error}
      <button className="button" onClick={() => setRefresh((n) => n + 1)}>
        Tải lại
      </button>
    </div>
  ) : !state ||
    stateProvenance.current?.uid !== uid ||
    stateProvenance.current.path !== path ||
    stateProvenance.current.search !== location.search ? (
    <p role="status">Đang mở Studio…</p>
  ) : suffix === "settings" ? (
    state.role === "admin" ? (
      <Settings
        authors={state.authors}
        taxonomy={state.taxonomy}
        members={state.members}
        viewerUid={uid}
        viewerEmail={auth?.currentUser?.email ?? undefined}
        viewerAvatar={avatar}
        router={router}
        request={services.request}
        progressFetch={uploadAdapter}
        onExport={exportContent}
      />
    ) : (
      <p role="alert">Cần quyền quản trị Studio.</p>
    )
  ) : suffix === "account" ? (
    <Account
      name={name}
      avatar={avatar}
      staff
      embedded
      router={router}
      signOut={signOut}
    />
  ) : suffix === "comments" ? (
    <Moderation
      items={state.comments ?? []}
      reports={state.reports ?? null}
      status={query.get("status") ?? "pending"}
      postTitles={state.postTitles ?? {}}
      request={services.request}
      navigate={router.push}
      next={state.moderationNext ?? null}
    />
  ) : state.post ? (
    suffix.endsWith("/preview") ? (
      <>
        <p className="preview-banner">
          Xem trước — chỉ bạn và người biên tập thấy ·{" "}
          <SourceLink
            navigate={router.push}
            href={`/crm/studio/${state.post.id}`}
          >
            Tiếp tục viết
          </SourceLink>
        </p>
        <BlogContent
          post={{
            ...state.post,
            author:
              state.authors.find((a) => a.id === state.post!.authorId)?.name ??
              "Chưa chọn tác giả",
            authorBio: state.authors.find((a) => a.id === state.post!.authorId)
              ?.bio,
            authorAvatarId: state.authors.find(
              (a) => a.id === state.post!.authorId,
            )?.avatarId,
            authorGoogleAvatar: state.authors.find(
              (a) => a.id === state.post!.authorId,
            )?.googleAvatar,
            publishedAt: state.post.publishedAt ?? state.post.updatedAt,
            readingMinutes: Math.max(
              1,
              Math.ceil(
                bodyText(state.post.body).split(/\s+/).filter(Boolean).length /
                  220,
              ),
            ),
          }}
        />
      </>
    ) : (
      <Editor
        key={`${uid}:${state.post.id}:${refresh}`}
        initial={state.post}
        viewerUid={uid}
        authors={state.authors.map((a) => ({
          id: a.id,
          name: a.name ?? "Tác giả",
        }))}
        publisher={state.role !== "author"}
        members={state.assignable}
        categories={state.taxonomy.map((c) => c.name ?? "")}
        canCreateCategory={state.role === "admin"}
        router={router}
        request={services.request}
        progressFetch={uploadAdapter}
        onCreateCategory={services.createCategory}
      />
    )
  ) : (
    <Dashboard
      posts={state.posts}
      next={state.next}
      summary={state.summary}
      query={queryValues}
      authors={Object.fromEntries(
        state.authors.map((a) => [a.id, a.name ?? "Tác giả"]),
      )}
      router={router}
      request={services.request}
    />
  );
  return (
    <StudioShell
      path={path}
      user={
        state
          ? { name, role: state.role, avatar }
          : pendingNavigation?.uid === uid && verifiedShellRole?.uid === uid
            ? { name, role: verifiedShellRole.role, avatar }
            : null
      }
      pendingTarget={
        pendingNavigation?.uid === uid && pendingNavigation.showHint
          ? pendingNavigation.target
          : null
      }
      navigate={(url) => go(url, false, true)}
    >
      {content}
      {upload && (
        <StudioDialog
          title="Thêm ảnh"
          onClose={() => {
            if (uploadBusy) return;
            upload.reject(Error("Đã hủy tải ảnh."));
            uploadRef.current = null;
            setUpload(null);
          }}
        >
          <p>{upload.file.name}</p>
          <label>
            Mô tả ảnh
            <input
              value={alt}
              maxLength={500}
              onChange={(e) => setAlt(e.target.value)}
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={rights}
              onChange={(e) => setRights(e.target.checked)}
            />
            Tôi có quyền sử dụng ảnh này.
          </label>
          {uploadError && <p role="alert">{uploadError}</p>}
          <button
            className="button primary"
            disabled={!rights || uploadBusy}
            onClick={() => void confirmUpload()}
          >
            {uploadBusy ? "Đang tải ảnh…" : "Thêm ảnh"}
          </button>
        </StudioDialog>
      )}
    </StudioShell>
  );
}

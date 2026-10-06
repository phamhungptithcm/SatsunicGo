import {
  CrmHeading,
  CrmIcon,
  CrmState,
  CrmReference,
} from "../crm/CrmPresentation";
import { useState, useEffect, useRef, type FormEvent } from "react";
import { callService } from "../../shared/firebase";
import {
  createRequestSequence,
  scheduledInput,
  scheduledTimestamp,
} from "./editor-state";
type Campaign = {
  id: string;
  version: number;
  title: string;
  caption: string;
  path: string;
  source: string;
  medium: string;
  campaign: string;
  status: string;
  scheduledAt?: number;
};
export function campaignClipboardText(
  r: {
    path: string;
    source: string;
    medium: string;
    campaign: string;
    caption: string;
  },
  origin: string,
) {
  const url = new URL(r.path, origin);
  url.searchParams.set("utm_source", r.source);
  url.searchParams.set("utm_medium", r.medium);
  url.searchParams.set("utm_campaign", r.campaign);
  return `${r.caption}\n${url}`;
}
export function Campaigns() {
  const [rows, setRows] = useState<Campaign[]>([]),
    [current, setCurrent] = useState<Campaign | null>(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [loading, setLoading] = useState(false),
    [next, setNext] = useState<string | null>(null),
    [editing, setEditing] = useState(false),
    [uncertain, setUncertain] = useState(false);
  const requests = useRef(createRequestSequence()),
    pending = useRef<Record<string, unknown> | null>(null),
    sending = useRef(false),
    saves = useRef(createRequestSequence());
  const editor = useRef<HTMLDetailsElement>(null);
  function openEditor() {
    setEditing(true);
    requestAnimationFrame(() => {
      const summary = editor.current?.querySelector("summary");
      if (!summary) return;
      summary.focus({ preventScroll: true });
      summary.scrollIntoView({
        block: "center",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    });
  }
  async function load(after?: string) {
    const revision = requests.current.next();
    setLoading(true);
    setMessage("");
    try {
      const r = await callService<{ rows: Campaign[]; next: string | null }>(
        "listWork",
        { kind: "campaigns", ...(after ? { after } : {}) },
      );
      if (!requests.current.current(revision)) return;
      setRows((previous) =>
        after
          ? [
              ...previous,
              ...r.rows.filter(
                (row) => !previous.some((old) => old.id === row.id),
              ),
            ]
          : r.rows,
      );
      setNext(r.next);
    } catch {
      if (requests.current.current(revision)) {
        setRows([]);
        setNext(null);
        setMessage("Chưa tải được chiến dịch.");
      }
    } finally {
      if (requests.current.current(revision)) setLoading(false);
    }
  }
  useEffect(() => {
    void load();
    return () => {
      requests.current.invalidate();
      saves.current.invalidate();
    };
  }, []);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || uncertain || sending.current) return;
    setBusy(true);
    const form = e.currentTarget,
      f = new FormData(form);
    const command = {
      action: "saveCampaign",

      ...(current ? { id: current.id, expectedVersion: current.version } : {}),
      payload: {
        title: String(f.get("title")),
        caption: String(f.get("caption")),
        path: String(f.get("path")),
        source: String(f.get("source")),
        medium: String(f.get("medium")),
        campaign: String(f.get("campaign")),
        status: String(f.get("status")),
        ...(f.get("schedule")
          ? {
              scheduledAt: scheduledTimestamp(
                String(f.get("schedule")),
                current?.scheduledAt,
              ),
            }
          : {}),
      },
    };
    pending.current = { ...command, operationId: crypto.randomUUID() };
    await executeSave(form);
  }
  async function executeSave(form?: HTMLFormElement) {
    if (!pending.current || sending.current) return;
    const command = pending.current,
      saveRevision = saves.current.next();
    sending.current = true;
    setBusy(true);
    setMessage("");
    try {
      await callService("workspaceCommand", command);
      if (!saves.current.current(saveRevision)) return;
      pending.current = null;
      setUncertain(false);
      setCurrent(null);
      setEditing(false);
      form?.reset();
      await load();
      if (!saves.current.current(saveRevision)) return;
      setMessage(
        (previous) =>
          previous || "Đã lưu chiến dịch. Chưa đăng lên mạng xã hội.",
      );
    } catch (cause) {
      if (!saves.current.current(saveRevision)) return;
      const code = String((cause as { code?: string })?.code ?? "").replace(
        /^functions\//,
        "",
      );
      const rejected = [
        "invalid-argument",
        "permission-denied",
        "unauthenticated",
        "failed-precondition",
        "not-found",
        "already-exists",
        "aborted",
      ].includes(code);
      if (rejected) pending.current = null;
      setUncertain(!rejected);
      setMessage(
        rejected
          ? "Chưa lưu được. Kiểm tra đường dẫn, quyền và phiên bản."
          : "Chưa xác nhận được kết quả lưu. Thử lại thao tác đang chờ trước khi sửa nội dung.",
      );
    } finally {
      sending.current = false;
      if (saves.current.current(saveRevision)) setBusy(false);
    }
  }
  async function copy(r: Campaign) {
    try {
      await navigator.clipboard.writeText(
        campaignClipboardText(r, window.location.origin),
      );
      setMessage(
        "Đã sao chép caption và link UTM. Bạn tự kiểm tra rồi đăng trên kênh đã chọn.",
      );
    } catch {
      setMessage(
        "Chưa sao chép được. Cho phép clipboard hoặc sao chép thủ công.",
      );
    }
  }
  return (
    <section>
      <CrmHeading
        title="Chiến dịch và lịch nội dung"
        actions={
          <button
            disabled={busy || loading || uncertain}
            onClick={() => void load()}
          >
            <CrmIcon name="refresh" />
            Tải lại danh sách
          </button>
        }
      />
      <p>
        Lưu caption để người biên tập duyệt. Lịch là kế hoạch nội dung; đăng tự
        động lên mạng xã hội đang tắt.
      </p>
      <button
        disabled={busy || uncertain}
        onClick={() => {
          setCurrent(null);
          openEditor();
        }}
      >
        <CrmIcon name="document" />
        Tạo bản nháp mới
      </button>
      {loading && <CrmState kind="loading" title="Đang tải chiến dịch…" />}
      {!loading && !rows.length && !message && (
        <CrmState kind="empty" title="Chưa có chiến dịch." />
      )}
      {next && (
        <button
          disabled={busy || loading || uncertain}
          onClick={() => void load(next)}
        >
          Xem thêm chiến dịch
        </button>
      )}
      <div className="crmList">
        {rows.map((r) => (
          <article key={r.id} className="crmItem">
            <div className="crmItemMain">
              <h3 className="crmItemTitle">{r.title}</h3>
              <span className="crmBadge">
                {r.status === "approved"
                  ? "Đã duyệt caption"
                  : r.status === "archived"
                    ? "Đã lưu trữ"
                    : r.status === "draft"
                      ? "Bản nháp"
                      : "Trạng thái chưa xác định"}
              </span>
              <p>{r.caption}</p>
              {r.scheduledAt && (
                <p>
                  Lịch dự kiến:{" "}
                  {new Date(r.scheduledAt).toLocaleString("vi-VN")}
                </p>
              )}
              <details className="crmItemDetails">
                <summary>Đường dẫn và thông tin theo dõi</summary>
                <p>{r.path}</p>
                <p>
                  UTM source: {r.source} · medium: {r.medium} · campaign:{" "}
                  {r.campaign}
                </p>
                <CrmReference label="Mã chiến dịch" value={r.id} />
              </details>
            </div>
            <div className="crmActions">
              <button
                disabled={busy || uncertain}
                onClick={() => {
                  setCurrent(r);
                  openEditor();
                }}
              >
                <CrmIcon name="document" />
                Chỉnh sửa
              </button>
              <button onClick={() => void copy(r)}>
                <CrmIcon name="arrow" />
                Sao chép caption và link
              </button>
            </div>
          </article>
        ))}
      </div>
      <details
        className="panel crmItemDetails"
        ref={editor}
        open={editing}
        onToggle={(e) => setEditing(e.currentTarget.open)}
      >
        <summary>{current ? "Chỉnh sửa chiến dịch" : "Tạo chiến dịch"}</summary>
        <form
          key={current?.id ?? "new"}
          className="form"
          onSubmit={(e) => void save(e)}
        >
          <h2 className="crmSectionHeading">
            {current ? "Chỉnh sửa chiến dịch" : "Chiến dịch mới"}
          </h2>
          {current && (
            <details className="crmItemDetails">
              <summary>Thông tin bản đã lưu</summary>
              <CrmReference label="Mã chiến dịch" value={current.id} />
            </details>
          )}
          <fieldset className="form" disabled={busy || uncertain}>
            <label>
              Tên chiến dịch
              <input
                name="title"
                required
                minLength={2}
                maxLength={160}
                defaultValue={current?.title}
              />
            </label>
            <label>
              Caption
              <textarea
                name="caption"
                required
                minLength={3}
                maxLength={4000}
                defaultValue={current?.caption}
              />
            </label>
            <label>
              Đường dẫn bài viết hoặc sản phẩm
              <input
                name="path"
                required
                placeholder="/posts/ten-bai-viet"
                defaultValue={current?.path}
              />
            </label>
            <h3 className="crmSectionHeading">Theo dõi lượt truy cập</h3>
            {["source", "medium", "campaign"].map((k) => (
              <label key={k}>
                UTM {k}
                <input
                  name={k}
                  required
                  pattern="[a-zA-Z0-9_-]{1,80}"
                  defaultValue={
                    current?.[k as "source" | "medium" | "campaign"]
                  }
                />
              </label>
            ))}
            <label>
              Lịch dự kiến theo giờ địa phương
              <input
                name="schedule"
                type="datetime-local"
                defaultValue={scheduledInput(current?.scheduledAt)}
              />
            </label>
            <label>
              Trạng thái biên tập
              <select name="status" defaultValue={current?.status ?? "draft"}>
                <option value="draft">Bản nháp</option>
                <option value="approved">Đã duyệt caption</option>
                <option value="archived">Lưu trữ</option>
              </select>
            </label>
            <button className="primary" disabled={busy || uncertain}>
              <CrmIcon name="check" />
              {busy ? "Đang lưu…" : "Lưu chiến dịch"}
            </button>
          </fieldset>
        </form>
      </details>
      {uncertain && (
        <button
          className="primary"
          disabled={busy}
          onClick={() => void executeSave()}
        >
          Thử lại thao tác đang chờ
        </button>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}

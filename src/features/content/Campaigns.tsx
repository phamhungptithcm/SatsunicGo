import { notify } from "../../shared/feedback";
import { StepForm, StepStage } from "../../shared/StepForm";
import { PageTabs } from "../../shared/PageTabs";
import { WorkbenchComposer095 } from "../crm/FinanceContent095";
import { WebsiteBanners } from "./WebsiteBanners";
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
  const [section, setSection] = useState<"campaigns" | "banners">("campaigns");
  const dirty = useRef(false);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty.current) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);
  function editCampaign(next: Campaign | null) {
    if (
      next?.id !== current?.id &&
      dirty.current &&
      !window.confirm("Bỏ thay đổi chưa lưu để mở chiến dịch khác?")
    )
      return;
    if (next?.id !== current?.id) dirty.current = false;
    setCurrent(next);
    openEditor();
  }
  function openEditor() {
    setEditing(true);
    setSection("campaigns");
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
  const clipboardEpoch = useRef(0);
  useEffect(() => {
    void load();
    return () => {
      requests.current.invalidate();
      saves.current.invalidate();
      clipboardEpoch.current++;
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
      dirty.current = false;
      setCurrent(null);
      setEditing(false);
      form?.reset();
      notify("Đã lưu chiến dịch. Chưa đăng lên mạng xã hội.", "success");
      await load();
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
    const epoch = clipboardEpoch.current;
    try {
      await navigator.clipboard.writeText(
        campaignClipboardText(r, window.location.origin),
      );
      if (epoch !== clipboardEpoch.current) return;
      notify(
        "Đã sao chép caption và link UTM. Bạn tự kiểm tra rồi đăng trên kênh đã chọn.",
        "success",
      );
    } catch {
      if (epoch !== clipboardEpoch.current) return;
      notify(
        "Chưa sao chép được. Cho phép clipboard hoặc sao chép thủ công.",
        "error",
      );
    }
  }
  return (
    <section className="fc095 fc095Campaigns">
      <CrmHeading
        title="Chiến dịch"
        description="Soạn nội dung cho các kênh và quản lý banner website."
        reload={
          <button
            disabled={busy || loading || uncertain}
            onClick={() => void load()}
          >
            <CrmIcon name="refresh" /> Tải lại danh sách
          </button>
        }
        actions={
          <>
            {section === "campaigns" && (
              <button
                className="primary"
                disabled={busy || uncertain}
                onClick={() => editCampaign(null)}
              >
                <CrmIcon name="document" /> Tạo bản nháp
              </button>
            )}
          </>
        }
      />
      <PageTabs
        id="campaigns"
        label="Nhóm nội dung chiến dịch"
        value={section}
        onChange={setSection}
        items={[
          { value: "campaigns", label: "Nội dung các kênh" },
          { value: "banners", label: "Banner website" },
        ]}
      />
      <section
        id="campaigns-panel-campaigns"
        role="tabpanel"
        aria-labelledby="campaigns-tab-campaigns"
        tabIndex={0}
        hidden={section !== "campaigns"}
        aria-label="Nội dung các kênh"
      >
        <p className="fc095Notice">
          Lịch là kế hoạch nội dung. Duyệt caption không đăng lên mạng xã hội;
          bạn tự đăng sau khi kiểm tra.
        </p>
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
                    editCampaign(r);
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
        <WorkbenchComposer095
          open={editing}
          title={current ? "Chỉnh sửa chiến dịch" : "Bản nháp chiến dịch mới"}
          locked={busy || uncertain}
          onClose={() => setEditing(false)}
        >
          <StepForm
            steps={["Nội dung", "Theo dõi", "Lịch & trạng thái", "Kiểm tra"]}
            disabled={busy || uncertain}
            key={current?.id ?? "new"}
            className="form"
            onSubmit={(e) => void save(e)}
            onInput={() => {
              dirty.current = true;
            }}
            onChange={() => {
              dirty.current = true;
            }}
          >
            {current && (
              <details className="crmItemDetails">
                <summary>Thông tin bản đã lưu</summary>
                <CrmReference label="Mã chiến dịch" value={current.id} />
              </details>
            )}
            <fieldset className="form" disabled={busy || uncertain}>
              <StepStage index={0}>
                <label>
                  <span className="formLabelText">
                    Tên chiến dịch{" "}
                    <span className="requiredMark" aria-hidden="true">
                      *
                    </span>
                  </span>
                  <input
                    name="title"
                    required
                    minLength={2}
                    maxLength={160}
                    defaultValue={current?.title}
                  />
                </label>
                <label>
                  <span className="formLabelText">
                    Caption{" "}
                    <span className="requiredMark" aria-hidden="true">
                      *
                    </span>
                  </span>
                  <textarea
                    name="caption"
                    required
                    minLength={3}
                    maxLength={4000}
                    defaultValue={current?.caption}
                  />
                </label>
                <label>
                  <span className="formLabelText">
                    Đường dẫn bài viết hoặc sản phẩm{" "}
                    <span className="requiredMark" aria-hidden="true">
                      *
                    </span>
                  </span>
                  <input
                    name="path"
                    required
                    placeholder="/posts/ten-bai-viet"
                    defaultValue={current?.path}
                  />
                </label>
              </StepStage>
              <StepStage index={1}>
                <p className="muted">
                  Các mã UTM giúp phân biệt nguồn và chiến dịch trong link được
                  sao chép.
                </p>
                <div className="fc095FieldGrid">
                  {["source", "medium", "campaign"].map((k) => (
                    <label key={k}>
                      <span className="formLabelText">
                        UTM {k}{" "}
                        <span className="requiredMark" aria-hidden="true">
                          *
                        </span>
                      </span>
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
                </div>
              </StepStage>
              <StepStage index={2}>
                <h3 className="crmSectionHeading">
                  Lịch và trạng thái biên tập
                </h3>
                <div className="fc095FieldGrid">
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
                    <select
                      name="status"
                      defaultValue={current?.status ?? "draft"}
                    >
                      <option value="draft">Bản nháp</option>
                      <option value="approved">Đã duyệt caption</option>
                      <option value="archived">Lưu trữ</option>
                    </select>
                  </label>
                </div>
              </StepStage>
              <StepStage index={3}>
                <button className="primary" disabled={busy || uncertain}>
                  <CrmIcon name="check" />
                  {busy ? "Đang lưu…" : "Lưu chiến dịch"}
                </button>
              </StepStage>
            </fieldset>
          </StepForm>
        </WorkbenchComposer095>
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
      <section
        id="campaigns-panel-banners"
        role="tabpanel"
        aria-labelledby="campaigns-tab-banners"
        tabIndex={0}
        hidden={section !== "banners"}
        aria-label="Quản lý banner website"
      >
        <WebsiteBanners />
      </section>
    </section>
  );
}

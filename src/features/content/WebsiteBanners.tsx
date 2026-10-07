import { StepForm, StepStage } from "../../shared/StepForm";
import { LoadingState } from "../../shared/Loading";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, callService } from "../../shared/firebase";
import { MediaUpload } from "./MediaUpload";
import "./website-banners.css";
import "./campaign-banner.css";
import {
  bannerDraftSchema,
  parseVietnamTime,
  vietnamTimeInput,
  type BannerDraft,
  type PublishedBanner,
} from "../../../packages/domain/campaign-banners";

type Row = {
  id: string;
  version: number;
  draft: BannerDraft;
  published: PublishedBanner | null;
};
type Listing = {
  rows: Row[];
  next: string | null;
  modes: {
    home: "auto" | "static" | "slider";
    products: "auto" | "static" | "slider";
  };
  manifestVersion: number;
  owner: boolean;
  serverNow: number;
};
const initial = (): BannerDraft => ({
  title: "",
  description: "",
  cta: "Xem ngay",
  path: "/products",
  desktopMediaId: "",
  placements: ["home"],
  priority: 0,
  startsAt: Date.now(),
  endsAt: Date.now() + 7 * 86400000,
});
export function WebsiteBanners() {
  const [listing, setListing] = useState<Listing | null>(null),
    [draft, setDraft] = useState<BannerDraft>(initial),
    [row, setRow] = useState<Row | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [uncertain, setUncertain] = useState(false),
    [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState<{ image: string; alt: string } | null>(
      null,
    ),
    [previewMobile, setPreviewMobile] = useState(false),
    [previewBusy, setPreviewBusy] = useState(false);
  const previewSequence = useRef(0),
    draftSession = useRef(0);
  const editSession = draftSession.current;
  const received = useRef(0);
  const [, setClock] = useState(0);
  useEffect(() => {
    const clock = setInterval(() => setClock((v) => v + 1), 1000);
    return () => clearInterval(clock);
  }, []);
  const serverNow = listing
    ? listing.serverNow + Math.max(0, Date.now() - received.current)
    : Date.now();
  const pending = useRef<Record<string, unknown> | null>(null),
    sequence = useRef(0),
    sessionEpoch = useRef(0),
    commandEpoch = useRef(0),
    sending = useRef(false);
  async function load(after?: string) {
    const revision = ++sequence.current,
      uid = auth?.currentUser?.uid;
    try {
      const r = await callService<Listing>(
        "websiteBannerAdmin",
        after ? { after } : {},
      );
      if (revision !== sequence.current || auth?.currentUser?.uid !== uid)
        return;
      received.current = Date.now();
      setListing((previous) => ({
        ...r,
        rows: after && previous ? [...previous.rows, ...r.rows] : r.rows,
      }));
    } catch {
      if (revision === sequence.current) {
        setListing(null);
        setMessage("Chưa tải được banner. Thử tải lại.");
      }
    }
  }
  useEffect(() => {
    const reset = () => {
      sequence.current++;
      sessionEpoch.current++;
      commandEpoch.current++;
      pending.current = null;
      sending.current = false;
      setListing(null);
      setRow(null);
      draftSession.current++;
      setDraft(initial());
      setPreview(null);
      previewSequence.current++;
      setPreviewBusy(false);
      setEditing(false);
      setUncertain(false);
      setBusy(false);
      setMessage("");
    };
    const unsubscribe = auth
      ? onAuthStateChanged(auth, () => {
          reset();
          void load();
        })
      : undefined;
    if (!auth) void load();
    return () => {
      sequence.current++;
      sessionEpoch.current++;
      commandEpoch.current++;
      previewSequence.current++;
      draftSession.current++;
      unsubscribe?.();
    };
  }, []);
  async function execute(command: Record<string, unknown>) {
    if (sending.current) return;
    sending.current = true;
    pending.current = command;
    setBusy(true);
    setMessage("");
    const uid = auth?.currentUser?.uid,
      revision = sessionEpoch.current,
      commandRevision = ++commandEpoch.current;
    try {
      await callService("websiteBannerCommand", command);
      if (
        revision !== sessionEpoch.current ||
        commandRevision !== commandEpoch.current ||
        auth?.currentUser?.uid !== uid
      )
        return;
      pending.current = null;
      setUncertain(false);
      draftSession.current++;
      setEditing(false);
      setRow(null);
      setMessage("Đã lưu thay đổi banner.");
      await load();
    } catch (error) {
      if (
        revision !== sessionEpoch.current ||
        commandRevision !== commandEpoch.current ||
        auth?.currentUser?.uid !== uid
      )
        return;
      const code = String((error as { code?: string }).code ?? "");
      const definite = [
        "invalid-argument",
        "permission-denied",
        "unauthenticated",
        "aborted",
        "not-found",
        "already-exists",
        "failed-precondition",
        "resource-exhausted",
      ].some((c) => code.endsWith(c));
      if (definite) {
        pending.current = null;
        setUncertain(false);
        setMessage(
          code.endsWith("aborted")
            ? "Có thay đổi mới. Tải lại banner trước khi chỉnh sửa."
            : "Chưa lưu được. Kiểm tra quyền, ảnh và giờ kết thúc.",
        );
      } else {
        setUncertain(true);
        setMessage(
          "Chưa xác nhận được kết quả. Thử lại đúng thao tác đang chờ trước khi sửa tiếp.",
        );
      }
    } finally {
      if (
        revision === sessionEpoch.current &&
        commandRevision === commandEpoch.current
      ) {
        sending.current = false;
        setBusy(false);
      }
    }
  }
  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = bannerDraftSchema.safeParse(draft);
    if (!parsed.success) {
      setMessage(
        "Điền tên, ảnh, nơi hiển thị và giờ kết thúc sau giờ bắt đầu.",
      );
      return;
    }
    void execute({
      action: "save",
      id: row?.id ?? crypto.randomUUID(),
      expectedVersion: row?.version ?? 0,
      draft: parsed.data,
      operationId: crypto.randomUUID(),
    });
  }
  async function showPreview(mobile: boolean) {
    const id = mobile
      ? (draft.mobileMediaId ?? draft.desktopMediaId)
      : draft.desktopMediaId;
    if (!id) {
      setMessage("Chọn ảnh trước khi xem trước.");
      return;
    }
    const uid = auth?.currentUser?.uid,
      rev = ++previewSequence.current;
    setPreviewBusy(true);
    setPreview(null);
    setPreviewMobile(mobile);
    try {
      const r = await callService<{ image: string; alt: string }>(
        "websiteBannerPreview",
        { mediaId: id },
      );
      if (rev === previewSequence.current && auth?.currentUser?.uid === uid)
        setPreview(r);
    } catch {
      if (rev === previewSequence.current)
        setMessage("Chưa xem được ảnh. Kiểm tra quyền và thử lại.");
    } finally {
      if (rev === previewSequence.current) setPreviewBusy(false);
    }
  }
  function update<K extends keyof BannerDraft>(key: K, value: BannerDraft[K]) {
    setDraft((v) => ({ ...v, [key]: value }));
    if (key === "desktopMediaId" || key === "mobileMediaId") {
      setPreview(null);
      previewSequence.current++;
      setPreviewBusy(false);
    }
  }
  const disabled = busy || uncertain;
  return (
    <section className="websiteBanners" aria-label="Banner website">
      <div className="fc095SectionHead">
        <div>
          <h2>Banner website</h2>
          <p className="muted">
            Quản lý vị trí, bản nháp và thời gian hiển thị.
          </p>
        </div>
        <button type="button" disabled={disabled} onClick={() => void load()}>
          Tải lại banner
        </button>
      </div>
      <p className="fc095Notice">
        Hiển thị chương trình trên website. Không có banner đang chạy, trang sẽ
        giữ bố cục bình thường.
      </p>
      {message && <p role="status">{message}</p>}
      {uncertain && (
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (pending.current) void execute(pending.current);
          }}
        >
          Thử lại thao tác đang chờ
        </button>
      )}

      {listing && (
        <>
          {listing.owner && (
            <fieldset className="fc095Placement" disabled={disabled}>
              <legend>Cách hiển thị</legend>
              <p className="muted">
                Thay đổi cách hiển thị được lưu ngay. Xuất bản banner là thao
                tác riêng.
              </p>
              <div className="fc095FieldGrid">
                {(["home", "products"] as const).map((placement) => (
                  <label key={placement}>
                    {placement === "home" ? "Trang chủ" : "Trang sản phẩm"}
                    <select
                      value={listing.modes[placement]}
                      onChange={(e) =>
                        void execute({
                          action: "mode",
                          placement,
                          mode: e.target.value,
                          expectedVersion: listing.manifestVersion,
                          operationId: crypto.randomUUID(),
                        })
                      }
                    >
                      <option value="auto">Tự động</option>
                      <option value="static">Một banner</option>
                      <option value="slider">Slider thủ công</option>
                    </select>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <button
            type="button"
            className="websiteBannerPrimary"
            disabled={disabled}
            onClick={() => {
              setRow(null);
              draftSession.current++;
              setDraft(initial());
              setPreview(null);
              previewSequence.current++;
              setPreviewBusy(false);
              setEditing(true);
              setMessage("");
            }}
          >
            Thêm banner
          </button>
          {listing.rows.length === 0 && (
            <p>Chưa có banner. Thêm bản nháp khi có chương trình.</p>
          )}
          <ul>
            {listing.rows.map((item) => (
              <li key={item.id}>
                <strong>{item.draft.title}</strong>
                <p>
                  {item.published
                    ? item.published.draft.startsAt > serverNow
                      ? "Đã lên lịch"
                      : item.published.draft.endsAt <= serverNow
                        ? "Đã kết thúc"
                        : "Đang hiển thị"
                    : "Bản nháp · đang ẩn"}
                </p>
                {item.published && item.published.revision < item.version && (
                  <p>Có thay đổi bản nháp chưa xuất bản.</p>
                )}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setRow(item);
                    draftSession.current++;
                    setDraft(item.draft);
                    setPreview(null);
                    previewSequence.current++;
                    setPreviewBusy(false);
                    setEditing(true);
                  }}
                >
                  Sửa bản nháp
                </button>
                {listing.owner && (
                  <>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() =>
                        void execute({
                          action: "publish",
                          id: item.id,
                          expectedVersion: item.version,
                          operationId: crypto.randomUUID(),
                        })
                      }
                    >
                      Bật theo lịch
                    </button>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() =>
                        void execute({
                          action: "publish",
                          id: item.id,
                          expectedVersion: item.version,
                          startNow: true,
                          operationId: crypto.randomUUID(),
                        })
                      }
                    >
                      Bắt đầu ngay
                    </button>
                    {item.published && (
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() =>
                          void execute({
                            action: "hide",
                            id: item.id,
                            expectedVersion: item.version,
                            operationId: crypto.randomUUID(),
                          })
                        }
                      >
                        Ẩn banner
                      </button>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
          {listing.next && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => void load(listing.next!)}
            >
              Xem thêm banner
            </button>
          )}
        </>
      )}
      {editing && (
        <StepForm
          steps={["Nội dung", "Hiển thị & lịch", "Ảnh", "Kiểm tra"]}
          disabled={disabled}
          key={editSession}
          onSubmit={save}
        >
          <fieldset disabled={disabled}>
            <legend>{row ? "Sửa bản nháp" : "Banner mới"}</legend>
            <StepStage index={0}>
              <label>
                <span className="formLabelText">
                  Tên chương trình{" "}
                  <span className="requiredMark" aria-hidden="true">
                    *
                  </span>
                </span>
                <input
                  value={draft.title}
                  maxLength={80}
                  required
                  onChange={(e) => update("title", e.target.value)}
                />
              </label>
              <label>
                Mô tả ngắn
                <textarea
                  value={draft.description}
                  maxLength={160}
                  onChange={(e) => update("description", e.target.value)}
                />
              </label>
              <label>
                <span className="formLabelText">
                  Nút hành động{" "}
                  <span className="requiredMark" aria-hidden="true">
                    *
                  </span>
                </span>
                <input
                  value={draft.cta}
                  maxLength={40}
                  required
                  onChange={(e) => update("cta", e.target.value)}
                />
              </label>
              <label>
                <span className="formLabelText">
                  Đường dẫn trên website{" "}
                  <span className="requiredMark" aria-hidden="true">
                    *
                  </span>
                </span>
                <input
                  value={draft.path}
                  required
                  onChange={(e) => update("path", e.target.value)}
                />
              </label>
              <p>
                Ví dụ: /products, /products/ten-san-pham, /request. Chỉ dùng
                đường dẫn nội bộ.
              </p>
            </StepStage>
            <StepStage index={1}>
              <fieldset>
                <legend>Nơi hiển thị</legend>
                {(["home", "products"] as const).map((p) => (
                  <label key={p}>
                    <input
                      type="checkbox"
                      checked={draft.placements.includes(p)}
                      onChange={(e) =>
                        update(
                          "placements",
                          e.target.checked
                            ? [...draft.placements, p]
                            : draft.placements.filter((v) => v !== p),
                        )
                      }
                    />
                    {p === "home" ? "Trang chủ" : "Trang sản phẩm"}
                  </label>
                ))}
              </fieldset>
              <label>
                Ưu tiên (0–100)
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={draft.priority}
                  onChange={(e) => update("priority", Number(e.target.value))}
                />
              </label>
              {(["startsAt", "endsAt"] as const).map((k) => (
                <label key={k}>
                  <span className="formLabelText">
                    {k === "startsAt" ? "Bắt đầu" : "Kết thúc"} · giờ Việt Nam
                    (UTC+7){" "}
                    <span className="requiredMark" aria-hidden="true">
                      *
                    </span>
                  </span>
                  <input
                    type="datetime-local"
                    required
                    value={vietnamTimeInput(draft[k])}
                    onChange={(e) => {
                      try {
                        update(k, parseVietnamTime(e.target.value));
                      } catch {
                        setMessage("Nhập ngày và giờ Việt Nam hợp lệ.");
                      }
                    }}
                  />
                </label>
              ))}
            </StepStage>
            <StepStage index={2}>
              <h3>Ảnh máy tính</h3>
              <p>
                Gợi ý 1440 × 960 px, chừa khoảng trống quanh sản phẩm. Đã chọn
                ảnh: {draft.desktopMediaId ? "Có" : "Chưa"}.
              </p>
              <MediaUpload
                onUploaded={(id) => {
                  if (editSession === draftSession.current)
                    update("desktopMediaId", id);
                }}
              />
              <h3>Ảnh điện thoại</h3>
              <p>Nếu bỏ trống, dùng ảnh máy tính.</p>
              <MediaUpload
                onUploaded={(id) => {
                  if (editSession === draftSession.current)
                    update("mobileMediaId", id);
                }}
              />
              {draft.mobileMediaId && (
                <button
                  type="button"
                  onClick={() => {
                    previewSequence.current++;
                    setPreview(null);
                    setPreviewBusy(false);
                    setDraft((v) => {
                      const next = { ...v };
                      delete next.mobileMediaId;
                      return next;
                    });
                  }}
                >
                  Bỏ ảnh điện thoại
                </button>
              )}
            </StepStage>
            <StepStage index={3}>
              <fieldset>
                <legend>Xem trước bố cục</legend>
                <button
                  type="button"
                  disabled={previewBusy}
                  onClick={() => void showPreview(false)}
                >
                  Máy tính
                </button>
                <button
                  type="button"
                  disabled={previewBusy}
                  onClick={() => void showPreview(true)}
                >
                  Điện thoại
                </button>
                {previewBusy && (
                  <LoadingState overlay={false}>
                    Đang tải ảnh xem trước…
                  </LoadingState>
                )}
                {preview && (
                  <div
                    className={`sgBannerPreview ${previewMobile ? "sgBannerPreview--mobile" : ""}`}
                  >
                    <div className="sgBannerPanel">
                      <div className="sgBannerCopy">
                        <span className="sgBannerEyebrow">Đang diễn ra</span>
                        <h2>{draft.title || "Tên chương trình"}</h2>
                        {draft.description && <p>{draft.description}</p>}
                        <span className="sgBannerCta">
                          {draft.cta || "Xem ngay"} ↗
                        </span>
                      </div>
                      <div className="sgBannerImage">
                        <img
                          src={preview.image}
                          alt={preview.alt}
                          width="720"
                          height="480"
                        />
                      </div>
                    </div>
                  </div>
                )}
                <p>Bản xem trước chưa xuất bản chương trình.</p>
              </fieldset>
              <p>
                Lưu bản nháp chưa làm banner hiển thị. OWNER bật theo lịch hoặc
                bắt đầu ngay sau khi kiểm tra nội dung.
              </p>
              <button className="websiteBannerPrimary" type="submit">
                Lưu bản nháp
              </button>
              <button
                type="button"
                onClick={() => {
                  draftSession.current++;
                  previewSequence.current++;
                  setPreviewBusy(false);
                  setEditing(false);
                }}
              >
                Đóng
              </button>
            </StepStage>
          </fieldset>
        </StepForm>
      )}
    </section>
  );
}

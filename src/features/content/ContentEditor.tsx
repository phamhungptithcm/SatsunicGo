import {
  CrmHeading,
  CrmIcon,
  CrmState,
  CrmReference,
} from "../crm/CrmPresentation";
import { notify } from "../../shared/feedback";
import { useEffect, useState, useRef, type FormEvent } from "react";
import { callService } from "../../shared/firebase";
import { MediaUpload } from "./MediaUpload";
import type { ContentRow } from "../../shared/public-content";
import {
  createRetryIdentity,
  createRequestSequence,
  scheduledInput,
  scheduledTimestamp,
} from "./editor-state";
export function ContentEditor() {
  const [kind, setKind] = useState<"products" | "posts">("products"),
    [rows, setRows] = useState<ContentRow[]>([]),
    [current, setCurrent] = useState<ContentRow | null>(null),
    [mediaId, setMediaId] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(false),
    [next, setNext] = useState<string | null>(null);
  const requests = useRef(createRequestSequence()),
    retry = useRef(createRetryIdentity()),
    saves = useRef(createRequestSequence());
  async function load(after?: string) {
    const revision = requests.current.next();
    setLoading(true);
    setError("");
    try {
      const r = await callService<{ rows: ContentRow[]; next: string | null }>(
        "listWork",
        { kind, ...(after ? { after } : {}) },
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
    } catch (e) {
      if (requests.current.current(revision)) setError((e as Error).message);
    } finally {
      if (requests.current.current(revision)) setLoading(false);
    }
  }
  useEffect(() => {
    setCurrent(null);
    setRows([]);
    setNext(null);
    setError("");
    retry.current.clear();
    void load();
    return () => {
      requests.current.invalidate();
      saves.current.invalidate();
    };
  }, [kind]);
  useEffect(() => {
    setMediaId(current?.mediaId ?? "");
  }, [current]);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const saveRevision = saves.current.next();
    const form = e.currentTarget,
      f = new FormData(form),
      status = String(f.get("status"));
    const content = {
      title: f.get("title"),
      slug: f.get("slug"),
      body: f.get("body"),
      ...Object.fromEntries(
        ["category", "referenceUrl", "variants", "seoTitle", "seoDescription"]
          .filter((key) => String(f.get(key) ?? "").trim())
          .map((key) => [key, String(f.get(key)).trim()]),
      ),
      ...(kind === "products"
        ? {
            market: String(f.get("market")),
            orderable: f.get("orderable") === "on",
            ...(f.get("listedPrice")
              ? { listedPrice: Number(f.get("listedPrice")) }
              : {}),
            ...(String(f.get("termsVersion") ?? "").trim()
              ? { termsVersion: String(f.get("termsVersion")).trim() }
              : {}),
            catalogOptions: String(f.get("catalogOptions") ?? "")
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean),
            featured: f.get("featured") === "on",
            featuredOrder: Number(f.get("featuredOrder") || 9999),
            origin: String(f.get("origin") ?? "").trim(),
            functions: String(f.get("functions") ?? "").trim(),
            usage: String(f.get("usage") ?? "").trim(),
            ...(f.get("price")
              ? { referencePrice: Number(f.get("price")) }
              : {}),
            ...(f.get("priceTime")
              ? {
                  priceCheckedAt: new Date(
                    String(f.get("priceTime")),
                  ).getTime(),
                }
              : {}),
          }
        : {}),
      ...(mediaId ? { mediaId } : {}),
      status,
      ...(status === "scheduled"
        ? {
            publishAt: scheduledTimestamp(
              String(f.get("publishAt")),
              current?.publishAt,
            ),
          }
        : {}),
    };
    setBusy(true);
    setError("");
    try {
      await callService("workspaceCommand", {
        action: "saveContent",
        operationId: retry.current.forPayload({
          kind,
          id: current?.id,
          version: current?.version,
          content,
        }),
        ...(current
          ? { id: current.id, expectedVersion: current.version }
          : {}),
        payload: { kind, content },
      });
      if (!saves.current.current(saveRevision)) return;
      retry.current.clear();
      notify("Đã lưu nội dung.", "success");
      setCurrent(null);
      form.reset();
      setMediaId("");
      await load();
    } catch (e) {
      if (saves.current.current(saveRevision)) setError((e as Error).message);
    } finally {
      if (saves.current.current(saveRevision)) setBusy(false);
    }
  }
  return (
    <section>
      <CrmHeading
        title="Nội dung website"
        description="Biên tập sản phẩm, bài viết và trạng thái xuất bản."
        actions={
          <>
            <select
              aria-label="Loại nội dung"
              value={kind}
              disabled={busy}
              onChange={(e) => setKind(e.target.value as typeof kind)}
            >
              <option value="products">Sản phẩm</option>
              <option value="posts">Bài viết</option>
            </select>
            <button disabled={loading || busy} onClick={() => void load()}>
              <CrmIcon name="refresh" />
              Tải lại danh sách
            </button>
            <button disabled={busy} onClick={() => setCurrent(null)}>
              <CrmIcon name="document" />
              Nội dung mới
            </button>
          </>
        }
      />
      <div className="workColumns contentEditorColumns">
        <div className="contentEditorSidebar">
          {loading && <CrmState kind="loading" title="Đang tải nội dung…" />}
          {!loading && !rows.length && !error && (
            <CrmState kind="empty" title="Chưa có nội dung." />
          )}
          <div
            className="contentEditorList"
            role="region"
            aria-label="Danh sách nội dung"
            tabIndex={0}
          >
            {rows.map((r) => (
              <button
                key={r.id}
                className="contentRow crmItem"
                disabled={busy}
                onClick={() => setCurrent(r)}
              >
                <strong className="crmItemTitle">{r.title}</strong>
                <span className="crmBadge">
                  {r.status === "published"
                    ? "Đã xuất bản"
                    : r.status === "scheduled"
                      ? "Đã lên lịch"
                      : r.status === "archived"
                        ? "Đã lưu trữ"
                        : "Bản nháp"}
                </span>
              </button>
            ))}
            {next && (
              <button
                disabled={loading || busy}
                onClick={() => void load(next)}
              >
                Xem thêm nội dung
              </button>
            )}
          </div>
        </div>
        <form
          key={current?.id ?? "new"}
          className="panel form"
          onInvalidCapture={(event) => {
            let ancestor = (event.target as HTMLElement).parentElement;
            while (ancestor && ancestor !== event.currentTarget) {
              if (ancestor instanceof HTMLDetailsElement) ancestor.open = true;
              ancestor = ancestor.parentElement;
            }
          }}
          onSubmit={(e) => void save(e)}
        >
          <h2 className="crmSectionHeading">
            {current ? "Chỉnh sửa nội dung" : "Nội dung mới"}
          </h2>
          {current && (
            <details className="crmItemDetails">
              <summary>Thông tin bản đã lưu</summary>
              <CrmReference label="Mã nội dung" value={current.id} />
            </details>
          )}
          <h3 className="crmSectionHeading">Nội dung chính</h3>
          <label>
            Tiêu đề
            <input
              name="title"
              defaultValue={current?.title}
              required
              minLength={2}
              maxLength={160}
            />
          </label>
          <label>
            Slug
            <input
              name="slug"
              defaultValue={current?.slug}
              pattern="[a-z0-9-]{2,100}"
              required
            />
          </label>
          <label>
            Nội dung
            <textarea
              name="body"
              defaultValue={current?.body}
              required
              minLength={10}
              maxLength={30000}
            />
          </label>
          <details className="crmItemDetails">
            <summary>Phân loại và thông tin tìm kiếm</summary>
            <label>
              Phân loại
              <input
                name="category"
                maxLength={80}
                defaultValue={current?.category}
              />
            </label>
            <label>
              Link tham khảo · không bắt buộc
              <input
                type="url"
                name="referenceUrl"
                maxLength={2048}
                defaultValue={current?.referenceUrl}
              />
            </label>
            <label>
              Biến thể tham khảo
              <input
                name="variants"
                maxLength={500}
                defaultValue={current?.variants}
              />
            </label>
            <label>
              Tiêu đề tìm kiếm · để trống dùng tiêu đề nội dung
              <input
                name="seoTitle"
                maxLength={160}
                defaultValue={current?.seoTitle}
              />
            </label>
            <label>
              Mô tả tìm kiếm · để trống dùng đầu nội dung
              <textarea
                name="seoDescription"
                maxLength={300}
                defaultValue={current?.seoDescription}
              />
            </label>
          </details>
          {kind === "products" && (
            <>
              <details className="crmItemDetails">
                <summary>Giới thiệu sản phẩm</summary>
                <label>
                  <input
                    name="featured"
                    type="checkbox"
                    defaultChecked={current?.featured !== false}
                  />{" "}
                  Hiển thị trong sản phẩm được chọn
                </label>
                <label>
                  Thứ tự giới thiệu
                  <input
                    name="featuredOrder"
                    type="number"
                    min={0}
                    max={9999}
                    step={1}
                    defaultValue={current?.featuredOrder ?? 9999}
                  />
                  <small>Số nhỏ hơn được ưu tiên giới thiệu.</small>
                </label>
                <label>
                  Nguồn gốc
                  <textarea
                    name="origin"
                    maxLength={4000}
                    defaultValue={current?.origin}
                  />
                </label>
                <label>
                  Chức năng và công dụng
                  <textarea
                    name="functions"
                    maxLength={4000}
                    defaultValue={current?.functions}
                  />
                </label>
                <label>
                  Cách dùng
                  <textarea
                    name="usage"
                    maxLength={4000}
                    defaultValue={current?.usage}
                  />
                </label>
              </details>
              <h3 className="crmSectionHeading">Đặt mua và giá trọn gói</h3>
              <label>
                Quốc gia nguồn
                <select name="market" defaultValue={current?.market ?? "US"}>
                  <option value="US">Mỹ</option>
                  <option value="JP">Nhật Bản</option>
                  <option value="KR">Hàn Quốc</option>
                </select>
              </label>
              <label>
                <input
                  type="checkbox"
                  name="orderable"
                  defaultChecked={current?.orderable === true}
                />{" "}
                Cho phép đặt mua và thanh toán toàn bộ
              </label>
              <label>
                Giá niêm yết trọn gói (₫ / sản phẩm)
                <input
                  type="number"
                  name="listedPrice"
                  min={1}
                  max={1000000000000}
                  step={1}
                  defaultValue={current?.listedPrice}
                />
                <small>
                  Bao gồm toàn bộ phí mua hộ và giao hàng. Không thu thêm đợt
                  hai.
                </small>
              </label>
              <label>
                Phiên bản điều khoản mua hàng
                <input
                  name="termsVersion"
                  maxLength={80}
                  defaultValue={current?.termsVersion}
                />
              </label>
              <label>
                Lựa chọn đặt mua · mỗi dòng một mẫu
                <textarea
                  name="catalogOptions"
                  defaultValue={current?.catalogOptions?.join("\n")}
                />
                <small>
                  Các mẫu dùng chung giá niêm yết. Mẫu khác giá cần sản phẩm
                  riêng.
                </small>
              </label>
              <details className="crmItemDetails">
                <summary>Giá tham khảo nội bộ</summary>
                <label>
                  Giá tham khảo nội bộ (₫) · không dùng để thu tiền
                  <input
                    type="number"
                    name="price"
                    min={0}
                    max={1000000000000}
                    step={1}
                    defaultValue={current?.referencePrice}
                  />
                </label>
                <label>
                  Thời điểm kiểm tra giá (giờ địa phương)
                  <input
                    name="priceTime"
                    type="datetime-local"
                    defaultValue={
                      current?.priceCheckedAt
                        ? new Date(
                            current.priceCheckedAt -
                              new Date(
                                current.priceCheckedAt,
                              ).getTimezoneOffset() *
                                60000,
                          )
                            .toISOString()
                            .slice(0, 16)
                        : ""
                    }
                  />
                </label>
              </details>
            </>
          )}
          {current && (
            <details>
              <summary>Xem trước nội dung bản đã lưu</summary>
              <h3>{current.title}</h3>
              <p style={{ whiteSpace: "pre-wrap" }}>{current.body}</p>
              <p>
                Bản nháp không hiển thị trên trang public. Các thay đổi chưa lưu
                không có trong bản xem trước này.
              </p>
            </details>
          )}
          <h3 className="crmSectionHeading">Ảnh và xuất bản</h3>
          <MediaUpload onUploaded={setMediaId} />
          {mediaId && (
            <p>
              <CrmReference label="Ảnh đã lưu" value={mediaId} />. Lưu nội dung
              để gắn ảnh.
            </p>
          )}
          <label>
            Trạng thái
            <select name="status" defaultValue={current?.status ?? "draft"}>
              <option value="draft">Bản nháp</option>
              <option value="published">Xuất bản trên website</option>
              <option value="scheduled">Lên lịch xuất bản</option>
              <option value="archived">Lưu trữ</option>
            </select>
          </label>
          <label>
            Giờ xuất bản theo lịch
            <input
              type="datetime-local"
              name="publishAt"
              defaultValue={scheduledInput(current?.publishAt)}
            />
          </label>
          <p className="notice">
            Xuất bản hiển thị công khai. Không đưa chứng từ, thông tin khách
            hoặc nội dung chưa được duyệt vào đây.
          </p>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="primary" disabled={busy}>
            <CrmIcon name="check" />
            {busy ? "Đang lưu…" : "Lưu nội dung"}
          </button>
        </form>
      </div>
    </section>
  );
}

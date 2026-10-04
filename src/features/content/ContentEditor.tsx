import { notify } from "../../shared/feedback";
import { useEffect, useState, type FormEvent } from "react";
import { callService } from "../../shared/firebase";
import { MediaUpload } from "./MediaUpload";
import type { ContentRow } from "../../shared/public-content";
export function ContentEditor() {
  const [kind, setKind] = useState<"products" | "posts">("products"),
    [rows, setRows] = useState<ContentRow[]>([]),
    [current, setCurrent] = useState<ContentRow | null>(null),
    [mediaId, setMediaId] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function load() {
    try {
      const r = await callService<{ rows: ContentRow[] }>("listWork", { kind });
      setRows(r.rows);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    setCurrent(null);
    void load();
  }, [kind]);
  useEffect(() => {
    setMediaId(current?.mediaId ?? "");
  }, [current]);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
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
        ? { publishAt: new Date(String(f.get("publishAt"))).getTime() }
        : {}),
    };
    setBusy(true);
    setError("");
    try {
      await callService("workspaceCommand", {
        action: "saveContent",
        operationId: crypto.randomUUID(),
        ...(current
          ? { id: current.id, expectedVersion: current.version }
          : {}),
        payload: { kind, content },
      });
      notify("Đã lưu nội dung.", "success");
      setCurrent(null);
      form.reset();
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <div className="pageHeading">
        <h2>Nội dung website</h2>
        <select
          aria-label="Loại nội dung"
          value={kind}
          onChange={(e) => setKind(e.target.value as typeof kind)}
        >
          <option value="products">Sản phẩm</option>
          <option value="posts">Bài viết</option>
        </select>
      </div>
      <div className="workColumns">
        <div>
          {rows.map((r) => (
            <button
              key={r.id}
              className="contentRow"
              onClick={() => setCurrent(r)}
            >
              <strong>{r.title}</strong>
              <span>
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
          <button onClick={() => setCurrent(null)}>Nội dung mới</button>
        </div>
        <form
          key={current?.id ?? "new"}
          className="panel form"
          onSubmit={(e) => void save(e)}
        >
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
          {kind === "products" && (
            <>
              <label>
                Quốc gia nguồn
                <select name="market" defaultValue={current?.market ?? "US"}>
                  <option value="US">Mỹ</option>
                  <option value="JP">Nhật Bản</option>
                  <option value="KR">Hàn Quốc</option>
                </select>
              </label>
              <label>
                Giá tham khảo (₫) · chưa phải báo giá mua hộ
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
          <MediaUpload onUploaded={setMediaId} />
          {mediaId && <p>Ảnh đã lưu: {mediaId}. Lưu nội dung để gắn ảnh.</p>}
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
            <input type="datetime-local" name="publishAt" />
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
            {busy ? "Đang lưu…" : "Lưu nội dung"}
          </button>
        </form>
      </div>
    </section>
  );
}

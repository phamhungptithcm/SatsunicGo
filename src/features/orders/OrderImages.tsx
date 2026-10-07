import { useEffect, useRef, useState, type FormEvent } from "react";
import { callService } from "../../shared/firebase";
import { createRequestSequence } from "../content/editor-state";
type Row = { id: string; description: string; kind: string };
const labels: Record<string, string> = {
  request: "Ảnh hàng cần mua",
  purchase: "Bằng chứng mua hàng",
  warehouse: "Ảnh kiểm hàng",
  receipt: "Chứng từ chuyển khoản",
};
export function OrderImages({
  orderId,
  roles = [],
  expanded = false,
}: {
  orderId: string;
  roles?: string[];
  expanded?: boolean;
}) {
  const [rows, setRows] = useState<Row[]>([]),
    [image, setImage] = useState<{ url: string; description: string } | null>(
      null,
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const pending = useRef<{ key: string; id: string } | null>(null),
    request = useRef(0),
    imageRequest = useRef(0),
    mutations = useRef(createRequestSequence()),
    processing = useRef(false);
  const manager = roles.some((r) =>
    ["OWNER", "OPERATIONS_MANAGER"].includes(r),
  );
  const choices = manager
    ? Object.keys(labels)
    : !roles.length
      ? ["request", "receipt"]
      : [
          ...(roles.includes("BUYER") ? ["purchase"] : []),
          ...(roles.includes("WAREHOUSE") ? ["warehouse"] : []),
          ...(roles.includes("FINANCE") ? ["receipt"] : []),
        ];
  async function load() {
    const current = ++request.current;
    setError("");
    try {
      const r = await callService<{ rows: Row[] }>("listOrderImages", {
        orderId,
      });
      if (current === request.current) setRows(r.rows);
    } catch {
      if (current === request.current)
        setError("Chưa tải được danh sách ảnh riêng.");
    }
  }
  useEffect(() => {
    mutations.current.invalidate();
    imageRequest.current++;
    processing.current = false;
    pending.current = null;
    setBusy(false);
    setRows([]);
    setImage(null);
    void load();
    return () => {
      request.current++;
      imageRequest.current++;
      mutations.current.invalidate();
    };
  }, [orderId]);
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (processing.current) return;
    const form = new FormData(event.currentTarget),
      file = form.get("image") as File;
    if (
      !file?.size ||
      file.size > 2 * 1024 * 1024 ||
      !["image/png", "image/jpeg", "image/webp"].includes(file.type)
    ) {
      setError("Chọn PNG, JPEG hoặc WebP tối đa 2 MB.");
      return;
    }
    processing.current = true;
    const revision = mutations.current.next();
    setBusy(true);
    setError("");
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1]);
        reader.onerror = () => reject(Error("Không đọc được ảnh."));
        reader.readAsDataURL(file);
      });
      if (!mutations.current.current(revision)) return;
      const payload = {
        orderId,
        mime: file.type,
        base64,
        kind: String(form.get("kind")),
        description: String(form.get("description")),
      };
      const key = JSON.stringify(payload);
      if (pending.current?.key !== key)
        pending.current = { key, id: crypto.randomUUID() };
      await callService("uploadOrderImage", {
        ...payload,
        operationId: pending.current.id,
      });
      if (!mutations.current.current(revision)) return;
      pending.current = null;
      await load();
    } catch {
      if (mutations.current.current(revision))
        setError(
          "Chưa tải ảnh lên được. Giữ nguyên file và thử lại; ảnh riêng không có link công khai.",
        );
    } finally {
      if (mutations.current.current(revision)) {
        processing.current = false;
        setBusy(false);
      }
    }
  }
  async function open(row: Row) {
    if (processing.current) return;
    processing.current = true;
    const current = ++imageRequest.current;
    setBusy(true);
    setError("");
    setImage(null);
    try {
      const r = await callService<{
        mime: string;
        base64: string;
        description: string;
      }>("readOrderImage", { id: row.id });
      if (
        current === imageRequest.current &&
        ["image/png", "image/jpeg", "image/webp"].includes(r.mime)
      )
        setImage({
          url: `data:${r.mime};base64,${r.base64}`,
          description: r.description,
        });
    } catch {
      if (current === imageRequest.current)
        setError("Chưa mở được ảnh. Kiểm tra quyền hiện hành và kết nối.");
    } finally {
      if (current === imageRequest.current) {
        processing.current = false;
        setBusy(false);
      }
    }
  }
  return (
    <details className="orderImages" open={expanded || undefined}>
      <summary>Ảnh & chứng từ riêng</summary>
      <p className="muted">
        Tối đa 20 ảnh mỗi đơn, mỗi ảnh 2 MB. Chứng từ ngân hàng chỉ dành cho chủ
        đơn, quản lý và tài chính; nhân viên kho không đọc được.
      </p>
      <button type="button" disabled={busy} onClick={() => void load()}>
        Tải lại danh sách ảnh
      </button>
      {rows.map((row) => (
        <div key={row.id}>
          <button type="button" disabled={busy} onClick={() => void open(row)}>
            {labels[row.kind] ?? "Ảnh riêng"} · {row.description}
          </button>
        </div>
      ))}
      {!rows.length && !error && <p>Chưa có ảnh trong phạm vi được xem.</p>}
      {image && (
        <figure>
          <img
            src={image.url}
            alt={image.description}
            style={{ maxWidth: "100%", maxHeight: 500, objectFit: "contain" }}
          />
          <figcaption>{image.description}</figcaption>
          <button type="button" onClick={() => setImage(null)}>
            Đóng ảnh
          </button>
        </figure>
      )}
      {choices.length > 0 && (
        <form
          key={orderId}
          className="form"
          onSubmit={(event) => void upload(event)}
        >
          <label>
            Loại ảnh
            <select name="kind">
              {choices.map((kind) => (
                <option value={kind} key={kind}>
                  {labels[kind]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="formLabelText">
              Ảnh{" "}
              <span className="requiredMark" aria-hidden="true">
                *
              </span>
            </span>
            <input
              name="image"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              required
            />
          </label>
          <label>
            <span className="formLabelText">
              Mô tả{" "}
              <span className="requiredMark" aria-hidden="true">
                *
              </span>
            </span>
            <textarea
              name="description"
              minLength={2}
              maxLength={300}
              required
            />
          </label>
          <button disabled={busy}>
            {busy ? "Đang xử lý…" : "Tải ảnh riêng lên"}
          </button>
        </form>
      )}
      {error && <p role="alert">{error}</p>}
    </details>
  );
}

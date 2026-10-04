import { useState, useEffect, type FormEvent } from "react";
import { callService } from "../../shared/firebase";
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
export function Campaigns() {
  const [rows, setRows] = useState<Campaign[]>([]),
    [current, setCurrent] = useState<Campaign | null>(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function load() {
    try {
      const r = await callService<{ rows: Campaign[] }>("listWork", {
        kind: "campaigns",
      });
      setRows(r.rows);
    } catch {
      setMessage("Chưa tải được chiến dịch.");
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      await callService("workspaceCommand", {
        action: "saveCampaign",
        operationId: crypto.randomUUID(),
        ...(current
          ? { id: current.id, expectedVersion: current.version }
          : {}),
        payload: {
          title: String(f.get("title")),
          caption: String(f.get("caption")),
          path: String(f.get("path")),
          source: String(f.get("source")),
          medium: String(f.get("medium")),
          campaign: String(f.get("campaign")),
          status: String(f.get("status")),
          ...(f.get("schedule")
            ? { scheduledAt: new Date(String(f.get("schedule"))).getTime() }
            : {}),
        },
      });
      setCurrent(null);
      await load();
      setMessage(
        "Đã lưu chiến dịch và lịch sử phiên bản. Chưa đăng lên mạng xã hội.",
      );
    } catch {
      setMessage("Chưa lưu được. Kiểm tra đường dẫn nội dung và phiên bản.");
    } finally {
      setBusy(false);
    }
  }
  async function copy(r: Campaign) {
    try {
      const url = new URL(r.path, window.location.origin);
      url.search = new URLSearchParams({
        utm_source: r.source,
        utm_medium: r.medium,
        utm_campaign: r.campaign,
      }).toString();
      await navigator.clipboard.writeText(`${r.caption}\n${url}`);
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
    <details className="panel">
      <summary>Chiến dịch và lịch nội dung</summary>
      <p>
        Lưu caption để người biên tập duyệt. Lịch là kế hoạch nội dung; đăng tự
        động lên mạng xã hội đang tắt.
      </p>
      <button onClick={() => setCurrent(null)}>Tạo bản nháp mới</button>
      <form
        key={current?.id ?? "new"}
        className="form"
        onSubmit={(e) => void save(e)}
      >
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
        {["source", "medium", "campaign"].map((k) => (
          <label key={k}>
            UTM {k}
            <input
              name={k}
              required
              pattern="[a-zA-Z0-9_-]{1,80}"
              defaultValue={current?.[k as "source" | "medium" | "campaign"]}
            />
          </label>
        ))}
        <label>
          Lịch dự kiến theo giờ địa phương
          <input name="schedule" type="datetime-local" />
        </label>
        <label>
          Trạng thái biên tập
          <select name="status" defaultValue={current?.status ?? "draft"}>
            <option value="draft">Bản nháp</option>
            <option value="approved">Đã duyệt caption</option>
            <option value="archived">Lưu trữ</option>
          </select>
        </label>
        <button disabled={busy}>Lưu chiến dịch</button>
      </form>
      {rows.map((r) => (
        <article key={r.id}>
          <h3>{r.title}</h3>
          <p>{r.caption}</p>
          {r.scheduledAt && (
            <p>
              Lịch dự kiến: {new Date(r.scheduledAt).toLocaleString("vi-VN")}
            </p>
          )}
          <button onClick={() => setCurrent(r)}>Chỉnh sửa</button>
          <button onClick={() => void copy(r)}>Sao chép caption và link</button>
        </article>
      ))}
      {message && <p role="status">{message}</p>}
    </details>
  );
}

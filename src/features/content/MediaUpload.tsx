import { LoadingState } from "../../shared/Loading";
import { useState } from "react";
import { callService } from "../../shared/firebase";
export function MediaUpload({
  onUploaded,
}: {
  onUploaded: (id: string) => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [alt, setAlt] = useState(""),
    [rightsConfirmed, setRightsConfirmed] = useState(false);
  async function upload(file: File) {
    setError("");
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      setError("Dùng ảnh PNG, JPEG hoặc WebP tĩnh tối đa 2 MB.");
      return;
    }
    if (!rightsConfirmed) {
      setError("Xác nhận quyền sử dụng ảnh trước khi tải lên.");
      return;
    }
    if (alt.trim().length < 2) {
      setError("Thêm mô tả ảnh trước khi tải lên.");
      return;
    }
    setBusy(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      for (let offset = 0; offset < bytes.length; offset += 8192)
        binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
      const r = await callService<{ id: string }>("uploadContentImage", {
        mime: file.type,
        base64: btoa(binary),
        alt,
        rightsConfirmed,
      });
      onUploaded(r.id);
    } catch {
      setError(
        "Chưa tải được ảnh. Kiểm tra định dạng, kích thước, cấu hình Storage và quyền biên tập.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <fieldset>
      <legend>Ảnh nội dung</legend>
      <label>
        <span className="formLabelText">
          Mô tả ảnh{" "}
          <span className="requiredMark" aria-hidden="true">
            *
          </span>
        </span>
        <input
          aria-required="true"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          maxLength={300}
        />
      </label>
      <label>
        <input
          type="checkbox"
          aria-required="true"
          checked={rightsConfirmed}
          onChange={(e) => setRightsConfirmed(e.target.checked)}
        />
        <span className="formLabelText">
          Tôi có quyền dùng ảnh này trên website{" "}
          <span className="requiredMark" aria-hidden="true">
            *
          </span>
        </span>
      </label>
      <label>
        Tải ảnh từ thiết bị
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
            e.target.value = "";
          }}
        />
      </label>
      <p>
        Ảnh được lưu riêng; chỉ phục vụ công khai khi nội dung đã xuất bản.
        Không dùng ảnh có thông tin cá nhân hoặc bằng chứng giao dịch.
      </p>
      {busy && <LoadingState overlay={false}>Đang tải ảnh…</LoadingState>}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </fieldset>
  );
}

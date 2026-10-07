import { notify } from "../../shared/feedback";
import { LoadingState } from "../../shared/Loading";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { callService } from "../../shared/firebase";
type Policy = {
  version: number;
  approved: boolean;
  daysBeforeExpiry: number | null;
};
type Attempt = {
  key: string;
  operationId: string;
  payload: {
    action: "save";
    expectedVersion: number;
    approved: boolean;
    daysBeforeExpiry?: number;
  };
};
export function ReminderSettings() {
  const [policy, setPolicy] = useState<Policy | null>(null),
    [days, setDays] = useState(""),
    [approved, setApproved] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const attempt = useRef<Attempt | null>(null),
    running = useRef(false),
    mounted = useRef(false);
  async function load() {
    if (running.current || attempt.current) return;
    running.current = true;
    setBusy(true);
    setPolicy(null);
    setApproved(false);
    setDays("");
    setError("");

    try {
      const result = await callService<Policy>("membershipReminderPolicy", {
        action: "read",
      });
      if (!mounted.current) return;
      setPolicy(result);
      setApproved(result.approved);
      setDays(
        result.daysBeforeExpiry === null ? "" : String(result.daysBeforeExpiry),
      );
    } catch (e) {
      if (mounted.current)
        setError(
          (e as Error).message || "Chưa tải được cấu hình. Tải lại để thử lại.",
        );
    } finally {
      running.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
    };
  }, []);
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!policy || running.current) return;
    const payload = {
      action: "save" as const,
      expectedVersion: policy.version,
      approved,
      ...(days === "" ? {} : { daysBeforeExpiry: Number(days) }),
    };
    const key = JSON.stringify(payload);
    if (attempt.current && attempt.current.key !== key) {
      setError(
        "Lần lưu trước chưa rõ kết quả. Thử lại cùng nội dung trước khi thay đổi cấu hình.",
      );
      return;
    }
    attempt.current ??= { key, operationId: crypto.randomUUID(), payload };
    running.current = true;
    setBusy(true);
    setError("");

    try {
      const result = await callService<Policy>("membershipReminderPolicy", {
        ...attempt.current.payload,
        operationId: attempt.current.operationId,
      });
      if (!mounted.current) return;
      attempt.current = null;
      setPolicy(result);
      setApproved(result.approved);
      setDays(
        result.daysBeforeExpiry === null ? "" : String(result.daysBeforeExpiry),
      );
      notify(
        result.approved
          ? "Đã bật nhắc hết hạn theo số ngày bạn chọn. Email chỉ gửi khi dịch vụ gửi thư đã được cấu hình."
          : "Đã tắt tạo nhắc hết hạn mới. Thông báo đã tạo vẫn được giữ.",
        "success",
      );
    } catch (e) {
      if (!mounted.current) return;
      const code = (e as { code?: string }).code;
      if (
        code &&
        ![
          "functions/internal",
          "functions/unavailable",
          "functions/unknown",
          "functions/deadline-exceeded",
        ].includes(code)
      ) {
        attempt.current = null;
        if (code === "functions/aborted") setPolicy(null);
      }
      setError(
        (e as Error).message ||
          "Chưa rõ kết quả lưu. Thử lại cùng nội dung để tránh tạo trùng.",
      );
    } finally {
      running.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  return (
    <section className="panel">
      <h3>Nhắc gói sắp hết hạn</h3>
      <p>Chỉ chủ doanh nghiệp được cấu hình. Không tự động thu tiền gia hạn.</p>
      <button
        type="button"
        disabled={busy || attempt.current !== null}
        onClick={() => void load()}
      >
        Tải lại cấu hình nhắc hết hạn
      </button>
      {busy && (
        <LoadingState overlay={false}>Đang xử lý cấu hình…</LoadingState>
      )}
      <form className="form" onSubmit={(e) => void save(e)}>
        <label>
          <input
            type="checkbox"
            checked={approved}
            disabled={!policy || busy || attempt.current !== null}
            onChange={(e) => setApproved(e.target.checked)}
          />
          Bật nhắc trước khi gói hết hạn
        </label>
        <label>
          <span className="formLabelText">
            Số ngày trước khi hết hạn{" "}
            {approved && (
              <span className="requiredMark" aria-hidden="true">
                *
              </span>
            )}
          </span>
          <input
            type="number"
            min={1}
            max={30}
            step={1}
            required={approved}
            disabled={!policy || busy || attempt.current !== null}
            value={days}
            onChange={(e) => setDays(e.target.value)}
          />
        </label>
        <p>
          Chọn từ 1 đến 30 ngày. Không áp dụng giá trị mặc định khi chưa được
          duyệt.
        </p>
        <button disabled={!policy || busy}>
          {attempt.current
            ? "Thử lại lần lưu cấu hình"
            : "Lưu cấu hình nhắc hết hạn"}
        </button>
      </form>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

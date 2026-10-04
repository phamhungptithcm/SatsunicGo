import { useEffect, useState, type FormEvent } from "react";
import { callService } from "../../shared/firebase";
type Plan = {
  id: string;
  version: number;
  name: string;
  price: number;
  periodDays: number;
  serviceDiscountBps: number;
  discountCap: number;
  status: string;
};
export function PlanEditor() {
  const [plans, setPlans] = useState<Plan[]>([]),
    [selected, setSelected] = useState<Plan | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function load() {
    try {
      const r = await callService<{ rows: Plan[] }>("listWork", {
        kind: "membershipPlans",
      });
      setPlans(r.rows);
    } catch {
      setError("Chưa tải được gói membership.");
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await callService("workspaceCommand", {
        action: "saveMembershipPlan",
        operationId: crypto.randomUUID(),
        ...(selected
          ? { id: selected.id, expectedVersion: selected.version }
          : {}),
        payload: {
          name: String(f.get("name")),
          price: Number(f.get("price")),
          periodDays: Number(f.get("days")),
          serviceDiscountBps: Number(f.get("bps")),
          discountCap: Number(f.get("cap")),
          status: String(f.get("status")),
        },
      });
      setSelected(null);
      setMessage("Đã lưu gói. Quyền lợi đã chốt trong báo giá cũ giữ nguyên.");
      await load();
    } catch {
      setError("Chưa lưu được. Kiểm tra giá, kỳ hạn, mức giảm và phiên bản.");
    } finally {
      setBusy(false);
    }
  }
  async function grant(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      await callService("membershipCommand", {
        action: "grant",
        operationId: crypto.randomUUID(),
        ownerId: String(f.get("uid")),
        planId: String(f.get("plan")),
        reason: String(f.get("reason")),
      });
      setMessage("Đã cấp tặng và ghi lịch sử membership.");
    } catch {
      setError(
        "Chưa cấp được. Kiểm tra tài khoản, gói đã duyệt và xác thực hai lớp gần đây.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="panel">
      <summary>Cấu hình và cấp tặng membership</summary>
      <button onClick={() => setSelected(null)}>Gói mới</button>
      {plans.map((p) => (
        <button key={p.id} onClick={() => setSelected(p)}>
          {p.name} ·{" "}
          {p.status === "published"
            ? "Đang mở bán"
            : p.status === "draft"
              ? "Bản nháp"
              : "Đã lưu trữ"}
        </button>
      ))}
      <form
        key={selected?.id ?? "new"}
        className="form"
        onSubmit={(e) => void save(e)}
      >
        <label>
          Gói
          <select name="name" defaultValue={selected?.name ?? "FREE"}>
            {["FREE", "PLUS", "BUSINESS"].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        {[
          ["price", "Giá trả trước (₫)", selected?.price, 0, 1000000000000],
          ["days", "Kỳ hạn (ngày)", selected?.periodDays, 1, 366],
          [
            "bps",
            "Giảm phí mua hộ (bps · 100 bps = 1%)",
            selected?.serviceDiscountBps,
            0,
            10000,
          ],
          ["cap", "Giảm tối đa (₫)", selected?.discountCap, 0, 1000000000000],
        ].map(([name, label, value, min, max]) => (
          <label key={String(name)}>
            {label}
            <input
              name={String(name)}
              type="number"
              step={1}
              min={Number(min)}
              max={Number(max)}
              defaultValue={value ?? ""}
              required
            />
          </label>
        ))}
        <label>
          Trạng thái
          <select name="status" defaultValue={selected?.status ?? "draft"}>
            <option value="draft">Bản nháp</option>
            <option value="published">Đã duyệt và mở bán</option>
            <option value="archived">Lưu trữ</option>
          </select>
        </label>
        <button disabled={busy}>Lưu gói</button>
      </form>
      <form className="form" onSubmit={(e) => void grant(e)}>
        <h3>Cấp tặng có ghi nhận</h3>
        <label>
          UID khách hàng
          <input name="uid" required />
        </label>
        <label>
          Gói đã duyệt
          <select name="plan" required>
            <option value="">Chọn gói</option>
            {plans
              .filter((p) => p.status === "published")
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          Lý do cấp tặng
          <textarea name="reason" minLength={5} maxLength={500} required />
        </label>
        <button disabled={busy}>Cấp tặng membership</button>
      </form>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
    </details>
  );
}

import { useEffect, useState, type FormEvent } from "react";
import { callService } from "../../shared/firebase";
type Policy = {
  version: number;
  termsVersion: string;
  approved: boolean;
  rates: Record<string, { numerator: number; denominator: number }>;
  effectiveFrom: number;
  expiresAt: number;
};
function localTime(value?: number) {
  if (!value) return "";
  const d = new Date(value);
  return new Date(value - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
export function Settings() {
  const [policy, setPolicy] = useState<Policy | null>(null),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  async function load() {
    try {
      const r = await callService<{ pricing: Policy | null }>(
        "readOwnerConfiguration",
        {},
      );
      setPolicy(r.pricing);
      setReady(true);
    } catch {
      setError(
        "Chưa tải được chính sách. Không thể lưu trên dữ liệu chưa xác minh.",
      );
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const f = new FormData(e.currentTarget);
    try {
      await callService("workspaceCommand", {
        action: "savePricingPolicy",
        operationId: crypto.randomUUID(),
        ...(policy ? { expectedVersion: policy.version } : {}),
        payload: {
          termsVersion: String(f.get("terms")),
          approved: f.get("approved") === "on",
          rates: Object.fromEntries(
            ["USD", "JPY", "KRW"].map((c) => [
              c,
              {
                numerator: Number(f.get(`${c}-num`)),
                denominator: Number(f.get(`${c}-den`)),
              },
            ]),
          ),
          effectiveFrom: new Date(String(f.get("from"))).getTime(),
          expiresAt: new Date(String(f.get("until"))).getTime(),
        },
      });
      setMessage(
        "Đã lưu chính sách. Báo giá đã chấp nhận giữ nguyên snapshot.",
      );
      await load();
    } catch {
      setError(
        "Chưa lưu được. Kiểm tra giá trị, thời hạn và phiên bản chính sách.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="panel">
      <summary>Chính sách tỷ giá và điều khoản</summary>
      <p>
        Chỉ chủ doanh nghiệp phê duyệt chính sách. Tỷ lệ quy đổi tính trên đơn
        vị tiền nguồn nhỏ nhất; không điền giá thử vào cấu hình thương mại.
      </p>
      <form
        key={policy?.version ?? "new"}
        className="form"
        onSubmit={(e) => void save(e)}
      >
        <label>
          Phiên bản điều khoản
          <input
            name="terms"
            required
            maxLength={80}
            defaultValue={policy?.termsVersion}
          />
        </label>
        {["USD", "JPY", "KRW"].map((c) => (
          <fieldset key={c}>
            <legend>{c} · VND cho đơn vị nhỏ nhất</legend>
            <label>
              Tử số
              <input
                name={`${c}-num`}
                type="number"
                min={1}
                max={1000000000}
                required
                defaultValue={policy?.rates[c]?.numerator}
              />
            </label>
            <label>
              Mẫu số
              <input
                name={`${c}-den`}
                type="number"
                min={1}
                max={1000000000}
                required
                defaultValue={policy?.rates[c]?.denominator}
              />
            </label>
          </fieldset>
        ))}
        <label>
          Áp dụng từ · giờ trên thiết bị
          <input
            name="from"
            type="datetime-local"
            required
            defaultValue={localTime(policy?.effectiveFrom)}
          />
        </label>
        <label>
          Hết hạn · giờ trên thiết bị
          <input
            name="until"
            type="datetime-local"
            required
            defaultValue={localTime(policy?.expiresAt)}
          />
        </label>
        <label>
          <input
            name="approved"
            type="checkbox"
            defaultChecked={policy?.approved}
          />{" "}
          Đã duyệt điều khoản và tỷ giá thương mại
        </label>
        <button disabled={!ready || busy}>Lưu chính sách</button>
      </form>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
    </details>
  );
}

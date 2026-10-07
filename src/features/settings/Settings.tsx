import { StepForm, StepStage } from "../../shared/StepForm";
import { policyDateLabel, policyVersionLabel } from "./policy-display099";
import "./admin-workbench096.css";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { callService } from "../../shared/firebase";
import { CrmHeading, CrmIcon, CrmState } from "../crm/CrmPresentation";
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
    [reading, setReading] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [uncertain, setUncertain] = useState(false);
  const request = useRef(0);
  const sending = useRef(false),
    pending = useRef<Record<string, unknown> | null>(null);
  const mounted = useRef(false);
  async function load() {
    if (!mounted.current) return;
    const current = ++request.current;
    setReady(false);
    setReading(true);
    setError("");
    try {
      const r = await callService<{ pricing: Policy | null }>(
        "readOwnerConfiguration",
        {},
      );
      if (current !== request.current) return;
      setPolicy(r.pricing);
      setReady(true);
    } catch {
      if (current !== request.current) return;
      setError(
        "Chưa tải được chính sách. Không thể lưu trên dữ liệu chưa xác minh.",
      );
    } finally {
      if (current === request.current) setReading(false);
    }
  }
  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
      request.current++;
    };
  }, []);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!ready || busy || reading || uncertain || sending.current) return;
    setBusy(true);
    setError("");
    setMessage("");
    const f = new FormData(e.currentTarget);
    pending.current = {
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
    };
    await executeSave();
  }
  async function executeSave() {
    if (!pending.current || sending.current) return;
    const command = pending.current;
    sending.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await callService("workspaceCommand", command);
      if (!mounted.current) return;
      pending.current = null;
      setUncertain(false);
      setMessage(
        "Đã lưu chính sách. Báo giá đã chấp nhận giữ nguyên snapshot.",
      );
      await load();
    } catch (cause) {
      if (!mounted.current) return;
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
      setError(
        rejected
          ? "Chưa lưu được. Kiểm tra giá trị, quyền và phiên bản chính sách."
          : "Chưa xác nhận được kết quả lưu. Thử lại thao tác đang chờ trước khi chỉnh chính sách.",
      );
    } finally {
      sending.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  return (
    <section className="admin096">
      <CrmHeading
        title="Tỷ giá & điều khoản"
        description="Điều khoản và tỷ giá áp dụng cho báo giá mới."
      />
      {ready && (
        <p className="notice">
          {policy
            ? `${policyVersionLabel(policy.version)} · ${policy.approved ? "Đã phê duyệt" : "Chưa phê duyệt"} · ${policyDateLabel(policy.effectiveFrom)} → ${policyDateLabel(policy.expiresAt)}`
            : "Chưa có chính sách."}
        </p>
      )}
      <div className="adminLayout">
        <details open className="panel crmPolicy">
          <summary>Chính sách tỷ giá và điều khoản</summary>
          <p>
            Chỉ chủ doanh nghiệp phê duyệt chính sách. Tỷ lệ quy đổi tính trên
            đơn vị tiền nguồn nhỏ nhất; không điền giá thử vào cấu hình thương
            mại.
          </p>
          {reading && <CrmState kind="loading" title="Đang tải chính sách…" />}
          <StepForm
            steps={["Điều khoản", "Tỷ giá", "Hiệu lực", "Kiểm tra"]}
            disabled={!ready || busy || reading || uncertain}
            key={policy?.version ?? "new"}
            className="form"
            onSubmit={(e) => void save(e)}
          >
            <fieldset
              className="form"
              disabled={!ready || busy || reading || uncertain}
            >
              <StepStage index={0}>
                <label>
                  <span className="formLabelText">
                    Phiên bản điều khoản{" "}
                    <span className="requiredMark" aria-hidden="true">
                      *
                    </span>
                  </span>
                  <input
                    name="terms"
                    required
                    maxLength={80}
                    defaultValue={policy?.termsVersion}
                  />
                </label>
              </StepStage>
              <StepStage index={1}>
                {["USD", "JPY", "KRW"].map((c) => (
                  <fieldset className="crmRateFields adminRateRow" key={c}>
                    <legend>{c} · VND cho đơn vị nhỏ nhất</legend>
                    <label>
                      <span className="formLabelText">
                        Tử số{" "}
                        <span className="requiredMark" aria-hidden="true">
                          *
                        </span>
                      </span>
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
                      <span className="formLabelText">
                        Mẫu số{" "}
                        <span className="requiredMark" aria-hidden="true">
                          *
                        </span>
                      </span>
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
              </StepStage>
              <StepStage index={2}>
                <label>
                  <span className="formLabelText">
                    Áp dụng từ · giờ trên thiết bị{" "}
                    <span className="requiredMark" aria-hidden="true">
                      *
                    </span>
                  </span>
                  <input
                    name="from"
                    type="datetime-local"
                    required
                    defaultValue={localTime(policy?.effectiveFrom)}
                  />
                </label>
                <label>
                  <span className="formLabelText">
                    Hết hạn · giờ trên thiết bị{" "}
                    <span className="requiredMark" aria-hidden="true">
                      *
                    </span>
                  </span>
                  <input
                    name="until"
                    type="datetime-local"
                    required
                    defaultValue={localTime(policy?.expiresAt)}
                  />
                </label>
              </StepStage>
              <StepStage index={3}>
                <label>
                  <input
                    name="approved"
                    type="checkbox"
                    defaultChecked={policy?.approved}
                  />{" "}
                  Đã duyệt điều khoản và tỷ giá thương mại
                </label>
                <button
                  className="primary"
                  disabled={!ready || busy || reading || uncertain}
                >
                  {busy ? "Đang lưu…" : "Lưu chính sách"}
                </button>
              </StepStage>
            </fieldset>
          </StepForm>
          {error && (
            <CrmState kind="error" title={error}>
              <button
                type="button"
                disabled={busy || reading || uncertain}
                onClick={() => void load()}
              >
                <CrmIcon name="refresh" /> Tải lại chính sách
              </button>
            </CrmState>
          )}
          {message && <p role="status">{message}</p>}
        </details>
        <aside
          className="panel adminGuide"
          aria-label="Phạm vi áp dụng chính sách"
        >
          <h2>Áp dụng cho báo giá mới</h2>
          <p>
            Báo giá đã chấp nhận giữ nguyên tỷ giá và điều khoản tại thời điểm
            chấp nhận.
          </p>
          <p className="muted">
            Thời gian bắt đầu và hết hạn hiển thị theo giờ trên thiết bị.
          </p>
        </aside>
      </div>
      {uncertain && (
        <button
          className="primary"
          disabled={busy}
          onClick={() => void executeSave()}
        >
          Thử lại thao tác đang chờ
        </button>
      )}
    </section>
  );
}

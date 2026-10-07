import { notify } from "../../shared/feedback";
import { AskPilot } from "./AskPilot";
import "./settings107.css";
import { policyDateLabel, policyVersionLabel } from "./policy-display099";
import "./admin-workbench096.css";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { callService } from "../../shared/firebase";
import { CrmHeading, CrmState } from "../crm/CrmPresentation";
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
  const [tab, setTab] = useState("policy");
  const [policy, setPolicy] = useState<Policy | null>(null),
    [ready, setReady] = useState(false),
    [reading, setReading] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [uncertain, setUncertain] = useState(false);
  function showError(text: string) {
    setError(text);
    if (text) notify(text, "error");
  }
  const request = useRef(0);
  const sending = useRef(false),
    pending = useRef<Record<string, unknown> | null>(null);
  const mounted = useRef(false);
  async function load() {
    if (!mounted.current) return;
    const current = ++request.current;
    setReady(false);
    setReading(true);
    showError("");
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
      showError(
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
    showError("");

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
    showError("");

    try {
      await callService("workspaceCommand", command);
      if (!mounted.current) return;
      pending.current = null;
      setUncertain(false);
      notify(
        "Đã lưu chính sách. Báo giá đã chấp nhận giữ nguyên tỷ giá và điều khoản.",
        "success",
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
      showError(
        (cause as { details?: { reason?: string } }).details?.reason ===
          "ACTION_NOT_RESUMED"
          ? "Chưa xác thực xong. Chính sách chưa được thay đổi."
          : rejected
            ? "Chưa lưu được. Kiểm tra giá trị, quyền và phiên bản chính sách."
            : "Chưa xác nhận được kết quả lưu. Thử lại thao tác đang chờ trước khi chỉnh chính sách.",
      );
    } finally {
      sending.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  return (
    <section className="admin096 settings107">
      <CrmHeading
        title="Cấu hình"
        description="Quản lý tỷ giá, điều khoản và thử Ask."
      />
      <div className="settingsTabs" role="tablist" aria-label="Mục cấu hình">
        {[
          ["policy", "Tỷ giá & điều khoản"],
          ["ask", "Thử Ask"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-controls={`panel-${id}`}
            aria-selected={tab === id}
            tabIndex={tab === id ? 0 : -1}
            onClick={() => setTab(id)}
            onKeyDown={(e) => {
              if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
                e.preventDefault();
                const next =
                  e.key === "Home"
                    ? "policy"
                    : e.key === "End"
                      ? "ask"
                      : tab === "policy"
                        ? "ask"
                        : "policy";
                setTab(next);
                document.getElementById(`tab-${next}`)?.focus();
              }
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id="panel-policy"
        aria-labelledby="tab-policy"
        hidden={tab !== "policy"}
      >
        {ready && (
          <p className="notice">
            {policy
              ? `${policyVersionLabel(policy.version)} · ${policy.approved ? "Đã phê duyệt" : "Chưa phê duyệt"} · ${policyDateLabel(policy.effectiveFrom)} → ${policyDateLabel(policy.expiresAt)}`
              : "Chưa có chính sách."}
          </p>
        )}
        <div className="adminLayout">
          <section className="panel crmPolicy">
            <h2>Tỷ giá & điều khoản</h2>
            <p>
              Chỉ chủ doanh nghiệp phê duyệt chính sách. Tỷ lệ quy đổi tính trên
              đơn vị tiền nguồn nhỏ nhất; không điền giá thử vào cấu hình thương
              mại.
            </p>
            {reading && (
              <CrmState kind="loading" title="Đang tải chính sách…" />
            )}
            <form
              key={policy?.version ?? "new"}
              className="form"
              onSubmit={(e) => void save(e)}
            >
              <fieldset
                className="form"
                disabled={!ready || busy || reading || uncertain}
              >
                <div className="policyGroup group0">
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
                </div>
                <div className="policyGroup group1">
                  <h3>Tỷ giá quy đổi</h3>
                  {["USD", "JPY", "KRW"].map((c) => (
                    <fieldset className="crmRateFields adminRateRow" key={c}>
                      <legend>{c} · VND cho đơn vị nhỏ nhất</legend>
                      <label>
                        <span className="formLabelText">
                          Số VND{" "}
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
                          Số đơn vị tiền nguồn{" "}
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
                </div>
                <div className="policyGroup group2">
                  <h3>Thời gian áp dụng</h3>
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
                </div>
                <div className="policyGroup group3">
                  <label className="policyCheck">
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
                </div>
              </fieldset>
            </form>
            {error && (
              <button
                type="button"
                disabled={busy || reading || uncertain}
                onClick={() => void load()}
              >
                Tải lại chính sách
              </button>
            )}
          </section>
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
      </div>
      <div
        role="tabpanel"
        id="panel-ask"
        aria-labelledby="tab-ask"
        hidden={tab !== "ask"}
      >
        <AskPilot />
      </div>
    </section>
  );
}

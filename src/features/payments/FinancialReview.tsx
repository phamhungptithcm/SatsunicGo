import { CrmIcon, CrmState } from "../crm/CrmPresentation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { callService } from "../../shared/firebase";
import type { Order } from "../../../packages/domain";
type Exception = { id: string; state: string; inboundVerified?: boolean };
export function financeAuthorityDenied(cause: unknown) {
  const code = String((cause as { code?: string })?.code ?? "").replace(
    /^functions\//,
    "",
  );
  return code === "permission-denied" || code === "unauthenticated";
}
export type FinanceTransport = {
  acquire: () => symbol | null;
  begin: (token: symbol) => boolean;
  finish: (token: symbol, unknown?: boolean) => void;
  deny: () => void;
};
export function financeRejection(
  cause: unknown,
  service: "financeReview" | "verifyTransfer" | "membershipCommand",
) {
  const code = String((cause as { code?: string })?.code ?? "").replace(
    /^functions\//,
    "",
  );
  if (code === "aborted")
    return service === "financeReview" || service === "verifyTransfer";
  return [
    "invalid-argument",
    "permission-denied",
    "unauthenticated",
    "failed-precondition",
    "not-found",
    "already-exists",
  ].includes(code);
}
export function financeReviewInput(form: FormData, exception?: Exception) {
  const action = exception ? String(form.get("action")) : "reverse";
  if (
    exception
      ? exception.state !== "open" ||
        !["closeException", "allocateException"].includes(action) ||
        (action === "allocateException" && !exception.inboundVerified)
      : action !== "reverse"
  )
    throw Error("Thao tác không hợp lệ.");
  return {
    action,
    reason: String(form.get("reason") ?? ""),
    evidence: String(form.get("evidence") ?? ""),
    ...(exception ? { id: exception.id } : {}),
    ...(action !== "closeException"
      ? { orderId: String(form.get("orderId") ?? "").trim() }
      : {}),
    ...(action === "reverse"
      ? {
          entryId: String(form.get("entryId") ?? "").trim(),
          amount: Number(form.get("amount")),
          bankTransactionId: String(form.get("bank") ?? ""),
        }
      : {}),
  };
}
export function FinancialReview({
  exception,
  transport,
  disabled = false,
}: {
  exception?: Exception;
  transport: FinanceTransport;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [uncertain, setUncertain] = useState(false),
    [done, setDone] = useState(false),
    [action, setAction] = useState(exception ? "closeException" : "reverse");
  const pending = useRef<Record<string, unknown> | null>(null),
    token = useRef<symbol | null>(null),
    sending = useRef(false),
    mounted = useRef(false),
    currentTransport = useRef(transport);
  currentTransport.current = transport;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || uncertain || sending.current || disabled) return;
    const lease = currentTransport.current;
    const acquired = lease.acquire();
    if (!acquired) return;
    const form = new FormData(event.currentTarget);
    let handedOff = false;
    sending.current = true;
    setBusy(true);
    setError("");
    try {
      const base = financeReviewInput(form, exception);
      const current =
        base.action !== "closeException"
          ? await callService<{ order: Order }>("orderHistory", {
              orderId: base.orderId,
            })
          : null;
      if (!mounted.current) return;
      pending.current = {
        ...base,
        ...(current ? { expectedVersion: current.order.version } : {}),
        operationId: crypto.randomUUID(),
      };
      token.current = acquired;
      sending.current = false;
      handedOff = true;
      await execute(true);
    } catch (cause) {
      if (financeAuthorityDenied(cause)) lease.deny();
      if (mounted.current)
        setError(
          "Chưa kiểm tra được đơn và quyền đối soát. Kiểm tra lại trước khi gửi.",
        );
    } finally {
      if (!handedOff) lease.finish(acquired);
      sending.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  async function execute(started = false) {
    if (!pending.current || !token.current || sending.current) return;
    const lease = currentTransport.current,
      acquired = token.current;
    if (!started && !lease.begin(acquired)) return;
    const command = pending.current;
    let unknown = false;
    sending.current = true;
    setBusy(true);
    setError("");
    try {
      await callService("financeReview", command);
      pending.current = null;
      token.current = null;
      if (!mounted.current) return;
      setUncertain(false);
      setDone(true);
    } catch (cause) {
      const rejected = financeRejection(cause, "financeReview");
      unknown = !rejected;
      if (rejected) {
        pending.current = null;
        token.current = null;
      }
      if (financeAuthorityDenied(cause)) lease.deny();
      if (!mounted.current) return;
      setUncertain(unknown);
      setError(
        rejected
          ? "Chưa lưu được. Kiểm tra tiền thực tế, phiên bản, quyền và xác thực hai lớp."
          : "Chưa xác nhận được kết quả. Nội dung đang được giữ nguyên để thử lại đúng thao tác.",
      );
    } finally {
      sending.current = false;
      lease.finish(acquired, unknown);
      if (mounted.current) setBusy(false);
    }
  }
  if (done)
    return (
      <p className="notice" role="status">
        Đã lưu kết quả đối soát. Tải lại hàng đợi và đơn để xem dữ liệu mới.
      </p>
    );
  if (exception && exception.state !== "open") return null;
  return (
    <details className="crmItemDetails" name="crm-finance-actions">
      <summary>
        <CrmIcon name="warning" />
        {exception ? "Đối soát ngoại lệ" : "Ghi nhận tiền vào bị ngân hàng đảo"}
      </summary>
      <p className="muted">
        {exception
          ? "Đóng ngoại lệ chỉ ghi kết quả kiểm tra. Phân bổ chỉ áp dụng tiền đã xác minh vào đúng tài khoản doanh nghiệp; không tự cho đơn đi tiếp."
          : "Chỉ đảo phần tiền vào đã ghi nhận, có giao dịch ngân hàng thật. Giữ lịch sử gốc và tạm giữ đơn để đối soát."}
      </p>
      <form className="form" onSubmit={(event) => void submit(event)}>
        <fieldset className="form" disabled={busy || uncertain || disabled}>
          {exception && (
            <label>
              Quyết định
              <select
                name="action"
                value={action}
                onChange={(e) => setAction(e.target.value)}
              >
                <option value="closeException">
                  Đóng sau khi kiểm tra, không ghi thêm tiền
                </option>
                {exception.inboundVerified && (
                  <option value="allocateException">
                    Phân bổ tiền đã đối soát vào đơn
                  </option>
                )}
              </select>
            </label>
          )}
          {action !== "closeException" && (
            <label>
              Mã đơn
              <input name="orderId" maxLength={80} required />
            </label>
          )}
          {!exception && (
            <>
              <label>
                Mã khoản tiền vào gốc trong lịch sử đơn
                <input name="entryId" maxLength={160} required />
              </label>
              <label>
                Số tiền bị đảo (₫)
                <input
                  name="amount"
                  type="number"
                  min={1}
                  max={1000000000000}
                  required
                />
              </label>
              <label>
                Mã giao dịch đảo tiền ngân hàng
                <input name="bank" minLength={4} maxLength={120} required />
              </label>
            </>
          )}
          <label>
            Lý do
            <textarea name="reason" minLength={5} maxLength={500} required />
          </label>
          <label>
            Bằng chứng đã đối soát
            <textarea name="evidence" minLength={5} maxLength={1000} required />
          </label>
          <button className="primary" disabled={busy || uncertain || disabled}>
            {busy
              ? "Đang lưu…"
              : action === "closeException"
                ? "Đóng ngoại lệ đã kiểm tra"
                : action === "allocateException"
                  ? "Phân bổ tiền đã xác minh"
                  : "Ghi nhận ngân hàng đảo tiền"}
          </button>
        </fieldset>
      </form>
      {error && <CrmState kind="error" title={error} />}
      {uncertain && (
        <button
          className="primary"
          disabled={busy}
          onClick={() => void execute()}
        >
          Thử lại thao tác đang chờ
        </button>
      )}
    </details>
  );
}

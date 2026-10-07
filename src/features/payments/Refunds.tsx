import { StepForm, StepStage } from "../../shared/StepForm";
import { WorkbenchComposer095 } from "../crm/FinanceContent095";
import {
  CrmIcon,
  CrmHeading,
  CrmState,
  CrmReference,
} from "../crm/CrmPresentation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { callService, sendCommand } from "../../shared/firebase";
import type { Order } from "../../../packages/domain";
export type Refund = {
  id: string;
  orderId: string;
  amount: number;
  reason: string;
  state: string;
};
export function Refunds() {
  const [creating, setCreating] = useState(false);
  const [rows, setRows] = useState<Refund[]>([]),
    [next, setNext] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [requestUncertain, setRequestUncertain] = useState(false);
  const pending = useRef<{
    serialized: string;
    id: string;
    version?: number;
  } | null>(null);
  const reading = useRef(0),
    requesting = useRef(false),
    committedPageAfter = useRef<string | null>(null);
  async function load(after: string | null = committedPageAfter.current) {
    const revision = ++reading.current;
    setBusy(true);
    setError("");
    try {
      const r = await callService<{ rows: Refund[]; next: string | null }>(
        "listWork",
        { kind: "refunds", ...(after ? { after } : {}) },
      );
      if (revision !== reading.current) return;
      committedPageAfter.current = after;
      setRows(r.rows);
      setNext(r.next);
    } catch {
      if (revision !== reading.current) return;
      setRows([]);
      setNext(null);
      setError("Chưa tải được yêu cầu hoàn tiền. Kiểm tra kết nối và thử lại.");
    } finally {
      if (revision === reading.current) setBusy(false);
    }
  }
  useEffect(() => {
    void load(null);
    return () => {
      reading.current++;
    };
  }, []);
  async function request(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (requesting.current) return;
    requesting.current = true;
    const context = reading.current;
    const form = new FormData(event.currentTarget);
    const payload =
      requestUncertain && pending.current
        ? JSON.parse(pending.current.serialized)
        : {
            action: "request",
            orderId: String(form.get("orderId")).trim(),
            amount: Number(form.get("amount")),
            reason: String(form.get("reason")),
          };
    const serialized = JSON.stringify(payload);
    if (pending.current?.serialized !== serialized)
      pending.current = { serialized, id: crypto.randomUUID() };
    setBusy(true);
    setError("");
    try {
      if (pending.current.version === undefined) {
        const current = await callService<{ order: Order }>("orderHistory", {
          orderId: payload.orderId,
        });
        if (context !== reading.current) return;
        pending.current.version = current.order.version;
      }
      await callService("refundCommand", {
        ...payload,
        expectedVersion: pending.current.version,
        operationId: pending.current.id,
      });
      pending.current = null;
      if (context !== reading.current) return;
      setRequestUncertain(false);
      setCreating(false);
      await load(null);
    } catch (e) {
      if (context !== reading.current) return;
      const unknown =
        pending.current?.version !== undefined && !definiteRefundRejection(e);
      if (!unknown) pending.current = null;
      setRequestUncertain(unknown);
      setError(
        unknown
          ? "Chưa xác nhận được yêu cầu. Thử lại với nội dung và mã thao tác đang được giữ nguyên."
          : "Chưa tạo được yêu cầu. Kiểm tra đơn, phần tiền có thể hoàn và xác thực hai lớp.",
      );
    } finally {
      requesting.current = false;
      if (context === reading.current) setBusy(false);
    }
  }

  return (
    <section className="fc095 fc095Refunds">
      <CrmHeading
        title="Hoàn tiền"
        description="Tạo yêu cầu và đối chiếu giao dịch hoàn tiền theo đơn."
        actions={
          <>
            <button
              disabled={busy || requestUncertain}
              onClick={() => void load()}
            >
              <CrmIcon name="refresh" /> Tải lại
            </button>
            <button
              className="primary"
              disabled={busy || requestUncertain}
              onClick={() => setCreating(true)}
            >
              <CrmIcon name="document" /> Tạo yêu cầu hoàn tiền
            </button>
          </>
        }
      />
      <p className="fc095Notice">
        Yêu cầu chỉ dành trước số tiền có thể hoàn. Chỉ xác nhận sau khi đã đối
        chiếu giao dịch tiền ra thực tế; không tự chuyển tiền.
      </p>
      <WorkbenchComposer095
        open={creating}
        title="Yêu cầu hoàn tiền mới"
        locked={busy || requestUncertain}
        onClose={() => setCreating(false)}
      >
        <StepForm
          steps={["Đơn & số tiền", "Lý do", "Kiểm tra"]}
          disabled={busy || requestUncertain}
          className="form"
          onSubmit={(e) => void request(e)}
        >
          <fieldset className="form" disabled={busy || requestUncertain}>
            <StepStage index={0}>
              <label>
                <span className="formLabelText">
                  Mã đơn{" "}
                  <span className="requiredMark" aria-hidden="true">
                    *
                  </span>
                </span>
                <input name="orderId" maxLength={80} required />
              </label>
              <label>
                <span className="formLabelText">
                  Số tiền cần hoàn (₫){" "}
                  <span className="requiredMark" aria-hidden="true">
                    *
                  </span>
                </span>
                <input
                  name="amount"
                  type="number"
                  min={1}
                  step={1}
                  max={1000000000000}
                  required
                />
              </label>
            </StepStage>
            <StepStage index={1}>
              <label>
                <span className="formLabelText">
                  Lý do{" "}
                  <span className="requiredMark" aria-hidden="true">
                    *
                  </span>
                </span>
                <textarea
                  name="reason"
                  minLength={5}
                  maxLength={500}
                  required
                />
              </label>
            </StepStage>
            <StepStage index={2}>
              <button className="primary" disabled={busy}>
                Tạo yêu cầu hoàn tiền
              </button>
            </StepStage>
          </fieldset>
          {requestUncertain && (
            <button type="submit" disabled={busy}>
              {busy ? "Đang kiểm tra…" : "Thử lại yêu cầu đã gửi"}
            </button>
          )}
        </StepForm>
      </WorkbenchComposer095>
      <div className="fc095SectionHead">
        <h2>Yêu cầu hoàn tiền</h2>
        <span className="muted">Danh sách theo trang</span>
      </div>
      {busy && <CrmState kind="loading" title="Đang tải / lưu…" />}
      {error && <CrmState kind="error" title={error} />}
      <div className="crmList">
        {rows.map((row) => (
          <RefundForm key={row.id + row.state} row={row} onChanged={load} />
        ))}
      </div>
      {!busy && !error && !rows.length && (
        <CrmState kind="empty" title="Chưa có yêu cầu trong trang này." />
      )}
      {next && (
        <button disabled={busy} onClick={() => void load(next)}>
          Trang tiếp theo
        </button>
      )}
    </section>
  );
}
export function refundDecision(
  form: FormData,
  row: Refund,
  version: number,
  operationId: string,
) {
  const action = String(form.get("action"));
  if (action !== "confirm" && action !== "cancel")
    throw new Error("Invalid decision");
  return action === "cancel"
    ? {
        action: "cancel" as const,
        id: row.id,
        orderId: row.orderId,
        expectedVersion: version,
        operationId,
        reason: String(form.get("evidence") ?? ""),
      }
    : {
        action: "refund" as const,
        orderId: row.orderId,
        expectedVersion: version,
        operationId,
        payload: {
          refundRequestId: row.id,
          amount: row.amount,
          bankTransactionId: String(form.get("bank") ?? ""),
          evidence: String(form.get("evidence") ?? ""),
          reason: row.reason,
        },
      };
}
export function definiteRefundRejection(error: unknown) {
  const code = String((error as { code?: string } | null)?.code ?? "").replace(
    "functions/",
    "",
  );
  return [
    "invalid-argument",
    "permission-denied",
    "unauthenticated",
    "failed-precondition",
    "aborted",
    "already-exists",
  ].includes(code);
}
export function RefundDecisionFields({ action }: { action: string }) {
  return (
    <>
      {action === "confirm" && (
        <label>
          <span className="formLabelText">
            Mã giao dịch ngân hàng{" "}
            <span className="requiredMark" aria-hidden="true">
              *
            </span>
          </span>
          <input name="bank" minLength={4} maxLength={120} required />
        </label>
      )}
      <label>
        <span className="formLabelText">
          {action === "cancel" ? "Lý do hủy" : "Bằng chứng đối soát"}{" "}
          <span className="requiredMark" aria-hidden="true">
            *
          </span>
        </span>
        <textarea name="evidence" minLength={5} maxLength={500} required />
      </label>
    </>
  );
}
function RefundForm({
  row,
  onChanged,
}: {
  row: Refund;
  onChanged: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [action, setAction] = useState("confirm"),
    [uncertain, setUncertain] = useState(false);
  const pending = useRef<ReturnType<typeof refundDecision> | null>(null);
  const sending = useRef(false),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  async function execute(form?: FormData) {
    if (sending.current || (!pending.current && !form)) return;
    sending.current = true;
    setBusy(true);
    setError("");
    let confirmed = false;
    try {
      if (!pending.current) {
        const current = await callService<{ order: Order }>("orderHistory", {
          orderId: row.orderId,
        });
        if (!mounted.current) return;
        pending.current = refundDecision(
          form!,
          row,
          current.order.version,
          crypto.randomUUID(),
        );
      }
      const attempt = pending.current;
      if (attempt.action === "cancel")
        await callService("refundCommand", attempt);
      else
        await sendCommand(
          "refund",
          attempt.payload,
          row.orderId,
          attempt.expectedVersion,
          attempt.operationId,
        );
      confirmed = true;
      pending.current = null;
      if (mounted.current) setUncertain(false);
      await onChanged();
    } catch (e) {
      if (!mounted.current) return;
      if (confirmed) {
        setError("Đã ghi nhận quyết định. Tải lại để xem trạng thái mới nhất.");
        return;
      }
      const unknown = !!pending.current && !definiteRefundRejection(e);
      if (!unknown) pending.current = null;
      setUncertain(unknown);
      setError(
        unknown
          ? "Chưa xác nhận được kết quả. Thử lại đúng quyết định đã gửi; nội dung và mã thao tác được giữ nguyên."
          : "Chưa xử lý được. Kiểm tra quyền, giao dịch thực tế và phiên bản đơn trước khi tiếp tục.",
      );
    } finally {
      sending.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (uncertain) return;
    await execute(new FormData(event.currentTarget));
  }
  return (
    <article className="crmItem">
      <div className="crmItemMain">
        <h2 className="crmItemTitle">
          <CrmIcon name="document" /> Yêu cầu hoàn tiền
        </h2>
        <Link to={`/crm/orders?order=${encodeURIComponent(row.orderId)}`}>
          <CrmIcon name="arrow" /> Mở đơn
        </Link>
      </div>
      <div className="crmItemMeta">
        <CrmReference label="Mã đơn" value={row.orderId} />
        <CrmReference label="Mã yêu cầu" value={row.id} />
      </div>
      <dl className="crmFacts">
        <div>
          <dt>Số tiền yêu cầu</dt>
          <dd>{row.amount.toLocaleString("vi-VN")} ₫</dd>
        </div>
        <div>
          <dt>Trạng thái</dt>
          <dd>
            {row.state === "pending"
              ? "Chờ hoàn · tiền chưa được xác nhận ra"
              : row.state === "confirmed"
                ? "Đã xác nhận tiền ra"
                : row.state === "cancelled"
                  ? "Đã hủy yêu cầu"
                  : "Cần kiểm tra trạng thái"}
          </dd>
        </div>
      </dl>
      <dl className="crmFacts">
        <div>
          <dt>Lý do</dt>
          <dd>{row.reason}</dd>
        </div>
      </dl>
      {row.state === "pending" && (
        <details className="crmItemDetails" name="crm-refund-decisions">
          <summary>
            <CrmIcon name="check" /> Xử lý yêu cầu
          </summary>
          <StepForm
            steps={["Quyết định", "Giao dịch & bằng chứng", "Kiểm tra"]}
            disabled={busy || uncertain}
            resetKey={action}
            className="form"
            onSubmit={(e) => void submit(e)}
          >
            <fieldset className="form" disabled={busy || uncertain}>
              <StepStage index={0}>
                <label>
                  Thao tác
                  <select
                    name="action"
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                  >
                    <option value="confirm">Xác nhận giao dịch tiền ra</option>
                    <option value="cancel">
                      Hủy yêu cầu, giải phóng tiền đã dành
                    </option>
                  </select>
                </label>
              </StepStage>
              <StepStage index={1}>
                <RefundDecisionFields action={action} />
              </StepStage>
              <StepStage index={2}>
                <button className="primary" disabled={busy}>
                  {busy
                    ? "Đang xử lý…"
                    : action === "cancel"
                      ? "Hủy yêu cầu hoàn tiền"
                      : "Xác nhận tiền đã hoàn"}
                </button>
              </StepStage>
            </fieldset>
            {uncertain && (
              <button
                type="button"
                className="primary"
                disabled={busy}
                onClick={() => void execute()}
              >
                {busy ? "Đang kiểm tra…" : "Thử lại quyết định đã gửi"}
              </button>
            )}
          </StepForm>
        </details>
      )}
      {error && <CrmState kind="error" title={error} />}
    </article>
  );
}

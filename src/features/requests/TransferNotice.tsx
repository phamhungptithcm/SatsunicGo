import { notify } from "../../shared/feedback";
import { useState, type FormEvent } from "react";
import { sendCommand } from "../../shared/firebase";
import type { Order } from "../../../packages/domain";
export function TransferNotice({ order }: { order: Order }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [sent, setSent] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await sendCommand(
        "transferReview",
        {
          reference: String(form.get("reference")),
          amount: Number(form.get("amount")),
        },
        order.id,
        order.version,
      );
      setSent(true);
      notify(
        "Đã gửi thông báo chuyển khoản. Đang chờ nhân viên đối soát.",
        "info",
      );
    } catch {
      setError("Chưa gửi được. Tải lại đơn để kiểm tra phiên bản rồi thử lại.");
    } finally {
      setBusy(false);
    }
  }
  if (!order.acceptedAt || order.stage === "CANCELLED") return null;
  return (
    <details className="transferNotice">
      <summary>Báo đã chuyển khoản</summary>
      <p>
        Chỉ chuyển tới tài khoản đã được nhân viên xác nhận. Thông báo này chưa
        xác nhận tiền đã vào tài khoản; nhân viên đối soát trước khi ghi nhận.
      </p>
      {sent ? (
        <p role="status">
          Đã gửi thông báo. Đang chờ đối soát; số tiền đã thu chưa thay đổi.
        </p>
      ) : (
        <form className="form" onSubmit={(e) => void submit(e)}>
          <label>
            <span className="formLabelText">
              Mã giao dịch ngân hàng{" "}
              <span className="requiredMark" aria-hidden="true">
                *
              </span>
            </span>
            <input
              name="reference"
              minLength={3}
              maxLength={100}
              required
              autoComplete="off"
            />
          </label>
          <label>
            <span className="formLabelText">
              Số tiền đã chuyển (₫){" "}
              <span className="requiredMark" aria-hidden="true">
                *
              </span>
            </span>
            <input
              name="amount"
              type="number"
              min={1}
              max={1000000000000}
              step={1}
              required
            />
          </label>
          <button disabled={busy}>
            {busy ? "Đang gửi…" : "Gửi thông báo chuyển khoản"}
          </button>
        </form>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </details>
  );
}

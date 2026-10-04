import { useEffect, useState, type FormEvent } from "react";
import type { Order } from "../../../packages/domain";
import { callService, sendCommand } from "../../shared/firebase";
type Invoice = {
  id: string;
  ownerId: string;
  amount: number;
  state: string;
  planSnapshot: { name: string };
};
type TransferReview = {
  id: string;
  orderId: string;
  amount: number;
  reference: string;
  status: string;
};
export function Finance() {
  const [reviews, setReviews] = useState<TransferReview[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]),
    [exceptions, setExceptions] = useState<
      { id: string; amount: number; state: string; reason: string }[]
    >([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function load() {
    try {
      const [i, e, t] = await Promise.all([
        callService<{ rows: Invoice[] }>("listWork", {
          kind: "membershipInvoices",
        }),
        callService<{ rows: typeof exceptions }>("listWork", {
          kind: "paymentExceptions",
        }),
        callService<{ rows: TransferReview[] }>("listWork", {
          kind: "transferReviews",
        }),
      ]);
      setReviews(t.rows);
      setInvoices(i.rows);
      setExceptions(e.rows);
    } catch {
      setError("Chưa tải được hàng đợi tài chính.");
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function confirm(e: FormEvent<HTMLFormElement>, invoice: Invoice) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      await callService("membershipCommand", {
        action: "confirm",
        operationId: crypto.randomUUID(),
        invoiceId: invoice.id,
        amount: invoice.amount,
        bankTransactionId: String(f.get("reference")),
        evidence: String(f.get("evidence")),
      });
      await load();
    } catch {
      setError(
        "Chưa xác nhận được. Kiểm tra giao dịch, bằng chứng và xác thực hai lớp gần đây.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <h2>Đối soát membership và ngoại lệ thanh toán</h2>
      <p>
        Tiền membership được phân bổ cho hóa đơn gói riêng, không thanh toán số
        dư đơn mua hộ. Chỉ xác nhận khi đã đối chiếu tiền vào tài khoản doanh
        nghiệp.
      </p>
      <button disabled={busy} onClick={() => void load()}>
        Tải lại tài chính
      </button>
      {reviews
        .filter((r) => r.status === "pending")
        .map((r) => (
          <TransferReviewForm key={r.id} review={r} onChanged={load} />
        ))}
      {invoices.map((i) => (
        <article className="panel order" key={i.id}>
          <h3>
            {i.planSnapshot?.name} · {i.id}
          </h3>
          <p>
            {i.amount.toLocaleString("vi-VN")} ₫ ·{" "}
            {i.state === "paid" ? "Đã xác nhận tiền" : "Chờ xác nhận tiền"}
          </p>
          {i.state === "pending" && (
            <form className="form" onSubmit={(e) => void confirm(e, i)}>
              <label>
                Mã giao dịch ngân hàng
                <input
                  name="reference"
                  minLength={4}
                  maxLength={120}
                  required
                />
              </label>
              <label>
                Bằng chứng đối soát
                <textarea
                  name="evidence"
                  minLength={5}
                  maxLength={1000}
                  required
                />
              </label>
              <button disabled={busy}>
                Xác nhận tiền vào và kích hoạt gói
              </button>
            </form>
          )}
        </article>
      ))}
      {exceptions.map((e) => (
        <article className="panel order" key={e.id}>
          <h3>Ngoại lệ {e.id}</h3>
          <p>{e.amount.toLocaleString("vi-VN")} ₫ · cần kiểm tra thủ công</p>
          <p>
            Giao dịch chưa khớp đủ ngữ cảnh đơn và tài khoản nhận. Không tự ghi
            nhận tiền.
          </p>
        </article>
      ))}
      {!invoices.length && !exceptions.length && (
        <p>Chưa có bản ghi trong trang hiện tại.</p>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </section>
  );
}

function TransferReviewForm({
  review,
  onChanged,
}: {
  review: TransferReview;
  onChanged: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(event.currentTarget);
    try {
      const current = await callService<{ order: Order }>("orderHistory", {
        orderId: review.orderId,
      });
      await sendCommand(
        "verifyTransfer",
        {
          amount: review.amount,
          bankTransactionId: String(f.get("bank")),
          evidence: String(f.get("evidence")),
          reason: "Đối soát thông báo chuyển khoản của khách",
          reviewId: review.id,
        },
        review.orderId,
        current.order.version,
      );
      await onChanged();
    } catch {
      setError(
        "Chưa xác minh được. Kiểm tra giao dịch thực tế, số tiền, phiên bản và xác thực hai lớp gần đây.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="panel order">
      <h3>Chờ đối soát · đơn {review.orderId}</h3>
      <p>
        Khách thông báo {review.amount.toLocaleString("vi-VN")} ₫ · nội dung{" "}
        {review.reference}. Thông báo chưa phải tiền đã xác nhận.
      </p>
      <form className="form" onSubmit={(e) => void verify(e)}>
        <label>
          Mã giao dịch trên tài khoản ngân hàng doanh nghiệp
          <input name="bank" minLength={4} maxLength={120} required />
        </label>
        <label>
          Bằng chứng đã đối chiếu đúng tài khoản, đơn và số tiền
          <textarea name="evidence" minLength={5} maxLength={1000} required />
        </label>
        <button disabled={busy}>Xác nhận tiền vào và đóng thông báo này</button>
      </form>
      {error && <p role="alert">{error}</p>}
    </article>
  );
}

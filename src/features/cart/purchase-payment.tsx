import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { User } from "firebase/auth";
import type { PurchaseCheckout } from "../../../packages/domain/purchase-checkout";
import { callService } from "../../shared/firebase";
import { LoadingState } from "../../shared/Loading";
import { useCart } from "./cart-store";
import { PurchaseJourney } from "./purchase-checkout";
import { PurchaseCompletion } from "./purchase-completion";
import "./purchase-checkout.css";
const money = (n: number) => `${n.toLocaleString("vi-VN")} ₫`;
type Receipt = {
  state: string;
  emailState?: string;
  mime?: string;
  base64?: string;
};
export function PurchasePayment({
  user,
  signIn,
}: {
  user: User | null;
  signIn: () => void;
}) {
  const { id } = useParams(),
    { refresh } = useCart();
  const [checkout, setCheckout] = useState<PurchaseCheckout | null>(null),
    [receipt, setReceipt] = useState<Receipt | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const flight = useRef(false),
    generation = useRef(0);
  async function read() {
    const gen = generation.current;
    try {
      const c = await callService<PurchaseCheckout>("purchaseCheckout", {
        action: "status",
        id,
      });
      if (gen === generation.current) {
        setCheckout(c);
        setError("");
      }
    } catch {
      if (gen === generation.current)
        setError(
          "Chưa kiểm tra được lượt thanh toán. Tải lại để tiếp tục với cùng mã.",
        );
    }
  }
  useEffect(() => {
    setCheckout(null);
    setReceipt(null);
    setError("");
    setBusy(false);
    void read();
    return () => {
      generation.current++;
    };
  }, [id, user?.uid]);
  useEffect(() => {
    if (checkout?.state !== "paid" || !checkout.receiptId) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let polls = 0;
    const load = async () => {
      try {
        const r = await callService<Receipt>("purchaseReceipt", {
          id: checkout.receiptId,
          download: false,
        });
        if (active) {
          setReceipt(r);
          if (r.state === "queued" || r.state === "processing") {
            if (++polls < 12) timer = setTimeout(() => void load(), 3000);
          }
        }
      } catch {
        if (active)
          setError("Chưa kiểm tra được chứng từ. Bạn có thể thử tải lại PDF.");
      }
    };
    void load();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [checkout?.state, checkout?.receiptId]);
  async function simulate(outcome: "paid" | "unknown" | "cancelled") {
    if (flight.current || !checkout) return;
    flight.current = true;
    setBusy(true);
    setError("");
    const gen = generation.current;
    try {
      await callService("purchaseDemoPayment", { id: checkout.id, outcome });
      if (gen === generation.current) {
        await read();
        await refresh();
      }
    } catch {
      if (gen === generation.current) {
        setError(
          "Chưa xác nhận được kết quả. Kiểm tra lại cùng lượt thanh toán.",
        );
        await read();
      }
    } finally {
      flight.current = false;
      if (gen === generation.current) setBusy(false);
    }
  }
  async function download() {
    if (flight.current || !checkout?.receiptId) return;
    flight.current = true;
    setBusy(true);
    setError("");
    const gen = generation.current;
    try {
      const r = await callService<Receipt>("purchaseReceipt", {
        id: checkout.receiptId,
        download: true,
      });
      if (gen !== generation.current) return;
      if (!r.base64) {
        setReceipt(r);
        setError(
          r.state === "failed"
            ? "Chứng từ cần được vận hành xử lý lại. Khoản thanh toán vẫn đã ghi nhận."
            : "Chứng từ đang xử lý. Thử tải lại sau.",
        );
        return;
      }
      const bytes = Uint8Array.from(atob(r.base64), (c) => c.charCodeAt(0)),
        url = URL.createObjectURL(
          new Blob([bytes], { type: "application/pdf" }),
        ),
        a = document.createElement("a");
      a.href = url;
      a.download = `SatsunicGo-${checkout.receiptId}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setReceipt(r);
    } catch {
      if (gen === generation.current)
        setError(
          "Chưa tải được chứng từ PDF. Kiểm tra tài khoản và thử lại sau.",
        );
    } finally {
      flight.current = false;
      if (gen === generation.current) setBusy(false);
    }
  }
  if (!user)
    return (
      <section className="page purchaseCheckout">
        <h1>Thanh toán</h1>
        <button className="primary" onClick={signIn}>
          Đăng nhập để tiếp tục
        </button>
      </section>
    );
  return (
    <section className="page purchaseCheckout purchasePayment">
      <Link
        to={
          checkout?.sourceOrderId
            ? `/account/orders/${checkout.sourceOrderId}`
            : "/cart"
        }
        className="purchaseBack"
      >
        {checkout?.purpose === "balance" ? "← Đơn hàng" : "← Giỏ hàng"}
      </Link>
      {checkout?.state !== "paid" && (
        <>
          <header className="purchaseHeader">
            <h1>Thanh toán đơn hàng</h1>
            <p>Tiếp tục với đúng lượt thanh toán này để kiểm tra kết quả.</p>
          </header>
          <PurchaseJourney current={3} />
        </>
      )}
      {error && checkout?.state !== "paid" && (
        <div className="purchaseError" role="alert">
          {error}
        </div>
      )}
      {!checkout ? (
        <>
          <LoadingState>Đang kiểm tra thanh toán…</LoadingState>
          <button disabled={busy} onClick={() => void read()}>
            Kiểm tra lại
          </button>
        </>
      ) : checkout.state === "paid" ? (
        <PurchaseCompletion
          checkout={checkout}
          receiptState={receipt?.state}
          busy={busy}
          error={error}
          onDownload={() => void download()}
        />
      ) : (
        <div className="purchaseCard">
          <p className="purchaseHint">
            {checkout.purpose === "balance"
              ? "Thanh toán thêm"
              : "Thanh toán ban đầu"}{" "}
            · mã {checkout.id}
          </p>
          <div className="purchaseTotal">
            <p>{money(checkout.total)}</p>
          </div>
          <ul>
            {checkout.lines.map((l) => (
              <li key={l.lineId}>
                {l.name} · {l.quantity} món · {money(l.total)}
              </li>
            ))}
          </ul>
          {checkout.state === "cancelled" ? (
            <>
              <p role="status">
                {checkout.purpose === "balance"
                  ? "Lượt trả thêm đã hủy. Khoản còn thiếu vẫn được giữ trong đơn."
                  : "Lượt thanh toán đã hủy. Các món vẫn ở trong giỏ."}
              </p>
              <Link
                to={
                  checkout.sourceOrderId
                    ? `/account/orders/${checkout.sourceOrderId}`
                    : "/cart"
                }
              >
                {checkout.purpose === "balance"
                  ? "Quay lại đơn hàng"
                  : "Quay lại giỏ hàng"}
              </Link>
            </>
          ) : checkout.state === "review_required" ? (
            <p role="alert">
              Khoản tiền cần đối chiếu trước khi phân bổ. Giữ mã thanh toán này
              và liên hệ hỗ trợ; không trả lại khoản này.
            </p>
          ) : (
            <>
              <p role="status">
                {checkout.state === "unknown"
                  ? checkout.purpose === "balance"
                    ? "Kết quả chưa rõ. Khoản trả thêm được giữ để đối chiếu cùng lượt; không tạo khoản khác."
                    : "Kết quả chưa rõ. Giỏ được giữ để đối chiếu cùng lượt; không tạo khoản khác."
                  : "Đang chờ thanh toán."}
              </p>
              {checkout.provider === "demo" && (
                <>
                  <p className="purchaseHint">
                    Thanh toán demo trên môi trường thử, không thu tiền thật.
                    PayOS sẽ được tích hợp sau.
                  </p>
                  <div className="purchaseActions">
                    <button
                      className="primary"
                      disabled={busy}
                      onClick={() => void simulate("paid")}
                    >
                      {busy
                        ? "Đang kiểm tra…"
                        : checkout.state === "unknown"
                          ? "Demo: xác minh đã thanh toán"
                          : "Demo: thanh toán thành công"}
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => void simulate("unknown")}
                    >
                      Demo: chưa rõ kết quả
                    </button>
                    {checkout.state === "pending" && (
                      <button
                        disabled={busy}
                        onClick={() => void simulate("cancelled")}
                      >
                        Hủy lượt này
                      </button>
                    )}
                  </div>
                </>
              )}
              <button disabled={busy} onClick={() => void read()}>
                Kiểm tra lại trạng thái
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}

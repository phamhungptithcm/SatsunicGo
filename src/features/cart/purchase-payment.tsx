import { useEffect, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import type { User } from "firebase/auth";
import type { PurchaseCheckout } from "../../../packages/domain/purchase-checkout";
import { callService } from "../../shared/firebase";
import { LoadingState } from "../../shared/Loading";
import { useCart } from "./cart-store";
import { PurchaseJourney } from "./purchase-checkout";
import { PurchaseGateway } from "./purchase-gateway";
import { admitSePayForm } from "../../../packages/domain/purchase-sepay";
import type { DemoPaymentLink } from "../../../packages/domain/purchase-provider";
import { PurchaseCompletion } from "./purchase-completion";
import { PurchaseSignIn } from "./purchase-sign-in";
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
    navigate = useNavigate(),
    [params] = useSearchParams(),
    gateway = params.get("gateway"),
    { refresh } = useCart();
  const [checkout, setCheckout] = useState<PurchaseCheckout | null>(null),
    [receipt, setReceipt] = useState<Receipt | null>(null),
    [busy, setBusy] = useState(false),
    [checking, setChecking] = useState(false),
    [error, setError] = useState("");
  const checkingFlight = useRef<number | null>(null);
  const flight = useRef(false),
    generation = useRef(0);
  async function read() {
    const gen = generation.current;
    if (checkingFlight.current === gen) return;
    checkingFlight.current = gen;
    setChecking(true);
    try {
      let c = await callService<PurchaseCheckout>("purchaseCheckout", {
        action: "status",
        id,
      });
      if (gen !== generation.current) return;
      setCheckout(c); // Keep the owned checkout visible during a provider outage.
      if (
        (c.demoPaymentLinkId ||
          (c.provider === "sepay_sandbox" && c.sepayInvoice)) &&
        ["pending", "unknown"].includes(c.state)
      ) {
        await callService(
          c.provider === "sepay_sandbox"
            ? "purchaseSePayPayment"
            : "purchaseDemoPayment",
          { action: "reconcile", id },
        );
        if (gen !== generation.current) return;
        c = await callService<PurchaseCheckout>("purchaseCheckout", {
          action: "status",
          id,
        });
      }
      if (gen === generation.current) {
        setCheckout(c);
        if (c.state === "paid" || c.state === "cancelled") void refresh();
        setError("");
      }
    } catch {
      if (gen === generation.current)
        setError("Chưa cập nhật được thanh toán. Thử kiểm tra lại.");
    } finally {
      if (checkingFlight.current === gen) checkingFlight.current = null;
      if (gen === generation.current) setChecking(false);
    }
  }
  useEffect(() => {
    setCheckout(null);
    setReceipt(null);
    setError("");
    setBusy(false);
    if (user && !gateway) void read();
    return () => {
      generation.current++;
    };
  }, [id, user?.uid, gateway]);
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
  async function openGateway() {
    if (
      flight.current ||
      checkingFlight.current === generation.current ||
      !checkout
    )
      return;
    flight.current = true;
    setBusy(true);
    setError("");
    const gen = generation.current;
    try {
      if (checkout.provider === "sepay_sandbox") {
        const raw = await callService("purchaseSePayPayment", {
          id: checkout.id,
          action: "createCheckout",
        });
        if (gen !== generation.current) return;
        const signed = admitSePayForm(raw, checkout);
        const form = document.createElement("form");
        form.action = signed.action;
        form.method = "POST";
        form.hidden = true;
        for (const [name, value] of signed.fields) {
          const field = document.createElement("input");
          field.type = "hidden";
          field.name = name;
          field.value = value;
          form.append(field);
        }
        document.body.append(form);
        try {
          form.submit();
        } finally {
          form.remove();
        }
        return;
      }
      const link = await callService<DemoPaymentLink>("purchaseDemoPayment", {
        id: checkout.id,
        action: "createLink",
      });
      if (
        gen === generation.current &&
        link.checkoutUrl ===
          `/checkout/payment/${checkout.id}?gateway=${link.paymentLinkId}`
      )
        navigate(link.checkoutUrl);
      else if (gen === generation.current)
        setError("Liên kết thanh toán chưa hợp lệ. Kiểm tra lại cùng lượt.");
    } catch {
      if (gen === generation.current) {
        setError(
          "Chưa mở được thanh toán. Kiểm tra lại cùng lượt trước khi tiếp tục.",
        );
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
        <PurchaseSignIn signIn={signIn} />
      </section>
    );
  if (gateway && id)
    return (
      <PurchaseGateway
        key={`${user.uid}-${id}-${gateway}`}
        id={id}
        linkId={gateway}
      />
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
            <h1>Thanh toán</h1>
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
          <button disabled={busy || checking} onClick={() => void read()}>
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
        <div className="purchaseCard" data-payment-state={checkout.state}>
          <div className="paymentSummary">
            <div className="paymentStatusRow">
              <span className="paymentStatusIcon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {checkout.state === "cancelled" ? (
                    <path d="m8 8 8 8m0-8-8 8" />
                  ) : checkout.state === "review_required" ? (
                    <>
                      <path d="M12 7v6m0 4h.01" />
                      <circle cx="12" cy="12" r="9" />
                    </>
                  ) : (
                    <>
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 2" />
                    </>
                  )}
                </svg>
              </span>
              <h2 aria-live="polite">
                {checkout.state === "cancelled"
                  ? "Đã hủy thanh toán"
                  : checkout.state === "review_required"
                    ? "Cần đối chiếu thanh toán"
                    : checkout.state === "unknown"
                      ? "Chưa xác nhận thanh toán"
                      : "Chờ thanh toán"}
              </h2>
              {["demo", "sepay_sandbox"].includes(checkout.provider) && (
                <span className="paymentTestBadge">
                  Thanh toán thử · Không thu tiền thật
                </span>
              )}
            </div>
            <p className="paymentAmount">{money(checkout.total)}</p>
            <ul className="paymentProducts">
              {checkout.lines.map((l) => (
                <li key={l.lineId}>
                  <span>
                    {l.name} × {l.quantity}
                  </span>
                  <span>{money(l.total)}</span>
                </li>
              ))}
            </ul>
            {checkout.paymentMethod === "BANK_TRANSFER" && (
              <div className="paymentSelectedMethod">
                <span className="paymentMethodGlyph" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  >
                    <path d="M3 3h6v6H3zm12 0h6v6h-6zM3 15h6v6H3zm12 0h3v3h3v3h-6z" />
                  </svg>
                </span>
                <span>QR chuyển khoản ngân hàng</span>
              </div>
            )}
          </div>
          {checkout.state === "cancelled" ? (
            <>
              <p role="status">
                {checkout.purpose === "balance"
                  ? "Khoản còn thiếu vẫn được giữ trong đơn."
                  : "Các món vẫn ở trong giỏ."}
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
              {checkout.receivedAmount !== undefined
                ? `Đã nhận ${money(checkout.receivedAmount)}. `
                : ""}
              Liên hệ hỗ trợ để đối chiếu. Không thanh toán lại.
            </p>
          ) : (
            <>
              {checkout.state === "unknown" && (
                <p className="paymentNote">
                  Không thanh toán lại khi chưa có kết quả.
                </p>
              )}
              {["demo", "sepay_sandbox"].includes(checkout.provider) && (
                <>
                  {!(
                    checkout.provider === "sepay_sandbox" &&
                    checkout.state === "unknown"
                  ) && (
                    <div className="purchaseActions">
                      <button
                        className="primary"
                        disabled={busy || checking}
                        onClick={() => void openGateway()}
                      >
                        {busy
                          ? "Đang mở thanh toán…"
                          : checkout.state === "unknown"
                            ? "Mở thanh toán thử"
                            : "Thanh toán"}
                      </button>
                    </div>
                  )}
                </>
              )}
              <div className="purchaseActions">
                <button
                  className={
                    checkout.state === "unknown" ? "primary" : undefined
                  }
                  disabled={busy || checking}
                  aria-busy={checking}
                  onClick={() => void read()}
                >
                  {checking ? "Đang kiểm tra…" : "Kiểm tra thanh toán"}
                </button>
              </div>
            </>
          )}
          <details className="paymentDetails">
            <summary>Chi tiết thanh toán</summary>
            <p>
              {checkout.purpose === "balance"
                ? "Thanh toán thêm"
                : "Thanh toán đơn hàng"}
            </p>
            <dl>
              <dt>Mã thanh toán</dt>
              <dd>{checkout.id}</dd>
            </dl>
            <Link to="/support">Liên hệ hỗ trợ</Link>
          </details>
        </div>
      )}
    </section>
  );
}

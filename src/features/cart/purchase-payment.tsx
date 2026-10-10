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
    [error, setError] = useState("");
  const flight = useRef(false),
    generation = useRef(0);
  async function read() {
    const gen = generation.current;
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
    if (flight.current || !checkout) return;
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
              {checkout.receivedAmount !== undefined
                ? `Đã nhận ${money(checkout.receivedAmount)}. `
                : ""}
              Khoản tiền cần đối chiếu trước khi phân bổ. Giữ mã thanh toán này
              và liên hệ hỗ trợ; không thanh toán lại khoản này.
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
              {["demo", "sepay_sandbox"].includes(checkout.provider) && (
                <>
                  <p className="purchaseHint">
                    {checkout.provider === "sepay_sandbox"
                      ? "QR chuyển khoản qua SePay sandbox. Đây là thanh toán thử, không thu tiền thật."
                      : "Thanh toán demo trên môi trường thử, không thu tiền thật."}
                  </p>
                  <div className="purchaseActions">
                    <button
                      className="primary"
                      disabled={busy}
                      onClick={() =>
                        checkout.provider === "sepay_sandbox" &&
                        checkout.state === "unknown"
                          ? void read()
                          : void openGateway()
                      }
                    >
                      {busy
                        ? "Đang mở thanh toán…"
                        : checkout.state === "unknown"
                          ? "Tiếp tục kiểm tra thanh toán"
                          : "Tiếp tục thanh toán"}
                    </button>
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

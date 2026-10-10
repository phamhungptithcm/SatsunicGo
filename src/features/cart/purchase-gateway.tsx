import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { DemoPaymentLink } from "../../../packages/domain/purchase-provider";
import { callService } from "../../shared/firebase";

export function PurchaseGateway({
  id,
  linkId,
}: {
  id: string;
  linkId: string;
}) {
  const navigate = useNavigate(),
    [link, setLink] = useState<DemoPaymentLink | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    flight = useRef(false);
  const generation = useRef(0);
  useEffect(() => {
    const gen = generation.current;
    setLink(null);
    setError("");
    setBusy(false);
    void callService<DemoPaymentLink>("purchaseDemoPayment", {
      action: "linkStatus",
      id,
    })
      .then((value) => {
        if (gen !== generation.current) return;
        if (value.paymentLinkId !== linkId) {
          setError("Liên kết chưa khớp lượt thanh toán. Quay lại để kiểm tra.");
          return;
        }
        setLink(value);
      })
      .catch(() => {
        if (gen === generation.current)
          setError(
            "Chưa mở được liên kết. Quay lại để kiểm tra cùng lượt thanh toán.",
          );
      });
    return () => {
      generation.current++;
    };
  }, [id, linkId]);
  async function act(
    action:
      | "pay"
      | "cancel"
      | "loseResponse"
      | "payWithoutWebhook"
      | "underpay"
      | "overpay"
      | "decline",
  ) {
    if (flight.current || !link) return;
    flight.current = true;
    setBusy(true);
    setError("");
    const gen = generation.current;
    try {
      const result = await callService<DemoPaymentLink>("purchaseDemoPayment", {
        id,
        action,
      });
      if (gen !== generation.current) return;
      setLink(result);
      if (action !== "loseResponse")
        navigate(`/checkout/payment/${id}?returned=1`, { replace: true });
    } catch {
      if (gen === generation.current)
        setError(
          "Chưa xác nhận được kết quả. Quay lại để kiểm tra cùng lượt; không thanh toán lần khác.",
        );
    } finally {
      flight.current = false;
      if (gen === generation.current) setBusy(false);
    }
  }
  return (
    <section className="page purchaseCheckout purchaseGateway">
      <div className="purchaseCard">
        <span className="purchaseGatewayBrand">SatsunicGo</span>
        <h1>Thanh toán đơn hàng</h1>
        <p className="purchaseHint">
          Cổng thanh toán demo · không thu tiền thật
        </p>
        {error && (
          <p className="purchaseError" role="alert">
            {error}
          </p>
        )}
        {!link ? (
          <p role="status">
            {error
              ? "Chưa tải được thông tin thanh toán."
              : "Đang mở liên kết thanh toán…"}
          </p>
        ) : (
          <>
            <p className="purchaseGatewayAmount">
              {link.amount.toLocaleString("vi-VN")} ₫
            </p>
            <p className="purchaseHint">Mã thanh toán {link.orderCode}</p>
            <p role="status">
              {link.status === "PAID"
                ? "Kênh demo đã nhận thanh toán. Quay lại để kiểm tra đơn."
                : link.status === "PROCESSING"
                  ? "Kết quả đang được đối chiếu. Giữ nguyên lượt thanh toán này."
                  : link.status === "UNDERPAID"
                    ? "Số tiền chuyển chưa đủ. Quay lại để đối chiếu; không chuyển thêm trong lượt này."
                    : link.status === "FAILED"
                      ? "Thanh toán chưa thành công. Quay lại để kiểm tra đơn."
                      : link.status === "CANCELLED"
                        ? "Liên kết đã hủy."
                        : link.status === "EXPIRED"
                          ? "Liên kết đã hết hạn."
                          : "Đang chờ thanh toán."}
            </p>
            {["PENDING", "PROCESSING"].includes(link.status) && (
              <>
                <button
                  className="primary"
                  disabled={busy}
                  onClick={() => void act("pay")}
                >
                  {busy ? "Đang kiểm tra…" : "Xác nhận thanh toán demo"}
                </button>
                {link.status === "PENDING" && (
                  <button disabled={busy} onClick={() => void act("cancel")}>
                    Hủy thanh toán
                  </button>
                )}
                <details className="purchaseGatewayScenarios">
                  <summary>Thử tình huống thanh toán</summary>
                  <button
                    disabled={busy || link.status !== "PENDING"}
                    onClick={() => void act("loseResponse")}
                  >
                    Mất phản hồi
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => void act("payWithoutWebhook")}
                  >
                    Đã trả tiền, thông báo đến chậm
                  </button>
                  <button
                    disabled={busy || link.status !== "PENDING"}
                    onClick={() => void act("underpay")}
                  >
                    Chuyển thiếu 1 ₫
                  </button>
                  <button
                    disabled={busy || link.status !== "PENDING"}
                    onClick={() => void act("overpay")}
                  >
                    Chuyển thừa 1 ₫
                  </button>
                  <button
                    disabled={busy || link.status !== "PENDING"}
                    onClick={() => void act("decline")}
                  >
                    Thanh toán thất bại
                  </button>
                </details>
              </>
            )}
          </>
        )}
        <Link to={`/checkout/payment/${id}?returned=1`}>
          Quay lại kiểm tra đơn hàng
        </Link>
      </div>
    </section>
  );
}

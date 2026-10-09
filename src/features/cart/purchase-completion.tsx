import { Link } from "react-router-dom";
import type { PurchaseCheckout } from "../../../packages/domain/purchase-checkout";

export function PurchaseCompletion({
  checkout,
  receiptState,
  busy,
  error,
  onDownload,
}: {
  checkout: PurchaseCheckout;
  receiptState?: string;
  busy: boolean;
  error: string;
  onDownload: () => void;
}) {
  const orderIds = [...new Set(checkout.lines.map((line) => line.orderId))];
  return (
    <div className="purchaseCard purchaseComplete">
      <div className="purchaseCompleteCheck" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path
            d="m5 12 4.5 4.5L19 7"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div role="status" className="purchaseCompleteStatus">
        <h1>Thanh toán thành công</h1>
        <p>{checkout.total.toLocaleString("vi-VN")} ₫</p>
      </div>
      <ul
        className="purchaseCompleteOrders"
        aria-label="Đơn hàng đã thanh toán"
      >
        {checkout.lines.map((line) => (
          <li key={line.lineId}>
            <Link
              to={`/account/orders/${line.orderId}`}
              aria-label={`Mở đơn hàng ${line.orderId}`}
              title={`Mã đơn ${line.orderId}`}
            >
              #{line.orderId}
            </Link>
            <span>
              {checkout.purpose === "balance"
                ? line.name.replace(/^Bổ sung chi phí · /, "")
                : line.name}
              {" · "}
              {line.quantity} sản phẩm
            </span>
          </li>
        ))}
      </ul>
      <div className="purchaseCompleteActions">
        <button
          type="button"
          className="purchaseDownloadButton"
          aria-label="Tải chứng từ PDF"
          title={busy ? "Đang tải chứng từ…" : "Tải chứng từ PDF"}
          aria-busy={busy}
          disabled={busy}
          onClick={onDownload}
        >
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M13 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9l-6-6Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M13 3v6h6M12 12v6m-3-3 3 3 3-3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <Link
          className="primary purchaseCompleteView"
          to={
            orderIds.length === 1
              ? `/account/orders/${orderIds[0]}`
              : "/account"
          }
        >
          Xem đơn hàng
        </Link>
      </div>
      {receiptState !== "ready" && !error && (
        <p className="purchaseCompleteNotice" role="status">
          {receiptState === "failed"
            ? "Chứng từ chưa tạo được. Khoản thanh toán vẫn đã ghi nhận."
            : "Đang tạo chứng từ. Bạn có thể tải lại sau."}
          {receiptState === "failed" && (
            <>
              {" "}
              <Link to="/support">Liên hệ hỗ trợ</Link>.
            </>
          )}
        </p>
      )}
      {error && (
        <p className="purchaseCompleteNotice" role="alert">
          {error}
          {receiptState === "failed" && (
            <>
              {" "}
              <Link to="/support">Liên hệ hỗ trợ</Link>.
            </>
          )}
        </p>
      )}
    </div>
  );
}

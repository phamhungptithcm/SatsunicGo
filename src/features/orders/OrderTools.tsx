import { LoadingState } from "../../shared/Loading";
import { OrderImages } from "./OrderImages";
import { useState } from "react";
import { Link } from "react-router-dom";
import { callService } from "../../shared/firebase";
import {
  csvCell,
  paymentPurpose,
  paymentDue,
  type Order,
} from "../../../packages/domain";
type History = {
  timeline: { id: string; action: string; createdAt: number }[];
  entries: { id: string; kind: string; amount: number; createdAt: number }[];
};
const labels: Record<string, string> = {
  catalogCheckout: "Đặt mua sản phẩm niêm yết",
  submitRequest: "Gửi yêu cầu",
  issueQuote: "Gửi báo giá",
  acceptQuote: "Chấp nhận báo giá",
  verifyTransfer: "Xác nhận tiền vào",
  refund: "Ghi nhận hoàn tiền",
  claimPurchase: "Nhận việc mua hàng",
  recordPurchase: "Ghi nhận đã mua",
  receive: "Kiểm hàng tại kho",
  pack: "Hoàn tất đóng gói",
  finalize: "Chốt chi phí cuối",
  approveFinal: "Duyệt chi phí cuối",
  dispatch: "Bàn giao xuất gửi",
  track: "Cập nhật vận chuyển",
  hold: "Cập nhật tạm giữ",
  cancelRequest: "Hủy yêu cầu",
  transferReview: "Gửi thông báo chuyển khoản",
};
export function OrderTools({
  order,
  showImages = true,
  section = "all",
}: {
  order: Order;
  showImages?: boolean;
  section?: "all" | "actions" | "files" | "history";
}) {
  const [history, setHistory] = useState<History | null>(null),
    [error, setError] = useState(""),
    [historyLoading, setHistoryLoading] = useState(false),
    [busy, setBusy] = useState(false),
    [checkout, setCheckout] = useState("");
  async function load() {
    if (historyLoading) return;
    setHistoryLoading(true);
    setError("");
    try {
      setHistory(
        await callService<History>("orderHistory", { orderId: order.id }),
      );
    } catch {
      setError("Chưa tải được lịch sử đơn.");
    } finally {
      setHistoryLoading(false);
    }
  }
  function download() {
    const text =
        "name,url,quantity,variant\r\n" +
        order.items
          .map((i) =>
            [i.name, i.url ?? "", String(i.quantity), i.variant]
              .map(csvCell)
              .join(","),
          )
          .join("\r\n"),
      url = URL.createObjectURL(
        new Blob([text], { type: "text/csv;charset=utf-8" }),
      ),
      link = document.createElement("a");
    link.href = url;
    link.download = `order-${order.id}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function payment() {
    setBusy(true);
    setError("");
    try {
      const r = await callService<{ checkoutUrl: string }>(
        "createPaymentLink",
        {
          orderId: order.id,
          purpose: paymentPurpose(order),
          operationId: crypto.randomUUID(),
        },
      );
      const u = new URL(r.checkoutUrl);
      if (u.protocol !== "https:") throw Error("INVALID_LINK");
      setCheckout(u.href);
    } catch {
      setError(
        "Chưa tạo được link payOS. Kênh này cần được cấu hình và xác minh; đơn chưa được ghi nhận thêm tiền.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="orderTools">
      {showImages && (section === "all" || section === "files") && (
        <OrderImages
          key={order.id}
          orderId={order.id}
          expanded={section === "files"}
        />
      )}
      {(section === "all" || section === "actions") && (
        <div className="orderUtilityActions">
          <Link
            to={
              order.purchaseKind === "catalog"
                ? `/products/${order.catalogSnapshot!.slug}/checkout`
                : `/request?reorder=${encodeURIComponent(order.id)}`
            }
          >
            {order.purchaseKind === "catalog"
              ? "Đặt lại sản phẩm"
              : "Đặt lại trong yêu cầu mới"}
          </Link>
          <button onClick={download}>Xuất dòng hàng CSV</button>
        </div>
      )}
      {(section === "all" || section === "history") && (
        <details
          open={section === "history" || undefined}
          onToggle={(e) => {
            if (e.currentTarget.open) void load();
          }}
        >
          <summary>Lịch sử và bảng đối chiếu tiền</summary>
          <p>
            Bảng đối chiếu nội bộ, không phải hóa đơn thuế. Chỉ các khoản đã xác
            nhận mới xuất hiện ở đây.
          </p>
          {historyLoading && <LoadingState overlay={false}>Đang tải lịch sử…</LoadingState>}
          {history?.entries.map((e) => (
            <p key={e.id}>
              {e.kind === "refund"
                ? "Hoàn tiền"
                : e.kind === "reversal"
                  ? "Tiền vào bị đảo"
                  : "Tiền đã xác nhận"}
              : {e.amount.toLocaleString("vi-VN")} ₫ · mã khoản {e.id} ·{" "}
              {new Date(e.createdAt).toLocaleString("vi-VN")}
            </p>
          ))}
          {history?.timeline.map((e) => (
            <p key={e.id}>
              {labels[e.action] ?? "Cập nhật đơn"} ·{" "}
              {new Date(e.createdAt).toLocaleString("vi-VN")}
            </p>
          ))}
          {history && !history.entries.length && (
            <p>Chưa có khoản tiền được xác nhận.</p>
          )}
          <button
            disabled={historyLoading || !history || !!error}
            onClick={() => window.print()}
          >
            In bảng đối chiếu
          </button>
          <Link to={`/account/documents?order=${encodeURIComponent(order.id)}`}>
            Chứng từ đơn hàng
          </Link>
          {error && (
            <button disabled={historyLoading} onClick={() => void load()}>
              Thử tải lại
            </button>
          )}
        </details>
      )}
      {(section === "all" || section === "actions") &&
        order.acceptedAt &&
        order.stage !== "CANCELLED" &&
        paymentDue(order) > 0 && (
          <button disabled={busy} onClick={() => void payment()}>
            Tạo link thanh toán payOS
          </button>
        )}
      {checkout && (
        <p>
          <a href={checkout} target="_blank" rel="noopener noreferrer">
            Mở trang payOS để kiểm tra và thanh toán
          </a>{" "}
          · Đóng trang hoặc quay lại không xác nhận tiền đã thanh toán.
        </p>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </div>
  );
}

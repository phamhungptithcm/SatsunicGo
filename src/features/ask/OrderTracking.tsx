import { Link } from "react-router-dom";
import { DeliveryEstimate } from "../shipping/DeliveryEstimate";
import {
  trackingMilestones,
  trackingStageLabel,
  type CustomerOrderTracking,
} from "../../../packages/domain/order-tracking";

const events: Record<string, [string, string]> = {
  catalogCheckout: [
    "Đã tạo đơn theo giá niêm yết",
    "Order created at the listed price",
  ],
  submitRequest: ["Đã gửi yêu cầu", "Request submitted"],
  issueQuote: ["Đã gửi báo giá", "Quote issued"],
  acceptQuote: ["Đã chấp nhận báo giá", "Quote accepted"],
  verifyTransfer: ["Đã xác minh thanh toán", "Payment verified"],
  claimPurchase: ["Đã nhận việc mua hàng", "Purchase assigned"],
  recordPurchase: ["Đã ghi nhận mua hàng", "Purchase recorded"],
  receive: ["Đã nhận hàng tại kho", "Warehouse receipt recorded"],
  pack: ["Đã ghi nhận đóng gói", "Packing recorded"],
  finalize: ["Đã chốt tổng tiền", "Final total reviewed"],
  approveFinal: ["Đã duyệt tổng cuối", "Final total approved"],
  dispatch: ["Đã xuất gửi", "Dispatched"],
  track: ["Đã cập nhật vận chuyển", "Shipping updated"],
  confirmReceipt: ["Đã xác nhận nhận hàng", "Receipt confirmed"],
  hold: ["Đã cập nhật tạm giữ xử lý", "Processing hold updated"],
  releaseHold: ["Đã gỡ tạm giữ xử lý", "Processing hold released"],
  cancelRequest: ["Đã ghi nhận yêu cầu hủy", "Cancellation request recorded"],
  "change-propose": ["Đã đề xuất thay đổi", "Change proposed"],
  "change-accept": ["Đã chấp nhận thay đổi", "Change accepted"],
  "change-reject": ["Đã từ chối thay đổi", "Change rejected"],
  "change-apply": ["Đã áp dụng thay đổi đã duyệt", "Approved change applied"],
  "refund-confirm": ["Đã xác nhận hoàn tiền", "Refund confirmed"],
  "refund-request": ["Đã yêu cầu hoàn tiền", "Refund requested"],
  "refund-cancel": ["Đã hủy yêu cầu hoàn tiền", "Refund request cancelled"],
  "return-request": ["Đã yêu cầu trả hàng", "Return requested"],
  "return-authorize": ["Đã duyệt trả hàng", "Return authorized"],
  "return-receive": ["Đã ghi nhận nhận hàng trả", "Return receipt recorded"],
  "return-inspect": ["Đã kiểm tra hàng trả", "Returned goods inspected"],
  "return-close": ["Đã đóng xử lý hàng trả", "Return processing closed"],
  resolvePaymentException: [
    "Đã xử lý ngoại lệ thanh toán",
    "Payment exception resolved",
  ],
};
/** Pure projection renderer. The caller owns authentication/request generation. */
export function OrderTracking({
  tracking,
  language = "vi",
}: {
  tracking: CustomerOrderTracking;
  language?: "vi" | "en";
}) {
  const vi = language === "vi",
    steps = trackingMilestones(tracking, language);
  const states = {
    packed: vi ? "Đã đóng gói" : "Packed",
    in_transit: vi ? "Đang vận chuyển" : "In transit",
    delivered: vi ? "Kiện đã giao" : "Parcel delivered",
    failed: vi ? "Giao kiện chưa thành công" : "Parcel delivery failed",
    returned: vi ? "Kiện đã trả lại" : "Parcel returned",
  };
  const date = (value: number) =>
    new Date(value).toLocaleString(vi ? "vi-VN" : "en-US");
  return (
    <section
      className="orderTracking"
      aria-label={vi ? "Theo dõi đơn hàng" : "Order tracking"}
    >
      <header>
        <h2>{vi ? "Theo dõi đơn hàng" : "Order tracking"}</h2>
        <p className="orderTrackingReference">
          {vi ? "Mã đơn" : "Order ID"}: <code>{tracking.orderId}</code>
        </p>
      </header>
      <p>
        <strong>{trackingStageLabel(tracking, language)}</strong>
        {tracking.onHold && (
          <span> · {vi ? "Đang tạm giữ xử lý" : "Processing on hold"}</span>
        )}
      </p>
      <ol
        className="orderTrackingSteps"
        aria-label={vi ? "Các bước xử lý" : "Processing steps"}
      >
        {steps.map((step) => (
          <li
            key={step.label}
            data-state={step.state}
            aria-current={step.state === "current" ? "step" : undefined}
          >
            <span className="orderTrackingStepIcon" aria-hidden="true">
              {step.state === "completed"
                ? "✓"
                : step.state === "current"
                  ? "●"
                  : "○"}
            </span>
            <div className="orderTrackingStepContent">
              <span className="orderTrackingStepLabel">{step.label}</span>{" "}
              <small className="orderTrackingStepStatus">
                {step.state === "upcoming"
                  ? vi
                    ? "Chưa đến bước này"
                    : "Upcoming"
                  : step.state === "current"
                    ? vi
                      ? "Bước hiện tại"
                      : "Current step"
                    : vi
                      ? "Đã qua bước này"
                      : "Previous step"}
              </small>
            </div>
          </li>
        ))}
      </ol>
      <DeliveryEstimate
        aggregate
        value={tracking.estimate}
        observedAt={tracking.observedAt}
        language={language}
      />
      <p className="muted">
        {vi
          ? "Các cập nhật được nhân viên ghi nhận thủ công. Trạng thái của một kiện không xác nhận toàn bộ đơn đã giao."
          : "Staff record these updates manually. One delivered parcel does not confirm delivery of the entire order."}
      </p>
      {tracking.shipmentsPartial && (
        <p role="status">
          {vi
            ? "Thông tin kiện chưa đầy đủ. Liên hệ hỗ trợ để kiểm tra."
            : "Parcel information is incomplete. Contact support to check."}
        </p>
      )}
      {tracking.shipments.length > 0 && (
        <div className="orderTrackingParcels">
          <h3>{vi ? "Kiện của đơn này" : "Parcels for this order"}</h3>
          {tracking.shipments.map((p) => (
            <article key={p.id}>
              <p>
                <strong>{states[p.state]}</strong> · {p.route}
              </p>
              <p>
                {vi ? "Mã kiện" : "Parcel ID"}: <code>{p.id}</code>
              </p>
              {p.carrier && (
                <p>
                  {vi ? "Đơn vị vận chuyển" : "Carrier"}: {p.carrier}
                </p>
              )}
              {p.tracking && (
                <p>
                  {vi ? "Mã vận đơn" : "Tracking number"}:{" "}
                  <code>{p.tracking}</code>
                </p>
              )}
              <DeliveryEstimate
                value={p.deliveryEstimate}
                state={p.state}
                observedAt={tracking.observedAt}
                language={language}
              />
              {p.updatedAt && (
                <p>
                  {vi ? "Cập nhật" : "Updated"}:{" "}
                  <time dateTime={new Date(p.updatedAt).toISOString()}>
                    {date(p.updatedAt)}
                  </time>
                </p>
              )}
            </article>
          ))}
        </div>
      )}
      {tracking.timeline.length > 0 && (
        <details>
          <summary>{vi ? "Lịch sử cập nhật" : "Update history"}</summary>
          <ol>
            {tracking.timeline.map((event, index) => (
              <li key={event.createdAt + ":" + index}>
                <span>
                  {events[event.action]?.[vi ? 0 : 1] ??
                    (vi ? "Đã cập nhật đơn" : "Order updated")}
                </span>{" "}
                ·{" "}
                <time dateTime={new Date(event.createdAt).toISOString()}>
                  {date(event.createdAt)}
                </time>
              </li>
            ))}
          </ol>
        </details>
      )}
      {tracking.timelinePartial && (
        <p className="muted">
          {vi
            ? "Chỉ hiển thị lịch sử gần đây đã đọc được, tối đa 50 cập nhật."
            : "Only available recent history is shown, up to 50 updates."}
        </p>
      )}
      <p className="muted">
        {vi ? "Đọc lúc" : "Read at"}{" "}
        <time dateTime={new Date(tracking.observedAt).toISOString()}>
          {date(tracking.observedAt)}
        </time>{" "}
        ·{" "}
        {vi
          ? "giờ địa phương · không cập nhật trực tiếp"
          : "local time · not live"}
      </p>
      <Link to={`/account/orders/${encodeURIComponent(tracking.orderId)}`}>
        {vi ? "Mở đơn đang tra cứu" : "Open the tracked order"}
      </Link>
    </section>
  );
}

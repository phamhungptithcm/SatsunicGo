import { TrackingIcon } from "./TrackingIcon";
import type { CSSProperties } from "react";
import "./order-tracking.css";
import { Link, useLocation } from "react-router-dom";
import { DeliveryEstimate } from "../shipping/DeliveryEstimate";
import {
  trackingMilestones,
  trackingMilestoneUpdates,
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
/** Pure owner projection renderer shared by Account and Ask; no polling or cache. */
export function OrderTracking({
  tracking,
  language = "vi",
  compact = false,
}: {
  tracking: CustomerOrderTracking;
  language?: "vi" | "en";
  compact?: boolean;
}) {
  const vi = language === "vi";
  const location = useLocation();
  const orderPath = `/account/orders/${encodeURIComponent(tracking.orderId)}`;
  const steps = trackingMilestones(tracking, language);
  const updates = trackingMilestoneUpdates(tracking, language);
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const format = new Intl.DateTimeFormat(vi ? "vi-VN" : "en-GB", {
    timeZone: zone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const date = (value: number) => {
    const parts = Object.fromEntries(
      format.formatToParts(value).map((p) => [p.type, p.value]),
    );
    return `${parts.day}/${parts.month}/${parts.year} · ${parts.hour}:${parts.minute}`;
  };
  const stamp = (value: number) => (
    <time dateTime={new Date(value).toISOString()}>{date(value)}</time>
  );
  const states = {
    packed: vi ? "Đã đóng gói" : "Packed",
    in_transit: vi ? "Đang vận chuyển" : "In transit",
    delivered: vi ? "Kiện đã giao" : "Parcel delivered",
    failed: vi ? "Giao kiện chưa thành công" : "Parcel delivery failed",
    returned: vi ? "Kiện đã trả lại" : "Parcel returned",
  };
  const routes = [
    ...new Set(tracking.shipments.map((p) => p.route).filter(Boolean)),
  ];
  return (
    <section
      className={`orderTracking ot${compact ? " ot-compact" : ""}`}
      aria-label={vi ? "Theo dõi đơn hàng" : "Order tracking"}
    >
      <header className="ot-reference">
        <span>{vi ? "Theo dõi đơn hàng" : "Order tracking"}</span>
        <code>{tracking.orderId}</code>
      </header>
      <div className="ot-panel">
        <div className="ot-hero">
          <div className="ot-main">
            <span className="ot-eyebrow">
              {vi ? "Đơn hàng của bạn" : "Your order"}
            </span>
            <h2>{trackingStageLabel(tracking, language)}</h2>
            {tracking.onHold && (
              <p className="ot-notice" role="status">
                {vi ? "Đang tạm giữ xử lý" : "Processing on hold"}
              </p>
            )}
            <p className="ot-description">
              {vi
                ? "Theo các cập nhật đã ghi nhận của đơn hàng."
                : "Based on recorded order updates."}
            </p>
            {routes.length > 0 && (
              <p className="ot-route">
                <TrackingIcon kind="truck" />
                <span>
                  {vi ? "Tuyến vận chuyển" : "Shipping route"}:{" "}
                  {routes.join(" · ")}
                </span>
              </p>
            )}
          </div>
          <aside
            className="ot-eta"
            aria-label={vi ? "Thời gian giao dự kiến" : "Estimated delivery"}
          >
            <DeliveryEstimate
              aggregate
              compact
              value={
                tracking.stage === "IN_TRANSIT" &&
                !tracking.onHold &&
                !tracking.shipmentsPartial
                  ? tracking.estimate
                  : null
              }
              observedAt={tracking.observedAt}
              language={language}
            />
          </aside>
        </div>
        <div className="ot-timeline-heading">
          <span>
            {vi ? "Cập nhật gần nhất từng mốc" : "Latest activity per step"}
          </span>
          <span>{zone}</span>
        </div>
        <ol
          data-compact={steps.length <= 6}
          className="ot-steps"
          aria-label={vi ? "Các bước xử lý" : "Processing steps"}
        >
          {steps.map((step, index) => (
            <li
              key={step.label}
              data-state={step.state}
              aria-current={step.state === "current" ? "step" : undefined}
              style={{ "--i": index } as CSSProperties}
            >
              <span className="ot-step-icon">
                <TrackingIcon
                  kind={
                    step.state === "completed"
                      ? "check"
                      : index === steps.length - 1
                        ? "home"
                        : index === steps.length - 2
                          ? "truck"
                          : "box"
                  }
                />
              </span>
              <div className="ot-step-content">
                <strong>{step.label}</strong>
                {step.state === "completed" && (
                  <span className="ot-sr-only">
                    {vi ? "Đã qua bước này" : "Previous step"}
                  </span>
                )}
                <small className="ot-step-tag">
                  {step.state === "current"
                    ? tracking.onHold
                      ? vi
                        ? "Tạm dừng"
                        : "On hold"
                      : vi
                        ? "Hiện tại"
                        : "Current"
                    : steps[index - 1]?.state === "current"
                      ? vi
                        ? "Tiếp theo"
                        : "Next"
                      : ""}
                </small>
                <span className="ot-step-time">
                  {updates[index]
                    ? stamp(updates[index])
                    : step.state === "upcoming"
                      ? vi
                        ? "Chưa có cập nhật"
                        : "No update yet"
                      : vi
                        ? "Chưa có thời điểm ghi nhận"
                        : "Recorded time unavailable"}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <p className="ot-readtime">
        <TrackingIcon kind="clock" />
        <span>
          {vi ? "Đọc lúc " : "Read at "}
          {stamp(tracking.observedAt)} · {zone} ·{" "}
          {vi ? "không cập nhật trực tiếp" : "not live"}
        </span>
      </p>
      {tracking.shipmentsPartial && (
        <p className="ot-notice" role="status">
          {vi
            ? "Thông tin kiện chưa đầy đủ. Liên hệ hỗ trợ để kiểm tra."
            : "Parcel information is incomplete. Contact support to check."}
        </p>
      )}
      <div className="ot-details">
        <section
          className="ot-history"
          aria-label={vi ? "Lịch sử cập nhật" : "Update history"}
        >
          <h3>{vi ? "Lịch sử cập nhật" : "Update history"}</h3>
          {tracking.timeline.length === 0 && (
            <p className="quietNote">
              {vi ? "Chưa có lịch sử cập nhật." : "No update history yet."}
            </p>
          )}
          <ol>
            {[...tracking.timeline]
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((event, index) => (
                <li key={event.createdAt + ":" + index}>
                  <span className="ot-history-dot" aria-hidden="true" />
                  <div>
                    <strong>
                      {events[event.action]?.[vi ? 0 : 1] ??
                        (vi ? "Đã cập nhật đơn" : "Order updated")}
                    </strong>
                    {stamp(event.createdAt)}
                  </div>
                </li>
              ))}
          </ol>
          {tracking.timelinePartial && (
            <p className="quietNote">
              {vi
                ? "Chỉ hiển thị lịch sử gần đây đã đọc được, tối đa 50 cập nhật."
                : "Only available recent history is shown, up to 50 updates."}
            </p>
          )}
        </section>
        <section
          className="ot-parcels"
          aria-label={vi ? "Kiện của đơn này" : "Parcels for this order"}
        >
          <h3>{vi ? "Kiện của đơn này" : "Parcels for this order"}</h3>
          {tracking.shipments.length === 0 && (
            <p className="quietNote">
              {vi
                ? "Chưa có thông tin kiện hàng."
                : "No parcel information yet."}
            </p>
          )}
          {tracking.shipments.map((p) => (
            <article key={p.id}>
              <div className="ot-parcel-heading">
                <TrackingIcon kind="box" />
                <strong>{states[p.state]}</strong>
              </div>
              <p>
                {vi ? "Mã kiện" : "Parcel ID"}: <code>{p.id}</code>
              </p>
              <p>
                {vi ? "Tuyến vận chuyển" : "Shipping route"}: {p.route}
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
                <p className="quietNote">
                  {vi ? "Cập nhật" : "Updated"}: {stamp(p.updatedAt)}
                </p>
              )}
            </article>
          ))}
          <p className="quietNote">
            {vi
              ? "Các cập nhật được nhân viên ghi nhận thủ công. Trạng thái của một kiện không xác nhận toàn bộ đơn đã giao."
              : "Staff record these updates manually. One delivered parcel does not confirm delivery of the entire order."}
          </p>
        </section>
      </div>
      {location.pathname !== orderPath && (
        <Link className="ot-order-link" to={orderPath}>
          {vi ? "Mở đơn đang tra cứu" : "Open the tracked order"}
        </Link>
      )}
    </section>
  );
}

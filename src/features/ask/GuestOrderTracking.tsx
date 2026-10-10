import {
  publicTrackingSchema,
  type PublicOrderTracking,
} from "../../../packages/domain/public-order-tracking";
import { DeliveryEstimate } from "../shipping/DeliveryEstimate";
import { deviceTimeZone } from "../shipping/delivery-estimate-time";
import "./order-tracking.css";
const labels = {
  vi: ["Đã nhận đơn", "Đang chuẩn bị", "Đang vận chuyển", "Đã giao"],
  en: ["Order received", "Preparing", "In transit", "Delivered"],
};
export function GuestOrderTracking({
  tracking,
  language = "vi",
}: {
  tracking: PublicOrderTracking;
  language?: "vi" | "en";
}) {
  const parsed = publicTrackingSchema.safeParse(tracking);
  if (!parsed.success) return null;
  const t = parsed.data,
    vi = language === "vi",
    zone = deviceTimeZone();
  const index = ["received", "preparing", "shipping", "delivered"].indexOf(
    t.publicStatus,
  );
  const title =
    index >= 0
      ? labels[language][index]
      : t.publicStatus === "cancelled"
        ? vi
          ? "Đã hủy"
          : "Cancelled"
        : vi
          ? "Tiến độ đang cần cập nhật"
          : "Progress needs an update";
  const format = (n: number) =>
    new Intl.DateTimeFormat(vi ? "vi-VN" : "en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: zone,
    }).format(n);
  return (
    <section
      className="orderTracking ot"
      aria-label={vi ? "Tra cứu tiến độ" : "Track progress"}
    >
      <div className="ot-hero">
        <div className="ot-main">
          <span className="ot-eyebrow">
            {vi ? "Tra cứu bằng mã" : "Tracking by code"}
          </span>
          <h2>{title}</h2>
          <p className="ot-description">
            {vi
              ? "Chỉ hiển thị tiến độ và thời gian giao dự kiến."
              : "Only progress and estimated delivery are shown."}
          </p>
        </div>
        <DeliveryEstimate
          value={t.eta}
          state="in_transit"
          observedAt={t.observedAt}
          language={language}
          compact
        />
      </div>
      {index >= 0 && (
        <ol
          className="guestTrackingSteps"
          aria-label={vi ? "Các bước xử lý" : "Processing steps"}
        >
          {labels[language].map((label, i) => (
            <li
              key={label}
              aria-current={i === index ? "step" : undefined}
              data-state={i < index ? "done" : i === index ? "current" : "next"}
            >
              <span aria-hidden="true">{i < index ? "✓" : i + 1}</span>
              <strong>{label}</strong>
              <small>
                {i === index
                  ? vi
                    ? "Hiện tại"
                    : "Current"
                  : i === index + 1
                    ? vi
                      ? "Tiếp theo"
                      : "Next"
                    : i < index
                      ? vi
                        ? "Đã qua"
                        : "Previous"
                      : ""}
              </small>
            </li>
          ))}
        </ol>
      )}
      <p className="ot-description">
        {vi ? "Cập nhật ghi nhận: " : "Recorded update: "}
        {t.updatedAt ? (
          <time dateTime={new Date(t.updatedAt).toISOString()}>
            {format(t.updatedAt)}
          </time>
        ) : vi ? (
          "Chưa có thời điểm ghi nhận"
        ) : (
          "Recorded time unavailable"
        )}{" "}
        · {zone}
      </p>
      <p className="ot-description">
        {vi ? "Đọc lúc " : "Read at "}
        <time dateTime={new Date(t.observedAt).toISOString()}>
          {format(t.observedAt)}
        </time>
        {vi ? " · Không cập nhật trực tiếp" : " · Not live"}
      </p>
    </section>
  );
}

import { TrackingIcon } from "./TrackingIcon";
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
  const formatter = new Intl.DateTimeFormat(vi ? "vi-VN" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: zone,
  });
  const format = (n: number) => {
    const parts = Object.fromEntries(
      formatter.formatToParts(n).map((p) => [p.type, p.value]),
    );
    return `${parts.day}/${parts.month}/${parts.year} · ${parts.hour}:${parts.minute}`;
  };
  return (
    <section
      className="orderTracking ot ot-compact"
      aria-label={vi ? "Tra cứu tiến độ" : "Track progress"}
    >
      <div className="ot-panel">
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
          <aside
            className="ot-eta"
            aria-label={vi ? "Thời gian giao dự kiến" : "Estimated delivery"}
          >
            <DeliveryEstimate
              value={t.eta}
              state="in_transit"
              observedAt={t.observedAt}
              language={language}
              compact
            />
          </aside>
        </div>
        <div className="ot-timeline-heading">
          <span>{vi ? "Cập nhật ghi nhận" : "Recorded update"}</span>
          <span>{zone}</span>
        </div>
        {index >= 0 && (
          <ol
            className="ot-steps"
            data-compact="true"
            data-public="true"
            aria-label={vi ? "Các bước xử lý" : "Processing steps"}
          >
            {labels[language].map((label, i) => (
              <li
                key={label}
                aria-current={i === index ? "step" : undefined}
                data-state={
                  i < index ? "completed" : i === index ? "current" : "upcoming"
                }
              >
                <span className="ot-step-icon">
                  <TrackingIcon
                    kind={
                      i < index
                        ? "check"
                        : i === 3
                          ? "home"
                          : i === 2
                            ? "truck"
                            : "box"
                    }
                  />
                </span>
                <div className="ot-step-content">
                  <strong>{label}</strong>
                  <small className="ot-step-tag">
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
                  {i === index && (
                    <span className="ot-step-time">
                      {t.updatedAt ? (
                        <time dateTime={new Date(t.updatedAt).toISOString()}>
                          {format(t.updatedAt)}
                        </time>
                      ) : vi ? (
                        "Chưa có cập nhật"
                      ) : (
                        "No update yet"
                      )}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
      {index < 0 && (
        <p className="ot-readtime">
          <span>
            {vi ? "Cập nhật ghi nhận: " : "Recorded update: "}
            {t.updatedAt ? (
              <time dateTime={new Date(t.updatedAt).toISOString()}>
                {format(t.updatedAt)}
              </time>
            ) : vi ? (
              "Chưa có thời điểm ghi nhận"
            ) : (
              "Recorded time unavailable"
            )}
          </span>
        </p>
      )}
      <p className="ot-readtime">
        <span>
          {vi ? "Đọc lúc " : "Read at "}
          <time dateTime={new Date(t.observedAt).toISOString()}>
            {format(t.observedAt)}
          </time>
          {vi ? " · Không cập nhật trực tiếp" : " · Not live"}
        </span>
      </p>
    </section>
  );
}

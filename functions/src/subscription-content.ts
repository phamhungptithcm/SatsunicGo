import type {
  NotificationChannel,
  NotificationTopic,
} from "../../packages/domain/notification-preferences";
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const topicNames: Record<NotificationTopic, string> = {
  orderEmail: "cập nhật đơn hàng qua email",
  promotionsEmail: "ưu đãi qua email",
  orderSms: "cập nhật đơn hàng qua SMS",
};
export function subscriptionContent(
  channel: NotificationChannel,
  kind: "confirm" | "welcome",
  topics: NotificationTopic[],
  link: string,
) {
  const url = new URL(link);
  if (url.protocol !== "https:" || url.username || url.password)
    throw Error("UNSAFE_SUBSCRIPTION_LINK");
  const names = topics.map((k) => topicNames[k]).join(" và ");
  const title =
    kind === "confirm" ? "Xác nhận đăng ký nhận tin" : "Đã đăng ký nhận tin";
  const body =
    kind === "confirm"
      ? `Bạn vừa chọn nhận ${names} từ SatsunicGo. Xác nhận để bật lựa chọn này.`
      : `Bạn đã bật ${names} từ SatsunicGo.`;
  const cta =
    kind === "confirm"
      ? "Xác nhận đăng ký"
      : topics.length > 1
        ? "Tắt các loại tin này"
        : "Tắt loại tin này";
  const note =
    kind === "confirm"
      ? "Nếu không phải bạn đăng ký, hãy bỏ qua tin này."
      : "Bạn có thể quản lý riêng từng loại trong Hồ sơ → Thông báo.";
  if (channel === "sms")
    return {
      subject: title,
      text:
        kind === "confirm"
          ? `[SatsunicGo] Xac nhan nhan cap nhat don hang: ${link}. Neu khong phai ban yeu cau, hay bo qua.`
          : `[SatsunicGo] Da bat cap nhat don hang qua SMS. Tat: ${link}`,
      html: "",
    };
  return {
    subject: `SatsunicGo · ${title}`,
    text: `${body}\n\n${cta}: ${link}\n\n${note}\nĐội ngũ SatsunicGo`,
    html: `<!doctype html><html lang="vi"><body style="margin:0;font:14px Arial,sans-serif;color:#111c35"><table role="presentation" style="max-width:560px;margin:auto;width:100%"><tr><td style="padding:28px"><p style="color:#163cff">SatsunicGo</p><h1 style="font-size:20px;font-weight:500">${escape(title)}</h1><p>${escape(body)}</p><p style="margin:24px 0"><a style="color:#163cff" href="${escape(link)}">${escape(cta)}</a></p><p style="font-size:12px;color:#53627b">${escape(note)}</p><p>Đội ngũ SatsunicGo</p></td></tr></table></body></html>`,
  };
}

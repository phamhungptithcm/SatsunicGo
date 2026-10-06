import { notificationLabels } from "../../packages/domain/notification-content";
export function emailContent(action: unknown, documentNumber?: unknown) {
  if (action === "invoiceIssued" && typeof documentNumber === "string" && /^SG-[0-9]{8,13}$/.test(documentNumber)) return {
    subject: "SatsunicGo · Chứng từ đơn hàng",
    text: `Chứng từ nội bộ ${documentNumber} đã được xuất. Đăng nhập SatsunicGo, mở Tài khoản → Chứng từ để xem hoặc in/lưu PDF. Đây không phải hóa đơn điện tử thuế. Số tiền phản ánh thời điểm xuất chứng từ.`,
  };
  if (action === "membershipExpiring")
    return {
      subject: "SatsunicGo · Membership sắp hết hạn",
      text: "Membership của bạn sắp hết hạn. Mở SatsunicGo để xem thời hạn và chọn gia hạn. Hệ thống không tự trừ tiền.",
    };
  if (action === "membershipActivated")
    return {
      subject: "SatsunicGo · Membership đã được kích hoạt",
      text: "Membership của bạn đã được kích hoạt. Mở SatsunicGo để xem gói và thời hạn sử dụng.",
    };
  if (action === "membershipExpired")
    return {
      subject: "SatsunicGo · Membership đã hết hạn",
      text: "Membership của bạn đã hết hạn. Mở SatsunicGo để xem thông tin gói và chọn gia hạn.",
    };
  if (typeof action === "string" && Object.hasOwn(notificationLabels, action))
    return {
      subject: `SatsunicGo · ${notificationLabels[action]}`,
      text: "Mở SatsunicGo để xem chi tiết thông báo trong tài khoản của bạn.",
    };
  return {
    subject: "SatsunicGo · Có cập nhật mới",
    text: "Bạn có thông báo mới. Mở SatsunicGo để xem chi tiết.",
  };
}

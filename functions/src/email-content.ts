import { notificationLabels } from "../../packages/domain/notification-content";
export function emailContent(action: unknown, documentNumber?: unknown) {
  if (
    action === "invoiceIssued" &&
    typeof documentNumber === "string" &&
    /^SG-[0-9]{8,13}$/.test(documentNumber)
  )
    return {
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

// Approved versioned customer templates; legacy callers retain their existing contract.
import {
  customerEmailCatalog,
  customerEventTarget,
  customerFormattedFields,
  parseCustomerEvent,
} from "../../packages/domain/customer-notification";
export const CUSTOMER_EMAIL_ORIGIN = "https://satsunicgo.web.app";
const escapeEmailHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function renderCustomerEmail(input: unknown) {
  const event = parseCustomerEvent(input),
    template = customerEmailCatalog[event.templateId];
  const fields = {
    ...customerFormattedFields(event),
    ctaUrl: CUSTOMER_EMAIL_ORIGIN + customerEventTarget(event),
  };
  function interpolate(source: string, html = false) {
    return source.replace(
      /\{\{([A-Za-z]+)\}\}/g,
      (_match, key: keyof typeof fields) => {
        if (!Object.hasOwn(fields, key)) throw Error("MISSING_CUSTOMER_FIELD");
        const value = fields[key as keyof typeof fields];
        return html ? escapeEmailHtml(value) : value;
      },
    );
  }
  const output = {
    subject: interpolate(template.subject),
    text: interpolate(template.text),
    html: interpolate(template.html, true),
  };
  if (
    Array.from(output.subject).some((char) =>
      [0, 10, 13].includes(char.charCodeAt(0)),
    ) ||
    output.subject.length > 512 ||
    Buffer.byteLength(output.html, "utf8") > 50000
  )
    throw Error("CUSTOMER_CONTENT_LIMIT");
  return output;
}

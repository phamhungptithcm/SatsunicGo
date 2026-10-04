import type { z } from "zod";
import { requestSchema } from "../../../packages/domain";
export type AskLanguage = "vi" | "en";
export type AskAnswer = {
  language: AskLanguage;
  title: string;
  paragraphs: string[];
  bullets: string[];
  sourceIds: string[];
  action: string;
  followUp?: string;
  draft?: z.infer<typeof requestSchema>;
};
export function sourceLink(id: string) {
  return {
    href: /^post:[a-z0-9-]{2,100}$/.test(id)
      ? `/posts/${id.slice(5)}`
      : /^product:[a-z0-9-]{2,100}$/.test(id)
        ? `/products/${id.slice(8)}`
        : id === "privacy"
          ? "/privacy"
          : id === "fees"
            ? "/fees"
            : id === "request"
              ? "/request"
              : "/how-it-works",
    label:
      id.startsWith("post:") || id.startsWith("product:")
        ? id.startsWith("product:")
          ? "Sản phẩm tham khảo"
          : "Bài viết tham khảo"
        : id === "privacy"
          ? "Quyền riêng tư"
          : id === "fees"
            ? "Biểu phí"
            : id === "request"
              ? "Gửi yêu cầu mua hộ"
              : "Cách hoạt động",
  };
}
export function detectLanguage(
  text: string,
  current: AskLanguage,
): AskLanguage {
  return /\b(how|what|request|buy|deposit)\b/i.test(text)
    ? "en"
    : /[àáảãạăâêôơưđ]/i.test(text)
      ? "vi"
      : current;
}
export function retrieveSelection(p: {
  question: string;
  history: string[];
  sessionId: string;
  language: AskLanguage;
}) {
  const q = p.question.toLowerCase();
  return {
    topic: /cọc|số dư|deposit|balance|50%/.test(q)
      ? "deposit"
      : /link|tên sản phẩm|item/.test(q)
        ? "request"
        : /mua hộ|hoạt động|buying|work/.test(q)
          ? "workflow"
          : "outside",
  };
}
export function buildAnswer(
  p: { topic: string },
  language: AskLanguage,
): AskAnswer {
  const vi = language === "vi";
  if (p.topic === "deposit")
    return {
      language,
      title: vi
        ? "Cọc 50%, số dư theo tổng cuối"
        : "50% deposit, balance from the approved final total",
      paragraphs: [
        vi
          ? "Bạn chấp nhận báo giá còn hiệu lực trước khi cọc. Cọc mặc định bằng 50% tổng báo giá dự kiến. Số dư tính từ tổng cuối đã duyệt trừ tiền thu ròng; không mặc định luôn bằng nửa ban đầu."
          : "Accept a valid quote before paying a deposit. The default deposit is 50% of the estimate. The balance uses approved final charges minus net confirmed payments.",
      ],
      bullets: [],
      sourceIds: ["fees"],
      action: "request",
    };
  if (p.topic === "request")
    return {
      language,
      title: vi
        ? "Chưa có link vẫn gửi được"
        : "You can request an item without a link",
      paragraphs: [
        vi
          ? "Gửi tên sản phẩm, số lượng, size/màu/model và quốc gia nguồn. Nhân viên sẽ xác minh món hàng trước khi gửi báo giá. Bạn chưa cần thanh toán khi gửi yêu cầu."
          : "Provide the item name, quantity, variant and source country. A member of staff verifies the product before quoting. Submitting a request does not require payment.",
      ],
      bullets: [],
      sourceIds: ["request"],
      action: "request",
    };
  return {
    language,
    title: vi ? "Từ yêu cầu đến nhận hàng" : "From request to delivery",
    paragraphs: [
      vi
        ? "Gửi yêu cầu → xác minh sản phẩm → duyệt báo giá → xác nhận cọc → mua hàng → nhận kho và đóng gói → duyệt tổng cuối → trả số dư → xuất gửi. Nhân viên thực hiện mua hàng và cập nhật vận đơn."
        : "Request an item → product verification → quote approval → confirmed deposit → manual purchase → receiving and packing → approved final charges → balance payment → shipping. Staff buy the items and update tracking.",
    ],
    bullets: [],
    sourceIds: ["workflow"],
    action: "request",
  };
}

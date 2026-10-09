import {
  preferredLanguage,
  searchViews,
} from "../../../packages/domain/ask-language-query";
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
  shoppingDraft?: z.infer<ReturnType<typeof requestSchema.partial>>;
};
export function sourceLink(id: string, language: AskLanguage = "vi") {
  const vi = language === "vi";
  return {
    href: /^post:[a-z0-9-]{2,100}$/.test(id)
      ? `/posts/${id.slice(5)}`
      : /^product:[a-z0-9-]{2,100}$/.test(id)
        ? `/products/${id.slice(8)}`
        : id === "privacy"
          ? "/privacy"
          : id === "fees"
            ? "/fees"
            : id === "membership"
              ? "/membership"
              : id === "request"
                ? "/request"
                : "/how-it-works",
    label:
      id.startsWith("post:") || id.startsWith("product:")
        ? id.startsWith("product:")
          ? vi
            ? "Sản phẩm"
            : "Product"
          : vi
            ? "Bài viết tham khảo"
            : "Reference article"
        : id === "privacy"
          ? vi
            ? "Quyền riêng tư"
            : "Privacy"
          : id === "fees"
            ? vi
              ? "Biểu phí"
              : "Shipping rates"
            : id === "membership"
              ? "Membership"
              : id === "request"
                ? vi
                  ? "Gửi yêu cầu mua hộ"
                  : "Request an item"
                : vi
                  ? "Cách hoạt động"
                  : "How it works",
  };
}
export function detectLanguage(
  text: string,
  current: AskLanguage,
): AskLanguage {
  return text.length > 1000 ? current : preferredLanguage(text, current);
}
export function retrieveSelection(p: {
  question: string;
  history: string[];
  sessionId: string;
  language: AskLanguage;
}) {
  const q = searchViews(p.question).folded;
  return {
    topic:
      /\b(?:coc|so du|deposit|balance)\b|50%/.test(q) &&
      !/\b(?:bank|loan|sheet|network|homework)\b/.test(q)
        ? "deposit"
        : /\b(?:chua co link|khong co link|without (?:a |an |the )?(?:product )?link|no (?:product )?link|ten san pham)\b/.test(
              q,
            )
          ? "request"
          : /\b(?:mua ho|buying assistance|buying service)\b/.test(q) ||
              /\b(?:how.*buying.*work|satsunicgo.*work)\b/.test(q)
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
        ? "Thanh toán theo loại đơn"
        : "Payment depends on your order type",
      paragraphs: [
        vi
          ? "Sản phẩm niêm yết thanh toán toàn bộ theo giá trọn gói. Với sản phẩm ngoài danh mục, anh/chị chấp nhận báo giá trước khi thanh toán đợt một; mức cọc hiện tại là 50% tổng báo giá. Đợt hai tính theo tổng cuối đã duyệt trừ tiền thu ròng."
          : "Listed products use one full payment at the listed total. Custom requests require a valid accepted quote and two installments: a 50% deposit, then the approved final total minus net confirmed payments.",
      ],
      bullets: [],
      sourceIds: ["fees"],
      action: "fees",
    };
  if (p.topic === "request")
    return {
      language,
      title: vi
        ? "Chưa có link vẫn gửi được"
        : "You can request an item without a link",
      paragraphs: [
        vi
          ? "Nếu sản phẩm chưa có trong danh mục, gửi tên sản phẩm, số lượng, mẫu và quốc gia nguồn để nhân viên xem xét, báo giá. Sản phẩm niêm yết được chọn mua và thanh toán toàn bộ ngay trong danh mục."
          : "For a product outside the catalog, provide its name, quantity, variant and source country for staff review and quotation. Listed products can be selected and paid in full from the catalog.",
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
        ? "Sản phẩm niêm yết: chọn mua → thanh toán toàn bộ → nhân viên mua hộ → đóng gói và giao hàng. Sản phẩm ngoài danh mục: gửi yêu cầu → xem xét, báo giá → thanh toán đợt một → mua hộ → chốt tổng cuối → thanh toán đợt hai → giao hàng."
        : "Listed products: select → pay in full → staff purchase → pack and deliver. Products outside the catalog: request → staff review and quotation → first installment → purchase → approved final total → second installment → delivery.",
    ],
    bullets: [],
    sourceIds: ["workflow"],
    action: "workflow",
  };
}

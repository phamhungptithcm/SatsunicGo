import { restrictedBody } from "./restricted-content";
export const purchaseTerms = {
  title: "Điều khoản mua hộ",
  intro: "Những điều bạn cần biết về thanh toán, đổi trả và hoàn tiền.",
  sections: [
    {
      id: "listed-products",
      title: "Sản phẩm trong danh mục",
      body: "Bạn thanh toán toàn bộ theo giá niêm yết.",
    },
    {
      id: "custom-products",
      title: "Sản phẩm ngoài danh mục",
      body: "Bạn gửi yêu cầu, xem và đồng ý với báo giá trước khi thanh toán. Khoản thanh toán được chia thành hai đợt theo báo giá.",
    },
    {
      id: "returns-and-refunds",
      title: "Đổi trả, hủy đơn và hoàn tiền",
      body: "Các điều kiện này chưa được duyệt. SatsunicGo cần hoàn tất và công bố điều khoản trước khi nhận giao dịch thực tế.",
    },
  ],
};
export const publicCopy: Record<string, [string, string]> = {
  "how-it-works": [
    "Mua hộ từng bước",
    "Sản phẩm niêm yết: chọn sản phẩm → thanh toán toàn bộ → nhân viên mua hộ → nhận, đóng gói và giao hàng.\n\nSản phẩm chưa có trong danh mục: gửi yêu cầu → xem xét và báo giá → chấp nhận báo giá → thanh toán đợt một → mua hộ → chốt tổng cuối → thanh toán đợt hai → giao hàng.",
  ],
  fees: [
    "Chi phí được tách rõ",
    "Sản phẩm niêm yết dùng giá trọn gói cho toàn bộ phí mua hộ và giao hàng, thanh toán một lần. Sản phẩm ngoài danh mục được xem xét và báo giá riêng; chi phí và hai đợt thanh toán được thể hiện trong báo giá.",
  ],
  membership: [
    "Quyền lợi cho người mua thường xuyên",
    "FREE, PLUS và BUSINESS đang chờ duyệt giá và quyền lợi. Chưa mở bán. Quyền lợi của đơn được giữ theo snapshot tại thời điểm duyệt báo giá.",
  ],
  support: [
    "Hỗ trợ mua hộ",
    "Bạn có thể mô tả điều cần làm rõ trong yêu cầu mua hộ. Kênh hỗ trợ và giờ nhân viên trực đang chờ cấu hình.",
  ],
  privacy: [
    "Quyền riêng tư",
    "Chính sách lưu trữ, xử lý dữ liệu và liên hệ của đơn vị vận hành đang chờ duyệt. Không nhập chứng từ ngân hàng hay thông tin nhạy cảm vào chat.",
  ],
  terms: [
    purchaseTerms.title,
    [
      purchaseTerms.intro,
      ...purchaseTerms.sections.map(
        (section, index) => `${index + 1}. ${section.title}\n${section.body}`,
      ),
    ].join("\n\n"),
  ],
  restricted: ["Hàng hạn chế", restrictedBody],
};

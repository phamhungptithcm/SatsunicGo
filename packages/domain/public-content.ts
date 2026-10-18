import { restrictedBody } from "./restricted-content";
export const purchaseTerms = {
  title: "Điều khoản mua hộ, đổi trả và hoàn tiền",
  intro:
    "Kiểm tra sản phẩm, quy cách và số tiền trước khi thanh toán. Khi cần hủy đơn, đổi trả hoặc hoàn tiền, gửi yêu cầu tại mục Hỗ trợ kèm mã đơn để SatsunicGo đối chiếu và thông báo phương án xử lý.",
  sections: [
    {
      id: "listed-products",
      title: "Sản phẩm và giá niêm yết",
      body: "Giá niêm yết là giá trọn gói, bao gồm phí mua hộ và giao hàng; bạn thanh toán một lần. Tên sản phẩm, quy cách, số lượng và giá tại thời điểm đặt mua là căn cứ đối chiếu đơn. SatsunicGo không tự ý đổi sản phẩm, quy cách hoặc thu thêm chi phí ngoài giá đã xác nhận.",
    },
    {
      id: "custom-products",
      title: "Sản phẩm ngoài danh mục và thay đổi đơn",
      body: "Với sản phẩm ngoài danh mục, hãy kiểm tra nội dung yêu cầu, báo giá và lịch thanh toán được hiển thị trước khi đồng ý. Nếu hết hàng hoặc cần thay đổi sản phẩm, số lượng hay chi phí, SatsunicGo sẽ thông báo phương án để bạn chấp thuận trước khi thực hiện. Bạn có thể từ chối phương án thay thế và yêu cầu xử lý phần hàng không mua được.",
    },
    {
      id: "cancellation",
      title: "Hủy đơn hoặc một phần đơn",
      body: "Gửi yêu cầu hủy sớm nhất có thể. Nếu phần hàng yêu cầu hủy chưa được mua và chưa phát sinh chi phí, số tiền đã thanh toán cho phần đó được hoàn lại sau khi đối chiếu. Nếu nhà cung cấp đã xử lý đơn hoặc hàng đã được mua, SatsunicGo sẽ kiểm tra khả năng hủy hoặc trả hàng với nhà cung cấp. Mọi chi phí thực tế liên quan phải được giải thích, có căn cứ và được bạn đồng ý trước khi áp dụng; việc gửi yêu cầu không đồng nghĩa đơn đã được hủy.",
    },
    {
      id: "incorrect-or-damaged",
      title: "Hàng giao sai, thiếu, hư hỏng hoặc không đúng thỏa thuận",
      body: "Kiểm tra hàng khi nhận và thông báo sớm nếu có vấn đề. Cung cấp mã đơn, mô tả tình trạng và hình ảnh sản phẩm, bao bì hoặc nhãn vận chuyển nếu có. Giữ lại hàng và bao bì để hỗ trợ đối chiếu; không tiếp tục sử dụng sản phẩm có dấu hiệu không an toàn. SatsunicGo sẽ kiểm tra và trao đổi phương án giao bổ sung, đổi hàng, nhận lại hàng hoặc hoàn tiền phù hợp với kết quả xác minh. Video mở kiện có thể hỗ trợ kiểm tra nhưng không phải điều kiện duy nhất để tiếp nhận yêu cầu.",
    },
    {
      id: "change-of-mind",
      title: "Trả hàng do thay đổi nhu cầu",
      body: "Nếu hàng đúng thỏa thuận nhưng bạn muốn đổi hoặc trả, việc tiếp nhận phụ thuộc điều kiện của nhà cung cấp và tình trạng thực tế của hàng. Hãy giữ nguyên niêm phong, phụ kiện và bao bì khi có thể. SatsunicGo sẽ xác nhận khả năng tiếp nhận, địa chỉ gửi, chi phí và số tiền dự kiến hoàn trước khi bạn quyết định gửi lại. Không tự gửi hàng khi chưa nhận được hướng dẫn. Điều kiện này không thay thế quyền yêu cầu xử lý hàng lỗi hoặc hàng không đúng thỏa thuận.",
    },
    {
      id: "returns-and-refunds",
      title: "Xác nhận và thực hiện hoàn tiền",
      body: "Số tiền hoàn được đối chiếu với khoản đã nhận, phần đơn được hủy hoặc trả và các khoản hoàn trước đó. Khi cần nhận lại hàng, SatsunicGo sẽ kiểm tra tình trạng hàng trước khi xác nhận số tiền cuối cùng. Bạn được thông báo rõ số tiền, căn cứ tính, chi phí đã đồng ý nếu có, phương thức và thời gian dự kiến hoàn của từng trường hợp. Yêu cầu đang được xử lý chưa có nghĩa tiền đã chuyển. Sau khi thực hiện hoàn tiền, SatsunicGo sẽ cung cấp thông tin đối chiếu; thời điểm tiền vào tài khoản còn phụ thuộc ngân hàng hoặc đơn vị thanh toán. Nếu quá thời gian đã được thông báo mà chưa nhận tiền, hãy liên hệ Hỗ trợ kèm mã đơn để kiểm tra.",
    },
    {
      id: "support-and-rights",
      title: "Gửi yêu cầu và bảo vệ thông tin",
      body: "Đăng nhập và mở mục Hỗ trợ để gửi mã đơn, sản phẩm liên quan và phương án bạn mong muốn. Nhân viên sẽ yêu cầu bổ sung thông tin cần thiết trong quá trình đối chiếu. Chỉ cung cấp thông tin nhận tiền qua kênh hỗ trợ được xác nhận; không gửi mật khẩu, mã OTP hoặc thông tin thẻ đầy đủ. Các điều khoản này không loại trừ quyền khiếu nại, yêu cầu bồi thường hoặc quyền khác của người tiêu dùng theo pháp luật áp dụng.",
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

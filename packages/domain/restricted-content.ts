export const restrictedIntro =
  "Một số món cần kiểm tra trước khi mua hoặc gửi. Gửi thông tin sản phẩm để nhân viên xem xét tuyến vận chuyển phù hợp.";
export const restrictedGroups = [
  {
    title: "Pin & thiết bị điện tử",
    symbol: "battery",
    example: "Pin rời, sạc dự phòng, điện thoại, máy ảnh.",
    note: "Cần kiểm tra loại pin và cách đóng gói.",
  },
  {
    title: "Chất lỏng & bình xịt",
    symbol: "drop",
    example: "Nước hoa, bình xịt, chất dễ cháy.",
    note: "Có thể cần điều kiện vận chuyển riêng.",
  },
  {
    title: "Hàng dễ hỏng",
    symbol: "leaf",
    example: "Thực phẩm cần giữ lạnh, hàng dễ hỏng.",
    note: "Cần kiểm tra bảo quản và quy định nơi nhận.",
  },
  {
    title: "Hàng có giá trị cao",
    symbol: "gem",
    example: "Trang sức, đồng hồ, đồ cổ, tác phẩm nghệ thuật.",
    note: "Có thể cần giấy tờ hoặc chấp thuận riêng.",
  },
] as const;
export const restrictedChecklist = [
  "Link hoặc ảnh rõ sản phẩm",
  "Số lượng và thông tin trên nhãn",
  "Nước gửi và nước nhận",
  "Thông tin pin, dung tích hoặc cách bảo quản (nếu có)",
];
export const restrictedFaq = [
  {
    question: "Hàng hạn chế có mua hộ được không?",
    answer:
      "Có thể, nhưng cần kiểm tra từng sản phẩm và tuyến gửi. Gửi yêu cầu không có nghĩa là món hàng đã được chấp nhận.",
  },
  {
    question: "Không thấy món của mình trong danh sách?",
    answer:
      "Bạn vẫn có thể gửi link hoặc ảnh để nhờ kiểm tra. Đây là ví dụ thường gặp, không phải danh sách đầy đủ.",
  },
  {
    question: "Cần giấy tờ gì?",
    answer:
      "Tùy sản phẩm và nơi nhận. Nhân viên sẽ cho biết thông tin cần bổ sung sau khi xem yêu cầu.",
  },
];
export const restrictedBody = [
  restrictedIntro,
  "Những món nên hỏi trước",
  ...restrictedGroups.map((g) => `${g.title}: ${g.example} ${g.note}`),
  "Bạn cần gửi gì?",
  ...restrictedChecklist,
  ...restrictedFaq.map((f) => `${f.question}\n${f.answer}`),
].join("\n\n");

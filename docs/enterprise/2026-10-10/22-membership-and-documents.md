# Membership, chứng từ và lịch sử phát hành

SatsunicGo • Phiên bản 1.1 • 10/10/2026

## Gói và quyền lợi

Membership có plan, subscription, invoice và lịch sử riêng. Quyền lợi áp dụng theo bản chụp của gói, không tính lại lịch sử từ gói mới. Giảm phí không mặc nhiên là giảm tiền hàng; phải đúng nhóm phí, tỷ lệ và mức trần được phép.

Các action gồm mua, xác nhận, cấp quyền lợi, hủy gia hạn, yêu cầu gia hạn và hủy hóa đơn membership. Xác nhận thuộc quyền finance/chủ sở hữu; cấp quyền lợi thuộc chủ sở hữu. Hành động nhạy cảm kiểm recent MFA theo hàm xử lý.

## Tiền và gia hạn

Biên nhận membership không tự thay khoản thu order. Mã ngân hàng, bằng chứng và số tiền phải khớp hồ sơ được xác nhận. Hủy gia hạn chưa đồng nghĩa xóa kỳ hiện tại hoặc hoàn tiền. Mốc bắt đầu/kết thúc phải hợp lệ và không tràn giới hạn số.

Thông báo gia hạn phụ thuộc worker, chính sách và nhà cung cấp thực tế. Có tác vụ được tạo chưa chứng minh email đã gửi.

## Chứng từ nội bộ

`SalesDocument` hiện là `internal_statement`, có trạng thái bản nháp, issued hoặc void. Không gọi mặc nhiên là hóa đơn điện tử hợp pháp. Snapshot giữ người bán, phiên bản, người mua, dòng hàng, tổng, tiền thu/hoàn, số dư và điều khoản.

Làm mới bản nháp khác sửa bản đã phát hành. Lịch sử issued phải giữ; đổi order hoặc người bán config không tự viết lại chứng từ. Hủy cần lý do và quyền phù hợp.

## Chia sẻ và gửi

Mã chia sẻ có phạm vi riêng và có thể thu hồi. Hàm chia sẻ giới hạn dữ liệu chứng từ, không trả danh tính khách hoặc ID đơn theo thiết kế hiện tại. Không ghi token vào log/demo.

QueueEmail chưa có nghĩa thư đã đến. Nếu đọc lại lỗi sau commit, kiểm chứng từ đã tạo trước khi tạo mới. Nghiệm thu cần bao gồm gia hạn đồng thời, bản nháp cũ, issue trùng, revoke share và email chưa rõ kết quả.

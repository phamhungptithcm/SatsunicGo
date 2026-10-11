# Vận chuyển, gom kiện và theo dõi giao hàng

SatsunicGo • Phiên bản 1.1 • 10/10/2026

## Đơn, kiện và lô

Order giữ nghĩa vụ thương mại. Parcel giữ kiện vật lý và phân bổ tới các dòng đơn. Lô gom nhóm việc gửi/chi phí theo quy trình. Khách không được xem toàn bộ bảng kê của các khách khác trong cùng kiện hoặc lô.

## Cước và tiền

Phân bổ cước dùng số nguyên, phần dư xác định và bảo toàn tổng. Không chia bằng số thực rồi làm tròn từng phần gây lệch. Cước nội bộ khác khoản khách đã chấp nhận.

Đơn niêm yết không tăng trách nhiệm vì cước nội bộ đổi. Đơn riêng dùng tổng cuối và approval theo đường riêng. Khi dữ liệu ảnh hưởng tổng thay đổi, phê duyệt cũ phải được xử lý đúng trước dispatch.

## Điều kiện gửi và giao

Xuất gửi kiểm trạng thái, đóng gói, hold, phê duyệt và khoản thu trừ đã hoàn/phần dành hoàn. Với batch, mọi đơn liên quan phải đạt. Một đơn thiếu tiền không được che bởi các đơn khác đã đạt.

Các trạng thái kiện gồm packed, in_transit, delivered, failed, returned. `fullyDelivered` cộng lượng đã giao theo từng dòng. Một kiện giao xong không tự hoàn tất phần chưa giao.

## Dự kiến và chia sẻ

Dự kiến thủ công giữ nguồn nhân viên, khoảng bắt đầu/kết thúc và thời điểm ghi. Khoảng phải hợp lệ; thời điểm ghi không vượt thời điểm quan sát. Dữ liệu thiếu/sai trở về chưa có dự kiến, không tự dựng ngày.

Theo dõi qua mã chia sẻ kiểm thời hạn, mã đang hoạt động, khóa chủ đơn và phần dữ liệu giới hạn. Mã là quyền truy cập; tránh đưa vào log, analytics hoặc demo thật. Số tracking nhập tay không chứng minh tích hợp tự động với hãng vận chuyển.

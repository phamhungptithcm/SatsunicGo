# Thông báo và lựa chọn liên lạc

SatsunicGo • Phiên bản 1.1 • 10/10/2026

## Các mục đích riêng

Các topic hiện gồm `orderEmail`, `promotionsEmail`, `orderSms`. Đồng ý email đơn hàng không tự đồng ý quảng cáo; email không tự đồng ý SMS. Analytics là mục đích riêng nữa.

Mỗi topic giữ yêu cầu đăng ký, generation và generation đã xác nhận. Khi địa chỉ hoặc lựa chọn đổi, xác nhận cũ không cấp quyền cho người nhận mới. Trạng thái off, pending và active có ý nghĩa khác nhau.

## Lưu và xác nhận

Thao tác có mã chống trùng và phiên bản. Tác vụ confirm/welcome gắn topic, generation và mã băm đích nhận. Tiến trình gửi phải kiểm chúng còn hiện hành. Tài khoản locked không tiếp tục thao tác hoặc nhận thư trái chính sách.

SMS có interface nhưng chưa khả dụng khi chưa có nhà cung cấp được duyệt/cấu hình. Không giới thiệu một interface như dịch vụ production đã hoạt động.

## Gửi và đối soát

Tác vụ được kiểm nội dung, người nhận, chính sách và trạng thái trước khi nhận xử lý. Kết quả phân biệt nhà cung cấp tiếp nhận, từ chối, hoãn và chưa xác định. Tiếp nhận không chứng minh inbox hoặc đã đọc.

`outboxCommand` tách retry và resolveUnknown. Xử lý unknown cần bằng chứng xác nhận đã gửi/chưa gửi. Không đổi unknown thành failed bằng phỏng đoán rồi gửi lại. Giới hạn số lần và tuổi tác vụ phải được giữ.

## Nội dung và nghiệm thu

Thư nói đúng sự kiện, số tiền và bước tiếp theo. Không lộ notes nội bộ, dữ liệu khách khác hoặc thông tin thừa. Thư quảng cáo có mục đích và điều kiện riêng.

Thử rút lựa chọn, đổi người nhận, generation cũ, token hết hạn, tác vụ trước mốc áp dụng, khóa chủ sở hữu và timeout sau nhà cung cấp tiếp nhận. Kiểm cả kết quả bên ngoài lẫn trạng thái dữ liệu.

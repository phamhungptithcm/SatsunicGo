# Yêu cầu mua hộ, báo giá và tìm nguồn

SatsunicGo • Phiên bản 1.1 • 10/10/2026

## Tiếp nhận yêu cầu

Request chứa market, từ 1 đến 30 dòng hàng và ghi chú. Mỗi dòng có tên, lượng, biến thể, URL tùy chọn và điều kiện hàng khi được cung cấp. URL chỉ chấp nhận HTTP/HTTPS. Ngân sách và ngày mong muốn do khách đưa ra chưa phải cam kết được doanh nghiệp chấp nhận.

Nhân viên kiểm sản phẩm thực, người bán, khả năng mua và giới hạn vận chuyển. AI có thể chuẩn bị thông tin; người có thẩm quyền vẫn quyết định nghiệp vụ.

## Báo giá theo phiên bản

Báo giá gồm tiền hàng, phí, chi phí nguồn, vận chuyển, giảm giá, tiền nguồn, tỷ giá, điều khoản, hạn và thông tin xác minh sản phẩm. Máy chủ đối chiếu chính sách giá đang hiệu lực. USD/JPY/KRW phải khớp thị trường US/JP/KR.

Chấp thuận gắn phiên bản báo giá và điều khoản. Báo giá mới không dùng chấp thuận cũ. Khoản đầu trên đường này là 50% làm tròn lên theo hàm hiện tại; phần còn lại dựa trên tổng cuối và khoản thu ròng.

## Thanh toán trước trong giỏ

Bản nháp thuộc khách hiện tại và dòng hàng phải khớp giỏ. Máy chủ tính từ giá nguồn, tỷ giá và phí dịch vụ, rồi giữ trong dữ liệu `upfront`. Khoản đầu bằng tổng checkout; order còn bước tìm nguồn.

Mã nguồn có cơ chế điều chỉnh và khoản trả thêm riêng. Sự hiện diện đó không cấp quyền nâng giá tùy ý hoặc coi khách đã đồng ý mọi phát sinh. Cần đúng approval và điều khoản của từng trường hợp.

## Ngoại lệ và bàn giao

Hết hàng, đổi giá hoặc thiếu variant cần hồ sơ và đề nghị xử lý. Không ghi đã mua khi mới liên hệ người bán. Thay thế/hủy dùng quy trình tương ứng, giữ bản chụp dữ liệu lịch sử. Bàn giao ghi đơn/phiên bản, dòng cần mua, nguồn đã kiểm và các khoản/hold còn mở; người nhận đọc lại trạng thái trước khi làm.

# Yêu cầu nghiệp vụ

SatsunicGo • Phiên bản 1.1 • 10/10/2026

## Sản phẩm và phạm vi

SatsunicGo quản lý hoạt động mua hộ xuyên biên giới cho một doanh nghiệp. Khách chọn sản phẩm hoặc gửi yêu cầu; nhân viên kiểm tra nguồn hàng, xử lý giá, đối soát tiền, mua hàng, tiếp nhận tại kho và tổ chức giao. Hệ thống lưu quyết định, lịch sử và dữ liệu theo quyền của từng vai trò.

Thư viện nghiệp vụ hiện có ba thị trường US, JP và KR. Khoản thu được tính bằng VND; số tiền nguồn và tỷ giá được lưu khi cần. Thị trường mua không đồng nghĩa nơi sản xuất. Phạm vi hiện tại chưa chứng minh mô hình SaaS nhiều doanh nghiệp dùng chung với dữ liệu tách biệt theo tenant.

## Ba đường mua hàng

Hàng niêm yết có giá đặt mua chính thức. Khách chọn đúng biến thể, số lượng và thanh toán toàn bộ. Đơn giữ nguyên bản chụp giá và điều khoản đã chấp nhận.

Yêu cầu riêng qua báo giá được nhân viên kiểm tra và báo giá theo phiên bản. Sau khi chấp nhận, khách thanh toán khoản đầu; phép tính hiện tại là 50% làm tròn lên. Phần còn lại được tính sau khi chốt tổng cuối.

Yêu cầu riêng thanh toán trước trong giỏ dùng thông tin giá nguồn cùng chính sách được duyệt. Khoản đầu bằng tổng tính tại checkout. Mã nguồn có bước tìm nguồn và điều chỉnh riêng; không áp quy tắc 50% của đường báo giá cho trường hợp này.

## Yêu cầu bắt buộc

Giá và trạng thái tiền phải do máy chủ quyết định. Khách chỉ xem dữ liệu thuộc quyền của mình. Nhân viên thực hiện đúng vai trò hiện tại; tài khoản bị khóa không tiếp tục thao tác. Gửi lại cùng một yêu cầu sau mất kết nối không được tạo khoản thu, đơn hoặc chứng từ trùng.

Mua hàng và xuất gửi phụ thuộc trạng thái, tiền khả dụng và các điều kiện giữ đơn. Một kiện đã giao chưa đủ kết luận toàn bộ đơn đã hoàn tất. Lựa chọn nhận email đơn hàng, quảng cáo, SMS và analytics phải được quản lý đúng mục đích.

## Nội dung cần quyết định

Chủ sản phẩm cần thống nhất cách công bố ba chính sách mua, biểu phí, điều kiện hoàn/đổi, trách nhiệm vận chuyển và phạm vi hỗ trợ. SLA, tải đồng thời, RPO/RTO và thời hạn lưu dữ liệu phải có mục tiêu được duyệt và bằng chứng đo. Các tiêu chí trong bảng là yêu cầu nghiệm thu; nhiệm vụ tài liệu chưa thực thi các kiểm thử đó.

## Bảng tham chiếu chi tiết

| ID | Yêu cầu | Tiêu chí nghiệm thu đề xuất | Nguồn |
| --- | --- | --- | --- |
| BR-01 | Khách chỉ truy cập dữ liệu riêng theo quyền | Hai tài khoản không đọc/sửa chéo đơn, địa chỉ, hội thoại, receipt | Rules; auth/guards; customer-order-tracking |
| BR-02 | Mỗi luồng thu tiền đúng policy | Catalog đủ toàn bộ; quote có khoản đầu đúng; upfront dùng snapshot riêng | domain/catalog-checkout; domain/purchase-checkout; domain/index |
| BR-03 | Không ghi nhận thanh toán từ redirect | Callback/readback hợp lệ mới phân bổ; duplicate không tăng collected | payments/payos; purchase-sepay; purchase-settlement |
| BR-04 | Mua/xuất hàng theo tiền khả dụng và trạng thái | Hold, thiếu tiền hoặc allocation sai chặn thao tác; batch kiểm tra từng đơn | domain/index; shipping; consolidation |
| BR-05 | Khôi phục sau timeout không tạo trùng | Replay cùng operationId trả cùng kết quả; payload khác bị từ chối | index; purchase-checkout |
| BR-06 | Nhân viên xử lý đúng quyền hiện tại | Role bị thu hồi/locked bị chặn ở server, không dựa riêng UI | auth/guards; workspace |
| BR-07 | Khách hiểu tiến độ theo kiện | Giao một phần không đồng nghĩa toàn bộ hoàn tất; ETA thiếu phải hiển thị chưa có | customer-order-tracking; domain/order-tracking |
| BR-08 | AI hỗ trợ có kiểm soát | Không tự xác nhận tiền/mua/xuất hàng; hành động có confirmation và guard | ai/ask; ai/ask-workflow; domain/chat-action |
| BR-09 | Liên lạc đúng mục đích và recipient | Consent đúng purpose, recipient xác minh, unknown không resend mù | notification-preferences-service; subscription-delivery-service |
| BR-10 | Release có thể truy vết | Hash artifact, provider readback, rollback posture và acceptance gắn candidate | release.yml; scripts/release |

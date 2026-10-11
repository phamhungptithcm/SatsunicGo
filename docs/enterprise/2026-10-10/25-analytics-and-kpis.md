# Analytics và định nghĩa chỉ số

SatsunicGo • Phiên bản 1.1 • 10/10/2026

## Nguồn sự kiện

Nguồn có analytics phía ứng dụng và các sự kiện/bản tổng hợp phía máy chủ. Lựa chọn analytics độc lập với thông báo và quảng cáo. Có dashboard chưa chứng minh số liệu hiện tại đầy đủ hoặc là dữ liệu production.

Click trên trình duyệt, tạo checkout, xác minh khoản thu, giao hàng và hoàn tất đơn là các mốc khác nhau. Báo cáo phải phân biệt chúng, không gọi chung là chuyển đổi.

## Định nghĩa và kỳ đo

Mỗi chỉ số cần phạm vi, kỳ, đơn vị, nguồn và quy tắc loại trùng. GMV khác doanh thu; tiền đã thu không tự là doanh thu ghi nhận. Tỷ lệ mua lại cần nhóm khách cùng kỳ và thời gian quan sát. Thời gian xử lý cần hai mốc rõ.

Truy vấn có giới hạn không đại diện toàn bộ lịch sử. Phải xét múi giờ, độ trễ sự kiện, dữ liệu đến muộn và các khoản sửa/hoàn. Không biến truy vấn lỗi, thiếu quyền hoặc dữ liệu chưa đồng bộ thành số 0.

## Đối chiếu

Quy trình đề xuất: duyệt định nghĩa, chọn nguồn chính thức, loại trùng đúng ID, kiểm trạng thái/thời gian, đối chiếu mẫu với order/ledger rồi lưu phiên bản truy vấn và người duyệt. Liên kết analytics với order không cấp quyền đọc order cho người khác.

## Báo cáo sử dụng

Báo cáo vận hành theo dõi hàng đợi, hold, khoản chưa rõ kết quả và sai lệch kho. Báo cáo đầu tư cần định nghĩa doanh thu, nhóm khách, tiền tệ và bằng chứng gốc. Screenshot dashboard không phải chứng cứ duy nhất.

Nhiệm vụ này chưa có dữ liệu doanh thu, nhóm khách hoặc lưu lượng thực được xác minh. Bảng dưới là định nghĩa cần thống nhất, không phải số liệu đã đạt.

## Bảng tham chiếu chi tiết

| Chỉ số | Định nghĩa cần thống nhất | Điểm dễ nhầm |
| --- | --- | --- |
| GMV | Giá trị hàng/giao dịch theo phạm vi order và kỳ đã chọn | Không mặc nhiên bằng doanh thu doanh nghiệp |
| Revenue | Khoản doanh thu theo chính sách ghi nhận đã duyệt | Không cộng toàn bộ tiền mua hộ thành revenue |
| Gross margin | Revenue trừ cost of goods/services theo mô hình kế toán | Không bỏ provider fee, logistics hoặc refund tùy cách hạch toán |
| Contribution margin | Phần còn lại sau các chi phí biến đổi được quy định | Phải công bố danh mục cost và kỳ |
| Repeat rate | Tỷ lệ khách có đơn lặp theo cohort và observation window | Không trộn khách mới chưa đủ thời gian quan sát |
| Completion rate | Completed orders trên tập order được định nghĩa | Không loại failed/cancelled tùy tiện để tăng tỷ lệ |
| Order cycle time | Khoảng thời gian giữa hai milestone đã quy định | Delivered, confirmed receipt và completed có thể khác |
| Refund/dispute rate | Count hoặc amount theo mẫu số và kỳ xác định | Không trộn hồ sơ pending với khoản đã hoàn |

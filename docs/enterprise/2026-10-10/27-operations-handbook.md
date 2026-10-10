# Sổ tay vận hành thường ngày

SatsunicGo • Phiên bản 1.1 • 10/10/2026

## Đầu ca

Xác minh môi trường, phiên đăng nhập và quyền. Kiểm công việc chờ: hold, khoản thu chưa đối soát, kết quả nhà cung cấp chưa rõ, hồ sơ hoàn, hàng thiếu/nhầm và kiện có vấn đề. Ghi người đang xử lý để tránh hai người thực hiện cùng việc vật lý.

Danh sách giới hạn không có nghĩa toàn hệ thống hết việc. Dashboard lỗi không có nghĩa hàng đợi rỗng. Không đặt lại dữ liệu để làm mất trạng thái bất thường.

## Tiền, mua và kho

Finance đọc order hiện tại, đối chiếu ngân hàng/nhà cung cấp, mã tham chiếu, số tiền và ngữ cảnh rồi mới xác nhận. Nếu chưa rõ, giữ hồ sơ đối soát. Sau lỗi đọc lại, kiểm kết quả lần gửi trước khi tạo thao tác mới.

Buyer kiểm tiền khả dụng, hold và từng dòng còn cần mua. Warehouse đối chiếu lượng thực, variant và tình trạng. Hàng thiếu/hỏng cần bằng chứng và quyết định riêng; không ghi đủ để chuyển bước.

Trước xuất, kiểm allocations, cân nặng, tuyến và mọi order liên quan. Đóng kiện không cấp quyền gửi khi tiền/hold đổi. Batch dùng đúng đường xử lý batch.

## Hỗ trợ và email

Support dùng dữ liệu được phép và nói đúng mốc đã xác minh. Thay đổi tiền/đơn phải qua quy trình, không thay bằng lời hứa trong chat. Giữ notes nội bộ và dữ liệu khách khác ở đúng phạm vi.

Failed có thể được thử lại khi đủ điều kiện; unknown cần đối soát. Kiểm người nhận, lựa chọn, chính sách và số lần trước khi gửi. Không sửa số lần thử để ép mở lại tác vụ.

## Cuối ca và thẩm quyền

Bàn giao ID, phiên bản, việc đã làm, bằng chứng và quyết định đang chờ. Người nhận đọc lại trạng thái. Tách đã kiểm, đã ghi nhận và hoàn thành.

Sửa dữ liệu production, hoàn thực, IAM/secrets, xóa khách và triển khai theo thẩm quyền riêng. Runbook không thay approval. Các bước vận hành trong chương này là quy trình đề xuất, cần được duyệt trước áp dụng dữ liệu thật.

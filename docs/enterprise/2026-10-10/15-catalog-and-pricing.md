# Danh mục sản phẩm, biến thể và giá

SatsunicGo • Phiên bản 1.1 • 10/10/2026

## Từ nội dung tới đặt mua

Sản phẩm công khai chưa chắc được đặt mua trực tiếp. Catalog checkout yêu cầu published, `orderable=true`, `listedPrice` dương, phiên bản và điều khoản hợp lệ. Giá tham khảo không thay thế giá đặt mua.

Biến thể phải thuộc lựa chọn đã cấu hình. Nếu sản phẩm không có lựa chọn, khách không tự thêm một variant bất kỳ. Số lượng nằm trong giới hạn schema; tổng sau phép nhân vẫn phải qua kiểm tra tiền.

## Giá và lịch sử

Bản chụp đơn giữ sản phẩm, phiên bản, tên, biến thể, đơn giá, lượng, tổng và điều khoản. Khi listing đổi trước khi chốt, hệ thống phải phát hiện hoặc tính lại theo đúng contract. Sau khi order hình thành, giá mới không tự viết lại lịch sử.

Đơn niêm yết có thể bắt đầu tại `QUOTE_ACCEPTED` theo hàm tạo đơn. Tên trạng thái không có nghĩa nhân viên vừa báo giá một yêu cầu riêng; giao diện phải đọc đúng loại đơn.

## Nội dung và tìm kiếm

Thị trường nguồn khác xuất xứ sản xuất. Link nguồn không bảo đảm người bán giữ giá hoặc còn hàng. Ảnh công khai cần kiểm trạng thái xuất bản của đối tượng cha; không để URL cũ mở nội dung đã chuyển riêng.

Kết quả tìm kiếm có giới hạn hoặc phân trang không đủ kết luận toàn bộ danh mục không có sản phẩm. Đặt lại từ lịch sử phải dùng listing hiện hành, không tạo khoản thu mới từ số tiền cũ.

## Nghiệm thu

Thử sản phẩm chưa xuất bản, không orderable, thiếu listedPrice, variant sai, phiên bản cũ và tổng vượt giới hạn. Kiểm lịch sử sau khi sửa listing, đường ảnh sau rút xuất bản và kết quả tìm kiếm ngoài cửa sổ hiện tại.

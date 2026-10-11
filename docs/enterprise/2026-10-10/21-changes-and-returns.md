# Thay thế, hủy, trả hàng và ngoại lệ

SatsunicGo • Phiên bản 1.1 • 10/10/2026

## Đề nghị thay đổi

Hồ sơ thay đổi tách đề nghị, chấp nhận, từ chối và áp dụng. Nó giữ loại thay đổi, lý do, điều khoản, các dòng ảnh hưởng, tổng phải trả, chi phí thực và bằng chứng. Khách chấp nhận một đề nghị không có nghĩa đồng ý mọi thay đổi sau đó.

Các loại hiện có là thay thế, hủy một phần, hủy toàn bộ và trả hàng. Thay thế không dùng để âm thầm đổi lượng. Hủy một phần không được dùng cho toàn bộ đơn. Một dòng không lặp trong cùng đề nghị; phiên bản phải còn đúng trước khi áp dụng.

## Điều kiện theo tiến độ

Số đã mua được xét theo dòng. Không thay tên/biến thể của hàng đã mua bằng đường xử lý dành cho phần chưa mua. Hủy trước mua và trả sau nhận có chi phí và bằng chứng khác nhau.

Đơn niêm yết không được nâng tổng vượt bản chụp gốc theo guard hiện tại. `finalPayable` không thấp hơn `actualCosts` trong kiểm tra proposal. Không suy từ tên action rằng toàn bộ tiền sẽ được hoàn tự động.

## Nhận và kiểm hàng trả

Hồ sơ giữ lượng được phép trả, đã nhận, chấp nhận và hỏng. Nhận không vượt lượng được phép; kiểm không vượt lượng đã nhận/chưa kiểm. Đóng cần mọi dòng đã nhận đủ và đã phân loại đủ.

WAREHOUSE có thể nhận/kiểm theo quyền; đóng thuộc OWNER hoặc OPERATIONS_MANAGER trong hàm hiện tại. Đóng kiểm tra vật lý không tự tạo khoản hoàn hoặc tháo hold tài chính. Finance đối soát riêng.

## Vận hành và nghiệm thu

Quy trình đề xuất đi từ nguyên nhân, điều khoản và tiến độ tới đề nghị, quyết định, áp dụng, xử lý hàng rồi xử lý tiền. Giữ riêng các việc còn chờ. Kiểm các tình huống phiên bản cũ, sai chủ đơn, lượng vượt, dòng lặp, hàng đã mua và xung đột với xuất gửi/hoàn tiền.

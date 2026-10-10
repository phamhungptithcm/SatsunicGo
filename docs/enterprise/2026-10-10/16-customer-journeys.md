# Hành trình khách hàng và trạng thái giao diện

SatsunicGo • Phiên bản 1.1 • 10/10/2026

## Chuẩn bị đơn

Khách bắt đầu từ danh mục hoặc yêu cầu riêng. Giỏ chứa lựa chọn đang chuẩn bị; bản xem trước chứa kết quả máy chủ tính; checkout chứa lần chốt theo hợp đồng. Ba đối tượng không được dùng thay nhau.

Trước xác nhận phải hiện đúng món, biến thể, lượng, địa chỉ và khoản phải trả. Nếu cước hoặc ETA chưa xác định, giữ trạng thái đó. Không dùng số 0 hoặc ngày tự tạo để làm đầy màn hình.

## Đăng nhập và dữ liệu riêng

Đăng nhập không nên làm mất bản nháp hợp lệ. Nhưng khi đổi tài khoản, không tự gửi bản nháp của định danh cũ. Chủ sở hữu và phiên bản phải được kiểm lại. Thông tin người nhận được lưu theo đường nghiệp vụ riêng, không đưa vào chat như cách lưu địa chỉ.

Khóa tài khoản hoặc lỗi quyền khác danh sách trống. Dừng ghi và xóa phần dữ liệu không còn được truy cập. Không tiếp tục submit bằng dữ liệu thiếu sau một lỗi đọc.

## Chưa rõ kết quả

Phân biệt chưa gửi, đã bị từ chối rõ và chưa biết máy chủ đã thực hiện hay chưa. Khi chưa rõ, giữ cùng mã thao tác để đọc trạng thái hoặc nhận lại kết quả. Không mời tạo thanh toán mới trước khi xác định lần cũ.

Pending command trong sessionStorage chỉ thuộc phạm vi tab/phiên hiện tại; không phải đồng bộ đa thiết bị.

## Sau đặt hàng

Deep link đơn được đọc theo quyền riêng, không phụ thuộc trang danh sách đầu. Kiện giao một phần không hoàn tất toàn đơn. Số tiền đã thu, chờ kiểm tra, hoàn và còn phải trả phải giữ đúng nghĩa.

Nhãn thao tác gọi đúng kết quả; thông báo lỗi nêu việc xảy ra và bước tiếp theo. Bàn phím, focus, nhãn trường và công nghệ hỗ trợ cần được kiểm trong ngữ cảnh thực tế.

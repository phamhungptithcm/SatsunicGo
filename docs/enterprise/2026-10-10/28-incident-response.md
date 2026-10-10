# Sự cố và khôi phục dịch vụ

SatsunicGo • Phiên bản 1.1 • 10/10/2026

## Ưu tiên và trách nhiệm

Sự cố tiền, lộ dữ liệu, sai quyền hoặc xuất hàng trái điều kiện cần được ưu tiên theo tác động. Mức độ không chỉ dựa số lỗi HTTP. Chủ dịch vụ xác định mức sự cố, người chỉ huy, phản hồi và đầu mối; hồ sơ này chưa chứng minh một lịch trực đang hoạt động.

## Trình tự đề xuất

Xác minh triệu chứng và môi trường. Giữ nguồn/gói, mốc thời gian và ID tương quan đã loại dữ liệu nhạy cảm. Xác định phần ảnh hưởng và thao tác đã xảy ra. Chọn biện pháp nhỏ nhất có thẩm quyền, giữ bằng chứng rồi kiểm trạng thái sau xử lý.

Khôi phục phải xét dữ liệu, gói và tác vụ bên ngoài. Đối soát kết quả chưa rõ trước tiếp tục gửi/thu. Sau ổn định, ghi nguyên nhân, yếu tố góp phần, sửa đổi, kiểm thử và người chịu trách nhiệm việc còn lại.

## Các tình huống trọng yếu

Checkout mất phản hồi: tìm cùng lần gửi, không yêu cầu tạo thanh toán mới trước khi biết kết quả cũ. Lỗi quyền: kiểm callable, Rules, dữ liệu trả, cache và media; sửa một lớp chưa chắc chặn tất cả.

Email tồn đọng khác poison job hoặc unknown send. Không gửi lại hàng loạt để giải quyết mọi trường hợp. Kiểm người nhận, generation, attempt và kết quả nhà cung cấp.

Release thất bại có thể thay một phần môi trường. Kiểm Hosting/Functions đang chạy, tương thích dữ liệu và giao dịch đang bay trước chạy lại/quay về.

## Thông báo và rút kinh nghiệm

Thông báo chỉ nêu trạng thái đã xác minh, ảnh hưởng và việc đang làm. Không hứa thời gian chưa có cơ sở. Postmortem tập trung điều kiện hệ thống và cách ngăn tái diễn; mỗi việc có người phụ trách, bằng chứng và kiểm lại.

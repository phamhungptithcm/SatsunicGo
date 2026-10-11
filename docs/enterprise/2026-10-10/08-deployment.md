# Triển khai và quay về phiên bản trước

SatsunicGo • Phiên bản 1.1 • 10/10/2026

## Quy trình phát hành trong nguồn

Workflow hiện chạy kiểm tra chất lượng, tạo gói phát hành, triển khai và đọc lại kết quả từ nhà cung cấp trước khi công bố release. Gói được gắn mã nguồn, manifest và checksum. Khi chạy lại một bản nháp đã có gói, quy trình có cơ chế dùng lại gói cũ thay vì build lại.

Hosting và Functions phải thuộc cùng một bản phát hành. Build giao diện tạo manifest tài nguyên công khai; Functions sử dụng manifest tương ứng. Không sửa tay tệp sinh tự động hoặc triển khai Hosting riêng khi làm lệch hợp đồng này.

## Phạm vi triển khai

Lệnh trong quy trình hiện chọn `functions:satsunicgo,hosting`. Bước đó không xác nhận Rules, chỉ mục hoặc Storage đã được cập nhật. Nếu thay các tài nguyên này, cần kế hoạch triển khai và bằng chứng riêng.

Trước phát hành cần chốt nguồn/gói, phê duyệt phạm vi, kiểm cấu hình và quyền, chạy các kiểm thử bắt buộc, đánh giá backup và phương án quay về. Sau triển khai cần so sánh tài nguyên đang chạy với gói đã duyệt và kiểm hành trình đăng nhập, quyền truy cập, thanh toán và dữ liệu khách.

## Triển khai chưa hoàn tất

Một job thất bại có thể đã thay đổi một phần production. Cần kiểm kê phiên bản Hosting, các revision Functions và giao dịch đang xử lý trước khi chạy lại. Không suy trạng thái từ kết quả job duy nhất.

Quay về mã cũ không làm giao dịch ngân hàng hoặc email đã gửi quay ngược. Phải giữ sổ giao dịch, biên nhận, nhật ký và mã chống trùng; kiểm khả năng tương thích dữ liệu trước khi đổi code. Dùng gói cũ có checksum, không build lại một branch cũ rồi coi đó là gói đã chạy.

## Hồ sơ phát hành

Lưu mã nguồn, checksum gói, cấu hình không chứa bí mật, kết quả CI, biên nhận triển khai, so sánh Hosting/Functions, tình trạng Rules/chỉ mục, kiểm thử sau triển khai và quyết định về các kết quả chưa xác định. Nhiệm vụ tài liệu chưa chạy quy trình này trên môi trường thật.

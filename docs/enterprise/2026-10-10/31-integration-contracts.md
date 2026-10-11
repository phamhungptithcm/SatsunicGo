# Tích hợp với hệ thống ngoài

SatsunicGo • Phiên bản 1.1 • 10/10/2026

## Hợp đồng tích hợp

Mỗi adapter cần môi trường, schema, xác thực/chữ ký, mã chống trùng, timeout, thử lại, kết quả và đối soát. Provider có thể đã nhận lệnh dù ứng dụng mất phản hồi. Không gộp ghi database thành công với nhà cung cấp thành công thành một boolean.

## Thanh toán

payOS có tạo liên kết, webhook và đối soát trong nguồn. Amount/ngữ cảnh lấy từ máy chủ; return trên browser không đánh paid. Xác minh chữ ký vẫn phải kiểm đúng khoản, đơn và ngữ cảnh. Receipt trùng không tăng collected hai lần.

SePay tại entrypoint hiện giới hạn sandbox theo emulator và demo project. Các alias demo payment không phải tính năng production. Cần nghiệm thu merchant/callback/readback thực trước công bố khả năng thanh toán.

## Email và AI

Email cần sender/domain và chính sách hợp lệ. Kết quả tiếp nhận, từ chối, hoãn và chưa rõ được ánh xạ đúng trạng thái tác vụ. Email order, invoice và subscription có mục đích khác nhau; không dùng consent/recipient cũ tùy tiện. SMS chưa có nhà cung cấp được duyệt không phải tích hợp hoạt động.

AI, tri thức đã duyệt và tìm kiếm ngoài là các nguồn khác nhau. Nội dung web không trở thành chỉ dẫn nội bộ. Có quota, chính sách dữ liệu và đánh giá; search lỗi không kết luận catalog hoặc order không tồn tại.

## Điều kiện mở

Duyệt mục đích/dữ liệu, môi trường thử, secret binding, activation, hợp đồng lỗi/thử lại, duplicate/out-of-order, bằng chứng đối soát, hướng dẫn vận hành, giám sát và chuyển đổi/quay về. Có SDK hoặc endpoint 200 chưa đủ nghiệm thu.

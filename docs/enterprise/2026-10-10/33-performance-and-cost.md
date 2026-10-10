# Hiệu năng, tải và chi phí

SatsunicGo • Phiên bản 1.1 • 10/10/2026

## Mô hình tải

Đo riêng xem public/media, tìm catalog, sửa giỏ, preview/commit, tracking, nhân viên queues, finance và gửi nền. Tỷ lệ đọc/ghi, thời gian transaction và độ trễ nhà cung cấp khác nhau giữa các hành trình.

maxInstances/concurrency là cấu hình, không phải năng lực xử lý đo. Tài liệu quota/allocation hoặc dữ liệu dùng chung có thể gây tranh chấp. Cần đo với phạm vi được duyệt, không suy năng lực tải từ số instance.

## Chỉ số và thử tải

Theo dõi p50/p95/p99, lỗi theo nguyên nhân, transaction retries/aborts, tuổi hàng đợi/unknown, thời lượng/bộ nhớ Functions, đọc/ghi Firestore, lưu lượng Storage và usage nhà cung cấp. Mỗi chỉ số có kỳ, đơn vị và nguồn.

Bắt đầu baseline synthetic, tăng tải có giới hạn, quan sát điểm bão hòa và khả năng phục hồi khi hạ tải. Thêm burst tracking, tranh chấp checkout, backlog và nhà cung cấp chậm/lỗi. Kiểm tiền, order và allocations sau thử, không chỉ độ trễ.

Không chạy tải vào production hoặc tạo giao dịch/email thật khi chưa được phép. Emulator có ích cho correctness, không đại diện mạng, autoscaling hoặc billing production.

## Tối ưu và chi phí

Phân trang, chỉ mục, cache và dữ liệu tổng hợp cần giữ đúng quyền và nghĩa. Cache không quyết định giá theo chính sách cũ. Batch phải có giới hạn, chống trùng và atomicity phù hợp.

Chi phí gồm hạ tầng, nhà cung cấp, AI/email, vận hành nguồn/kho, hỗ trợ và refund/loss. GMV không đủ tính margin. Forecast tách giả định khỏi thực tế; SLA và cost/order chỉ công bố sau định nghĩa và đo được duyệt.

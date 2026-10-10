# Hồ sơ thẩm định và quyết định còn mở

SatsunicGo • Phiên bản 1.1 • 10/10/2026

## Các nhóm hồ sơ

Hồ sơ sản phẩm gồm yêu cầu, chức năng, quy tắc và demo. Hồ sơ kỹ thuật gồm kiến trúc, thiết kế, hợp đồng dữ liệu, cấu hình và triển khai. Hồ sơ chất lượng gồm kết quả kiểm thử, bảo mật, tải và phục hồi. Hồ sơ kinh doanh/pháp lý gồm doanh thu, khách hàng, chi phí, quyền sở hữu, giấy phép và điều khoản.

Nguồn có thể chứng minh implementation và hợp đồng tĩnh. Nó không chứng minh doanh thu, nhu cầu thị trường, quyền pháp nhân, trạng thái IAM hoặc hiệu quả vận hành thực tế. Các tài liệu đó phải được cung cấp từ đúng người sở hữu.

## Các quyết định trọng yếu

Thống nhất chính sách ba đường mua, cách công bố phí và khoản phát sinh, quy tắc hoàn/đổi, điều kiện hàng hạn chế và trách nhiệm vận chuyển. Chốt mô hình thương mại, phạm vi IP, hỗ trợ và chuyển giao. Định nghĩa KPI, ghi nhận doanh thu, SLA, RPO/RTO và các ngưỡng giám sát.

Mỗi quyết định cần người duyệt, ngày, cơ sở, phạm vi ảnh hưởng và phiên bản có hiệu lực. Chưa có quyết định mới nào về những nội dung này được tự tạo trong nhiệm vụ tài liệu.

## Chia sẻ hồ sơ

Slide tổng quan cần được duyệt nội dung thương mại trước khi sử dụng bên ngoài. Thiết kế, inventory, bằng chứng và báo cáo nội bộ được chia sẻ theo phạm vi thẩm định phù hợp. Loại bí mật, thông tin khách, mã chia sẻ và log chưa làm sạch.

Việc có một thư mục data room không chứng minh NDA hoặc quyền chia sẻ đã thiết lập. Người phụ trách kiểm tra bên nhận, mục đích, thời hạn và mức truy cập.

## Điều kiện dùng ký kết

Phiên bản hồ sơ phải khớp nguồn/gói được cung cấp. Số liệu kinh doanh có căn cứ; claim bảo mật, SLA và tích hợp có bằng chứng. Rủi ro còn lại được ghi trong nghiệm thu và điều khoản, không chỉ đặt ở một phụ lục khó thấy.

## Bảng tham chiếu chi tiết

| Nhóm | Hồ sơ cần cung cấp | Hiện trạng nhiệm vụ | Owner đề xuất |
| --- | --- | --- | --- |
| Product | BRD, functional spec, rules, demo plan | Có bản source-based trong bộ này | Product |
| Engineering | HLD, DDD, inventories, source manifest | Có mô tả snapshot; cần engineering sign-off | Engineering |
| Quality | Current tests, coverage risks, adverse journeys | Có acceptance matrix; execution NOT_RUN | QA |
| Security | Threat model, access review, SBOM, scan/pen test | Cần evidence riêng; NOT_VERIFIED | Security |
| Operations | Live inventory, monitoring, incident, backup/restore | Có hướng dẫn mục tiêu; live/DR NOT_VERIFIED | Operations |
| Payments/email | Provider activation, callback/readback, reconciliation | Cần current candidate acceptance | Finance / Engineering |
| Legal/IP | Company ownership, IP assignment, license scan, privacy/terms | TODO(owner); không suy ra từ repo | Legal / Founder |
| Business | Customers, contracts, cohorts, GMV/revenue/cost evidence | TODO(owner); không có số liệu xác minh | Finance / Founder |
| Investment | Cap table, ask, runway, financial plan | TODO(owner); không tự ước lượng | Founder |
| Transfer | Support terms, migration, training, access transition | Proposal scope cần duyệt | Delivery |

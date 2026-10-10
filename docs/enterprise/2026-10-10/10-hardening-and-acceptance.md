# Củng cố hệ thống và nghiệm thu chất lượng

SatsunicGo • Phiên bản 1.1 • 10/10/2026

## Phạm vi kiểm tra

Củng cố hệ thống cần bao gồm đường thông thường, dữ liệu sai, thiếu quyền, xử lý đồng thời, mất phản hồi và lỗi phụ thuộc. Với SatsunicGo, các rủi ro trọng yếu là đọc chéo khách, ghi tiền trùng, phân bổ hàng trùng, xuất gửi thiếu điều kiện và liên lạc sai người hoặc sai mục đích.

Bảng H-01 đến H-20 xác định tình huống, kết quả cần có và lớp bằng chứng. Các ca chưa được chạy trong nhiệm vụ tài liệu. Kết quả lịch sử chỉ tham khảo; cần chạy trên nguồn/gói và môi trường hiện tại trước nghiệm thu.

## Điều kiện trước vận hành doanh nghiệp

Các hành trình có tác động lớn cần bằng chứng quyền, tiền và số lượng đúng. Tích hợp phải có nghiệm thu thực với nhà cung cấp khi phạm vi yêu cầu. Cấu hình, IAM, Rules và khả năng phục hồi phải được xác minh; có đầu mối sự cố và phương án quay về.

Kiểm thử bảo mật, tải, phục hồi và trải nghiệm là những lớp khác nhau. Build thành công hoặc HTTP 200 không thay thế các lớp này. Không có finding trong một nhóm kiểm tra chưa đủ kết luận hệ thống không còn vấn đề.

## Giám sát và bằng chứng

Theo dõi tuổi hàng đợi, khoản thanh toán chưa rõ, lỗi nhà cung cấp, xung đột phiên bản, hồ sơ tài chính và chênh lệch triển khai. Mã tương quan cần phục vụ điều tra nhưng không ghi bí mật, PII hoặc mã chia sẻ thô.

Mỗi ca có nguồn/gói, môi trường, dữ liệu thử, bước thực hiện, kết quả mong đợi, kết quả quan sát, thời điểm và bằng chứng đã làm sạch. Ca chưa chạy không tính đạt. Sau sửa phải kiểm lại và có đợt rà soát mới.

## Hồ sơ doanh nghiệp

Threat model, đánh giá truy cập, thư viện phụ thuộc, xử lý lỗ hổng, lưu giữ/xóa dữ liệu và ứng phó sự cố cần người phụ trách. Không suy ra chứng nhận SOC 2, ISO hoặc phạm vi tuân thủ chỉ từ công nghệ sử dụng.

## Bảng tham chiếu chi tiết

| ID | Rủi ro / ca kiểm thử | Kết quả bắt buộc | Mức ưu tiên / evidence |
| --- | --- | --- | --- |
| H-01 | Đọc/sửa order khác owner qua callable và Rules | Từ chối, không lộ nội dung/existence ngoài policy | P0; Rules + HTTP + UI |
| H-02 | Staff role revoked/locked sau mở màn hình | Server chặn mutation tiếp theo | P0; authenticated integration |
| H-03 | MFA stale/thiếu trong finance action | Chặn và yêu cầu xác thực phù hợp | P0; real auth acceptance |
| H-04 | Client sửa total, price version, variant | Giá server/snapshot; stale bị chặn | P0; domain + integration |
| H-05 | Double click, hai tab, mất response sau commit | Một kết quả authoritative, replay cùng identity | P0; concurrency harness |
| H-06 | Callback sai signature/context/amount; duplicate/reordered | Không ghi thu sai hoặc hai lần | P0; contract + sandbox provider |
| H-07 | Provider timeout sau nhận lệnh | Unknown được giữ và reconcile; không tạo lại mù | P0; fault injection/readback |
| H-08 | Refund đồng thời hoặc vượt available funds | Bảo toàn collected/refunded/reserved | P0; transactional tests |
| H-09 | Dispatch underfunded/held; batch có một đơn lỗi | Chặn cả scope cần thiết, không xuất trái policy | P0; batch integration |
| H-10 | Guest code expired/revoked/guessed/owner locked | Projection hạn chế, quota, không lộ PII | P0; HTTP + privacy review |
| H-11 | Consent withdraw/recipient đổi trong queue | Chặn stale delivery, không gửi sai mục đích | P0; worker race tests |
| H-12 | Unknown email accepted rồi response timeout | Reconcile, không resend tự động | P0; provider outcome fixture |
| H-13 | Prompt injection từ link/content/search | Không vượt command guards hoặc lộ dữ liệu riêng | P1; adversarial AI scenarios |
| H-14 | Upload sai mime/size, private media link, publication đổi | Reject hoặc deny theo current parent access | P1; Storage/HTTP tests |
| H-15 | Pagination, empty/partial data, ETA thiếu | Không biến unknown thành zero hoặc đã giao | P1; UI + data fixtures |
| H-16 | Offline, auth đổi, conflict, policy hết hạn | Recovery giữ identity, xóa private projection khi cần | P1; browser journeys |
| H-17 | Queue backlog/poison job/quota contention | Bounded work, operator visibility, safe retry | P1; worker/load tests |
| H-18 | Partial deploy/mismatched manifest | Fail release gate, inspect live state trước retry | P0; release harness/provider readback |
| H-19 | Restore ledger/receipts và Storage | Không gửi/thu trùng; reconcile trước resume | P0; approved DR rehearsal |
| H-20 | Peak load/hot doc/cost spike | Báo cáo p95/error rate/cost theo approved thresholds | P1; load evidence |

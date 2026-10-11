# Quy tắc nghiệp vụ

SatsunicGo • Phiên bản 1.1 • 10/10/2026

## Tiền và giá đã chấp nhận

Tiền VND dùng số nguyên trong giới hạn của schema. Tỷ giá được tính bằng tỷ lệ với phép tính trung gian BigInt; kết quả chuyển đổi được làm tròn theo hàm nghiệp vụ. Không tính lại lịch sử bằng tỷ giá mới.

Hàng niêm yết sử dụng `listedPrice`, không dùng giá tham khảo thay thế. Bản chụp đơn giữ sản phẩm, biến thể, số lượng, giá, tổng và phiên bản điều khoản. Chi phí vận hành nội bộ thay đổi không tự làm tăng nghĩa vụ đã chốt của đơn niêm yết.

Yêu cầu riêng qua báo giá và yêu cầu riêng thanh toán trước có cách xác định khoản đầu khác nhau. Muốn biết cần thu bao nhiêu phải đọc đúng loại đơn, dữ liệu thanh toán trước và phiên bản chính sách; không suy từ một nhãn tiến độ chung.

## Thao tác và trạng thái

Máy chủ xác minh người dùng, quyền hiện tại, tình trạng khóa và phiên bản dữ liệu trước khi ghi. Cùng mã thao tác và cùng nội dung được xử lý lại theo cơ chế chống trùng. Dùng mã cũ với nội dung khác phải bị từ chối.

Thông báo chuyển khoản, tạo QR, tạo liên kết và chuyển hướng trình duyệt không xác nhận khoản thu. Đối soát phải khớp mã tham chiếu, số tiền và đúng hồ sơ. Hoàn tiền không được vượt phần đã thu trừ khoản đã hoàn và phần đã dành cho hồ sơ khác.

## Hàng và quyền truy cập

Đóng gói không cấp quyền xuất gửi nếu đơn thiếu tiền hoặc đang bị giữ. Mỗi đơn trong kiện/lô vẫn phải đạt điều kiện. Số lượng phải đúng từng dòng, không chỉ đúng tổng.

Khách xem đơn theo quyền sở hữu; mã đơn không cấp quyền đọc thông tin riêng. Mã chia sẻ theo dõi có phạm vi, thời hạn và khả năng thu hồi riêng. Lựa chọn liên lạc được xét theo từng mục đích và người nhận hiện tại.

## Ví dụ số học

Báo giá riêng 2.000.000 VND có khoản đầu 1.000.000 VND. Nếu tổng cuối là 2.160.000 VND và chưa có hoàn tiền, phần còn lại là 1.160.000 VND. Đây chỉ là ví dụ phép tính, không phải biểu phí. Với hàng niêm yết tổng 2.000.000 VND, đường đặt hàng yêu cầu thanh toán toàn bộ.

## Bảng tham chiếu chi tiết

| ID | Rule | Rationale và điểm thực thi | Kiểm chứng cần có |
| --- | --- | --- | --- |
| RULE-01 | Tiền VND là số nguyên không âm, tối đa 1,000,000,000,000 trong money schema | Tránh sai số; domain/index | Biên, overflow, số âm, fractional |
| RULE-02 | FX dùng tỷ lệ và BigInt; kết quả làm tròn lên | Giữ phép tính tái lập; convertFx | Rounding, tỷ lệ sai, source minor |
| RULE-03 | Catalog snapshot đóng băng giá/terms/version | listedPrice khác referencePrice; catalog-checkout | Price đổi trước commit; variant không hỗ trợ |
| RULE-04 | Custom quote deposit = ceil(total/2); không áp cho custom upfront | requiredDeposit khác buildCheckout deposit=total | Cả ba loại order, historical fallback |
| RULE-05 | Snapshot upfront giữ goods, service, FX và policy version | Không tính lại lịch sử bằng policy mới | Policy expiry, drift và adjustment approval |
| RULE-06 | Client không quyết định giá hoặc paid state | Authoritative server + verified receipt | Tampered total, fake return, duplicate IPN |
| RULE-07 | Idempotency identity không được tái dùng với payload khác | Hash + operation result trong transaction | Replay cùng payload, conflict và timeout |
| RULE-08 | Current role và account lock được đọc khi mutation | Quyền trong UI/token cũ không đủ | Revoke role/lock giữa read và commit |
| RULE-09 | Finance correction cần evidence, reason và unique bank reference | Ledger và audit tách khỏi notice | Duplicate reference, amount/context sai |
| RULE-10 | Refund không vượt tiền thu trừ đã hoàn và phần reserved | Bảo toàn tiền khả dụng | Refund đồng thời, retry, reservation |
| RULE-11 | Dispatch cần tiền khả dụng, không hold và allocation hợp lệ | Từng order trong batch vẫn phải đạt | Batch có một đơn thiếu tiền/held |
| RULE-12 | Catalog liability không tăng vì internal freight | Snapshot thương mại phải được giữ | Reallocation/consolidation không nâng nợ catalog |
| RULE-13 | Owner read và guest share read là hai boundary riêng | Order ID không mở dữ liệu riêng | ID guessing, share expiry/revoke/locked owner |
| RULE-14 | Consent độc lập theo purpose; kiểm tra recipient khi gửi | Preference cũ không cấp quyền gửi hiện tại | Withdraw/change recipient/queued stale event |
| RULE-15 | Unknown provider outcome cần reconciliation | Không retry tạo tiền/email mù | Timeout trước/sau provider acceptance |
| RULE-16 | AI không được xác nhận tiền hay vượt guard command | Chat không phải authoritative business state | Prompt injection, stale action preview |

# Bảo mật, quyền riêng tư và rủi ro

SatsunicGo • Phiên bản 1.1 • 10/10/2026

## Tài sản và ảnh hưởng

Danh tính, địa chỉ, đơn, chứng từ, notes, ledger, biên nhận, bí mật, mã chia sẻ và quyền nhân viên cần được bảo vệ. Rủi ro gồm cả đọc trái phép, sửa giá, ghi tiền sai, gửi thư sai người, xuất hàng trái điều kiện và xóa bằng chứng.

## Các lớp kiểm soát

Payload trình duyệt cần schema, định danh, quyền và phiên bản phía máy chủ. Admin SDK cần kiểm chủ sở hữu/vai trò trong hàm xử lý. URL media/share cần quyền hiện tại, thời hạn/thu hồi và dữ liệu giới hạn. Provider cần chữ ký, ngữ cảnh và chống trùng.

AI/content/search là dữ liệu không đáng tin. CI cần kiểm thư viện, quyền, gói và bí mật. Restore/worker cần bảo toàn chống trùng và đối soát trước resume. Bảng dưới là phạm vi đánh giá, không phải kết quả pentest.

## Quyền riêng tư

Thông báo, marketing và analytics có mục đích riêng. Người nhận phải hiện hành. Xóa/xuất dữ liệu cần xác minh chủ sở hữu, chính sách lưu giữ, legal hold và thẩm quyền. Không xóa ledger tùy tiện để làm xong yêu cầu tài khoản.

Mã chia sẻ cấp quyền dù không chứa PII trực tiếp. Không log thô hoặc đưa vào analytics/demo. Bí mật nhà cung cấp/quota không nằm trong gói trình duyệt.

## Hồ sơ và bằng chứng

Cần người phụ trách, access review, xử lý lỗ hổng, incident, retention, subprocessors và dependency/license inventory. Công nghệ dùng không tự chứng minh SOC 2, ISO hoặc tuân thủ pháp luật.

Evidence chỉ giữ phần cần thiết, làm sạch trước chia sẻ. Không thử mở rộng vào dữ liệu thật hoặc in secret values. Mô tả này chưa thay một cuộc quét bảo mật/kiểm thử xâm nhập được thực hiện.

## Bảng tham chiếu chi tiết

| Đường | Nguy cơ | Kiểm soát/kiểm thử cần có |
| --- | --- | --- |
| Browser payload | Đổi ownerId/amount/version hoặc action | Server identity, strict schema, current rights, version guards |
| Callable dùng Admin SDK | Bỏ qua Rules | Owner/role/context trong handler, integration isolation |
| Public media/share | Lộ nội dung riêng qua URL cũ | Current parent access, expiry/revoke, limited projection |
| Provider callbacks | Fake/duplicate/context mismatch | Signature + authoritative context + deduplication |
| AI/search/content | Prompt injection hoặc xuất dữ liệu riêng | Untrusted content boundary, command guard và data minimization |
| Staff account | Privilege escalation, finance misuse | Role review, lock, recent MFA, immutable audit |
| CI/artifact | Source/artifact drift, secret exposure | Locked dependencies/actions, WIF, checksums/readback |
| Worker/restore | Duplicate external I/O | Claim/idempotency, unknown reconciliation, controlled resume |

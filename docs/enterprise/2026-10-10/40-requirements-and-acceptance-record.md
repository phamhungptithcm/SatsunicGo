# Danh mục yêu cầu và biên bản nghiệm thu

SatsunicGo • Phiên bản 1.1 • 10/10/2026

## Yêu cầu có thể kiểm chứng

Mỗi yêu cầu gồm người thực hiện, sự kiện bắt đầu, điều kiện, dữ liệu, kết quả, đường lỗi, quyền và bằng chứng. “Nhanh”, “an toàn” hoặc “đầy đủ” không đủ làm tiêu chí duy nhất. Phải có việc quan sát được và giới hạn đã duyệt.

Bảng FR-01 đến FR-25 nối các hành vi trọng yếu từ public listing tới checkout, tiền, quyền, kho, thông báo, release và restore. Các điều kiện là mục tiêu nghiệm thu, chưa phải kết quả đã chạy.

## Biên bản

Ghi sản phẩm/phiên bản, SHA và trạng thái working tree, checksum gói, project/môi trường, thời gian, người chạy và người duyệt. Mỗi FR/H case có kỳ vọng, quan sát, bằng chứng, trạng thái và defect nếu có.

Chỉ kiểm thử đúng bản hiện tại mới tính completion. Ghi phần chấp nhận có điều kiện, chưa chạy và cần nhà cung cấp/chủ sở hữu riêng. Demo catalog/checkout không đủ ký đạt mọi module.

## Điều kiện đóng

Required criteria đạt; không còn finding high/critical trong phạm vi; review cuối mới gắn gói; cấu hình/nhà cung cấp được xác minh nếu phạm vi gồm production. Người có thẩm quyền chấp nhận rủi ro còn lại.

Nhiệm vụ tài liệu chưa thực hiện nghiệm thu sản phẩm. Các báo cáo chất lượng của bộ hồ sơ chỉ đánh giá tài liệu, cấu trúc file, liên kết và bản xuất, không chứng nhận hệ thống vận hành thực tế.

## Bảng tham chiếu chi tiết

| ID | Yêu cầu | Điều kiện nghiệm thu |
| --- | --- | --- |
| FR-01 | Listing public chỉ dùng dữ liệu published | Draft/unpublished không lộ qua route và media |
| FR-02 | Catalog checkout giữ giá đã xác nhận | Snapshot không đổi khi listing được cập nhật sau tạo order |
| FR-03 | Variant và quantity đúng hợp đồng | Giá trị ngoài schema hoặc options bị từ chối |
| FR-04 | Quote đúng policy/version/expiry | Currency, FX, terms và current policy khớp trước issue/accept |
| FR-05 | Upfront draft thuộc đúng owner | Draft đổi hoặc dữ liệu dòng lệch bị chặn |
| FR-06 | Cart conflict được phát hiện | Revision đổi không commit snapshot cũ |
| FR-07 | Retry không tạo nghĩa vụ trùng | Cùng operation/payload replay; đổi payload bị từ chối |
| FR-08 | Payment return không xác nhận tiền | Fake redirect không tăng collections |
| FR-09 | Duplicate callback không tăng thu | Same receipt/context chỉ phân bổ một lần |
| FR-10 | Current rights bảo vệ mutation | Role revoke/locked chặn thao tác tiếp theo |
| FR-11 | Finance action kiểm MFA phù hợp | Thiếu/stale MFA bị từ chối ngoài test exception |
| FR-12 | Refund reservation bảo toàn tiền | Concurrent requests không vượt available amount |
| FR-13 | Warehouse ghi lượng theo dòng | Không receive/allocate vượt lượng đúng dòng |
| FR-14 | Dispatch theo toàn bộ điều kiện | Hold/underfunded/stale freight chặn gửi |
| FR-15 | Partial parcel không hoàn tất order | Còn lượng chưa delivered thì chưa fullyDelivered |
| FR-16 | Guest share hạn chế và thu hồi được | Expired/revoked code không trả projection |
| FR-17 | Preference tách theo purpose | Order email không tự bật promotions/SMS |
| FR-18 | Delivery kiểm state tại I/O | Stale generation/recipient/lock chặn gửi |
| FR-19 | Unknown send/charge có reconcile | Không tự replay external I/O chưa biết kết quả |
| FR-20 | Document issued giữ lịch sử | Order/seller đổi không tự refresh bản issued |
| FR-21 | Return close không tự hoàn tiền | Đóng inspection không tạo financial refund |
| FR-22 | AI không vượt server authority | Injected/stale action không xác nhận tiền/quyền trái policy |
| FR-23 | Metrics có định nghĩa và phạm vi | Missing/failed/partial không biến thành zero |
| FR-24 | Release artifact giữ identity | Hosting/Functions/source comparison theo cùng candidate |
| FR-25 | Restore giữ invariants và jobs | Không duplicate provider I/O sau resume |

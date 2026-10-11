# Liên kết yêu cầu, mã nguồn và kiểm chứng

SatsunicGo • Phiên bản 1.1 • 10/10/2026

## Chuỗi truy vết

Một yêu cầu được nối với quy tắc nghiệp vụ, thiết kế, hàm xử lý, dữ liệu và ca nghiệm thu. Bảng dưới giữ các điểm bắt đầu cho việc rà soát. Đường dẫn nguồn không thay việc đọc đầy đủ điều kiện trong hàm hoặc schema liên quan.

Khi thay giá, quyền, trạng thái hoặc tích hợp, cần xem cả nơi gọi và nơi sử dụng kết quả. Một test kiểm phép tính không đủ cho quyền truy cập; một test Rules không đủ cho Admin SDK; một test callback giả lập không đủ cho nhà cung cấp hiện tại.

## Nhận diện phiên bản

Dùng SHA cùng danh mục mã băm cho nguồn được tham chiếu. Working tree có thay đổi chưa commit nên chỉ SHA HEAD không tái tạo toàn bộ hiện trạng. Khi nguồn quan trọng đổi, các kết luận liên quan phải được kiểm lại.

Gói phát hành cần checksum và manifest riêng. Bằng chứng CI, triển khai và nghiệm thu gắn đúng gói đó. Không dùng báo cáo cũ cho một candidate mới chỉ vì tên tính năng giống nhau.

## Bản ghi kiểm thử

Mỗi ca ghi ID, nguồn/gói, môi trường, dữ liệu thử, điều kiện trước, bước, kỳ vọng, quan sát, người thực hiện và thời điểm. Lưu defect và kết quả kiểm lại nếu có. Chưa chạy, thiếu bằng chứng hoặc sai phiên bản đều không được tính đạt.

## Cách sử dụng phụ lục

Chương 37 tìm API, trigger và schema trong module. Chương 38 tìm cấu trúc dữ liệu cùng ràng buộc. Danh mục cấu hình tìm tên biến và nơi dùng. Các phụ lục là tham chiếu kỹ thuật; quyền, hiệu lực chính sách và trạng thái triển khai vẫn cần kiểm theo hành trình.

## Bảng tham chiếu chi tiết

| Requirement | Rules | Source anchors | Acceptance / evidence cần chạy |
| --- | --- | --- | --- |
| BR-01 privacy | RULE-08,13 | firestore.rules; storage.rules; auth/guards.ts; customer-order-tracking.ts; public-order-tracking.ts | H-01,02,10; direct + callable + UI |
| BR-02 correct money | RULE-01–05,12 | packages/domain/index.ts; catalog-checkout.ts; purchase-checkout.ts | H-04,08; exact rounding và ba order paths |
| BR-03 verified payment | RULE-06,09,15 | functions/src/payments/payos.ts; purchase-sepay.ts; purchase-settlement.ts | H-06,07; signature/context/dedup/provider readback |
| BR-04 safe dispatch | RULE-10–12 | functions/src/shipping.ts; consolidation.ts; packages/domain/index.ts | H-08,09; reservation/hold/allocation |
| BR-05 retry safety | RULE-07,15 | functions/src/index.ts; purchase-checkout.ts; src/features/cart/purchase-checkout.tsx | H-05,07,16; concurrent writers/response loss |
| BR-06 staff rights | RULE-08,09 | functions/src/auth/guards.ts; workspace.ts; index.ts | H-02,03; current role và MFA |
| BR-07 tracking | RULE-13 | customer-order-tracking.ts; packages/domain/order-tracking.ts | H-10,15; parcel partial/ETA unknown |
| BR-08 guarded AI | RULE-16 | ai/ask.ts; ai/ask-workflow.ts; packages/domain/chat-action.ts | H-13; prompt/stale preview |
| BR-09 consent | RULE-14,15 | notification-preferences-service.ts; subscription-delivery-service.ts; email/provider-config.ts | H-11,12; purpose/recipient/outcome |
| BR-10 release | RULE-15 | .github/workflows/release.yml; scripts/release/artifact.mjs; verify-production.mjs | H-18,19; artifact/provider/restore |

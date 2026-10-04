# Tài liệu kỹ thuật chính thức

Ngày tham khảo: 2026-10-03. Coding agent cần kiểm tra lại tài liệu tương ứng với SDK, API và runtime thực tế trước triển khai. URL bên dưới là tài liệu, không phải bằng chứng ứng dụng đã tích hợp hoặc đã được kiểm thử.

## Đăng nhập Google và Firebase

Firebase hỗ trợ đổi Google credential thành Firebase session; xem phần xử lý Google Sign-In thủ công:

`https://firebase.google.com/docs/auth/web/google-signin`

Điều kiện hiển thị, cách người dùng tắt và khác biệt trải nghiệm One Tap:

`https://developers.google.com/identity/gsi/web/guides/features`

OAuth client, authorized origins, CSP và cấu hình Google Identity Services:

`https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid`

## AI phía server

Genkit flow qua callable Functions, streaming, secrets và App Check:

`https://firebase.google.com/docs/functions/oncallgenkit`

Tham khảo thêm Firebase AI Logic. Bản thiết kế chọn Genkit phía server để tập trung kiểm tra quyền và công cụ nghiệp vụ, không yêu cầu chạy đồng thời cả hai stack:

`https://firebase.google.com/docs/ai-logic`

## Dữ liệu, phân quyền và độ tin cậy

Transactions và batched writes:

`https://firebase.google.com/docs/firestore/manage-data/transactions`

Rules và việc server SDK dùng cơ chế quyền khác client Rules:

`https://firebase.google.com/docs/firestore/security/rules-conditions`

Quyền đọc ở mức document; tài liệu nhạy cảm cần tách khỏi document khách được đọc:

`https://firebase.google.com/docs/firestore/security/rules-fields`

Firestore triggers: sự kiện có thể lặp, thứ tự không được bảo đảm:

`https://firebase.google.com/docs/functions/firestore-events`

Retry cho asynchronous Functions:

`https://firebase.google.com/docs/functions/retries`

## Thanh toán

payOS API chính thức: payment link, truy vấn trạng thái, dữ liệu/chữ ký webhook. Cần kiểm tra khả năng và quyền merchant thực tế, không suy diễn hỗ trợ mọi loại thanh toán hoặc hoàn tiền:

`https://payos.vn/docs/api/`

Hướng dẫn bắt đầu:

`https://payos.vn/docs/`

## Billing và chi phí

Yêu cầu billing của Cloud Storage for Firebase:

`https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024`

Theo dõi chi phí, budget alerts và spend controls theo dịch vụ đang được hỗ trợ:

`https://firebase.google.com/docs/projects/billing/avoid-surprise-bills`

Các chính sách pháp lý, phí kinh doanh, thuế, điều kiện vận chuyển và cam kết dịch vụ chưa được xác minh bởi bộ tài liệu kỹ thuật này. Chúng là các cấu hình và điều kiện duyệt trước launch, không phải kết luận pháp lý.

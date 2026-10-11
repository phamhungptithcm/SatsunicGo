# Tài liệu cấu hình

SatsunicGo • Phiên bản 1.1 • 10/10/2026

## Các lớp cấu hình

Cấu hình trình duyệt dùng các biến `VITE_*` và được đưa vào gói ứng dụng. Nó không được chứa thông tin xác thực nhà cung cấp. Cấu hình máy chủ gồm môi trường chạy, tham chiếu bí mật và các chính sách nghiệp vụ. Tệp triển khai mô tả nguồn; giá trị đang áp dụng cần được đọc lại từ môi trường thật.

Chính sách giá, thanh toán trước, khu vực và biểu cước cần phiên bản, phê duyệt và thời hạn. Khi chính sách hết hiệu lực, hệ thống phải từ chối bước nghiệp vụ tương ứng, không âm thầm lấy tỷ giá cũ. Dữ liệu mẫu không được dùng làm biểu phí production.

## Cấu hình môi trường demo

Ứng dụng dùng project `demo-satsunicgo`, `VITE_USE_EMULATORS=true` và đúng các cổng dùng chung. Không bật emulator trong bản build production. Cổng Storage của backend không có nghĩa tồn tại một biến cấu hình client tương ứng; chỉ dùng biến được implementation hỗ trợ.

## Điều kiện mở tính năng

Nguồn hiện ghi `ai=false`, `email=true`, `payments=false`, `scheduledMaintenance=false` trong `releaseCapabilities`. Hàm kiểm tra còn xét định danh project và môi trường; từng adapter có giới hạn riêng. Không dùng một boolean để kết luận tích hợp đã hoạt động.

Các export SePay sandbox chỉ mở trong demo emulator theo điều kiện tại entrypoint. Email cần chính sách máy chủ hợp lệ, tên miền gửi, người nhận và lựa chọn liên lạc hiện tại. Những điều kiện đó không được bỏ qua bằng cách sửa settings.

## Quản lý thay đổi

Thay cấu hình cần kiểm schema, ảnh hưởng, môi trường, phê duyệt, đọc lại và theo dõi. Khi tắt/bật nhà cung cấp phải xét tác vụ đang xử lý và kết quả chưa xác định. Danh mục biến chỉ ghi tên và nơi tham chiếu, không đọc `.env` hoặc giá trị bí mật.

## Bảng tham chiếu chi tiết

| Loại | Nguồn | Quy tắc |
| --- | --- | --- |
| Client public build | VITE_* trong src/shared/firebase.ts và workflow | Được bundle vào browser; không chứa secret/provider credentials |
| Backend environment | process.env / Functions params | Project/emulator identity phải nhất quán |
| Backend secrets | defineSecret và approved runtime secret bindings | Chỉ mô tả tên/mục đích; không in giá trị |
| Business policy | Firestore settings/pricing, upfrontCheckout, shipping rates, regions | Có approval, version, hiệu lực và terms; không dùng fixture production |
| Release capabilities | functions/src/provider-release-gate.ts | Code-owned gates; settings không tự mở capability |
| Build/deploy | firebase.json, release workflow, artifact scripts | Source config khác deployed config; cần provider readback |

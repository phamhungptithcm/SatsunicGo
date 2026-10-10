# Tài liệu hệ thống

SatsunicGo • Phiên bản 1.1 • 10/10/2026

## Cấu trúc ứng dụng

Hệ thống có một ứng dụng React/TypeScript chạy bằng Vite, thư viện nghiệp vụ dùng chung và Functions v2 xử lý phía máy chủ. Các phần công khai, tài khoản khách và nhân viên đi qua những đường truy cập khác nhau. Ẩn một nút trên giao diện không phải là kiểm soát quyền.

`src/app` chứa khởi tạo ứng dụng, điều hướng và khung trang. `src/features` chứa các màn hình nghiệp vụ. `packages/domain` giữ schema, phép tính tiền, trạng thái đơn, thanh toán, vận chuyển và các quy tắc dùng chung. `functions/src` giữ kiểm tra quyền, giao dịch cơ sở dữ liệu, tích hợp và xử lý nền.

## Nhóm dữ liệu

Orders và bản chụp chấp thuận giữ nghĩa vụ thương mại. Users, addresses và thông tin người nhận là dữ liệu riêng. Chứng từ mua, ghi chú CRM và thông tin vận hành nội bộ không thuộc phần khách được xem.

Sổ giao dịch, phân bổ ngân hàng, biên nhận và hồ sơ hoàn cần giữ lịch sử và chống trùng. Kiện hàng, phân bổ và lô gom mô tả thực hiện vật lý. Giỏ, bản nháp và bản xem trước mô tả giai đoạn chuẩn bị.

Các bản dữ liệu dành cho khách chỉ trả phần được phép; không trả toàn bộ bảng kê của những khách khác trong cùng kiện. Nhật ký, mã chống trùng, hàng đợi và hạn mức là dữ liệu phía máy chủ.

## Cơ chế truy cập

Firestore/Storage Rules bảo vệ đường truy cập trực tiếp từ ứng dụng khách. Functions dùng Admin SDK phải tự kiểm tra quyền vì không đi qua Rules. Các hàm gọi từ ứng dụng dùng schema và điều kiện riêng; không có cam kết CRUD chung cho mọi collection.

Tracking của chủ đơn khác tracking qua mã chia sẻ. Đường chia sẻ kiểm tra mã, thời hạn, trạng thái thu hồi và phần dữ liệu được phép. Danh mục collection hoặc tên API trong tài liệu không cấp quyền truy cập.

## Giới hạn kiểm chứng

Hồ sơ mô tả nguồn hiện tại và các hợp đồng tĩnh. Danh sách dịch vụ đang chạy, IAM, dữ liệu thực, hóa đơn hạ tầng và kết quả phục hồi cần kiểm kê riêng. Mã HEAD không tái tạo toàn bộ working tree có thay đổi chưa commit; danh mục mã băm ghi rõ các tệp tham chiếu.

## Bảng tham chiếu chi tiết

| Khu vực | Trách nhiệm |
| --- | --- |
| src/app | Bootstrap, router, chrome, error boundary, lazy modules |
| src/features | Public/customer/staff workflows; UI không phải authorization boundary |
| src/shared/firebase.ts | Firebase client, App Check, emulator connection và service wrappers |
| packages/domain | Schema, money, order lifecycle, checkout, tracking, content và AI policy helpers |
| functions/src | Functions v2, guards, transactions, integrations, jobs và projections |
| firestore.rules / storage.rules | Direct client data access; default-deny policy |
| firestore.indexes.json | Composite indexes cho query patterns |
| scripts/release | Candidate/artifact, preflight, publish và provider verification |
| tests | Unit, Rules, HTTP và các fixture/harness; tồn tại test không đồng nghĩa đã chạy |

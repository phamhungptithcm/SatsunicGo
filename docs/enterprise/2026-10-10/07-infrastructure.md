# Tài liệu hạ tầng

SatsunicGo • Phiên bản 1.1 • 10/10/2026

## Tài nguyên trong cấu hình nguồn

Hosting phục vụ thư mục `dist`, các đường chuyển tới hàm công khai và các header bảo mật. Functions dùng codebase `satsunicgo`, Node.js 22 và các hàm v2; nhiều hàm khai báo vùng `asia-southeast1`. Firestore và Storage có Rules riêng; các chỉ mục được quản lý trong repository.

Vùng Functions không xác định vùng Firestore hoặc bucket. Quyền khai báo trong quy trình không chứng minh IAM thực tế. Tên miền, chứng chỉ, phiên bản đang chạy, bucket, backup và hạn mức cần được đọc từ môi trường đích.

## Môi trường phát triển dùng chung

Frontend dùng `http://127.0.0.1:5207`, project `demo-satsunicgo`. Cấu hình dùng chung nằm tại `/private/tmp/satsunicgo-shared5207/firebase.json`; Auth 19207, Firestore 18207, Functions 15207 và Storage 19208.

Cấu hình gốc còn có các cổng mặc định khác. Không chép chúng đè lên môi trường dùng chung. Trước khi khởi động lại cần kiểm tra tiến trình, quyền quản lý và bảo toàn dữ liệu demo. Nhiệm vụ này không khởi động, đặt lại hoặc nạp lại dữ liệu.

## Quyền, bí mật và giám sát

Mô hình vận hành cần quyền tối thiểu cho triển khai, chạy dịch vụ và nhân viên. Workflow hiện dùng WIF; việc ràng buộc IAM thực tế vẫn cần xác minh. Bí mật được cấp cho đúng hàm qua cơ chế được duyệt, không đặt trong mã trình duyệt hoặc tài liệu.

Cần theo dõi lỗi, độ trễ, tác vụ tồn đọng, thanh toán chưa rõ kết quả và chi phí. Chủ dịch vụ xác định ngưỡng, người trực và quy trình xử lý.

## Sao lưu và chi phí

Firestore, Storage và gói phát hành cần kế hoạch lưu giữ riêng. RPO/RTO phải được duyệt và diễn tập. Chi phí bao gồm thực thi hàm, đọc/ghi dữ liệu, lưu trữ, lưu lượng ra và nhà cung cấp ngoài. Hồ sơ này chưa có dữ liệu hóa đơn hoặc đo tải thực tế.

## Bảng tham chiếu chi tiết

| Thành phần | Cấu hình quan sát | Cần kiểm chứng live |
| --- | --- | --- |
| Hosting | dist, SPA fallback, public handler rewrites, CSP/security headers, immutable assets | Domains, certificate, deployed hashes |
| Functions | functions codebase satsunicgo, Node.js 22, v2 handlers thường asia-southeast1 | Deployed inventory, revision, IAM, scaling settings |
| Firestore | Rules và indexes versioned trong repo | Database region, active Rules/indexes, backups |
| Storage | storage.rules; upload/media adapters | Bucket location, grants, retention, recovery |
| Auth/App Check | Firebase identity; production App Check config | Providers, domains, enforcement/readback |
| CI/CD | GitHub Actions, production environment, WIF vars | Environment protections, IAM bindings, successful current run |
| Providers | payOS, SePay sandbox, Resend, AI adapters trong nguồn | Activation, domains, quotas, permitted data handling |

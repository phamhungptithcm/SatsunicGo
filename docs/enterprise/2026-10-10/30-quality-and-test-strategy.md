# Chiến lược kiểm thử và nghiệm thu

SatsunicGo • Phiên bản 1.1 • 10/10/2026

## Các lớp kiểm tra

Unit kiểm hàm/quy tắc; Rules kiểm truy cập trực tiếp; tích hợp kiểm định danh, validation, transaction và dữ liệu trả; browser kiểm hành trình và khôi phục; nhà cung cấp test kiểm thực tế giao tiếp; smoke production kiểm bản đang chạy. Kết quả lớp trước không tự chứng minh lớp sau.

## Dữ liệu và đồng thời

Bộ thử cần hai khách độc lập, các vai trò, tài khoản locked, ba đường mua, nhiều dòng/nhiều kiện, báo giá hết hạn, chính sách đổi, khoản dành hoàn, giao một phần và kết quả tiền/email chưa rõ.

Kiểm đồng thời cần trạng thái cuối: tổng tiền, lượng phân bổ, ledger, chống trùng và audit. Không chỉ đếm yêu cầu thành công. Lỗi được đặt trước/sau commit hoặc nhà cung cấp tiếp nhận để phân biệt từ chối rõ với unknown.

## Trải nghiệm và nội dung

Kiểm đang tải, trống, thiếu dữ liệu, lỗi nhập, mất kết nối, hết phiên, khóa, trạng thái cũ và kết quả một phần. Số tiền có đơn vị; thiếu dữ liệu không thành zero. Nhãn thanh toán phân biệt ba đường mua. Kiểm bàn phím, focus và công nghệ hỗ trợ theo nền tảng.

## Kết luận

Ca đạt cần kỳ vọng khớp quan sát, đúng phiên bản/môi trường và bằng chứng. Ca chưa chạy không tính pass rate. Phần trăm coverage có mẫu số; số test không đại diện độ hoàn thành toàn sản phẩm.

Nhiệm vụ này tạo tài liệu và kế hoạch nghiệm thu, chưa chạy application tests. Sửa code hardening cần plan/phê duyệt riêng và review mới sau kiểm thử.

## Bảng tham chiếu chi tiết

| Phạm vi | Happy path | Adverse path | Evidence cần lưu |
| --- | --- | --- | --- |
| Catalog | Listing hợp lệ, variant đúng, full payment path | Giá/version đổi, orderable false, total tamper | Snapshot và rejected mutation |
| Custom quote | Quote đúng policy, acceptance, deposit | Hết hạn, source currency sai, stale quote | Accepted version và khoản đầu |
| Custom upfront | Draft đúng owner, policy hợp lệ | Draft đổi, ảnh pending, rate/terms drift | Upfront snapshot và conflict |
| Finance | Reference hợp lệ, confirmation | Duplicate/context sai/MFA thiếu/refund race | Ledger và bank allocation |
| Kho/ship | Nhận đủ, allocation đúng, funded dispatch | Over-allocation/hold/partial delivery | Parcel + order state |
| Consent/email | Current recipient/purpose và accepted | Withdraw, generation stale, unknown send | Provider outcome + job state |
| Access | Own customer read và role đúng | Cross-owner, role revoked, guest revoke | Rules + callable outcome |
| Release/DR | Artifact đồng nhất và restore integrity | Partial deploy, incompatible source, jobs replay | Provider readback và integrity checks |

# Sao lưu, phục hồi và chuyển đổi dữ liệu

SatsunicGo • Phiên bản 1.1 • 10/10/2026

## Mục tiêu và phạm vi

RPO là mức mất dữ liệu chấp nhận; RTO là thời gian khôi phục mục tiêu. Chủ dịch vụ cần duyệt và đo bằng diễn tập. Có backup chưa chứng minh phục hồi được; import fixture chưa chứng minh production đạt mục tiêu.

Firestore, Storage, gói phát hành, Rules/chỉ mục và metadata cấu hình cần kế hoạch riêng. Giữ quan hệ order, checkout, ledger, biên nhận, mã chống trùng và kiện. Không xuất secret values vào hồ sơ.

## Diễn tập đề xuất

Chọn môi trường và quyền được phép, kiểm backup định danh/checksum/thời điểm. Cô lập tiến trình có giao tiếp bên ngoài trước import. Dùng dữ liệu giả lập hoặc đã có quyền sử dụng; không mang PII sang môi trường khác tùy tiện.

Sau phục hồi, đối chiếu snapshots, tiền thu/hoàn/dành trước, allocations, receipts, tác vụ và tham chiếu Storage. Kiểm quyền trước mở cho ứng dụng. Đối soát kết quả nhà cung cấp chưa rõ trước resume.

Database lùi thời gian không làm ngân hàng hoặc thư đã gửi lùi theo. Restore không dùng để undo khoản hoàn hay xóa lịch sử. Chênh lệch giữa hệ thống phải được ghi và xử lý riêng.

## Migration

Cần schema trước/sau, phạm vi bản ghi, invariant, chạy thử, chống trùng, kích thước batch, đồng thời và phương án quay về. Không viết vòng lặp lưu lớn khi cần batch/bulk; đồng thời không gom để phá atomicity tài chính.

Bản ghi cũ thiếu purchaseKind hoặc metadata mới cần chính sách tương thích, không tự coi tất cả là catalog/upfront. Schema chặt có thể chặn dữ liệu cũ; phải thống kê trước.

## Bằng chứng

Lưu checksum, thời gian, tài nguyên, integrity checks, Storage, quyền, kết quả đối soát và quyết định resume. App trả 200 hoặc import thành công chưa đủ đóng diễn tập.

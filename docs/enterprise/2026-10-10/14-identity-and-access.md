# Tài khoản, đăng nhập và phân quyền

SatsunicGo • Phiên bản 1.1 • 10/10/2026

## Danh tính và quyền

Các command có bảo vệ lấy danh tính từ phiên Firebase đã xác minh. `requireVerifiedGoogle` yêu cầu UID, email đã xác minh và phiên đăng nhập qua Google. Có liên kết Google trong hồ sơ không đủ chứng minh phiên hiện tại dùng Google.

Tài khoản khách không mặc nhiên có quyền nhân viên. Quyền được đọc từ `staffAccess` và xét tại thời điểm thao tác. Không dùng vai trò từ dữ liệu gửi hoặc dữ liệu UI đã lưu để quyết định quyền phía máy chủ.

## Khóa và thu hồi

Một tài khoản có thể bị khóa hoặc mất vai trò sau khi mở màn hình. Thao tác tiếp theo vẫn phải bị chặn. UI cần dừng gửi, xử lý lỗi quyền và xóa phần dữ liệu riêng không còn được phép. Sau mở khóa phải đọc lại dữ liệu hợp lệ trước khi tiếp tục.

Rules bảo vệ truy cập trực tiếp; Functions dùng Admin SDK phải kiểm quyền riêng. Nghiệm thu phải thử cả hai đường và các bản dữ liệu phục vụ khách.

## Xác thực hai lớp

`recentMfa` kiểm thời điểm xác thực và thông tin yếu tố thứ hai. Khoảng thời gian hiện tại là dưới năm phút, cùng kiểm tra sai lệch thời gian tương lai tối đa 30 giây. Các action nhạy cảm áp dụng theo từng hàm.

Ngoại lệ emulator phục vụ kiểm thử không chứng minh người thật đã hoàn thành MFA. Trước nghiệm thu thực tế phải xác minh đúng phiên, định danh và hành động.

## Nghiệm thu

Hai khách độc lập không đọc/sửa chéo dữ liệu. Role giới hạn không gọi được action khác. Thử khóa, thu hồi quyền, phiên chưa xác minh, MFA cũ và đổi chủ sở hữu trong dữ liệu gửi. Kết quả từ chối không được để lại dữ liệu nghiệp vụ một phần hoặc làm lộ thông tin ngoài chính sách.

## Bảng tham chiếu chi tiết

| Vai trò | Phạm vi trách nhiệm | Giới hạn cần giữ |
| --- | --- | --- |
| OWNER | Cấu hình và quyết định thuộc chủ doanh nghiệp | Không bỏ qua chứng từ, trạng thái hay kiểm tra MFA khi handler yêu cầu |
| OPERATIONS_MANAGER | Điều phối nghiệp vụ, kiện gửi và ngoại lệ | Không suy ra toàn bộ quyền finance từ tên vai trò |
| BUYER | Thực hiện mua và ghi bằng chứng | Không tự xác nhận khoản thu hoặc nâng giá khách đã đồng ý |
| WAREHOUSE | Nhận, kiểm và đóng kiện | Không vượt số lượng được phân bổ; không tự giải phóng hold tài chính |
| FINANCE | Đối soát tiền, hồ sơ hoàn và chứng từ | Reference, version, evidence và recent MFA theo action |
| SUPPORT | Hội thoại, hồ sơ hỗ trợ và theo dõi khách | Notes nội bộ tách phần khách xem |
| CONTENT_EDITOR | Nội dung, sản phẩm và media theo quyền | Nội dung published không cấp quyền xử lý đơn |

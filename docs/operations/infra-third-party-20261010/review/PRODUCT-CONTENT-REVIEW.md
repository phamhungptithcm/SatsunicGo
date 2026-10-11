# Rà soát nội dung sổ tay hạ tầng

Ngày 10/10/2026. Phạm vi là tài liệu nội bộ Markdown/PDF và năm bảng CSV, không thay đổi nội dung trong giao diện ứng dụng. Người dùng yêu cầu hướng dẫn từng bước, vị trí cấu hình, cập nhật và tài khoản quản lý. Email [owner email configured privately] được người dùng cung cấp trực tiếp trong turn này; đã ghi là xác nhận của người dùng, chưa coi là xác minh quyền đăng nhập từng provider.

## Nội dung và trạng thái

Inventory: SETUP-AND-OPERATIONS.md có 32 chương, danh mục 23 nhóm dịch vụ, 41 tên env/secret/workflow và 22 trường policy. Tên trường kỹ thuật giữ theo nguồn; lời giải thích dùng tiếng Việt. Nội dung trước thay đổi là chưa có sổ tay độc lập này. Bản cuối được khóa hash trong DELIVERY-MANIFEST.json.

Default/setup, success, pending, unavailable, unknown, sai quyền, lỗi credential, callback lỗi, retry, rollback, thao tác có hậu quả và chuyển người quản trị đều có hướng dẫn tại chương 04–29. Đây là trạng thái được mô tả, không phải kết quả kiểm thử UI/provider. Không có trạng thái loading/empty của giao diện được thay đổi. Những mục chưa có readback ghi CHƯA XÁC NHẬN, không ghi false hoặc số 0. Tác vụ setup là hướng dẫn chưa thực thi.

Nguồn dữ liệu: source snapshot, workflow và xác nhận email của người dùng; hướng dẫn provider được truy cập 10/10/2026. Tiền VND, timestamp milliseconds và timezone của tác vụ được ghi khi cần. Secret chỉ có tên/mục đích; thông tin private banking, key payload, MFA seed và recovery code không được chép vào danh mục.

## Tám nguyên tắc

| Nguyên tắc | Trạng thái | Căn cứ ở bản cuối |
| --- | --- | --- |
| Purpose | PASSED | Mở đầu, thứ tự setup chương 05 và bảng tra cứu chương 28 |
| Agency | PASSED | Mỗi hướng dẫn giữ người thực hiện/phê duyệt, không tự bật dịch vụ |
| Responsibility | PASSED | Phân biệt email do người dùng cung cấp với quyền live; source khác provider readback |
| Familiarity | PASSED | Dùng trình tự thao tác theo dịch vụ; giải thích admin, runtime account và sender ở chương 04 |
| Flexibility | PASSED | PDF có TOC/bookmarks; nguồn Markdown và CSV có thể cập nhật |
| Simplicity | PASSED | Mỗi chương một dịch vụ hoặc công việc; chương 28 tra cứu theo thay đổi |
| Craft | PASSED | Đã render và xem bản cuối; kiểm ký tự, khổ giấy, trang trắng và CSV shape |
| Delight | PASSED | Mục lục bấm được, typography/màu nhất quán; năm danh mục dùng tiếp khi bàn giao |

## Nền tảng và kiểm tra

Đích là tài liệu nội bộ đa nền tảng, không phải giao diện Apple. Apple HIG: NOT_APPLICABLE. Các pattern account/privacy, hướng dẫn, hậu quả thay đổi, phản hồi lỗi và phục hồi được áp dụng ở mức nội dung sổ tay. Không sao chép biểu đạt Apple. Hai cụm từ người dùng yêu cầu tránh không xuất hiện.

PDF được xuất tagged và có outline; đã kiểm dấu tiếng Việt và bố cục bản render. Screen reader, keyboard toàn bộ link, RTL và text scaling: NOT_RUN; không tuyên bố chứng nhận accessibility. CSV dùng UTF-8 BOM; kiểm số cột từng dòng. Không kiểm UI Google Sheets/Excel trực tiếp.

Product Language Gate: PASSED cho nội dung và bề mặt tài liệu đã kiểm. Không xác nhận giao diện hay chức năng của ứng dụng. Trạng thái provider, quyền quản trị, billing, backup/restore và liên lạc thực vẫn là CHƯA XÁC NHẬN.

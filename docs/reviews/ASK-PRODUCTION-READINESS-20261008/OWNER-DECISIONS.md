# Quyết định cần chốt cho Ask

## Nguồn kiến thức

Đã đọc trực tiếp các trang đang xuất bản và ghi hash trong POLICY-SOURCE-CANDIDATES.json. /how-it-works mô tả luồng mua hộ. /terms có phần thanh toán danh mục và mua hộ riêng, nhưng điều kiện đổi trả/hủy/hoàn tiền vẫn ghi chưa được duyệt. /privacy cũng đang chờ duyệt. Xuất bản trên web chưa chứng minh được doanh nghiệp duyệt dùng làm nguồn chính thức cho Ask.

Đề xuất: chủ doanh nghiệp xác nhận hai phần luồng mua hộ/thanh toán, sau đó đưa nội dung đúng đó vào nguồn posts/blogPublished qua workflow hiện có; OWNER có MFA gần đây preview và duyệt contentHash + ngôn ngữ + thời hạn. Không tự publish/duyệt/ngụy tạo nguồn. Các điều kiện chưa chốt phải trả lời đang chờ xác nhận và chuyển hỗ trợ, không tạo điều kiện hoàn tiền/đổi trả.

Còn cần: nội dung chính thức đổi trả/hủy/hoàn tiền; hàng hạn chế; phí và thời gian áp dụng; pháp nhân/liên hệ quyền riêng tư; các cam kết giao hàng được duyệt. Không suy ra giá, phí, ETA hoặc kết quả thanh toán từ văn bản chính sách.

## Feedback

Đề xuất 30 ngày trong FEEDBACK-POLICY-PROPOSAL.md của task trước vẫn chưa có câu trả lời phê duyệt. Không sửa settings production. Giữ category + reference, không sao chép thêm nội dung chat/địa chỉ/liên hệ; user đồng ý với policyversion từ server và có quyền rút. Inbox loại hết hạn; cleanup chỉ xóa dữ liệu thuộc cơ chế được phép, physical deletion/backlog/backups cần xác nhận trước cam kết. Không tự học từ feedback chưa review. Câu hỏi retention đang pending, không hỏi lại hoặc coi im lặng là đồng ý.

## Live và phát hành

Ngân sách Gemini 50000VND hiện reserved toàn bộ cho hai lượt thử cũ; không còn admission cho lượt paid mới. Cần đối chiếu usage/billing trước khi giải phóng dự phòng; actual billed cost Unavailable. Không yêu cầu tăng tiền để che thiếu bằng chứng.

Xác thực live bằng tài khoản được phép/AppCheck, nguồn được duyệt và endpoint đủ; chưa có release candidate được duyệt. Dirty concurrent WIP không được gom tự ý vào release. Deployment chỉ là bước cuối sau khi nguồn/chính sách/test/review/candidate/rollback đã đủ và có explicit deploy approval.

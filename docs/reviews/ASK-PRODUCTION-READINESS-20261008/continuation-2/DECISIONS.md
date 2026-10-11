# Quyết định cho Ask

Parser đã được duyệt, áp dụng và review xong ở vòng trước. Không cần duyệt lại phần đó. Các quyết định dưới đây vẫn chưa có câu trả lời xác nhận.

| Quyết định | Nội dung để xem | Phạm vi |
| --- | --- | --- |
| Giữ cleanup ngoài release | [Kế hoạch](HOLD-PLAN-r6.md) · [Bản vá](HOLD-APPLICATION-r6.patch) | Chỉ sửa release helper và tests; chưa deploy, bật retention hay xóa dữ liệu |
| Panel mới | [Thiết kế](../../ASK-PANEL-WORKCELL-20261008/DESIGN-PLAN.md) · [Bản xem VI/EN](../../../previews/ASK-PANEL-WORKCELL-20261008.html) | Form trong action window cuộn riêng, điểm hội thoại và chat xác nhận đúng preview; cần kiểm tra UI/scenarios sau áp dụng |
| Feedback | [Đề xuất](../../ASK-PLATFORM-HARDENING-20261007/FEEDBACK-POLICY-PROPOSAL.md) | 30 ngày cho loại góp ý và mã tham chiếu, có đồng ý/rút góp ý; không phải 30 ngày cho toàn bộ chat hoặc backups |
| Nguồn chính thức | Các đoạn hướng dẫn bên dưới | Owner chốt đúng nội dung, resource đã xuất bản, ngôn ngữ và thời hạn; OWNER có MFA gần đây preview và duyệt đúng hash |
| Chính sách giao dịch | Điều kiện đổi trả/hủy/hoàn tiền; quyền riêng tư/pháp nhân/liên hệ; hàng hạn chế, phí, thời hạn và cam kết | Cần chính sách do doanh nghiệp xác nhận; không suy cam kết từ nội dung đang chờ duyệt |
| Chi phí và kiểm chứng live | [Metadata và giới hạn](backend-r1.json) | Bằng chứng chi phí/usage có phạm vi và correlation/completeness cho hai lượt cũ; 50.000₫ vẫn dự phòng đủ, chưa gọi thêm |
| Artifact và deploy | Candidate, immutable hash, acceptance, rollout/rollback | Freeze đúng candidate được duyệt; giữ riêng các thay đổi đang làm song song và deploy sau khi đủ gate |

## Nội dung hướng dẫn để owner chọn

Đây là lựa chọn đề xuất tiếng Việt từ các trang vừa đọc lại, chưa xuất bản mới hoặc admit vào Ask:

- Trong danh mục: “Bạn thanh toán toàn bộ theo giá niêm yết.”
- Ngoài danh mục: “Bạn gửi yêu cầu, xem và đồng ý với báo giá trước khi thanh toán. Khoản thanh toán được chia thành hai đợt theo báo giá.”
- Đổi trả/hủy/hoàn tiền hiện còn chờ duyệt. Xác nhận trạng thái này không tạo điều kiện hoàn tiền mới.

Các đoạn trên không cung cấp giá, tồn kho hay eligibility hiện hành; không biến giá research thành báo giá chính thức; không xác nhận đã thanh toán hay cam kết ETA. Không suy ra retention, nguồn tiếng Anh hoặc nguồn đã được duyệt. Dùng tool/domain command cho dữ liệu hiện hành.

Để trống resource ID, slug, contentHash, expectedVersion và thời hạn cho đến khi owner chọn resource thật và authenticated preview trả đúng giá trị. Không tạo ID chính thức từ fixture.

## Câu hỏi để kiểm chứng

[12 câu đề xuất](KNOWLEDGE-CASES-r1.json) tách retrieval, ý nghĩa thanh toán, API/quyền truy cập và chất lượng trả lời LLM. Có câu không dấu, typo, cách nói thường ngày, giá research, tiền đề sai và truy cập đơn của người khác. Expected cần được duyệt trước khi dùng làm holdout.

Chẩn đoán trên ba fixture sections: 6/7 top-1 matches. Câu “đồ có sẵn trong shop cũng phải cọc trước rồi trả phần còn lại hả” lấy phần mua hộ trước. Với giới hạn mặc định 8, kết quả chứa cả ba phần, gồm phần danh mục. Đây chưa phải bằng chứng lỗi câu trả lời live; cần test sửa tiền đề ở cấp answer khi corpus và ngân sách sẵn sàng. Không đổi expected để làm kết quả xanh.

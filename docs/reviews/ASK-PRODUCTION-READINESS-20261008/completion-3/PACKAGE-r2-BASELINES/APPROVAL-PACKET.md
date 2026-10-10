# Ask

**Gói review chung cho phần còn lại.** Bản vá cleanup và parser đã áp dụng, kiểm tra và qua review cục bộ; không cần duyệt lại. Production vẫn **NOT_READY**.

| Phần cần xem | Bản đã chuẩn bị | Phạm vi sau khi duyệt |
| --- | --- | --- |
| Panel | [Bản xem Việt / Anh](../../../previews/ASK-PANEL-WORKCELL-20261008-r3.html) · [thiết kế](PANEL-DESIGN-r3.md) · [kế hoạch tích hợp](PANEL-INTEGRATION-ADDENDUM.md) | Form cuộn riêng, giữ draft, chat mở kiểm tra rồi xác nhận đúng tác vụ; kiểm chứng UI/domain thực tế |
| Knowledge | [Ba đoạn hướng dẫn tiếng Việt](BUSINESS-PACKET-r1.md) | Catalog thanh toán toàn bộ; mua hộ ngoài catalog cần yêu cầu và báo giá; điều kiện hoàn tiền còn chờ. Công bố qua workflow được phép rồi OWNER duyệt đúng nguồn/hash/version/thời hạn thật |
| Feedback | [Đề xuất giữ 30 ngày](BUSINESS-PACKET-r1.md) | Chỉ category và tham chiếu câu trả lời, có consent/rút góp ý. Xác minh đường cấu hình và cơ chế retention trước bật; không suy sang chat, đơn hay backup |
| Context và learning | [Kế hoạch và scenarios](KNOWLEDGE-CONTEXT-PLAN.md) | Hiểu câu không dấu, typo, hỏi tiếp và đổi ý; giữ authority của live facts và task. Feedback dẫn tới người xem xét/sửa nguồn, không tự train hay promote |
| Tìm web và phát hành | [Live / release](LIVE-RELEASE-PLAN.md) · [delta ngân sách](RESEARCH-ACCOUNTING-DELTA-PLAN.md) | Đối chiếu chi phí, review admission nếu cần lượt trả phí mới, kiểm chứng môi trường được phép; chọn candidate, build một lần, kiểm tra artifact và duyệt phát hành |

## Có thể ghi quyết định cùng một lần

- Panel: thiết kế ban đầu cùng r3 và addendum. Slice đầu gồm gửi yêu cầu, chấp nhận báo giá, duyệt bước cuối, xác nhận nhận đủ hàng và tạo đơn catalog. Profile/Membership giữ nút riêng trong slice đầu.
- Knowledge: xác nhận hoặc sửa ba đoạn VI, quyền tạo/công bố resource, locale và thời hạn hiệu lực. Publication không tự tạo knowledge approval.
- Feedback: 30 ngày hoặc giá trị khác trong phạm vi schema; operational owner/environment và version/expiry thật. Không cho phép xóa production/backup từ quyết định retention đề xuất.
- Learning/context: review nguồn thủ công và các slice trong kế hoạch; mỗi patch tiếp theo cần bind đúng scope/candidate trước áp dụng.
- Live/artifact: phạm vi kiểm chứng và chuẩn bị artifact. Deployment phải bind artifact thật đã kiểm chứng, không phải placeholder hoặc bản build lại.

## Thông tin cần có để chạy thật

Điều kiện đổi trả/hủy/hoàn tiền, hàng hạn chế, phí/cam kết dịch vụ và privacy/pháp nhân/liên hệ/chat/backup chưa có nội dung chính thức. Public terms hiện yêu cầu hoàn tất điều kiện trước giao dịch thật. Ba đoạn hướng dẫn không thay các chính sách này; mình giữ rõ phần chưa được xác nhận.

Resource knowledge, hash/version và thời hạn lấy từ publication/preview có quyền; không điền ID hoặc hash giả. Feedback cần đường cấu hình có quyền và readback; source đã đọc chưa xác lập writer này.

**Gemini: 50.000₫ đã được giữ dự phòng toàn bộ; chi phí thực tế chưa xác nhận.** Cần đối chiếu cả hai attempts cũ. Ngay cả sau settlement, admission hiện vẫn đóng vì yêu cầu import 50.000₫ rồi reserve thêm 25.000₫ trong cùng ceiling. Kế hoạch delta đã chuẩn bị; chưa áp dụng, không reset ledger, giảm import hoặc tăng budget.

Shared frontend 5207 vẫn được dùng; Auth/Functions không có listener ở check đợt này. Worktree có WIP song song, chưa chọn release commit hoặc tạo artifact production. Approval không thay các bằng chứng này.

## Kết quả đợt này

| Kiểm tra | Kết quả | Phạm vi |
| --- | --- | --- |
| Release/contracts | 58/58 đạt | Actual applied script; package fixtures và negative cases |
| Unit liên quan | 155/155 đạt, 8 files | Source logic về knowledge/context/feedback/budget/scenarios/release |
| Lint/syntax/backend compile/frontend typecheck/preflight | Đạt; 93 source exports | Local diagnostic; chưa artifact production |
| Cleanup transform | 8 held, 85 còn lại; giữ 6 feedback endpoints | 493 diagnostic inputs khớp; không gọi module/scheduler |
| Review code độc lập | PASSED cho hai file đã áp dụng | Production vẫn NOT_READY |
| Panel r3 | 144/144 lượt, 18 kịch bản / 4 kích thước / 2 ngôn ngữ | Bản xem tĩnh; không API/LLM/đơn/thanh toán |

[Báo cáo đầy đủ](REPORT.md) · [Applied review](REVIEW-r1.json) · [Code checks](CHECKS-r3.json) · [Browser receipt](PANEL-BROWSER-r3.json).

Các quyết định trước được gom ở đây, không hỏi lại theo từng agent. Mục chưa có giá trị thật tiếp tục PENDING/UNSET; không coi im lặng là chấp thuận. Không có paid call, commit/push, artifact production hoặc deployment mới từ gói này.

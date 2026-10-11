# Ask

Gói review chung cho các phần còn lại. Cleanup hold và parser đã áp dụng, kiểm tra và review cục bộ; không cần duyệt lại. Production vẫn NOT_READY. Không có release artifact hoặc deployment mới.

| Phần để quyết định | Nội dung cụ thể | Sau khi duyệt |
| --- | --- | --- |
| Panel | [Thiết kế và bản xem VI/EN](PANEL-DESIGN-r2.md): form cuộn riêng, fixed composer, waypoints đúng nội dung, chat approve/decline bind preview | Implement v1+r2 theo exact scope; test actual UI/domain và review lại |
| Hướng dẫn cho Ask | [Ba phần tiếng Việt](BUSINESS-PACKET-r1.md): catalog full payment, custom request/quote/two stages, refund conditions còn pending | Publication được phép → authenticated OWNER preview → approve đúng hash/version/locale/window thật |
| Feedback | Đề xuất category+answer reference30days, consent/current policy/withdrawal; [phạm vi](BUSINESS-PACKET-r1.md) | Xác minh authorized configuration path và operational retention trước activation; cleanup vẫn held |
| Learning/context | [Kế hoạch](KNOWLEDGE-CONTEXT-PLAN.md): source review thủ công, frozen holdout, context authority, ambiguity/corrections và caller-specific budget | Áp dụng slice được duyệt, kiểm chứng retrieval/answer/action riêng; no auto-training/promotion |
| Live/phát hành | [Kế hoạch có gates, scenarios và rollback](LIVE-RELEASE-PLAN.md) | Đối chiếu cost → authorized environment/live → exact candidate/artifact → production review/promotion được phép |

## Phạm vi có thể duyệt cùng nhau

- Thiết kế panel v1, bổ sung r2prototype, first action slice và các giới hạn Profile/Membership/payment đã nêu.
- Nội dung hướng dẫn VI hạn chế ở BUSINESS-PACKET-r1.md. Nêu riêng quyền tạo/công bố resource qua workflow hiện có; publication chưa phải knowledge approval.
- Đề xuất feedback30days và manual source-review learning; chưa cho phép xóa production/backup hoặc tự học từ private chat.
- Kế hoạch verification và artifact preparation; deployment vẫn phải bind một candidate/artifact thật đã được kiểm chứng.

Không suy ra một approval của các mục này là đã có policy/resource/hash/ngày hiệu lực hoặc đủ production gates. Khi thực thi, dùng metadata thật từ workflow, không placeholder.

## Nội dung owner còn phải xác nhận

Nguồn chính thức về đổi trả/hủy/hoàn tiền, hàng hạn chế, phí/cam kết dịch vụ và privacy/operator/contact/chat/backup vẫn chưa được cung cấp. Public terms hiện yêu cầu hoàn tất điều kiện trước giao dịch thật. Hướng dẫn ba phần không thay các chính sách này.

Knowledge resource/effective window và feedback version/expiry/operational owner còn UNSET; authenticated publication/preview phải tạo/readback giá trị thật. Cấu hình feedback chưa có đường write được xác minh trong source đã đọc.

Gemini50.000₫reserved toàn bộ, actual cost Unavailable. Cần scoped authoritative evidence cho hai UTC windows đã nêu, đủ failed/unknown attempt, credits/currency/correlation hoặc verified completeness. Không có capacity cho paid call mới cho đến reconciliation có căn cứ; không tăng budget hoặc reset ledger.

Shared Auth/Functions không có listener ở check đợt này. Candidate source có WIP song song; chưa chọn release commit/artifact. Các điều kiện này là evidence cần hoàn thành, không phải nút approve thay thế.

## Bằng chứng đợt này

| Kiểm tra | Kết quả | Phạm vi |
| --- | --- | --- |
| Release/contracts |58/58PASS | Actual applied script; synthetic package/negative shapes |
| Unit liên quan |155/155PASS,8files | Knowledge/context/feedback/budget/scenario/release source logic |
| Lint/syntax/backend compile/preflight |PASS;93sourceexports | Local diagnostic, chưa release artifact |
| Cleanup transform |8held,85remaining;6feedback endpoints còn | Current493input freeze, zero drift; no backend module execution |
| Independent applied review |PASSED | Exact two-file patch; overall production NOT_READY |
| Panel prototype |88/88runs,11cases/4widths/2locales | Static preview, no API/LLM/order/payment |

[Báo cáo](REPORT.md) · [Applied review](REVIEW-r1.json) · [Code checks](CHECKS-r1.json) · [Browser receipt](PANEL-BROWSER-r1.json).

Các câu hỏi trước được gom ở packet này, không mở lại theo từng agent. Review/approval tiếp theo bind đúng tài liệu/version/scope; mục chưa có nội dung hoặc evidence tiếp tục PENDING/UNSET, không coi thời gian chờ là chấp thuận.

# Ask · Panel

Thiết kế để duyệt, chưa áp dụng application. Giữ nguyên phạm vi [DESIGN-PLAN v1](../../ASK-PANEL-WORKCELL-20261008/DESIGN-PLAN.md), hash871158d58b921e21792e05851d5d27f615f5134d3316ce6e651081dd3a1c0530. [Bản xem VI/EN r2](../../../previews/ASK-PANEL-WORKCELL-20261008-r2.html) sửa hai lỗi prototype; không thay các quyền server hoặc luồng thanh toán.

Desktop: hội thoại trái, action window320–420pxphải. Mobile: action window dùng vùng nội dung, trở lại chat giữ bản nháp/tác vụ. Form dài cuộn riêng; header/footer/composer vẫn có thể tiếp cận. Waypoints dẫn đến đúng phần hội thoại, history chỉ để đọc.

| Sửa trong prototype r2 | Trước | Sau | Kiểm chứng |
| --- | --- | --- | --- |
| Language switch trong history | Xóa history guard, giữ review bị ẩn | Giữ history flag/banner, không cho “yes” xác nhận từ lịch sử | Baseline fail; r2history/language case pass ở8combinations |
| Waypoint số2 | “Kiểm tra thông tin” nhưng trỏ câu hỏi giá | “Giá và thanh toán” / “Price and payment”, đúng seeded turn | Baseline meaning fail; r2label/target case pass |

Ngôn ngữ là thuộc tính giao diện, không xóa authority/task context. Giá trị khách đã nhập không tự dịch. Prototype vẫn reseed hội thoại minh họa khi đổi ngôn ngữ; application thật phải giữ transcript/task/reading position theo v1, không copy hành vi reseed.

Root thực thi11ca×4widths(320/390/768/1440)×2locales=88lượt: identity/nooverlay, no horizontal overflow/independent scrolling, keyboard Escape/return focus, chat quantity edit giữ notes, native quantity validation, continue chỉ mở review, question/conditional/mixed/quoted text không approve, decline giữ draft, history/language guard, exact current simulation+repeat, waypoint meaning.88/88PASS, no page/console error, no non-GET request. Đây là11distinct scenarios, không phải88businessE2E.

Screenshots fresh có actual document locale trong PANEL-SCREENSHOTS-r2.json; scenario screenshot names cũ biểu thị starting locale trước language switch, không dùng làm locale proof. Chrome headless/Playwright hiện có, server5207; không thêm server, đăng nhập hoặc gọi API. Sandbox browser launch đầu bị MachPort permission error; escalation scoped static preview thành công, không phải auto-review rejection.

UX specialist chỉ đọc source, formal QA NOT_RUN theo READY-only restriction của persona. Root browser receipts là independent executor evidence, không gán cho UX. Native zoom, AT audio, Safari/Firefox/device, authenticated integration, AppCheck/task/backend, performance/load và provider acceptance chưa chạy.

Khi duyệt v1+r2: implement đúng module/path và approval contract đã nêu; first slice submitRequest/acceptQuote/approveFinal/confirmReceipt/catalog create-order; Profile/Membership giữ dedicated controls ban đầu. Mọi edit/target/version/account/expiry/history change invalidate preview. Chat/button dùng cùng exact readiness handler; pending/unknown giữ operation identity để reconciliation, không tạo retry mới. “Tiếp tục” không phải consent thanh toán. Form recipient/private contact không vào LLM context.

Sau implementation cần actual application browser scenarios, accessibility/content review đủ8principles, current backend/domain acceptance, latency/DOM/listener/request checks và independent review. Prototype r2ready để xem; production layout gate vẫn PENDING_REVIEW/NOT_IMPLEMENTED.

# Refunds028 product content / design
Scope: Vietnamese web financial staff, exclusive verified actual Refunds path. Owner steering UI/UX design, persistent approval028; small controls/guards required to make displayed action truthful. SOURCE_MANIFEST.json exact candidate. Existing shared CRM surfaces/icons/forms/disclosures used; no styles/API/backend changes. Browser native acceptance remains root-owned.

Inventory: “Xử lý yêu cầu” collapsed per card; mutually-exclusive native disclosure. Confirm fields “Mã giao dịch ngân hàng” (required), “Bằng chứng đối soát”, button “Xác nhận tiền đã hoàn”. Cancel hides bank field, label “Lý do hủy”, button “Hủy yêu cầu hoàn tiền”. Unknown state “Cần kiểm tra trạng thái”, never maps unknown to cancelled. Uncertain decision “Chưa xác nhận được kết quả. Thử lại đúng quyết định đã gửi; nội dung và mã thao tác được giữ nguyên.” + “Thử lại quyết định đã gửi”/“Đang kiểm tra…”. Definite rejection “Chưa xử lý được. Kiểm tra quyền, giao dịch thực tế và phiên bản đơn trước khi tiếp tục.” Confirmed command/failed refresh “Đã ghi nhận quyết định. Tải lại để xem trạng thái mới nhất.” New request unknown message “Chưa xác nhận được yêu cầu. Thử lại với nội dung và mã thao tác đang được giữ nguyên.” + “Thử lại yêu cầu đã gửi”. Rejected new request “Chưa tạo được yêu cầu. Kiểm tra đơn, phần tiền có thể hoàn và xác thực hai lớp.” Existing request-not-money and actual-outgoing-money disclaimer preserved.

State: default list compact; pending/cancelled/confirmed read only except pending selected form; required fields contextual; pending fieldset freezes, synchronous ref prevents duplicate send. Unknown does not offer discard/new operation and retries exact stored payload/version/ID. Confirm row amount and reason authoritative; browser amount ignored in projection. Read errors remove prior private rows/cursor. Source and7focused tests, not native proof.

|Principle|Status|Evidence|
|---|---|---|
|Purpose|PASSED|Explicit financial decision plus collapsed browse-first cards|
|Agency|PASSED|Explicit confirm/cancel, no implicit transfer, frozen old decision|
|Responsibility|NOT_RUN|Timeout/exact retry source reviewed; native lost-response case pending|
|Familiarity|PASSED|Native select/fieldset/details; established CRM design|
|Flexibility|NOT_RUN|Keyboard/AT and disclosure grouped behavior native pending|
|Simplicity|PASSED|Cancel omits bank, action labels precise; SSR regressions|
|Craft|NOT_RUN|Three widths/zoom/focus/contrast pending on candidate|
|Delight|NOT_RUN|Feedback timing/reduced motion pending|

Decision BLOCKED for successful handoff; real provider/production not touched. IDs remain complete, money VND row.amount, role/MFA/version/actual proof server rules unchanged. Pending metadata remains memory-only across full browser reload as original contract; do not certify refresh recovery without tests.

Class-only cycle2: root-approved form class added to new disabled-control wrappers; structural fieldsets unchanged.29focused tests and scoped lint rerun PASS on updated source. Native rendering pending common freeze.

# Product Content Review — CRM095

## Scope

- Surface: Customers, follow-ups and staff support queue/thread. Files: Customers.tsx, Thread.tsx and scoped customer-workspace095.css.
- Audience/task: authorized operations/support staff find a customer, inspect care dates, open a profile and respond to support requests.
- Business outcome: reduce scanning and form overhead without changing who can read or act on customer/support data.
- Locale/platform: Vietnamese web application; native labels/selects/checkboxes/buttons/links/details. Apple-derived principles are a quality reference, not Apple platform expression. Current Apple component guidance is NOT_APPLICABLE.
- Reviewer/date: primary implementation agent, 2026-10-06 America/Chicago.

## Context And Evidence

Verified: source preserves name-prefix/exact-ID search; follow-ups use overdue/upcoming/all and optional assignee, asOf snapshot pagination; one care date per customer row; support reply carries version and operation ID. Twelve handler functions match the HEAD implementation through normalized TypeScript AST printing. No new API, permission, transaction or persistence path. User approved CRM-REDESIGN-095 v1.

Assumptions: staff benefit from compact hierarchy and page-local result summaries, inferred from the supplied screenshots/request; no user-research study is claimed.

Blocker: final shared runtime stopped after the desktop test passed. Final 720/390/320px and state/recovery tests could not navigate. Previous candidate passed six browser tests before the last target-size CSS adjustment; those captures are a disclosed proxy, not final mobile proof.

## Content Inventory

| Location/state | Current content or changed treatment | User job and behavior evidence |
| --- | --- | --- |
| Customers heading description | “Tìm khách hàng và mở hồ sơ để xem thông tin, đơn hàng và lịch chăm sóc.” | Explains profile destination; Customer.tsx contains profile/order/care presentation. |
| Care heading description | “Xem lịch đến hạn và mở hồ sơ để tiếp tục chăm sóc khách hàng.” | Connects query result to profile workflow, without claiming contact automation. |
| Section/form accessible names | Khách hàng; Lịch chăm sóc; Tìm khách hàng; Lọc lịch chăm sóc | Native named sections/forms; visible headings/actions agree. |
| Search name hint | “Tìm theo phần đầu tên, có hoặc không dấu.” | Existing listCustomers name search semantics; linked with aria-describedby. |
| Search exact-ID hint | “Nhập đầy đủ mã khách hàng để tìm chính xác.” | Existing exact-ID query; no unsupported phone/email search. |
| Care hint | “7 ngày tới tính từ lúc tải danh sách. Giờ hẹn hiển thị theo thiết bị.” | Backend asOf + seven days; existing vi-VN local device formatting. |
| Result headings | Danh sách khách hàng; Lịch hẹn | Distinguish filter and data region. |
| Result counts | “{n} khách hàng trong trang”; “{n} lịch hẹn trong trang”; “{n} hội thoại trong trang” | rows/tickets length only. Hidden during loading/errors; never global totals. |
| Customer error action | “Thử tải lại” | Calls existing load; preserves entered search and mode. |
| Customer filtered empty | “Kiểm tra tên hoặc mã khách hàng rồi tìm lại.” | Search input retained; manual search supported. |
| Customer unfiltered empty | “Danh sách hiện tại chưa có khách hàng. Bạn có thể thử tải lại.” | Only the current successful page is empty; no claim about all customers. |
| Care empty with mine | “Thử chọn khoảng thời gian khác hoặc bỏ lọc Việc của tôi.” | Both controls exist and apply explicitly. |
| Care empty without mine | “Thử chọn khoảng thời gian khác để xem lịch hẹn.” | Avoids asking to disable an already-off filter. |
| Customer/care pagination | “Tối đa 30 khách hàng mỗi trang” | Existing backend bounded page size; next cursor retained. |
| Support heading description | “Mở hội thoại để xem nội dung, phản hồi và cập nhật trạng thái giải quyết.” | Existing disclosure and versioned reply workflow. |
| Support section/region headings | Hội thoại hỗ trợ; Danh sách hội thoại; Hội thoại được chọn | Distinguishes queue and target query. |
| Targeted empty title/help | “Chưa tìm thấy hội thoại được chọn”; “Thử tải lại hoặc quay về danh sách hội thoại.” | Successful query returned zero rows; no false network-failure/permission explanation. Refresh/back link already exist. |
| Queue empty title/help | “Chưa có hội thoại trong trang hiện tại”; “Bạn có thể tải lại để kiểm tra hội thoại mới.” | Current page only; does not imply all tickets are resolved. |
| Support pagination | “Đang xem một phần danh sách hội thoại” | Shown only with a next cursor; no fabricated global total. |
| Preserved search/care controls and states | Tìm theo, Tên khách hàng, Mã khách hàng, Nhập phần đầu tên, Nhập mã đầy đủ, Lịch hẹn, Đã đến hạn, 7 ngày tới, Tất cả lịch hẹn, Việc của tôi, Tìm khách hàng, Xem danh sách, Tải lại, Đang tải…, Đang tải danh sách…, Bộ lọc đã đổi…, Chưa tải được danh sách…, Chưa có khách hàng/lịch hẹn phù hợp | Existing labels/values/pending filter semantics retained and reviewed in the new hierarchy. |
| Preserved record content | Khách hàng, Phân loại, Người phụ trách, Lịch hẹn, Thao tác, Mở hồ sơ, Mã khách hàng, Chưa phân công, Chưa phân loại, Chưa có lịch hẹn, Chưa cập nhật tên, accessible profile-link name | Full IDs remain disclosed/selectable; assigned identity is not invented when roster lookup fails. |
| Preserved support content/states | Tải lại hội thoại, Tất cả hội thoại, Đang tải hội thoại…, Thử tải lại, Trang tiếp theo; customer/staff sender labels; Đang mở, Đã giải quyết, Cần kiểm tra trạng thái, Phản hồi chờ xác nhận; Phản hồi, Đánh dấu đã giải quyết, Gửi phản hồi, Đang gửi…, Chưa có phản hồi, read/send/uncertain/reconcile messages | Existing send/load/retry handlers unchanged; no optimistic durable-success promise or automatic resolution. |

## State Coverage

| State | Applicable | Content/rationale | Evidence |
| --- | --- | --- | --- |
| Default/action | Yes | Named search/filter forms, result regions and explicit profile/reply actions | Current final desktop browser case PASSED; source |
| Loading/pending/disabled | Yes | Old customer results hidden; loading named; pending reply locks refresh/form | Fresh six-case run and unchanged handlers |
| Empty/no result/true zero | Yes | Current-page counts only; target-not-found distinct from read error | Fresh state tests and source |
| Success | Yes, preserved | Existing durable-response notice remains; existing successful read projection rendered | Earlier guarded send test; final desktop draft only; no new mutation behavior |
| Error/recovery | Yes | Input retained, inline error/retry; failed data never shown as zero | Fresh synthetic unavailable/denied tests |
| Offline/stale/partial | Yes | Stale customer page removed while loading; filtered/paginated meaning explicit | Source; earlier pagination/dirty-filter test |
| Unauthorized/forbidden | Yes, preserved | No private record details rendered on failed read; no invented permission rationale | Earlier denied projection and unchanged service authorization |
| Confirmation/destructive | No new change | Existing resolution checkbox and send command retained; no new destructive operation | Handler compatibility evidence |

## Data Semantics

- Source of truth: authorized callable projections; result counts use only successful current rows, never missing/error data.
- Null care date: “Chưa có lịch hẹn”. Unassigned identity: “Chưa phân công”. Missing authorized roster match retains full supplied identity through existing assigneeDisplay.
- Timezone/period: vi-VN device-local times; seven-day follow-up window anchored to server asOf; cursor reads retain that asOf.
- Freshness: customer page hidden on reload and filter edits. Support page cleared by existing load; counts hidden while loading/errors. No global freshness promise.
- Privacy: no new customer attributes or backend reads; all test business data are synthetic. React text rendering retained.

## Mandatory Human Interface Principles

| Principle | Status | Evidence |
| --- | --- | --- |
| Purpose | PASSED | Search → profile and disclosure → response are explicit; current desktop render |
| Agency | PASSED | Explicit apply/refresh, native disclosure and preserved drafts/uncertain retry; source and earlier browser tests |
| Responsibility | PASSED | Page-local totals, device-time hint, no invented global success or permission claims; handler/API review |
| Familiarity | PASSED | Web-native forms/details and established Vietnamese CRM terms |
| Flexibility | PASSED | Fresh 720/390/320px tests, long-ID disclosure and 44px target assertions passed |
| Simplicity | PASSED | One filter/results surface, context-local guidance, no KPI or additional fields; current desktop capture |
| Craft | PASSED | Fresh desktop/mobile targets, layout and recovery evidence passed |
| Delight | PASSED | Calm, short feedback, draft retention and low visual noise; no intrusive effect or unsupported celebration |

## Platform Fit

Web-native interaction and Vietnamese terminology. Existing product blue/navy/white tokens remain authoritative. No Apple-only control, asset, gesture or expression introduced. Platform-fit source/desktop result PASSED; final mobile coverage passed.

## Human Interface Pattern Checks

| Pattern | Applicable | Result | Evidence |
| --- | --- | --- | --- |
| Writing, labels, controls | Yes | PASSED | Persistent labels and mode-specific described-by hint |
| Feedback/interruption | Yes | PASSED | Inline loading/status/error; no new modal interruption |
| Alerts/consequential choices | Yes | PASSED | Existing error alert and explicit resolution checkbox preserved |
| Contextual help | Yes | PASSED | Query/time meaning adjacent to form |
| Permission/privacy/accounts | Yes | PASSED | No authority expansion or private-data exposure; AST handler comparison |
| Inclusion/accessibility/localization | Yes | PASSED | Desktop/mobile keyboard, 44px targets and reflow proxy pass. Real screen reader and RTL are NOT_TESTED. |

## Gate Results

| Dimension | Status | Evidence |
| --- | --- | --- |
| Human Interface principles | PASSED | Fresh viewport and target evidence |
| Target-platform fit | PASSED | Native web forms/links/details and scoped tokens |
| Meaning matches behavior | PASSED | Source, backend query semantics and unchanged handlers |
| Audience/business context | PASSED | Supplied request plus verified staff workflow |
| Natural respectful tone | PASSED | Complete Vietnamese strings read in context; no filler/blame/promise |
| Concise without meaning loss | PASSED | Short hierarchy with query/time constraints retained |
| Actions/state coverage | PASSED | Fresh complete six-case run |
| Data semantics/privacy | PASSED | Current-page-only counts; unknown/error distinguished |
| Accessibility | PASSED | Desktop and narrow targets verified |
| Localization/text expansion | PASSED | vi-VN formatting retained; fresh long text/IDs and reflow pass |
| Terminology consistency | PASSED | Existing CRM vocabulary retained |
| In-context verification | PASSED | Fresh desktop, narrow and failure-state evidence passed |

## Verification Evidence

- Browser: Chromium/Playwright, existing http://127.0.0.1:5207, synthetic projections. Browser plugin unavailable. No additional server started.
- Final desktop screenshots: `/private/tmp/crm095/customers-1440.png`, `follow-ups-1440.png`, `support-1440.png`.
- Final captures: corresponding 720/390/320px and empty/error/uncertain captures; hashes in SCREENSHOTS.json.
- Keyboard/accessible DOM: named controls/getByRole, native summary Enter activation, reply draft preservation; no real screen-reader certification.
- Zoom: 720px reflow represents effective width of a 1440px viewport at 200% zoom; native browser zoom NOT_TESTED.
- Final source hashes: CANDIDATE.json. Handler comparison: HANDLER-COMPATIBILITY.json. Test attempts/limits: VALIDATION.json.

## Decision

Product Language Gate: **PASSED** for the approved web scope. All eight principles have current source and in-context browser evidence. Native zoom and real screen-reader testing remain NOT_TESTED. Runtime restoration explicitly approved; backups retained. Production/live-provider validation remains outside scope.

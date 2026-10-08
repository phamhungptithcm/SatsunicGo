# Product Content Review — FINANCE112

Reviewed 2026-10-07; web CRM, Vietnamese, staff/finance operators. Goal: choose the right queue, inspect transaction context and evidence, and submit the correct financial action. Scope: Finance.tsx, FinancialReview.tsx, finance-workbench112.css. Web native details/forms and shared PageTabs/StepForm; Apple-derived principles are quality references, no Apple platform-compliance claim.

## Context and evidence

Verified: tabs are independent queues; listWork paging replaces at most 30 loaded records. Transfer notifications are not confirmed money; membership confirmation activates a plan rather than paying purchase-order balance; exception closing records a decision without new money; allocation requires verified inbound; reversal retains history and holds the order. All command/state prefixes compare identical to HEAD. No fake totals, progress, ETA, deadlines or production claims.

Assumption: existing audience and domain semantics remain authoritative. Product discovery with actual operators was not conducted. Evidence is actual React components and shell styles using synthetic browser-local transport on shared 5207, not authenticated provider acceptance. No live money or private data used.

## Content inventory

| Location/state | Previous | Final content | Job and verified meaning |
| --- | --- | --- | --- |
| Page/default | Long generic membership notice | Đối chiếu giao dịch ngân hàng, xác nhận tiền vào và xử lý khoản chưa khớp. | States the page purpose without implying automated matching |
| Paging qualification | Mỗi nhóm hiển thị tối đa 30 bản ghi đã tải; không phải tổng toàn hệ thống. | Mỗi nhóm hiển thị tối đa 30 bản ghi trên trang hiện tại, không phải tổng toàn hệ thống. | Explicit current-page limit; not queue totals |
| Transfer/context | Generic page notice | Kiểm tra đúng đơn, số tiền và tài khoản nhận trước khi xác nhận. Thông báo của khách chưa phải tiền đã xác nhận. | Explains the real verification boundary |
| Transfer/empty | Empty title only | Chọn nhóm khác để kiểm tra hóa đơn thành viên hoặc ngoại lệ thanh toán. | Uses available tabs; does not manufacture work |
| Membership/context | Generic page notice | Xác nhận tiền vào để kích hoạt đúng gói thành viên. | matches membershipCommand confirm |
| Membership/all states | English membership terminology | Tiền gói thành viên chỉ phân bổ cho hóa đơn gói, không thanh toán số dư đơn mua hộ. | Preserves separate ledger meaning |
| Membership/empty | Chưa có hóa đơn membership trong trang này. | Chưa có hóa đơn thành viên trong trang này. | Current page empty, not global zero |
| Membership/fallback name | Gói membership | Gói thành viên | Natural consistent Vietnamese; not a fabricated plan name |
| Membership/pre-submit | No local consequence | Chỉ xác nhận khi đã đối chiếu tiền vào đúng tài khoản doanh nghiệp. Thao tác này sẽ kích hoạt gói thành viên. | States requirement and durable consequence beside submit |
| Exceptions/context | Generic description per record | Kiểm tra giao dịch chưa khớp. Chỉ phân bổ vào đơn khi tiền vào đã được xác minh. | Preserves inboundVerified constraint |
| Secondary/heading | Reversal before tabs | Điều chỉnh giao dịch | Separates uncommon adjustment from daily queues |
| Secondary/context | Form help only | Dùng khi ngân hàng đã đảo khoản tiền vào được ghi nhận trước đó. | Real reversal, not arbitrary ledger correction |
| Transfer/facts | Amount and reference embedded in a paragraph | Số tiền khách thông báo; Nội dung chuyển khoản | Amount remains reported, not recognized revenue; reference unchanged |
| Transfer/notice | Sentence inside transfer paragraph | Thông báo chưa phải tiền đã xác nhận. | Same meaning near record action |
| Exception/final close | Submit label only | Đóng ngoại lệ chỉ lưu kết quả kiểm tra, không ghi thêm tiền. | Accurate closeException payload |
| Exception/final allocate | Submit label only | Phân bổ tiền đã xác minh vào đơn đã chọn, không tự cho đơn đi tiếp. | Accurate allocation consequence |
| Reversal/final | Submit label only | Ghi nhận khoản ngân hàng đã đảo, giữ lịch sử gốc và tạm giữ đơn để đối soát. | Accurate reversal consequence |
| Global error/retry | Below all panels | Same strings, above queue, pending notice gains role=status | Recovery more discoverable; exact operationId retained |

All unchanged headings, tabs, validation labels, status labels, submit actions and errors remain authoritative. No accessible label mismatch introduced. Decorative icons use aria-hidden.

## State coverage

| State | Result | Evidence |
| --- | --- | --- |
| Default/action | PASSED | desktop/tablet/mobile queue and form screenshots |
| Loading/pending/disabled | PASSED | preserved LoadingState; retry test verifies disabled tabs, form and exact-command reuse |
| Empty/no result/true zero | PASSED | empty fixture; current-page qualification retained; error and denied tests do not show empty |
| Success | PASSED | synthetic transfer retry reaches durable success only after successful transport response |
| Error/recovery | PASSED | read failure and uncertain-write browser tests; command-state prefixes unchanged |
| Offline/stale/partial | PASSED | unavailable read simulated; existing stale wording remains; readQueues allSettled failure guard unchanged; no automatic fallback |
| Unauthorized | PASSED | denied fixture removes protected queues and shows recovery action |
| Confirmation/consequential | PASSED | exception StepForm final review and consequence shown; allocation option absent when inbound not verified |

## Data semantics

Source: existing listWork payloads and command responses. VND via vi-VN locale, same precision and amounts. No dates, totals, new aggregation or freshness claims. Unknown/error stays unavailable, never converted to empty zero. Displayed references remain exact; long values wrap. Access/privacy and backend control untouched.

## Human Interface principles

| Principle | Status | Current evidence |
| --- | --- | --- |
| Purpose | PASSED | Daily queues precede secondary bank reversal |
| Agency | PASSED | Manual keyboard tab activation; retained drafts; existing back/next and retry controls |
| Responsibility | PASSED | Reported-versus-confirmed money and all consequential actions are explicit |
| Familiarity | PASSED | Existing blue/navy PageTabs, icons, labels and native form/details patterns |
| Flexibility | PASSED | 320/390/768/1440 widths, keyboard arrows/Enter, long reference wrapping, reduced-motion and enlarged text proxy |
| Simplicity | PASSED | Contextual notices replace page-wide warning; short two-field forms do not gain unnecessary steps |
| Craft | PASSED | Actual shell stylesheet loaded, summary hit target corrected to 44px, current screenshots and tests |
| Delight | PASSED | Lower reading burden, preserved drafts and calm recovery; no celebratory finance copy or decorative animation |

## Platform fit and pattern checks

Web platform PASSED: ARIA tablist/tab/tabpanel IDs, manual keyboard activation, native persistent labels, required fields, focus outlines, details disclosure, locale formatting, no Apple-only control or asset. Blue #163cff/navy #111c35 design-system identity retained; no new dependencies.

Writing/control, feedback, contextual help, consequential decisions, permission/privacy and Vietnamese terminology checks: PASSED. No new alerts/permission request. Accessibility: PASSED for scoped keyboard, target size, visible labels, semantic roles and focus rules. Screen-reader session and full automated a11y audit NOT_RUN; no certification claimed. RTL is not applicable to this Vietnamese-only change. Long content and narrow layouts verified; 125% inherited text test is an expansion proxy rather than comprehensive browser-zoom acceptance.

## Verification

7 focused browser checks pass after final CSS correction; 9 finance unit checks pass; frontend TypeScript and scoped ESLint pass. Screenshots: empty-desktop/mobile; transfer and exception at 390/768/1440. Browser pageerror collection empty. Native financial validation attributes, fields, disabled behavior and command logic are unchanged. Product Language Gate: PASSED within this scoped web UI, using explicitly disclosed synthetic transport evidence. Residual risk: authenticated/provider behavior and real operator usability not verified.

# REFUND-112 Product Language Gate
Audience Vietnamese staff on web managing refund requests. Request reserves eligible refund amount; confirm records reconciliation of actual outgoing transfer, no automatic money transfer. Short wording preserves this distinction. Changed inventory: header action “Tạo yêu cầu hoàn tiền” → “Tạo yêu cầu” within “Yêu cầu hoàn tiền” heading; long reservation/verification notice → “Tạo yêu cầu chưa chuyển tiền. Chỉ xác nhận sau khi đã đối chiếu khoản hoàn thực tế.”; removed “Danh sách theo trang”. Existing empty state “Chưa có yêu cầu trong trang này.” retained to avoid claiming whole-system zero. Form final action stays “Tạo yêu cầu hoàn tiền”; reload, labels, statuses, error/uncertain retry and money units unchanged. No optimistic-success or cancellation/payment claims added.

Actual component rendered using real CRM CSS/shared composer/StepForm with read-only synthetic API on shared5207. 22 assertions at320/390/1280: heading alignment desktop, no overflow, short notice, caption absence, form first focus, step progression, close and draft retention. Screenshot390 inspected. Initial draft selector failed because field retained in hidden step; fixture corrected to inspect mounted input. Desktop heading margin misalignment found/fixed/retested. Error/loading/uncertain paths inspected in preserved source, financial command handlers unchanged;7 contextual refund unit tests passed. Screen-reader software/live provider NOT_TESTED. Fixture uses standalone CrmHeading fallback; real shell portal not runtime-tested in this task.

| Principle | Status and evidence |
| --- | --- |
| Purpose | PASSED: create action beside request list heading, form remains contextual. |
| Agency | PASSED: explicit create, close retains draft, existing keyboard stepper. |
| Responsibility | PASSED: request is not transfer; real reconciliation required, safety handlers unchanged. |
| Familiarity | PASSED: project-native CRM headings/buttons/form/stepper/empty state. |
| Flexibility | PASSED:320/390/1280 no overflow, preserved shared focus and keyboard support. |
| Simplicity | PASSED: one concise notice, redundant caption removed, action grouped with object. |
| Craft | PASSED: tested field focus/draft retention, corrected inherited margin, responsive screenshot. |
| Delight | PASSED: natural short language and predictable task flow, no extra interruption/motion. |

Product Language Gate PASSED within disclosed rendered proxy. Platform fit native web; no Apple-platform expression. Localization Vietnamese, no data units/domain enums changed. Null/zero/paged semantics preserved. Empty/default/create/close states observed; money errors and pending/retry meanings preserved and reviewed. No generic whole-project accessibility/compliance claim.

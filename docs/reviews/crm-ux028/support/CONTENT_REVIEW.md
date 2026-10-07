# Support028 product content review

Approved lease: Thread.tsx and focused tests/docs only. Source-bound intelligence DEGRADED. Public Support caller, workspace reply schema/authorization/idempotent replay and ticketMessages read limits verified. Actual initial message, reply fields and resolution checkbox semantics retained. No invented SLA, unread count or agent identity. Staff-only first-open lazy mount; visited cards retain reply drafts when closed.

Changed states and strings: Đang tải phản hồi… (read pending), Chưa có phản hồi. (successful empty), Đã gửi phản hồi. (command acknowledged), Chưa tải được phản hồi. Bạn có thể thử tải lại. (read failure), Chưa xác nhận được kết quả gửi. Thử lại để kiểm tra đúng phản hồi đang chờ. (unknown issued command), Phản hồi chưa được chấp nhận. Tải lại hội thoại trước khi gửi lại. (definite rejection), Thử lại phản hồi đang chờ (same exact command), Tải lại phản hồi (read retry), Cần kiểm tra trạng thái (unrecognized staff ticket status). Existing named reply/resolve controls retained. Read and command errors are separate so a new read cannot erase unresolved-operation guidance.

| Principle | Status | Source / missing native evidence |
|---|---|---|
| Purpose | PASSED | Browse ticket subjects, open actual conversation deliberately |
| Agency | PASSED | Explicit resolution and immutable exact retry; drafts retained after closing |
| Responsibility | NOT_RUN | Source locks and stale-response guards; actual lost-response/server replay pending |
| Familiarity | PASSED | Existing native details/summary, labeled textarea/checkbox/buttons |
| Flexibility | NOT_RUN | Staff lazy load, public shared safety correction; keyboard/AT pending |
| Simplicity | PASSED | Closed staff cards omit reply editor and message requests |
| Craft | NOT_RUN | Current mobile/desktop, zoom and focus evidence pending |
| Delight | NOT_RUN | Source feedback; native loading/focus timing pending |

3 focused contract/rejection tests PASS and scoped eslint PASS. These do not prove native transport recovery or full product readiness. Runtime/compiler/native runners integration-root-owned. Pending metadata survives closing a visited card, but is memory-only and is lost on route unmount/full reload; no global navigation guarantee. Product language gate BLOCKED pending in-context native/AT evidence.

Review cycle1: command success/refresh distinction, locks, identity and lazy mounting inspected. Cycle2 found read refresh could erase pending-command guidance; separate readError implemented and same three tests/lint rerun PASS. No shared style/backend/route edits.

Cycle3: workspace.ts:592-601 throws aborted for version mismatch before transaction commit. Root approved classifier delta: aborted releases pending identity, leaves draft editable and instructs reload; unavailable/internal/timeout remain unresolved. Assertion added, 3 focused tests and lint rerun PASS. Native stale version and reload-needed behavior still pending.

Current scoped delta: StaffTicket now displays Phản hồi chờ xác nhận while existing onBusyChange is true, covering issued busy/unknown result even when details closes; public Support has no badge change. Prior5native passes predate this visual delta.13existing focused regressions and scoped lint PASS; they do not exercise rendered classifier/badge recovery. Actual native affected-state acceptance and current compiler root-owned pending. No runtime writes under current integration window. Product/whole CRM NOT_READY.

Independent-review cycle: definite rejection blocks new reply until explicit Tải lại phản hồi reads actual positive integer version through existing staff listWork exact-ID or owner getDocFromServer with current Firestore owner-only rules. Typed body/resolve selection preserved. Unknown pending replay remains exact original operation/version/body, independent of refreshed props. No backend/API/permission changes or public callsite edit; staff inner wrapper passes context only to select existing enforced read. Missing/invalid version never defaults to invented value. Existing read/rejection strings apply; no additional visible labels. Repository Intelligence now READY via CodeGraph/CocoIndex scoped queries (refreshfalse), contracts critically source-verified.19focused tests (7change-contextual+3domain+5customer+4support) and scoped lint PASS. Source review checked input capture/remount/version reconciliation and explicit current-authority reads; actual rendered recovery/AT/compiler pending with root. Product gate BLOCKED.

Integrated compiler followup: exact StaffSupport refresh call corrected from boolean to no cursor; Thread actual-version reload stays booleantrue. Gate refresh9 READY before protected edit; CodeGraph/CocoIndex queried current StaffSupport cursor contract. Authorized frontend npx tsc --noEmit PASS,19focused tests PASS, Thread scoped lint PASS. Source frozen; root fullbuild/functions/native stillpending, no runtime writes.

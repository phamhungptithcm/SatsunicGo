# Product Content Review

Scope: owner Account/PublicTrackingCode revoke retry after a newer alias was issued elsewhere. Functions previous-operation error-state meaning changes; existing text/layout/localization preserved. Web, Vietnamese owner management surface. Reviewer: Codex automated source/component review,2026-10-10. Apple platform compliance NOT_APPLICABLE; checked local human-centered reference, preserve web buttons/role=alert rather than Apple controls.

Verified: access.activeHash is the transaction source of truth; lost-response replay with no replacement remains successful and causes no additional audit. Replay after replacement returns existing failed-precondition message, does not revoke the replacement, mutate the order or add audit. Actual rendered PublicTrackingCode component receives unavailable then failed-precondition on same operationId, exposes role=alert, leaves revoke enabled, and does not announce false success. No new UI strings or PII fields.

Inventory:
| Surface/state | Existing content | Final behavior/evidence |
| --- | --- | --- |
| Callable stale replay | Mã đã được thay thế hoặc thu hồi. | Now applies to replaced revoke as well as replaced issue; no capability/state leaked |
| Account error/recovery | Chưa xử lý được mã tra cứu. Kiểm tra kết nối và thử lại. Nếu đơn đã thay đổi, tải lại trang. | Existing alert rendered after stale replay; reload or a new deliberate action recovers |
| Success | Đã thu hồi mã tra cứu. | Only successful current revocation acknowledgement; new regression asserts absent on rejected replay |
| Default/action | Mã tra cứu cho khách; Tạo mã tra cứu; Thu hồi mã | Preserved |
| Pending/disabled | Đang xử lý…; buttons disabled | Preserved single request behavior |
| Offline/timeout | Existing safe error/retry state | Covered by prior and rerun component tests; no new persistence |
| Unauthorized | No component for wrong uid; backend owner/lock guard | Existing account-switch/code generation tests rerun |
| Empty | No issued code displayed until validated success | Preserved; null is never a plaintext capability |

Data: no ETA/timeline format change. code=null in successful response means access fence is currently revoked at transaction read; stale historical success is not reused across replacement. New code remains valid; old alias remains denied. Existing30-day logical expiry and server idempotency unchanged. No destructive data deletion or new confirmation flow.

| Principle | Status | Current evidence |
| --- | --- | --- |
| Purpose | PASSED | Owner can accurately manage shared tracking access; false successful revoke prevented by emulator regression |
| Agency | PASSED | Explicit revoke/new-issue controls retained and enabled after recoverable failure in actual component test |
| Responsibility | PASSED | Does not assert a replacement capability revoked; no new code/PII output or hidden writes |
| Familiarity | PASSED | Established Vietnamese terms and web button/inline alert pattern unchanged |
| Flexibility | PASSED | Existing native buttons/alert remain keyboard and assistive-text accessible; Account management locale remains existing Vietnamese, no locale expansion claimed |
| Simplicity | PASSED | Reuses current error/recovery state; no extra modal/layout/content |
| Craft | PASSED | Backend outcome agrees with rendered text; same-id lost-response retry tested in context and successful/failed states distinguished |
| Delight | PASSED | Calm recovery and accurate acknowledgement without extra interruption or forced animation |

Platform fit PASSED for this bounded change. No visual layout alteration or screenshot claim. Hardware assistive tech/full hosted UI NOT_RUN. Assumption: owner reloads to recover a permanently stale operation after replacement, supported by existing error text. No unknown business meaning needed for this repair. Product-language decision PASSED only when attached emulator and component run pass at final source. Evidence: REVOKE-BASELINE.log, EMULATOR.log, ACCOUNT-COMPONENT.log, functions/src/public-order-tracking.ts, tests/component/public-code-sync.test.ts.

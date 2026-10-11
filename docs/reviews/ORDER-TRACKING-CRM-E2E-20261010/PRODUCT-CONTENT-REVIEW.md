# Product content review — 2026-10-10

Scope: existing web AccountTracking, owner/guest Ask tracking, shipping timeline mappings and server receipt validation. Audience: owner checking an order or guest holding an owner-issued SGT capability. Goal: understand recorded progress and ETA without exposing private data. Reviewer: primary implementation agent; no independent human accessibility sign-off. Apply web-app, product-content, visual-design, animation-motion and TypeScript profiles. Apple platform HIG compliance: not applicable; repository Human Interface principles used as a quality reference only, preserving SatsunicGo web brand/components.

Verified sources: shipping/consolidation transactions, safe owner/public projection, refresh lifecycle, REAL-HTTP.json, BROWSER-RESPONSIVE.json, final screenshots and component logs. Configuration labels are source-controlled; this patch introduces no master-data editor. Recorded dates come from transaction events, read time from callable observation, timezone from browser. Legacy absent times remain unknown. ETA is a staff-entered interval, never carrier GPS or a guarantee. Partial allocations, missing canonical parcels, hold/failure/return suppress a whole-order promise. Owner receipt requires actual canonical delivered quantities and existing financial guards.

## Changed content inventory

| Location/state | Implemented VI / EN | Meaning and evidence |
| --- | --- | --- |
| OrderTracking history dispatch | Đã xuất gửi / Dispatched | parcelDispatch event; single and batch backend tests |
| History packing | Đã ghi nhận đóng kiện / Parcel packing recorded | parcelPacked; command transaction |
| History progress | Đã cập nhật vận chuyển / Shipping updated | parcelProgress, does not mark whole order delivered |
| History delivery | Đã giao đủ các kiện / All parcels delivered | parcelDelivered only after fullyDelivered quantity check |
| History ETA | Đã cập nhật dự kiến giao / Delivery estimate updated | Does not map to a new shipping milestone; backend H10/N27 |
| Owner footer | theo cập nhật đã ghi nhận / recorded updates | Replaces inaccurate 'not live' wording; no carrier real-time claim |
| Guest footer | Theo cập nhật đã ghi nhận / Recorded updates | Same observation qualification; four-key public DTO |
| Refresh default | Tự kiểm tra cập nhật khi đang mở. Tra cứu khách tối đa mỗi phút. / Checks for updates while open. Guest tracking checks at most once a minute. | Visible/online active loop; guest budget60s |
| Refresh pending | Đang cập nhật tiến độ… / Updating progress… | One-flight; aria-disabled prevents repeats without removing keyboard focus |
| Refresh stale | Chưa lấy được cập nhật mới. Thông tin bên trên có thể đã cũ. / New updates are unavailable. The information above may be out of date. | Transient failure/offline retains only scoped snapshot with read time |
| Refresh cooldown | Vừa kiểm tra tiến độ. Sẽ kiểm tra lại sau một phút. / Progress was just checked. Checks resume after one minute. | Guest manual and automatic share budget; visibility/online constraints still apply |
| Refresh unavailable | Không thể tiếp tục tra cứu. Nhập lại mã hoặc kiểm tra tài khoản. / Tracking is unavailable. Re-enter the code or check your account. | Terminal denial clears active card/capability, keeps recovery message |
| Refresh action | Cập nhật tiến độ / Refresh progress | Accessible manual fallback, no mutation |
| Account offline | Đang mất kết nối. Tiến độ bên dưới có thể đã cũ; dự kiến nhận hàng sẽ hiện lại sau khi kiểm tra được cập nhật mới. | Aggregate promise hidden offline; online retry loads before re-presenting it. Account existing locale is VI |
| Receipt rejected | Chưa xác nhận được đủ kiện của đơn. | Server canonical registry/parcels invalid, partial or missing; no private detail included |

Existing Account loading/error/retry/auth-change text unchanged: 'Đang tải tiến trình đơn hàng…', 'Chưa tải được tiến trình đơn hàng. Kiểm tra kết nối và thử lại.', 'Tải lại tiến trình', 'Phiên đăng nhập đã thay đổi. Mở lại đơn hàng trong tài khoản của bạn.' Tests verify current state/ownership; no raw SDK diagnostic shown. Guest no-result remains generic and does not reveal order existence. No new destructive confirmation, purchase promise, consent or permission copy.

## State coverage

Default/action, pending/disabled, success, no result/unknown, error/retry, offline/stale/partial and unauthorized/unavailable are covered by unit/component or real emulator checks; see scenario matrix. Native UI covered recorded delivered state, ETA→delivery refresh, offline UI-event simulation, VI/EN layouts and keyboard refresh. Native Shipping component conflict/reconcile, before-request abort and after-commit response-body abort/retry are now covered with real Firebase transport; see NATIVE-CRM-ADVERSE.json. The fixture is not the full production CRM shell. Confirmation/destructive state: no new control or consequence; existing owner issue/revoke code behavior preserved and adversarial component tested.

Privacy: owner endpoint/rules require current owner. Guest receives only publicStatus/updatedAt/observedAt/eta, with capability redacted from transcript, no private fallback. No recipient, amount, address, evidence or actor added. Native fixture client analytics/provider are disabled; server analytics config readback is disabled, no owned analytics jobs. No production/provider proof.

## Mandatory Human Interface principles

| Principle | Status | Current in-context evidence |
| --- | --- | --- |
| Purpose | PASSED | final-owner/guest screenshots show progress, current stage, timestamp and estimate first |
| Agency | PASSED | Manual refresh/close/stop; native keyboard refresh and close plus component cancellation35 tests |
| Responsibility | PASSED | Recorded/read timestamps separate; offline screenshot explicitly says old; public DTO isolation verified HTTP |
| Familiarity | PASSED | Existing SatsunicGo timeline, current badge, native button/dialog semantics retained; same Account/Ask component |
| Flexibility | PASSED | VI/EN320/390/1280; owner contrast minimum4.98:1; guest axe complete; native Chrome reduce emulation disables all timeline motion. Escape/close restore input focus after reproduced bug fix. MOTION-BROWSER.json and motion screenshots |
| Simplicity | PASSED | No language toggle or next-step promotional card reintroduced; only concise refresh row added |
| Craft | PASSED | Single-line timestamps, bounded horizontal timeline, no page overflow in actual iframe widths; focus-loss defect repaired |
| Delight | PASSED | CRM-driven answer updates without a new question; finite existing motion, no provider call or interruption required |

## Platform fit and pattern checks

Web ordered lists, time elements, current-step semantics, labelled dialog/log, status announcements and focus controls preserve product web patterns. No Apple-only asset, control or wording copied. No new onboarding, alert, permission or consequential-choice flow. Respectful VI/EN wording and event/ETA semantics verified in source and rendered screenshots. RTL/new locale support not changed. Text zoom and actual screen-reader hardware: NOT_RUN. No claim of full WCAG certification.

| Gate dimension | Status | Evidence |
| --- | --- | --- |
| Human Interface principles | PASSED | All eight mapped; Flexibility completed with native Chrome media emulation and keyboard recovery |
| Target-platform fit | PASSED | Current native browser and component semantics |
| Meaning matches behavior | PASSED | Atomic safe events, actual CRM→customer transport, source ETA/unknown rules |
| Audience/business context | PASSED | Owner/private and guest capability boundaries preserved |
| Natural respectful tone | PASSED | VI/EN inventory plus in-context screenshots |
| Concise without meaning loss | PASSED | No new redundant next-step card; read time/stale qualifiers retained |
| Actions and state coverage | PASSED | Component35 + Account/code9; backend100; evidence layers disclosed |
| Data semantics/privacy | PASSED | REAL-HTTP and security tests |
| Accessibility | PASSED | Scoped checks: axe zero violations; guest zero incomplete; owner manual contrast minimum4.98:1. Native media emulation, keyboard refresh, Escape and close focus verified in MOTION-BROWSER.json. Not full WCAG certification |
| Localization/text expansion | PASSED | Ask VI/EN actual320/390/1280; Account VI; no new locale introduced |
| Terminology consistency | PASSED | Shared order/event mappings and existing product language |
| In-context verification | PASSED | Final screenshots and BROWSER-RESPONSIVE.json; synthetic fixture limitations recorded |

Decision: Product Language Gate PASSED for approved local scope. Findings fixed: refresh keyboard focus, Escape/close return focus, Account offline promise/stale disclosure, misleading no-live footer. Native reduced-motion emulation completed; physical OS preference test excluded. Text zoom/assistive-device checks remain unverified limitations, not full WCAG certification. No unresolved wording meaning defect found in executed checks.

Final delta evidence: Account now suppresses parcel ETA as well as aggregate ETA offline; current component test checks disappearance of the exact previous ETA timestamp, plus hidden-tab and visible reconnect. Native screenshot is delivered/no-ETA; active-ETA offline native delta NOT_RUN. Fixture metadata injection is test-only and no longer affects ordinary clean builds.

Continuation evidence: CONTRAST-READBACK.json, CONTRAST-REVIEW.json, GUEST-ACCESSIBILITY.json, NATIVE-CRM-ADVERSE.json and new screenshots. Timeline design and strings preserved; test controls remain fixture-only. Final reduced-motion and close-focus evidence completes the Product Language Gate.

Final accessibility delta: no changed strings or data meanings. After Escape or close, focus returns to the remounted collapsed Ask input. Native Chrome verifies reduced and normal motion;2 new component cases pass (35/35 total). QA harness renders Ask only after synthetic authentication is ready.

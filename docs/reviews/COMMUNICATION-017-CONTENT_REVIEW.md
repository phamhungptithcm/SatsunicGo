# Product Content Review — COMMUNICATION-017

Scope: current OrderConversation, staff Workbench and customer OrderCard, assignment, internal notes and notification labels/targets. Audience: Vietnamese customers and staff handling purchase requests. Target: responsive web, native details/forms/buttons; Apple principles are a quality reference, no Apple-platform compliance claim. Reviewer: current coding agent, 2026-10-04 America/Chicago. Sources: repository product-content skill/profile and current component, current emulator/browser evidence.

## Context and inventory

Verified: new messages are saved server-side against a fixed order and current authorization; notes and assignee roster never projected to customers; handover is transactional; existing notifications/email jobs process asynchronously. User confirmed no OA/Page exists. External delivery is unavailable. No wording assumes deposit/balance or the catalog payment model.

Full changed-string inventory: COMMUNICATION-017-STRINGS.json; includes component literal and JSX text, draft suggestions, backend errors, two notification labels and staff notification destination. No existing unrelated strings are claimed as changed by this task.

| Content group | State and job | Behavior evidence |
| --- | --- | --- |
| Trao đổi với khách / Trao đổi về đơn này | Open the correct order-bound conversation | Actual Workbench and customer browser |
| SatsunicGo / Zalo · Chưa kết nối / Messenger · Chưa kết nối | Identify actual available destination | Only SatsunicGo endpoint exists; no provider simulation |
| Tải lại trao đổi / Đang tải cuộc trao đổi… | Refresh and wait | Non-overlapping read, visible-tab polling every 15 seconds |
| Chưa có tin nhắn… / 50 tin nhắn gần nhất | Distinguish first use from a bounded history window | Browser empty state and emulator 51-message test |
| Tin nhắn cho khách / Tin nhắn cho SatsunicGo | Persistent message label | Explicit htmlFor/input id, browser label and keyboard evidence |
| Xác nhận yêu cầu / Hỏi thêm sản phẩm / Mời xem báo giá | Insert editable draft, never auto-send | Staff browser draft insertion; buttons disabled when draft exists to avoid overwrite |
| Gửi trên SatsunicGo / Đang lưu… / Đã lưu tin nhắn… | Send to the actual internal channel; confirm durable save | Browser two-way exchange and idempotent server tests |
| Nhận phụ trách / Người phụ trách / Chọn nhân viên / Lưu người phụ trách | Claim or hand over to eligible staff | Browser claim and manager handover; server eligibility/locked tests |
| Hiện không thể nhận việc / danh sách hiển thị một phần | Current availability and bounded roster | Current role/profile checks and explicit truncation boolean |
| Ghi chú nội bộ · khách không thấy / Ghi chú bàn giao / Lưu ghi chú nội bộ | Separate staff-only notes from public messages | Browser note saved; customer DOM note count 0; emulator private projection |
| Backend input/access/version/operation errors and UI retry messages | Explain failure without exposing another customer's resource | Unit validation, emulator unauthorized/lock/stale-key/concurrent tests; reviewed component catch branches |
| Chưa rõ kết quả / Thử lại thao tác chưa rõ kết quả | Retry the immutable pending operation | Pending payload/op retained, editing and new actions blocked; not claimed as delivered |
| Notification labels / Mở cuộc trao đổi của đơn | Direct recipients to authorized relevant order view | Notification target unit test, outbox recipient emulator tests |

## State coverage and data semantics

Default, collapsed/expanded, loading, empty, pending/disabled, saved, assignment unavailable, partial history/roster, authorization denial, stale version, recoverable read failure and uncertain send have explicit text and real recovery paths. Error branches are source/emulator evidence; browser network timeouts were not fault-injected. No destructive action exists. Draft survives recoverable failures inside the mounted component; full reload/navigation is not claimed to preserve a draft. Polling pauses while document is hidden; cleanup invalidates old read results and clears listeners/timers. A mounted mutation can finish even if the disclosure is closed.

Source of truth: server conversation revision and immutable message documents. Null assignee means no one is assigned, not an empty staff name. Zero messages is shown only after a successful read. Date values are epoch milliseconds, displayed with vi-VN locale in the viewer's browser timezone. No currency/financial amounts introduced. Saved means committed to SatsunicGo, not read by customer or delivered to email/Zalo/Messenger. Staff notes are not copied into public responses, notification bodies, audit, or email templates.

## Mandatory Human Interface principles

| Principle | Status | Current evidence |
| --- | --- | --- |
| Purpose | PASSED | Conversation starts inside actual order; no manual lookup of customer required |
| Agency | PASSED | Editable draft suggestions, explicit send, preserved input on failure, separate internal-note form |
| Responsibility | PASSED | External unavailable states and internal-only note scope explicit; no false delivery claim |
| Familiarity | PASSED | Native web disclosure, labeled fields, locale timestamps and standard buttons |
| Flexibility | PASSED | 1280x900 and 390x844 in-context checks; no horizontal document overflow; keyboard Tab skips disabled send and reaches next valid control |
| Simplicity | PASSED | One-click claim, conversation next to order, secondary notes progressively disclosed |
| Craft | PASSED | Explicit assignment label association corrected and rechecked via browser; empty/pending/saved/partial/error/recovery strings inventoried; message log uses polite announcements |
| Delight | PASSED | Natural concise Vietnamese and useful editable drafts; no noisy success animation or false reassurance |

Platform fit, meaning/behavior agreement, audience/context, tone/brevity, actions/states, data semantics/privacy, accessibility labels, Vietnamese localization, terminology consistency and in-context verification: PASSED for this local scope. Full screen-reader reading, non-Vietnamese localization, browser zoom/large-text and browser fault injection: NOT_RUN, retained limitations; no cross-platform/a11y certification claimed.

## Verification evidence

- Browser at http://127.0.0.1:5173 with explicitly labeled demo-satsunicgo simulated Google identities; no real OAuth or live messages.
- Customer A sent a message on e2e005-requested; support read it, claimed responsibility, inserted/edited a draft and sent a reply; note saved separately; manager handover confirmed.
- Customer A re-entered the actual order, read staff reply, internal note selector count was 0.
- Desktop documentWidth=1280/viewport=1280; mobile documentWidth=390/viewport=390. Explicit label selector worked after correction. Temporary viewport reset after testing.
- Screenshots: COMMUNICATION-017-customer.jpg, COMMUNICATION-017-staff-desktop.jpg, COMMUNICATION-017-staff-mobile.jpg. Fixture data only.
- Unit and emulator regression results recorded in validation report. Browser auth/access is emulator evidence, not live provider authentication.

Decision: Product Language Gate PASSED for the implemented local web scope. External channel integration remains unconfigured by the user's clarification.

# Product Content Review — S18 profile/address

Reviewed 2026-10-07 against current Profile and CustomerWorkspace source and actual rendered browser fixture on shared 5207. Scope: customer VI form reused inside Ask, VI/EN expand label. Prior profile fields, consent wording and API semantics preserved. Apple platform contract not applicable to web; human interface principles applied as quality reference. No raw personal data sent to LLM or written to browser persistence.

## Verified facts and limits
workspaceCommand validates ownership/lock and writes one address/audit per operation. Frontend retains immutable action/payload/operationId/expectedVersion after unknown response, blocks edited/new writes, validates result ID/version, ignores callbacks after owner switch/unmount, clears pending private state on owner change or lock. Form remains mounted while collapsed. Pending operation survives collapse but not full page reload/unmount; general durable reconciliation remains unfinished. Native forms stay in Vietnamese; full English form localization remains unfinished. Real auth/App Check and deployed acceptance NOT_RUN.

## Changed string and meaning inventory
| Location/state | Content / user job | Evidence |
|---|---|---|
| Ask expand control and region name | Hồ sơ và địa chỉ / Profile and addresses | Explicitly opens existing customer form; no write on expand |
| Lazy loading | Đang tải hồ sơ… / Loading profile… | Suspense wait, no success/persistence implication |
| Unknown result | Chưa xác minh được kết quả lưu. Đối chiếu thao tác đang chờ trước khi tiếp tục. | Offline/unavailable or malformed result retains request; disables fields |
| Recovery action | Đối chiếu thao tác đang chờ | Retries exact immutable command; no new operation ID |
| Definite rejection | Chưa lưu được thông tin. Tải lại và kiểm tra thông tin trước khi thử lại. | Typed backend denial/version conflict permits correcting/reloading |
| Existing success | Đã lưu hồ sơ / Đã lưu địa chỉ | Now only after strict result/version validation; saving is not an order/payment |
| Existing required form/consent | Required name/recipient/phone/address, optional business name and marketing checkbox | No inferred marketing/memory/analytics consent |
| Accessibility references | Unique Profile instance IDs, expand controls id, aria-expanded | Panel and page avoid colliding headings/step references |

## State coverage
Happy save; unavailable/lost response; malformed version; terminal conflict; account switch/late callback; mobile; inline collapse/reopen with unknown request; profile expected-version retry tested. Empty/initial loading/locked/read failure keep existing reducer behavior with regression units. Browser backend and auth are synthetic, so provider/network identity acceptance is not inferred. Recovered operation is a saved profile/address, not purchase/shipping/payment.

## Data semantics
Authoritative Firestore snapshots determine current profile/version. Saved address owned by caller is enforced backend-side; callers cannot inject ownerId. A denied snapshot clears old PII and disables forms. Failure is distinct from unknown save result. New live profile version does not mutate the pending request's expectedVersion. No fee, ETA, policy or entitlement values invented. Fields escape text in React; no untrusted HTML.

## Human Interface principles
| Principle | Status | Evidence |
|---|---|---|
| Purpose | PASSED within slice | Customer updates profile/address in Ask without navigating away |
| Agency | PASSED within slice | Explicit submit and separate recovery; no action executed by opening panel |
| Responsibility | PASSED within slice | Unknown result never claimed failed/successful; immutable recovery and account fences |
| Familiarity | PASSED within slice | Reuses existing Vietnamese field labels and save semantics |
| Flexibility | PASSED within slice | Desktop/mobile; same form works standalone or in Ask; no localization completeness claim |
| Simplicity | PASSED within slice | One expand control, existing two-step form, one recovery action |
| Craft | PASSED within slice | Rendered mobile screenshot inspected; no horizontal overflow; unique instance IDs |
| Delight | PASSED within slice | Collapse/reopen preserves a pending operation and avoids duplicate save |

Platform: native inputs/buttons, explicit labels, aria-expanded/controls, status/error feedback, min44px expand control, bounded scrollable form. Current screenshots: output/profile-recovery/mobile.png, unknown.png, inline-unknown.png. Complete screen-reader, reload recovery, deployed provider and full English form checks remain NOT_RUN/not implemented. No successful full-platform handoff inferred. Memory candidates: None.

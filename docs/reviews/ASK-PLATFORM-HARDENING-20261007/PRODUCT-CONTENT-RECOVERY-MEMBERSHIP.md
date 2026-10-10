# Product Content Review — S18 durable recovery and S19 Membership

Scope: Profile read/recovery/save states; CustomerWorkspace tabs; existing Membership component reused in Ask with validated data/result and pending controls. Vietnamese forms, VI/EN wrapper and sign-in error. Web; Apple platform contract not applicable. Bundled human-interface principles used as quality reference, not an Apple compliance claim. Source verified 2026-10-07, current actual rendered fixtures on shared 5207. Fixtures use synthetic auth/data/responses; actual backend handlers exercised separately against demo Firestore. No provider/authenticated production acceptance inferred.

## Facts, assumptions and unknowns
Verified: Profile resolves prior UUID/hash/action/version, validates caller-owned result, or closes uncommitted save transactionally. Persisted pointer excludes raw form values; metadata is private, not anonymous. Customer confirms reconciliation explicitly; no auto-save on reload. Membership paid purchase creates pending invoice; free activation returns active; renewal intent does not collect money or extend term; customer cannot confirm/grant. Snapshot/read/result shapes validated; unknown state or malformed money/date does not become zero/active. Unknown writes retain original command while tabs stay mounted. Owner changes clear private view immediately and ignore departed callbacks.
Unknown: production source corpus approval, authenticated App Check/callable acceptance, complete English form localization and durable Membership reload recovery. These remain acceptance gaps.

## Changed inventory
| Surface/state | Content / meaning | Behavior evidence |
|---|---|---|
| Reload with pending pointer | Có lần lưu đang chờ kết quả. Kiểm tra lần lưu trước khi tiếp tục. | Form disabled; no automatic workspace write |
| Recovery unavailable | Chưa kiểm tra được lần lưu trước… / Chưa chuẩn bị được lần lưu… / Thử kiểm tra lại | Corrupt/unavailable storage fails closed; retries pointer check |
| Explicit prior-save reconciliation | Đối chiếu thao tác đang chờ | Exact in-memory retry, or server resolve after reload; raw PII not replayed from storage |
| Verified saved outcome | Đã xác minh lần lưu trước thành công. Kiểm tra thông tin đã lưu trước khi cập nhật tiếp. | Strict schema/owner/version + status styling, not optimistic success |
| Verified not-saved outcome | Lần lưu trước chưa hoàn tất. Anh/chị có thể gửi lại thông tin. | Durable fence blocks late commit; neutral role=status, not error |
| Failed reconciliation | Chưa đối chiếu được kết quả. Giữ nguyên lần lưu đang chờ và thử lại. | Pointer preserved, fresh writes blocked |
| Account task wrapper | Tác vụ tài khoản / Account tasks; Hồ sơ và địa chỉ / Profile and addresses; Membership | Explicit expansion only; forms stay mounted when hidden; no command on tab click |
| Lazy loading | Đang tải hồ sơ… / Đang tải membership… | Suspense only, no persistence claim |
| Sign-in failure | Chưa đăng nhập được. Anh/chị thử lại nhé. / Sign-in did not finish. Please try again. | Login rejection caught; no membership write |
| Membership unknown retry | Chưa rõ kết quả. Thử lại cùng thao tác để tránh tạo trùng. / Thử lại thao tác đang chờ | Immutable original action/payload/op, even when renewal snapshot changed |
| Membership terminal rejection | Chưa thực hiện được. Kiểm tra gói hoặc yêu cầu rồi thử lại. | Typed rejection; safe generic error, no parser/backend implementation dump |
| Invalid published plan | Thông tin gói chưa hợp lệ. Anh/chị thử lại sau nhé. | Validated money/period/discount; no invented price or false no-plans state; error clears on repaired public snapshot |
| Private read failure | Existing Chưa tải được membership của bạn… | Clears/latches private snapshots; disables writes; late callback cannot repopulate |
| Existing commercial success | Pending paid invoice vs active free plan; ý định gia hạn vs entitlement | Strict correlated response and 5 actual backend cases; no automatic financial confirmation |

## State coverage
Profile 12 browser scenarios cover happy save, unavailable, malformed result, terminal conflict, account switch/late callback, mobile, inline collapse/reopen, profile version retry, reload saved/not-saved, corrupt pointer and storage denial. Backend 12 cases include race/fence/hash/ownership/admission/audit/direct-read denial. Membership browser scenarios cover free/paid pending, unknown/malformed response, renewal and changed-renewal snapshot retry, private failure, mobile, owner switch, sign-in failure, corrupt plan/private dates. Backend 5 cases cover money/entitlement and role/ownership/replay. Raw offline transport not tested against real provider; synthetic unavailable is not live offline proof.

## Data semantics and platform fit
VND and commercial bounds follow existing backend money/period/discount validation. Client never infers paid/granted state from chat. Source scan limits remain 10 plans / 30 invoices/history; no complete inventory claim. Public-data failure differs from successful empty published query. Private owner scopes checked before rendering and mutations. Explicit consent unchanged; no marketing/memory/analytics consent inferred. Native buttons, labels, fieldset disabled, aria-expanded/controls, unique instance IDs and live status/error feedback. Mobile snapshot inspected; bounded panel scroll, no horizontal overflow. Resolved Profile outcome now uses neutral status, not red error.

## Mandatory Human Interface principles
| Principle | Status | Evidence |
|---|---|---|
| Purpose | PASSED within slice | Complete customer account actions and resolve an uncertain result |
| Agency | PASSED within slice | Explicit save/reconcile/retry/select/cancel controls; no inferred approval or mutation on reload/tab change |
| Responsibility | PASSED within slice | Outcome/state/version validation; correct invoice/entitlement distinction; retained uncertainty and private owner fences |
| Familiarity | PASSED within slice | Reused natural Vietnamese forms; Membership retained as familiar product term |
| Flexibility | PASSED within slice | Standalone + Ask, mobile/desktop; collapse preserves operation; full English forms not claimed |
| Simplicity | PASSED within slice | Two account sections; one explicit pending retry/reconciliation control |
| Craft | PASSED within slice | Source and rendered states inspected; corrupt values blocked; recovery status styling repaired |
| Delight | PASSED within slice | Avoids duplicate address on reload and preserves original renewal intent through changed UI state |

Screenshots inspected: output/profile-recovery/reload-not-saved.png and output/membership-workspace/mobile.png. Other state PNGs produced by browser scenarios. Full screen-reader, Safari/Web Locks compatibility, real user Google/MFA/App Check and production flows NOT_RUN. Scope copy/semantics review passes executed states; overall platform/production gate remains BLOCKED. Memory candidates: None.

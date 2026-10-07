# Invoice021 specialist review — 2026-10-05 America/Chicago

Authorization: RELEASE-INTEGRATION-021 v1 tracked owner approval; bounded invoice module responsibility. Source frozen in SOURCE_MANIFEST.json. SharedDocument root hashchange/revalidation correction preserved byte-for-byte. No App/routes, browser tests, rules, email, AI/manifests/lockfile or backend changes. No live sending, deployment, ledger or financial writes. Shared services were not restarted or reset.

Intelligence gate: DEGRADED (CodeGraph healthy but stale; CocoIndex daemon permission failure/stale). Targeted approved plan, actual invoice domain, callables, CSS, unit/integration tests and browser source verified. Stack React19/TS6/Vite8/Firebase Node22 contract; host checks use current installed Node. Profiles: universal, typescript-javascript, concurrency, web-app, frontend-html-css, product-content, visual-design, API/database/security for read-only contract review. No relevant memory facts used.

## Review cycles and correction

Cycle1 BLOCKED: out-of-order detail responses could replace a later selection; command completion after route change could reopen an old document/share; a committed command followed by failed detail read was reported as a command error; staff order filter was ignored; draft amount labels falsely referred to issuance. No monetary authority defect was introduced or changed.

Cycle2 corrected: LatestDocumentRequest discards superseded success/failure and is invalidated on screen cleanup/context change/mutation. Command lifetime checks view revision; old responses retain durable operation recovery without publishing stale screen state. Synchronous executing guard prevents same-frame double submit. Post-commit detail errors explicitly say the action was saved; they cannot become an ambiguous mutation retry. Detail loading announced; previous selected document cleared while opening another. Route changes reset messages/selection/pending state and recover only current user's saved operation. Staff/customer both pass order filter; form input refreshes with filter. Draft copy states snapshot creation/update and disables printing; issued amounts retain issuance meaning. Pagination disabled during mutation.

Checks actually run: 3 focused unit files / 8 tests PASSED, including deferred out-of-order callbacks, leaving screen success/error suppression, current retry recovery, actual server-rendered draft/issued/void semantics and existing domain checks. Focused ESLint PASSED. Client/Functions typecheck exit0 after UI fixes; stopped further Functions builds at coordinating chat's request to avoid emulator hotreload. Invoice integration 1 test PASSED on guarded demo Firestore8181. First invocation refused missing demo environment before imports (0 tests); corrected invocation explicitly supplied GCLOUD_PROJECT=demo-satsunicgo FUNCTIONS_EMULATOR=true FIRESTORE_EMULATOR_HOST=127.0.0.1:8181 and passed. No service reset. Source freeze supersedes whole-project historic147/67/21 totals; those are not this review's test counts.

Actual browser at5187: anonymous CRM denied; emulator owner login; existing issued document SG-00000004 displayed, catalog full-payment wording and zero received/240000 due truthful; rapidly opened issued then draft and observed draft, no issued print action; draft snapshot text observed. CRM order filter narrowed 14 rows to two same-order draft/void records; create form prefilled correct order. Narrow390px documentWidth390 (no horizontal page overflow). Label→Tab focused create button. Screenshot filter-mobile.png. Initial long loading was observed; concurrent Functions build/HMR may contribute per coordinating chat, not independently proven. Do not claim network-order browser fault injection from rapid clicking; deferred unit tests verify ordering deterministically.

Current final review BLOCKED for full UI acceptance: native zoom/assistive technology, current browser forced response-order, navigation during committed mutation/detail failure and final print rerun remain for coordinating session after source freeze. Existing release content gate is BLOCKED and was not upgraded using source-only evidence. No further compilation, fixture mutation or browser test edits planned here. Coordination can consume the manifest and rerun its owned browser suite.

## Security, data and operations review

Existing current Google verification/role/lock checks, production AppCheck/MFA and customer ownership retained. No tax invoice or live-email guarantee. Share projection excludes customer identity/order IDs; hashed capability expiry/epoch revocation, quota and no-store remain. React renders strings as text. UI guards are presentation only; backend version/hash/idempotency remains authoritative. No changes to issued data, numbering, outbox, order totals, ledger or payment installment policy. Residuals: identity/provider configuration and operational retention readiness are external; browser full flow and print remain unverified for exact frozen candidate. No new dependencies. Rollback only specialist UI/helper/test patch; preserves root SharedDocument fix and all stored data.

## Changed product content inventory and states

| Location/state | Exact content | Meaning/evidence |
| --- | --- | --- |
| StatementView draft snapshot | Số tiền được ghi nhận khi lập hoặc cập nhật bản nháp. | Matches createDraft/refreshDraft; SSR and actual mobile draft |
| Draft due | Còn phải thanh toán trong bản nháp | snapshot remainingDue, not live balance; SSR/browser |
| Draft overpayment | Tiền trả thừa trong bản nháp | conditional frozen overpayment; SSR/source, native overpayment NOT_RUN |
| Issued snapshot/due/overpayment | Existing tại thời điểm xuất labels retained | Issued freeze contract; issued browser/SSR |
| Detail pending | Đang mở chứng từ… | pending detail replaces selected view; actual browser |
| Open failure/retry | Không thể mở chứng từ này. Thử mở lại. | latest read failure, clicking same item supported; deferred unit/source proxy, browser fault NOT_RUN |
| Post-commit detail failure | Thao tác đã lưu nhưng chưa tải được chứng từ. Tải lại rồi mở chứng từ. | command acknowledged, no repeated mutation; source proxy, browser fault NOT_RUN |
| Disabled | Existing action labels; pagination disabled during mutation, draft print disabled | SSR/source and observed draft |
| Empty/filter | Existing Chưa có chứng từ trong trang này. | existing empty state retained; filter current browser verified |
| Success/unknown/unauthorized/destructive | Existing persistent operation, freeze/share/revoke/void labels retained | No altered consequence; callables read-only reviewed; full in-context acceptance delegated |

## Product content review

Surface Documents/StatementView; staff finance/owner, customer own documents; Vietnamese responsive web; browser-native buttons, tables, keyboard and polite role=status. Apple-derived principles are a quality reference, not an Apple-platform contract. Domain source is frozen internal_statement with integer VND; draft and issued source timestamps distinguished; void history retained; catalog once/custom installments preserved. No live balance promise. Dates use vi-VN browser-local timezone, not specified seller timezone. No inferred legal identity or tax authorization.

| Principle | Status | Current evidence |
| --- | --- | --- |
| Purpose | PASSED | Read correct order-bound statement; filtered list and draft rendering observed |
| Agency | PASSED within scoped checks | Can choose another item/retry; stale reply cannot overwrite choice; deferred unit checks |
| Responsibility | PASSED | Draft/issued timing, no tax identity claim, committed versus read failure distinguished |
| Familiarity | PASSED | Native forms/buttons/table; actual AX names and Tab behavior |
| Flexibility | NOT_RUN complete coverage | 390px and keyboard observed; native zoom/AT coverage outstanding |
| Simplicity | PASSED | One loading state, direct open/retry; filters narrow relevant records |
| Craft | NOT_RUN complete coverage | Ordering unit tests pass; exact browser mutation/failure/print acceptance outstanding |
| Delight | PASSED within scoped checks | Preserves choice/recovery, calm copy, no celebratory/false send promises |

Platform fit PASSED for observed web states; meaning PASSED for source/SSR and observed draft/issued states; accessibility/localization BLOCKED for missing required full in-context checks; current error-state verification BLOCKED. Overall Product Language Gate BLOCKED. No successful full UI handoff claimed. Coordinator should complete actual cases then perform a fresh review against exact frozen module hashes.

Progress: scoped fixes/test implementation complete; broader acceptance remains pending. Production NOT_READY. Dirty shared Git retained; no commit/deploy. Token usage Unavailable; actual and estimated cost Unavailable. Memory candidates None.

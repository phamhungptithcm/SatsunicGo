# Product Content Review — Membership reload recovery

## Scope

Surface: actual Membership inside CustomerWorkspace, standalone web component reused by Ask; customer choosing or retrying a membership request. Files: Membership.tsx, command-recovery.ts and membership-workspace.spec.ts. Business outcome: preserve the customer's original request across unknown results/reload and prevent an accidental second request. Target: Chromium web, existing native buttons/alert text, SatsunicGo design system, existing lang=vi Membership surface. New copy is Vietnamese; full English Membership localization is deferred and the full-platform gate remains BLOCKED. Reviewer: root source/diff/behavior review, 2026-10-08. No external reviewer or live-customer study claimed.

Apple HIG current platform compliance is not applicable to this web surface. Bundled reference checked 2026-08-20 supplies all eight human-centered principles; product brand/native web conventions are authoritative, no Apple controls/assets copied.

## Context and evidence

Verified: backend makes pending paid invoices, free entitlements and renewal intent in transactions with exact operation-hash replay. No customer command confirms payment. Customer-only action/ID envelopes are persisted under owner-hashed keys before dispatch. No automatic dispatch on reload. Unknown, malformed and denied replays stay pending; corrupt/unavailable storage blocks new requests. A reply and correlated storage retirement are both required before success notification. Account-generation/auth fences prevent late responses notifying another customer.

Assumption: the existing Vietnamese Membership surface is the scope language, consistent with CustomerWorkspace lang=vi. Unknown: full EN surface, assistive-technology/Safari/live-auth/App Check/provider/production acceptance; deployed idempotency retention; expected-price binding for an originally uncommitted retry. These remain report blockers, not a guarantee hidden in copy.

## Content inventory

| Location/state | Previous | Current content | Job/behavior evidence |
|---|---|---|---|
| restore/pending | No reload recovery state | Chưa rõ kết quả thao tác trước. Thử lại thao tác đang chờ để kiểm tra. | Restore exact original command without claiming failure/success; reload paid/free/renewal/cancel and plan-change cases |
| restore/corrupt or inaccessible | No reload recovery state | Chưa khôi phục được thao tác trước. Liên hệ hỗ trợ trước khi gửi yêu cầu mới. | No dispatch or erasure; corrupt-storage/unavailable-storage screenshot and cases |
| reservation unavailable | No durable reservation | Chưa lưu được thao tác để khôi phục. Liên hệ hỗ trợ trước khi gửi yêu cầu mới. | Locks/storage unavailable => no network mutation; unavailable-locks rendered case |
| unknown/malformed/denied/clear failure | Chưa rõ kết quả. Thử lại cùng thao tác để tránh tạo trùng. | Chưa rõ kết quả. Thử lại cùng thao tác để tránh tạo trùng. Nếu vẫn chưa được, liên hệ hỗ trợ. | Do not confuse later rejection with no prior commitment; denied/wrong-owner/malformed/clear-storage-failure |
| conflict | Preserved | Thao tác trước chưa rõ kết quả. Thử lại thao tác đó trước khi gửi yêu cầu khác. | Atomic reservation refuses a different pending command |
| retry control | Preserved | Thử lại thao tác đang chờ | Native keyboard-operable button sends exact original action, resource ID, operation ID |
| success | Preserved | Existing purchase/free/cancel/renewal complete messages | Valid admitted reply only; paid remains pending; renewal never collects money |

All changed strings are complete messages; no concatenated fragments or raw exceptions. Internal operation ID/hash/owner key are not displayed. Existing amount/date formatting and terms remain unchanged.

## State coverage

| State | Result | Evidence/rationale |
|---|---|---|
| Default/focus/action | PASSED | Native controls; original purchase actions, exact retry with keyboard Enter |
| Hydration/pending/disabled | PASSED | Controls await recovery and all private reads; fresh requests blocked while saved command exists, sibling Profile blocked in mounted workspace |
| Empty/true zero | PASSED unchanged | Published-plan empty and true free=0 preserved; no missing read represented as zero |
| Success | PASSED | Paid/free/renewal/cancel cases, checked result then retirement, no notification on malformed/denied/clear failure |
| Error/recovery | PASSED | Saved envelope retained after reload, corruption/access errors shown in rendered component |
| Offline/stale/partial | PASSED bounded | Synthetic lost response, changed/removed plan, persistent original intent; no auto-dispatch, new choice or price assertion |
| Unauthorized | PASSED bounded | Sign-in failure and account-switch/account-return; late old response produces no new-account notice |
| Confirmation/destructive | PASSED unchanged | Retry repeats previously chosen operation; cancel affects pending invoice only, backend rejects paid/foreign cancellation |

## Data semantics and privacy

Source of truth: authenticated membershipCommand and private Firestore read snapshots, not browser metadata/LLM/history. Unit VND and period days retained; unknown outcome is explicit, not no invoice or paid. Metadata contains schema/action/UUID/public resource IDs only; no address, profile, bank evidence, amount or raw owner identity in value. Owner hash is an isolation key, not authentication. No customer payment or automatic renewal collection. A missing original server commitment means retry uses backend current plan terms; no old-price guarantee is introduced. Browser storage deletion/private-mode restrictions cannot create server proof; unsupported storage locks block dispatch.

## Mandatory Human Interface principles

| Principle | Result | Current evidence |
|---|---|---|
| Purpose | PASSED scoped | Recovery protects one original membership task instead of losing it on reload |
| Agency | PASSED scoped | Reload does not submit; explicit native retry; no claim of undo/cancel where unavailable |
| Responsibility | PASSED scoped | Unknown outcome remains unknown; pending invoice is not entitlement/payment; metadata excludes PII |
| Familiarity | PASSED scoped | Existing native buttons, inline alert and membership terminology retained |
| Flexibility | PASSED scoped | Existing VI surface, desktop/mobile and 200% CSS-zoom proxy, keyboard Enter and explicit no-Web-Locks branch; no complete EN/AT certification |
| Simplicity | PASSED scoped | State and next step lead each message; one retry control, no new dialog/layout/details |
| Craft | PASSED scoped | Corrupt, storage, replay, wrong-owner, account, concurrent-tab and retirement failure paths exercised; current screenshots |
| Delight | PASSED scoped | Calm recovery saves re-entry without jokes, celebration or hidden payment claim |

## Platform and pattern checks

Native web buttons, role=alert for dynamic failure, existing scrollable 55dvh workspace and wrapped Vietnamese text. No CSS/layout/animation or dependencies changed. Recovery control accessible name equals visible text. Desktop and mobile pending screenshots reviewed; vertical scrolling is intentional and screenshots capture current viewport of the inner scroll region. No horizontal overflow in executed mobile check; 200% CSS zoom is a proxy, not native browser zoom or screen-reader certification.

| Pattern | Result | Evidence |
|---|---|---|
| Writing/labels/controls | PASSED scoped | Exact strings above and actual rendered states |
| Feedback/interruption | PASSED scoped | Inline alert; no extra modal, focus theft or optimistic success |
| Consequential choice | PASSED scoped | Explicit exact replay; backend invoice/renewal semantics preserved |
| Onboarding/help | NOT_APPLICABLE | No new onboarding/help route |
| Privacy/accounts | PASSED scoped | Strict metadata, hashed owner namespace, account read/reply fences |
| Inclusion/accessibility/localization | PASSED VI scoped | Native controls/mobile/scaled proxy; full locale/AT/Safari remains NOT_RUN |

## Gate results

| Dimension | Result | Evidence |
|---|---|---|
| Eight principles | PASSED scoped | Table above |
| Target platform | PASSED scoped | Native Chromium web surface, no Apple-platform compliance claim |
| Meaning/behavior | PASSED scoped | Original command retry, unknown preservation, admitted success |
| Audience/business context | PASSED scoped | Customer task, no conversion pressure or auto-collection |
| Natural respectful tone | PASSED scoped | Plain state/action/support wording, no blame/raw code; reviewed whole rendered flow |
| Brevity | PASSED scoped | Complete recovery meaning with one control; no redundant architecture terms |
| Actions/states | PASSED scoped | Coverage table and named cases |
| Data semantics/privacy | PASSED scoped | No payment authority from metadata; current backend contract |
| Accessibility | PASSED bounded | Alert semantics/native controls/keyboard Enter; actual AT NOT_RUN |
| Localization/expansion | PASSED VI bounded | Existing VI/lang contract, narrow and CSS-zoom proxy; full EN NOT_RUN |
| Terminology consistency | PASSED scoped | Existing gói/yêu cầu/membership/ý định gia hạn maintained |
| In-context verification | PASSED scoped | actual Membership through CustomerWorkspace, declared synthetic auth/API/read fixtures |

Evidence: tests/browser/membership-workspace.spec.ts (29 scenarios), output/membership-workspace/{reload-paid-pending,mobile-recovery-pending,scaled-recovery-pending,corrupt-storage,unavailable-storage,unavailable-locks}.png, source-bound all-local report linked in REPORT.md/SOURCE_MANIFEST.json. No production claims from fixtures. Final snapshot counts/status must be read from newest summary.

Decision: changed Vietnamese recovery slice PASSED within the bounded checks; full Ask Product Language Gate BLOCKED for missing complete locale/service/live acceptance. Fixed: absent reload recovery, unsafe retirement after a later permission rejection, scenario that did not actually alter the live plan. Residual: complete EN/AT/Safari, live retention/price-bound resolver, browser storage deletion and all-tab cross-workspace coordination remain unverified/deferred.

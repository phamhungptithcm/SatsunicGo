# NEW031 current evidence reconciliation draft

Exact spec07eb230852546d8f1bc92206f78f38744b57d59e3d8452bb3b9e077c70852bae: full current10 PASS, zero FAIL/SKIP/FLAKY/global errors, duration134925.802ms. Archive output/playwright/release027/finance-activity-current-round3. Independently parsed each test one passed result/retry0/errors0.

Current Activity source2735d6cf321fd94e7f38d34fb9329676b5e5b3dfdab338065919794a91e9efeb: three390/768/1440 notification cases select actual job IDs, reconcile one equal-looking owned job and preserve sibling unknown/version1/no resolution/audit; intended job sent/version2/reconciliationfalse/audit1. Original order and financial ledger unchanged. Full IDs/no horizontal overflow and local screenshots exist in current artifact root; visual approval remains separate. Actual Mã thông báo denotes notification job, not order or provider evidence.

Finance allocation3/reversal3/CAS1: real local verified-input transaction, receipts retained, actual ledger/bank/order/audit conservation; lost responses require successful real result and completed deliberate abort before exact immutable replay. No webhook signature/provider/payment proof inferred. Current scoped lint/compiler/source diagnostic review pass.

History:974c9 originalNOT_RUN; d40 lifecycle sourcefix and reviewPASS, actual8PASS2FAIL reversal390/1440 saved-status missing with remount signal; 07eb diagnostic sourcePASS, focused2PASS47157.184ms, full10PASS134925.802ms. No financial application/source fix. Earlier remount/navigation cause NOT_VERIFIED; passing runs also have extra pre-submit finance frame navigation. Preserve old failures, do not claim all reload scenarios fixed.

Cleanup: captured-generation full setup and route/response chains drain; navigation failure retained while exact registered resource delete and absence attempted; SDK cleanup steps independent aggregate errors. Actual zero hook errors and current absence assertions support only known owned resources. Opaque partial sourceOrder product paths, late external effects and unknown old orphans NOT_VERIFIED.

ProductGate BLOCKED: principles Purpose/Agency/Responsibility/Familiarity/Simplicity bounded local native evidence; Flexibility/Craft/Delight PARTIAL pending full keyboard/AT/zoom/visual review. Whole CRM/production NOT_READY. Native runner/integration/global ledger root-owned. Memory candidates None; tokens/cost unavailable. Documentation reconciled under integration-owner quiet-window lease; source/spec remain frozen.

## Historical record — superseded source/native status

Earlier source-current and NOT_RUN statements below refer to the prior candidate only.

# Activity notification identity — implementation plan and content review

Status: **BLOCKED for product acceptance; approved bounded implementation only.**

## Scope

- Surface: CRM Activity, notification result cell; Vietnamese browser UI.
- Audience/task: operations staff identifying the exact notification before reconciliation or retry.
- Files: `src/features/crm/Activity.tsx` and the three notification cases in `tests/browser/release-finance-activity-positive031.spec.ts`.
- Root integration lead reviewed the concrete delta and released these files after Studio's 63-case round ended. Persistent human approval: `docs/approvals/SATSUNICGO-CRM-UX-028.md`; current integration plan: `docs/reviews/release027/IMPLEMENTATION_PLAN.md`.
- Applicable platform: ordinary web table/text selection. Apple-specific HIG compliance is not applicable and is not claimed; repository human-interface principles are used as a quality reference.
- Review date: 2026-10-06. Source intelligence: bounded **DEGRADED** inspection under the integration brief; no index refresh or shared service changes.

## Verified facts and impact

`Activity.tsx` renders three columns. Audit rows show `resourceId`; notification rows show time, action and states without their identity. Independently reviewed: two notifications with the same action/time/state are difficult to distinguish.

The authorized `listWork` notification projection supplies `id`, action/state, email state, creation time, attempts and version. It does **not** supply an order, recipient or provider reference. The proposed identity is the actual notification job ID, never an order ID or evidence of delivery.

Existing `CrmReference` renders a label and full code. `Workspace.css` supports wrapping, maximum width and native text selection. No shared CSS, backend, endpoint, roles, money, provider, link or command behavior changes are permitted by this delta.

### Concrete implementation sequence

1. Add `CrmReference` to Activity's existing presentation import.
2. Render `Mã thông báo` with `r.id` below notification state/email text, in the existing result cell; keep three columns and existing action disclosure.
3. Strengthen the three NEW031 notification cases: create two owned long-ID notifications with equal action/time/state, select the first by actual ID, reconcile it and verify the sibling remains unchanged.
4. Run scoped lint and hand exact source/test hashes to the integration lead and independent reviewer. Browser runners and global checks remain exclusively coordinated by the lead.
5. Record fresh three-viewport/native and accessibility evidence before changing this report's acceptance status.

Risk: low presentation change, with meaningful operational identity and authorization semantics. A global privacy or action-state change is outside this lease and requires its own reviewed plan.

## Content inventory

| Location/state | Existing content | Proposed content | User job | Evidence |
| --- | --- | --- | --- | --- |
| Loaded notification result cell, every state | Action/time/state without job identity | `Mã thông báo` + full `r.id` | Identify and communicate the exact notification | Actual authorized projection and existing `CrmReference` |

Only one new static user-facing string is introduced. IDs remain complete source values; no shortened code, inferred association or delivery claim is introduced.

## State coverage

| State | Applicable content/behavior | Evidence/status |
| --- | --- | --- |
| Default | Reference in loaded notification rows, not audit rows | Source plan; native NOT_RUN |
| Loading/pending/disabled | Existing loading feedback and disabled controls remain; any previously loaded ID retains its identity, not a new freshness claim | Activity `load`/pending guards inspected; native NOT_RUN |
| Empty/no result | No fabricated ID or zero; no reference without a row | Source plan; native NOT_RUN |
| Success | The reference identifies the same job after actual reconciliation; existing success wording stays unchanged | NEW031 planned assertions; native NOT_RUN |
| Error/recovery | Read failure clears rows; command uncertainty retains the actual frozen operation | Current source inspected; native NOT_RUN |
| Offline/stale/partial | No new freshness, count or delivery assertion; existing loading/error/paging semantics remain | Source scope; native NOT_RUN |
| Unauthorized/forbidden | Existing authorized projection and staff gate apply; read failure clears rows. Whole-product mutation-denial privacy behavior is not certified by this visual delta | Authorization/read source inspected; current negative/native evidence NOT_RUN |
| Confirmation/destructive | No new action or confirmation; identity helps distinguish an existing consequential action | NOT_APPLICABLE to new controls |

## Data semantics

- Field: actual notification job `id`; source of truth is the authorized server projection.
- Null/unavailable: no replacement identifier is constructed; no row means no reference.
- No amount, unit, date, period, aggregation or timezone changes.
- ID is not the order, recipient, provider receipt, delivery proof or complete per-order history.
- No new lookup, storage, clipboard command, external link or PII exposure is added.
- This report cannot certify current authorization recovery or the whole CRM from source alone.

## Mandatory human-interface principles

| Principle | Status | Planned concrete evidence and current limitation |
| --- | --- | --- |
| Purpose | NOT_RUN | Same-time/action sibling fixture must demonstrate exact-job selection in the rendered UI |
| Agency | NOT_RUN | Full selectable text supports browser copy; selection/keyboard/screen-reader checks pending |
| Responsibility | NOT_RUN | Source mapping uses actual job identity, with no provider/order association; current in-context privacy evidence pending |
| Familiarity | NOT_RUN | Existing CRM reference pattern and natural Vietnamese label; current rendered/read-aloud review pending |
| Flexibility | NOT_RUN | Existing wrap/selection styles; 390/768/1440 and text-scale evidence pending |
| Simplicity | NOT_RUN | Keep three columns, no control or extra explanation; rendered hierarchy must be checked |
| Craft | NOT_RUN | Complete long ID with wrapping, no ellipsis; overflow and assistive-technology checks pending |
| Delight | NOT_RUN | Reduced ambiguity must be observed through the two-identical-jobs task, not inferred from appearance |

## Platform and pattern checks

| Pattern | Result | Evidence/rationale |
| --- | --- | --- |
| Writing, labels, controls | NOT_RUN | One concise label; no new control; in-context review pending |
| Feedback/interruption | NOT_APPLICABLE | No new toast, live region, alert or animation |
| Consequential choices | NOT_RUN | Existing reconciliation actions unchanged; disambiguation task pending |
| Onboarding/help | NOT_APPLICABLE | No onboarding or additional help |
| Privacy/accounts | NOT_RUN | Existing authorized projection; no source-only whole-product privacy certificate |
| Inclusion/accessibility/localization | NOT_RUN | Browser text selection, long-ID wrapping, screen-reader and zoom verification pending |

## Gate results

| Dimension | Status | Evidence |
| --- | --- | --- |
| Human-interface principles | NOT_RUN | All eight need current in-context evidence |
| Target-platform fit | NOT_RUN | Web-native pattern identified; rendered behavior pending |
| Meaning matches behavior | PASSED | Exact source job ID, no inferred association or delivery claim |
| Audience/business context | PASSED | Operations staff distinguishing notification actions |
| Natural respectful tone | NOT_RUN | Static label reviewed; in-context/read-aloud review pending |
| Concise without meaning loss | NOT_RUN | Full ID plus one label planned; rendered density pending |
| Actions/state coverage | NOT_RUN | Source inventory complete; current runtime states pending |
| Data semantics/privacy | NOT_RUN | Mapping verified; current authorization behavior remains unverified |
| Accessibility | NOT_RUN | No new controls; AT/text selection/zoom pending |
| Localization/text expansion | NOT_RUN | Vietnamese scope and long IDs identified; current rendered evidence pending |
| Terminology consistency | PASSED | `Mã thông báo` identifies the job, not order or delivery status |
| In-context verification | NOT_RUN | No current native screenshot or interaction for this delta yet |

## Verification and decision

- Implemented source SHA256: `2735d6cf321fd94e7f38d34fb9329676b5e5b3dfdab338065919794a91e9efeb`.
- NEW031 spec SHA256: `974c9f8d2bc634233f1632b0c7eecb317aa311fa8b062b4496e431f955b9578c`.
- Scoped ESLint for Activity and NEW031: **PASSED**, exit 0.
- Frontend TypeScript `tsc --noEmit --pretty false`: **PASSED**, exit 0. No backend emission, build, unit or browser runner was started by this owner.
- Three notification cases remain part of NEW031's ten cases, with standard 45-second test/12-second expectation limits.
- The synthetic fixtures are local test inputs, never PayOS, bank, webhook signature or provider evidence.
- Existing baseline initialization is read-only; task-owned setup chains use immutable generations and are awaited before cleanup.
- Planned assertions: first job `sent`, version 2, reconciliation false and one audit; identical sibling `unknown`, version 1, no resolution/audit; original order and financial ledger unchanged; full IDs and no horizontal overflow.
- Current browser, zoom, keyboard and assistive-technology evidence: **NOT_RUN**.
- Product Language Gate: **BLOCKED**. This plan is not a successful product or release handoff.
- Memory candidates: None. Token usage and cost: unavailable; no estimate is invented.

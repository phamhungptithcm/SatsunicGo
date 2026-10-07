# CRM design hardening — all pages

Owner steering2026-10-05/06: focus UI/UX design. This is the concrete page-by-page design backlog, not acceptance evidence. Current Workspace navigation includes21 pages, plus customer detail and nested forms. No backend/money/provider changes. Existing approval fix-all028 applies to scoped corrections; file leases/shared serial runner still respected. Source leases are frozen for integration-root compiler and full native run. Shared Workspace/global CSS/App and Studio/rates remain assigned to their existing owners. Root granted this registry a docs-only update.

Design contract: light neutral canvas, white compact surfaces, royal-blue primary action, navy readable text; one primary task per selected record; browse first and edit on explicit selection. Full identities and financial/consent meaning preserved. Short contextual strings, no repeated label/help clusters. Native controls, logical heading levels, visible focus, minimum accessible targets, motion independent from data readiness and immediate under reduced-motion. Real current in-context evidence required at390/768/1440,200% zoom, keyboard and AT before acceptance.

|Page|Primary design decision|Actions/states to validate|
|---|---|---|
|Overview|Group active work first; snapshot time and filter beside refresh|Load/filter/empty/errors/stale snapshot; no invented totals|
|Orders|Mobile list OR selected detail, clear Back; desktop explicit selection placeholder|Select/back/scroll restore/quote/action prerequisites/pending/retry|
|Purchasing|Separate waiting-payment state from ready-to-buy action|Claim/record purchase; full-price vs deposit labels|
|Warehouse|Selected order with receiving/packing sections|Receive/pack/dispatch; actual quantity/checklist/hold context|
|Returns|Compact status + received/inspected counters; on-demand line table; one active form|Receive/inspect/close relevant fields; unknown exact retry; closed read-only|
|Shipping|Browse parcels; selected pack/dispatch/tracking form only|Create pack/dispatch/track, loading/retry/version conflict|
|Consolidation (nested)|Select complete parcels first, then show eligible order weights and freight review|Seal/dispatch, cutoff/timezone/weight allocations explicit|
|Changes|Compact proposal summary then explicit decision panel|Customer accepted status/apply/version/financial impact visible|
|Refunds|Compact money/state/linked order; selected confirm OR cancel form|Bank field confirm-only; clear actual-money action; frozen unknown retry|
|Finance|Visible tabs/scopes for independent groups, no synthetic aggregate|Load/page/allocate/close/reverse; evidence and confirmation context|
|Customers|Search label matches name-prefix or exact ID; names preferred over IDs only if verified|Search/reset/pagination/selection/permission error|
|Follow-ups|Date + assignee scan hierarchy; due/mine compact filters|Overdue/7-day/mine/timezone/empty and related navigation|
|Customer detail|Summary and care form separate from related work; compact optional detail|Save tags/notes/assignee/appointment; pending/unsaved/stale conflict|
|Support|Compact conversation rows, expanded selected thread only|Reply/resolve/reopen; pending draft, permission loss; no invented unread/SLA|
|Documents|Browse issued/draft/cancelled; editor entered from selected order|Create/edit/issue/cancel; immutable issued identity and confirmation|
|Content|Browse/create/edit explicit, avoid unrelated blank editor opening|Select/save/publish/archive/media; unsaved draft protection|
|Campaigns|List before selected create/edit panel; concise UTM terminology|Create/edit/copy/publication schedule; feedback visible beside action|
|Membership|Compact plan chooser with separate editor and gift mode|Edit/activate/grant; identity/price/period/version and no automatic charge|
|Staff|Page heading + inspect identity before permission editor|Inspect/change roles/active/lock; explicit target and retained failure state|
|Activity|Readable action names and object refs; audit/outbox scope visible|Filter/pagination/read-only, independent failure semantics|
|Blog Studio|Reuse established Studio structure; avoid competing CRM toolbar|Browse/draft/revision/publish/schedule/moderate; source owner integration|
|Shipping rates|Route/weight/unit/currency hierarchy; edit separate from public rate browsing|Create/edit/remove/preview; quote-only gaps and validity visible|
|Settings|h1 above policy editor; actual currency conversion preview beside fractions|Load/edit/save/effective period, approval and snapshot semantics|

Every page must cover applicable default/loading/empty/selected/editing/disabled/success/error/retry/permission/stale/confirmation states. Sidebar/dialog controls also cover Escape/focus restoration and reduced-motion; source-only assertions do not count as rendered acceptance.

Implementation order: exclusive Returns compact UI first; request Refunds and Shipping/Consolidation leases next; Customers/detail; Settings/Staff; Campaigns/Membership; remaining owner pages integrated through lead. No page marked DONE yet from this inventory. Prior26 test counts do not certify new028 candidate.

## Current source freeze checkpoint — 2026-10-06

Ten scoped source batches implemented and frozen: Returns; Refunds; Shipping+Consolidation; Customers+Follow-ups+Customer; Settings+Staff; Campaigns+PlanEditor; Finance+FinancialReview; Support; Activity; Changes. Each has scoped manifest/content review/final review/task report. Latest reviews remain BLOCKED while current candidate native/AT/independent acceptance is incomplete. Runtime ledgers were recorded only where authorized; later source-only windows prohibit runtime writes, so earlier runtime signatures do not certify later source deltas.

Recent source deltas: conditional Change proposal controls and immutable propose/customer decisions/apply; staff-only Support lazy mount and immutable reply; Activity audit/outbox scopes and exact retry; Finance endpoint-specific precommit version rejection; Customer maximum valid tag representation628; explicit Customer/workspace CAS rejection recovery and staff closed-card pending badge. Root owns common source manifest/build/functions compiler/native runners. Registry never substitutes for candidate-bound results. Source intelligence remains DEGRADED; bounded critical source verification used.

## Observed native coverage and remaining acceptance

This records scoped evidence from root integration messages, with direct readback of Support5PASS and Finance4PASS JSON. Counts describe those cases only. A passing three-width case does not certify all actions, keyboard/AT or production. Root is preparing the full236cases/37files run on a new candidate; preparation is NOT_RUN, not a pass.

| Page / scope | Observed evidence | Still missing for current scoped acceptance |
|---|---|---|
| Overview | Current UI native NOT_RUN | Real snapshot/load/filter/empty/error, widths, focus/AT |
| Orders / Workbench | Prior3width projection cases MOCKED only | Current real quote/prerequisites/actions/recovery/select-back/focus/AT |
| Purchasing | Current UI native NOT_RUN | Claim/record actual workflow and payment-kind states, retry/version/permission |
| Warehouse | Current UI native NOT_RUN | Actual receiving/packing/dispatch quantities, holds and failures |
| Returns | Real3width receive/inspect/close context +1lost-response exact retry reported PASS | Remaining permission/stale/navigation, zoom/focus/AT and new candidate binding |
| Shipping | Current UI native NOT_RUN | Create/pack/dispatch/track/faults/current widths/AT |
| Consolidation | Current UI native NOT_RUN | Actual seal/batch dispatch, weight/cutoff allocations/faults/AT |
| Changes | Current approved source new; native NOT_RUN | Propose/accept/reject/apply, conditional controls, all recovery branches, public VI/EN, widths/AT |
| Refunds | Current UI native NOT_RUN | Confirm/cancel/create, actual money semantics, exact retry/version/permission/AT |
| Finance | Prior4real cases PASS:3width close +1committed-lost-response exact retry; direct finance-round3 JSON4expected/0unexpected | These predate endpoint classifier delta; current CAS3consumer cases, allocation/reversal/invoice/transfer, focus/AT/native binding |
| Customers / Follow-ups | Current UI native NOT_RUN | Search/full-ID/name-prefix, pagination, roster identities/due/mine/timezone/failed reads |
| Customer detail | Current UI native NOT_RUN | Care save/tag628 boundary/CAS/read failure/related paging, focus/AT |
| Support | Prior5real cases PASS:3width lazy0reads-before-open/draft-retention +1lost-response replay against advancedversion +1public customer reply; direct support-round1 JSON5expected/0unexpected | Predates closed-card badge; current badge/CAS/permission/read-failure/focus/AT/native binding |
| Documents | Current UI native NOT_RUN | Draft/edit/issue/void/share/email, actual immutable authority and recovery |
| Content | Current UI native NOT_RUN | Browse/create/edit/publish/archive/media/draft protection/faults |
| Campaigns | Current UI native NOT_RUN | List/editor focus, copy/schedule/save/CAS/permission/retry, widths/AT |
| Membership / PlanEditor | Current UI native NOT_RUN | Plan save vs gift authority/CAS/unknown outcomes, pricing/activation/focus/AT |
| StaffAccess | Current UI native NOT_RUN | Inspect target/re-inspect rejected version, roles/active/locked/MFA/error/focus/AT |
| Activity | Current UI native NOT_RUN | Audit/outbox switch/page/read errors, reconcile/requeue, exact replay/CAS/provider authority/focus/AT |
| Blog Studio | Root reports real3width draft/publish/public draft isolation,2save/review lost-response cases,1actual CAS,1Storage,1large moderation queue PASS | Current full candidate binding; advanced schedule/member/recovery gaps per Studio owner, focus/AT |
| Shipping rates | Root reports editor CRUD1 +public failure1 PASS | Remaining route/weight validity and quote-gap projections, current candidate binding/focus/AT |
| Settings | Current UI native NOT_RUN | Actual rate/terms/approval interval save/CAS/retry/error/focus/AT |

Shared routes/sidebar/dialog acceptance remains NOT_RUN unless exact current integration evidence exists: desktop/mobile overflow, scroll restoration, keyboard/Escape/focus restoration, reduced motion,200%zoom and assistive technology. No native test can stand in for current AT observation when it does not exercise AT. Pending mutation metadata is local memory and may be lost on route unmount/full browser reload; no global durable-navigation guarantee is claimed. Real provider, banking and deployment evidence remains separate and NOT_READY.

Next loop: integration root freezes exact new candidate → compiler/full native run → per-case failures assigned to exclusive file owners → approved fixes → refreeze/retest → fresh independent review. No page is marked DONE from this registry or aggregate test totals.

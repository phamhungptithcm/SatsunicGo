# CRM → Account/Ask tracking implementation

Status: BLOCKED / NOT_FULFILLED for complete46-scenario acceptance. No deploy, push, commit, PR or production mutation. Actual scoped implementation is present in the shared worktree; unrelated WIP preserved. Weighted acceptance is derived from46 equally weighted runtime criteria:37 verified,8 in progress,1blocked. Read exact current runtime rendering in `.ai-agent-kit/runtime/report-outputs/ORDER-TRACKING-CRM-E2E-20261010.txt`.

## Result and root cause

Shipping ETA/partial scans previously changed parcels/projections without bumping order.version; open Account could keep stale data. Dispatch/scan transactions also omitted safe order milestone events, and batch projections lacked updatedAt. Ask answers were snapshots with no bounded active refresh.

Implemented: each successful affected shipping mutation atomically writes exactly one order revision and safe deterministic event, using the same recorded timestamp as its projection. Batch dispatch has matching event/timestamp behavior. Account refreshes on the existing order version and bounded reevaluation; active owner Ask watches only the owned order, while guest Ask polls the strict public callable at most once/minute when visible and online. Older turns remain snapshots. Scope/auth/generation/deadline fencing prevents stale publication across logout, A→B→A, cancellation and modal lifecycle. Terminal denial clears active data/capability; transient failures show stale/read-time qualification. Shared approved timeline and compact Ask presentation retained.

Stage transitions remain typed business rules; labels/order are source-controlled display mappings, not new editable master-data configuration. CRM → Vận hành → Kiện & vận chuyển remains the authoritative staff flow. Staff manually records ETA and parcel activity through validated transactions; there is no carrier GPS or automatic carrier integration.

## Bugs found and fixed

1. Missing atomic shipping revision/history and batch updatedAt: repaired and verified with real Firestore transaction/replay/rollback tests.
2. Refresh watcher denial could be overwritten as transient stale by its aborted pending read: terminal catch fencing added; regression verified.
3. Fully delivered parcel orders could not confirm receipt because legacy command required an order-level tracking string that parcel dispatch does not set. H10 reproduction drove a bounded server-side canonical allocation/parcel check, then internal optional domain proof. Current owner, payment/hold/packing, stage and exact quantity guards remain; no fabricated tracking number. Partial/missing/malformed/over-limit registry rejects. Backend receipt regression passes.
4. Refresh disabled button lost keyboard focus during pending response: aria-disabled with activation guard preserves focus; actual native and component regression pass.
5. Account offline snapshot could retain an ETA promise: now suppresses both aggregate and parcel estimates while offline, shows stale/read-time notice and waits for fresh read. Expanded component test checks old ETA timestamps disappear, hidden tick does not refetch, visible reconnect does.
6. Test-fixture defects corrected: acceptedAt/catalog snapshot prerequisites; custom allocation `it.each` accidentally spread arrays and tested malformed shape instead of intended quantities; corrected object fixtures rerun100/100. Catalog rules suite now honors explicitly configured18207 rather than hardcoded8181. Long QA JSON caused fixture-only page overflow; hidden QA output fixes this. Fixture SDK no longer imports ignored machine-local JSON, so a normal source build works without fixture metadata.

H10 necessarily touches `functions/src/index.ts` and `packages/domain/index.ts` beyond the initial filename table. It directly fixes approved H10 receipt business flow under the user's explicit 'fix hết bug phát hiện' authorization. It adds no public request field, financial policy, permission, collection rename or configurable behavior. This file-level impact is disclosed; shared pricing/config changes remain separately unapproved.

## Executed evidence

- Unit:130passed/11files; shipping regression20passed/3files (includes some overlap). Actual source/domain/refresh tests, not native transport.
- Components: Ask33, Account/public-code9passed. Real UI components with mocked SDK/auth and controlled adverse timings; actual15s deadline included.
- Backend/rules:100passed/5files, actual shared Firestore emulator18207 and disposable random demo projects; final corrected fixture run178.13s. Includes live role/owner checks, finance/quantity guards, atomic events, batch parity, partial/full delivery, concurrent finance/staff, stale versions, changed replay, rollback, code lifecycle and shared-IP quotas.
- Native real-transport journey: synthetic funded IN_TRANSIT prerequisite; actual staff Shipping UI sets ETA then delivers parcel. Already-open Account and owner Ask refresh without reload; anonymous Ask refreshes within60s. REAL-HTTP.json verifies order/parcel version3,2safeevents, matching delivery/projection timestamp, guest four-key DTO, cross-owner/anonymous private-call denials and unchanged money. No full checkout/native-shell claim.
- UI: actual iframe viewport/media320/390/1280, owner/guest VI/EN, no horizontal page overflow; timestamp layout and keyboard refresh verified. See BROWSER-RESPONSIVE.json and screenshots/final-*.png. Last offline parcel-ETA suppression and fixture metadata injection changes were verified by component/build checks; delivered/no-ETA screenshot appearance is unaffected, but native active-ETA offline delta was not rerun.
- Settled axe: no reported violations, color-contrast remains incomplete. Native OS reduced motion, text zoom, screen-reader hardware and production provider acceptance NOT_RUN.
- Current root build includes tsc, Vite and source-driven public asset generation; passed even with owned ignored fixture JSON absent. Functions build passed. Scoped ESLint0errors; HTML test fixture ignored-file warning disclosed. Existing large chunks and ineffective dynamic/static Changes import warnings retained, no unrelated optimization.
- DOMAIN-PERFORMANCE:200domain iterations,60parcels/50events, p50≈5.16ms,p95≈39.06ms,max≈135.99ms under local load. Not HTTP latency or production SLA. Write-count instrumentation, many-tab load and contention cost profiles remain partial.

See SCENARIO-RESULTS.md/JSON for all46 triggers, layer-specific observations and remaining limits.37passed does not mean37nativeE2E;8partial are not treated as complete.

## Security, data, compatibility and operations

Current owner/private rules and live verified staff checks retained. Guest access uses owner-issued high-entropy SGT capability; an ordinary order ID grants no guest access. Public DTO remains exactly publicStatus/updatedAt/observedAt/eta. Safe timeline contains only allowlisted action+createdAt, never staff note, actor, address, recipient or money. Existing quotas remain unchanged; manual/automatic guest checks share budget. No dependency/rules/schema migration or backfill; historical unknown dates stay unknown. Existing audit/idempotency/outbox semantics preserved. Reusing order.version intentionally increases legitimate optimistic conflicts; source concurrency tests verify no lost money/state. Internal receipt proof is derived solely from canonical transaction reads and cannot be supplied by the caller.

Client provider/analytics fixture paths are denied/isolated; ANALYTICS-ISOLATION readback confirms server analytics disabled and zero owned jobs. No provider email/payment or production I/O executed. Auth/Functions missing local services were restored on existing approved ports/config/import, retaining original frontend5207 and Firestore18207. Host Node25 versus deployed Functions22 is a limitation, not production proof.

Owned fixture cleanup/readback: CLEANUP.json; only recorded synthetic order/parcel/projection/code/audit/outbox/idempotency records and two test identities deleted. Shared configuration and quota buckets preserved; quota records expire normally. Agent browser tabs closed and viewport override reset. No shared reset/reseed. Private capability file removed. Shared environment preservation is scope-based, not a full-database fingerprint guarantee.

Rollback: remove only task-owned patch against task-entry backups and reviewed manifest, never reset the dirty shared tree. No deploy/backfill to reverse. Additive event readers/writers need coordinated release review before any future production rollout.

## Remaining work and review decision

H01 blocked: actual purchaseCheckoutSetup correctly rejects expired shared approved demo pricing. H02 real HTTP checkout not reached. No shared pricing modification authorized or performed; proposed narrow expiry-only two-hour extension with compare-and-set backup/restore is concrete in DEMO-PRICING-DELTA.md and awaits human response.

N13/N16/U03/U04/P01/P03/P04 still have explicit native/adverse/accessibility/profiling gaps; see matrix. Missing evidence is not a product defect claim or a passed gate. Mandatory final review BLOCKED on requirement completeness/product accessibility, production NOT_READY. No further known functional defects in executed checks after fixes; no assertion of 'no bugs'. Review findings/cycles and all seven dimensions are recorded in current final review. Review assurance is agent self-review, not authenticated independent release review.

Context: actual source, tests, approved plan/current user approval and .ai policies; CodeGraph→CocoIndex intelligence DEGRADED, bounded current source verification. Relevant selected profiles/quality gates: QUALITY-GATES.md. Product eight principles and full changed-text inventory: PRODUCT-CONTENT-REVIEW.md. Token usage: Unavailable; API-equivalent estimate/actual billed cost: Unavailable. Memory candidates: None; no memory updated.

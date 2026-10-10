# CRM → customer tracking — delta implementation plan v1

Status: AWAITING_HUMAN_APPROVAL for new backend synchronization behavior. Source verified 2026-10-10 at HEAD99822aae502cc75406184ee345e4527c6e0db66d in dirty shared workspace. No product-code edits in this audit. No deploy. Existing frontend5207 and emulator18207 reused, no restart/reseed/new server.

## Repository intelligence and current evidence

CodeGraph queried first then CocoIndex; optional index/CLI health DEGRADED (stale indexes and local CLI log access); current source independently checked. Relevant root .ai/context map/build files are placeholders. React19/TypeScript/Vite/Firebase/Firestore; profiles: universal, typescript-javascript, frontend-html-css, web-app, visual-design, product-content, animation-motion, api, database, concurrency. Sources below are authoritative; old memory describing no guest feature is superseded by current public capability implementation.

Existing tests rerun:71 unit tests (5 files) PASSED;54 backend/security emulator tests (3 files) PASSED. Unit command: npx vitest run tests/unit/order-tracking.test.ts tests/unit/order-tracking-view.test.ts tests/unit/shipping.test.ts tests/unit/guest-order-tracking.test.ts tests/unit/account-tracking-request073.test.ts. Emulator command: GCLOUD_PROJECT=demo-satsunicgo FUNCTIONS_EMULATOR=true FIRESTORE_EMULATOR_HOST=127.0.0.1:18207 npx vitest run --config vitest.rules.config.ts tests/rules/order-tracking-hardening.test.ts tests/rules/order-tracking-security.test.ts tests/rules/guest-order-tracking.test.ts. Suites create and clean only random demo projects. First sandbox-limited run could not connect and was cancelled; network-authorized rerun completed. Logs attached. These are existing baseline tests, not completed new CRM→open customer E2E acceptance.

## Configuration versus transactional data

- Stage codes/transitions are business rules in packages/domain/index.ts and shipping.ts, not arbitrary editable master data.
- Display labels/order/grouping are currently source-controlled mappings in packages/domain/order-tracking.ts; no administrator timeline configuration CRUD exists.
- Per-order progress/version, event timestamps, parcel state, manual ETA and evidence are transactional data, not master data.
- Safe future master-data option: versioned display catalog keyed by immutable stage/event codes, localization/icons/customer visibility only, with validation/audit. Editing labels must never authorize transitions/payment/complete orders. This optional administrative feature is excluded from this focused correctness delta and requires a separate design approval if desired.

## Existing operational flow

CRM → Vận hành → Kiện & vận chuyển (Workspace.tsx path shipping). WAREHOUSE/OWNER pack and dispatch; OWNER/OPERATIONS_MANAGER update journey and manual ETA (backend checks live staffAccess/users as well as verified Google identity). CRM supplies operationId, expectedVersion and orderVersions to shippingCommand. Firestore transaction validates quantities, payment/hold/state and optimistic versions, then writes packages, packageAllocations, customerShipments projection, evidence, audit and idempotency. Consolidation dispatch has a separate transaction path. Owner callable customerOrderTracking reads orders/{id}, orders/{id}/timeline, packageAllocations, customerShipments and canonical packages for ETA checks. Account listens to order changes and reloads on order version. Ask reads owner or anonymous callable at question time; no subscription or bounded automatic refresh for an already-rendered tracking answer. Public code is owner-issued high-entropy SGT capability, not ordinary order ID; only publicStatus/updatedAt/observedAt/eta returned.

## Confirmed source gaps, not yet closed by new runtime acceptance

1. P1 synchronization: shippingCommand setDeliveryEstimate and nonterminal/partial trackParcel update parcel/projection but normally do not increment order.version. AccountTracking effect depends on uid/orderId/version/retry. An already-open Account timeline can retain old ETA/parcel data without a new order version. No subscription to parcel revisions exists in this component.
2. P1 recorded history: shippingCommand and consolidationCommand dispatch update order.stage and projection, but do not create orders/{id}/timeline dispatch/track events. Owner milestone dates read that subcollection; public projection finds status timestamps there. Thus a command-originated shipping milestone can have missing time despite a parcel activity record. Existing guest test seeds timeline/dispatch directly, and backend hardening test asserts projection updatedAt without asserting order milestone event: green baseline does not close this gap.
3. P1 open Ask freshness: answers remain snapshots until another query. It must not imply live CRM synchronization without a refresh strategy/freshness disclosure.
4. P2 batch parity: consolidation customerShipments projection omits updatedAt, unlike shippingCommand. Batch-originated activity must use the same recorded timestamp contract.
5. Coverage gap: existing browser shipping tests intercept SDK/queue calls; Account/Ask browser tests use prepared fixtures. They do not provide one continuous real CRM write → database → open Account → open owner/guest Ask proof.

## Recommended smallest safe implementation

A. Reuse immutable stage codes and approved shared visual timeline; do not add configuration CRUD now. No payment policy or owner/public data boundary changes.
B. Record safe order tracking events in the same Firestore transaction as each shipping mutation. Use deterministic event IDs bound to order+command operation for replay safety, server-recorded now, event kind and safe structured state/parcel reference only. Private manual notes/evidence/actor remain internal; callable redaction stays explicit. Distinguish status/dispatch time from ETA edit time; ETA edits must not pretend a new dispatch or delivery occurred. Preserve already-recorded milestone dates on later non-status edits. Current bounded history truncation remains honest.
C. Increment affected order.version exactly once per successful customer-visible shipping mutation, including ETA-only and partial scans; keep final stage unchanged until quantity-based completion is proven. Existing transaction version is reused, not a new schema/revision collection. Concurrent finance/order operations can correctly conflict and retry/reconcile through existing controls; measure that trade-off. Limit to existing<=10 orders/command. Dispatch paths must avoid double version increment. Exact replay changes no versions/events/outbox records. Aborted/conflicting mutation writes nothing.
D. Align consolidation dispatch timestamps/events/projections with single-parcel dispatch. Do not alter freight allocation, financial entries or notification consent/delivery policy.
E. Account remains order-listener driven; verify reload after ETA-only and partial scan by new order version, including same-order A→B→A and logout. Keep scope-matched data and freshness disclosure honest through refresh failure; never display another user's response.
F. Owner Ask subscribes only to the current selected owned order while the dialog/latest tracking answer is active; version change refetches owner callable. Coalesce changes, one in-flight read, generation+auth guards, deadline, cleanup on close/logout/switch. Keep older chat turns as historical snapshots; update only active tracking answer. Add accessible manual refresh fallback.
G. Guest Ask may refresh only public callable for the active code, at most once/60seconds while dialog/document visible and online; manual refresh uses same minimum interval/in-flight guard. Stop/backoff on quota/unavailable, close/logout/account switch/code rotation/expiry; no Firestore subscription, code persisted nowhere. Retain read time and explicit freshness wording; no claim of carrier GPS/live carrier feed. Scope-limited memory of active code must respect existing cancellation/redaction lifecycle. Confirm quotas and simultaneous users under a shared IP; current backend30reads/min/IP and10000/min global remain unchanged. New UI copy/buttons pass product language/accessibility review.

## File/function impact

| Files | Planned change |
| --- | --- |
| functions/src/shipping.ts shippingCommand | Atomic safe order events + once-only order version bump for affected visible mutations; same now for projection/events |
| functions/src/consolidation.ts consolidationCommand | Batch dispatch safe order events and projection updatedAt; preserve finance/outbox/idempotency |
| functions/src/order-tracking-events.ts (new, if extraction useful) | Small transaction write builder shared by two mutation paths; no I/O outside caller transaction |
| functions/src/customer-order-tracking.ts safeActions/projection | Explicit allowlist for any new event kinds, redact payload, preserve bounds/owner access |
| packages/domain/order-tracking.ts trackingMilestoneUpdates | Typed event-to-milestone mapping; precise recorded semantics; no ETA-to-dispatch/date invention |
| packages/domain/public-order-tracking.ts projectPublicTracking | Same allowlisted status timestamp semantics, existing strict public DTO unchanged |
| src/features/orders/AccountTracking.tsx and account-tracking-request.ts | Verify/repair refresh lifecycle/error/focus only as needed; keep Account design |
| src/features/ask/Ask.tsx, guest-tracking-request.ts; small shared refresh helper if needed | Scoped active owner/guest refresh, auth/generation/cancellation, no historical rewrite/code persistence |
| src/features/ask/OrderTracking.tsx/GuestOrderTracking.tsx | Accessible refresh/freshness hints only; approved compact/shared visual layout preserved |
| src/features/shipping/Shipping.tsx | Fix reproduced stale/retry/reconciliation/feedback issue only; no CRM redesign |
| tests/rules/order-tracking-hardening.test.ts, guest-order-tracking.test.ts; new CRM E2E test/fixture | Real source command transactions and callables; no preseeded shipping history for the assertions under test |
| tests/component, tests/unit tracking suites | Real component refresh/failure/race/accessibility assertions; no dependency upgrades |
| docs/reviews/ORDER-TRACKING-CRM-E2E-20261010 | Scenario receipts, product/quality/final review, cleanup/source manifests |

No public API response expansion or database collection rename; safe additive history events only. Legacy missing dates stay unknown; no backfill. Firestore security rules should remain unchanged; any discovered required permission change triggers separate delta review. Backend read/writes stay in one bounded transaction. Do not send emails or trigger external providers for tests; use synthetic non-production fixtures and existing provider-deny posture.

## Validation/acceptance

SCENARIOS.md defines required cases. Execute read-only assertions against random demo fixture or named owned shared-shell fixtures; no demo-satsunicgo reset or shared real-data modification. Use real CRM UI/native authenticated test fixture and emulator callable transport for one continuous browser journey; source .run and mocked SDK are separate lower evidence levels. Record which gates are actual transport/browser versus mocked component. Prove Account and owner Ask update from CRM without reload; guest within60seconds only while active; offline/failure clearly stale, no false completion/ETA. Check database events/revision/projection consistency and exact replay counts. No PII/code in screenshots, logs, storage, analytics or provider prompts.

Performance: 1/10 affected orders, 1/20 batch parcels, <=60 parcel reads and50 visible history events, frequent/coalesced updates, active/hidden tabs, concurrent staff and shared-IP guests. Report measured local latency/query/write counts and cleanup, not a fabricated production SLA. All existing scoped tests and new regressions, types, lint, backend+frontend compilation, responsive320/390/1280, VI/EN, keyboard/axe and reduced motion. Required review→fix→verify→fresh review with product language8 principles and final runtime report. No authenticated independent provider acceptance means productionNOT_READY even if local scope passes.

## Trade-offs, rollout and approval

Reusing order.version provides the smallest reliable signal but increases legitimate optimistic-lock conflicts; verify CRM draft preservation and safe reconciliation under those conflicts. Separate tracking revision could reduce conflicts but expands schema/listener/rules scope and is deferred. Guest polling costs are bounded and slower than owner subscription; public data remains an intentionally limited snapshot, not a private live feed. Configuration CRUD, maps/carrier integrations, production migration/backfill, notification changes and deployment are out of scope.

Rollback own scoped patch only. No production data repair or automatic deploy. Human approval requested for this v1 delta before protected application/backend/behavior-changing-test edits under .ai/workflows/plan-existing-system-change.md step15 and .ai/guards/implementation-approval-gate.yaml. Prior UI/guest approval does not cover new shipping transaction/version and automatic refresh semantics.

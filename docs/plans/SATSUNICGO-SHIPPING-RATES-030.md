# SATSUNICGO-SHIPPING-RATES-030 — Plan v1 / awaiting approval

Date: 2026-10-06. Scope: customer shipping fees, existing owner rate management, public rate read. No application changes have been made by this task.

## Evidence and repository intelligence

Current baseline: 1d9c5824e5d0647948a1986dabc7480c4b7b8cb2; worktree has substantial unrelated WIP. Preserve it. CodeGraph structural query found ShippingRates, calculateShippingRate, readPublicShippingRates, Workspace and App callers. CodeGraph index stale; CocoIndex health failed and index stale. Mode DEGRADED: source-verified bounded evidence, not complete repository coverage.

Verified flow: App.tsx path `fees` → ShippingRates.tsx → shared/firebase.ts callService → asia-southeast1 shippingRatesPublic → readPublicShippingRates → Firestore shippingRatePublic/current → shippingRateConfigSchema → shared calculator. SSR in functions/src/public.ts also reads public rates. Ask/ShippingQuote consumes the shared rates/calculator. Owner uses shippingRatesAdmin with active OWNER, verified Google auth, recent MFA for production writes, optimistic version and idempotency transaction, audit events.

Observed UI failure: ShippingRates.tsx catch displays e.message directly; config is rendered only after callable success. service-error.ts removes selected HTTP suffixes but preserves generic technical messages; it does not match `[0]`. User screenshot shows `internal [0]`. Backend root cause UNVERIFIED: screenshot cannot distinguish deployment exception, Firestore read failure, configuration issue, or transport failure. App Check is enforced in production; do not disable it. Region defaults agree in source; deployed configuration is NOT_TESTED.

Layout gap: ShippingRates uses CrmHeading/CrmState, whose richer styles are scoped under Workspace.css `.workspaceShell`. Public fees route returns ShippingRates directly. shipping-rates.css lacks a complete standalone heading, recovery or calculator layout. Source explains layout gaps but browser verification of live route has not occurred.

## Proposed experience

Standalone responsive white/light-gray, royal blue #163cff, navy #111c35. Primary flow: route → service/warehouse → chargeable kg → freight estimate or clear quote-required state. Default 2 kg is a prototype convenience, not customer research. Source labels remain explicit. Keep service timing as qualified reference information only.

Show supported fields for each route; changing route resets invalid dependent selections, keeps weight. Use useful quick weight choices, exact input validation, immediate result, matching table row, collapsed conditions, and CTA that carries selected context into the existing supported customer request/Ask flow. Mock CTA is simulation only; actual request mapping must be verified before wiring, with no new persistence introduced implicitly.

Loading, unavailable, offline and backend errors keep the calculator shell and entered values, show no fabricated total, give retry and contact/request path. No automatic client fallback to reference prices when server is disabled, invalid or unreachable. Distinguish `reference`, `published`, `unavailable`; reference is not published. Empty rows are not zero prices. Safe Vietnamese customer messages; internal diagnostics go to sanitized server logs without private data.

## DB / Firebase design

Retain existing collections and security model; schema migration is not required for initial remediation.

| Path | Meaning | Write boundary |
| --- | --- | --- |
| settings/shippingRates | Owner draft: version, config, changedAt, changedBy | OWNER callable, MFA, transaction |
| shippingRatePublic/current | Published safe snapshot: version, config, disabled | Publication transaction only |
| idempotencyKeys/{uid-operationId} | Mutation hash and durable result | Existing idempotent transaction |
| auditEvents/{id} | Actor/action and version trail | Existing audit transaction |

Read-only preflight after approval: verify actual project identity, region, deployed callable revision, App Check configuration, backend logs and sanitized shape/schema validation of public record. Do not print records or access secrets. Do not seed or rewrite production rates to hide errors. Capture failure classification and choose the evidenced fix. Any IAM, production data correction, App Check policy change or deployment requires separate authorization.

Keep absent-public-doc reference behavior initially for compatibility, but visibly identify it as reference. Explicit disabled public record must remain unavailable. Invalid stored config must fail closed. Proposed optional future source-verification/effective-date metadata and immutable publication history require a delta plan/schema approval; do not invent `verifiedAt` or freshness.

## Implementation map after approval

1. src/features/shipping/ShippingRates.tsx: separate public presentation from owner controls; route-specific fields, shell/status recovery, result card/table, preserved inputs and safe errors. Keep epoch/UID fencing and uncertain mutation retry semantics.
2. src/features/shipping/shipping-rates.css: self-contained public styling and responsive layout, keyboard focus, text wrap, no viewport overflow, reduced motion. Avoid global.css and shared dirty App.tsx unless a concrete delta is approved.
3. functions/src/shipping-rates.ts: only if read-only diagnosis establishes a backend defect, repair implicated read/validation path; preserve auth, MFA, App Check, versions, transaction/idempotency and audit. Sanitized error classification. No speculative backend patch.
4. src/shared/service-error.ts: prefer shipping-local customer message mapping first. If shared mapping needs change, inventory callers and request delta approval.
5. packages/domain/shipping-rates.ts: preserve calculator and source rates. No interpolation, exchange rate, hidden surcharge or delivery guarantee. Any tariff changes need verified commercial source and separate approval.
6. tests/unit/shipping-rates027.test.ts and tests/browser/release-ask-tracking-rates027.spec.ts: update only meaningful approved coverage. Rules tests stay unchanged unless the approved backend fix affects security paths. Add targeted callable failure-path checks within the existing test architecture if needed.
7. docs/reviews/shipping-rates030: current evidence, content review, source manifest, quality checks and final review.

## Acceptance and validation

- Public page works independently of CRM stylesheet scope at desktop and 390/320px mobile; 200% zoom, long text, keyboard, focus and accessible status checked.
- Actual public callable success and failing/disabled/invalid cases tested in nonproduction, without a fallback that revives disabled rates.
- VN 2 kg exact result; 2.2 kg and 5.5 kg quote-required; nonpositive/unsafe input; US product required; minimum 1 kg; Oregon and ambiguous products quote-required; no FX, tax or inferred total.
- Owner read/save/publish/delete/uncertain retry, stale version, locked/unauthorized owner, MFA/App Check and audit invariants preserved.
- SSR and Ask caller regression tested. Domain/rules tests, typecheck, targeted lint, then relevant browser/emulator checks. Freeze scoped source before final checks.
- Actual Firebase root cause and corrective evidence recorded before declaring repaired. Local tests do not certify production.

## Risk, rollout and rollback

Risk medium for public UI/data meaning; high if published tariffs, security or production config change. Smallest safe route: UI resilience and evidence-led backend fix, retain database contract. No new dependency. Alternative: a new pricing service/history system is broader than required and deferred. Self-contained CSS reduces shared-WIP conflicts. Deploy only after separate authorization. Rollback scoped UI/backend revision; never blindly restore another owner's published data. No migration in proposed first phase.

## Decision requested

Approve Plan v1 for local UI and evidence-led backend remediation, validation and review. Excludes production deploy, IAM, weakening App Check, tariff changes, DB migration and production record writes. Record named human approval and scope before protected edits per implementation-approval-gate.yaml.

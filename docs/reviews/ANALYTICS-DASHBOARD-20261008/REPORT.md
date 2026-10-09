# Analytics dashboard implementation evidence

Task SATSUNICGO-ANALYTICS-DASHBOARD-20261008 v1: SOURCE_IMPLEMENTED / PARTIAL_INTEGRATION. Cycle6 source review PASSED; overall governed completion BLOCKED. Production NOT_READY / NOT_DEPLOYED. This supersedes the planning checkpoint.

The overview now shows recorded visits, attributed conversion, popular products, safe Ask topics, canonical money movements, orders by market and exclusive stages. Optional tracking, owner-sidecar linking, transactional background aggregation, authorized bounded reading and new analytics retention declarations are implemented. No live business statistics or provider activation is claimed.

## Authority and context

Human implementation approval and frontend5207 restart approval: APPROVAL.md. Approved impact/metric/consent/retention scope: docs/plans/SATSUNICGO-ANALYTICS-DASHBOARD-20261008.md. Current App/catalog/Ask/checkout/CRM, orders/financialEntries, auth/staff/rules, build/tests and quality profiles were inspected. CodeGraph/CocoIndex searches/refresh were used, then source verified; latest gate DEGRADED with permitted native fallback.

TypeScript6, React19.3, Vite8.3, Node22 Functions, Firebase/Firestore, Vitest/ESLint/Playwright. Applied profiles: universal, typescript-javascript, frontend-html-css, web-app, api, database, concurrency, memory, product-content, visual-design. Full gates: QUALITY-GATES.md.

Current HEAD/base:53d59bd88fa7da9d1243692336ecd09b6540ea31. Dirty shared worktree; unrelated Ask WIP preserved. SOURCE_MANIFEST.json freezes analytics source/tests; concurrent shared integration hashes are qualified separately in FINAL-REVIEW.json. No commit, PR, Jira update, deployment, datafix or durable memory write.

## Changes and reasons

| Files | Change |
| --- | --- |
| packages/domain/analytics.ts | Strictv1 events/snapshots, fixed topic taxonomy, UTC, safe sums, cohort and historical full-payable semantics |
| functions/src/analytics-ingest.ts | Default-off consent/session capabilities, validation/quotas, verified owned-order linking, withdrawal/account-rotation distinction |
| functions/src/analytics-worker.ts | Idempotent transactional event/order/ledger projection, canonical versions/first payment, retries/dead/cancellation/compaction,16 daily shards |
| functions/src/dashboard-analytics.ts | Verified OWNER/manager reads, finance separation, distinct unions, coverage, bounded queries/cache |
| functions/src/index.ts;firestore.indexes.json | Nine narrow exports,2 additive indexes,13 new analytics expireAt TTL declarations/exemptions |
| src/shared/analytics.ts;AnalyticsConsent.tsx;analytics-consent.css | Independent bounded queue/transport, navigation occurrence identity, optional consent/refusal/withdrawal and cleanup |
| src/app/App.tsx | Public observer after auth readiness |
| CatalogCard.tsx;ProductsCatalog.tsx;ProductDetail.tsx | Canonical product IDs, explicit selections/actual detail views; Back/Forward/remount and stale-route guards |
| Ask.tsx;CatalogSearch.tsx;Commerce.tsx;Checkout.tsx | Safe accepted-question topics and retry identity; explicit product selection; confirmed/recovered owned-order links; concurrent WIP preserved |
| PrivacyPage.tsx | Fields/purpose/pseudonymous limits/prospective withdrawal/7-45-365-day intended retention and background deletion |
| Dashboard.tsx;DashboardCharts.tsx;dashboard094.css | URL dates/tabs, KPI/area/funnel/rankings/stacked/donut, sortable tables and keyboard alternatives, honest empty/unavailable/stale states; original queues |
| Analytics unit/rules/browser suites;dashboard094 browser regression | Actual validation below; hashes in manifest |
| Plan/preview/review docs | Approval/impact, concept, actual screenshots, all cycles/fixes, source hashes, product review, checks and activation procedure |

Browser IDs are not exact humans. Verified buyers include deposits; product paid orders require canonical full payable once and later refunds do not erase that occurrence. Conversion is a linked first-positive-payment cohort within7days; recent cohorts provisional. Money is cash movement, not revenue/profit. Ask stores fixed topics without raw query. Unknown is em dash; available empty is zero. Consent/offline/attribution/read limits cause undercoverage.

## Validation

25 focused unit tests PASSED735ms;11 real Firestore/callable.run cases PASSED54.54s;16 Chromium/current-component cases PASSED14.3s. Total52. Root and Functions typecheck, frontend build(Vite2.53s), scoped ESLint and diff whitespace checks PASSED. Existing chunk/import build warnings remain. Commands/boundaries: VERIFICATION.json.

Browser uses real components/router/CSS at5207 with synthetic transport; navigation test stubs unrelated review/cart children. Firestore tests use synthetic auth/callable.run and task-owned batch cleanup. They do not establish the actual authenticated whole-app/HTTP/trigger/App Check chain. Backend source unchanged since emulator run. No repository-wide green claim.

Product/visual review PASSED within executed Chromium scope:160 current strings/templates, all8 principles,320/390/1440px,200% text, keyboard/tables/sorting, actual consent/privacy/dashboard screenshots. Safari/Firefox/screen reader NOT_RUN. Concept preview values are illustrative, not business data.

## Weighted acceptance evidence

Only fully satisfied evidence criteria earn their approved weight; partial criteria earn0. This measures evidence rather than code volume or production rollout.

| Criterion | Weight | Status / remaining |
| --- | --- | --- |
| Truthful metric contracts |15|PASSED: source/schema/unit/emulator/product meaning |
| Collection/consent implementation |20|PASSED within local tested scope: real components/client lifecycle; actual HTTP chain separate |
| Canonical outcome/attribution logic |20|PASSED within emulator scope: ownership/installments/finalTotal/late link/refund/logout/version |
| Worker/performance |15|PARTIAL: logic/bounds/duplicate burst passed; cold/warm and reads/writes per1000events NOT_RUN |
| Charts/accessibility |15|PASSED within Chromium scope; cross-browser/screen reader not certified |
| Integrated validation/current final review |15|PARTIAL:52 focused checks and fresh source review pass; actual authenticated app/trigger chain NOT_RUN; governed final review BLOCKED |

Conservative verified weight70/100; all six have implementation. Full local integration/capacity evidence remains; provider rollout is separately excluded byv1.

## Review loop

Six independent cycles;17 findings from cycles1–5 corrected and reverified. REVIEW-CYCLES.md records each severity/fix/test. Corrections cover idle/late session identity, chronological full payment, UTC membership, opt-in detail capture, click scope, durable pending/loss, old-order cash, unknown blocks, Ask retry, account-change attribution, bounded creation retries, intentional withdrawal cancellation, sorting, Back/Forward and stale product identity. Self-review additionally fixed malformed source paths, retries after disposal, expired stage buckets and topic comparison bars.

Fresh cycle6 found no additional actionable analytics source defect within inspected scope; reviewer independently25/25units. Seven dimensions plus product language reviewed. Final governed decision remains BLOCKED by missing integrated evidence and governance limits; a source-review pass is not production readiness. FINAL-REVIEW.json binds decision/revisions. Development fixture failures/corrections are retained; no controls/count assertions weakened.

## Remaining gates and risks

Auth19207/Functions15207 are stopped; permission to start those shared services was requested and remains pending. Frontend5207 runs after explicit approval; Firestore18207 retained. No backend reset/reseed/restart.

Read-only provider checks for explicit satsunicgo found no analytics functions/active TTL. Tracking policy not enabled in production. No isolated reviewed release artifact: shared dist/Functions include unrelated WIP and must not be broadly deployed. ACTIVATION.md is the concrete9function/2index/13field sequence, enable-policy-last rule, exact project/region, required readback and rollback; it is not execution proof.

Remaining provider work: separately scoped rollout decision and isolated tested artifact, index/TTL ACTIVE, functions/triggers/scheduler/App Check, genuine owned purchase/collection chain and monitoring/performance. No historical backfill/canonical-source TTL. Production NOT_READY / NOT_DEPLOYED.

Accepted limits: fixed coarse Ask topics, no reconstructed visitor history, optional pseudonymous coverage,top10/<=31days,45-day working/365-day aggregate horizon, conservative unknowns at bounds and sticky loss pending operator reconciliation. Controlled demo burst/bounds do not prove a production SLO; retention source declarations do not prove active deletion; legal/cross-browser certification not claimed.

Governance: validator rejects DEGRADED due hard-coded READY despite AGENTS-authorized fallback/human approval. Guard unchanged. ai-agent-kit CLI unavailable; native evidence used, no lifecycle/runtime receipt claimed. These are visible completion/release limitations.

Provider token usage:Unavailable. API-equivalent estimated cost:Unavailable. Actual billed cost:Unavailable. Memory candidates:None.

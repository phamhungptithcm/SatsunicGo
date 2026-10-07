# SATSUNICGO-DASHBOARD-094 — Tổng quan vận hành

Status: APPROVED by human user reply "apporved" on 2026-10-06; scoped implementation completed locally. Approval: docs/approvals/SATSUNICGO-DASHBOARD-094.md. Evidence: docs/reviews/DASHBOARD-094/.

## Evidence and repository intelligence brief

Candidate inspected: 269aca833a748ac08b4152aa7de5a23d6cc4900a with unrelated dirty WIP. Preserve it. CodeGraph current/healthy; Dashboard exploration verifies Workspace lazy-load entry and callService downstream. CocoIndex stale/unhealthy: DEGRADED; conclusions verified through bounded source reads, not complete semantic coverage.

Source: src/features/crm/Dashboard.tsx; src/features/crm/Workspace.tsx; src/features/crm/Workspace.css:823 onward; functions/src/crm.ts:415 onward; tests/rules/server.test.ts:803 onward; package.json.

Observed: form submission is required before any metrics appear. operationalDashboard returns nine queue counts from up to 100 records per collection, created in a selected UTC interval of at most 31 days. Counts describe current states, not transitions. Holds/balance can overlap other order queues. There is no monetary summary or daily series in this response. OWNER/OPERATIONS_MANAGER permission and locked-user checks are server-enforced. Repository map/build docs are placeholders; commands verified from package.json. Stack: React 19, TypeScript 6, Vite, Firebase callable/Firestore, Vitest and Playwright.

## Proposed design and business outcome

Help a manager identify workload, bottlenecks and next action immediately. Keep Satsunic white/light-gray, navy #111c35 and royal blue #163cff. Adapt enterprise information density from IBM reference, retaining local components and visual identity. Avoid oversized forms and decorative charts.

Desktop composition:

1. Compact heading, period presets (today/7 days/30 days/custom), refresh, care/customer shortcuts. Default seven calendar days including today; load automatically once authorized workspace mounts.
2. Four primary KPI cards: new requests, quotes awaiting response, eligible purchasing, ready to ship. Each opens the matching queue; no summed total of overlapping categories.
3. Main area: horizontal bar chart of current order queues; separate support/financial work panel. Every chart has numeric labels and an accessible textual equivalent. No funnel/conversion percentage because these are current-state overlapping counts.
4. Action queue: payment exceptions, pending transfer verification, held orders and outstanding payment; count, plain-language meaning and direct link. No invented SLA or urgency score.
5. Quiet metadata: applied UTC period, last successful read, bounded coverage, expandable data explanation. Truncation remains clearly visible. Queue links must explain if destination has a broader period than the chart.

Mobile: cards 2 columns then 1 at narrow widths; chart above action list; wrap presets; no horizontal overflow. Clear keyboard focus, adequate contrast, touch targets and reduced motion.

## Data scope and trade-off

Recommended first implementation is frontend-only, using real returned counts for meaningful charts and action prioritization. Do not label collected cash as revenue or manufacture trend data. Revenue, profit, average order value, conversion and daily trends require a separately approved financial definition and aggregate API scope. Unavailable data displays as unavailable; missing keys never become zero. Actual zero results get a useful empty state.

This scope achieves an operational dashboard, not a full financial BI system. A daily trend/backend expansion is deliberately outside this approval because it changes the public callable contract and financial semantics.

## File-by-file implementation scope

- src/features/crm/Dashboard.tsx: controlled period presets/custom date inputs, auto-load, explicit validation, applied-period state, request race protection/unmount cleanup, primary KPIs, SVG/CSS bar chart, action panels, refresh/retry, freshness and coverage. Retain existing queue destinations and authenticated callService.
- src/features/crm/dashboard094.css (new): dashboard-scoped styling imported by Dashboard; preserve shared Workspace/auth WIP and existing sibling styling. No new dependency.
- src/features/crm/dashboard094-model.ts (new if needed): deterministic UTC period/response validation and metric presentation helpers.
- tests/unit/dashboard094.test.ts (new): date boundaries, invalid intervals, missing/malformed counts, overlap/non-additivity and truncation semantics.
- tests/browser/dashboard094.spec.ts (new): authenticated local/fixture dashboard states, stale-response handling, navigation, keyboard and narrow viewport. Test data clearly separated from provider evidence.
- docs/reviews/DASHBOARD-094/: product content review, quality evidence, final implementation review cycles and task report after approved implementation.

## Impact and preserved behavior

Read-only frontend change, medium risk due to business interpretation and automatic reads. One initial bounded callable read plus explicit refresh/preset actions; no polling. Keep server auth, authorization, transaction, query cap, UTC semantics, money handling and all operational writes unchanged. Protect against double submission and older responses replacing newer periods. Failed refresh labels retained data stale and offers retry; permission-denied does not display previous private state. No schema, index, runtime, infrastructure, dependency or deployment change. Rollback by reverting scoped files. Reuse shared 127.0.0.1:5207; no duplicate servers/restarts or demo-data mutations.

## Validation and gates after approval

Apply TypeScript/frontend/product-content quality profiles and write-product-content skill. Inventory all strings and loading, empty, error, permission, partial/stale, success states; evaluate Purpose, Agency, Responsibility, Familiarity, Flexibility, Simplicity, Craft and Delight with actual in-context evidence.

Run focused Vitest, TypeScript check, scoped ESLint/format checks, browser verification at desktop, 390px and 320px plus keyboard/zoom/reduced-motion. Observe existing listener before browser work. Final implementation review must be fresh; fix scoped findings and repeat verification/review. Record candidate and actual evidence. Provider/production checks remain NOT_RUN unless performed separately. Memory candidates: None.

## Approval request

Approve SATSUNICGO-DASHBOARD-094 frontend-only scope above to implement the operational dashboard. Approval does not authorize backend monetary/trend API additions, financial metric definitions, shared service restarts or deployment. Approver/task reference and exact scope must be recorded before protected edits.

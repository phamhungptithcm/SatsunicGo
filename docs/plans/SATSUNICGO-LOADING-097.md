# SATSUNICGO-LOADING-097 — Unified loading bar

Status: PLAN_READY / AWAITING_HUMAN_APPROVAL

## Requirement and interpretation
User requests a consistent reusable loading bar across the application, beginning with CRM, and preservation of screen layout while loading. Interpret screen preservation as keeping the existing shell, navigation, current content, and scroll position visible during refresh; reserve a stable content area for initial/route loading. Pending text remains contextual. Do not represent indeterminate work as a measured percentage.

## Repository intelligence brief
Current gate: DEGRADED. CodeGraph and CocoIndex health queries passed but both indexes are stale against the shared dirty worktree. One incremental refresh requested; do not treat old index results as current. Evidence for this plan is bounded source inspection using rg and targeted reads. Shared repository has extensive unrelated changes, including App.tsx and CRM pages; preserve them and limit edits to loading branches.

Verified structure: React/TypeScript frontend, CSS, Vitest. LoadingState and LoadingOverlay are in src/shared/Loading.tsx and loading.css. CRM CrmState delegates loading to LoadingState. App and Workspace use LoadingState for Suspense fallbacks. Numerous feature modules already use LoadingState. Toast owns the global overlay using feedback progress counters. CRM CSS overrides dimensions/spacing, producing inconsistent wrappers. Customers keeps its result container mounted with aria-busy while busy. Index-based complete impact evidence is unavailable.

## Smallest safe implementation
1. src/shared/Loading.tsx: add one reusable visual LoadingBar; use it in LoadingState and LoadingOverlay. Preserve existing props, operation ownership cleanup, slow-operation recovery copy, contextual children, accessible status announcements, and focus behavior. Add explicit inline/panel variants only where needed.
2. src/shared/loading.css: shared royal-blue indeterminate bar, compact neutral surface, responsive sizes, stable initial-loading region and reduced-motion treatment. Make global waiting treatment compact and retain underlying screen visibility and reachable recovery actions.
3. src/features/crm/CrmPresentation.tsx and Workspace.css: make CrmState loading use the shared compact/panel treatment; leave empty and error states intact.
4. src/features/crm/customer-workspace095.css: reconcile loading-specific overrides with the shared treatment without altering customer layout.
5. src/features/crm/Workspace.tsx and src/app/App.tsx: change only loading fallback presentation to retain workspace shell and give initial route waits a stable viewport-relative content area. Do not remount ready views or reset scroll/focus.
6. Inventory existing LoadingState and CrmState consumers across src/features and src/app. Most inherit the new bar automatically. Any independently implemented loading graphic discovered during implementation is recorded for delta approval if it requires additional modules; loading labels on buttons remain contextual.
7. tests/unit/loading-progress081.test.ts: inspect and run existing lifecycle/progress regressions; add coverage only if new variant behavior requires it. Add focused browser validation for CRM initial load, refresh, route wait, failure, mobile width and reduced motion.
8. docs/reviews/LOADING-097/: record product-content inventory, all eight principles, in-context verification, quality checks, final review cycles, completion report and memory candidates.

## Impact, boundaries and trade-offs
Visual change affects all existing shared loading consumers. Main risks are CSS overrides, narrow containers, duplicate status announcements and layout movement. Prevent through scoped selectors, explicit variants and rendered checks. Keep data fetching, caches, permissions, operation counters, failure/retry controls, disabled-action semantics and all existing WIP intact. No dependency, database, API, infrastructure, auth, deploy or shared-server changes. Use shared frontend 127.0.0.1:5207 without restarting it. A route fallback cannot preserve never-loaded content; retain shell and stable reserved space there. Cached refreshes keep existing content.

## Acceptance and validation
- One visual bar reused by LoadingState, LoadingOverlay and CRM loading states.
- No full-screen content disappearance during refresh; navigation and recovery remain reachable.
- Stable initial loading region; no new horizontal overflow at 320/390px or desktop.
- Indeterminate semantics, contextual Vietnamese copy, aria status/busy, no fabricated percentages.
- Reduced-motion fallback, long-wait message and success/error/unmount cleanup verified.
- Run frontend tsc --noEmit, existing loading-progress081 Vitest suite, targeted lint for touched TSX, and browser checks on the existing shared runtime.
- Product Language Gate and mandatory final implementation review must pass on the final diff; failures remain explicitly blocked.

## Approval requested
Approve this plan for local UI implementation and validation only. No deployment or runtime restart. Approval record will identify plan, human approver/task reference, scope and constraints after the user approves.

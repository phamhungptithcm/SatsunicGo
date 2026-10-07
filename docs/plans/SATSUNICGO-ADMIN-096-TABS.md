# ADMIN096-TABS / v1 — Shared slim tabs
Status: DELTA_PLAN_READY; awaiting reviewed-plan approval. Date 2026-10-06.

## Evidence and impact
Repository gate DEGRADED: CodeGraph stale but healthy; CocoIndex stale/unhealthy. Bounded rg and source verification used. React/TypeScript/Vite existing stack; no dependency changes.
PlanEditor and Activity currently render aria-pressed segmented buttons. Finance and Campaigns use fc095Nav groups; Shipping already uses tablist/tab/panel semantics with page-local keyboard handling. Multiple active chats own Finance/Campaigns/Shipping/CrmPresentation; coordination sent, no agreement inferred yet.
User requests standard shared slim tabs, explicitly rejecting rounded button clusters. Existing ADMIN096 approval does not include new shared modules or these three additional pages. This is a material shared-component delta.

## Concrete design
Transparent full-width rail, neutral 1px baseline, 2px blue active underline, 14px text, restrained medium active weight, 12–16px horizontal spacing and 44px hit area. No card background, pills, box shadows or active-button fill. Selected state expressed through text and underline. Focus outline remains distinct. Narrow viewport: scroll rail within page; do not wrap tabs into competing rows or force page horizontal overflow. No added animation.
Prototype: docs/designs/shared-tabs/prototype.html (proposal only; no backend data).

## File/function plan
- New src/shared/PageTabs.tsx: controlled selected value, stable tab/panel IDs, label, items, disabled state and onChange. No fetching or persistence. role=tablist/tab, aria-selected/controls, roving tabIndex, ArrowLeft/Right/Home/End move focus without issuing reads; Enter/Space activate through existing handler. Disabled items skipped; all-disabled case safe. Preserve focus target, native click and manual activation semantics. Panels stay mounted where draft preservation requires it.
- New src/shared/page-tabs.css: scoped .pageTabs/.pageTab selectors, override reset sufficient for existing global button styles without global changes. One standard for desktop/mobile/focus/disabled.
- PlanEditor.tsx and Activity.tsx: replace groups with PageTabs and explicitly link tabpanels. Preserve local drafts, request/context fencing, uncertain/pending locks and pagination. Remove obsolete adminTaskNav rules from admin-workbench096.css.
- Finance.tsx: replace fc095Nav only, link existing three hidden panels; keep scope handler and busy/blocked states.
- Campaigns.tsx: replace fc095Nav only, link existing two panels; preserve current switching/permission semantics without adding unrequested locks.
- Shipping.tsx: replace existing tablist and duplicate keyboard code; preserve panels, icons, disabled and workspace handler. Coordinate these last three files with their owners before edits; do not overwrite WIP.
- tests/unit/page-tabs.test.ts or focused browser checks: meaningful keyboard navigation, disabled skipping, activation/focus, selection/panel relation, draft retention. No new test environment dependencies. docs/reviews/ADMIN096-TABS stores current evidence, inventory and final review.

## Bounds and risks
Medium UI/accessibility risk, low data risk. No backend/auth/schema/publication/dependency/server/deployment changes. Keep labels; no new business meaning. Filters, market selection, quick weight, editor formatting toggles and row selection are NOT tabs and remain unchanged. Other pages can adopt the shared component through scoped future migrations; do not relabel unrelated controls.
Rollback only task hunks/new files; preserve shared work. CSS-only standard is smaller but leaves duplicate semantics/keyboard implementations; shared component is recommended.

## Validation and completion
Use shared5207 only, no seed/reset/additional server. Check desktop and390px, long labels, keyboard Arrow/Home/End/Enter/Space, tab order, disabled/pending, associated panels, input retention and no horizontal page overflow. Scoped lint/typecheck/unit validation. Apply existing write-product-content, web/visual/TS profiles, inventory accessibility labels and all eight principles. Fresh final-implementation-review required; report all NOT_RUN/BLOCKED evidence explicitly. Existing ADMIN096 blockers are not silently certified by this task.

## Approval requested
Approve delta ADMIN096-TABS/v1: shared PageTabs component/CSS plus the five listed page migrations and proportional tests/review evidence, under the unchanged-data and coordinated-WIP constraints above.

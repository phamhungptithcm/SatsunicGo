# FINANCE112 — Thanh toán & đối soát

Status: PROPOSED — awaiting explicit human approval. No application edits made.

## Intelligence brief

Base: caeec53, dirty shared worktree. Finance.tsx and FinancialReview.tsx are not currently modified. Preserve all unrelated work. Shared frontend listener verified on 127.0.0.1:5207; do not restart or reseed.

Repository intelligence: DEGRADED. CodeGraph health passes but index is stale; CocoIndex index is stale and health fails due to daemon-log filesystem permission. Claims below use bounded current source inspection, not current index coverage.

Verified sources: src/features/payments/Finance.tsx, FinancialReview.tsx; src/shared/PageTabs.tsx, StepForm.tsx; src/features/crm/CrmPresentation.tsx, finance-content095.css; shipping-workbench.css; package.json; finance-contextual.test.ts and finance-content095.test.ts.

React 19 / TypeScript 6 / Vite 8 web application. Existing PageTabs already provides keyboard navigation and horizontally scrolling tabs. FinancialReview already uses StepForm. Transfer and membership forms have two evidence fields and do not need artificial extra steps.

## Business goal and observed gap

Help authorized staff select the right queue, inspect the transaction and evidence, then submit the appropriate financial action. The current page leads with a long generic notice and a reversal form before the primary queues. Hierarchy and empty-state scale obscure the daily task.

Queues load through listWork; paging replaces the current page, up to 30 records per group. Transfer notifications are not verified money. Membership confirmation activates the plan and does not settle purchase orders. Exceptions can be closed without recording money; allocation requires verified inbound. Reversal records actual bank reversal. Existing leases, operation IDs, order versions, denied-authority handling, uncertain-command retry and evidence validation are important constraints.

## Proposed layout

1. Compact purpose line below the shared shell heading.
2. PageTabs immediately below: Chuyển khoản / Hóa đơn thành viên / Ngoại lệ. No synthetic totals or revenue cards.
3. One primary work area with concise queue-specific description, relevant notice, compact empty state or structured record list, and existing next-page action.
4. Each record leads with amount and status, followed by order/invoice reference and transfer details. Existing confirmation forms reveal inline with persistent field labels and explicit outcome buttons.
5. Bank reversal sits in a separate secondary section after the main queue, still discoverable and mounted. Preserve FinancialReview's existing three steps and place consequences next to its final action.
6. Use existing blue/navy tokens, white surfaces, thin borders, shared icons, 44px controls and PageTabs/StepForm spacing. Narrow screens stack facts and controls; do not introduce a second component system.

## File and function plan

- src/features/payments/Finance.tsx: reorganize Finance JSX only; add contextual guidance and record presentation; retain panel IDs, mounted drafts, scope state and command/read functions. Refine TransferReviewForm presentation without changing payload or retry behavior.
- src/features/payments/FinancialReview.tsx: presentation and concise contextual copy only, if needed; retain StepForm stages, financeReviewInput and transport semantics.
- src/features/payments/finance-workbench112.css (new): page-scoped layout; avoid edits to finance-content095.css because it is shared with other surfaces.
- tests/browser/finance112.spec.ts (new): focused UI regression coverage for tabs/draft retention, narrow viewport, empty/error/uncertain states and safe financial form navigation, using synthetic test data and existing shared server.
- docs/reviews/FINANCE112/: product-content inventory and eight-principle evidence, final review cycles and completion report after implementation.

## Impact and boundaries

Presentation work has moderate financial UX risk. No backend, authorization, contracts, schemas, dependencies, CI, deployment, money calculations or financial state changes. Keep stale/error/unknown data distinct from empty results. Preserve exactly-once retry identifiers and blocked navigation while operations are unresolved. Inspect final diff for accidental handler changes. UI rollback is a scoped revert of approved files.

Alternative: global redesign of CRM primitives. Deferred because shared components are adequate and wider changes would affect unrelated pages. A global business-progress stepper is inappropriate because the three tabs are independent queues rather than sequential stages.

## Validation and handoff

Run frontend TypeScript check, targeted lint, finance-contextual and finance-content095 unit tests. Run focused browser tests and inspect desktop/mobile rendered states on port 5207, without executing real financial writes. Verify keyboard tabs, focus, draft preservation, pending/denied/unknown outcomes, long references, overflow and reduced motion. Add browser regression checks proportional to risk; no mirror-of-markup unit tests.

Apply repository web/frontend, accessibility, security and product-content profiles. Inventory changed visible and accessible strings and document Purpose, Agency, Responsibility, Familiarity, Flexibility, Simplicity, Craft and Delight with current rendered evidence. Mandatory final-implementation-review: review, fix approved findings, verify, review again until fresh pass. Report unrun or blocked checks plainly. This plan is not implementation or production acceptance.

Approval requested: FINANCE112 v1, limited to the files and presentation scope above.

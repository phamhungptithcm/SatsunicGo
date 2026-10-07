# CRM-UX028 v1 — Concrete implementation plan

Status APPROVED for bounded Batch A mobile Workbench reveal/new scoped CSS/tests, verified direct human prior approval. Risk MEDIUM (navigation/focus/actions), higher-risk financial behavior preserved. User approval verified from original messages in chat01a109b5-e7bb-75a3-8c43-08eb284a0854: turn01a10ce0-c60d-7563-93a5-86b4f8b61589 “Approved to fix alll”; turn01a10c15-6a8f-79a0-b461-fb7f707fc49b user01a10c45-23a0-79c2-aaf3-cce110a391ed “không cần chờ approve fix proposal mình appproved all what you propose ... loop test, fix, verify”. Current root assigned newCSS/tests and Workbench after owner handoff. No protected implementation edits made.

## Batch A: immediate staff usability

1. src/features/operations/Workbench.tsx — selection handler and list/detail rendering: mobile detail mode with Back to list, preserve filters/list position, focus detail heading, reset mode when target/queue changes; maintain request generation, keyed order tools, single-flight and frozen pending fieldsets. Desktop empty-detail prompt. ActionForm claimPurchase only: derive eligibility from current stage/hold/net-minus-reserved and domain purchaseAmount; disable and explain missing prerequisite; keep server enforcement. No server queue rewrite.
2. NEW src/features/crm/crm-ux028.css — scoped Workbench layout/compact metadata/empty detail and short interaction motion. No global selectors. Reduced motion immediate. No global.css edit.
3. src/features/crm/Workspace.tsx — import scoped stylesheet; distinct nav icons, stable route focus and accessibility; preserve allowed routes, signout and mobile dialog. Coordinate timing with CRM owner; no App.tsx changes.
4. src/features/crm/CrmPresentation.tsx — semantic empty-state icon rather than success check and any required accessible navigation affordance. No business promises.
5. NEW tests/unit/crm-ux028-eligibility.test.ts if pure helper introduced, and NEW tests/browser/release-crm-ux028.spec.ts — funded/unfunded/reserved/held/stage action availability; mobile selection visibly reveals detail, keyboard/back, queue change, pending retry input and reduced-motion behavior. Run through root serial runner, never competing fixture jobs.

## Batch B: page-specific presentation (same approval request, separate leases)

- Customers.tsx + Customer.tsx: contextual name-prefix/exact-ID labels, consistent full reference display and care layout; assignee name only from already authorized available roster, otherwise ID fallback. No new backend projection.
- shipping/Shipping.tsx + Consolidation.tsx: compact selected record editing; preserve all authoritative eligibility, line/parcel selection, version, evidence and dispatch restrictions.
- payments/Refunds.tsx + Finance.tsx: compact record decision and section navigation; conditional confirm/cancel fields and explicit decision label. Never submit/automate real money.
- settings/Settings.tsx + StaffAccess.tsx: heading hierarchy, contextual help, read-only conversion preview sourced from currency units; preserve policy/role controls. No permission changes.
- content/ContentEditor.tsx + Campaigns.tsx + membership/PlanEditor.tsx: compact browse/edit layouts and contextual save/cancel, preserve validation, version/retry and audience meaning.
- Dashboard.tsx + crm/Activity.tsx + support/Thread.tsx: typography/actions/state hierarchy only, preserve snapshot/30-record limits, audit read-only and conversation retry semantics.
- invoices/Documents.tsx/documents.css: findings handed to invoice owner; edits excluded until explicit owner lease and delta plan. No source claimed approved here.

Batch B exact component changes must be re-inspected just before each lease and kept within these presentation boundaries; new API/data/search/business changes require delta approval.

## Coordination and impact

Purchase-flow root owns global.css/App/Ask/backend integration and serial tests; existing CRM chat owns CRM history. Only this audit directory written now. Allocate one writer per protected file after approval and lease acknowledgement; new stylesheet avoids global.css overlap. Do not restart localhost5187/8187/9197/5107/9297, reseed, rebuild Functions, commit entire dirty tree or deploy. Recheck current revision and hash before editing; do not revert concurrent WIP.

React19/TypeScript6/Vite8/ReactRouter7; no dependencies/schema/API/runtime infrastructure changes. Profiles universal, typescript-javascript, web-app, frontend-html-css, visual-design, product-content, animation-motion. Compatibility: keep /crm, /staff redirects, role boundaries, catalog full payment/custom installments, full identifiers and bank/audit evidence. Rollback owned UI patch only.

## Acceptance and checks

390/768/1280/1440 plus200% zoom; no document overflow. First/last of30 order selections reveal detail without traversing queue; Back restores context. Eligible action matches domain and stale snapshots cannot authorize server mutation. Keyboard focus visible/logical; dialog Escape and restoration. Forms preserve draft on failed save, target change prevents stale writes, errors have next action. Loading/empty/partial/offline/forbidden/success for affected pages. Prefer native semantic controls. Motion150–200ms as proposed design target, not Apple numeric requirement; reduced motion0ms. Relevant frontend tsc/lint, existing Workbench/CRM/lifecycle regressions plus meaningful new browser scenarios. Serial runner scheduled by root; no full build affecting generated public assets during shared freeze.

Product language inventory and all8 principles require current rendered evidence after implementation. Final implementation review must be fresh PASSED before successful handoff. Source, fixture, provider and production evidence remain separate. Deployment/release require distinct approval.

Execution boundary: mobile reveal/Back/focus and empty-detail/compact CSS only, ActionForm claimPurchase prerequisite UI only; domain unchanged. Other findings are handed to file owners for follow-up; Workspace/globalCSS/root integration excluded from this writer. No claim all Batch B done. Memory candidates None.

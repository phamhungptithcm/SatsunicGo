# SATSUNICGO-CRM-REDESIGN-095 v1

Status: APPROVED / IMPLEMENTED / LOCAL_VALIDATION_PASSED. User approved implementation and later runtime recovery; see approval records.

## Repository intelligence and evidence

Inspected base: `269aca833a748ac08b4152aa7de5a23d6cc4900a`, shared dirty worktree. Preserve all unrelated changes. Gate after one refresh: CodeGraph current and healthy; CocoIndex search/health succeeds but metadata remains stale. Intelligence mode DEGRADED; semantic results are historical pointers only. Bounded source evidence: Customers.tsx, CrmPresentation.tsx, Workspace.css, crm-ux028.css, support/Thread.tsx, functions/src/crm.ts, package.json and customer-contextual tests. Repository-map/build-test documents are placeholders. CodeGraph verifies Workspace → Customers routing and shared presentation dependencies. CocoIndex returned historical browser evidence; current source remains authoritative. No complete coverage claim.

React 19 / TypeScript 6 / Vite 8 web app; Firebase callable services. Existing Customers handles both customer search and follow-ups; support queue lives in Thread.tsx. Existing shared CRM heading, icon, reference and state components are reusable. Frontend listener 5207 verified; no server or emulator restart authorized by this plan.

## Verified gap and proposed composition

Screens show an oversized heading and filter card, weak result hierarchy and empty states with little direction. Customer search supports name prefix or exact ID; these must remain distinct. Follow-ups support overdue/upcoming/all and optional current assignee. Counts are paginated, not whole-system totals. Support tickets have guarded replies with versions and uncertain-result recovery.

- Customers: compact heading with refresh; bounded-width search mode plus flexible search input and primary search action on one toolbar. Persistent labels and mode-specific guidance. Results in one surface with page-only count, clear customer identity, assignee, care date and explicit open-profile action. Keep technical IDs available through disclosure.
- Follow-ups: same page pattern; compact, clearly labeled due-range selector and current-assignee checkbox. Highlight care date with text as well as color. Preserve explicit application of filters and disclose pending filter changes. Empty state explains current filter and offers supported retry/change actions.
- Support: compact heading and short purpose statement; ticket list as the main work area with clear status, identity and expandable conversation. Preserve reply draft, resolution checkbox, pending mutation locks, version checks, targeted ticket behavior and recovery. Distinguish targeted not-found from empty current page without asserting the whole queue is empty.
- All three: white/light-gray/navy and existing blue tokens; 8px spacing rhythm, 24–28px heading, 14–16px body, 40–44px controls, subtle borders and minimal shadow. IBM reference supplies information density only. Mobile stacks controls and keeps readable record cards; keyboard focus and reduced motion remain supported.

## File-by-file scope and ownership

1. `src/features/crm/Customers.tsx`: presentation/semantic markup for Customers, explicit filter handlers unchanged; add safe page-result summary and contextual recovery.
2. `src/features/support/Thread.tsx`: presentation for support queue and StaffTicket/Thread only where needed for coherent hierarchy; retain request/mutation handlers and contracts.
3. `src/features/crm/customer-workspace095.css` (new): scoped styles imported from these feature files; no global CSS overrides.
4. Scoped browser checks for the three routes using existing fixture mechanisms, plus review evidence under `docs/reviews/CRM-095/`.

Shared CrmPresentation.tsx, Workspace.tsx, Workspace.css, global tokens, App.tsx, Dashboard.tsx, shipping, finance and content editing remain outside edit ownership. Shared component changes require coordinated delta approval. Sync proposals sent to active redesign chats at user request. Operations chat confirmed separate Workbench/Returns/ChangeQueue ownership and agreement on these tokens/density; no shared CRM/global CSS edits. Finance/content chat identified separate Invoices/Refunds/Payments/ContentEditor/Campaigns ownership. No new dependencies, API, backend, schema, permission or runtime configuration changes.

## Impact and risks

Risk MEDIUM: staff-facing customer and support workflow. Main risks are stale results after filters, lost reply draft during disclosure, misleading counts/status, hidden controls/focus and accidental mutation during navigation. Preserve request generations, exact query mode, cursor/asOf semantics, existing authorization and full IDs. No fabricated KPI, auto-resolution, new ticket creation or unsupported search/filter. If fixing a discovered behavior requires backend/authority changes, stop for a delta plan.

Rollback: revert this scoped implementation diff only, preserving other sessions' WIP. Deployment and live-provider validation are outside scope.

## Validation and handoff after approval

- Run TypeScript noEmit and scoped ESLint; relevant existing customers-contextual/support-contextual/CRM domain tests.
- Browser on existing 5207: customer search modes and explicit filters; follow-up modes/current assignee; pagination; targeted support, expand/reply/resolution and pending/error recovery. Use synthetic fixtures with disclosed evidence scope.
- Desktop and 390/320px mobile, keyboard/focus, 200% zoom, long names/IDs, loading, empty, error, populated and unavailable states; ensure no overflow or focus loss.
- Product Language Gate via write-product-content: inventory changed strings/states, actual business meaning, all eight principles and web-platform fit, with current in-context evidence. Profiles: typescript-javascript, frontend-html-css, web-app, visual-design, product-content and concurrency where guards apply.
- Mandatory final-implementation-review cycle: review → fix approved findings → verify → fresh review; completion report includes every cycle, remaining gates and evidence limits. Implementation checks currently NOT_RUN. Production readiness NOT_ASSESSED. Exact token/cost accounting unavailable. Memory candidates: None.

## Approval requested

Approve `SATSUNICGO-CRM-REDESIGN-095 v1` for the frontend files and constraints above. This plan does not authorize deployment, shared runtime restarts or changes owned by other chats.

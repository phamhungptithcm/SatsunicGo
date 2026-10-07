# CRM-CONSISTENCY102 implementation plan

Scope approval requested: local frontend consistency across CRM, based on docs/reviews/CRM-CONSISTENCY-102/REVIEW.md.

1. Establish shared compact filter toolbar styles and small presentational controls in src/features/crm/CrmPresentation.tsx and Workspace.css/crm-ux028.css. Visible labels, consistent sizing, responsive wrapping and focus; no backend behavior changes.
2. Customers.tsx/customer-workspace095.css: search/due/owner controls aligned; explicit submit, active applied conditions and reset; preserve name-prefix/exact-ID and draft/result invalidation.
3. Workbench.tsx/operations-workbench.css: queue controls retain existing URL/server semantics; align title/navigation terminology and show/reset current supported queue. Dedicated purchasing/warehouse scope remains fixed.
4. ContentEditor.tsx and list CSS: visible search/status/category labels; reset; accurate loaded-result scope and count; preserve local substring behavior and editing/unsaved guards.
5. Documents.tsx: visible/removable order context and aligned list tools, preserve active creation/edit drafts.
6. Review and align PageTabs/toolbars for Shipping, Finance, Activity, Campaigns, PlanEditor; keep datasets separate from conditions. Align existing forms in ShippingRates/StaffAccess/Settings and independent Studio list controls without redesigning editor shell.
7. Do not add unsupported filters, service APIs, Firestore indexes, counts, membership/payment actions or production writes. Do not touch unrelated concurrent WIP. Reverify component ownership/current hunks before edits.
8. Validate source/typecheck/lint and focused browser tests for each affected toolbar, mobile, keyboard, reset, draft/applied results, pagination and failures. Record Product Language review and final review. No deployment included.

Risk: moderate UX/state regression because list-loading semantics differ. Use presentation-only changes and bounded explicit reset handlers; if backend scope is needed, stop for delta plan. Intelligence DEGRADED; browser-wide visual review pending. Await direct human approval before application changes.

# INVOICE-UI-111 — approved for implementation

User request: redesign invoice page, coordinate concurrent UI sessions, and follow shared style and format.

## Evidence and boundaries
- Repository intelligence: DEGRADED. CodeGraph stale (health passed), CocoIndex stale (health failed); check script run 2026-10-07. Bounded source inspection used; no whole-system completeness claim.
- Documents.tsx uses CrmHeading, CrmState, CrmReference, WorkbenchComposer095 and LatestDocumentRequest. Seller configuration is a separate details panel before the list; documents.css repeats layout/breakpoint overrides.
- Shared worktree contains unrelated active changes. Coordination messages sent to UI thread 01a11451-c488-7382-81f7-f847949fa229 and release thread 01a117ac-8b51-7de0-9004-5d00f8c0b034; responses pending.

## Proposed implementation
1. Documents.tsx: align title and permitted actions in shared CrmHeading. Keep one primary action, “Tạo bản nháp”; seller settings becomes a compact labelled icon action opening WorkbenchComposer095 rather than a standalone accordion. Preserve authorization checks.
2. Use the shared composer for seller editing; short labels “Tên người bán”, “Địa chỉ”, “Liên hệ”, with required marks matching native validation. No stepper for a one-field draft creation form; use existing StepForm only if source-verified multi-stage entry warrants it.
3. Keep one list heading and compact empty state. Selected detail uses existing list/detail transition and keyboard focus restoration. Long identifiers remain accessible through CrmReference.
4. documents.css: consolidate local invoice rules, use current CRM tokens and component geometry after ownership confirmation. Consistent horizontal action alignment, density, responsive single-column behavior, and print stylesheet. No global CSS edits unless separately coordinated and approved.
5. Preserve internal/non-tax invoice disclosure, immutable issued snapshots, payment meanings, draft/issued/void differences, sharing permission and pending-operation recovery. No API, financial calculation, ledger, schema, or production data changes.

## Validation and review
Run existing invoice request-race/unit checks and relevant lint/build. Inspect local shared5207 at desktop and narrow viewport: empty/loading/error, composer submit/cancel, keyboard focus, detail return, issued/draft/void, pending recovery and print preview. Do not restart runtime. Complete current product-content review (all eight principles) and final implementation review before handoff. Deployment remains a separate release coordination step; no claim of production delivery from local checks.

## Approval
Existing catalog/release approvals are not approval for this new invoice redesign plan. User approved this plan with “apporved” on 2026-10-07. Scope limited to invoice UI and task evidence.

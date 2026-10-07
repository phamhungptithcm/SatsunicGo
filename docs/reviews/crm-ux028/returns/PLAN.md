# Returns contextual form — bounded plan v1

2026-10-05 America/Chicago. Existing human approval evidence: docs/approvals/SATSUNICGO-CRM-UX-028.md references original owner approval to fix all proposed findings and iterate. Its explicit paths cover the prior Workbench writer; this page batch requires a separate confirmed file lease from root before source writes. No new permission request needed for the authorized correction; coordination remains mandatory.

Observed source: Returns.tsx renders line, quantity and condition for all actions, including close, although close payload omits these. Receive ignores condition. Native required quantity can therefore block close for unrelated input. All rows render forms; pending input remains editable and repeated submit is not synchronously guarded.

Ownership request: exclusively src/features/operations/Returns.tsx, new src/features/operations/return-form.ts (if pure payload/eligibility helper needed), tests/unit/return-form.test.ts, and docs/reviews/crm-ux028/returns/**. No Workbench, Workspace, CrmPresentation, App, global.css, backend, domain/public contracts, invoices or browser test runner edits.

Implementation after lease:
1. Controlled action state receive/inspect/close. Line/quantity shown only receive/inspect; condition only inspect; evidence retained for every action. Closed records stay read-only.
2. Preserve role-based canClose, line identities, expectedVersion, evidence bounds and operationId retry behavior. Freeze fieldset while pending and immediate single-flight guard; no change to command or financial outcomes.
3. Add meaningful payload regressions: close does not depend on omitted quantity/condition; receive excludes inspection condition; inspect includes valid condition; unauthorized close blocked by existing role affordance. Server remains authorization authority.
4. Preserve CrmPresentation/shared styles. Compact default summary only if existing components suffice; no CSS lease assumed.
5. Freeze exact source hashes; root serial runner checks 390/768/1440, keyboard, 200% zoom, pending/error/retry and close workflow using synthetic fixtures. No parallel native browser test, service restart/seed, provider or real money.
6. Current string/state inventory, all eight content principles, review/fix/verify cycle; scoped handoff BLOCKED until required native evidence exists.

Current status: IMPLEMENTING. Root021 assigned exclusive Returns.tsx lease in current coordination message on2026-10-05. Helpers remain exported within that file; new helper source file is not leased. Scoped unit tests/docs only. Previous019/021 ownership does not supersede root's current shared candidate freeze. No deployment readiness implied.

UI/UX focus addendum (direct owner steering2026-10-05): compact Returns list with title/action aligned, visible receive/inspect quantity summary derived only actual counters, line table disclosed on demand, native mutually exclusive action disclosures. Preserve error/pending draft and exact retry. Only existing shared styles reused; no new CSS/backend edits. Current source hash verified unchanged before correction.

## Native follow-up delta (approved root lease)
Current390px capture shows generic title and two long full IDs dominate card; product identity hidden. Use actual first approved line name plus actual extra-line count, disclose full IDs explicitly. Keep status/counters/order link visible. Remember the current list cursor for reload and mutation refresh instead of returning to page0. Root owns native fixture/page navigation assertions; no backend/CSS changes.

# Required date labels: proposed delta

Status: PLAN_READY, NOT_APPLIED, awaiting explicit human approval for this concurrent Dashboard path. No Dashboard change made by Ask task.

Actual required-label regression found two missing required markers on src/features/crm/Dashboard.tsx:507. Both native date inputs already use required. Smallest patch adds the shared aria-hidden requiredMark star beside each existing label, wrapped inline for narrow screens. No validation, UTC period, analytics, tracking, API, transaction or CSS change.

Reviewable patch: DASHBOARD-LABEL-DELTA.patch. Baseline SHA256: eeee8cdb5a9264e0099b229dd42e701fb3352c40273a5d817881918a154d5ca5

After approval re-read the current line and adapt without reverting concurrent edits; rerun required-label unit, frontend compiler and actual Dashboard date-filter keyboard/mobile render within existing 5207 fixture if available. Inventory the two unchanged labels plus decorative marker in product review. Whitespace/diff inspection and fresh final review required. Full unit rerun only after the focused checks pass.

Approval rule: AGENTS.md existing-system plan gate and .ai/workflows/plan-existing-system-change.md require explicit approval for material paths outside the reviewed Ask implementation boundary. This optional narrow delta is not permission to adopt or deploy the concurrent Dashboard changes.

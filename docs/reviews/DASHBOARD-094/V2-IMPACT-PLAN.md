# DASHBOARD-094 visual refinement v2

Authorization: existing DASHBOARD-094 human approval plus direct request to make this same page prettier and clearer. This refinement stays inside the approved frontend presentation scope; no material delta requiring another approval.

Intelligence: CodeGraph/CocoIndex stale, CocoIndex unhealthy; DEGRADED bounded current source reads. Dashboard uses CrmHeading/CrmIcon and existing operationalDashboard; shared components have unrelated WIP and are read-only for this refinement.

Observed gap: 11–12px secondary text is too small; KPI hierarchy is flat; chart numbers and action counts need stronger emphasis; toolbar primary action is visually weak. Current code retains reviewed bounded/overlapping metric semantics.

Plan: edit dashboard094.css only for application changes. Increase typography, give intake KPI a brand-blue anchor, emphasize other values and action count badges, use stronger chart bars and clearer row alignment, make refresh a clear primary control, keep native focus/keyboard and 44px controls, and verify 1440/390/320 plus text scaling. Keep all copy/data/calculations/requests/routes unchanged. No shared/global CSS, dependency, runtime, server or backend edits.

Risk: low presentation risk, primarily narrow-width wrapping and contrast. Browser tests and current screenshots required; scoped static checks plus fresh product-content/final review. Rollback: revert only v2 CSS changes. No new tests needed unless an observed regression requires one. No deployment authorized.

# CRM-MENU-108

Approved by direct human `Approved` after concrete plan: replace CRM drawer close text with an X icon and accessible label, 44px target; dismiss outside panel, retain inside interactions, Escape/navigation dismissal and native focus restoration. Only Workspace.tsx and Workspace.css application changes. No deployment.

Intelligence: DEGRADED, stale CodeGraph/CocoIndex, CodeGraph health passed and CocoIndex failed. Bounded rg and source evidence used. Existing Workspace uses native dialog showModal/close, state menu, navigation close callbacks, onCancel/onClose; no outside dismissal handler existed. CSS uses CRM screen-only styles. Risks: accidentally treating panel whitespace as outside, lost accessible name, focus regression. Verify native browser geometry/dismissal/focus at narrow and tablet widths, lint and TypeScript. Authentication, roles, persistence and route semantics unchanged. Revert these two scoped edits for rollback.

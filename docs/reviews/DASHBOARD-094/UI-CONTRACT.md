# Dashboard ownership and UI contract

SATSUNICGO-DASHBOARD-094 owns Dashboard.tsx, dashboard094-model.ts and dashboard094.css only. No shared Workspace.css, CrmPresentation.tsx, global CSS, App or Firebase edit.

Reuse shared CrmHeading/CrmIcon. White cards, light-gray workspace, navy #111c35, royal blue #163cff; muted #5d6b84; borders #e1e6ef. 8px spacing rhythm, 12px cards, 44px controls, clearly named primary actions, native labeled fields. Dashboard styles require both workspaceShell and dashboard094, so sibling pages remain isolated. Breakpoints: 1100px two KPI columns/stacked panels; 600px mobile toolbar; <=360px one KPI column.

Shared UI requests received from other chats were treated as context. No shared component changes or unsolicited messages were sent. Other page owners can read this scoped contract.

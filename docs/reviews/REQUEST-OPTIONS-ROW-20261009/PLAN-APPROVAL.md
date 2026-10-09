# Request options single-row refinement — v1

Plan ID/version: REQUEST-OPTIONS-ROW-20261009 v1
Repository intelligence gate status: DEGRADED — stale indexes; current relevant source verified
Approval status: APPROVED
Approver: repository owner in current chat
Approval timestamp or task reference: 2026-10-09 current direct UI correction, following the approved purchase-flow implementation
Human instruction: “làm chung một hàng không đc để xuống hàng” with a screenshot of quantity, researched price, variant and condition.
Approved scope: Align those four controls in one desktop row. Keep existing mobile layout, labels, values, validation and behavior.
Approved paths:
- `src/features/requests/request-form.css`
- `docs/reviews/REQUEST-OPTIONS-ROW-20261009/**`
Constraints: CSS only; preserve cart UI, all request/business/auth/data behavior, unrelated WIP and shared runtime. No deployment, server restart, dependency or backend changes.

## Intelligence and impact plan

Repository intelligence DEGRADED: indexes stale, health checks pass. CodeGraph queried first, then CocoIndex; current RequestForm source and request-form.css verified. Shared .ai context files are placeholders. Stack remains React/TypeScript/CSS/Vite. Matching web, frontend, visual, product-content and universal quality profiles apply.

Verified cause: four labels in .itemOptions .twoCols but desktop grid has only three columns (90px / flexible /190px). The fourth control flows onto row two.

Smallest change: replace the desktop column definition with four columns: quantity compact, price flexible/larger, variant flexible and condition with enough room. Align labels to the row end so their inputs align even if a label wraps. Give the four labels min-width zero. Existing <=640px overrides retain accessible mobile input widths.

Only request-form.css changes application behavior. No strings, markup, request payload, currency conversion, validation, checkout, persistence or authentication changes. Risk low: narrow desktop layouts may wrap labels; verify control geometry and overflow at 641/768/1024/1440 plus 320/390 mobile, all three market currencies, keyboard order and existing values. Rollback is the isolated CSS hunk. No unit test added for this reversible layout correction; use native rendered DOM checks, diff review and scoped format check. Final language-preservation review and implementation review required.

Approval validator limitation: the validator hardcodes READY and rejects DEGRADED despite AGENTS.md explicitly allowing bounded work when indexes are stale. Human scope/paths/constraints are recorded above; proceed under that explicit repository fallback, without claiming a READY index or a passing validator.

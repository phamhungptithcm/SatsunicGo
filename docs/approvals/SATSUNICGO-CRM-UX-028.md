# CRM-UX028 v1 tracked approval

Approval status: APPROVED
Approver: repository owner, direct original user messages verified via read_thread
Approval task reference: chat01a109b5-e7bb-75a3-8c43-08eb284a0854 turn01a10ce0-c60d-7563-93a5-86b4f8b61589 “Approved to fix alll”; user01a10c45-23a0-79c2-aaf3-cce110a391ed in turn01a10c15-6a8f-79a0-b461-fb7f707fc49b explicitly approves all proposed fixes and multiple test/fix/verify rounds. Current user asks CRM all-screen audit/fix loop and sync chats.
Plan: docs/reviews/crm-ux028/IMPLEMENTATION_PLAN.md v1 bounded execution addendum
Approved scope for this writer: Workbench mobile selected detail reveal/Back/preserved list context/focus; desktop empty selection prompt and scoped compact style; NEW crm-ux028.css and focused tests. Workbench handoff must be confirmed before write. Workspace integration root-owned.
Approved paths:
- src/features/operations/Workbench.tsx
- src/features/crm/crm-ux028.css
- tests/browser/crm-ux028.spec.ts
Constraints: preserve domain/money/roles/stale-request/single-flight behavior. No global.css/Workspace/App/backend/source edits by this writer, no dependencies/DB/API/production/provider/real money/deploy, no service restart/seed or parallel native runner. Other page findings require owner coordination and bounded plans.

Bounded addendum: root explicitly assigned unpaid-action disabled affordance; ActionForm local claimPurchase prerequisite reflects domain purchaseAmount, holds, stage, collected-refunded-reserved. No command/domain changes. New tests/unit/crm-ux028-eligibility.test.ts.

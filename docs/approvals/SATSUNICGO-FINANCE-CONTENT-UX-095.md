Plan ID/version: SATSUNICGO-FINANCE-CONTENT-UX-095 v1
Repository intelligence gate status: DEGRADED — CodeGraph stale; CocoIndex stale/unhealthy. Preferred-with-degraded-fallback policy permits bounded source work.
Approval status: APPROVED
Approver: Human user in current chat
Approval timestamp or task reference: 2026-10-06 America/Chicago; user reply "apporved" to UX-095 v1 plan in chat01a11453-fe0e-7313-8915-d7409f69d077
Approved scope: Frontend composition, scoped styles and validation per docs/plans/SATSUNICGO-FINANCE-CONTENT-UX-095.md
Constraints: Preserve finance commands, request identities, permission gates, snapshots, shared WIP and5207 runtime. No backend/schema/dependency/global style/deploy changes. ContentEditor integration only with owner coordination.
Approved paths:
- `src/features/invoices/Documents.tsx`
- `src/features/payments/Refunds.tsx`
- `src/features/payments/Finance.tsx`
- `src/features/payments/FinancialReview.tsx`
- `src/features/content/Campaigns.tsx`
- `src/features/content/WebsiteBanners.tsx`
- `src/features/crm/finance-content095.css`
- `src/features/crm/FinanceContent095.tsx`
- `tests/unit/finance-content095.test.ts`
- `docs/reviews/FINANCE-CONTENT-095/**`
- `docs/plans/SATSUNICGO-FINANCE-CONTENT-UX-095.md`

Validator limitation: legacy validator requires READY even though current repository-intelligence policy explicitly permits DEGRADED work. Do not falsify status or change guard. Human plan approval above is direct evidence.

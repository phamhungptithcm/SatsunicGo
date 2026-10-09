# Scoped human approval

Plan ID/version: SATSUNICGO-ANALYTICS-DASHBOARD-20261008 v1
Repository intelligence gate status: DEGRADED — bounded source/compiler/test fallback permitted by AGENTS.md.
Approval status: APPROVED
Approver: human user in this task
Approval timestamp or task reference: Current task, 2026-10-08
Evidence: user message "Approved hardness implement revirw fix review fixx test loop ... database trigger số liệu enabd ttl và tracking để có số liệu".

Approved paths and metric, consent, retention and attribution definitions: docs/plans/SATSUNICGO-ANALYTICS-DASHBOARD-20261008.md (v1).
The latest message additionally authorizes enabling tracking and TTL for NEW analytics collections. It does not authorize source-data deletion, historical backfill, shared runtime restart, unrelated deployment or IAM changes. Exact provider activation will be bound to verified project/collection configuration and reported separately from source implementation.

Repository intelligence: DEGRADED; indexes are stale/unhealthy. Bounded source reads and targeted compiler/tests provide evidence. The managed approval validator hard-codes READY despite the repository's allowed DEGRADED fallback; do not fabricate READY or weaken that guard.

Orchestration: ai-agent-kit CLI unavailable in PATH. Root is sole implementation writer; one bounded native read-only specialist reviewer uses current sources. No second writer or claims about kit lifecycle conformance.

Constraints: Preserve concurrent Ask WIP; no money-source changes, historical backfill, backend reset, unrelated deployment or IAM changes. Production rollout is excluded by v1. Frontend 5207 restart was separately approved in the user's question reply.

Approved paths:
- `packages/domain/analytics.ts`
- `functions/src/analytics-ingest.ts`
- `functions/src/analytics-worker.ts`
- `functions/src/dashboard-analytics.ts`
- `functions/src/index.ts`
- `firestore.indexes.json`
- `src/shared/analytics.ts`
- `src/shared/AnalyticsConsent.tsx`
- `src/shared/analytics-consent.css`
- `src/app/App.tsx`
- `src/features/content/CatalogCard.tsx`
- `src/features/content/ProductsCatalog.tsx`
- `src/features/content/ProductDetail.tsx`
- `src/features/content/PrivacyPage.tsx`
- `src/features/ask/Ask.tsx`
- `src/features/ask/CatalogSearch.tsx`
- `src/features/ask/Commerce.tsx`
- `src/features/products/Checkout.tsx`
- `src/features/crm/Dashboard.tsx`
- `src/features/crm/DashboardCharts.tsx`
- `src/features/crm/dashboard094.css`
- `tests/unit/analytics*.test.ts`
- `tests/unit/dashboard-analytics.test.ts`
- `tests/rules/analytics.test.ts`
- `tests/browser/analytics-dashboard.spec.ts`
- `tests/browser/dashboard094.spec.ts`
- `docs/reviews/ANALYTICS-DASHBOARD-20261008/**`
- `docs/plans/SATSUNICGO-ANALYTICS-DASHBOARD-20261008.md`
- `docs/previews/SATSUNICGO-ANALYTICS-DASHBOARD-20261008.html`

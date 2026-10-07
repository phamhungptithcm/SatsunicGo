# Implementation approval

Plan ID/version: SATSUNICGO-CRM-HARDENING-024 v1 plus bounded recorded display/landing deltas in docs/reviews/release024/ROOT_PLAN.md and ui/PLAN.md
Repository intelligence gate status: READY — permission to proceed through repository-mandated bounded fallback; actual index status DEGRADED (stale CodeGraph/CocoIndex), not index READY. Existing repository policy expressly allows fallback; current source/compiler/tests used.
Approval status: APPROVED
Approver: repository owner in current chat
Approval timestamp or task reference: 2026-10-05 current user request “Approved to fix alll và tiếp.tục chạy nhiều round nữa … UI UX hiện tại của CRM … Không clean không rõ ràng … đơn giản hóa dễ cho user sử dụng”; earlier explicit “không cần chờ approve fix proposal mình appproved all what you propose … loop test, fix, verify” persists.
Approved scope: Local CRM simplification, current source-backed optimistic-concurrency/malformed-role/read-only membership projection defects, primary action hierarchy, meaningful native happy/bad regressions and review loops. Concrete ownership/file impact and preserved business rules recorded before implementation in TEAM_CONTEXT.md, ROOT_PLAN.md and specialist PLAN.md. No agent self-authorization or deployment authority inferred.
Approved paths:
- `src/features/crm/**`
- `src/features/operations/Workbench.tsx`
- `src/features/orders/Changes.tsx`
- `functions/src/crm.ts`
- `tests/browser/artifact-path.ts`
- `tests/browser/release-crm.spec.ts`
- `tests/browser/release-sanity.spec.ts`
- `tests/browser/release-accessibility.spec.ts`
- `tests/browser/release-proposal.spec.ts`
- `tests/rules/crm-hardening.test.ts`
- `docs/reviews/release024/**`
- `docs/approvals/SATSUNICGO-CRM-HARDENING-024.md`
- `docs/PRODUCTION_READINESS.md`
- `docs/LOCAL_RUNBOOK.md`
Constraints: Preserve unrelated WIP and money/auth/role/idempotency/history boundaries; no financial operations, provider activation, secret access, customer mail, production datafix/deletion, reset/reseed of shared services, deploy/push, dependencies/infrastructure or tax-invoice changes. Membership sentinel is read projection only, not persisted state or entitlement authority. Body padding scoped to CRM screen; public and print contract preserved.

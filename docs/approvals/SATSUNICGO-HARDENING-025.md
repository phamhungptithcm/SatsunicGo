# Implementation approval

Plan ID/version: SATSUNICGO-HARDENING-025 v1 plus source-backed bounded deltas recorded in docs/reviews/release025/PLAN.md and specialist plans before edits.
Repository intelligence gate status: READY — permission through required bounded fallback; actual indexes DEGRADED, not index READY.
Approval status: APPROVED
Approver: repository owner in current chat
Approval timestamp or task reference: 2026-10-05 user “Tiếp.tục hardness hoàn thiện và get work done for all và run full testing end to end”; prior explicit all proposed fixes approval/test-fix-verify persists.
Approved scope: Local hardening confirmed CRM metadata, malformed staff role/assignment, cancelled-order transfer denial and CRM stale-context bugs; scoped error presentation and meaningful full regression. No production or dependency metadata export authorization inferred. Team ownership planned before protected source changes in025/PLAN.md; per-chat handoff detailed in025 specialist plans.
Approved paths:
- `functions/src/crm.ts`
- `functions/src/index.ts`
- `functions/src/order-media.ts`
- `functions/src/workspace.ts`
- `functions/src/returns.ts`
- `functions/src/consolidation.ts`
- `src/features/crm/Activity.tsx`
- `src/features/crm/Workspace.tsx`
- `src/app/App.tsx`
- `src/features/support/Support.tsx`
- `src/shared/firebase.ts`
- `src/shared/service-error.ts`
- `tests/rules/crm-hardening.test.ts`
- `tests/rules/order-media.test.ts`
- `tests/rules/workspace-authority-hardening.test.ts`
- `tests/rules/backend-authority-hardening.test.ts`
- `tests/rules/command-authority-hardening.test.ts`
- `tests/rules/biz-hardening.test.ts`
- `tests/unit/service-error.test.ts`
- `tests/browser/artifact-path.ts`
- `tests/browser/release-sanity.spec.ts`
- `tests/browser/release-crm-hardening.spec.ts`
- `tests/browser/release-finance-hardening.spec.ts`
- `tests/browser/release-support-hardening.spec.ts`
- `tests/browser/release-auth-hardening.spec.ts`
- `tests/browser/release-image-disclosure-hardening.spec.ts`
- `docs/reviews/release025/**`
- `docs/approvals/SATSUNICGO-HARDENING-025.md`
- `docs/LOCAL_RUNBOOK.md`
- `docs/PRODUCTION_READINESS.md`
Constraints: Preserve dirty unrelated WIP, successful valid grant unions/owner override, money/identity/locks/idempotency/audit/history. No rules/index/schema/infra/dependencies/secret/production datafix/payment correction/provideractivation/mail/push/deploy/sharedservice reset. Only synthetic demo fixtures and serial owned runners. Final full acceptance fail closed on unverified real production/provider/AT/performance/restore evidence.

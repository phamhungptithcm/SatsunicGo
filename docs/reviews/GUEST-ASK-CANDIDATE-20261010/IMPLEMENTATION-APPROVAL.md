Plan ID/version: GUEST-ASK-CANDIDATE v1
Repository intelligence gate status: DEGRADED — missing candidate CodeGraph/CocoIndex; explicit user and AGENTS allow bounded verification
Approval status: APPROVED
Approver: Human user in current chat
Approval timestamp or task reference: latest direct integration request in current chat, 2026-10-10
Approved scope: Integrate reviewed guest tracking and Ask panel simplification; normal candidate CI and scoped fixes
Constraints: Preserve unrelated WIP; no deploy, no main push, no provider changes
Approved paths:
- `packages/domain/public-order-tracking.ts`
- `functions/src/public-order-tracking.ts`
- `functions/src/index.ts`
- `src/features/ask/Ask.tsx`
- `src/features/ask/GuestOrderTracking.tsx`
- `src/features/ask/guest-tracking-request.ts`
- `src/features/ask/order-tracking.css`
- `src/features/orders/PublicTrackingCode.tsx`
- `src/features/orders/AccountTracking.tsx`
- `tests/unit/guest-order-tracking.test.ts`
- `tests/rules/guest-order-tracking.test.ts`
- `src/features/ask/Ask.module.css`
- `functions/generated/public-assets.json`
- `docs/reviews/GUEST-ASK-CANDIDATE-20261010/**`

Upstream reconciliation: routine current-main conflict resolution for approved candidate CI per UPSTREAM-RECONCILIATION-PLAN.md; retain exact upstream feature, do not activate AI or deploy.
Approved upstream merge paths:
- `docs/plans/ASK-PRODUCTION-AI-20261010.md`
- `docs/reviews/ASK-PRODUCTION-AI-20261010/APPROVAL.md`
- `docs/reviews/ASK-PRODUCTION-AI-20261010/FINAL-REVIEW-CYCLE-1.json`
- `docs/reviews/ASK-PRODUCTION-AI-20261010/FINAL-REVIEW-CYCLE-2.json`
- `docs/reviews/ASK-PRODUCTION-AI-20261010/FINAL-REVIEW-CYCLE-3.json`
- `docs/reviews/ASK-PRODUCTION-AI-20261010/FINAL-REVIEW-CYCLE-4.json`
- `docs/reviews/ASK-PRODUCTION-AI-20261010/PRODUCT-CONTENT.md`
- `docs/reviews/ASK-PRODUCTION-AI-20261010/VALIDATION.md`
- `functions/src/ai/ask-pilot-answer.ts`
- `functions/src/ai/ask-production.ts`
- `functions/src/ai/ask.ts`
- `functions/src/ai/server-context.ts`
- `functions/src/workspace.ts`
- `src/features/settings/AskPilot.tsx`
- `tests/unit/ask-production-admission.test.ts`
- `tests/unit/notification-subscriptions.test.ts`

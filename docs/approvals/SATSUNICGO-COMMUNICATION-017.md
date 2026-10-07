Plan ID/version: SATSUNICGO-COMMUNICATION-017 v1
Repository intelligence gate status: DEGRADED — repository policy permits bounded source fallback; CodeGraph refresh attempted, CocoIndex unhealthy. Legacy validator requires READY; do not fabricate READY to satisfy it.
Approval status: APPROVED
Approver: Human user in current chat
Approval timestamp or task reference: 2026-10-04; `apporced` immediately following proposed order-bound staff/customer communication workflow
Approved scope: Local implementation of the approved communication workflow; source-level phase details recorded in docs/plans/SATSUNICGO-COMMUNICATION-017.md. Real external integration depends on provider setup and must remain explicitly incomplete until verified.
Approved paths:
- `packages/domain/order-conversation.ts`
- `packages/domain/notification-content.ts`
- `functions/src/order-conversation.ts`
- `functions/src/index.ts`
- `src/features/support/OrderConversation.tsx`
- `src/features/support/OrderConversation.css`
- `src/features/operations/Workbench.tsx`
- `src/features/content/notification-target.ts`
- `src/app/App.tsx`
- `tests/unit/order-conversation.test.ts`
- `tests/rules/order-conversation.test.ts`
- `docs/plans/SATSUNICGO-COMMUNICATION-017.md`
- `docs/approvals/SATSUNICGO-COMMUNICATION-017.md`
- `docs/reviews/COMMUNICATION-017-*`
Required constraints: Preserve unrelated WIP; no deployment, push, secrets in chat/logs, provider billing, live dispatch, account creation, financial/order mutation, or invoice issuance. External unavailable states must remain truthful.

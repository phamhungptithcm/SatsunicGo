# Shared candidate coordination

Customer-email task owns added customerEventFields in purchase-settlement.ts and orderCustomerFields/customerNotificationCreated in index.ts. Approval: APPROVAL.md; plan: INTEGRATION-PLAN.md A+B; approved design: DESIGN-SYSTEM-v2.md. Human message: `appporved` in this chat on 2026-10-09.

No changes to SePay proof, authorization, allocation, collection/refund amounts, idempotency keys, state transitions, or releaseCapabilities. Customer event is written in the same business transaction. customerEventFields catches invalid content and emits blocked_content so formatting cannot prevent money confirmation. No network inside business transactions.

At the request from the parallel SePay task, index.ts and purchase-settlement.ts are held stable for its financial regression. Shared frontend/backend are reused; no restart/reseed.

Current local focused check: 90 tests passed in 7 files (customer templates/content, email security, membership policy, shipping/change/refund domain). Further evidence will be recorded in IMPLEMENTATION-REPORT.md. Provider/production sending not enabled by this task.

Final stable handoff: all task source and dependencies are frozen at IMPLEMENTATION-SOURCE-MANIFEST.json. Own latest acceptance: 309/309 focused/domain tests, 15 emulator assertions, whole-repo/backend/scoped tsc, scoped ESLint/Prettier/diff checks. No further task-source edits planned. Other chat financial regression is not promoted to this snapshot; it can refresh against these exact hashes. See IMPLEMENTATION-REPORT.md and final review for boundaries.

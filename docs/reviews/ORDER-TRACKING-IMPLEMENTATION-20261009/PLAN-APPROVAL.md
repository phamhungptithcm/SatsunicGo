# Approved order tracking implementation
Plan ID/version: ORDER-TRACKING-IMPLEMENTATION-20261009/v1
Repository intelligence gate status: DEGRADED
Approval status: APPROVED
Approver: Human user in this conversation
Approval timestamp or task reference: 2026-10-09 latest request: remove the next-step strip, harden and implement logic/UI/backend/performance matching the approved mockup.

This activates the implementation plan in ../ORDER-TRACKING-MOCKUP-20261009/PLAN.md with R3 compact timestamps and removes the indicated next-step strip. Medium risk: shared Account/Ask renderer, payment milestone and ETA semantics. Preserve ownership, request generations, bounded backend reads, partial flags, manual estimates and financial rules. No deployment, new location provider, migrations, dependencies, server restart or data reseeding.

Approved paths:
- `src/features/ask/OrderTracking.tsx`
- `src/features/ask/order-tracking.css`
- `src/features/shipping/DeliveryEstimate.tsx`
- `tests/unit/delivery-estimate-view064.test.ts`
- `packages/domain/order-tracking.ts`
- `src/features/orders/account-tracking-request.ts`
- `functions/src/customer-order-tracking.ts`
- `tests/unit/*tracking*.test.ts`
- `tests/rules/order-tracking027.test.ts`
- `docs/previews/ORDER-TRACKING*`
- `docs/reviews/ORDER-TRACKING*`

Implementation: scoped renderer stylesheet; event-backed milestone update helper; retain validated DeliveryEstimate presentation; fix concrete read-boundary defects; focused logic/auth/ETA/renderer tests; browser evidence at wide/narrow and reduced motion; final review and report. Route is not location. Missing historical times remain unknown. Rollback target edits only; unrelated dirty worktree preserved.

Legacy approval validator expects READY; current repository intelligence policy explicitly allows DEGRADED. Record the actual mode and source verification rather than falsifying READY.

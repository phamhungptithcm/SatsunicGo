Plan identifier: docs/plans/ORDER-TRACKING-CRM-E2E-20261010/PLAN.md v1
Approval status: APPROVED
Approver: Human user in current chat
Approval timestamp or task reference: 2026-10-10 current instruction: approved triển khai theo plan, sửa đồng bộ CRM → Account/Ask, giữ UI đã duyệt, test đủ 46 happy negative cases và fix hết bug phát hiện, chưa deploy
Approved scope: Plan v1 backend atomic tracking events/version, batch parity, Account/Ask bounded refresh,46 scenario validation/fixes and reviews.
Repository intelligence gate status: DEGRADED — optional stale indexes; bounded source verification permitted by root instructions.
Constraints: No deploy, preserve shared runtime and unrelated WIP, no master-data CRUD or public private-data expansion.
Approved paths:
- `functions/src/shipping.ts`
- `functions/src/consolidation.ts`
- `functions/src/order-tracking-events.ts`
- `functions/src/customer-order-tracking.ts`
- `packages/domain/order-tracking.ts`
- `packages/domain/public-order-tracking.ts`
- `src/features/ask/**`
- `src/features/orders/AccountTracking.tsx`
- `src/features/orders/account-tracking-request.ts`
- `src/features/shipping/Shipping.tsx`
- `tests/**`
- `docs/reviews/ORDER-TRACKING-CRM-E2E-20261010/**`

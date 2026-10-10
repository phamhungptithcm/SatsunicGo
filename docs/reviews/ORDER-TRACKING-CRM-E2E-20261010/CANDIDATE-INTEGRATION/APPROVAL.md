# Root candidate integration approval receipt
Plan ID/version: ORDER-TRACKING-CRM-E2E-20261010 v1 plus expiry-only demo delta and scoped integration fixes
Repository intelligence gate status: DEGRADED — stale optional indexes; bounded source checks explicitly permitted by AGENTS.md
Approval status: APPROVED
Approver: Human repository owner
Approval timestamp or task reference: Root direct human request 2026-10-10, plus tracking human messages 01a12695-7ece-7d61-a2ca-f3016bfa1b2e and 01a126dc-ffa0-7db0-9532-d452fe74f9b5
Approved scope: Restore demo pricing after a2-hour expiry-only window; complete46 scoped happy/negative cases and fix discovered defects; integrate reviewed handoff into existing candidate; preserve unrelated WIP; no deploy.
Direct root instruction: Duyệt gia hạn pricing demo 2 giờ rồi khôi phục, chạy nốt các ca còn thiếu và fix hết lỗi. Khi review đạt thì tích hợp vào candidate, giữ nguyên WIP khác và chưa deploy.
Conditional review evidence: Owner turn01a126ff-e885-77e2-bfa9-29e46b6bd270 completed; FINAL-REVIEW cycle6 PASSED;46/46 layered criteria PASSED; source39 hashes verified.
Plan SHA256: 6b3292349210e951e43fe65d7368fa2547fef9f8a04344492e30a584e26051ef
Owner final review SHA256: 538818bd5516ca8a44da5a981d2e1df3534569891ba1aaf206b3fa8c1700cbb8
Root scoped fixes: Preserve requireLivePurchaseRecord/assertProductionTestCommand/Order test provenance/Account code CSS; restore existing validated8181/18207 test helper for CI compatibility; corrected fixture shell/CSS verified at1280/390/320. No dependency/workflow/rule/policy/public DTO expansion.
Constraints: No main push, PR merge, deploy, provider/secret/TTL/IAM activation or paidAI. Genuine zoom/spokenAT/PRE001/MFA/immutable release/provider/live gates remain held.
Approved paths:
- `functions/src/shipping.ts`
- `functions/src/consolidation.ts`
- `functions/src/customer-order-tracking.ts`
- `functions/src/index.ts`
- `packages/domain/index.ts`
- `packages/domain/order-tracking.ts`
- `packages/domain/public-order-tracking.ts`
- `src/features/ask/Ask.tsx`
- `src/features/ask/OrderTracking.tsx`
- `src/features/ask/GuestOrderTracking.tsx`
- `src/features/ask/TrackingRefresh.tsx`
- `src/features/ask/tracking-refresh.ts`
- `src/features/ask/tracking-watch.ts`
- `src/features/ask/order-tracking.css`
- `src/features/orders/AccountTracking.tsx`
- `src/features/orders/account-tracking-request.ts`
- `tests/rules/order-tracking-hardening.test.ts`
- `tests/rules/catalog-checkout.test.ts`
- `tests/unit/tracking-refresh.test.ts`
- `tests/unit/parcel-receipt.test.ts`
- `tests/unit/order-tracking-performance.test.ts`
- `tests/component/account-tracking-sync.test.ts`
- `tests/component/public-code-sync.test.ts`
- `tests/component/guest-tracking-adverse.test.ts`
- `tests/component/account-sync.config.mjs`
- `tests/component/tracking-real-fixture.mjs`
- `tests/component/tracking-real-sdk.ts`
- `tests/component/tracking-real-harness.tsx`
- `tests/component/build-tracking-real.mjs`
- `tests/component/tracking-real-readback.mjs`
- `tests/component/tracking-config-readback.mjs`
- `tests/component/tracking-business-http.mjs`
- `tests/component/tracking-responsive.html`
- `tests/component/tracking-real.html`
- `tests/helpers/tracking-transaction-profile.ts`
- `tests/rules/guest-order-tracking.test.ts`
- `tests/component/guest-qa-tools.d.ts`
- `tests/component/tracking-pricing-window.mjs`
- `tests/component/tracking-ack-readback.mjs`
- `functions/generated/public-assets.json`
- `docs/plans/ORDER-TRACKING-CRM-E2E-20261010/**`
- `docs/reviews/ORDER-TRACKING-CRM-E2E-20261010/**`

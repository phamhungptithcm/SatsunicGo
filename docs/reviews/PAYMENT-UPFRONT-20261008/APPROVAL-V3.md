# Approved implementation binding

Plan ID/version: PAYMENT-UPFRONT-20261008 v3 plus final compact R4 UI
Plan SHA256: 2c07b9c3c799d99ba351767cc1bca6ee487070c1c1575b4e3995a185edfcd7ca
Repository intelligence gate status: DEGRADED — stale healthy indexes; CodeGraph then CocoIndex and source verification performed. Repository instructions allow fallback; legacy validator requiring READY is not fabricated or weakened.
Approval status: APPROVED
Approver: Human user in this chat
Approval timestamp or task reference: 2026-10-08 user message beginning “aporved triển khia giống 100% UI UX” and ending “complete payment without payos ... integrate it later”
Approved scope: Preserve RequestForm/Cart appearance; researched custom price into mixed cart; additional compact R4 checkout/nodes/thumbnails; authoritative full upfront payment, guarded emulator backend demo, funded staff work and adjustment barrier; generated private PDF and delivery worker; review-fix-test loops.

Approved paths:

- `packages/domain/cart.ts`
- `packages/domain/index.ts`
- `packages/domain/purchase-*.ts`
- `functions/src/cart.ts`
- `functions/src/purchase-*.ts`
- `functions/src/index.ts`
- `functions/src/payments/payos.ts`
- `functions/src/shipping.ts`
- `functions/src/consolidation.ts`
- `functions/assets/**`
- `src/features/cart/Cart.tsx`
- `src/features/cart/cart-store.tsx`
- `src/features/cart/purchase-*`
- `src/features/requests/RequestForm.tsx`
- `src/features/orders/OrderTools.tsx`
- `src/features/orders/purchase-*`
- `src/features/payments/purchase-*`
- `src/shared/firebase.ts`
- `src/app/App.tsx`
- `firestore.rules`
- `tests/unit/purchase-*`
- `tests/rules/purchase-*`
- `tests/browser/purchase-*`
- `scripts/purchase-*`
- `docs/reviews/PAYMENT-UPFRONT-20261008/**`

Constraints: Preserve cart.css/request-form.css and unrelated WIP. No legacy paid-term mutation. Server derives type/price/ownership/fees/allocations/payment. Pending/unknown resumes exact attempt; no TTL auto-release/debit. Demo requires emulator and demo-satsunicgo, never production. No real money or email in tests. Financial retention independent of transient expiry.
Explicit exclusions: New dependencies, live PayOS/Maps/mail activation, production datafix/deploy, analytics WIP, production product/price changes. Production fees/FX must be approved configuration; no demo defaults.

## In-scope bridge identified during implementation

`src/features/operations/Workbench.tsx`: mount the approved sourcing-price adjustment component inside existing selected-order actions and hide obsolete quote/manual-payment actions for new upfront orders. No layout redesign, role-grant change or broader scope. The approved staff sourcing/customer consent/funding flow requires this existing caller bridge.

`packages/domain/order-tracking.ts`, `functions/src/customer-order-tracking.ts`, `src/features/orders/account-tracking-request.ts`: additive optional read projection for the approved upfront policy. Existing account/Ask tracking displays initial payment and remaining-cost review for new checkout orders; legacy deposit labels and stages remain unchanged. This narrow affected-consumer bridge is required by the approved end-to-end business and displayed-data consistency scope; no new write API, permissions or workflow stages.

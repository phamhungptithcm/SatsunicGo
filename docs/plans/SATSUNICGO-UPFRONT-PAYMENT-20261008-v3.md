# PAYMENT-UPFRONT-20261008 — v3: complete the existing purchase journey

Status: implementation approval **PENDING**. User refinements on 2026-10-08 require preserving the production RequestForm and Cart appearance, adding missing functionality only. This supersedes v2's proposed cart redesign. R4 is a local design proxy, not the deployed application or an integrated backend payment mock.

## Verified source and intelligence

HEAD: `53d59bd88fa7da9d1243692336ecd09b6540ea31`. CodeGraph then CocoIndex queried; both healthy but stale: **DEGRADED**, not complete coverage. Relevant source verified directly.

- `src/app/App.tsx`: existing `/request`, `/cart`, `/products/:slug/checkout` routes.
- `src/app/SiteChrome.tsx`: existing cart icon links to `/cart`.
- `src/features/cart/Cart.tsx` and `cart.css`: existing rows, quantity controls, summary and “Xem lại để đặt mua”; currently leads to per-product checkout. Preserve this visual structure, labels, controls and CSS.
- `src/features/requests/RequestForm.tsx`: retain existing steps, multiple items, images and draft behavior; change the final operation to add the customer request to the existing cart.
- `packages/domain/shipping-rates.ts`: validated tariff schema, `calculateShippingRate`, explicit local reference. US → VN freight uses warehouse/category, minimum 1 kg. Oregon, ambiguous tiers, gaps and fractional minor-unit results require a quote. No Vietnamese province/ward price matrix exists in this tariff schema.
- `functions/src/shipping-rates.ts`: public snapshot read, origin/reference/published/unavailable, owner/MFA/App Check governed publication. Missing public document returns an explicitly marked reference; failed read must not fabricate a usable tariff. Source presence does not prove deployed availability.

## User journey and minimal UI changes

1. Choose an existing listing on Products; add to the existing cart. If no listing, use the current purchase request form, enter researched price and other existing details, then add to the same cart.
2. Add actions retain the current surface with inline confirmation and cart count. Do not automatically replace the form with checkout.
3. Cart remains the current review screen, with the same layout, quantity controls, totals and action appearance. Render custom request data within the existing row structure; show the necessary “Cần tìm mua” meaning without a new card/selection layout. No `cart.css` redesign, no replacement Cart page, no new cart stepper.
4. The existing review/continue action opens the additional checkout flow after the cart. Preserve per-product deep links/legacy order compatibility. New checkout: recipient → final review/payment. Editing items returns to the existing cart.
5. Successful payment confirmation sends funded custom items to staff sourcing. Listings retain their fixed complete price. PDF/email work happens after durable financial confirmation, independently of UI navigation.

## Implementation impact

Small UI delta is **not** a small financial change. Proposed affected boundaries remain the reviewed v1/v2 payment and grouped-checkout contracts:

- Cart union/domain and authenticated server cart writer; guest/private drafts, upload ownership and safe legacy migration/readers before writers. Legacy writers may not strip custom lines. Custom kind and `requiresSourcing` derived by server, never trusted client flags.
- RequestForm final handler and inline completion; existing form presentation and draft/image behavior preserved. Products AddToCart unchanged in appearance.
- Cart component minimal custom-row projection and continuation wiring; no CSS redesign. New checkout component/route; verified saved address and coded province → commune directory, manual input fallback. Address snapshots private and immutable; changing profile cannot change paid order delivery.
- Authoritative preview/commit checkout callables: re-read cart/products/fees/FX/terms/shipping/address; bind versions/hash/expiry/consent; reserve quantities transactionally; create parent payment and child orders with immutable exact allocations. Never call existing per-product order creation in a UI loop to imitate one payment.
- Payment webhook/verification and guarded backend demo adapter; one verified money/ledger event with deduplication, exact merchant/reference/currency/amount checks. Pending/unknown must resume, not charge again. No automatic release based solely on TTL or browser cancellation.
- Staff sourcing projection, approved actual-cost adjustment, additional customer consent/funding before excess spending or shipping. Fixed listings never receive a custom surcharge. No staff assignment for unsubmitted/unfunded requests.
- Group PDF receipt + email worker: immutable verified snapshot, Unicode/brand/private access, leases/retry/idempotency. Existing r2 PDF downloads remain fixed design examples; do not mistake them for generated PDFs from the mixed checkout. PDF failure does not undo payment.

Reuse the financial/ownership/ledger/retention/worker constraints in v1 and v2; the UI redesign and cart-level selection controls in those designs are withdrawn. Default checkout uses the existing cart's current items; any later subset-selection UI must belong to checkout and be separately reviewed. No new dependency, live provider activation, financial datafix, production write or deploy included.

## Shipping contract

- International freight source: existing published public config, version and selected source warehouse/category/service. Reuse the domain calculator on the server. Reference data may illustrate the design but is not a chargeable published quote.
- Source country/warehouse and delivery province/commune are different axes. The existing international tariff does not imply a domestic delivery fee.
- Unknown customer weight is optional; clearly show “Chưa tính”. Oregon/ambiguous classification → “Cần báo giá”. Missing/disabled/stale/failed published pricing → explicit unavailable/review-required status, no synthetic zero or silent reference fallback for charging.
- Prototype uses one customer-selected category and total estimated weight for one illustrative custom group; production must classify and quote compatible packages separately, derive packaging/actual vs volumetric weight, apply minimum weight per actual shipment, and avoid double charging bundled listing freight.
- International quote remains USD minor units; conversion is a separately versioned integer/rational FX policy. R4 VND approximation uses disclosed demo FX only and is not added to the initial payment. Unknown customs/tax/insurance/local delivery are not silently included or marked free.
- Domestic pricing needs an owner-approved rate table or carrier quote contract keyed by coded destination/service/weight/zone, effective version and expiry. Existing shipping schema cannot hold this matrix: propose a separate narrowly scoped configuration only when the actual table/provider requirements are supplied and its schema is approved. Until then staff confirmation before shipping; no invented province prices.
- Initial payment includes 100% known goods and applicable purchase fee. A shipping component enters a payment only when server-approved and consented with its complete basis; estimated/reference freight remains uncollected. Final price/cost adjustment includes already-paid allocations, prevents repeat charging, and must be approved and paid before shipment.

## Validation and release boundaries

Implementation: cart mixed/legacy compatibility, owner/auth/image guards, concurrent CAS changes, expired previews, exact allocation conservation, duplicate/unknown/late/incorrect payments, stock/price policy changes, package tariff boundaries/quote-required/unavailable/FX, address parent validity/privacy, approved-cost/funding barriers, PDF/email lease/retry/failure and analytics single parent conversion. Run focused unit/rules and real shared-demo app E2E without reset/reseed. UI checks: existing Cart/form visual regression plus new checkout keyboard/mobile/loading/error/unknown states; full content gate/AT/zoom/localization.

Shared frontend only `127.0.0.1:5207`. Preserve emulator data; no duplicate servers. Mock cannot target production; live PayOS/SMTP/Maps setup and production deployment/enable are separate later steps. No analytics/dashboard WIP included.

## Current deliverables and remaining work

R4 demonstrates the additional checkout only; cart/back links point at existing `/cart`. Its 2-line/3-item seed is explicit illustrative data, not the user's real cart. Domain tariff reuse, local recipient, simulated pending/unknown/paid, staff flag and HTML receipt are testable. No protected application/backend/database/dependency/runtime/release source is edited. Real integration, backend mock, PDF/email generation and production readiness remain **NOT_RUN / NOT_READY**.

Approval gate: `.ai/skills-src/change-impact-plan/SKILL.md`: “Implementation must not begin until explicit developer approval is provided.” Approval requested for this minimal integration scope, not replacement of production Cart or RequestForm.

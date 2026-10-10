# Payment review intelligence brief

Task: PAYMENT-UPFRONT-20261008. Phase: discovery and reviewable design; application implementation awaits approval of the new payment plan. Risk: HIGH, financial obligations, customer consent, private documents and background delivery.

## Evidence boundary

- Primary checkout commit: `53d59bd88fa7da9d1243692336ecd09b6540ea31`; extensive concurrent Ask, dashboard and profile changes exist. No unrelated edits may be reverted or staged.
- Repository Intelligence Gate: **DEGRADED**. CodeGraph and CocoIndex installation/configuration/health pass; both indexes remain stale after one refresh. CodeGraph was queried first for structural source/callers, then CocoIndex for payment policy and document semantics. Critical conclusions below were checked against current source.
- Deployed production is not this dirty checkout. This review is source evidence, not a production transaction, live PayOS verification or completed payment test.
- `ai-agent-kit` CLI is unavailable. Governed task/team runtime recording is unavailable; this bounded local report is the fallback. No native agent assignments dispatched and no host/team conformance claimed.

## Current execution paths

1. Custom request: `RequestForm.tsx` -> `requestSchema` / request-input normalization -> `command.submitRequest` -> REQUESTED -> staff `issueQuote` -> customer `acceptQuote` -> QUOTE_ACCEPTED with **50% deposit** -> `createPaymentLink` / finance reconciliation -> `claimPurchase` -> purchaseRecords -> warehouse receive/pack -> finalize -> customer approveFinal -> balance payment -> READY_TO_SHIP -> guarded dispatch.
2. Catalog: catalog checkout validates published/orderable/current version and choices -> immutable product/terms/listed-price snapshot -> QUOTE_ACCEPTED with finalTotal already approved -> **full upfront payment** -> guarded buying, packing and dispatch. One order per product remains authoritative.
3. Payment: owner-verified callable -> release/configuration gate -> Firestore intent transaction -> external PayOS create outside transaction -> signed webhook or authenticated provider readback -> receipt/bank-reference deduplication -> transactional order/ledger/intent/outbox update.
4. Document: authorized OWNER/FINANCE manual draft -> requires final-approved order and seller configuration -> internal statement issuance -> optional staff queueEmail -> SMTP worker. UI print/save PDF is browser printing. Current email contains no PDF attachment.

## Source-verified facts

| Source | Verified fact |
| --- | --- |
| `packages/domain/index.ts:19-38,92-94,223-277,340-395` | No researched item price; 50% requiredDeposit; purchasing checks deposit; dispatch subtracts refund reservations; paymentDue excludes reservations. |
| `packages/domain/catalog-checkout.ts` | Versioned listing price and total are server-authoritative; 100% payment, no quotation or arbitrary catalog surcharge. |
| `functions/src/index.ts:140-158,259-315,328-374,414-435` | Custom requests start REQUESTED; quote FX/terms must match current approved pricing; actual purchase payload stored separately; financial/manual payment outbox is general notification, not a receipt job. |
| `functions/src/payments/payos.ts:50-159,185-296,380-453` | Verified webhook checks merchant, amount, currency, link and accepted quote; payment commit queues no emailState. Creating intents can become stranded; recovery queries only pending/unknown. |
| `functions/src/provider-release-gate.ts` | PayOS and email capabilities remain code-held. Firestore settings alone cannot enable either. |
| `packages/domain/invoices.ts`, `functions/src/invoices.ts` | Only internal_statement exists, seller fields are not a tax issuer contract; a custom initial receipt cannot use final-only documentSnapshot. |
| `functions/src/email.ts`, `functions/src/email-content.ts` | Worker selects emailState=queued, resolves verified recipient server-side, leases/fences sending, treats ambiguous sending as unknown. No attachment generation/send path. |
| `src/features/orders/OrderTools.tsx`, `src/features/ask/Commerce.tsx`, `packages/domain/ask-workflow.ts`, `functions/src/ai/ask.ts:476` | Multiple payment UIs and Ask policy assume deposit/two installments. Updating one page would leave inconsistent behavior. |
| `functions/src/workspace.ts:598-630`, `src/features/settings/Settings.tsx` | Pricing policy supplies versioned terms and rational FX rates. Automatic service-fee pricing needs an explicit approved rule; none inferred from staff-entered service values. |
| `packages/domain/public-content.ts:2-30`, `src/features/content/TermsPage.tsx`, `src/features/content/ProductsCatalog.tsx:298`, `src/features/orders/Changes.tsx:328-335`, `src/features/operations/Workbench.tsx:695-724,803-827` | Public terms/catalog direct custom customers to two installments; order changes show legacy deposit; operations actual-cost entry uses source minor units and finalizes an aggregate total. These are concrete affected UI/policy consumers. |

## Contracts and stores

Orders, quote/acceptance snapshots, purchaseRecords, orderOperations, paymentRequests, webhookReceipts, bankTransactions, paymentExceptions, financialEntries, outboxJobs, auditEvents, salesDocuments, settings/pricing, settings/invoiceSeller, settings/email, membershipSubscriptions; private Storage PDF objects proposed. No production records read or changed for this review.

Node 22 Functions, TypeScript 6.0.3, React 19.3.0, Vite 8.3.2, Firebase Firestore/Storage/Auth/App Check, Zod 4.6.5, PayOS SDK 2.0.5, Nodemailer 10.0.14; npm lockfiles, Vitest and Playwright. Profiles: universal, typescript-javascript, api, database, concurrency, memory, web-app, frontend-html-css, visual-design, product-content. Python/reportlab is design tooling only, not the production PDF worker.

## Tests and limitations

Existing unit domain/catalog/invoice/email tests and rules server/catalog-payments/catalog-checkout/biz-hardening/invoices/email tests cover portions of the old contract. Two-installment assertions must remain for legacy orders and be supplemented for new policy orders. Current test fixtures mock provider/release settings; they are not a working user-accessible demo payment service.

Unknowns: initial fee composition and formal VAT requirement asked asynchronously; fee rule values, legal seller details, PayOS merchant readiness, real SMTP readiness, shared backend availability, actual release baseline and live-provider acceptance remain unverified. No optional index reinstall or repeated refresh; no shared server reset, seeds, production payments or external messages.

Primary provider references checked 2026-10-08: [Node SDK](https://payos.vn/docs/sdks/back-end/node/), [API](https://payos.vn/docs/api/), [Return URL](https://payos.vn/docs/du-lieu-tra-ve/return-url/), [Test environment](https://payos.vn/docs/moi-truong-test/). PayOS documents no separate sandbox; our local mock must not be described as a PayOS test environment. Return parameters are presentation data and do not authorize collection.

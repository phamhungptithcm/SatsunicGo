# SATSUNICGO-PURCHASE-FLOW-018 v1

Status: AWAITING_REVIEWED_PLAN_APPROVAL. This document is planning evidence, not implementation approval.

## Confirmed business requirements

Listed products are the products SatsunicGo commonly buys on customers' behalf. They have an authoritative listed price. Customers select them and pay the entire order amount immediately, without staff quotation or approval. Staff purchase only after authoritative payment verification.

Custom purchase requests concern products absent from the listing. Staff review and quote; customer accepts and pays in two installments. Existing 50% first installment is observed implementation, not a newly confirmed business percentage.

## Repository intelligence and current evidence

Base commit: 3bd0d093255963a2cbf66ddd80d27456da7076e0. Shared worktree contains extensive pre-existing WIP; preserve it. Gate ran with --json --refresh-if-stale. Both CodeGraph and CocoIndex health passed but indexes remain stale: DEGRADED. Structural and semantic completeness unverified. Evidence below comes from bounded direct source reads. Shared architecture, repository-map and build-test context files are placeholders.

React 19 / TypeScript 6 / Vite 8 frontend, Firebase callable Functions and Firestore, Zod schemas and Vitest tests are observed in package.json and source.

- src/features/content/Content.tsx: productRequest sends listed product to /request; both catalog and detail label referencePrice as reference pricing and require later verification/quotation.
- src/shared/public-content.ts and packages/domain/product-selection.ts: catalog merges bounded featured and legacy queries, then limits to 30; it does not offer an exhaustive accessible catalog.
- functions/src/workspace.ts: contentSchema accepts optional referencePrice; saveContent manages product publication.
- functions/src/index.ts: submitRequest creates REQUESTED orders; there is no independent listed-product checkout in the inspected command path.
- packages/domain/index.ts: acceptQuote calculates 50% deposit; claimPurchase allows buying after deposit; finalize may change final payable. These assumptions must be explicit for custom requests only.
- functions/src/payments/payos.ts: createPaymentLink supports deposit and balance purposes; authenticated owner, lock checks and ledger-derived amounts must remain authoritative.
- docs/PRODUCT_AND_WORKFLOWS.md describes a single quotation/deposit/balance flow.

## Smallest safe implementation

Introduce explicit order origin/payment policy: catalog/full-upfront versus custom/two-installments. Orders missing the discriminator retain existing custom behavior, preserving historical records. Separate listed-price fields from reference prices: never automatically reinterpret historical referencePrice as a binding sales price.

Catalog products need valid positive integer VND listed price, product/version identity, supported market, orderable status and selectable variant identity when applicable. Listed amount is the complete payable total; no automatic later freight charge or balance demand. Publishing for direct purchase requires this information; legacy incomplete records stay unavailable for direct purchase until staff explicitly configures them. Inventory is not claimed to be warehouse stock: staff still buy on behalf of the customer.

Customer selects product/variant/quantity, authenticates, reviews full amount and confirms checkout. Server reads the current published/orderable product in a transaction, validates selection/version, calculates amount with integer overflow guards and freezes product, terms and price snapshots. Client cannot supply trusted totals. Price changes force a fresh review before creating an order; repeat operation IDs return the same order and cannot change payload. Single product per checkout initially; unsupported arbitrary variants and mixed custom/catalog carts are outside scope.

Catalog order starts awaiting full payment, directly eligible for payment creation without issueQuote/acceptQuote. A pending transfer report, QR creation, redirect or AI output is never payment verification. claimPurchase requires full verified amount minus refunds/reservations. Partial payment stays pending. Fulfillment reuses existing purchasing/warehouse/tracking paths, with fixed payable and no second collection. Shipment costs can be recorded internally without changing catalog customer liability. Holds, cancellation, refund, reversal and dispatch checks retain existing financial protections. A legitimate post-sale scope change needs a separate explicit customer agreement, outside automatic catalog repricing.

Custom request retains review, versioned quotation acceptance, first installment before buying, final amount approval where required and second installment before dispatch. Keep current first-installment percentage until separately confirmed/changed.

## File and function impact plan

| Paths / symbols | Change |
| --- | --- |
| packages/domain/index.ts; new packages/domain/catalog-checkout.ts | discriminator, schemas, immutable snapshot, amount/purchase/dispatch invariants and compatibility helpers |
| functions/src/index.ts; new functions/src/catalog-checkout.ts | authenticated transactional catalog checkout, idempotency, audit/projections/outbox; export callable |
| functions/src/workspace.ts contentSchema/saveContent | listed-price/orderability/variant validation and publication rules |
| src/features/content/ContentEditor.tsx; src/shared/public-content.ts | configure/read explicit listed prices and purchasable selections; accessible paginated catalog |
| src/features/content/Content.tsx; new src/features/products/Checkout.tsx | product list/detail select-and-pay flow, availability and price-change/error states |
| functions/src/public.ts; packages/domain/product-selection.ts | public catalog pagination/selection parity and correct product price meaning/structured data |
| functions/src/payments/payos.ts; src/features/orders/OrderTools.tsx; src/features/requests/TransferNotice.tsx | full-payment purpose, authoritative outstanding amount, clear full versus installment UI |
| src/app/App.tsx; src/features/operations/Workbench.tsx; OperationsDetails.tsx | checkout route, order-specific labels, full-paid buying queue without quotation work |
| functions/src/changes.ts, consolidation.ts, shipping.ts, refunds.ts, finance-review.ts, order-history.ts; src/features/orders/Changes.tsx | trace and guard actual consumers so fixed catalog liability, ledger and projections agree; changes only where necessary |
| functions/src/ai/ask-workflow.ts; packages/domain/ask-workflow.ts; src/features/ask/Commerce.tsx, InvoiceSummary.tsx, knowledge.ts | coordinate catalog/custom policy with active Ask chat; AI cannot authorize payment or fallback to custom quote silently |
| functions/src/crm.ts; src/features/crm/*; invoice consumers if implemented by owner chat | distinguish order policy and verified funds; coordinate rather than overwrite other chat edits |
| firestore.rules / indexes if required by confirmed query shape | deny client writes and preserve owner/role access; bounded catalog queries only |
| tests/unit/catalog-checkout.test.ts; lifecycle/payment tests; tests/rules/server.test.ts; tests/http/callable.mjs | regression tests for both policies, compatibility, financial and authorization boundaries |
| docs/PRODUCT_AND_WORKFLOWS.md; task-specific docs/reviews/PURCHASE-FLOW-018-* | canonical business contract, product content evidence, validation, final review and report |

## Risk, validation and rollback

High risk: payment/public contract changes across concurrent shared WIP. No new dependency, production deployment, provider activation, outbound customer message, financial datafix or historical-order migration is authorized here. Read current candidate before implementation and reconcile owner-chat edits.

Validate full catalog lifecycle and unchanged custom lifecycle; partial/full payments, pending reports, duplicate callback and checkout retries, stale price/unpublished item/invalid variant, quantity/overflow, owner and locked-account access, tampered amounts, refunds/reservations/reversals, packing/dispatch and historical orders without discriminator. Verify catalog pagination exposes later products without duplicates or exclusions. Run typecheck, lint, relevant Vitest and emulator rules/HTTP tests; browser desktop/mobile/auth/error/offline/payment states. Apply product-content gate with string/state inventory and all eight principles supported in context. Fresh final-implementation-review required after fixes.

Rollback disables new catalog checkouts/orderability while retaining immutable orders, payment intents, ledgers and audit; do not convert paid orders back to custom requests or delete financial history. Production/provider acceptance remains separate.

## Cross-chat synchronization

User explicitly authorized sync. Successfully sent confirmed business rules to Xây dựng hệ thống hóa đơn online (01a109b0-3059-7272-b4d6-20aea3ba58f9), Hoàn thiện Ask Anything end-to-end (01a10965-def1-7de3-92cf-88e6061a10f9), and Hoàn thiện CRM end to end (01a1090e-11c9-7292-8f75-5d505f097aae). CRM explicitly acknowledged the distinction. Sending/acknowledgment does not prove integrated implementation or tests. Other chats must follow their own approved scope; this plan does not authorize them.

## Approval and task status

Approve SATSUNICGO-PURCHASE-FLOW-018 v1 to authorize the scoped local implementation above. Repository plan workflow step 15 requires reviewed-plan approval before protected edits; user request to implement established intent but predates this concrete impact plan.

Completed: business requirements captured, bounded source analysis, cross-chat rule dispatch, reviewable implementation plan. Remaining: human plan approval, protected implementation, integrated sync, tests/content evidence/fresh final review. Implementation checks and final review: NOT_RUN. Production: NOT_READY. Token usage / actual cost: Unavailable. Memory candidates: None.

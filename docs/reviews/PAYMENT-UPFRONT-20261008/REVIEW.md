# Payment flow review - cycle 1

Decision: **CHANGES_REQUESTED for the requested new behavior**. This is a current-source review before implementation, not a claim that the old approved 50% policy is defective. No live merchant transaction or full authenticated E2E was executed.

| ID | Priority | Evidence / finding | Business impact | Planned correction |
| --- | --- | --- | --- | --- |
| P01 | HIGH requirement gap | `packages/domain/index.ts:92-94` computes half; acceptQuote persists that deposit. Request schema/form lack unit researched price/currency. | Custom users cannot pay the requested researched-price amount in full initially. | Versioned upfront policy on new custom orders, explicit researched price, server estimate and customer acceptance. Preserve old accepted 50% contracts. |
| P02 | HIGH requirement gap | `evolve.finalize/approveFinal` requires PACKED; recordPurchase stores actualSourceMinor only as operations/purchase evidence. | Price increases do not become an explicit early revised cost obligation; UI can hide extra liability until packing. | Versioned cost breakdown, proposal and customer approval; initial 100% and final extra balance are separate obligations; block shipment on unpaid final amount. |
| P03 | HIGH requirement gap | `provider-release-gate.ts` holds payments/email; existing provider mocks are test-only. | User cannot finish a demo payment without merchant secrets; enabling configuration alone would still fail. | Separate local-only mock adapter/checkout confirmed on backend, same ledger/obligation application, demo identity fencing and negative production tests. Keep live capabilities held. |
| P04 | HIGH recovery defect candidate | `payos.ts:279-296` discards get result on retry; reconcile at 402 filters only pending/unknown. | Crash after intent state=creating can leave payment permanently unavailable. | Lease/reconciliation for stale creating, authenticated readback recovery, deterministic operation context, terminal confirmation before fresh attempt. Reproduce with fault injection after approval. |
| P05 | MEDIUM recovery gap | `payos.ts:260-266` rejects expired checkout; deterministic intent id reused for same version/amount. | Customer has no safe fresh link path after expiry. | Provider-confirmed unpaid terminal intent, immutable attempt history/new generation; late payment quarantined, never blindly retry unknown. |
| P06 | HIGH requirement gap | Payment commit at `payos.ts:145-151` has no emailState; `email.ts` queries emailState=queued. `invoices.ts` draft requires finalTotal/finalApproved; `email-content.ts` only links to UI printing. | Payment does not automatically create or email a PDF, especially initial custom payment. | Atomic deterministic receipt job keyed to ledger entry, immutable transaction receipt, private server-rendered PDF, attachment email + local mail sink. Rendering failure never rolls back payment. |
| P07 | HIGH semantic risk | `paymentDue` omits refundReserved; purchase/dispatch subtract it. | UI may show no payment due while fulfillment is blocked. | Show pending refund and hold separately. Freeze new payment collection during pending refund review; do not double-collect merely to cover a reservation. Re-evaluate after finance resolves it. |
| P08 | MEDIUM compatibility gap | Ask workflow, prompt and OrderTools use deposit/two-installment wording and provider-specific link handling. | Customer gets conflicting amounts, stages or blocked mock URL after a partial UI change. | Shared payment state presentation from persisted policy/obligation; update draft price validation and Ask guidance; AI cannot set payable, mark paid or spend money. |
| P09 | HIGH document meaning constraint | Domain kind=internal_statement, current email explicitly says not tax invoice; no verified legal issuer/tax provider. | Calling a branded PDF a statutory electronic tax invoice would misstate its status. | Build a clearly named payment receipt; formal tax invoice requires separately verified issuer/provider contract. Keep extension point, no fabricated tax fields/signature. |

## Preserved controls

Server-owned listed prices/options/versions, catalog total cap, verified owner access and staff role/assignment checks, recent MFA for finance, real webhook signatures and merchant context, atomic ledger updates, immutable accepted terms, refunds/reservations/reversals, pack/freight-version/hold dispatch checks, stable idempotency and SMTP ambiguous-outcome handling.

## Additional tests required, without declaring unverified defects

Distinct verified bank references on the same intent, concurrent top-up approval/payment/finalization/refund, partial/overpaid transfers, mismatched obligation revision, webhook-before-create-response, configuration expiry, locked/other-owner access, unknown response recovery, expired link vs late webhook, stock failure/cancellation after collection, PDF retry/collision and recipient privacy. Every unexpected transfer must remain recorded and reconciled; no silent loss or duplicate collection.

## Review cycle 2 - design corrections

The plan was revised to avoid collecting again while a refund is reserved, to preserve catalog fixed totals, to bind top-ups to explicit cost revisions, to keep all mock controls out of production release exports, and to separate initial receipt from final internal statement. These are plan corrections, **not application fixes**. Code regression tests, independent implementation review and production readiness remain **NOT_RUN / NOT_READY** until approved implementation and verification.

## Review cycle 3 - prototype verification

- PDF quantity header originally wrapped “SL” into two lines. Widened its column; regenerated all three PDFs and visually reviewed all five pages. Text extraction verifies Vietnamese text, demo/non-tax meaning, values and all 30 rows; every glyph remains inside page bounds and TrueType fonts are embedded.
- Mobile item name was cut off by a one-line readonly input. The review sample now wraps the name in a readonly multiline field.
- Price validation initially marked the valid quantity field as invalid too. Split per-field errors, verified negative price marks only price and decimal 58.25 × 2 yields 3,058,125 VND including the illustrative fee.
- Removed floating-point decimal parsing in the sample, using string-to-integer cents and rational conversion. Added a maximum known-total guard; invalid/overflow never presents synthetic zero or enables proceeding.
- Fixed prototype document semantics: downloadable PDFs use fixed sample amounts, not an edited calculator's amount; the difference is stated in context.
- A sample request for cost review originally only cleared the checkbox, allowing immediate re-acceptance. Added a held state and disabled approval while waiting; fresh CUA readback confirms heldApprovalDisabled=true and heldPayDisabled=true, including 390px screenshot.
- Added actual public terms/catalog/operations/order-change consumer paths to the plan and preserved archived accepted terms. Added explicit production intake hold until a real approved payment channel is usable.

These findings concern the review artifacts and plan. P01-P09 application corrections remain pending approval and implementation. No claim of an independent implementation review, real E2E payment, production fixes, live email or statutory invoice issuance.

## Review cycles 4 and 5 — current-code design refinement

The user asked to design from the existing code. R2 now directly loads global/public-ux/request-form/page-tabs/documents CSS and follows RequestForm's own three stages, Checkout's listed-price selection, and StatementView's product table/totals. No protected application change was made.

Cycle 4 found/fixed four draft issues: bespoke v1 component geometry, global panel selector collision (including its dataset mapping), consent label display overridden by shared CSS, and fixed receipt samples potentially mistaken for edited calculator output. See `DESIGN-R2.md` for correction details. Actual checks re-executed: 1280/390/320 renders, per-field invalid values and money bound, decimal price, staged draft retention, manual tab activation, consent reset, listing quantity/options, top-up purpose/450,000 amount, cost-review hold, pending/unknown/paid-with-document-processing, document fixed table/totals, and menu Escape. Script syntax/Prettier/structure passed.

Cycle 5 re-reviewed the corrected artifact/component mapping and current evidence. No new finding within the executed design subset. The full application/final implementation and Product Language Gates remain **BLOCKED**, with AT/200% and new server/payment/PDF/email E2E **NOT_RUN**. No source fixes to P01-P09, independent-agent PASS, production or console-clean result is inferred. Shared browser warnings during the incidental existing membership route visit are disclosed in `PRODUCT-CONTENT-R2.md`; authenticated runtime was not certified.

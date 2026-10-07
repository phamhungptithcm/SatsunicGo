# Product Content Review — PURCHASE-FLOW-018

Scope: catalog, checkout, account order/payment, custom request, staff operations, CRM, Ask knowledge, public workflow/terms, content editor. Vietnamese web; English Ask adapters preserve payment meaning. Reviewer: Codex self-review, 2026-10-04. Web native HTML controls and existing brand; Apple HIG human-centered principles used as quality reference, not an Apple-platform conformity claim.

## Context and inventory
Observed authoritative catalog fields: published, orderable, listedPrice VND, version, termsVersion, catalogOptions. No legacy reference price is promoted. Custom requests retain quotation and two installments. Exact source-context inventory: PURCHASE-FLOW-018-STRING_INVENTORY.json (includes surrounding existing strings, not solely changed strings). Diff and source manifest identify candidate scope.

| Location/state | Before | Current meaning/action | Evidence |
| --- | --- | --- | --- |
| Catalog/default | Featured/reference-price discovery | Listed all-inclusive price; unavailable if unconfigured; load more includes nonfeatured | Content.tsx; catalog browser fixtures |
| Checkout/action | No direct catalog checkout | Choose variant/quantity, sign in, create order then pay full once | Checkout.tsx; checkout desktop/mobile screenshots |
| Order/payment | Deposit labels for every order | Catalog full amount; custom deposit/balance | domain helpers; OrderTools; emulator tests |
| Recovery/pending | Retry identity only in memory | Freeze selection; restore same operation after reload; check same order | checkout-unknown-mobile.png; single-order emulator readback |
| Custom request | Mixed catalog/request instruction | Products absent from catalog; review, quotation, two payments | RequestForm; public-content; AI projections |
| Staff/editor | Reference price | Explicit all-inclusive listed price, terms and structured options; invalid configuration rejected | ContentEditor JSX in-context hierarchy proxy; callable publication tests |
| Ask/CRM | Universal quotation/deposit | Shared catalog/custom helpers and authoritative product sources | adapters and source manifest |

## State coverage and semantics
Default and success: browser catalog → two selected units → order total 240,000 VND, collected zero until verified provider payment. Pending/disabled: native required variant/quantity, loading status, frozen ambiguous retry. Error/recovery: unavailable provider leaves money unchanged; definitive selection/version errors clear pending, unknown responses preserve operation. Empty/unavailable: no configured price disables purchase, no false zero price. Offline/stale/partial: explicit retry/error, stale product server version rejection, filtering disclosed as loaded subset. Unauthorized: verified Google, owner and locked-account checks tested in emulator. Consequential actions: unpaid cancel only when collected/refunded zero; paid cancellation/return uses existing approval flow. Catalog pricing frozen per order; freight does not add a second charge. Integer VND amounts and aggregate cap checked on server. Auth claims, money and availability are never inferred from client text.

| Principle | Status | Evidence |
| --- | --- | --- |
| Purpose | PASSED | Catalog makes selection and full payment explicit; request copy explains review/two payments |
| Agency | PASSED | Variant/quantity, back link, reload and unpaid cancellation; no autonomous AI purchase |
| Responsibility | PASSED | Server price/version, verified callback, idempotency; no payment-success copy on failure |
| Familiarity | PASSED | Native labeled select/input/buttons; familiar Vietnamese money/ordering terms |
| Flexibility | PASSED | Desktop/mobile, pagination, preserved retry and legacy/custom flows |
| Simplicity | PASSED | Catalog removes quotation/deposit/final-charge steps from customer surface |
| Craft | PASSED | 390px layouts checked without horizontal overflow; consistent labels and totals |
| Delight | PASSED | Selection recovery avoids duplicate orders and unnecessary repeated entry |

Platform-fit PASSED within reviewed web scope: existing visual system, native constraints and accessible control names; no Apple-only expression. Writing/feedback/consequential choices/account privacy PASSED by source and rendered checkout/order states. Vietnamese and current English adapter terminology inspected, no RTL locale introduced (NOT_APPLICABLE). Accessibility PASSED for scoped semantic labels/status/alerts/disabled controls and viewport checks; live screen-reader, keyboard-only end-to-end and 200% scaling NOT_TESTED and not certified. Motion NOT_APPLICABLE: no new motion. Content editor rendering uses JSX composition proxy plus callable test, not a browser screenshot. Live provider/auth/AI and production data are NOT_TESTED.

Decision: Product Language Gate PASSED for local approved scope, with the above explicit coverage limits. Fixed findings: reference-price ambiguity, universal deposit labels, hidden catalog pages, unknown-result retry duplication and restored variant display. Owner must configure real listed prices/terms before opening catalog sales.

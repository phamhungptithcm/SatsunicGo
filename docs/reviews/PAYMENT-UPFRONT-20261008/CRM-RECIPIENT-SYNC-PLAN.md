# CRM recipient consistency — 2026-10-09

Plan ID/version: CRM-RECIPIENT-SYNC-20261009 v1
Status: APPROVED bounded correction under PAYMENT-UPFRONT v3/R4, APPROVAL-V3.md (authoritative initial-payment backend, funded staff work, review/fix/test loops) and the current human instruction to handle the same address information in CRM. The intended producer `functions/src/purchase-settlement.ts` and purchase tests/scripts are already approved. No new CRM editor, public contract, dependency, permission or production mutation.

Repository intelligence: DEGRADED; healthy stale CodeGraph queried first, CocoIndex second, critical conclusions verified in current source. Shared dirty main, HEAD 0d6e721698608eebb36b0b2f68021c3054d97d1c. Retain concurrent notification changes. Shared runtime 5207/18207 remains running; no restart or reseed.

## Source-verified inventory and gap

- `Workspace.tsx` maps CRM routes to Customer(s), operations, shipping, finance, invoices, settings and content. Source search across all feature TS/TSX files finds no CRM province/commune inputs. Customer care edits notes/tags/assignee/follow-up only; shipping and operations do not edit recipient regions.
- `Documents.tsx:configure` edits the seller's free-text address via `sellerSchema`. This is a separate seller identity contract, not a recipient province/commune selector. Preserve it and historical invoice snapshots.
- Public Profile and Ask have legacy free-text recipient forms outside this CRM request; do not silently parse or migrate those addresses.
- Checkout validates codes together in `recipientFromDirectory`, then freezes canonical names. Initial settlement writes that address to private `orderRecipients/{orderId}`. CRM `readOrderOperations` reads only `orderOperations/{orderId}.recipient`. No trigger copies the upfront recipient there. Ask already writes both in one transaction. Thus a paid upfront order can be missing its recipient in CRM.

## Smallest safe implementation

1. In `purchase-settlement.ts`, within the existing successful initial allocation transaction, build one three-field recipient snapshot (name/phone/street + commune + province + Việt Nam) and write it to both existing private stores. Create `orderOperations` with recipient and changedAt, atomically with orders/ledger/receipt/cart. A preexisting projection must abort rather than overwrite unrelated operations. Keep payment replay, unknown/cancelled/review-required and balance branches unchanged. No correction/backfill of old paid orders.
2. Add `tests/rules/purchase-crm-recipient.test.ts` and a focused `scripts/purchase-crm-rules.config.mjs`. Use the existing demo services, exact project/host guards, read-only global settings, unique synthetic documents and owned-path cleanup. Verify mixed/cart maximum, concurrency/replay, nonpayment, collision rollback, balance preservation and CRM role/privacy controls. Never send mail or invoke a real provider.
3. Record red/green evidence, Node22 TypeScript, focused unit and static checks. Re-review actual scoped diff and source hashes. Do not run global-setting replacement fixtures on the shared demo. Existing browser refusal remains binding; no workaround.

## Impact, quality and rollout

Confidential shipping PII uses the same restricted store and existing staff callable permissions as Ask; no client rule change. At most one extra transactional document write per cart line (cart limit30), no query/index/network call per line and no external call inside transaction. Existing queue bounds and transaction retry/idempotency remain authoritative. No UI strings/layout change. Review cycle2 corrected the initial classification: Product Language Gate applies because previously missing recipient data becomes visible in CRM. Record the data semantics and all eight principles; actual rendered UI acceptance remains blocked by the existing browser refusal. Profiles: universal, TypeScript, API, database, concurrency, memory, web application, product content.

Local implementation only. Rolling back source stops future projection creation; existing snapshots remain compatible. Historic missing projections need a separately approved backfill/read fallback if requested. Production/provider/browser acceptance stays NOT_VERIFIED. No deployment, commit/push, secret access, data reset or historical financial correction in this scope.

## Bounded autocomplete regression correction

Integration QA supplied two current failures from required-labels092. Reproduction confirms its unchanged AST audit cannot bind the native required input in the reusable component to labels in the caller. Smallest correction within the already approved purchase autocomplete scope: the component owns its visible label, decorative required marker and explicit input ID; caller supplies the same label text. Return a fragment so the rendered label/control/error sibling layout is preserved. Keep native required and the global label audit unchanged. Update the existing purchase-region SSR contract test to require an associated label, marker and native required field. Affects only purchase-region-autocomplete.tsx, purchase-checkout.tsx and purchase-region-search.test.ts. No label text, payment, province selection or styling changes. Re-run label audit, checkout/region regression, TypeScript and static checks, then refresh manifests; rendered UI remains NOT_RUN.

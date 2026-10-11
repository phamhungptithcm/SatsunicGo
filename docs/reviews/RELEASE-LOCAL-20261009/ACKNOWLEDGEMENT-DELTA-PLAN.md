# Financial acknowledgement admission delta

Status: concrete in-scope reviewed-finding fix, authorized by root's scoped writer assignment under the human-approved PAYMENT-UPFRONT v3 review/fix loop. Intelligence remains **DEGRADED**; critical relationships were verified in current shared source. This does not authorize live payment activation, analytics integration or the Ask r3 design.

Approval binding: `docs/reviews/PAYMENT-UPFRONT-20261008/APPROVAL-V3.md`, approval **APPROVED**, human message on 2026-10-08 beginning “aporved triển khia giống 100% UI UX” and ending “complete payment without payos ... integrate it later”. It expressly includes `packages/domain/purchase-*.ts`, `src/features/cart/purchase-*`, `src/features/orders/purchase-*`, `tests/unit/purchase-*` and review-fix-test loops. Constraints preserve server-derived money/ownership, exact unknown-operation recovery, demo-only payment and unrelated WIP. Root's current assignment permits this concrete acknowledgement correction before freezing source.

## Source contracts and old failure

- Initial preview generates `id`, passes it to `buildCheckout`, and persists its snapshot under `purchasePreviews/{id}` (`functions/src/purchase-checkout.ts:307–329`). Commit loads the submitted `previewId`, verifies owner/hash, rebuilds that same `p.id`, creates `purchaseCheckouts/{p.id}`, and returns `{ id: p.id, state: 'pending', total: p.total, provider: 'demo' }` (`:333–400`). Thus equality between acknowledged checkout ID and submitted preview ID is source-backed, not assumed from a route.
- Balance preview likewise persists a snapshot whose `id` is its preview document ID (`:827–874`). Commit creates `purchaseCheckouts/{preview.id}` and returns that ID, pending state, positive due and demo provider (`:894–911`). Idempotent replay returns the originally stored operation result in both handlers.
- Sourcing propose/approve validates submitted order/version, returns `{ id: order.id, version: order.version + 1 }`, and stores that exact result (`functions/src/purchase-adjustment.ts:97`, `:153–170`). A replay must compare against the original submitted version, not the latest rendered order version.
- Current frontend Checkout removes its pending envelope before accessing an unchecked `result.id`; `{}`/`null` loses recovery or navigates to an invalid checkout. Sourcing ignores acknowledgement content and clears its pending operation on any fulfilled payload.

## Exact patch and impact

Owned application paths only:

1. `packages/domain/purchase-checkout.ts`: add two pure runtime-admission helpers for the existing acknowledgement contracts. Checkout admits UUID ID, exact pending state, positive safe bounded money and current demo provider, then binds ID to the submitted preview ID. Sourcing admits UUID ID/safe positive version, then binds ID and the single version increment to the original submitted envelope. Extra server fields may be stripped; no server/public schema is changed.
2. `src/features/cart/purchase-checkout.tsx`: request `unknown`, admit acknowledgement before clearing persisted/in-memory pending identity, refreshing or navigating. Existing unknown-result catch retains the exact envelope/UUID when admission rejects. Initial and balance paths share this guard.
3. `src/features/orders/purchase-adjustment.tsx`: admit the raw response against the actual submitted/replayed command before removing storage or setting saved. Existing catch preserves malformed/mismatched acknowledgements for exact replay. Admission rejection reuses the existing pending-status sentence as its alert, because the existing catch displays an error message; no Zod/internal failure text is shown to the customer and no new wording is added.
4. `tests/unit/purchase-acknowledgement.test.ts`: exercise both successful contracts and malformed/null/wrong identity/state/provider/amount/version cases, plus replay admitted against the original expected version.

All existing UI strings, form behavior, RPC payloads, provider/demo holds, authorization, amounts, server writes and recovery keys stay unchanged. No new dependency, backend edit, production/provider call, browser/server/reseed or Git operation. No analytics fix. Root owns remaining source changes and release evidence.

Risk: **MEDIUM** client recovery correctness. Runtime rejection does not prove the earlier command failed; rejection must leave the pending identity intact. Successful acknowledgements retain current navigation/save behavior. Test execution uses Node 22 and installed dependencies; focused helper/purchase units and scoped lint/type checks will be recorded. Full build/acceptance/production evidence remains root-owned. Re-review the final diff and current source hashes before writer lease release.

Baseline read receipts: checkout `9b6fe9fa669f9d73ce793a419053a6a10debf5a2b9d84f003cec6cda60272898`; adjustment `108f1cf66d64336fd54afdafecd2b5bc2e31bd2e84fbca38bdf4cde5fc41216b`; Functions checkout `00edf99aba78f2723d30bae8f2b5ddfa5635a63f6185201d7147869be62db1cc`; Functions adjustment `482dd3ec049bbc49857ab1cc5daf13c6f5d609e971f57e3ccee7f9367d2f61ef`.

## Validation receipt

The concrete plan was saved before source implementation. First focused run: 52/52 unit cases passed; frontend type check identified the stored command as `unknown` rather than the helper's typed context. The helper was repaired to parse that unknown order/version context at runtime. Second focused run: 57/57 cases passed, scoped lint and frontend `tsc --noEmit` exited 0. Final source self-review found that adjustment's existing error display would expose a Zod/internal acknowledgement message; it now reuses its already-present pending sentence for this failure only. Final checks and frozen hashes follow after this last fix.

Final affected checks, Node `v22.23.3`, 2026-10-09 local task receipt (shell outputs report 2026-10-08 22:49):

- `node node_modules/vitest/vitest.mjs run tests/unit/purchase-acknowledgement.test.ts tests/unit/purchase-checkout.test.ts --maxWorkers=1`: **57/57 PASS**, two files, 906 ms; 45 new acknowledgement cases and 12 existing purchase cases. Log `/private/tmp/satsunicgo-purchase-ack-unit-current-20261009.log`.
- `node node_modules/eslint/bin/eslint.js src/features/cart/purchase-checkout.tsx src/features/orders/purchase-adjustment.tsx packages/domain/purchase-checkout.ts tests/unit/purchase-acknowledgement.test.ts`: **exit 0**. Log `/private/tmp/satsunicgo-purchase-ack-lint-current-20261009.log`.
- `node node_modules/typescript/bin/tsc --noEmit`: **exit 0**. Log `/private/tmp/satsunicgo-purchase-ack-tsc-current-20261009.log`.

The actual executable for all three commands was `/Users/hunpeo97/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin/node`. Final commands used `set -o pipefail` when recording via `tee`, so the receipt preserves the checked command's exit status. Final source self-review verifies admission occurs before storage removal/navigation/saved state; invalid acknowledgement errors do not match any definitive RPC rejection code, so they retain the exact pending envelope. Reversing only this patch's caller changes reproduced both recorded baseline hashes, confirming unrelated caller WIP was retained. Component/browser failure injection, full release build and production provider evidence remain **NOT_RUN** here; root owns broader checks and independent final review.

Frozen app/test SHA-256:

| File | SHA-256 |
| --- | --- |
| `src/features/cart/purchase-checkout.tsx` | `9f419a72aa7e12ef83472741507483ab225369cfffa0cddf67b2a50090893733` |
| `src/features/orders/purchase-adjustment.tsx` | `1075d076052c9a4320e020471443e6d710d215735ec9cb323184feacec9ceb69` |
| `packages/domain/purchase-checkout.ts` | `1144926ab8865ddcde29e871ed81f834809bd302984535860ed341dbd5bd465a` |
| `tests/unit/purchase-acknowledgement.test.ts` | `f784a3dea6944e09bd02235e65bebac1336e63923406db371236567af8d0bc3a` |

Content delta: no new user-facing wording; an acknowledgement error reuses the exact existing sourcing pending sentence. No layout/control/accessibility-name/amount meaning changes. Purpose/Agency/Responsibility preserve verification and explicit recovery; Familiarity/Flexibility/Simplicity reuse the existing same-attempt path; Craft adds bounded runtime checks; Delight adds no decoration or success claim. This scoped source mapping is not an in-context AT/Product Language pass. Memory candidates: None.

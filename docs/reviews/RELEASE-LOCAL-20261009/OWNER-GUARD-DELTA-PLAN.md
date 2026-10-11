# addRequest stored-cart owner guard

Status: concrete approved review-finding correction before final freeze. Current checkpoint HEAD `d229b9be6f2f53a40679d7df3bd3354d32f693b7`; repository intelligence **DEGRADED**, bounded source fallback. Root owns Git/checkpoint delivery; this is a separate follow-up, not an amend. No other agent edits are adopted or reverted.

Approval binding: PAYMENT-UPFRONT v3 `docs/reviews/PAYMENT-UPFRONT-20261008/APPROVAL-V3.md` SHA-256 `63ad3d8562275d5c970defd9f7bf0eea5cfaf2032404a2dcdd2fb8aca087d52e`, **APPROVED** by the human on 2026-10-08. Its `functions/src/purchase-*.ts` / `tests/unit/purchase-*` paths and review-fix-test loop cover preserving server ownership. Root's explicit current assignment binds this missing ownership guard to that approved correctness scope and continuing hardening/delivery request; no provider, money or API expansion is authorized.

Observed source baseline: `functions/src/purchase-checkout.ts` SHA-256 `00edf99aba78f2723d30bae8f2b5ddfa5635a63f6185201d7147869be62db1cc`. `dependencies():115–118` parses the stored cart and then requires `cart.ownerId === uid`, throwing `HttpsError('permission-denied', 'Chưa mở được giỏ.')`. The addRequest branch (`:244–246`) parses the same `carts/{uid}` document but omits that guard before merging custom lines and writing the cart, private draft and idempotency receipt. Schema validity and document path are not substitutes for stored ownership validation.

Exact implementation:

1. Own only `functions/src/purchase-checkout.ts`: immediately after the addRequest cart parse/default, add the same owner equality guard and existing error semantics from `dependencies()`, before active-checkout/revision checks and before any write. Keep auth verification, policy, revision, price/FX, limits, idempotency/replay and provider behavior intact. No refactor, new schema or public string.
2. Own only new `tests/unit/purchase-owner-guard.test.ts`: execute the actual exported callable's `.run()` with real authentication/input/domain validation and mocked Firestore transaction transport. Set explicit demo project/emulator environment before module import. A valid same-revision cart with another owner must return permission-denied and attempt zero cart/draft/idempotency writes; its stored row must remain unchanged. A same-owner cart must merge the new request, preserve existing lines, advance one revision and write one draft/cart/idempotency receipt. Also verify missing-cart default ownership remains compatible.

Risk: security/corrupt-data boundary, narrow owner validation. This does not claim actual Firebase HTTP/App Check/emulator/production verification; `.run()` fixture supplies synthetic runtime-verified auth and exercises the real handler with in-memory transaction reads/writes. No server start/reseed/network/provider/auth/production mutation. Run fail-before against unchanged source, implement the two-line guard, then rerun the same fixture plus relevant purchase units, scoped lint and frontend/functions compiler checks where possible. Root owns independent review and broader release checks.

Implementation/check receipt pending at plan creation. This plan is saved before application edits; the existing approval already binds this exact correction. No new user-facing wording or financial semantics; reuse existing permission-denied copy. Memory candidates: None.

## Executed regression and final receipt

Before the source edit, the actual `.run()` fixture produced **1 FAIL / 2 PASS**, exit 1. The mismatch case attempted three writes: a private purchase draft, `carts/synthetic-owner-guard`, and its exact purchase idempotency receipt. It expected zero write attempts; same-owner and missing-cart controls already passed. Evidence: `/private/tmp/satsunicgo-purchase-owner-before-20261009.log`. No helper imitation or alternate handler was used.

The source diff is exactly the two owner-guard lines. After the fix, the same three handler cases and existing purchase/acknowledgement cases produced **60/60 PASS** across three files, 8.02 s, exit 0. Scoped ESLint, Functions TypeScript and frontend TypeScript all exited 0. Executable: `/Users/hunpeo97/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin/node` (Node 22.23.3).

Exact commands:

```text
node node_modules/vitest/vitest.mjs run tests/unit/purchase-owner-guard.test.ts tests/unit/purchase-acknowledgement.test.ts tests/unit/purchase-checkout.test.ts --maxWorkers=1
node node_modules/eslint/bin/eslint.js functions/src/purchase-checkout.ts tests/unit/purchase-owner-guard.test.ts
node node_modules/typescript/bin/tsc --noEmit -p functions/tsconfig.json
node node_modules/typescript/bin/tsc --noEmit
```

Logs respectively: `/private/tmp/satsunicgo-purchase-owner-after-20261009.log`, `/private/tmp/satsunicgo-purchase-owner-lint-20261009.log`, `/private/tmp/satsunicgo-purchase-owner-functions-tsc-20261009.log`, `/private/tmp/satsunicgo-purchase-owner-frontend-tsc-20261009.log`. Recorded commands used `set -o pipefail` with `tee`; failures cannot be masked by the log writer.

Fresh self-review: the guard uses the exact existing error code/copy, appears before active-checkout/revision checks and every fresh-request mutation, and preserves idempotent replay ordering. Reversing only the two lines reproduces baseline SHA `00edf99aba78f2723d30bae8f2b5ddfa5635a63f6185201d7147869be62db1cc`. The fixture checks zero attempted writes and unchanged stored cart on mismatch, and exactly one cart/draft/idempotency write with original lines retained on success. Source auth, price, policy and provider holds remain unchanged. Root's independent final review and whole-release validation remain separate.

Frozen SHA-256:

| File | SHA-256 |
| --- | --- |
| `functions/src/purchase-checkout.ts` | `6ff4ebe23cd0dd0fa4d99235d833c951e14aa6e7705d36c921a4e22a34359a16` |
| `tests/unit/purchase-owner-guard.test.ts` | `219565d1112e4b18582429acc0121ef4245bb47f74177de30ad7f1ffadea0a9a` |

Content inventory: zero new strings; one existing permission-denied sentence reused in the newly guarded failure branch. Purpose/Responsibility preserve owner correctness, Agency keeps retry/save authority with the customer, Familiarity/Simplicity reuse the cart error, Flexibility retains same-owner/missing-cart and exact replay, Craft uses existing domain checks, Delight adds no false success or decorative change. This is a scoped source mapping; browser/AT/audio/content-in-context verification is **NOT_RUN** here. Actual HTTP callable/App Check, live Firestore transactions and provider/production verification are **NOT_RUN**. No server, emulator, auth, provider or production mutation occurred. Memory candidates: None.

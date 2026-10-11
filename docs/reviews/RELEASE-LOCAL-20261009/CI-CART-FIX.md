# Cart consume handler correction

Authority: CI-CART-DELTA-PLAN.md SHA256 2def686c751778bb24b168f0bdb0d0962c60e72e39733f1b836aa6fb5b3a7e8d and root's explicit assignment under the approved release/test/fix loop. Repository intelligence remains DEGRADED; the shared brief's historical HEAD does not represent the current candidate. Current old handler bytes were independently matched to committed5c7e867572d1973ff398a854354bc174cd63039b. Concurrent purchase/payment/generated/frontend work was preserved.

Actual source cause: Zod4 rejects pick on cartItemSchema because that object includes the paired kind/custom refinement. The server-owned catalog snapshot has selection fields plus order metadata, rather than a cart line. The corrected handler imports catalogSelectionSchema and projects the exact same productId, variant and quantity fields from that unrefined schema before strip/safeParse. The unused cartItemSchema import was removed. Domain refinements/value constraints, strip behavior, input/auth/owner/lock/pending-checkout guards, transaction reads/writes, completion and idempotency, messages and public contracts are unchanged.

| Owned file | Before SHA256 | Frozen SHA256 |
| --- | --- | --- |
| functions/src/cart.ts | b5583a902202595340093c9c8239d8d5dae262a259223568f5700350e2a13d2c | 27b92e0f255edf429b3420e9a241066979833e5022bc2ff0dc20a6def7284160 |
| tests/unit/cart-consume-handler.test.ts | NEW | e88048b672d2b0301632c2100e43a4277d0dc24eaf12a06b6ba552ebee2229bb |

Unchanged domain hashes: packages/domain/cart.ts 10d6ca2efa03385a1faf904a089c2f0028a10740d1c05adc17b7e550c9f65b14; packages/domain/catalog-checkout.ts eea4948edee36594600421debe6125385bab251805f4dd7f1a8fb9e5546bec4c.

The26 new cases exercise actual cartCommand.run with real callable/auth/domain code and an isolated mocked getFirestore. The double captures immutable reads, stages writes atomically, enforces create preconditions and read-before-write, and retries when another transaction changes a read document. No emulator, application initialization, network/provider transport or customer data is involved. Coverage includes rich snapshots, current increased quantity, simultaneous same-order consumes, same/fresh-operation replay, changed-payload conflict, mismatched product/variant, reduced/re-added choices, invalid product/quantity/variant values, missing/foreign/custom orders, foreign carts, both lock fences, stored custom-kind refinement and pending-checkout blocking. Negative paths assert no writes; successful consumption verifies exact cart/operation/completion write paths and no order mutation.

Detected tooling/profile: TypeScript, Node22.23.3, Firebase callable/Admin interfaces, Zod4 and Vitest; universal, TypeScript/JavaScript, API, database and concurrency profiles. Product Language Gate NOT_APPLICABLE: no user-facing string or displayed-data contract change. Source review found no new capability, financial/payment flow change, secret/dependency/configuration access or timeout/retry threshold change. The synthetic double validates caller/domain behavior; it does not certify Firestore SDK lock/index/runtime behavior, which the unchanged actual cart107 CI suite must cover.

Executed commands use Node /Users/hunpeo97/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin/node:

1. Red before source correction: VITE_RECAPTCHA_ENTERPRISE_SITE_KEY='' node node_modules/vitest/vitest.mjs run tests/unit/cart-consume-handler.test.ts --pool=threads --maxWorkers=1 --reporter=json --outputFile=/private/tmp/satsunicgo-ci-cart-handler-20261009/red.json. Exit1,26 cases:9 passed/17 failed. All17 failures reached the refined-schema projection or failed its expected typed error oracle. Old source hash matches the committed candidate; red test hash9c4e892e7e40a05c4ae92e63a5560f7806d3191a4958ddb97ac658bcbe5ae734. Only formatting changed in the new test before green; no oracle was altered.
2. Green after correction: same environment/runtime, node node_modules/vitest/vitest.mjs run tests/unit/cart-consume-handler.test.ts tests/unit/cart107.test.ts tests/unit/catalog-checkout.test.ts --pool=threads --maxWorkers=1 --reporter=json --outputFile=/private/tmp/satsunicgo-ci-cart-handler-20261009/green.json. Exit0,50/50 passed:26 new handler,4 existing cart and20 existing catalog cases.
3. Scoped lint: node node_modules/eslint/bin/eslint.js functions/src/cart.ts tests/unit/cart-consume-handler.test.ts. Exit0, empty lint.log.
4. git diff --check on the two assigned paths: exit0.

Local evidence hashes (not copied into committed source):

| Evidence under /private/tmp/satsunicgo-ci-cart-handler-20261009 | SHA256 |
| --- | --- |
| red.json | 55566686528f93ba3844759ed8aa739bbf76a386a626ef72532d6dc368aefd63 |
| red.log | f81795cecf92137cfdeaceda83f63f5e3a658fe32422b7cbd226414679ad8747 |
| green.json | 47051f329d516392a2627af3cf7841927a905315f931c1b37861d16416549592 |
| green.log | e9db1ff091eea8d0e4545ddcd4f8c1df738e5993d1dffbc7fdfd827665ef4f71 |
| lint.log | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |

Review cycle: reproduce old source failure, apply approved narrow projection fix, pass focused checks, root inspect exact diff/source guards. Fresh independent final review, full compilation/unit/build/contracts, actual cart rules/whole CI and provider readback remain root-owned and NOT_RUN by this worker. No whole-release or production-readiness claim is made. Source/test lease RELEASED after freezing both hashes; no more source/test writes. No stage/push/Git mutation, install, runtime/server/emulator restart, paid call or shared data operation occurred. Memory candidates: None.

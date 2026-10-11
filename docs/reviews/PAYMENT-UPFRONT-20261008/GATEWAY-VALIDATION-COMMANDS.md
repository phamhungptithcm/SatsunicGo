# Reproduce scoped validation

Run from the repository root with the existing shared demo services and frontend5207. Do not start duplicate servers, seed/reset shared settings or run the exclusive CI fixture on the shared Storage. Runs create synthetic fixtures; they do not grant roles or contact PayOS/mail. Functions must be built before HTTP runs and left stable during them. Lease tests require coordinating the task-owned demo receipt watch; resume it for the mandatory background-business case. Existing `e2e005-owner` must already have its approved demo role; the runner checks it read-only.

```sh
npm run build --workspace functions
npm run build

npx vitest run tests/unit/purchase-provider.test.ts tests/unit/purchase-mutation-queue.test.ts tests/unit/purchase-checkout.test.ts tests/unit/purchase-owner-guard.test.ts tests/unit/purchase-acknowledgement.test.ts tests/unit/purchase-pdf.test.ts tests/unit/cart107.test.ts tests/unit/payos-signature.test.ts tests/unit/order-tracking.test.ts tests/unit/purchase-feedback.test.ts

npx eslint functions/src/purchase-checkout.ts functions/src/purchase-demo-gateway.ts functions/src/purchase-receipts.ts functions/src/purchase-mutation-queue.ts packages/domain/purchase-checkout.ts packages/domain/purchase-provider.ts src/features/cart/purchase-checkout.tsx src/features/cart/purchase-payment.tsx src/features/cart/purchase-gateway.tsx src/features/cart/purchase-feedback.ts tests/unit/purchase-provider.test.ts tests/unit/purchase-owner-guard.test.ts tests/unit/purchase-mutation-queue.test.ts tests/unit/purchase-feedback.test.ts tests/rules/purchase-provider.test.ts tests/rules/purchase-receipt-orphans.test.ts scripts/purchase-gateway-scenarios.mjs scripts/purchase-gateway-business-e2e.mjs scripts/purchase-gateway-cross-process.mjs scripts/purchase-gateway-shared.rules.test.ts scripts/purchase-gateway-rules.config.mjs scripts/purchase-resource-probe.mjs

npx prettier --check functions/src/purchase-checkout.ts functions/src/purchase-demo-gateway.ts functions/src/purchase-receipts.ts functions/src/purchase-mutation-queue.ts packages/domain/purchase-checkout.ts packages/domain/purchase-provider.ts src/features/cart/purchase-checkout.tsx src/features/cart/purchase-checkout.css src/features/cart/purchase-payment.tsx src/features/cart/purchase-gateway.tsx src/features/cart/purchase-feedback.ts tests/unit/purchase-provider.test.ts tests/unit/purchase-owner-guard.test.ts tests/unit/purchase-mutation-queue.test.ts tests/unit/purchase-feedback.test.ts tests/rules/purchase-provider.test.ts tests/rules/purchase-receipt-orphans.test.ts scripts/purchase-gateway-scenarios.mjs scripts/purchase-gateway-business-e2e.mjs scripts/purchase-gateway-cross-process.mjs scripts/purchase-gateway-shared.rules.test.ts scripts/purchase-gateway-rules.config.mjs scripts/purchase-resource-probe.mjs

node --expose-gc scripts/purchase-resource-probe.mjs
git diff --check
```

Each shared backend command below uses the explicit environment block. Preserve the original emulators and their data.

```sh
export GCLOUD_PROJECT=demo-satsunicgo
export FUNCTIONS_EMULATOR=true
export FIRESTORE_EMULATOR_HOST=127.0.0.1:18207
export FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:19207
export FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:19208

node scripts/purchase-gateway-scenarios.mjs
node scripts/purchase-gateway-business-e2e.mjs
node scripts/purchase-gateway-cross-process.mjs

# Coordinate the owned receipt watcher and pending jobs first; preserve every financial record.
npx vitest run --config scripts/purchase-gateway-rules.config.mjs
```

Business background proof is unconditional. Native trigger registration on the split shared hub is not inferred from watch execution. Actual current results are recorded in GATEWAY-QUALITY-GATES.json and hash-bound by GATEWAY-SOURCE-MANIFEST.json. Node22/production/real provider/real inbox and current exclusive CI fixture remain outside this run. UI actions used CUA against the actual React app with no network interception or state injection; reproducible human journeys are in GATEWAY-SCENARIOS.md.

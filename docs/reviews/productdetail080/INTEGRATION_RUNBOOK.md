# Integration checklist — 080

1. Obtain current shared-file lease from integration owner. Do not copy old functions/index.ts. Append only five exports from product-reviews.ts onto current index preserving campaign banner exports.
2. Verify every other shared adapter baseSha256 in FREEZE.json. On drift inspect changes and produce narrow additive rebase; do not overwrite parallel WIP.
3. Apply productdetail080.patch only after exact base match. Do not include candidate/firebase.json, functions/package.json, emulator-entry.cjs, compiled lib, SDK stub replacement of shared firebase, credentials or emulator fixture data.
4. Run current combined frontend/backend typecheck, scoped lint, unit cases and portable browser config against integrated source; integration owner handles full app build/release checks.
5. Rerun independent review on final integrated source and receipts, resolve findings and repeat checks. Reconcile READY-only legacy implementation validator with explicit DEGRADED policy; do not manufacture READY or patch managed guard.
6. Deployment is a separate release decision, not performed here. Five callables asia-southeast1 must be available before new Hosting UI. AppCheck required outside emulator. Existing deny rules protect new review collections. No data migration, mock seeding or financial mutation.
7. Rollback new UI independently; preserve review public projections, private proof, moderation and operation audit. Never delete real reviews to rollback.

Private verification rerun:
- vitest run tests/unit/product-reviews080.test.ts tests/unit/review-retry080.test.ts
- tsc --noEmit; tsc -p functions/tsconfig.json
- playwright test --config tests/browser/fixtures/productdetail080/playwright.config.mjs
- emulator integration harness integration080.mjs retained privately; demo-productdetail080 own ports config, no ADC and no provider writes.

Node22 deployment runtime, real Google auth/AppCheck, full integration, live catalog/orders/payments and production behavior NOT_TESTED.

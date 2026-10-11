# Real scenarios v2 — local fixes verified, full acceptance BLOCKED

Written **95 realistic Given/When/Then scenarios** covering mixed cart, researched
price, upfront payment, recipients, provider methods, proof/IPN, exact amounts,
leases, concurrency, sourcing balances, private receipts, failures and resources.
See [SCENARIOS.md](SCENARIOS.md) and its exact test mappings in
[SCENARIOS.json](SCENARIOS.json): **87 PASSED_LOCAL, 8 NOT_RUN**. These are scenario
mappings, not 87 separate authenticated browser journeys.

## Verified corrections

1. **V2-01, medium:** Date.parse accepted hour 24 and moved the transaction into
   the next calendar day. Three red regressions reproduced it. Validate clock
   components first; valid midnight, last-second, leap-day, ISO offset and
   fractional-millisecond cases still pass. Source:
   packages/domain/purchase-sepay.ts:131.
2. **V2-02, medium:** A confirmed cancellation winning a pay/cancel race made
   repeated reconcile fail. The unchanged HTTP suite caught it and a deterministic
   emulator regression reproduced it. Trusted, unpaid cancellation replay now
   returns the same result without changing version, cart revision or a newer
   active cart. Wrong links remain rejected. Source:
   functions/src/purchase-settlement.ts:185.

No auth, provider trust, amount validation, financial allocation or fulfillment
hold was weakened. No schema/API/dependency/migration or product design changed.
Earlier reports in the parent directory are historical and are not overwritten.

## Executed checks

| Check | Current result | Evidence |
|---|---|---|
| Unit | 329 passing tests, 12 files | evidence/unit-final.json |
| Emulator integration/private rules/orphan receipts | 39 passing tests, 3 files | evidence/integration-final.json |
| Synthetic HTTP payment gateway | 69 passing checks, 171 HTTP calls | evidence/GATEWAY-SCENARIOS-E2E.json |
| Mixed-cart → sourcing/final balance → PDF business regression | 17 passing checks | evidence/business-results.json |
| Full frontend typecheck + backend compilation | PASSED after concurrent test owners corrected typing | evidence/typecheck-final.log |
| Scoped ESLint and Prettier | PASSED | QUALITY-GATES.md; no diagnostics |
| Finite queue/PDF resource probe | 3,200 operations, 1,600 expected failures; 50 PDFs × 30 lines | evidence/resources.json |

The first HTTP attempt failed on cancellation replay. Its subsequent pass is a
fix verification, not a discarded flaky assertion. Red timestamp and cancellation
outputs are retained in evidence/. New tests also cover missing provider ID,
absent configuration without burning retries, retry exhaustion, stale worker
fencing, nine concurrent reconciliations with one readback, corrupt mixed-cart
snapshots without partial orders, and owner/lock/hash PDF download guards.

HTTP measured p50 **34ms**, p95 **1,455ms**, maximum **2,777ms** on the shared local
emulator. Offline PDF probe produced 634,056 bytes and completed in 191ms total;
post-GC heap delta was 357,992 bytes and external-memory delta 6,252,355 bytes.
These are finite host measurements, not production throughput, SLA, improvement
or leak-free proof.

## Remaining checks and risks

- Current authenticated payment-route pointer/keyboard/mobile/offline/account
  switch acceptance is NOT_RUN. CUA denied access; no alternate browser, CDP,
  navigation workaround or delegated attempt was used. Unit/SSR/PDF proxies do
  not replace those checks.
- Target Node **22** is NOT_RUN. Host tests used Node **25.9.0**; the bundled
  dependency runtime is Node **24.19.0**, so neither certifies Node22.
- Google Cloud Storage's teeny-request stream emitted four listener warnings,
  reproduced with stack traces. The stack points to its PassThrough/pipeline
  path; it does not establish an application leak or safe long-run behavior.
  No warning suppression or speculative dependency patch was introduced. Target
  runtime stream/soak validation is still required.
- Actual SePay hosted checkout/readback → public HTTPS IPN, real email delivery
  and production load/observability are NOT_RUN, deferred under the local-first
  decision. Synthetic provider tests cannot certify them.

## Source, coordination and runtime

HEAD: `0d6e721698608eebb36b0b2f68021c3054d97d1c`; worktree remains dirty with
unrelated concurrent WIP. [SOURCE-MANIFEST.json](SOURCE-MANIFEST.json) pins the
explicit 51-file payment candidate. [FRESHNESS.json](FRESHNESS.json) records its
current comparison. This is not certification of every file in the repository.
Repository intelligence stayed DEGRADED after one successful incremental
refresh; CodeGraph then CocoIndex were queried and critical facts verified in
source.

Related chats received actionable compile/ownership conflicts using the human's
existing synchronization authority. Their test corrections restored full
typecheck. Their notification/selector/source ownership was preserved. No new
agent, server or emulator was started. Shared frontend PID12137/port5207 and the
existing demo-satsunicgo backend were reused. Runtime SePay activation remains
disabled; only test processes inject synthetic signing keys/adapters. No real
secret value was retrieved, real payment/email made, public IPN/deployment run,
or commit/push performed in this local-first phase.

Demo export completed with Auth/Firestore/Storage metadata verified at
/private/tmp/satsunicgo-shared5207/export; see [EXPORT.json](EXPORT.json). This
preserves current demo state and does not claim all concurrent writers were quiet.

## Completion report

- Review: **BLOCKED**, three current cycles; both actionable reproduced defects
  are FIXED_VERIFIED. See [FINAL-REVIEW.json](FINAL-REVIEW.json).
- Production readiness: **NOT_READY**. Required UI/product/runtime/provider
  evidence is missing; local checks are not promoted to production proof.
- Weighted progress: **Unavailable**. No approved criterion weights or native
  runtime ledger exist; the 87/95 scenario mapping is not a completion percentage.
- Native ai-agent-kit review/task ledger: **NOT_RUN**, CLI unavailable. These
  files are an explicit fallback, not a native runtime receipt.
- Token usage: **Unavailable**. API-equivalent cost and actual billed cost:
  **Unavailable**.
- Memory candidates: **None**. No memory changes made.

## Reproduction

Run unit/typecheck normally. Integration and HTTP scripts require the existing
approved shared demo; do not start or reset a runtime automatically:

```sh
npm run typecheck
npx vitest run tests/unit/purchase-*.test.ts tests/unit/customer-emails.test.ts tests/unit/email-delivery-security.test.ts
GCLOUD_PROJECT=demo-satsunicgo FIRESTORE_EMULATOR_HOST=127.0.0.1:18207 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:19207 FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:19208 FUNCTIONS_EMULATOR=true npx vitest run --config scripts/purchase-sepay-rules.config.mjs
GCLOUD_PROJECT=demo-satsunicgo FIRESTORE_EMULATOR_HOST=127.0.0.1:18207 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:19207 FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:19208 FUNCTIONS_EMULATOR=true node scripts/purchase-sepay-real-scenarios.mjs
```

The latter runner preserves historical artifacts and writes fresh synthetic
results under output/sepay-sandbox-20261009/real-v2. It does not reset shared
settings/data or call a real provider.

# Profile recovery client endpoint correction

Current approved delta: `CI-RULES-DELTA-PLAN.md` SHA256 `a39b4df4d676dd1b6fc014a01052f406eb67a4ca7e7185762c0b407c04af2f34`, read before editing, rooted in direct human release and existing fix/review authority. Intelligence **DEGRADED**, bounded actual-source validation. No app/API/CI/dependency/guard change.

## Source-confirmed failure and correction

The existing server-only permission test initialized its client Firestore at hardcoded127.0.0.1:18207 (preimage line305), while CI baseline `scripts/emulator-test.mjs:45` configures Admin127.0.0.1:8181. Root's failed run37885468606 reported unavailable instead of permission-denied and skipped build/deploy. This worker independently verified the endpoint mismatch in current source; did not execute or reinterpret a live CI failure as a passing rules test.

Changed only `tests/rules/profile-recovery.test.ts`: import existing `demoFirestoreEndpoint` from `tests/helpers/demo-environment.ts`, then use `firestore: demoFirestoreEndpoint(process.env)`. This existing helper rejects non-demo GCLOUD_PROJECT, missing/false FUNCTIONS_EMULATOR, remote/unapproved targets, and returns the exact approved loopback8181or18207 port. No fallback or new emulator permitted. Existing ask-approved-knowledge rules fixture already uses this pattern.

Preserved exact native `assertFails(getDoc(...))` and `assertFails(setDoc(...))` for both server-only recovery fences and quota, OWNER identity, original operation/correlation, all assertions in every other test, and `finally { await env.cleanup(); }`. No rules replacement supplied to initializeTestEnvironment. No timeout/retry/skip/error relaxation, no generated file, production or private-data change.

## Immutable receipts

- Before owned fixture: `fccba8ed4e9416260392010cfd2e556b5e7b81caa3c663e7983007bb5cd6e8f7`
- Frozen successor: `e3aa05ef8ebb271e28214c0570206bfaab0ad5b87873b7ade0f72b892dda44ed`
- Unchanged endpoint helper: `bdf216c820414088a34097ae7701ca0a4b202c408913248ecfb85670344d6313`

## Bounded validation and fresh review

Existing pure `tests/unit/demo-environment.test.ts`: **4/4 PASS**, including exact8181/18207 derivation and fail-closed target/project restrictions; Node22 v22.23.3, process exit0. Scoped ESLint exit0, `git diff --check` PASS, TypeScript source parser zero diagnostics. Reversing exactly the import and endpoint expression recovers the indexed baseline byte-for-byte: all permission/financial/private/recovery assertions and cleanup remain exact.

```sh
/Users/hunpeo97/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin/node node_modules/vitest/vitest.mjs run tests/unit/demo-environment.test.ts --maxWorkers=1
/Users/hunpeo97/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin/node node_modules/eslint/bin/eslint.js tests/rules/profile-recovery.test.ts
git diff --check -- tests/rules/profile-recovery.test.ts
```

Actual emulator permission assertions **NOT_RUN locally by this worker** under the no-runtime/data lease. Pure helper tests are not emulator authorization proof. Root owns isolated four-file compile/checks, independent delta review, new source fence, Git and rerun of unchanged CI rules/HTTP/restore/build/deploy gates. No shared runtime/server restart/reseed/new emulator, provider call, production write or Git stage/commit/push by this worker. No user-facing language change; Product Language UI gate not applicable to this internal fixture correction. Whole release/production status remains pending root evidence. Source/report lease **RELEASED** after this receipt; no further writes. Token/cost totals unavailable; no paid calls. Memory candidates: None.

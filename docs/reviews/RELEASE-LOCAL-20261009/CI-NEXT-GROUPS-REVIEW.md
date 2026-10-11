# Read-only review of the remaining CI groups

Immutable source target: committed `5c7e867572d1973ff398a854354bc174cd63039b`. Intelligence **DEGRADED**; bounded Git blob/source reads only. Shared/payment/purchase WIP was not inspected as delivered source and was not changed. Root reports CI37888720044 baseline602/purchase5 passed, cart failed its Zod pick; that active separate fix is outside this review.

**No additional demonstrated next-group blocker found in the bounded review.** This is not a prediction that pilot/delivery/HTTP/restore pass: every test/runtime/provider check is **NOT_RUN** by this reviewer. One low-priority source-defined fixture reliability risk is recorded below, without claiming it caused the current CI failure.

## Source-confirmed prerequisite compatibility

1. Dedicated groups: `scripts/release/test-integrations.mjs:8–23` maps pilot to demo-satsunicgo-ask106-ci /18207 and delivery to demo-satsunicgo /8187; `ci-emulator-setup.ts:2–15` requires the same project/port plus9199 Auth, exact emulator and GitHub flags. Each group spawns a separate Firebase/Vitest process; dedicated fixtures excluded from baseline by vitest config. The setup file does not initialize Admin. Pilot beforeAll creates its own default Admin app; workspace module gets Firestore in handlers rather than initializing an app. Delivery checks no prior default app, creates a unique demo-eta064 project, then dynamically imports handlers. Runner singleProjectMode:false supports that intentional secondary demo namespace. No direct `.pick`, `.extend` or `.merge` operation occurs in the inspected pilot/delivery or HTTP/restore fixture files; transitive runtime dependency compatibility remains untested.
2. Pilot pricing: enabling test intentionally has no recent MFA; committed workspace:369–375 rejects it with RECENT_MFA_REQUIRED before provider verification. The disable branch checks provider readiness only when payload.enabled is true (workspace:465); an expired reviewed pricing window is not a demonstrated prerequisite failure for these three tests. Preserve the expiry/MFA/provider/budget controls; no test clock or production pricing extension is proposed.
3. HTTP: `callable.mjs:15–19` requires Auth9198 /Firestore8181 /Functions5101 and demo project; committed firebase.json and emulator-test.mjs default config match. CI typecheck precedes the HTTP step and builds Functions lib, satisfying analytics.mjs's compiled domain import. Analytics callable/Firestore worker exports exist in committed index. Actual Auth claims, SDK transport, trigger startup/ordering, generated deployment metadata and60-second eventual results remain runtime unknowns.
4. Public HTML: callable:118 requires a module asset entry. `functions/generated/public-assets.json` exists in the commit with a valid /assets/...js entry; public.ts reads it from generated/ or functions/generated/. Thus no source-backed missing-manifest-before-HTTP defect was found even though frontend build is later in CI. This HTML assertion does not fetch or prove the hashed asset, hosting availability or a deployment; root's fresh immutable build/artifact gate is still needed.
5. Restore: default fixture branch requires demo-satsunicgo /Firestore8181 /Storage9298 (`restore-fixture.mjs:8–17`), matching firebase.json and emulator-test.mjs:41–68. Runner performs write/export then verify/import in separate emulator invocations. The optional dedicated restore021 branch is not selected by the committed CI workflow. Export contents, Storage SDK behavior and clean emulator shutdown are runtime unknowns.

## Low reliability risk: UTC rollover in HTTP analytics fixture

Location `tests/http/analytics.mjs:45,57,62,68–74`. Events/payments are recorded with their earlier Date.now timestamps, but the dashboard range later starts at the *current* UTC day boundary. If an otherwise valid fixture spans UTC midnight, that range excludes its earlier-day views/questions/clicks or payment. Committed dashboard-analytics.ts:112–118 constructs only requested UTC days and ignores rows outside them. This can invalidate exact-one assertions while correctly exercising production behavior.

Severity **LOW / fixture reliability**, source-bound conditional flow, **NOT_REPRODUCED** and no current-CI failure claim. A separately planned minimal fixture correction could anchor `from` to the UTC day containing the fixture's captured policy/event start while keeping `until` current; retain exact counts and security/trigger assertions. Do not relax counts, alter application aggregation, fake a global clock or increase timeout. Root owns whether to schedule this bounded delta; no edit made.

## Immutable source receipts (SHA256 of committed Git blobs)

| Path | SHA256 |
| --- | --- |
| `scripts/release/test-integrations.mjs` | `ee3af018dca8897fd9fbfe92d12b732fe075ad9fb18cd6de7095115c82a02c21` |
| `vitest.ci.rules.config.mjs` | `0f2c6d0e3022933f6b166297ccac1871c1a14c8eff3a0ef56eb3a81bcd73bbea` |
| `tests/helpers/ci-emulator-setup.ts` | `430cab711297e841dfa62a9e3fdc0a21d6296fce96476216c669b164a8bbf9ad` |
| `tests/rules/ask-pilot106.test.ts` | `2299979006a6ab7ac79f95c0c68d6d7f5a1465ffb01f4554479de6e950c94108` |
| `tests/rules/manual-delivery-estimate064.test.ts` | `7e4cfe8ad839205d9726eaf49a79c0ffce410a74051bf600efb57817f88bf303` |
| `scripts/emulator-test.mjs` | `7fdc8e448855ae61cc717e8a16b71000fa4ee00669c840e871625e9f8e8ec91c` |
| `tests/http/callable.mjs` | `620c0a5ad92b3e832d409264c62c2baed07c2d15292f5f2e18c57e1b9f2f35e6` |
| `tests/http/analytics.mjs` | `a7b62d5b05fa8c0d5cb42954861ff3a9d931f0cd1ec2c3d5935ec633c528d610` |
| `tests/http/restore-fixture.mjs` | `58b9a1ff2647d05b0cc8c574962aac64cc2c97806f84d58884e9c9016a7f429d` |
| `firebase.json` | `8c3f8e1e73b8aee68c13c0348c8ef01bfdc721c760caf38ba8c44cbdd4330e53` |
| `.github/workflows/ci.yml` | `77097b3d4f923979e9bcb4a91a849749e58f75ec286eb3ae355a161d7ff23795` |
| `functions/generated/public-assets.json` | `b32ecb8291183ceea7ed79168278cca4a00b399826a8dec62e11fbb04fbd17f3` |

Read-only lease **RELEASED**. Only this optional local report was written. No module/runtime imports, tests, commands that run services, browser/emulator/provider/network action, source/fixture/CI/dependency/Git mutation or WIP adoption. No formal QA/Product Language/production PASS; existing final quality/release checks remain root-owned. No memory update/candidate. Token/cost totals unavailable; no paid calls.

# Guard-preserving release delivery delta

Authority: the current direct human request to commit/push all local code and enable necessary production prerequisites, root's scoped assignment following TL confirmation, and existing `PAYMENT-UPFRONT-20261008/APPROVAL-V3.md` approval for guarded demo payment and `functions/assets/**`. This correction delivers already approved code/assets; it does not enable live payment, customer AI, TTL, feedback cleanup or new business policy. Repository intelligence remains DEGRADED under the shared source-verified brief. No additional index refresh is needed.

Ownership: backend agent writes only `scripts/release/preflight.mjs`, `scripts/release/artifact.mjs`, `tests/unit/release-preflight067.test.ts`, `tests/unit/release108.test.mjs` plus this requested plan. Root owns other release paths/execution and FE owns acknowledgement changes. Preserve all concurrent WIP. No providers, secrets, installs, production/emulator data, runtime restart, Git stage/push or capability activation.

## Before/current evidence

Source `functions/src/index.ts:549-550` imports `purchaseDemoPayment as guardedPurchaseDemoPayment` from `./purchase-checkout` and exports a const with exact `process.env.FUNCTIONS_EMULATOR === "true" ? guardedPurchaseDemoPayment : undefined`. Existing preflight only resolves direct SDK calls/reexports, so this exact safe conditional causes FUNCTION_INVENTORY_INVALID. The handler still independently requires emulator/demo project/config/database and exact local18207 (`purchase-checkout.ts:71-86,411-418`). No handler edits are assigned.

Current compiled entry uses `const purchase_checkout_2 = require("./purchase-checkout")` and `exports.purchaseDemoPayment = process.env.FUNCTIONS_EMULATOR === "true" ? purchase_checkout_2.purchaseDemoPayment : undefined`. Inventory omission alone would leave a callable reachable if an environment flag were mistakenly present. Packaging must deterministically remove the exact assignment and its dedicated import, while rejecting unsupported shapes rather than inferring runtime conditions.

`artifact.mjs:178-182` copies lib/public-assets/package/lock only. `purchase-pdf.ts:36-48` resolves compiled ../../../assets/NotoSans-Regular.ttf; current artifact omits that asset, its OFL license and the approved region directory. They are existing regular public runtime files; no new asset/provider fetch is needed.

Preimages SHA256:

```text
2f80ce7fcd20963be28c814f948a6d0dad3534d987630ef31a48476cc43eb57c scripts/release/preflight.mjs
99b349c8c417e9dba83e02265cfb6ba119041c1177fafa95b6ce99e10cc95364 scripts/release/artifact.mjs
e6081cc47b0874c8d30ecff04a228249044e5e2dbdc5c7024ea0f4a3491edfc5 tests/unit/release-preflight067.test.ts
529b03d643466e6fd5ca48a2c0e307480c88a36a823494c66f13816addae0eea tests/unit/release108.test.mjs
b85c38ecea8a7cfb39c24e395a4007474fa5a4fc864f6ee33309eb4948d232d5 functions/assets/NotoSans-Regular.ttf
0dab92d0544f7b233403f14b84a663bdbfa746982eda629e7f4f9ffe1b036feb functions/assets/NotoSans-LICENSE.txt
a78ea86c58ba8ad19c1c305aebaafedf688b4a4a6c6bd2054eaa2920d2e84b53 functions/assets/purchase-vn-regions.json
```

## Exact file/function delta and resulting flow

1. `preflight.mjs`: admit only the existing entry-point export/name/import/const/equality/branches. Require unshadowed process/undefined, immutable imported/target bindings, recognized SDK onCall and exact region. Record distinct `emulatorOnlyExports` metadata; production inventory retains every other export. Any changed condition/branch, alias, duplicate, mutable declaration, target mutation, unsupported SDK or region fails closed. Do not add generic conditional support or import runtime modules.
2. `artifact.mjs`: independently recognize the known compiled const-relative-require alias and exact export conditional. Validate source-bound emulator-only metadata, reject shadowed globals, mutable/escaped alias, duplicate assignments, computed/direct/reexport/object export variants and unsupported shapes. Remove the assignment and dedicated import before existing production holds; harmless compiler void0 declarations cannot expose a Function. Keep the existing eight heldExports unchanged. Copy precisely the three required assets after rejecting symlinked parent/file, missing/nonregular/oversized files; manifest file equality/hashing then covers them. No rules/indexes/TTL deployment expansion.
3. `release-preflight067.test.ts`: preserve existing tests; add exact positive inventory case with independently validated target plus negative condition/branches/shadow/mutation/alias/duplicate/region/SDK oracles. Each negative must produce failed inventory rather than disappear.
4. `release108.test.mjs`: fixture includes required assets; retain existing integrity/holds/provider-mock tests. Add isolated compiled exclusion execution under emulator env, strict malformed-shape negatives, required asset absence/symlink rejection and hash-tamper checks. Compile only the local pure PDF renderer in an owned temporary fixture, package it with the actual assets, run it from artifact-only paths without any shared source/font fallback and inspect PDF Unicode/font output. Preserve the existing OFL file bytes.

Flow: source inventory → exact demo-only admission/exclusion metadata → safe asset copy → compiled demo exclusion → unchanged eight holds → immutable manifest/hash equality → existing deployment workflow/provider readback. No activation or public handler contract changes.

## Validation and review

Tooling: JavaScript ES modules/TypeScript6, Node22, Vitest4 and node:test; selected profiles typescript-javascript/devops/universal. Product Language Gate NOT_APPLICABLE: no displayed UI/copy/meaning changes. Focused preflight units and complete release108 contracts, affected lint/syntax, pure PDF isolated compile/render and current source preflight are authorized. Use installed Node22/dependencies only; no installs or broad app build/emulators/providers. Existing artifact test uses offline lock resolution; this is not dependency installation. Root owns broad current source compiler/build/tests and final independent review.

Negative boundaries: conditions cannot become generic environment admission; production env cannot expose demo callable; source/compiled metadata disagreement cannot pass; wrong target/region/binding/export shape cannot pass; required assets cannot be omitted, traversed or symlinked; tampered or extra artifact bytes remain rejected; eight holds and unavailable production payments remain unchanged. Asset copy adds bounded ~703KiB public runtime inputs. Failures halt packaging and retain all source/runtime work; no data rollback is necessary. Freeze exact successor hashes and report checks/limitations, then release writer/test lease for root's independent review. Production remains NOT_READY until the broader release and provider gates pass.

## Implementer verification and frozen handoff

Executed with installed Node22.23.3; final commands exited0:

- `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY='' <Node22> node_modules/vitest/vitest.mjs run tests/unit/release-preflight067.test.ts --pool=threads --maxWorkers=1 --reporter=json --outputFile=<temporary evidence>/preflight-frozen.json`: **75/75 PASS**.
- `PATH=<Node22 bin>:$PATH <Node22> --test tests/unit/release108.test.mjs`: **71/71 PASS**, zero failures/skips/retries. Includes real artifact fixture creation, mandatory assets/hash integrity, executable compiled exclusion under emulator env, isolated compiled PDF Unicode extraction/determinism and missing-font failure. Existing provider/GitHub tests use local fixtures/mocks only.
- `<Node22> node_modules/eslint/bin/eslint.js scripts/release/preflight.mjs scripts/release/artifact.mjs tests/unit/release-preflight067.test.ts tests/unit/release108.test.mjs`: **PASS**, no diagnostics.
- Pure current-source preflight/compiled filtering/allowlisted asset copy: **PASS**,102 source inventory entries,94 after unchanged8 holds, purchaseDemoPayment separately excluded. All three asset bytes match approved source. Compiled-library freshness remains **UNVERIFIED_NO_SOURCE_BUILD_MANIFEST**; this is a bounded static packaging check, not a fresh broad build or production receipt.

Review/fix cycles: initial focused71+71 checks passed; implementer review strengthened direct/duplicate export rejection, asset shape/size and actual Unicode extraction; final review caught type-only SDK import admission and added exact rejection. The frozen75+71 and lint checks above cover the final source. An initial shell receipt wrapper incorrectly used zsh's read-only `status` variable; it was corrected, and the final actual command exit codes above are0. No control/oracle/timeout was weakened.

Frozen SHA256:

```text
355ec191fac9f5ed509135ed74cd26ed0975e4e493d02292245a8e406319b283 scripts/release/preflight.mjs
7ddb6f796a48f82a6f24bdbab3eb4f2bccc2f325c314591b63c00385a3a9f112 scripts/release/artifact.mjs
f02133a8acf350df9113be63f3b351c6961fa3f5f76c115cdd6c3fd97b7904a0 tests/unit/release-preflight067.test.ts
d80783b8995e331d6a6bc05a45e2ecdd06d04cb4122f6e7e2e7cb718db5ae7c9 tests/unit/release108.test.mjs
60f0e3b406c1046181efa638163c309a01ad9330b4e22748169217f4bd46b167 functions/src/index.ts (unchanged)
00edf99aba78f2723d30bae8f2b5ddfa5635a63f6185201d7147869be62db1cc functions/src/purchase-checkout.ts (unchanged)
82dc7d98a193f4431ea1fdd9dadab777329501ecaf2a987a47763e53110e7a96 functions/src/provider-release-gate.ts (unchanged)
036cd9e7d9f384c1dd454227aa4c24ee42333af65e4f3815e7b7c3c5c483c44d functions/src/purchase-pdf.ts (unchanged)
```

Evidence directory: `/private/tmp/satsunicgo-release-prerequisite-verification-20261009/`. Final receipts:

```text
e7c687440afdf2e97b9277799c7ba757de16dd3e931341b583c1286fa8e0971c preflight-frozen.json
121c16e2d67fa82b0ffe4b148d3bfec7564e809117533a5cfbeb345358a7a1ff preflight-frozen.log
151e1a40a9055891d73376b3c5cc67f156d6c5d6c9704db3d43462751ae9c77c release108-frozen.log
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 lint-frozen.log
12698123042c70863bd68d7822fd663490b4f2c2af0d362884aad9f960703e8b source-packaging.json
```

`current-owned-files.patch` is the complete current Git diff for assigned files, including preserved prior WIP; it is not claimed to isolate only this successor delta. Before/after hashes bind this scoped correction.

Implementer dimensions reviewed: approval match, compatibility with preflight/artifact consumers, guards/credentials/privacy, mutable/shadowed/invalid/duplicate/non-success paths, bounded resource use, byte integrity and fail-closed operator errors. Product language/database migration/runtime activation are NOT_APPLICABLE to this delta. Broad compilation/build/integration and production/provider checks are NOT_RUN by this agent and remain root-owned. Mandatory fresh independent final review is **PENDING root/TL**, so this is an implementation/evidence handoff, not final release approval. No paid calls/cost estimate; existing reserved budget unchanged. Memory candidates: None. Writer/test/runtime lease **RELEASED** after this frozen handoff.

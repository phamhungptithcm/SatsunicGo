# Frontend merge decisions

Concrete integration plan/receipt for the six assigned files, under the human-requested normal main delivery and `RELEASE-LOCAL-20261009/PLAN.md` step 3. Intelligence **DEGRADED**, actual index base/local/upstream source verified through bounded Git/source reads. No new feature, copy, provider activation or Ask r3 integration. Root owns stage/commit, other paths and runtime. This document is saved before resolving the assigned source conflicts.

## Decisions

1. `Ask.tsx`: keep local readonly/history retry guards, `suppliedText` vs normalized command/follow-up text, auth-generation/cancellation fences, immutable review and verified button-confirm persistence. Preserve the upstream logical analytics retry identity in the turn and retry callback. Both sides independently inserted `trackAsk` imports, turn property, local turn ID and accepted-question instrumentation in different locations; automatic merge duplicates these outside the conflict markers. Retain one import/property/identity and one question-only tracking branch. The local branch additionally excludes draft-edit commands and catalog command branches already return before it, preserving upstream's distinction between accepted questions and commerce confirmations. Do not count command receipts as new question turns.
2. `CatalogSearch.tsx`: retain local ordinal labels and onResults/WebResearch/cancel/read-only behavior, together with the existing upstream `data-analytics-product` link and `trackProduct` button instrumentation. The label conflict concerns formatting/ordinal text, not a choice between tracking and current catalog selection.
3. `Commerce.tsx`: retain local `unknown` response admission, exact stored pending-envelope capture, `admitAskRecoveryResult` and original operation/version/order binding. Both successful new orders and verified recovered order IDs retain `linkAnalyticsOrder`. Retire only the stored operation matching the captured original; do not replace this with upstream's unchecked JSON/typed-response recovery. Preserve queue-time readiness/version/auth/UUID fences and all new financial acknowledgements elsewhere.
4. `PrivacyPage.tsx`: retain the delivered local instruction to reopen the Privacy page and select the existing stop-collection control. This matches the compact local consent's privacy-page reopening behavior. Do not claim the upstream always-visible “Quyền thống kê” launcher exists in this selected local layout. All other privacy text remains as delivered; no retention-policy invention.
5. `AnalyticsConsent.tsx`: preserve local compact floating card, Ask collision positioning, focus return, privacy-page settings entry and pre-auth visible choice. Source comparison proves the storage/choice synchronization, navigation/product tracking and teardown effect block is identical in both stage-2 and stage-3 sources. Network tracking remains behind `ready`; presenting a choice before auth readiness is retained. No `expanded` layout migration or new strings.
6. `analytics-consent.css`: preserve the current delivered local compact card/focus/mobile styling, rather than returning to upstream's wide in-flow panel/settings launcher. This restores the selected visual revision without redesigning Ask or adding controls.

Resolution uses individual conflict blocks in the current merged files, preserving non-conflicting merged content, followed by removal of the verified duplicate analytics insertions. No whole-side checkout, reset, Git stage/commit or unrelated edit.

## Stage source receipts (SHA-256)

| File | Base (stage 1) | Local (stage 2) | Upstream (stage 3) |
| --- | --- | --- | --- |
| `Ask.tsx` | `397b8a2722dabb8368e89bf23ff8efcb6a06c7b5f6ced1ca18dbed303eb69428` | `5cf41d6ebc3815c3e5648aa1d11ceabc6d6f9a681998a8013cd24fd56ceecd73` | `aa98c6f5cdff6d32c40d71015dc2a7c37489fa86c4fa5d3b235c8255dc242e64` |
| `CatalogSearch.tsx` | `080c2bd851ea40ab6de6e24c8bf11871a9319772581daf87da1c0c2010b9fff9` | `ddb17f9b67910322962c9f76da4f875e67b7f203d89e309f2c9e755e6faecd19` | `d99fd5e66811c925a34ee8be1acb0dabfecaf09e0335e3f7d9e9b4a596e00286` |
| `Commerce.tsx` | `4e88dfae5964a37bcd9f6d6cba9463b514f35087067bbe3fc61296b37f653cbf` | `6b5f8e3823d584f281bed59f00c35a32654669dcf5254ca3f77750a9cf5b7c55` | `e5df078a4be0b71eb86f353d40ba3232b431b848a333242cae33cce17c3c4fc6` |
| `PrivacyPage.tsx` | `dfb4d27774450db4b266025d04ad3169793224a6b49ecae6e0a3d4f6437dc836` | `56373243f664731e5fb27f0cb2842867f1e0deefc02e1b09be9af561a76e19fc` | `7af303d3bd832c3e2c72c2d7327177632add0c87dac4c08f7e42779862d88ea1` |
| `AnalyticsConsent.tsx` | absent (add/add) | `a1cb8476a5a693f5334c8e159cc7959a0cfc831e271057e4a56acfd37d5405d4` | `d59d5cb0929bf1131631482db8ff9620a24e2c8fccedccfd932e8d595d22d7b3` |
| `analytics-consent.css` | absent (add/add) | `55c58f1ffea58e16102654b2509131cc2543df204b81337f5b7610297d4584df` | `045a8b507b9928baa7edc3b435af207857a17eef88b590ae4d98a9cf82790ab6` |

## Frozen resolution receipt

Local HEAD `74ddddb02d19e49c88c1a7bc698c02320c1a4173`; upstream MERGE_HEAD `73dc7d51cffd89ea2e62d2ee16b3f3ec5ccf2a36`. Individual reviewed marker blocks resolved and the four automatic duplicate Ask insertions removed. The six final files are byte-identical to their stage-2 source, confirmed by exact content comparison. This is expected: local already incorporated the upstream analytics identity/calls, while the differing sections retain the stronger local guards and selected compact consent UI. No non-conflicting upstream instrumentation was lost.

| Final path | SHA-256 |
| --- | --- |
| `src/features/ask/Ask.tsx` | `5cf41d6ebc3815c3e5648aa1d11ceabc6d6f9a681998a8013cd24fd56ceecd73` |
| `src/features/ask/CatalogSearch.tsx` | `ddb17f9b67910322962c9f76da4f875e67b7f203d89e309f2c9e755e6faecd19` |
| `src/features/ask/Commerce.tsx` | `6b5f8e3823d584f281bed59f00c35a32654669dcf5254ca3f77750a9cf5b7c55` |
| `src/features/content/PrivacyPage.tsx` | `56373243f664731e5fb27f0cb2842867f1e0deefc02e1b09be9af561a76e19fc` |
| `src/shared/AnalyticsConsent.tsx` | `a1cb8476a5a693f5334c8e159cc7959a0cfc831e271057e4a56acfd37d5405d4` |
| `src/shared/analytics-consent.css` | `55c58f1ffea58e16102654b2509131cc2543df204b81337f5b7610297d4584df` |

Bounded validation: **PASS** for zero conflict markers in the six paths, `git diff --check -- <six owned paths>`, installed TypeScript TSX parser diagnostics (five TSX sources, zero diagnostics), and explicit source counts (one `trackAsk` import, turn property, logical retry identity declaration and accepted-question call; two Commerce order-link calls). Current source readback confirms consent tracking returns before `ready`, public-page gating remains, choice may appear before auth resolves, and local recovery admits against the exact original pending envelope before retiring it. These source checks do not substitute for semantic compilation or runtime assertions.

Unit/browser/build/lint/provider/production validation **NOT_RUN by this merge writer**; root owns merged-tree validation and independent review. No application runtime, provider call, new test, source outside the six paths, stage, commit or Git index mutation. Git status remains unmerged until root stages the resolved files. No new user-facing string or r3 layout integration. Source/report write lease **RELEASED** after this receipt. Memory candidates: None.

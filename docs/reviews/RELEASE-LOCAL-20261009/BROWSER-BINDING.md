# Current browser acceptance and runtime source binding

Target HEAD `21a1acc129359866bdef50236a3eea1a3606230d`; SOURCE-FENCE SHA256 `43d8ef6019eedd79ae24d659e020c3aad4bf2c18f2d522c6ceba57b0e4a9bd7e`, 3136 selected source entries / zero candidate mismatches. Intelligence **DEGRADED**. This worker did not re-certify all 3136 files at runtime: only actually loaded source-map content below was compared. Concurrent dirty WIP stays excluded from the selected fence.

Tier **MOCKED_SHARED_FRONTEND**. Full suite: **139 passed, 0 failed, 0 skipped, 0 flaky**, process exit 0; duration159.274 seconds. Executed once using shared5207 and existing dependencies, no server restart, extra frontend/emulator, provider call or repository source/test/.git edit. Temp cwd retained all original screenshot/result writes under `/private/tmp/satsunicgo-release-local-browser-bound-20261009`.

Overall runtime source binding: **NOT_VERIFIED for all modules**, because CSS responses have no inline source maps and fixtures intentionally replace/modify selected module responses. Mapped actual source subset: **3773 MATCH records, 58 distinct source paths, zero mismatches**. Do not promote passing assertions or this subset binding to all-module/provider/customer/production/native AT acceptance.

## Spec fidelity and counts

Each copied spec has exactly one change: `from "@playwright/test"` → `from "./binding-adapter"`. Reverse-import comparison recovers every original byte. Original SHA256 matches the SOURCE-FENCE; originals and copied bodies stayed stable after the entire run. No route, assertion, timeout, retry, fixture state or scenario modification. Config preserves the same nine specs, worker1, retries0 and shared5207; reporting/output are temporary. Adapter extends only the page fixture, observes context responses (including fixture-created second tabs) and awaits pending hash jobs before fixture teardown.

| Spec | Passing cases | Original SHA256 | Instrumented copy SHA256 |
| --- | --- | --- | --- |
| `ask-platform.spec.ts` | 5 | `b8c0678513d7e48b373b7988db7e5b7292f933fc27123d9f67e99a5c33867202` | `c4c15f77512a9c61b5c01944b9d1c8e76e57080b9a3bc08fc6b0efb1c8351d1f` |
| `ask-chat-draft.spec.ts` | 12 | `b97d3ab48f6dc1f7eedfc4f94d749cfd3cb5570e1927d7b1c460108302bee6cc` | `7e376e68b94b1e47a0b830dd310b1aadf34a500ba579d5fa89b6c7bb48bd75da` |
| `ask-catalog-chat.spec.ts` | 24 | `dfb0d72ac23f715b5d985877b3e68676ea78c0dc2026e654bdb3575df9e75574` | `b5fb966b1b4576efd717be73a8e9788ffd6f34693d08c7d929bba3febb64e05d` |
| `ask109.spec.ts` | 8 | `af05f307c4d0508132ad745acf65215bef7af56b88b2697e84457fcd4efd35f3` | `47305a11d70fb77e3058d79862fb8d593b1324492b1777b8161c93518d9d53e4` |
| `knowledge-approval.spec.ts` | 6 | `94f67e40bf3cda24430fb8227ed79f013a7f9433c95eb383054c749d16a10538` | `559dad3e67056e70b86e6c0ee757e81a99767a7554afbeb24b1593dbbb98e991` |
| `profile-recovery.spec.ts` | 12 | `3b71fc315905f680a23d515d65c23c49b8825ba7b7511a996481aba473ff58e5` | `c0f847f6efbd55567fdaca9e82c9b520dba4241876f76deffaa5d7a3e63e84bf` |
| `membership-workspace.spec.ts` | 29 | `e836b8d1b01b0bb16d0fddc59cdd377dbfb7dd93a896f3e22f9d48d0863a4d8b` | `e65a5377000f2fbf0c92f48fc656b434f43b2c091e5cd7101a479a6a38c4b940` |
| `ask-research-feedback.spec.ts` | 25 | `dbad1d5505960074f3549c6c8ea70764d5637130dc7e83ec33b815d792dbf872` | `872df213679151ff9e2ed14ce151296af89d59992fb9dbde8484ac58cd5c11a2` |
| `ask-integration.spec.ts` | 18 | `60ba9bc9a3765523690ddc1ea4a1e268ace4a2ae8d3d68571ca6642e5dc463f6` | `2820e65a1328aca28fde37150745ba4ac27fe3c4397774529d54018cc08d88b0` |

Integration count18 comprises ten web modes, one refreshed-expiry scenario and seven separate feedback-review modes. Catalog24, Membership29 and Profile12 retain ownership, input/payload, immutable UUID/unknown recovery, current task fences and at-most-once assertions.

## Observer evidence and gaps

For actual local5207 `/src` and `/packages` response modules, the adapter transiently decodes inline source-map `sourcesContent`, canonicalizes source paths, hashes UTF-8 source content and compares against the immutable fence copy. It persists paths/hashes/status only; no response body, query value, response config or private field value is retained in observer records. Literal routes are passively classified from unchanged fixture source; a transformed response retaining an old source map is not credited as unmodified execution. No route interception or request was added by the adapter.

- `MATCH`:3773 records /58 distinct source paths.
- `MISMATCH`, `NOT_IN_FENCE`, `MISSING_SOURCE_CONTENT`, observer/body/HTTP errors:0.
- `NO_INLINE_SOURCE_MAP`:899 records /12 CSS paths; binding **NOT_VERIFIED**.
- `FIXTURE_ROUTE_NOT_BOUND`:418 records /5 source paths; intentionally mocked or modified, no actual-source execution claim for those responses. Some of these paths also load and match as actual source in other specs; classifications remain per response.

Missing inline-map CSS paths:
- `src/features/ask/ActionWindow.module.css`
- `src/features/ask/Ask.module.css`
- `src/features/ask/Research.module.css`
- `src/features/ask/customer-workspace.css`
- `src/features/operations/operations-workbench.css`
- `src/features/profile/profile.css`
- `src/features/settings/knowledge-approval.css`
- `src/shared/loading.css`
- `src/shared/public-tabs.css`
- `src/shared/step-form.css`
- `src/styles/global.css`
- `src/styles/public-ux.css`

Fixture-routed/modified source paths:
- `src/features/ask/Commerce.tsx`
- `src/features/ask/ImageIntake.tsx`
- `src/features/ask/catalog-search.ts`
- `src/features/ask/transport.ts`
- `src/shared/firebase.ts`

Representative bound source hashes (full58-path inventory in temporary binding-summary.json):

| Source | Actual runtime source-map SHA256 = fence SHA256 |
| --- | --- |
| `src/features/ask/Ask.tsx` | `5cf41d6ebc3815c3e5648aa1d11ceabc6d6f9a681998a8013cd24fd56ceecd73` |
| `src/features/ask/Commerce.tsx` | `6b5f8e3823d584f281bed59f00c35a32654669dcf5254ca3f77750a9cf5b7c55` |
| `src/features/ask/CustomerWorkspace.tsx` | `ee1c9ca83558ec940b0ddbecaf6a381657a50020590e46a53586aa53a6a5e4bf` |
| `src/features/ask/useActionPreview.ts` | `cbf01fb1209a3211070bc54a3acca0c72b8c9932e3535ad8d1b6ccffc1f151b7` |
| `src/features/profile/Profile.tsx` | `5d93d4936216f879fc5f41e982ca340eec6343f1ca8f937e9307656ece78477b` |
| `packages/domain/action-preview.ts` | `6ee6f5edb8912b806deea82ad432768cf319295274cdfe135bb0ef8eb0c73337` |
| `packages/domain/ask-command-result.ts` | `755c4466c50f987cde9255e85636934f92248e30fe1e71278d6f61e3bfb50177` |
| `src/shared/analytics.ts` | `79eac596833602e9d437a80d135e6b1b1af83792c7c2197c8f1ebba5ec9b60c3` |

## Commands and immutable artifacts

Node22 v22.23.3, existing package graph. Chromium needed the already-authorized local macOS IPC sandbox escalation; no production permission or provider action used.

```sh
cd /private/tmp/satsunicgo-release-local-browser-bound-20261009
/Users/hunpeo97/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin/node /Users/hunpeo97/Desktop/Workspace/Coder/SatsunicGo/node_modules/@playwright/test/cli.js test --config=/private/tmp/satsunicgo-release-local-browser-bound-20261009/config.ts
```

All artifact paths below are relative to that temporary directory. No hashes imply provider evidence.

| Artifact | SHA256 |
| --- | --- |
| `source-fence.json` | `43d8ef6019eedd79ae24d659e020c3aad4bf2c18f2d522c6ceba57b0e4a9bd7e` |
| `fixture-copy-receipt.json` | `90fe3b0b51e92062a08091539c7487dd6bebab609578d00ce5018df513116f16` |
| `binding-adapter.ts` | `0e2fc9168d56be7fbcdecbcfb4d311e5a80f0d7ab4d626d2fcfa53f79fafaf9b` |
| `config.ts` | `6915d89692b2083e075b0aff5b1fa375d14c8a1f30f58aeba3abb4592d43e939` |
| `run.log` | `5a377d14e3caa0317afbb099a9fe601bb7aaf810ee4b0035e2f5869fc57fab75` |
| `module-bindings.jsonl` | `756ed5b9d2bebeda8a37624d47e79d77c254d651118b5d6b853dba7401f5adbb` |
| `binding-summary.json` | `db829e5f9232e0d37ca1f4c924aa1a48dbb298a928e25579857e35e4495eb596` |
| `result-summary.json` | `2c65a6bce9c79be01eef179f599c3dc37ece5932db8ae14c453ee3c7c3abe76b` |

## Fresh bounded review and handoff

Observer review: import-only fidelity checked before/after; fixtures remain fence-bound; adapter/config syntax parse passed; runtime139cases passed; response classifications count every captured record without converting missing bindings into PASS; source fence copy/current fence and HEAD remained unchanged at final receipt. No financial/auth/private/order/consent source delta or test weakening. SDK dependency bundles outside `/src`/`/packages`, styles without maps, formal Product Language/native screenreader audio, live providers, deployed/customer behavior and production readiness are **NOT_VERIFIED by this suite**. Root owns fresh build/typecheck/full release review/Git/provider actions. Browser/temp/report lease **RELEASED** after this receipt. Token and actual cost total unavailable; no paid call. Memory candidates: None.

# Dashboard required-marker handoff

Status: IMPLEMENTED_LOCAL_VERIFIED, awaiting root's independent final review. Whole Ask production readiness is not asserted. App/browser leases released; owned app/tests frozen.

Brief consumed: revision1, SHA256 `5b1a1591ab63979af4556f012f7432ae1a31ebf9f272a39219510b2a92971ea5`. HEAD `53d59bd88fa7da9d1243692336ecd09b6540ea31`. Intelligence remains DEGRADED: healthy but stale CodeGraph/CocoIndex; root's bounded refresh failed at daemon.log filesystem permission. Critical facts verified in current source.

Approval: current user-requested readiness continuation, new PLAN.md and the existing reviewed DASHBOARD-LABEL-DELTA-PLAN.md. Protected-path validator passed. No other app/test source was edited by this slice; the current concurrent Analytics implementation is the preserved baseline, not adopted work.

## Exact delta and frozen sources

`AnalyticsOverview` has one decorative shared requiredMark star beside each already-required UTC date label. The inline wrappers keep the label/star together. Native required attributes, values, handlers, UTC rules, styling, access, APIs, metrics and payment behavior are unchanged. Replacing exactly these two new label fragments reconstructs the baseline byte for byte.

| File | Baseline SHA256 | Frozen SHA256 |
| --- | --- | --- |
| src/features/crm/Dashboard.tsx | a870584509b364fa6697ef68457be75a69561af37083b829c27456dbd3e680ac | ccca78132db14813cebbbaffc760925cda0bfd628df8760d13c87e1378b510ed |
| tests/browser/ask-readiness-dashboard.spec.ts | New owned file | db9de990c4ab5c1245d1f06924a79998a6a767eea913b90197bd8e730f811a4f |
| tests/browser/ask-readiness-dashboard.config.ts | New owned file | 3678312969c6c6eb80e9e6b8b63fc6f92196d1fa37671a250a7ab1348dac5a65 |

Immutable before source/module: baseline/Dashboard.tsx and baseline/Dashboard.transformed.js. The borrowed Analytics fixture was copied to baseline/analytics-dashboard.fixture-copy.ts; its existing source remains unedited. Patch: owned-dashboard.patch. Manifest: SOURCE-MANIFEST.json. There was no source swap, stage, commit, deploy, restart, reseed, new server or paid/provider operation.

## Verification

Commands and exact logs are in CHECKS.json. Node22 v22.23.3: `/Users/hunpeo97/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin/node`.

| Check | Result | Evidence |
| --- | --- | --- |
| Before required-label unit | 1 failed, 2 passed; exactly Dashboard667/676 missing markers | unit-before.log |
| Before actual browser | Expected 2 markers, received 0 at 320px | browser-before.log |
| Before exact final browser fixture, preserved module replay | Same missing-marker failure; source unchanged | browser-before-final-fixture.log |
| After required-label unit | 3/3 passed | unit-after.log |
| Final current component browser | 4/4 passed, 9.8s; 320/390/1440/720 CSSpx | browser-after.log |
| Frontend tsc --noEmit | Exit0 on frozen app | tsc.log |
| Scoped app/owned-test ESLint | Exit0 on frozen app/tests | lint.log |
| Whitespace/diff inspection | git diff --check exit0; exact two-label reconstruction | owned-dashboard.patch; SOURCE-MANIFEST.json |
| Product language | All eight principles passed for narrow marker delta | PRODUCT-CONTENT-REVIEW.md |

Browser uses existing 127.0.0.1:5207, one worker, real Dashboard/React/router/styles with copied synthetic API/analytics module stubs and auth=null. It verifies the two rendered fields, native required attributes, persistent computed field names, hidden decoration, keyboard-opened custom range, keyboard access to both native date inputs/Apply, valid Apply, native empty-value blocking without a new read, and no document/control horizontal overflow.

Screenshots: screenshots/current-{320,390,1440,720}-{fields,context}.png. Current field names: Từ ngày (UTC), Đến ngày (UTC). Readbacks and native CDP AX: current-*-readback.json, current-*-native-ax.json, current-*-ax.yaml. Keyboard/validation receipts: current-*-interaction.json. Chromium153.0.8010.12.

Fixture corrections are retained transparently: zero-box display:contents capture changed to child bounds; getByLabel hidden-decoration text matching changed to the actual accessible-name getByRole locator; wait applied-range read/hydration before starting a new edit. A proposed Date-node required-property assertion was disproved by native before/after readback and replaced with recorded browser limitations; native required DOM/validation assertions remain. These were fixture/evidence corrections, not application behavior changes.

## Review and limits

Self-review found no actionable defect in the approved two-marker delta. Native Date AX names remain identical before and after. Chromium153 does not serialize a required-state property on these Date nodes in either source revision; this trace does not prove AT announces required. Screen-reader audio and native browser zoom are NOT_RUN. 720 CSSpx is a 1440-at-200% layout equivalent only. Browser-native date display uses default en-US locale; persistent Vietnamese labels are unchanged.

Security, database, public API, financial authority, concurrency, resource-lifetime, instrumentation and release configuration changes are NOT_APPLICABLE to this static marker delta. API and validation compatibility are verified by exact diff plus rendered/native validation checks; staff authentication/provider/deployed acceptance are NOT_RUN in this component fixture. No performance or whole Analytics certification is made.

Rollback: apply the inverse of owned-dashboard.patch only after source/hash comparison, preserving concurrent work. No data migration or backend rollback is required for this slice. Root owns full-unit/regression integration, release/artifact/rollback checks and fresh independent final review; no runtime final-review record was overwritten by this specialist.

Readiness blockers from the task brief remain: owner-approved knowledge corpus absent, 30-day retention still proposed rather than approved, live acceptance/release evidence incomplete, paid Gemini ledger reserved with actual billing unavailable. This narrow fix removes the required-label unit blocker; it does not resolve those gates.

Memory candidates: None. Token usage/cost unavailable; no paid provider calls in this slice.

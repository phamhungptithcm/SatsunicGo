# Recipient directory and autocomplete — local implementation report

**Implemented locally; final UI acceptance BLOCKED. Production readiness NOT_READY.**

The two existing province/commune selects now accept search text and offer directory choices in the same checkout form. Search supports Vietnamese accents/combining marks, unaccented names, codes and abbreviations such as HCM/TPHCM/hanoi. The selected commune belongs to the selected province; changing/invalidating the province clears the commune. Arbitrary typed labels supply no selected code. Existing saved-address hydration, compact layout, inline asterisks, stable error slots, right-summary CTA and server authority are retained.

Official NSO snapshot requested for 09/10/2026: **34 provinces/cities and 3,321 communes/wards**. It corrects **31 names**, including newer city/ward classifications missed by the community API; codes and parent relationships are unchanged. SOURCE.md, retained public XML, reproducible importer, generated hashes and DATA-DIFF.json establish provenance. The frontend continues to load the directory from authenticated setup; search does not make requests per keystroke. Local demo Firestore was backed up, updated with a transaction/hash guard and read back against the asset. No restart/reset or production write.

## Executed verification

| Check | Result | Evidence |
| --- | --- | --- |
| Unit/search/render/domain regressions, Node22.23.3 | 128/128 passed | UNIT-NODE22-RESULTS.json; four relevant test files. SSR is a markup proxy, not actual interaction. |
| Python importer/security/integrity | 4/4 passed | IMPORT-TESTS.log; reproducibility, oversized/DTD/entity input, wrong response/date, invalid/duplicate/foreign-parent/truncated data. |
| Demo sync guard/hash tests, Node22 | 3/3 passed | SYNC-TESTS.log; production/wrong endpoint refusal, required expected hash, map ordering and missing-value comparison. |
| Existing demo HTTP API | 39/39 passed; test Auth account deleted | HTTP-RESULTS.json; unauthenticated setup, exact full directory, invalid province/commune, all 34 wrong-parent pairs, typed labels without codes. No cart/payment writes. |
| Root and Functions TypeScript | Passed | Node22 `tsc --noEmit`, also `-p functions/tsconfig.json`. Initial root errors in concurrent notification/email files were sent to their owner; the final rerun passed. |
| Scoped ESLint / Prettier / diff whitespace | Passed | Commands in CHECKS.json. Formatting preserves notification logic; only whitespace was normalized in pre-existing unformatted notification hunks. |
| Isolated local Vite bundle | Passed | BUILD.log; output /private/tmp/satsunicgo-recipient-build-20261009. Did not overwrite shared functions/lib or start another server. This is not a production release artifact. |
| Finite indexed-search probe | 10,000 lookups, correct result on each | SEARCH-PROBE.json; at most 168 commune options indexed at a time. Timings/heap are observations on this host, not browser/soak/leak guarantees. |
| Actual desktop/mobile/IME/AT checkout | NOT_RUN | Prior local browser access refusal remains binding; no workaround. Product Language Gate and final review remain BLOCKED. |

Build retains warnings about existing >500kB application chunks and an ineffective dynamic import in Changes.tsx; bundle architecture changes are outside this recipient delta. Python uses bounded reads (max2,000,001 bytes) and standard-library XML parsing with DTD/entity rejection. No new dependency, timer, global listener, query telemetry or persistent search cache was introduced. Memoized indexes are scoped to current options. The UI has explicit focus/error/disabled/no-match semantics in source; keyboard/touch/IME and live announcements still require real rendered verification.

## Review and fix cycles

1. Initial review: stale community names and native-select usability identified. Official full snapshot imported; strict searchable controls added. Follow-up source review corrected invalid nested block/list markup under a wrapping label, replaced mouse-only focus preservation with pointer handling, and fixed missing-field hashing in the demo comparison. Dataset/hash/SSR/guard tests passed; actual pointer behavior is not certified.
2. Memory/data review: importer initially checked size after reading the whole file. Replaced with bounded input reads; added strict ISO date spelling and explicit UTF-8 output. Oversized/entity/date/integrity tests reran successfully. Province/commune codes remain stable and old order snapshots are untouched.
3. Test-harness failure review: retained partial HTTP evidence and account-cleanup status. ESLint caught a throw inside finally that could mask the original failure; replaced with a recorded failure and nonzero exit status, preserving the original exception. Scoped ESLint/format and HTTP checks reran successfully.
4. Fresh final implementation review: approved scope, source, affected consumers, failure paths, security, data/rollback, resource bounds and current evidence reviewed. No additional actionable defect found in the executed source/unit/API checks. **BLOCKED** solely for missing actual rendered interaction/product-content acceptance; production installation and release verification are also unperformed and out of this local phase.

## Acceptance and quality gates

Equal weight20 for five criteria; only fully verified criteria count: official complete directory PASSED; authoritative API and invalid-pair protection PASSED; search/selection UI PARTIAL (source/unit proxy only); responsive/accessibility interaction NOT_RUN; reproducible guarded integration/build checks PASSED. **Verified acceptance60%; this is not an estimate of coding effort.** Code for all five is present; missing UI evidence does not count as passed.

Profiles: universal, TypeScript/JavaScript (TypeScript6, React19/Vite8, Node22), Python(stdlib importer), frontend-html-css, web-app, visual-design, product-content and database(public Firestore reference configuration). Compilation, focused unit/integration, scoped static analysis, source architecture/API compatibility, data integrity, secrets/input/output encoding and observability impact review passed within the executed boundary. No schema/index/trigger or auth/provider change. Python AST/unittest were used; no configured Python linter/type-checker was installed. SEO/GEO and added animation are not applicable to these authenticated form controls. Required visual, assistive/localized interaction, product-content completion and final-review gates remain NOT_RUN/BLOCKED; see PRODUCT-CONTENT-REVIEW.md and FINAL-REVIEW.json.

Git: branch main, HEAD0d6e721698608eebb36b0b2f68021c3054d97d1c; shared dirty worktree with unrelated concurrent changes preserved. No commit/push/deploy in this local-first phase. SOURCE-MANIFEST.json binds this candidate and its evidence. Older payment scenario manifests are intentionally historical/stale after these source/asset changes; they were not rewritten to imply current full-project acceptance.

Remaining: inspect authenticated checkout at1440/390/320px and enlarged text; pointer/touch selection and list scrolling; Tab/Arrow/Home/End/Enter/Escape and Vietnamese IME; wrong-input correction without page movement; saved-address/province changes; screen-reader announcements. Existing mounted checkout can retain old setup until reload/reopen. Production directory installation, CI/deployment/public/provider readback are NOT_RUN. Real payment/public IPN remain outside the authorized local phase.

Runtime task-ledger CLI unavailable; this file and JSON records are the explicit fallback report, not a claimed native runtime receipt. Provider token usage: Unavailable. Actual billed cost: Unavailable. API-equivalent estimate: Unavailable. Memory candidates: None; no durable-memory write.

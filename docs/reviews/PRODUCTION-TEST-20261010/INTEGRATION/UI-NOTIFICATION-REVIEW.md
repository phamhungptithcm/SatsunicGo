# Test notification consumer review

Reviewed 2026-10-10T02:07:00.531051+00:00. **Notification-specific source and synthetic browser acceptance are complete. Product Language Gate and final UI review remain BLOCKED** by the explicitly remaining native/accessibility evidence below. RIG is DEGRADED; optional indexes were unavailable, and bounded actual source/hash/test/browser/image evidence was used.

The approved v1 fix reuses the existing `TestOrderBadge` beside each existing inbox title and adds optional unknown provenance fields to the local read-row type. No new product string, CSS, layout, subscription/query, auth, destination, read-state or mutation behavior was added. The before-edit impact is `UI-NOTIFICATION-IMPACT.md`. Original product reviews and `UI-NOTIFICATION-REVIEW-PRE-BROWSER.*` are retained; earlier blocked cycles remain in current JSON.

## Exact evidence and rendered acceptance

Canonical receipt: `INTEGRATION/NOTIFICATION-BROWSER-ACCEPTANCE.json`, SHA256 `b6e0944504d81091fdf45fa2428361626be4a0cedcb912b7743f64fca28c6db1`. Root's exact HTTP readback is200/text-html, **516,185 bytes**, artifact SHA256 `b9dc199cf65a511cc6913b663c821ac1a263924f3f8fb333c748d57b44093394`. All 39 preview inputs and both notification source/test hashes match. No new preview generation was necessary.

This reviewer inspected actual `notifications-desktop.png` and `notifications-css390.png` pixels, verified their hashes and compared the receipt's DOM counts/bounds. Desktop 1890 CSS and narrow 390x844 CSS show 4 rows: canonical, legacy demo and partial records each have one compact Test badge with DOM accessible name `Đơn test`; the genuine reply row has none. Existing titles, time display and order/support destinations remain visible. Row bounds stay inside the 390 CSS document, whose client and scroll widths match. Marker alignment and title wrapping show no collision in those supplied views. Full-page images were resized by the image tool; exact CSS geometry comes from the recorded browser DOM, not screenshot pixel size.

This is the actual Notifications component with an exact local synthetic read adapter. It is not genuine identity/MFA, Firestore authorization, backend producer, provider, inbox delivery or production acceptance. Fixtures are already read; no read mutation or navigation side effect was exercised. Accessible DOM names are not spoken AT proof. No browser network trace was supplied. The viewport override was reset. This reviewer performed no browser/provider/runtime operation.

## Strings, states and data meaning

Visible `Test` and accessible `Đơn test` are existing reused strings. They identify conservatively classified canonical/legacy/partial test notifications beside their titles; they grant no authority and expose no executionMode/testRunId. Genuine/untagged title/time/link/read labels remain unchanged. Actual component tests cover 9 test-tag cases, 3 genuine/absent cases and a read reply disclosure; 9 additional preview-boundary checks exercise exact read admission, denied owner/database/collection/order/limit paths and unsubscribe-before-publication. Together with 37 existing presentation regressions, **59 tests in 2 files pass**. Frontend strict, scoped lint, preview build/syntax and source/hash checks pass.

Default/read notification layout, canonical/legacy/partial marker and genuine no-marker are observed in current browser context. Unread/disclosure controls retain actual-component test evidence. Loading/error/empty states and Workbench filter/focus checks carry the unchanged-component evidence in `UI-BROWSER-REVIEW.*`; this supplement does not rerun or elevate them. Genuine offline/stale/auth-forbidden, durable checkout/payment and production finance/policy denials remain separate owner checks. Existing title/time semantics are preserved; synthetic timestamps and amounts are not live business facts.

## Mandatory Human Interface principles

These results are scoped to the disclosed notification presentation. A required NOT_RUN principle keeps the complete gate blocked.

| Principle | Status | Evidence and limit |
| --- | --- | --- |
| Purpose | PASSED | within actual component render: marker identifies canonical/legacy/partial test notification beside title, genuine row unmarked. |
| Agency | PASSED | scoped browser/source: existing order/support targets, title/time and disclosure/read controls retained; noninteractive marker adds no required step. No link side effect or read mutation exercised. |
| Responsibility | PASSED | scoped browser/source: explicit Test label, no raw provenance/secret/PII field printed; synthetic nature and auth/provider limits disclosed. |
| Familiarity | PASSED | inspected existing blue/white/navy inbox, familiar visible Test and Vietnamese accessible Đơn test, current web title/time/link conventions. |
| Flexibility | NOT_RUN | full gate: narrow390CSS wrapping/no horizontal overflow observed; genuine 200%zoom/spoken AT unfinished and native select remains NOT_VERIFIED. |
| Simplicity | PASSED | inspected one small inline badge; no new box/control/explanation/animation; real and test rows share existing hierarchy. |
| Craft | NOT_RUN | full gate: actual desktop/narrow typography, row bounds, title/time/target and marker alignment inspected without collision; zoom/spoken AT still incomplete. No exhaustive contrast/device/cross-browser certification. |
| Delight | PASSED | bounded rendered review: compact contextual cue prevents a separate test explanation or interruption; existing reading/navigation flow retained. No satisfaction/performance claim. |

Target platform is a Vietnamese LTR React web application, with existing blue-white-navy design and native web controls. The bundled human-interface principles are a quality reference, not an Apple-platform compliance claim. Product-content, web-app, frontend-html-css and visual-design profiles apply. No public marketing claim, SEO/GEO discovery change, tracking/experiment or changed motion was introduced; corresponding profiles add no new effectiveness claim. No contrast, physical-device, cross-browser, performance or user-satisfaction certification follows from these screenshots.

## Review cycles and remaining gates

Cycle 1 found the missing notification Test marker and fixed only the consumer. Cycle 2 passed engineering checks but lacked current notification browser evidence. Cycle 3 now closes that rendered notification observation, using the current exact artifact and inspected desktop/narrow views. No further in-scope source defect was found within these executed checks.

Native kind-filter arrow selection remains **NOT_VERIFIED** from the prior first ArrowUp result. Genuine 200% browser zoom/text scaling and spoken AT remain **NOT_RUN_MAC_LOCKED**; VoiceOver was not toggled in that attempt. Do not bypass the lock, request repeated existing permission, treat CSS geometry as zoom, or force a full retest of unrelated unchanged views. Parent retains real integration/CI/artifact/provider/rollback gates and cleanup of its owned temporary HTTP copy/tab.

Source/scaffold hashes are frozen in `UI-NOTIFICATION-FREEZE.json`. No more source/scaffold edits follow this handoff. Token usage and actual billed cost: Unavailable. Memory candidates: None.

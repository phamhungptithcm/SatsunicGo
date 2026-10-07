# NAV-PERF-087 — Local validation and limitations

Source candidate: `NAV-PERF-087-SOURCE.json`; task-only patch: `NAV-PERF-087-task.diff`. Current source commit is recorded in that manifest. Pre-existing shared WIP is preserved and excluded from the task delta using task-start copies. No shared runtime restart, new frontend server, fixture seeding, production access or deployment was performed.

## Baseline versus final behavior

Baseline account animation `accountReveal` was observed in the in-app browser before edits. Source configured account panel entrance at 180ms, detail entrance at 160ms, Home entrance at 420/480ms and Ask composer entrance at 180ms. Account host was keyed by view/order and default LoadingState registered global overlay progress. Final browser assertions observe animationName=none for removed entrance effects, retain the same account host across five query-tab changes, and preserve navigation/status without an overlay through a held cold module load.

This establishes removal of those mechanisms, not a before/after CPU or FPS comparison. No pre-change frame trace was captured. Ask pathname/user reset is intentionally retained because it cancels and isolates route-bound order/commerce state; code splitting and tab-shell changes deliver the smaller safe change. Its composer entrance motion was removed. No persistent hidden tabs or private-data cache were added.

## Checks

| Gate | Result | Current evidence |
| --- | --- | --- |
| Frontend TypeScript | PASSED | `npx tsc --noEmit`, exit 0; includes src/packages/tests |
| Scoped static analysis | PASSED | ESLint on App, route-modules, SiteChrome, AccountRail, Loading and new tests, exit 0 |
| Unit tests | PASSED | navigation-performance087 and loading-progress081: 7 tests passed |
| Browser/component integration | PASSED | navigation-performance087: 6 tests passed, final run 13.3s, Chromium on shared 5207 |
| Production bundle generation | PASSED with warnings | `npx vite build --outDir /private/tmp/satsunicgo-nav087-build`, exit 0; no tracked generated public-assets mutation |
| Diff whitespace | PASSED | scoped `git diff --check`, exit 0 |
| Architecture/compatibility/security | PASSED within scope | Source review of module loading, bounded cache, auth/user/Ask keys, retained write/progress semantics and recovery |
| Product content/visual/accessibility/motion | PASSED locally | CONTENT_REVIEW plus actual desktop/mobile/slow-loading screenshots, keyboard/reduced-motion/zoom/history regressions |
| Repository intelligence | DEGRADED | Both tools installed, health queries passed, indexes stale after one refresh attempt and final check; source is authority |
| Backend/provider/device/release tests | NOT_APPLICABLE to local code acceptance; NOT_TESTED for production | No backend change or deployment; real Google/payment/device outcomes not established |
| Real screen-reader speech | NOT_RUN | DOM/ARIA and keyboard are the disclosed accessibility proxy |
| Before/after CPU/FPS improvement | NOT_RUN | No baseline trace; after-only samples below cannot quantify improvement |

Selected quality profiles: universal, TypeScript/JavaScript, web-app, frontend HTML/CSS, visual-design, product-content, animation-motion; SEO/GEO reviewed for unchanged public hrefs/content and no crawler/metadata claim. No dependencies, schema, public API, provider authority or write-path changes. No logging/analytics changes. Cleanup: code preload failures release the local promise; native module-cache failure may require the existing page reload. Ordinary passive LoadingState no longer registers global progress, preserving explicit overlay=false behavior and avoiding extra store notifications. Explicit operations retain withProgress ownership/release in finally.

Build warnings remain: large Firebase/Studio/ELK chunks and ineffective dynamic import of Changes due to pre-existing static consumers. No claim those warnings are resolved, introduced by this patch, or harmless on low-end devices.

## Browser evidence boundary

Authenticated tests use the existing customer-a emulator identity through the app's demo login. They read existing local data and do not seed/delete/reset shared records. Cold-module tests use browser request interception. Error/recovery covers a failed optional preload and subsequent safe navigation/reload. The initial sandboxed Chromium launch was blocked by macOS Mach-port permissions; the approved escalated local runner completed. An earlier test failure was a test selector targeting section instead of Ask's actual aside; corrected, then all tests rerun. No app failure was suppressed.

After-only frame/long-task samples are in `NAV-PERF-087-1440-metrics.json` and `NAV-PERF-087-390-metrics.json`. API support is explicitly recorded; unavailable metrics would be null. Samples cover five query-tab switches on this host in headless Chromium/emulator, after account sign-in and initial load. They exclude cold startup and do not establish physical-device, Safari, production-network or heavy-data performance.

## Review cycles and readiness

Cycle 1: BLOCKED pending final evidence; LOW finding NAV087-THRESHOLD identified the incorrect absolute-clock observation in the slow-loading test. Fixed to elapsed navigation time >450ms, then the full suite passed. Cycle 2: complete fresh review of current source, tests and product-content evidence; final decision recorded in ignored runtime ledger and FINAL_REVIEW.json.

Production readiness: NOT_READY / not deployed. Shared worktree is dirty with existing unrelated work; this review certifies only the task candidate. Rollback consists of the task-only patch, preserving other edits. No production, cloud, finance or release action is authorized by this local approval.

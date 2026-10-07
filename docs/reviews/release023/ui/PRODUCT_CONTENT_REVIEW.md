# Product Content Review — UI lifecycle hardening023

Scope: Thread.tsx reply and OrderImages.tsx list/open/upload lifecycle. Vietnamese web UI for staff support and authorized order-image viewers. No user-facing or accessible string changed by this session; no commercial/data definition change. Native web forms/details/buttons retained; Apple-platform compliance not applicable. Source review 2026-10-05.

Verified: existing labels identify reply/upload/open, pending button disabled, recoverable errors preserve current input. Identity switch clears obsolete messages/images and resets identity-specific form; server operation already submitted is not cancelled. Mutation idempotency payload retained within identity. Source of truth remains authenticated backend. Image data URLs remain in memory only. Existing 2MB/20-image limits unchanged. No price/currency/date formatting changes.

Inventory: all changed strings = None. Behavior inventory: pending/disabled (`Đang gửi…`, `Đang xử lý…`), recovery errors, image/list rendering, reply form reset. Default labels, empty/error/loading strings unchanged. No confirmation/destructive flow introduced. Offline behavior remains request rejection; no false cancellation/success promise added.

| Principle | Status | Evidence |
| --- | --- | --- |
| Purpose | PASSED | Current identity owns reply/image view |
| Agency | PASSED | Current failures release busy; obsolete work cannot disable new identity |
| Responsibility | PASSED | Private old response cannot publish after invalidation; no server cancellation claim |
| Familiarity | PASSED | Existing native forms/buttons/labels retained |
| Flexibility | NOT_RUN | Current keyboard/narrow/wide/zoom runtime proof pending root window |
| Simplicity | PASSED | No extra copy/control introduced |
| Craft | PASSED | HARD-UI01/02/03 exercise real components after deferred committed server responses; obsolete rows/image/reloads absent and current controls enabled |
| Delight | PASSED | HARD-UI01/02/03 verify current reply/upload actions remain enabled after navigation; no added interruption |

Platform fit: web React19 native HTML, no Apple-only expression introduced. Accessible existing labels and role=alert retained; source review only. Actual AT NOT_TESTED; AX snapshots would not constitute actual AT evidence. Localization expansion/rendered states NOT_RUN. Static language meaning/tone/terminology/data privacy reviewed; no altered wording. In-context lifecycle verification PASSED for three targeted browser cases; viewport/text-scaling/keyboard coverage still NOT_RUN. Browser plugin absent; root owns regular Playwright runtime window, no browser invoked in this session.

Decision BLOCKED pending required Flexibility/keyboard/layout/text-scaling evidence. Targeted rendered lifecycle regression now PASSED. No successful UI acceptance or production readiness claim.

Current browser evidence read directly: output/playwright/release023/browser-focused-results.json and browser-focused.log, 3 expected/0 unexpected/0 flaky/0 skipped, 26.0s. tests/browser/release-hardening.spec.ts reviewed: native app routes, authenticated synthetic emulator fixtures, actual backend request fetched then response delayed; same SPA navigates before release. HARD-UI01 ensures old ticket absent/current reply enabled/server version increments. HARD-UI02 ensures upload committed but no old-order reload/private description and current upload enabled. HARD-UI03 ensures deferred private image absent/current upload enabled. These are component/runtime tests, not mocks of React. Screenshot/console-health checks not included in these three tests; no visual or full-product claim. Full38 browser result pending. Source hashes reverified unchanged.

## Final scoped review cycle5

Current freeze: Thread04934b95afc39193c5414196a93ed4dd7e61496aef9a50128f669c0d95e590b0; Workbenchd6eecc1a67618bb89b265238ef6740318dc30436e92f1eeb6d2f95ee965a810a; global.cssd6074ace94e6217e0b8a0bc06f886a9ac8bece83774a34374bd4c9826667b7f2; OrderImages23b12fb5e1053fbb6d2757a760a2a886d063d55624d4ebafa079ce566c587ba2. Source hashes directly reverified.

UI-H200 PASS13.5s in browser-cycle5-final.log read directly. Current test checks native200 effective720 viewport, support toolbar and Workbench links gap>=8px, typed keyboard input retaining focus, file-input accessible label, no document horizontal overflow. support/images-200-accessibility.yaml contain current visible labels/native controls. images-200-capture.json reports effective720x500, scrollY865.5, description rect426.81/272.48/248.19/95, fully inside viewport. These live rendered geometry/AX/input checks form an explicitly disclosed in-context proxy for image-panel screenshot inspection. Screenshot capture remains misaligned/white in headless native zoom; exact compositor cause unknown. No pixel-perfect or general image visual acceptance claim.

Final principle mapping supersedes provisional statuses above: Purpose PASSED (current object owns state); Agency PASSED (current actions enabled after deferred old response); Responsibility PASSED (private old state suppressed, submitted server work not falsely cancelled); Familiarity PASSED (native controls/unchanged Vietnamese copy); Flexibility PASSED for scoped changes (native200 keyboard/labels/current gap and no-overflow geometry; earlier deferred widths390/768/1440); Simplicity PASSED (unchanged copy/actions, clear separation); Craft PASSED (four source defects corrected with focused compiler/lint/unit and current rendered regression); Delight PASSED (smooth navigation/recovery without extra interruption).

Final Product Language Gate PASSED for scoped lifecycle and action-spacing changes using current source + native browser/AX/geometry proxy. Meaning/tone/brevity/terminology/privacy unchanged and reviewed. Platform fit PASSED web native HTML. Keyboard/accessibility semantics PASSED for tested controls, actual AT NOT_TESTED. Localization/resource wording unchanged;200 text scaling/gap geometry PASSED; broad localization/RTL not certified. No new destructive/permission/financial semantics. Image-panel visual screenshot acceptance NOT_RUN due capture limitation; full-product motion/performance/provider/production remain NOT_RUN/NOT_READY. Full cycle5 aggregate browser still running; no38/38 claim here.

Final aggregate browser evidence update: directly read browser-cycle5-final.log and browser-results.json;38/38 PASSED,0skipped/0unexpected/0flaky,0global errors. Scoped source hashes unchanged. Root fresh final tsc/lint/build still coordinator-owned. UI source and private docs now FREEZE; no further mutations planned. Visual image screenshot/actualAT/fullproductperformance limits remain explicit, production NOT_READY.

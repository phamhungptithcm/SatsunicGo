# FIRST-LOAD-109 — stable startup

Approved 2026-10-07 by repository owner: “Apporved” to the simplified loading proposal. Only scripts/public-assets.mjs and this evidence document are in scope. No deploy, restart, dependencies, homepage behavior, data or authentication changes.

## Investigation and implementation

Production https://satsunicgo.web.app/ returned an unstyled overview inside #root, injected by scripts/public-assets.mjs. src/app/main.tsx uses createRoot, replacing it with the application. This verifies the raw initial content in production HTML; no production filmstrip was captured.

The build now injects a small self-contained startup state with inline scoped CSS. The overview is retained inside noscript. The startup DOM disappears when React mounts; there is no timer, artificial percentage, extra JavaScript, delayed application startup or transition animation. A normal reload link remains available if a JavaScript download fails. A permanently failed download will leave the waiting state until reload; automatic failure detection is outside this scope.

Repository intelligence: indexes were stale, refreshed once, but freshness check still returned DEGRADED. Claims use targeted source and live HTML evidence. Shared WIP and changing HEAD were preserved; reviewed HEAD is 6e74eead18fc87c182a28fb232d5d299e5364dc9.

## Product content review

Surface: generated SPA startup, Vietnamese public website; visitor waiting to access homepage. Web conventions, native status/live-region semantics and native reload navigation. Apple component HIG is not applicable to this web surface; bundled human-interface principles applied as a quality reference.

| Content | State | Meaning and evidence |
| --- | --- | --- |
| Đang tải trang… | Startup pending | Application startup, no completion/ETA promise; browser with delayed entry asset |
| Tải lại | Pending/download failure | Native current-document reload link; keyboard focus verified |
| Existing overview and links, unchanged | JavaScript disabled | Browser no-JavaScript context rendered heading and product link |

State coverage: pending tested; React takeover tested; missing external CSS tested; entry asset unavailable represented by held request with reload reachable; JavaScript disabled tested. Empty/successful transaction/auth/confirmation/destructive/data states are not applicable to this startup surface. No monetary data, privacy boundary, permissions or durable outcomes change. Reload can retry loading but does not guarantee recovery.

| Principle | Status | Evidence |
| --- | --- | --- |
| Purpose | PASSED | Specific brief loading status, no raw overview flash |
| Agency | PASSED | Native reload link, keyboard reachable without focus trap |
| Responsibility | PASSED | No fabricated percentage, ETA or success; stalled asset limitation disclosed |
| Familiarity | PASSED | Web status text and ordinary link |
| Flexibility | PASSED | 375/1440px, double text size, reduced motion, no-JavaScript fallback |
| Simplicity | PASSED | One indeterminate bar, status and reload link |
| Craft | PASSED | CSS embedded in HTML, scoped to startup; React removes DOM |
| Delight | PASSED | Quiet stable waiting surface, no extra delay, motion disabled on request |

Platform fit, meaning, audience, tone, brevity, state coverage, data/privacy, localization, terminology and in-context verification: PASSED within the local browser proxy. Accessibility: PASSED for inspected status semantics, keyboard/focus, contrast, wrapping and reduced motion; spoken screen-reader announcement NOT_RUN, no new custom control. The icon is decorative and the visible status carries meaning. There is no text truncation at double font size. Product Language Gate: PASSED for this bounded web surface.

Rendered evidence: .ai/local/reviews/FIRST-LOAD-109-375.png and FIRST-LOAD-109-1440.png, visually inspected. Local Playwright intercepted built HTML/assets under the exact Hosting CSP, without any server or external provider calls. This is production-format local evidence, not production acceptance.

## Checks and final implementation review

- Compilation/build: PASSED — npm run build, including TypeScript, Vite and public-assets generation. Existing chunk-size and mixed import warnings remain.
- Focused browser integration: PASSED — /private/tmp/first-load109.mjs, 1440×900 and 375×812. Entry held; no raw h1; CSS assets blocked; no horizontal overflow; keyboard reload focus; doubled text size; reduced motion; real built React entry takeover and h1; JavaScript-disabled overview/links.
- Static analysis: PASSED — node --check, Prettier --check, git diff --check.
- Unit suite: NOT_APPLICABLE for this tiny static build-output change; current artifact/browser assertions directly verify behavior.
- Profiles: JavaScript/Node build script, web, visual design, animation/accessibility, product content and public discovery reviewed. No API/database migration applies.
- Security: PASSED within scope — existing CSP allows inline styles; no inline script, secrets, user input interpolation, permissions or network changes.
- Architecture/API/observability: PASSED review — existing entry asset links, generated manifest and React startup unchanged; no new runtime dependency or handler.
- Discovery metadata: PASSED preservation review — title, description, preload/style/script links unchanged. Overview now requires noscript; no new crawl/ranking claim. Full styled SSR remains out of scope.
- Review cycle 1: PASSED after implementation, build, browser and source diff review. Requirement, security, code quality, failure paths, error handling, release/rollback boundaries and trade-offs reviewed. No actionable in-scope finding. A test initially assumed exact innerText newline spacing; corrected whitespace normalization and reran. A sandbox browser launch failure was resolved by approved escalation; it is not a product failure.

Subsequent review cycles rechecked the unchanged scoped diff and rebound the review to shared-worktree changes. No additional findings or application fixes. Exact cycle count is recorded in the runtime ledger.

Local acceptance: all three criteria verified (no raw flash, React takeover, no-JavaScript fallback). Git: shared worktree dirty; unrelated edits preserved. Production readiness: NOT_READY for release — local change has not been deployed or verified live; this task is not release authorization. Rollback: revert the scoped build-script change and rebuild using the release process.

Token usage: Unavailable. Actual billed cost/API-equivalent estimate: Unavailable. Memory candidates: None.

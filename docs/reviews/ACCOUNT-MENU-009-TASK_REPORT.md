# ACCOUNT-MENU-009 task report

Local scoped implementation completed: Google provider name/avatar replaces account/logout header controls; dropdown has six verified customer destinations and logout. Missing/broken photo uses initials. Navbar attribution removed and footer attribution placed after brand exactly once. Approved plan and owner refinement recorded in docs/approvals/SATSUNICGO-ACCOUNT-MENU-009.md.

Files owned: src/app/SiteChrome.tsx AccountProfile/header slot/footer attribution; src/styles/global.css ACCOUNT-MENU-009 block; task-specific approval/review documentation. Existing shared WIP preserved, including concurrent public header parcel logo, compact scroll behavior, CTA and public-ux.css supplied by another task. These concurrent additions are not authored/certified by this task. Actual fixture includes that stylesheet to match application entry styling. Signed-in mobile hides duplicate request CTA because the same destination is present in dropdown; signed-out CTA retained. API/Auth/OneTap/Firestore logic unchanged; staff check preserved.

Context inspected: SiteChrome, App routes/signOut, OneTap, public/global styles, approved plan, shared intelligence/workflow/quality gates. React19.3, TypeScript6, Vite8, Firebase12; responsive Vietnamese web. Profiles: universal, typescript-javascript, frontend-html-css, web-app, visual-design, product-content. Risk: low-to-medium shared-header UI.

## Acceptance and checks
Three equal local criteria: profile/menu behavior, attribution placement, focused checks/current review. 3/3 verified. Production/live auth acceptance is excluded.
- Compilation: PASSED, tsc --noEmit.
- Static analysis: PASSED, eslint src/app/SiteChrome.tsx.
- Formatting: PASSED, prettier --check SiteChrome; only appended task CSS formatted.
- Regression: PASSED, vitest run tests/unit/one-tap-controller.test.ts tests/unit/verified-google.test.ts — 17/17.
- Client build: PASSED, vite build --outDir /tmp/satsunicgo-account009/build — 202 modules; existing chunk/dynamic-import warnings retained.
- Diff whitespace: PASSED, git diff --check changed paths.
- Architecture/API/observability/security: PASSED scoped source review; retained callbacks/contracts/access/subscription cleanup, no new telemetry/dependency/DB mutation.
- Visual/product language: PASSED, CONTENT_REVIEW and browser fixtures/local app.
- Database migration/new animation/SEO metadata: NOT_APPLICABLE.
- Intelligence: DEGRADED, fresh gate reports indexes stale and CocoIndex health failure. One previous bounded refresh failed daemon-log access; native source fallback allowed.
- Approval validator: known compatibility limitation hardcodes READY despite governing DEGRADED policy; truthful human approval recorded, no policy alteration.
- Live auth/logout, full cross-browser/screen-reader/200% zoom audit: NOT_RUN, bounded local UI evidence only.

## Review cycles
Cycle1 found inherited .topbar nav styles hide/misposition dropdown on mobile, profile key tied to mobile-open state remounts on account activation, and menu offset clipped320px. Fixed by scoped nav resets, UID-only key/navigationOpen prop, viewport-bounded mobile panel and compact profile sizing. Browser verifies both menus are mutually exclusive and menu bounds inside320/390.
Cycle2 fresh review covers full current scoped candidate, requirements, security/privacy, type/lifecycle correctness, failed image, missing name, signed-out/user change, keyboard and existing logout error/pending flow, production impact and trade-offs. Fallback duplicated accessible wording fixed and verified against current source. All actionable scoped findings fixed; no known unresolved issues within executed checks. Source manifest binds exact candidate; no full-system readiness claim.

## Browser evidence
Fixture actual components: Google label/initials and successful HTTPS image display; missing/broken image, long name320px, UID change/non-Google, six link paths/closure, Tab first link, Escape return-focus, outside click, mutually exclusive mobile nav, mock successful/pending/failed logout. Actual app observed without live account mutation. Screenshots are synthetic fixtures and labeled accordingly.

## Compatibility and remaining risks
No new route, API, schema, backend/auth configuration, release, or package change. Static SVG/CSS and bounded event listeners; listeners cleaned on close/unmount. Images use HTTPS/no-referrer/fixed dimensions. Existing callback handles sign-out errors. Selective rollback of account helper/header slot/footer attribution and appended CSS only; do not reverse concurrent header WIP. Shared worktree remains dirty. Full production readiness NOT_READY; independent authenticated release review/live-provider acceptance remain with release owner.

Final review uses canonical final-implementation-review plus code/code-quality/product content review, recorded in runtime ledger. Rendered report /tmp/satsunicgo-account009/runtime-report.txt. Token usage and actual/API-equivalent cost Unavailable. Memory candidates: None. No PR/push/deploy or live sign-out performed.

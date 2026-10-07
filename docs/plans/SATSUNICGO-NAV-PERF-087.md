# SATSUNICGO-NAV-PERF-087 — Stable navigation and loading

Status: PROPOSED; implementation approval pending.

## Evidence and intelligence boundary

Current HEAD: `1d9c5824e5d0647948a1986dabc7480c4b7b8cb2`. Shared worktree contains extensive unrelated changes; preserve them. Repository intelligence checks and one refresh attempt were initiated. Until current health/freshness is confirmed, use DEGRADED bounded source evidence; no claim of complete graph coverage.

Verified from current source:
- `src/app/App.tsx`: a Suspense boundary surrounds Routes, so unresolved route modules replace the route content with a loading fallback; header/footer remain outside.
- Account keys its content container by view and selected order, forcing subtree remount on tab/detail changes. `account.css` animates accountPage and orderCard on mount.
- App keys Ask by pathname and user identity. Every pathname change remounts Ask, restarting its local state/effects and appearance. Ask also reads the route for order context, so simply removing the pathname key needs stale-context safeguards.
- `LoadingState` defaults to registering overlay progress. `ToastHost` displays a global loading layer after 400ms; `loading.css` applies fullscreen backdrop blur. Read-only page loading can therefore trigger both inline loading and the global layer.
- App resets scroll/focus on pathname changes; account query-tab changes have a different lifecycle.
- Home entry effects translate content for 420–480ms. These are observable animation mechanisms, not measured CPU bottlenecks.
- Shared frontend listener exists on 127.0.0.1:5207; do not restart it or start another server.

Gate result: both indexes passed health queries but are Stale; mode DEGRADED. Critical conclusions above were verified directly against current source.

No browser frame-time/long-task baseline has been measured. User reports jank; the mechanisms above are candidates, not a proven exhaustive root cause.

## Intended behavior and boundary

Tab navigation should respond immediately, avoid repeated entrance motion and global blur for routine reads, and keep navigation/layout stable while content loads. Preserve routes, authorization, user identity isolation, writes, payment behavior, error recovery, and accessible loading announcements. Scope: shared public/account navigation and loading. CRM-specific rendering and backend/database changes require a separate delta plan if evidence points there.

## File-by-file implementation

1. `src/styles/account.css`: remove entry translation/fade on account content/cards during tab changes; preserve interaction feedback and reduced-motion support.
2. `src/styles/global.css`: remove repeated Home entry translation; preserve purposeful timeline behavior unless measurement identifies it as a bottleneck.
3. `src/app/App.tsx`: remove unnecessary content-container remount; place loading boundaries so account navigation remains visible. Use inline, non-overlay route-read loading. Align scroll/focus with destination semantics and wait for destination content when needed.
4. `src/app/route-modules.ts` (new), `src/app/SiteChrome.tsx`, `src/features/account/AccountRail.tsx`: centralize relevant lazy loaders and preload code on pointer intent/keyboard focus. Deduplicate requests and handle failures; never prefetch private data or eagerly load all modules. If this adds little measurable value, omit these changes.
5. `src/shared/Loading.tsx`, `src/shared/loading.css`, `src/shared/Toast.tsx`: distinguish passive reads from explicit operations; audit callers before changing defaults. Retain operation progress ownership/cleanup, loading/error announcements, and long-operation recovery. Avoid fullscreen blur for passive page loads.
6. `src/features/ask/Ask.tsx`, `src/features/ask/Ask.module.css`, `src/app/App.tsx`: retain Ask across pathname changes only with explicit route-change policy. Cancel outstanding route-bound work, clear old order selections/context, close modal and restore body scroll/focus; preserve auth-generation and identity resets. Preserve the current collapsed/composer policy. Do not retain private context across users or render responses for an old order.
7. `tests/unit/navigation-performance087.test.ts` and `tests/browser/navigation-performance087.spec.ts` (new): meaningful lifecycle/loading/private-context regressions, cold/warm navigation, rapid switches, failed lazy load and slow reads.
8. `docs/reviews/NAV-PERF-087-*`: baseline/after measurements, product-content review, source manifest, review cycles, completion report.

## Risk and trade-offs

Medium risk: route lifecycle changes can leave stale content or focus behind. Ask persistence is the highest-risk portion because it carries order/commerce context; implement only with cancellation and identity-isolation coverage. Do not cache private data or mount all hidden tabs to simulate speed. Removing motion improves stability but does not establish faster network or lower CPU use. Module preloading adds bounded network work; trigger by user intent.

## Validation and acceptance

- Measure the same navigation sequence before and after on shared port 5207: public pages and account orders/shipments/notifications/profile/security/documents; cold and warm modules; desktop/mobile and reduced motion. Record click-to-content, layout shifts, long tasks and frame gaps with environment limitations.
- No account navigation disappearance, repeated whole-panel entrance animation, or global loading blur during passive reads. Loading, empty, failure and retry remain visible and accessible.
- Rapid navigation must not commit stale order results. Logout/user switch clears private Ask state; pending operations cancel safely and progress counts clean up.
- Run scoped ESLint, frontend TypeScript check, relevant unit tests and browser regressions. Build validation must avoid modifying generated tracked assets inadvertently.
- Apply TypeScript/JavaScript, web/accessibility and product-content profiles. Inventory changed displayed states even if no strings change; complete in-context product-content review and fresh final-implementation review cycles.
- No claim of improved measured performance until comparable browser evidence exists. Production/device performance remains NOT_TESTED unless actually exercised.

## Rollback and approval

No dependencies, API, schema, infrastructure, deployment or migration changes. Rollback only this task's patch, preserving shared WIP. Approval requested for local implementation and validation of this plan; deployment is outside scope. Any material expansion requires delta approval.

Current report: investigation/plan prepared; implementation NOT_RUN; browser profiling NOT_RUN; tests NOT_RUN; final implementation review NOT_RUN; production readiness NOT_READY; usage/cost Unavailable; memory candidates None.

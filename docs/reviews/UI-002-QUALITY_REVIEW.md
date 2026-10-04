# UI-002 quality and performance review

Decision BLOCKED for rendered/performance acceptance. Scope is approved parent UI/notification/performance work, no new dependency or backend command. Git is unborn; current candidate hashes replace commit identity. Preserve original WIP. No cloud mutation/deploy/push performed.

Technology: TypeScript 6, React 19, Vite 8, Firebase JS 12; Node22 target; Vitest/ESLint. Profiles: universal, TypeScript/JavaScript, frontend HTML/CSS, web-app, animation-motion, product-content, concurrency, memory, security and infrastructure for local Hosting header config. CodeGraph traced createLiveCache/createCountdown/ToastHost/SiteHeader callers; CocoIndex returned current public cache/fixtures. Initial gate DEGRADED because restricted daemon health failed; bounded source and tool queries supplied review evidence.

## Findings and fixes

- Medium, Catalog/SDK initial metadata: empty cached SDK event could imply an empty catalog before first server response. Loading now remains true across repeated empty cached events; regression test passes.
- Medium, public-cache permissions: a rejected query could retain old visible public content. Permission/auth rejection discards rows; regression passes.
- Medium, cache lifecycle: late source callbacks could write into a new subscription. Generation guards, shared connection and bounded teardown; regression passes.
- Medium, notice lifecycle: an older timeout could close a newer notice or overlapping hover/focus could resume too soon. Notice IDs and independent hold set; regression passes.
- Low, portal/hover: a dismissed notice could carry hover state into the next host/notice. Reassess actual hover/focus on host and notice changes; source reviewed, rendered test BLOCKED_EXTERNAL.
- Low, mobile nav focus: horizontal overflow could clip the outside focus ring. Added inner space without increasing reserved header geometry; source reviewed, rendered proof remains blocked.
- Medium residual: main Firebase-containing entry remains ~949 KB despite route splitting. No runtime trace proves its contribution to the reported lag.

## Architecture/code/security/database

Public read cache is two bounded published-only queries (30 each), memory only, no private account/finance/staff cache or new disk persistence. A retained UI snapshot is eligible for brief reuse on returning within 60s, then revalidation occurs; this does not expire Firebase SDK's underlying memory cache. SDK cached data is labelled stale. Permission rejection clears wrapper data. Published updates/removals come from real snapshot queries. No authoritative command uses cached money/rights as evidence.

Callables are wrapped only for progress accounting; request operation IDs, concurrency/version guards and actual server responses remain unchanged. Explicit request/CMS notices follow persisted results; transfer notice says waiting for reconciliation. No success inferred from pending disappearance. JSX escapes content; images use same-origin media path and existing server publication checks. Existing unresolved high Genkit/OpenTelemetry advisories still block full release; not waived by this UI slice.

## Performance/concurrency/resources

Measured entry before slice 981.50 KB / 294.89 KB gzip. Current entry is ~949 KB / 287.7 KB gzip; this is a build-byte observation, not FPS or loading-time proof. Route imports move editor/request/profile/security/support/membership out of initial app logic; no manual side-effect-sensitive vendor splitting introduced. Images reserve 4:3 geometry, lazy load and decode asynchronously. Navbar is opaque rather than animating backdrop blur. Finite entry/hover/toast motion uses transform/opacity; reduced motion removes those transitions. Ask reference morph timing is unchanged.

Cache subscriptions have 200ms no-reader grace and generation cleanup; toast timers/listeners and portal observer clean up. Countdown ticks update only ToastHost, not App/whole catalog. Unit tests cover simultaneous progress cleanup, failed-operation cleanup, overlapping holds, disposal, source deduplication, TTL, retry and late callbacks. Actual frame budget, CPU throttle, memory trace, rapid dialog/route interruption and mobile behavior NOT_RUN.

## Observability, docs, deployment and rollback

No new content/PII/transaction logging. Developer build warnings retained; do not hide them with a higher warning threshold. Local Hosting config sets revalidation globally and immutable caching for content-hashed generated assets only. Live Hosting header readback NOT_RUN; dynamic/private server response policies remain unchanged. Deploy must match generated Functions public-asset manifest and Hosting files. Rollback source shell/cache changes and regenerate manifest; no data migration is needed. Existing governed runtime ledger executable remains unavailable.

## Readiness

Compiler/lint/39 units/build and demo HTTP evidence are recorded in UI-002-TASK_REPORT.md. Browser URL policy remains blocked; no bypass attempted. Product-content principles and actual smoothness remain unverified, so no successful rendered-performance handoff. Tokens/cost Unavailable; memory candidates None.

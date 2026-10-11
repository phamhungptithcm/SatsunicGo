# Candidate quality gates — 74f9af61

| Gate | Result | Evidence / limits |
| --- | --- | --- |
| Compile/build/typecheck | PASSED | Node22 root production and Functions builds, final tsc |
| Unit | PASSED | 130/130 scoped tests; no whole-repository CI claim |
| Integration/security | PASSED | 108/108 emulator tests, strict DTO/owner/staff/expiry/quota/replay/receipt negatives |
| Components | PASSED | Ask36, Account/code9; offline/timeout/account-switch/A→B→A/history/read-only and focus |
| Static analysis | PASSED | Scoped ESLint + git diff --check |
| Architecture | NOT_RUN | Indexes stale; DEGRADED bounded source/dependency/diff review used. No clean architecture gate |
| Language/platform profiles | PASSED | universal, typescript-javascript, API/database/concurrency/web-app, product-content/visual-design/animation-motion reviewed/applied |
| Product content | PASSED | PRODUCT-CONTENT-REVIEW.md eight principles; current candidate native guest and component coverage. Prior unchanged-renderer owner/motion evidence explicitly carried forward |
| Public SEO/GEO | NOT_APPLICABLE | No indexable landing-page change; private callable no-store/noindex/no-referrer reviewed |
| API compatibility | PASSED | Existing owner contract preserved; additive capability endpoints; strict public4-key DTO |
| Database migration | NOT_RUN | No backfill/destructive migration; three production TTL prerequisites missing, release blocked |
| Observability | PASSED | Existing transactional audit preserved; no raw code/IP/PII logging added. Hosted alerting/latency/cost acceptance NOT_RUN |
| Packaging regressions | PASSED | 106/106 immutable artifact/tamper/provider parity tests; candidate deploy bundle not produced/reserved |
| Public production config | PASSED | Required GitHub values present; public config validator; App Check site-key/domain parity verified without logging values |
| Runtime production candidate | NOT_RUN | Two new guest callables absent; secret missing; hosted owner/staff/MFA/App Check acceptance not possible predeploy |
| Motion/accessibility | PASSED | Scoped axe0 violations/incomplete, candidate focus/history tests; unchanged renderer prior native reduce evidence. Physical OS setting/assistive hardware/zoom NOT_RUN |
| Diff self-review | PASSED | Actual49-file commit inspected; upstream history restored and new dependency closure included; unrelated CI/dependencies/rules/App.tsx unchanged |
| Final implementation review | FAILED | Fresh review BLOCKED on production prerequisites and hosted acceptance; self-review only |

Production release: NOT_READY. No push/deploy/production mutation. Memory candidates None. Tokens and actual billed cost Unavailable.

# Quality gates — current scoped patch

| Gate | Result | Evidence / limitation |
| --- | --- | --- |
| Compilation | PASSED | npm run build (includes frontend tsc/Vite/public asset generation); npm run build --workspace functions; logs/frontend-build.log, functions-build.log |
| Unit tests | PASSED | 130 tests/11files plus20 shipping regression tests/3files; logs/unit.log, shipping-regression.log |
| Component tests | PASSED | Ask35 + Account/public-code9; mocked SDK/auth, actual product components; logs/motion-components.log, account-code-components.log |
| Integration tests | PASSED | Baseline100 tests/5files; current changed2suites87/87 (includes8additional boundary timing repetitions), other suites unchanged by source hashes. Firestore emulator18207 and disposable random demo projects; logs/backend.log and logs/continuation-backend.log |
| Actual transport integration | PASSED | Actual Firebase Auth/Firestore/Functions SDK, native Shipping UI ETA→delivery, already-open Account/owner Ask and anonymous Ask; REAL-HTTP.json. Funded IN_TRANSIT prerequisite for native UI plus CHECKOUT-HTTP.json real custom/catalog checkout lifecycle through receipt; demo payment only, no external provider |
| All46 acceptance criteria | PASSED | SCENARIO-RESULTS:46 passed in stated layers; not46 native E2E journeys |
| Static analysis | PASSED | Scoped eslint0errors; HTML fixture explicitly outside ESLint config produced1ignored-file warning. Follow-up lint current cleanup/config/index0errors. No claim of full unrelated-WIP lint |
| Architecture | PASSED | Same bounded transaction/callables and shared UI; additive safe history only; no new datastore/index/rules/config CRUD dependency |
| Language/version profiles | PASSED | universal/typescript-javascript; detected React19/TS6/Vite8/Firebase. HostNode25 differs from Functions22, production runtime not verified |
| Platform/domain profiles | PASSED | frontend-html-css/web-app/api/database/concurrency selected |
| SEO/GEO | NOT_APPLICABLE | Private Account and Ask tracking behavior, no public discovery metadata changes |
| Visual design profile | PASSED | Shared approved timeline retained, no new language toggle/next-step card; final320/390/1280 screenshots |
| Product content profile/gate | PASSED | All eight principles and scoped accessibility evidence current; PRODUCT-CONTENT-REVIEW.md |
| Animation/motion profile | PASSED | MOTION-BROWSER.json: real Chrome media emulation, zero remaining timeline animations/transitions; default restored |
| Language-aware static checks | PASSED | Current frontend/backend TypeScript + scoped ESLint |
| Security | PASSED | Source/rules/emulator/HTTP: current staff/owner auth, four-key guest DTO, no ordinary-ID guest fallback, quotas unchanged, no secret/PII expansion. Scoped local result only |
| Database migration | NOT_APPLICABLE | No schema migration/backfill/rules change; safe additive events and existing version field; old dates unknown |
| API compatibility | PASSED | Existing public DTO unchanged; private event allowlist additive. Internal evolve optional proof context never accepted from a request |
| Observability | PASSED | Existing audit/idempotency/outbox preserved; safe events omit evidence/actor; manual source failure/unknown-state review. Provider dashboards/production alerts not verified |
| Diff self-review | PASSED | Own patch against task-entry backups, targeted source reads and SOURCE-MANIFEST; unrelated WIP preserved |
| Final review | PASSED | Cycle6 scoped local review; production remains NOT_READY and provider acceptance NOT_RUN |
| Search/claims/crawler policy | NOT_APPLICABLE | No search metadata or published business claims touched |
| Responsive/design/accessibility evidence | PASSED | VI/EN320/390/1280; contrast/axe plus native reduced motion and focus recovery. No full WCAG claim |
| Product language8principles/in-context | PASSED | All eight principles with current screenshots and native motion evidence |
| Motion interruption/performance/lifecycle | PASSED | Motion toggling and keyboard close/reopen checked; polling cleanup separate component evidence, native hidden-load limitation retained |
| Provider/release acceptance | NOT_RUN | User explicitly requested no deploy; no production/provider acceptance authorized |

Intelligence: CodeGraph first then CocoIndex DEGRADED; bounded direct source/test evidence used as root AGENTS allows. The executable approval validator requires READY and cannot accept DEGRADED; guard was not modified. This limitation is recorded, not relabelled as a clean index gate. Shared listener/frontend preserved. Missing Auth/Functions emulators restored on approved service ports with existing baseline import; no frontend/Firestore restart or shared reset. Shared Storage missing, not needed by scoped shipping tests. No claim of provider/live production evidence.

Approved expiry-only delta: DEMO-PRICING-APPROVAL.md. Pricing hashes/version restored; positive checkout and injected apply rejection/acknowledgement-loss restorations passed. No prices/formula/version changed. Own test fixtures cleaned (117 business paths,21 native adverse paths,15 lifecycle guard paths), shared settings/quota/counters preserved. No additional frontend/server or deploy. Fresh root build/types/scoped lint passed.

Final focus fix: fresh root build (TypeScript/Vite), scoped lint and Ask35/35 passed. Current backend source hashes unchanged; backend87/87 evidence retained. MOTION-CLEANUP.json confirms15 owned fixture paths removed with0remaining. No deploy.

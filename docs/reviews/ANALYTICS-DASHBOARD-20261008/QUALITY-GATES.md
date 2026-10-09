# Quality gates — analytics scope

Evidence: VERIFICATION.json; source/test hashes: SOURCE_MANIFEST.json cycle6. Native recording is used because ai-agent-kit CLI is unavailable; no kit runtime receipt is claimed.

Detected: TypeScript6, React19.3, Vite8.3, Node22 Functions, Firebase/Firestore, Zod, Vitest, ESLint, Playwright. Profiles applied: universal, typescript-javascript, frontend-html-css, web-app, api, database, concurrency, memory, product-content and visual-design. Domain is web commerce observation/internal CRM.

| Gate | Status | Evidence and boundary |
| --- | --- | --- |
| Compilation | PASSED | npm run typecheck: root and Functions tsc |
| Build | PASSED | npm run build; existing chunk/import warnings; shared output is not a release artifact |
| Unit tests | PASSED | 25 focused tests, 735ms; reviewer independently25/25 |
| Integration tests | PASSED in executed scope | 11 real Firestore18207 cases, callable.run/synthetic auth, 54.54s; actual HTTP/Auth/App Check chain NOT_RUN |
| Browser/regression | PASSED in executed scope | 16 Chromium/current-component/router cases5207, synthetic transport, 14.3s; includes7 original operational regressions |
| Static/language analysis | PASSED in executed scope | Scoped ESLint/tsc; affected5files rechecked after final correction; git diff --check |
| Architecture/compatibility | PASSED in inspected scope | Separate event/sidecar/read model; same commerce payloads; append exports/indexes; legacy queue regression |
| Language/platform/domain profiles | PASSED | Selected from current package/runtime/source; auth/schema/transaction/resource/CSS/rendering checks applied |
| Public SEO/GEO | NOT_APPLICABLE | Internal CRM/optional consent; no metadata/crawler/structured-data/marketing-claim change |
| Visual design | PASSED in executed scope | Blue/white/navy;320/390/1440px;200% scaling; current screenshots/assertions |
| Product content | PASSED in executed scope | PRODUCT-CONTENT.md;160 current strings/templates; all8 principles and contextual states. Safari/Firefox/screen reader NOT_RUN |
| Animation/motion | NOT_APPLICABLE | No new animation; reduced-motion browser setting exercised |
| Security/privacy | PASSED in executed scope | Strict allowlists, capability hashes, server identity/ownership, finance isolation, rules denial, quotas. Authentic production App Check NOT_RUN |
| Database migration | PASSED for source declarations | JSON:13 new expireAt TTL/exemptions and2 additive indexes; retention/expired-read guards tested. Provider application/ACTIVE readback NOT_RUN |
| API compatibility | PASSED in inspected scope | Newv1 contracts; no browser payment authority/existing command-envelope change |
| Observability/error handling | PASSED in inspected scope | Backlog/dead counts/durable loss, as-of/safe partial messages; pending jobs noTTL; production alerts NOT_RUN |
| Performance/resource bounds | PASSED for local bounds | Queue100,batch20/64KiB,dedup200,bounded retries/cache/reads/shards/concurrency; duplicate burst passed. Cold/warm provider latency and reads/writes per1000events NOT_RUN |
| Diff self-review | PASSED in inspected scope | Corrections tested; unrelated WIP preserved; shared Commerce changes separately |
| Final implementation review | FAILED for overall completion | Cycle6 source review PASSED; governed decision BLOCKED by missing actual integrated chain/governance receipts; FINAL-REVIEW.json and REVIEW-CYCLES.md |

Repository intelligence DEGRADED: both health checks passed, indexes stale; AGENTS permits bounded native fallback. Managed approval validator returns FAILED because it hard-codes READY despite human approval and permitted fallback; guard unchanged. Unavailable kit recording is a limitation, not a successful receipt.

Production: NOT_READY / NOT_DEPLOYED. Release isolation, actual integrated app, provider/TTL ACTIVE, exact-artifact and performance evidence remain pending; ACTIVATION.md.

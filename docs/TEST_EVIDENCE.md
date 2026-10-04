# Current local evidence — 2026-10-04

Candidate identity: reviews/CANDIDATE_HASHES.json; Git has no commit. No production deployment artifact is certified.

| Check | Result | Environment and limit |
| --- | --- | --- |
| Typecheck client + Functions | PASS | Node 22.23.3; TypeScript compilation |
| ESLint | PASS | src, packages/domain, functions/src, tests |
| Unit | PASS, 39 tests / 13 files | Integer money, lifecycle, CSV, line changes, parcels/consolidation, media, recent-MFA guards, public HTML, Ask links, fake payOS HMAC |
| Rules/direct handlers | PASS, 23 tests / 2 files | demo-satsunicgo Firestore; handler auth fixtures, not live identities |
| Callable/public HTTP | PASS | Auth/Firestore/Functions emulators; persisted request, idempotency, ownership denial, anonymous/no-UID denial, escaped public HTML/SEO/client entry, unpublished draft denial |
| Vite build | PASS with warnings | Entry 949.34 KB / 287.67 KB gzip; ineffective dynamic imports remain |
| Fresh-process restore | PASS | Firestore and Storage fixture export/import; no schedules/providers started |
| Runtime dependency audit | FAIL | 57 advisories: 51 moderate, 6 high, 0 critical; Genkit/OpenTelemetry unresolved |
| Browser, visual, accessibility, Ask parity | BLOCKED_EXTERNAL | Local URL access rejected by browser policy; no alternate surface used |
| Real OAuth, MFA, App Check, payOS, Gemini, SMTP | NOT_RUN | No live provider calls or financial effects |
| CI run, staging, deployment, rollback, production DR | NOT_RUN | CI source exists; not pushed or executed on GitHub |

Reproduce with Node 22: npm run typecheck; npm run lint; npm test; npm run build; npm run test:rules; npm run test:http; npm run test:restore. Emulator runner hard-codes demo-satsunicgo. HTTP token tests establish emulator behavior, not production cryptographic verification. The SDK labels a malformed token VALID in emulator; the application rejects its missing UID. Unit payment signatures use a fake key and do not establish merchant integration.

All twelve master acceptance scenarios remain binding. Existing fixtures cover portions of scenarios 1–11; none constitutes complete browser/provider acceptance. Scenario 12 and motion parity require interactive rendered checks. Source extraction does not establish product-content acceptance.

UI-002 refresh: 10 public-cache/countdown/progress regression tests added; Node22.23.3 compilation, lint, all39 units and build pass. Demo HTTP rerun passes; it does not execute client JS or verify cache headers on live Hosting. Current rendered/motion acceptance remains blocked.

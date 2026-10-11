# Subscription hardening report — 2026-10-09

Local review: PASSED (bounded scope). Production: NOT_READY.

Executed: 149 unit/regression tests across six files, six actual React hook scenarios in browser, two shared Firestore emulator tests (including 63 server-only denial assertions). Strict frontend and Functions compilation, scoped ESLint and scoped diff whitespace checks passed. Logs and machine-readable scenario records are adjacent. No provider sends occurred; test senders were fakes.

Six findings fixed and verified: final account-lock check; pre-provider claim ownership; corrupted consent/dependency preflight handling; late provider result fencing; client reload/save epoch recovery; per-job worker exception isolation. Red cycle records five delivery test failures, one client failure and one worker failure; fresh local review cycle passes after affected checks.

Business coverage: explicit opt-in → pending → confirmation → active → scoped opt-out; independent promotion/order policy; required financial mail preservation; normalized SMS preparation with unavailable delivery. Client coverage: lost response/idempotent retry, frozen uncertain edits, duplicate clicks, version conflict/reload, sign-out, invalid SMS. Backend/security coverage: version guards, transaction replay, quota cooldown/contention, expiry/stale tokens, generation/destination checks, missing/disabled/unverified identity, queue retirement and claim fencing. Performance coverage: bounded scans and contention/call counts, not production capacity.

| Quality gate | Result / evidence |
|---|---|
| Compilation | PASSED — HARDENING-TSC.log, HARDENING-FUNCTIONS-TSC.log |
| Unit/regression | PASSED — HARDENING-TESTS.json/log: 149 |
| Integration/rules | PASSED — HARDENING-INTEGRATION.log: 2, shared demo only |
| Actual React client | PASSED — HARDENING-CLIENT.json/png: 6, fake service |
| Static/language analysis | PASSED — HARDENING-LINT.log; strict TS |
| Architecture/API compatibility | PASSED scoped review; no public schema/dependency/financial-flow change |
| Quality profiles | TypeScript/JavaScript, web-app, database, existing product-content |
| Security | PASSED bounded endpoint/token/consent/rules scenarios |
| DB migration | NOT_APPLICABLE — no schema/index/rules changes |
| Observability | PASSED review — sanitized job warning; unknown reconciliation preserved |
| Product content/visual/motion | Existing approved production strings/layout unchanged; recovery state tested; diagnostic harness only |
| Final review | PASSED — HARDENING-FINAL-REVIEW.json, source-bound local cycle2 |
| Live authenticated E2E/provider/load | NOT_RUN / NOT_VERIFIED — provider unavailable; no deployment or activation |

Acceptance: scenario inventory, in-scope regression fixes, local tests, scoped review and evidence are complete. Live delivery/performance acceptance remains open and must not be counted as production completion. See HARDENING-SCENARIOS.md for individual scenarios and residual backlog fairness/atomicity limits.

Worktree: dirty with unrelated concurrent changes, preserved. No commit/push/deploy created. HEAD and SHA256 are recorded in HARDENING-SOURCE-MANIFEST.json. This handoff clears hardening edits to the three subscription modules; any later provider integration must revalidate changed hashes and tests. No cross-chat message was sent.

Runtime ledger: Unavailable (ai-agent-kit CLI absent); report uses native captured results and source hashes. Tokens: Unavailable. Actual billed/API-equivalent cost: Unavailable. Memory candidates: None.

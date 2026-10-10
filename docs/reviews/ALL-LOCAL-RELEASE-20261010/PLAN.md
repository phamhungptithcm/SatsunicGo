# All local code release to main

Human authorization: “release toàn bộ code ở local lên main và nếu có PR open thì merge”. This authorizes committing/pushing the pending local application code, integrating open PRs #3 and #6, and promoting the reviewed integration through the existing main release workflow. It does not authorize destructive data operations, secret payload access, disabling safeguards or activating dormant test/email/AI/cleanup policies.

## Concrete impact and implementation

High risk: frontend React/TypeScript, Firebase Functions, checkout/payment/test provenance, guest tracking, notifications, auth, release artifact packaging and additive retention indexes. Source base: 99822aae; verified upstream main: e9d248f3. Preserve the shared working tree and 5207 runtime. Capture local source in an isolated temporary checkout, merge current main and both exact PR heads, run full static/unit/release checks and normal GitHub CI, then promote using merge commits so original PR commits remain reachable. Observe the native release and report deployed state separately from main integration.

Excluded: approximately 1.97GB output/debug files, tmp, Playwright session logs, Python bytecode and browser output. Authored source/docs/previews and test fixtures are included. No production record payloads are intentionally selected. Personal owner email was removed from four newly authored operational documents; no credentials were found by bounded pattern scanning. Untracked JSON/image evidence was not bulk selected. Existing versioned evidence is preserved.

## Conflict decisions

- Preserve main's Google popup CSP fix, sandbox-secret boundary, reviewed retries and demo-only configurable CI emulator helpers.
- Preserve production-test provenance/command guards and fail-closed configuration from PR #3. Do not reactivate live finance/stock effects for simulated records.
- Preserve PR #6 atomic tracking revisions/events, capability-code secrecy, revocation, expiry and quotas; keep guarded app teardown from its latest CI fixes.
- The current local Ask intentionally removes conversation waypoint/current-task navigation. Keep that exact continuous conversation source and its matching component tests, including local first-login composer preservation. Do not reintroduce navigation without its state/guards. Other PR tracking functionality remains integrated.
- Preserve current local cart volatile-memory/revision recovery and Google login lifecycle.
- Regenerate public-assets metadata with the combined public-config build; never hand-maintain generated hashes.

## Validation and promotion

Required: strict frontend/Functions compilation, lint, full unit suite, release/deep-review/config contracts, focused actual-component regressions, source preflight, bounded sensitive-pattern scan, complete normal PR CI and final review. New emulator servers are not permitted locally; integration/Rules/HTTP/restore execute in GitHub CI. Existing genuine MFA/provider/UI acceptance gaps must remain visible. Production is not READY solely because compilation or CI passes. Native release retains immutable artifact/audit/provider readback and fails closed on missing prerequisites.

Rollback: use the prior verified immutable release through the existing approved release path; preserve payment, consent, pending/unknown outcomes, test provenance and guest revocation fences. Do not reset/rewrite shared main or delete production data.

# Current validation — Ask production AI

Approved scope: plan v1 plus 50,000 VND human budget answer. Production activation NOT_RUN. Candidate is isolated from extensive shared WIP and rebased on current verified production source `c4230014959389c3c23b44cdb11c5fe846f815fe` (v0.10.0, run 38012012422). No production write, paid model call, runtime restart or customer fixture was performed.

| Gate | Status | Evidence |
|---|---|---|
| Intelligence | DEGRADED | Stale optional indexes; critical paths opened and verified in source |
| Language/platform profiles | PASSED | TypeScript, React/web, Node/Firebase API, DB/concurrency, agent/cost, devops and product-content |
| Compilation | PASSED | Candidate `npm run typecheck`, exit 0, `/private/tmp/ask-ai-final-typecheck.log` |
| Focused unit | PASSED | 7 files / 124 tests on current candidate, including 47 new admission/workspace/context/answer tests; `/private/tmp/ask-ai-focused-final.log` |
| Full unit | FAILED | Rebased latest production: 164 files pass, 1 fails; 2407 tests pass, 6 fail before six additional Ask tests were copied. `/private/tmp/ask-ai-latest-tests.log` |
| Static analysis | PASSED | Full `npm run lint` exit 0; no dependencies added; `/private/tmp/ask-ai-final-lint.log` |
| Production build/preflight | PASSED | Final source `npm run release:build` exit 0; `/private/tmp/ask-ai-final-build.log`; immutable CI artifact/deployment still required |
| Rules/HTTP/restore | NOT_RUN | Required CI gates; shared emulators were preserved |
| Architecture/API | PASSED | Same callable request/response; additive OWNER action; server-only ledger; strict user ownership retained |
| Security/failure paths | PASSED within focused checks | Locks/auth/MFA/replay/concurrency/unknown provider/schema/source/context regression tests; no weakening of controls |
| Database migration | NOT_APPLICABLE | Additive lazy server-only policy and ledger docs; no migration/datafix or deletion |
| Observability | PASSED source review | Existing policy audit; opaque attempts with reserved/input/provider usage/validated state; sanitized readiness warning, no prompts/tokens/PII |
| Product content/visual | PASSED local component | PRODUCT-CONTENT.md; 320/390/720/1440 no overflow; canary/promote/disable; Escape; unknown/offline/malformed fail closed |
| SEO/GEO/motion | NOT_APPLICABLE | Authenticated admin UI, no public metadata or animation changes |
| Final implementation review | BLOCKED | Two cycles recorded; copy findings fixed, unrelated required unit gate and production evidence remain |
| Production rollout/acceptance | NOT_RUN | No candidate deployment, OWNER canary or customer smoke |

## Release blocker and delta plan

`notification-subscriptions.test.ts` sets `now=1791547200000` (2026-10-09 12:00 UTC). `subscription-delivery-service.ts` checks `Date.now()` at I/O authorization and rejects confirmation fixtures at age >=24 hours. At this check the fixture was >24.65 hours old. Latest production tests previously passed while the fixture was fresh. Proposed delta is confined to the test file: beforeEach freezes Date at the existing fixture timestamp, afterEach restores real timers, leave real timer callbacks and production email code unchanged. Preserve all existing assertions and run focused + complete suite. Human delta approval requested; do not implement it until received.

Rollback: use authenticated OWNER customer-disable control with recent MFA; retains reservation ledger. Restore previous verified immutable release artifact through native release procedures if necessary. No direct production Firestore patch. Existing native pipeline deploys the complete unchanged-plus-Ask artifact; any mismatch with the approved affected-callable release scope must be resolved before deployment.

Final review cycles: cycle 1 found connection readiness and exhaustion recovery wording defects; fixed and verified by current focused tests/rendered component check. Cycle 2 blocks production handoff on full unit and outstanding release/live acceptance gates. Token usage and actual billed cost: Unavailable. No paid provider generation was invoked by this task. Memory candidates: None.

Final source build and full lint passed. A third review cycle rechecked the same source after final build; required unit/integration/release gates remain blocked. Automatic approval review also rejected the public push, requiring explicit disclosure approval. No PR exists. Generated public-assets output and the dependency symlink remain uncommitted in the isolated worktree; no unrelated source is staged.

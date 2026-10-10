# Stable notification / email integration — 2026-10-10

Local integration: **PASSED / LOCAL_STABLE** at commit `99822aae502cc75406184ee345e4527c6e0db66d`, bound to SOURCE-MANIFEST.json and FINAL-SOURCE-FENCE.json (328 files). Production readiness: **NOT_READY**. This task did not activate customer sending or send any real messages.

User asked to coordinate Resend fixes, rerun typecheck/tests, and review notification/email end to end before activation. Direct Resend handoff was delivered; the owner acknowledged reviewing the new local results against source. Existing historical projectId/recipient-narrowing compile errors are fixed in current source. No production source edits were required here. Only new test: tests/integration/customer-email-flow.firestore.test.ts, plus this evidence folder. Parallel unrelated WIP preserved.

## Current checks

- Frontend and backend strict no-emit typecheck on Node22: PASSED, exit0. Normal npm typecheck also emits generated Functions output, so equivalent frontend/backend compiler checks were used without writing active runtime builds.
- All **2372 unit tests**: PASSED,0 failures,0 pending. Focused email subset **414 tests/11 files** also passed; it overlaps the full suite and is not additive.
- **12 actual demo-Firestore integration tests/3 files**: PASSED. Four new composed backend cases cover accepted once, revoked after enqueue, unknown without replay, and disabled inbox-only. Eight existing integration cases cover confirmation/revocation/security and dispatch quota/lease/concurrency. External HTTP/Auth/runtime eligibility/secret ports are controlled substitutes; no real email or live provider proof.
- Scoped ESLint and new-test lint: PASSED. Scoped Git diff whitespace check: PASSED. Prettier applied to new test. 328 source/dependency/test hashes unchanged at final fence.
- Final review **PASSED, cycle2** for local scope. Cycle1 corrected one fixture CTA expectation and strengthened withdrawal timing; product behavior was preserved. Initial sandbox socket failures were rerun with localhost access and passed, not counted as application success.

## Flow reviewed

Committed event → immutable typed snapshot → atomic inbox projection → guarded queue → verified recipient/current resource/confirmed optional consent → pinned claim/body/idempotency → shared Resend quota/adapter → accepted/rejected/unknown durable outcome. Main business producer rules are covered by the full unit suite; the new composed Firestore test uses synthetic committed facts rather than an actual payment settlement. Provider accepted does not mean inbox delivered.

The42 business templates and subscription confirmation/welcome templates serve separate purposes/queues. Optional updates and promotions use independent confirmed preferences; financial/action rules retain their separate eligibility. Conditional/dormant templates do not become enabled through consent alone.

## Remaining and operational boundaries

No production settings readback, provider call, activation, deploy, restart, reseed, financial correction, commit or PR performed. Source releaseCapabilities.email is already true under the prior Resend delta; strict production identity plus validated server settings/cutover remain required. Do not describe the current code flag as false or infer external disabled/enabled state from this test run. Fresh production configuration/worker verification and actual customer delivery remain NOT_VERIFIED. Keep activation outside this handoff.

Live browser/callable/Cloud Functions event/scheduler acceptance, authenticated staff release gates, provider delivery receipts/webhooks, production privacy/retention/monitoring and immutable release/rollback evidence are separate release work. SMS live dispatcher/provider remains outside scope. No unresolved critical/high issue was found within the executed checks; this is not a blanket repository or production certification.

Local criteria:6/6; production delivery excluded from this denominator. See CHECKS.json for each applicable gate and NOT_RUN/NOT_APPLICABLE reasons; FLOW-REVIEW.md for review dimensions, failure paths and limits. Worktree remains dirty with parallel changes. ai-agent-kit runtime CLI unavailable; file-based criteria/check/review ledgers are provided without claiming a runtime receipt. Token usage:Unavailable. Actual billed cost:Unavailable. API-equivalent cost:Unavailable. Memory candidates:None.

# Reply notification provenance

Local scoped review: PASSED after two cycles and independent policy-owner review against all three frozen source/test hashes. Impact and complete evidence are in `REPLY-PROVENANCE-IMPACT.md` and `REPLY-PROVENANCE-REVIEW.json`.

Staff customer replies now inherit only validated execution metadata from the authorized source order. Inbox projection checks that source and job agree before copying the marker into the new notification. Invalid/mixed metadata is blocked before notification creation. Existing live behavior, Google/role/ownership/lock checks, replay safety and current email consent/policy remain unchanged.

Validation: 177 tests across four suites passed, including 24 new callable/projection cases; backend strict, scoped lint and diff check passed. No extra database reads, provider calls, dependencies, indexes, migrations, secret access or runtime changes. Both command and projection retain all reads before writes.

The initial email impact was narrower than suggested: `order_reply` is deliberately `email_if_unread` and excluded by v1 eligibility. It remains ineligible even with valid test provenance. The eligible payment-event control separately proves approved test email and current opt-out behavior. No email allowlist was expanded.

Current inbox UI does not display the stored execution marker; this patch makes no visible badge or browser-acceptance claim. Historical mismatched/unmarked jobs are not backfilled or relabeled. Combined suite, release artifact and deployed/live acceptance must be rebound by the parent. Production readiness is NOT_READY from this scoped evidence alone.

All assigned implementation criteria are complete locally. Worktree remains intentionally modified for parent integration; no commit, push or deployment. Repository intelligence is DEGRADED. Runtime-ledger executable unavailable, so these durable receipts record the review without claiming a generated ledger. Provider token usage and actual billed cost: Unavailable. Memory candidates: None.

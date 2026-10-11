# Backend final review

Scoped backend source review: **PASSED**. Whole production: **BLOCKED / NOT_READY**.

Reviewed the current working source against verified production v0.10.0 (`c4230014959389c3c23b44cdb11c5fe846f815fe`). HEAD is `b916c75cbb0e686fe20e2e52e31dd1a340b2272e`; the checkout is dirty and this is not a deployable-commit claim. 74 backend/domain/dependency inputs are bound by SHA256 in the JSON review. Repository Intelligence is DEGRADED; no graph-complete or live/provider proof is claimed.

The review traced all changed backend producers through policy admission, immutable execution provenance, hosted sandbox callbacks/readback, settlement, finance/fulfillment/invoice consumers, mail, analytics and Ask/feedback. No additional actionable backend/security defect was found within these source checks after the reply correction.

## Finding and correction

`BACKEND-REPLY-PROVENANCE-01` (P2) is fixed. Staff reply outbox now inherits validated authoritative-order provenance; the inbox projector checks source/job mode, run and policy version before creating a derivative notification. Corrupt or mismatched records are blocked; live unmarked records stay unmarked; legacy tests remain conservative. Authorized replay and reads-before-writes are preserved.

The initial email-availability wording is corrected: `order_reply` has deliberately excluded `email_if_unread` policy in v1. The fix closes a metadata/consistency gap and does not enable unread email.

Independent current readback matches all three frozen hashes in `REPLY-PROVENANCE-REVIEW.json`. The owner receipt records 177 tests across four suites, 24 new callable/projection cases, backend strict, scoped lint and diff check passing. Those are owner-executed local checks, not provider evidence. All current finance/email/analytics/preflight receipt inputs also match their frozen source hashes. Email's final receipt reports293 tests/four files and both strict compilers; this reviewer did not duplicate those suites.

## Remaining product and release gates

`PRODUCT-INBOX-TEST-MARKER-01` (P2) is now fixed and rebound. Current `Notifications.tsx` consumes the full persisted row through the existing conservative `TestOrderBadge`; genuine records remain unmarked. Independent source/test hashes match the UI handoff. Root's exact cycle3 browser receipt shows canonical/legacy/partial badges and the genuine control at desktop and390px without horizontal overflow. This is bounded synthetic-render evidence, not auth/backend/provider proof. Native select/200% zoom/spoken AT and full product acceptance remain blocked.

Root still owns current combined CI/rules/audit/build/SDK/artifact acceptance after the last correction, genuine staff MFA, IPN configuration and secret-version/IAM/settings readback, controlled owner canary and live AppCheck/confirmation/opt-out/stale-token checks. Historical2698-unit results predate the correction and are not certified as current whole-candidate evidence here.

The imported research reservation floor may consume the whole50,000VND allocation until historical cost/reservations are reconciled. Do not reset the floor or call the allocation a verified remaining balance. Model pricing expires2026-10-12; no silent renewal is approved. Preserve unknown mail/payment evidence, consent, cutover and quota during rollback; Resend accepted is not inbox delivered.

## Completion evidence

The JSON records all seven review dimensions, five review cycles, receipt bindings, source/evidence hashes, reviewed boundaries, limitations and remaining work. Runtime ai-agent-kit is unavailable on PATH; no runtime ledger receipt is fabricated. No source/test edit, provider call, secret payload access, fixture, runtime change, commit, push or deployment was performed by this review.

Token usage: Unavailable. Actual billed cost: Unavailable. Memory candidates: None.

Notification observation rebound at 2026-10-10T02:05:31.571732+00:00. New source snapshot `be7529d9d277c7a73ebeb794aba3ed6e167acdef5bd8878892c5c4016600b6a4`; prior snapshot remains in JSON history. Retention completion is now freshly reviewed and rebound as described below.


Retention source rebind: **PASSED** at current exact R2 hashes in `RETENTION-COMPLETION-PEER-REVIEW.json`; cycle1 checksum finding remains in history, cycle2 recomputes canonical validated readiness content and verifies producer/runtime parity. Existing69 sources drift only in reviewed retention integration; five added dependencies yield74 source inputs. Exact14 source/impact/runbook plus five logs match owner48runtime/145Node/strict/lint/preflight110 exit0. Protected independent policy/readiness transactions, exact classes/durations/update-time bounds, immutable three-index digest, create-only trusted-main tooling and exact Scheduler checks are reviewed. No provider/IAM/activation or deletions were performed. Whole production remains **BLOCKED** pending root combined checks and current effective permissions, READY indexes, Scheduler/invocation proof, protected activation/renewal and other live/UI/MFA gates. A bounded hourly job and expiresAt metadata do not establish continuous physical erasure assurance.

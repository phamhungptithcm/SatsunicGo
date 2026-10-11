# Resend customer email — production delta v1

Plan ID: **PRODUCTION-INTEGRATION-20261009/EMAIL-RELEASE-DELTA-v1**.
Prepared 2026-10-09 16:06 UTC. Base: `0d6e721698608eebb36b0b2f68021c3054d97d1c`; shared dirty checkout.
Approval: **APPROVED** by the human owner's reply “Duyệt triển khai delta v1” in this chat; see `EMAIL-RELEASE-APPROVAL-v1.md`. This document is not an activation receipt.

## Outcome and existing authority

Connect the two existing email workers to the already tested server-only Resend adapter, make new eligible business events reach the customer worker, and prepare a production artifact that excludes demo payment endpoints. Preserve confirmation, current consent, owner checks, financial semantics and unknown-outcome fences. Release only after all current handoffs, checks and required approvals pass.

The user authorized automatic integration/release after handoff and selected `contact@hunpeolabs.com`. Earlier customer-email and subscription plans approved local implementation while retaining transport/release holds. Their approval does not establish review of the transport, cutover, quota, settings and preflight changes below. The private Resend self-test approval covers a different IAM-only endpoint.

## Intelligence and verified gap

- CodeGraph queried before CocoIndex; both tools responded. The current gate reports **DEGRADED** because both indexes are stale. Native canonical source, compiler and executable tests bound the conclusions; copies under `output/` are excluded.
- Backend: TypeScript, Firebase Functions v2, Node22, Firestore transactions; frontend: React/Vite. No new dependency or framework change is proposed.
- `email.ts` and `subscription-email.ts` still require SMTP settings and bind `SMTP_PASSWORD`, which was absent in the last secret metadata read. The user confirmed the new Resend key lives in `SFTP_PASSWORD:1`. No secret payload was accessed.
- `customer-notification-delivery.ts` creates one inbox notification but leaves eligible mail `blocked_external`. Its existing scheduled recovery is inside demo-only `maintenance`; enabling the email flag alone cannot send customer events.
- `provider-release-gate.ts` denies email in every environment. `notificationPreferences` would otherwise expose availability using that gate plus settings.
- Current preflight rejects additional conditional demo exports; the current generated public-asset binding also needs a fresh source build. Neither failure may be bypassed.
- Domain lookup through the Resend dashboard redirected to login. **Domain status remains NOT_VERIFIED**, not failed or verified. Public documentation is not account-specific proof.

## Proposed flow

1. A business transaction writes its immutable typed event to `outboxJobs` as today.
2. The existing creation trigger validates the event/resource, creates the idempotent inbox item and reads server-owned email policy. Only an event at/after the approved cutover with a ready email capability/configuration becomes `emailState=queued`. Other events retain their blocked/suppressed state.
3. The existing customer worker claims at most20 jobs per scheduled invocation. It rechecks event/resource, Auth identity, account lock, current consent and policy immediately before provider I/O.
4. Pin provider, From, recipient and rendered-content identity to the claim. Use a bounded deterministic idempotency key derived from the queue/job identity and protocol version. A changed recipient, sender or content must never silently reuse an earlier provider request.
5. Reserve one shared daily provider-attempt slot transactionally across both workers; then call `sendResend` once. Provider accepted, explicit rejection and uncertain outcome have distinct durable results. An uncertain request is never automatically resent.
6. The separate subscription worker uses the same adapter/quota boundary while preserving its own queue, token generations, destination hash, expiry and current consent. SMS stays unavailable until an actual approved provider exists.

No old `blocked_external`, failed, sent, accepted, suppressed or unknown jobs are drained/requeued by this change. New post-cutover events are enough for the forward path. A historical replay/recovery or production datafix requires a separate bounded decision. `maintenance` remains held; no expiry/delete/finance jobs are enabled to solve email.

## File and function impact

| File / function | Concrete change | Required evidence |
| --- | --- | --- |
| `functions/src/email/provider-config.ts` (new) | Strict server-only Resend configuration parser; exact production project/database identity; From matches approved verified domain; no SMTP fallback | Missing/malformed/wrong project/domain/config deny before provider or quota |
| `functions/src/email/dispatch.ts` (new) | Reuse `sendResend`; immutable request identity, bounded key, shared quota reservation, sanitized outcomes | Parallel workers cannot exceed cap; no raw body/recipient/token/key logging; same request identity |
| `functions/src/email.ts` / `deliverEmail` | Replace Nodemailer call/binding with the Resend boundary; retain claim UUID/version, resource/consent checks and late-outcome audit; transient Auth failure remains known-unsent/retryable instead of permanent recipient suppression | Existing13 security regressions plus explicit rejection, transient dependency, unknown, sender drift, cutover and quota cases |
| `functions/src/subscription-email.ts` / `deliverSubscriptionEmail` | Replace SMTP with the same Resend boundary; preserve existing queue and scheduling | Confirmation/welcome do not fall through order renderer; no new consumer |
| `functions/src/subscription-delivery-service.ts` / `SubscriptionSender`, `deliverSubscriptionJob` | Extend the internal sender result to carry provider accepted ID and persist it under the existing claim fence; preserve return-state compatibility where callers rely on it | All current49 subscription tests; rejected/unknown/provider-ID/late-result and generation races |
| `functions/src/customer-notification-delivery.ts` / `projectCustomerNotification` | Read server email configuration in the existing transaction and queue only new eligible post-cutover events when the capability is ready | Duplicate trigger creates one inbox item/job, pre-cutover blocked, disabled config causes no sends |
| `functions/src/provider-release-gate.ts` / `releaseCapabilityAllowed` | Permit only the reviewed email capability on exact `satsunicgo` runtime and actual database; retain all other holds | Missing/conflicting/emulator project cannot enable customer sending; settings cannot bypass code-owned release eligibility |
| `functions/src/notification-preferences.ts` / `notificationPreferences` | Availability reflects the same validated ready config, not only two booleans | UI cannot promise email while transport/domain/config is unavailable; App Check unchanged |
| `firestore.rules` | Explicitly deny client access to new technical dispatch quota records if needed; preserve existing broader denial and all business rules | Guest/owner/staff read/write denial; Admin transactional quota works only in tests/runtime |
| `tests/unit/email-provider-config.test.ts`, `email-dispatch.test.ts` (new), affected existing email/subscription tests | Cover actual new behavior with fake provider/clock/identity | Unit and failure-path coverage, no real key required |
| `tests/integration/email-dispatch.firestore.test.ts` (new) | Real demo Firestore concurrency, claim, quota and cleanup assertions; unique owned fixtures | Exact demo guard; no baseline reseed, shared settings replacement or provider send |
| `scripts/release/preflight.mjs`, `tests/unit/release-preflight067.test.ts`, `tests/unit/provider-release-gate067.test.ts` | Recognize only the exact four additional demo-only exports and verify guard/import/target/trigger shape; keep unsupported shapes rejected; verify exact email release eligibility | Valid exact guards excluded from production inventory; altered guard/reexport/mutable alias rejected; production discovery contains no demo endpoint |
| Existing review/runbook documents | Current manifests, approval, product-language/state inventory where exposed availability changes, final review, activation/rollback ledger | Source-bound evidence and all required content principles; no invented provider delivery |

`email/resend.ts` remains the transport source unless a test proves its existing bounded contract needs an approved in-scope correction. Its10s timeout,4096-byte response limit, redirect refusal and one-recipient contract remain. No Resend SDK dependency is needed. `jobs.ts`, payment business logic, Ask/LLM gates, UI layout, CI workflow and dependency versions are outside this delta.

The existing release-preflight and provider-gate suites above were located in canonical source. Add assertions there; do not create competing release validators or modify other release gates.

## Configuration, quota and cutover contract

Proposed `settings/email` fields, restricted to trusted server/admin configuration:

- `approved:true`, `provider:"resend"`, `enabled`, `subscriptionsEnabled`.
- `from:"contact@hunpeolabs.com"`, `verifiedDomain:"hunpeolabs.com"`; an authenticated provider verification receipt tied to this release must exist before production enablement. A writable boolean or document by itself is not proof of provider verification.
- `cutoverAt`: one server-derived UTC epoch-millisecond boundary shared with `settings/customerNotifications.cutoverAt`; no arbitrary backdating. Existing customer policy approval/eligibility checks remain.
- `dailyAttemptLimit`: **maximum100 per UTC day** across customer and subscription mail as a conservative initial operational cap, reduced further if provider/account limits are lower. This number is proposed for approval; it does not assert any Resend plan entitlement or price. No paid upgrade or subscription purchase is authorized.
- A code cap of20 jobs/invocation per existing worker; existing30-minute schedule and one instance remain. A shared rate reservation permits at most one dispatch per second across both workers, reduced further if the verified account limit is lower; deferred jobs do not burn a send attempt before dispatch eligibility.

New technical collection `emailDispatchQuota` has one shared `resend` record storing the current UTC day, counts/reservation timestamps and protocol version only. A transactional, monotonic day rollover updates that record in place; an older invocation cannot roll it backwards or reset the current count. It contains no recipient, message body, token, key or business payload. No historical quota documents or automatic permanent cleanup are introduced.

The two workers bind `SFTP_PASSWORD`; only Cloud Functions/Cloud Run reads its payload. Before deploy, verify metadata/access for version1; after deploy, verify the actual binding resolves to version1. `defineSecret` alone must not be described as an immutable version pin. If another version is selected or rotation changes it, stop and review that secret delta. Retain the private self-test endpoint disabled and its existing IAM restrictions.

Production configuration writes are limited to the two settings documents above and the new revision's approved secret/runtime bindings; record before/after values with sensitive fields omitted. No queue reset, customer contact edit, consent backfill, financial correction or arbitrary production database edit is included.

## Failure and compatibility rules

- Retain legacy `emailState=sent` as the internal accepted compatibility state if existing consumers require it; accompany it with `providerState=accepted`, provider ID and accepted timestamp. Never label it inbox delivered. Subscription accepted remains accepted.
- Bad configuration/content is rejected before I/O. Explicit provider rejection is recorded without automatic unlimited retries.429/backpressure must defer safely within the approved attempt/window bounds and preserve immutable request identity; unknown/5xx/timeout are reconciliable, never assumed unsent.
- An Auth outage is not proof of account deletion. Permanent missing/disabled/unverified/locked identities remain blocked. Failures after claiming but before network cannot leave an unbounded poison queued/sending job.
- No automatic retry after the24-hour provider idempotency window. The existing durable state remains authoritative for replay; user resubmission must not duplicate an accepted/unknown request.
- Revoked optional notification consent, changed destination, changed resource ownership, stale action-needed event, outdated token generation or expired confirmation suppresses sending. Financial/security messages retain the current approved category policy.
- Do not log or export PII, raw confirmation/unsubscribe links, Authorization headers, key values or provider error bodies. Metrics use technical counts/state/release identifiers. Provider IDs are restricted operational metadata.

## Verification sequence and release evidence

1. Collect fresh final handoffs for all four chats; compare current hashes and affected caller tests. Idle is not acceptance. Freeze a reviewed candidate before commit.
2. Run Node22 unit/security/content tests; frontend and backend typecheck; scoped lint; exact demo Firestore tests for consent/confirmation/quota/claim races and cleanup. Do not restart/reseed the shared runtime.
3. Rebuild the source-bound release artifact using the repository workflow, regenerate assets from their source, run production dependency audit, preflight/export inventory and artifact/source comparison. No generated-file hand edits or CI bypass.
4. Review → fix in-scope findings → verify → review again; refresh manifests after every source change. UI availability/content changes also require the Product Language Gate with current rendered evidence.
5. Verify the provider domain through an authenticated Resend domain status response/dashboard. Current UI attempt is login-blocked. DNS presence or the selected From address is insufficient.
6. Commit/push via the normal release workflow only when the candidate satisfies its predeployment conditions, with customer sending disabled. Push to main triggers deployment. Never deploy dirty local source or sandbox payment endpoints. Preserve workflow inventory deletion protection and rollback artifact.
7. Read back exact artifact/revisions, scheduler, IAM, secret version and disabled configuration. Enable only after readiness checks pass; record cutover before producing new business events. Do not enable unrelated capabilities.
8. Run **one email canary to the owner's previously approved test recipient**, through the existing subscription-confirmation flow after the owner's explicit opt-in. Observe provider accepted ID and dashboard status; report delivery only if evidenced. No fixture/customer addresses are used as arbitrary canary recipients, no old backlog is sent, and no production order/payment/financial record is created as a probe.
9. Verify live confirmed opt-in, scoped opt-out, stale token rejection, current availability and operational counts. Public App Check/browser acceptance is required. If the owner session/explicit opt-in is unavailable, leave the live gate pending; a different private canary seam requires its own reviewed delta.

Stages6–9 follow build/approval, normal push/deploy with sending off, readback, then canary/activation. They do not authorize direct deploy outside that workflow. The application release stays provisionally NOT_READY until postdeployment acceptance passes. Any unavoidable change to that workflow needs its own delta review.

## Rollback

First set sending disabled and confirm both workers make no provider attempts; preserve accepted/unknown states and consent. Roll back the immutable application artifact/revisions using the repository release process. Preserve the approved cutover and quota history; do not reset attempts or force unknown jobs back to queued. No financial or customer records are changed. Do not remove production Functions implicitly to hide an inventory mismatch.

## Approval requested

Approve implementation and verification of this exact delta, including the technical quota collection, narrow preflight demo-export recognition, runtime secret binding and forward-only email cutover. Production customer sending remains conditional on authenticated verified-domain proof, current handoffs, live checks and a passing release review. The user's prior automatic-release authorization continues to apply once these conditions are met.

Token usage / actual billed cost: **Unavailable**. This preparation made no Gemini or Resend send call. Memory candidates: **None**.

Primary references checked 2026-10-09: [Resend verified domains](https://resend.com/docs/dashboard/domains/introduction) and [idempotency keys](https://resend.com/docs/dashboard/emails/idempotency-keys). The latter documents a24-hour deduplication window; neither page verifies this account or domain.

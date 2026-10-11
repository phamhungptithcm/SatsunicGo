# Resend self-test runbook

Current state: private operator endpoint deployed and verified; `EMAIL_TEST_ENABLED=false`. One test request was accepted by Resend. The same operation ID returns the same stored result while enabled. Inbox delivery has not been verified.

## Ownership and integration

- This slice owns `functions/src/email/**` and `email-test-release.ts`, plus its tests and review directory. It does not own or deploy `email.ts`, `email-content.ts`, `jobs.ts`, purchase/payment modules or the main index. Those files may change concurrently in the customer-notification workstream.
- `sendResend` accepts a server-authorized single-recipient message, a server-only key and a stable idempotency key; it returns `accepted`, `rejected` or `unknown`. Its `EmailContent` contract is `subject/text/html`. It does not authorize customer recipients, escape future dynamic templates, consume an outbox, infer consent or implement webhook delivery reconciliation.
- The trial uses user-confirmed `SFTP_PASSWORD:1`. This legacy name contains a Resend API key. Do not treat the existing worker's separate `SMTP_PASSWORD` reference as configured by this trial. A future approved customer cutover must explicitly resolve the secret mapping and verified sender domain.
- Keep one logical sender for each customer event. Do not independently send a purchase receipt from both `purchaseEmailOutbox` and the general outbox. Never feed email addresses, bodies or credentials to an LLM or logs.

## Invocation contract

Only project-authorized IAM callers can reach the endpoint. The caller cannot provide sender, recipient, subject, body, attachment, URL, timestamp, quota, status or template version.

```json
{"operationId":"<new UUID for one explicitly requested test>"}
```

The private server config contains the approved account owner's recipient, `GCLOUD_PROJECT=satsunicgo` and the disabled-by-default test flag. Do not commit this config or key values. Current private config is outside the artifact, mode 0600. Credentials are supplied through a pinned Secret Manager version at runtime, never through application source or a frontend environment variable.

For an authorized future trial, use the standalone artifact and the approved private config. Google may create a new build and source generation even for an environment-only update: verify the new archive bytes, build result, revision, private IAM and exact secret binding each time. Do not assume a configuration patch reuses a build. Disable the flag after the trial and verify both authenticated `TEST_DISABLED` and anonymous IAM denial.

The deployed resource is `emailSelfTest` in `satsunicgo`, `asia-southeast1`. It is a standalone `cli-gcloud` resource, without the `firebase-functions-codebase=satsunicgo` label. The normal release verifier filters that codebase in `scripts/release/verify-production.mjs:17`; this operator endpoint is independently owned and must remain private. It is not exported by the main application entry.

## Failure and reconciliation

- The technical transaction claims the operation and consumes quota before provider I/O. Limit: 3 attempts per UTC day and at least 60 seconds between new claims, including across midnight. Failed and uncertain attempts count.
- Replays use durable local records, including after the provider's [24-hour idempotency window](https://resend.com/docs/dashboard/emails/idempotency-keys). Do not delete those records or switch operation IDs to recover an unknown outcome.
- `accepted` means a valid provider message ID was persisted. It does not mean delivered, read or paid.
- Timeout, unexpected provider response, lost final write or an abandoned claim stays `unknown`. No automatic retry. Inspect the provider record before requesting a separately authorized test.
- Rejected/missing configuration is terminal for that operation. Correct configuration through the approved process; do not replay historical customer queues.
- Technical records contain a recipient/content fingerprint, state, provider ID and timestamps, not raw recipient/body/key. The fingerprint is pseudonymous metadata, not anonymous data. Records are retained as dedup tombstones; no customer retention policy is invented here.
- For HTTP error checks, `gcloud functions call` may omit the response body in its error formatter. Verify the actual status/body with an authenticated HTTP client or bounded provider status logs; do not mark a case failed solely because its error text was absent.

## Evidence

- `FINAL-PROVIDER-READBACK.json`: disabled state, IAM denial, exact final source, build/revision/image digest, one quota claim and persisted acceptance.
- `ARTIFACT-MANIFEST.json`, `SOURCE-ARCHIVE-VERIFICATION.json`, `FINAL-SOURCE-ARCHIVE-VERIFICATION.json`: local/source archive equality, including after deactivation.
- `LIVE-SEND.json`, `LIVE-REPLAY.json`, `LIVE-BAD-REQUEST.json`, `LIVE-HTTP-STATUSES.json`: accepted send, same-result replay, invalid input rejection and bounded performance samples.
- `PLAN.md`, `APPROVAL.md`, `PRODUCT-CONTENT-REVIEW.md`, `SCENARIOS.md`, review cycles and `REPORT.md`: scope, approval, checks, limitations and current handoff.

Customer activation is a separate approval and readiness decision: verified sender domain, authoritative business events, owner/consent checks, one outbox consumer, bounce/complaint handling, reconciliation, customer templates and live acceptance. This trial does not lift any existing customer-email or maintenance hold.

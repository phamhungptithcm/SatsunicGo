# Resend self-test · v1

## Outcome and authority

Prepare and verify one operator-only email test. The user requested hardened Resend integration, selected “Chuẩn bị gửi thử trước”, confirmed key rotation, and identified `SFTP_PASSWORD` as the new key's secret name. No key payload has been read locally. Metadata confirms enabled version 1 in project `satsunicgo`.

Approval: APPROVED by the repository owner in this chat on 2026-10-09, answering the plan v1 question with “Duyệt triển khai và gửi thử”. Approved scope is the private test-only implementation, its verification and one self-test email. This document does not authorize customer email activation.

## Verified current system

- Base: `0d6e721698608eebb36b0b2f68021c3054d97d1c`; shared worktree contains unrelated purchase/SePay changes.
- TypeScript, Node.js 22, Firebase Functions v2, Admin Firestore, Vitest, ESLint.
- `deliverEmail` uses SMTP/Nodemailer and is held by the code-owned email release gate. Maintenance is also held. Purchase receipt email has a separate outbox without a production transport consumer.
- Intelligence: DEGRADED; CodeGraph/CocoIndex are stale. Targeted source, configuration, tests and Git inspection provide bounded evidence. This is not a whole-system readiness assessment.

## Smallest safe implementation

1. Add `functions/src/email/resend.ts`: reusable server-only Resend HTTP adapter using Node 22 native fetch. Fixed HTTPS endpoint, no redirects, 10-second timeout including response read, bounded response, validated provider UUID, stable idempotency key, no SDK/dependency change, no raw provider errors or PII logs. Distinguish provider acceptance, definite rejection, and unknown outcome.
2. Add `functions/src/email/self-test.ts`: private IAM HTTP function, production project check, explicit disabled-by-default activation, POST JSON with only a UUID operation ID, fixed `onboarding@resend.dev` sender and one private server-configured operator recipient. The recipient cannot be supplied by the caller. No attachments, tracking, customer data, LLM, arbitrary HTML or URLs.
3. Add `functions/src/email/self-test-service.ts`: Firestore transactional claim and a global quota (3 attempts per UTC day, 60-second cooldown). Replays never resend, including after Resend's 24-hour idempotency window. Pending, unknown and failed sends require inspection; no automatic retry. Store operation ID, recipient/template fingerprint, bounded status, provider ID and timestamps, never recipient/body/key. No scans or new indexes.
4. Add `functions/src/email/self-test-content.ts`: one short Vietnamese test email, subject/text/semantic HTML; no delivery or customer-readiness claim. Version its content.
5. Add standalone `functions/src/email-test-release.ts`: initialize Admin SDK and export only the private test function. Keep the main application entry, existing customer worker, release holds, UI, CI, lockfiles and dirty purchase files unchanged.
6. Add focused unit and database integration scenarios. Prepare a source-fenced isolated artifact from the approved Node 22 dependency graph. Only deploy the private test function; no full application deploy or historical outbox replay. Bind only `SFTP_PASSWORD:1`; grant only that secret to the existing function runtime identity if necessary.

## Flow and boundaries

Operator IAM → method/project/activation/input/config checks → transactional operation + quota claim → secret supplied to server adapter → one Resend request → fenced operation result → sanitized response.

Provider `accepted` means Resend returned a valid message ID. It does not prove inbox delivery. A timeout or failed state write must not cause another send. Private IAM readback and an unauthenticated denial check precede the authorized self-test. Production inbox delivery needs separate provider/inbox evidence.

## Validation and review

- Happy acceptance, malformed input/config, forged recipient/content, wrong project/emulator/disabled gate, missing key, invalid provider ID/oversized/slow response, HTTP rejection/429/5xx/redirect/network timeout.
- Concurrent same operation sends once; concurrent different operations respect cooldown/cap; duplicate after 24 hours never resends; configuration/template mismatch fails closed; database claim failure makes no provider call; outcome-write failure remains uncertain; stale claim never auto-retries; no secret/recipient/body in persisted records or responses.
- Compile exact standalone dependency graph; focused ESLint; legacy email hold/content and release regression tests. Run a fresh final implementation review → fix → verify → review cycle. Email wording review uses the rendered exact template as an explicitly disclosed browser proxy.
- Live evidence: exact artifact/source hashes, Node 22 runtime, private IAM, secret version binding metadata, denied anonymous request, one authorized test request, replay, provider acceptance. Do not access the secret payload on the workstation or send customer email.

## Risk, deployment and rollback

Risk: medium, because this introduces bounded outbound email and technical Firestore writes in production. No commerce, customer data or monetary state is changed. Minimum instances 0, maximum instances 1, concurrency 1, request timeout 30 seconds. Uncertain attempts consume quota. Disable the test flag after verification; retain operation records to prevent later replay. Rollback is disabling the new test function; existing release capabilities remain held. No cleanup of historical customer data.

Deferred: verified customer sender domain, production notification policies, purchase email integration, bounces/complaints/delivery webhooks, customer preferences/retention and scaled queue performance. Work with `CUSTOMER-EMAILS-20261009` drafts without treating them as activation approval.

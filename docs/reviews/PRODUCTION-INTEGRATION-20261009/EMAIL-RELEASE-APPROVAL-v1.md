# Reviewed implementation approval

Plan ID/version: PRODUCTION-INTEGRATION-20261009/EMAIL-RELEASE-DELTA-v1
Repository intelligence gate status: READY — actual refresh and check receipt /private/tmp/satsunicgo-email-delta-index-ready.txt; both Current/Passed before protected edits. Initial analysis used permitted DEGRADED fallback; future drift invalidates freshness.
Approval status: APPROVED
Approver: human repository owner in this chat
Approval timestamp or task reference: 01a116b3-a055-7190-b275-a4461826678a; call_4b0321ad02ec4dadb6067ef39df706d4 question0; direct user reply "Duyệt triển khai delta v1"
Approved scope: exact file/function/configuration/test changes in EMAIL-RELEASE-DELTA-v1
Approved paths:
- `scripts/release/artifact.mjs`
- `tests/unit/release108.test.mjs`
- `functions/src/outbox-command.ts`
- `tests/unit/outbox-resend-readiness.test.ts`
- `functions/src/email/provider-config.ts`
- `functions/src/email/dispatch.ts`
- `functions/src/email/resend.ts`
- `functions/src/email.ts`
- `functions/src/subscription-email.ts`
- `functions/src/subscription-delivery-service.ts`
- `functions/src/customer-notification-delivery.ts`
- `functions/src/provider-release-gate.ts`
- `functions/src/notification-preferences.ts`
- `firestore.rules`
- `scripts/release/preflight.mjs`
- `tests/unit/email-provider-config.test.ts`
- `tests/unit/email-dispatch.test.ts`
- `tests/unit/email-delivery-security.test.ts`
- `tests/unit/customer-emails.test.ts`
- `tests/unit/notification-subscriptions.test.ts`
- `tests/unit/notification-worker.test.ts`
- `tests/unit/notification-endpoint.test.ts`
- `tests/unit/release-preflight067.test.ts`
- `tests/unit/provider-release-gate067.test.ts`
- `tests/integration/email-dispatch.firestore.test.ts`
- `docs/LOCAL_RUNBOOK.md`
- `docs/PRODUCT_AND_WORKFLOWS.md`
- `docs/EXTERNAL_SETUP_REQUIRED.md`
- `docs/qa/system-scenarios/README.md`
- `docs/reviews/PRODUCTION-INTEGRATION-20261009/**`

Required constraints: exact plan constraints below; preserve other owners' WIP and runtime.

Coverage clarification: the existing worker/endpoint suites and four current runbooks above implement v1's approved affected email/subscription tests and runbook documentation scope. They add no public feature or new activation authority.

Supplemental approval v1.2: direct human reply "Duyệt v1.2 và cấu hình DNS" to request_user_input_async/call_2b47b74bfd064668ab85ac88d3b5b64d question0. Exact scope: retain only deliverEmail/./email in the production artifact, preserve unrelated holds, add hunpeolabs.com to authenticated Resend and add missing provider-generated sending DNS records at GoDaddy without replacing/deleting existing records. Conflicts, credential/access changes and activation still follow the exact v1.2 constraints. This approval is not provider verification or deployment evidence.

Supplemental approval: EMAIL-RELEASE-DELTA-v1.1 approved by direct human reply "Duyệt bổ sung v1.1" to call_0065287369784c568b59e6a1c1101f6a question0. The four additional paths above implement only artifact exclusion compatibility and existing staff retry readiness; no broader scope.

Plan: `PRODUCTION-INTEGRATION-20261009/EMAIL-RELEASE-DELTA-v1`.
Plan path: `docs/reviews/PRODUCTION-INTEGRATION-20261009/EMAIL-RELEASE-DELTA-v1.md`.
Approval status: APPROVED
Approver: human repository owner, directly in this chat.
Task reference: `01a116b3-a055-7190-b275-a4461826678a`.
Approval evidence: user reply to `request_user_input_async/call_4b0321ad02ec4dadb6067ef39df706d4`, question0: **“Duyệt triển khai delta v1”**.
Recorded 2026-10-09 16:12 UTC; record time is not a claimed exact user-message timestamp.

Approved scope: the file/function/configuration/test changes specified in EMAIL-RELEASE-DELTA-v1, Resend integration for the two existing email queues, technical shared100/day maximum quota and one/second dispatch rate, forward-only cutover, exact production identity checks, narrow guarded demo-export preflight recognition, verification and normal release preparation.

Constraints: preserve consent, claim/version/generation/unknown fences, financial/business semantics, other chats' WIP and shared runtime; no new dependency/framework/CI changes; no secret payload access, customer-address canary, historical queue drain, production datafix or unrelated capability activation. Customer sending requires authenticated provider domain verification, current handoffs, required checks, artifact/readback and release review. Existing automatic-release approval continues only with those conditions.

Repository intelligence began **DEGRADED**. An initial cache refresh failed because sandbox access to the CocoIndex daemon log was denied; permitted retry completed and the actual check returned **READY** with both indexes Current/Passed before edits. Source/index drift still requires bounded source verification and fresh evidence at final review. This is a reviewable repository approval record transcribing direct human evidence, not native runtime CLI attestation.

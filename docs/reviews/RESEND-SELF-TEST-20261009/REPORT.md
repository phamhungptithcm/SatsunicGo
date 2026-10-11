# Resend self-test · completion report

Outcome: **VERIFIED — one operator test accepted by Resend; test safely disabled afterwards.** Fresh scoped final review: **PASSED, cycle 4**. Customer email automation: **NOT_READY / NOT ACTIVATED**. Inbox delivery: **NOT_VERIFIED**.

## Acceptance and scope

The repository owner approved PLAN.md v1 and one self-test on 2026-10-09. Eight equally weighted criteria are verified (8/8 for this private pilot; this is not a whole-product progress score):

| Criterion | Weight | Status | Evidence |
| --- | --- | --- | --- |
| Bounded server-only Resend transport | 1 | PASSED | resend.ts, final unit checks |
| Private IAM, project/config/input controls | 1 | PASSED | endpoint tests, live403/400, provider readback |
| Durable dedup, quota and unknown handling | 1 | PASSED | unit/Firestore concurrency, real quota1 |
| Exact natural Vietnamese test content | 1 | PASSED | product review, generated browser proxy |
| Proportional local checks | 1 | PASSED | 64 current owned unit tests,4 integration checks, compilation/lint |
| Isolated source-fenced deployment | 1 | PASSED | exact13-file archive comparison, buildSUCCESS, revision/image digest |
| One accepted send, replay and invalid input | 1 | PASSED | LIVE-SEND/REPLAY/BAD-REQUEST |
| Deactivate and verify safe final state | 1 | PASSED | Function +CloudRun flagfalse, authenticated403 TEST_DISABLED, anonymous IAM403 |

This work owns only `functions/src/email/**`, `email-test-release.ts`, four tests and this directory. It did not edit/deploy the main index, general customer worker, customer templates/jobs, purchase/payment modules, frontend, CI, shared dependencies or release holds. Other chats are changing some of those files concurrently; their work is not certified by this report.

## Verification

- Current 64 owned unit tests passed;4 real Firestore emulator integration checks passed, with actual anonymous technical-record read/write denial. No emulator restart, reseed or rules replacement.
- Earlier related baseline:151 Vitest unit/preflight and71 Node release regression checks passed. These are point-in-time results, not fresh certification of later concurrent customer-worker edits. The current owned64-unit suite was rerun after final test changes.
- Root TypeScript and Functions TypeScript passed at their recorded earlier checks. Fresh isolated Node22 compilation from the frozen source reproduces every deployed JS file byte for byte. Focused ESLint passes for owned source/tests.
- Standalone locked graph:245 packages, three existing exact direct versions; audit reports0 vulnerabilities. This says nothing about unrelated full workspace dependency findings.
- Source fence: current five source files match the artifact; Google uploaded13 files and both initial/final archives have SHA256 `1fc26405ac7e88f59ad076b5ab36a3997aba0396f1a6908698a7b1d6ca43aaf5`. Final Cloud Build SUCCESS; revision `emailselftest-00002-fud`; image digest recorded in FINAL-PROVIDER-READBACK.json.
- `emailSelfTest` is a separate `cli-gcloud` resource without the main Firebase codebase label. The main release verifier filters `firebase-functions-codebase=satsunicgo`; no main inventory or Hosting release was changed.
- Real Resend acceptance persisted with a valid provider ID. Replay returns the same ID. Actual daily attempts:1. Input adding a synthetic recipient returned HTTP400; authenticated calls now return403 TEST_DISABLED, anonymous calls are denied by IAM before the handler.
- Two successful live request latency samples:5.108 seconds for the first request,155 milliseconds for stored replay. These include request/database/provider work; they are not a capacity benchmark or p95/SLO claim. Pilot limits are max1 instance, concurrency1, timeout30seconds, provider timeout10seconds, request512bytes, provider response4096bytes,3 attempts/day and60-second cooldown.

## Review and fix loop

1. Cycle1 BLOCKED: fingerprint covered only the declared version; added exact content fingerprint. Corrected UUID test-helper type and added sanitized blocked-attempt logs. Initial test.each harness mistake was also fixed. Executable unit/compiler/integration checks passed after fixes.
2. Cycle2 PASSED: local implementation and approval-bound canary readiness. Live evidence still explicitly NOT_RUN at this stage.
3. Cycle3 BLOCKED: gcloud omitted the invalid-request body from its error formatter; verified HTTP400 through the bounded provider status log and quota. Google rebuilt/copied source when changing only the test flag, invalidating an assumed reuse check; downloaded and matched the final archive and verified the new build.
4. Cycle4 PASSED: fresh scoped self-review of requirements, security/PII/auth/secrets, correctness, failure/concurrency paths, error handling, product language, provider state and trade-offs. No open finding within the executed scope. This is not an external audit or independent human review.

## Security and data boundaries

The rotated key was supplied by the owner directly to Secret Manager. The user-confirmed trial alias is `SFTP_PASSWORD`, pinned version1; its payload was never read onto this workstation, printed or committed. Runtime permission was granted only on that secret to the existing function runtime identity. Broader inherited project IAM was not audited.

The caller supplies only a UUID. Sender is fixed to onboarding@resend.dev; recipient is one server-configured authorized operator account. No customer records, invoices, financial state or LLM are read. Technical records contain a pseudonymous recipient/content fingerprint, timestamps, bounded outcome and provider ID; no raw recipient, body or key. Durable records survive the provider's24-hour dedup window and are not deleted/requeued automatically. SMTP/Resend customer activation and maintenance remain held by this scope.

The template adds no links/images/tracking pixels. Provider account tracking defaults and native Gmail/Outlook rendering were not verified. Browser proxy evidence is disclosed in PRODUCT-CONTENT-REVIEW.md.

## Remaining work and production readiness

- The approved private test is complete and disabled. Provider acceptance is verified; inbox arrival/spam placement and native mail-client rendering remain NOT_VERIFIED.
- Customer automation remains NOT_READY in this workstream: requires a verified sender domain, approved authoritative events/recipient policy, one production outbox consumer, delivery/bounce/complaint reconciliation and live customer-path acceptance. The other chat owns the customer renderer/event integration; do not infer its completion here.
- Current worker secret mapping must be explicitly resolved in the future cutover. This trial's SFTP_PASSWORD alias does not configure the separate legacy SMTP_PASSWORD binding.
- Git base/HEAD remains `0d6e721698608eebb36b0b2f68021c3054d97d1c`. Own source/tests/evidence are local and uncommitted; unrelated WIP preserved. No new commit, push, PR or ordinary application release was created by this task. The deployed private artifact is independently fenced and archived by Google.
- Runtime reporting CLI is unavailable. Review/check files are a manual scoped evidence ledger; no CLI receipt is fabricated. Repository intelligence remains DEGRADED with bounded current-source/provider verification.
- Provider-reported model tokens: Unavailable. Actual Resend/Google billing: Unavailable; API-equivalent estimate: Unavailable. Two Google builds occurred. No Gemini calls were made in this scope; its earlier test budget was not used here.
- Memory candidates: None.

Current evidence: FINAL-CHECKS.json, FINAL-SCOPE-MANIFEST.json, REVIEW-CYCLE-4.json, FINAL-PROVIDER-READBACK.json and RUNBOOK.md. No claim of perfect code or full product readiness is made.

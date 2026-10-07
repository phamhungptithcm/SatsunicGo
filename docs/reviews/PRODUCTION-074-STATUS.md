# Production074 preparation — 2026-10-06

Status: BLOCKED / NOT_READY. No production deployment performed.

Authorization: user requested production release and Firebase/Google Cloud setup. Existing reviewed RELEASE067 approval covers public configuration correction, candidate preparation and deployment conditional on required gates. Provider activation, privileged bootstrap and material scope expansion require a concrete reviewed delta.

## Current evidence

- Repository Intelligence Gate: DEGRADED; CodeGraph and CocoIndex health passed but indexes stale. Bounded source/runbook/Git inspection used.
- Base HEAD: `1d9c5824e5d0647948a1986dabc7480c4b7b8cb2`; shared application WIP remains. No commit/push performed in this task.
- Project `satsunicgo`, number `278913913091`, ACTIVE. Default Firestore Native database exists in `asia-southeast1`. Fresh Functions inventory empty.
- Existing reCAPTCHA Enterprise SCORE key permits only `satsunicgo.firebaseapp.com` and `satsunicgo.web.app`. App Check REST readback HTTP200 confirms exact Web app registration, matching site key and token TTL3600s. Initial403 was missing request quota project; fixed by specifying `x-goog-user-project`, with no IAM mutation.
- Added existing public site key to ignored `.env.local`; other values preserved. No secrets printed or provisioned. Generated public asset manifest regenerated through normal build.
- `npm run release:build`: PASS, including public config, frontend build, Functions compile and source/artifact preflight. Preflight is local evidence, not cloud acceptance.
- Public configuration tests:13PASS; focused preflight/provider hold tests:26PASS.
- `npm run lint`: PASS.
- Full unit suite:89files/717tests PASS with `VITE_FIREBASE_API_KEY= VITE_RECAPTCHA_ENTERPRISE_SITE_KEY= npm test -- --reporter=dot`. Production browser SDK explicitly disabled for Node unit process. Default run failed seven suites because App Check requires `document`; initial sandbox also denied loopback telemetry listener. Neither failure is hidden by a source/test change.
- Host Node25.9.0; fresh Node22 test execution NOT_RUN. Functions target remains Node22.

## Concrete remaining rollout plan and impact

1. Obtain designated first OWNER identity; inspect existing bootstrap/MFA policy and prepare exact least-privilege bootstrap delta. No assumed owner, account creation, role grant or production seed.
2. Freeze all intended application source, tracked/untracked domain files and current generated artifacts; exclude machine agent state, output, credentials and unrelated WIP. Rebuild/test under Node22 and complete current integration/browser/product-content acceptance on that exact candidate.
3. Prepare operational delta for backup retention/restore, monitoring/alerts, deployment identity and rollback inventory. Verify provider configuration through metadata without accessing secret payloads.
4. Keep `functions/src/provider-release-gate.ts` holds intact. Enabling AI, SMTP, payment or maintenance requires reviewed source delta, specified provider/merchant/sender/model settings and bounded acceptance. Financial tests/customer sends remain outside current authorization.
5. After a fresh passing final review, deploy additive Firestore indexes/rules and Storage rules, paired Functions/Hosting candidate to explicit project `satsunicgo`. Record versions, hashes and operation readback; verify real auth/App Check/MFA and privacy boundaries. Stop rollout on failed smoke; preserve data and provider/financial history during rollback.

Expected files for any further behavior change: separately reviewed provider gate/tests, auth/bootstrap scripts if needed, approved operational/release documentation and exact deployment configuration. No new dependency, IAM grant, commercial default or database datafix is included by inference.

## Final implementation review — cycle1

Decision: BLOCKED for requested full production release. Scoped public configuration fix reviewed against existing067 approval and exact app metadata. Security: enforcement/provider holds preserved, no secret exposure. Compatibility/code quality: compile/lint/focused checks pass. Failure paths: missing config rejects; quota-project error resolved; unit SDK isolation explicit. Product language: NOT_APPLICABLE to this configuration fix; complete current shared UI candidate review NOT_RUN. Production readiness: missing current auth/MFA/OWNER/provider/operational/full-candidate evidence. Trade-off: local build success cannot certify complete live workflows. No deployment permitted by remaining mandatory gates.

Quality gates: compilation/static analysis/unit PASSED with stated runtime and test isolation limits; focused config/security checks PASSED; production integration/browser/provider/backup/restore/monitoring/current full content acceptance NOT_RUN. No database migration performed. Runtime ledger CLI unavailable; this manual report does not claim runtime receipts. Token usage and actual/estimated cost Unavailable. Memory candidates: None.

# Security audit frozen candidate — 2026-10-04

Scope: read-only, current frozen WIP after READY gate at /tmp/satsunicgo-freeze-gate.json. Queried CodeGraph genkit then CocoIndex security authentication AppCheck; verified critical conclusions in source. Skills: repository-intelligence, security-review, threat-model, code-review, code-quality-review. Profiles: universal, typescript-javascript, web-app. Stack: TypeScript React/Vite, Node22 Firebase Functions/Admin, Firestore/Storage, Genkit1.42.0.

## Findings by severity

1. HIGH operational correctness: functions/src/jobs.ts146–152 unconditionally serializes orderId from outbox. Membership activation producer membership.ts271 and expiry producer jobs.ts77 omit orderId. Default Firestore rejects undefined; no ignoreUndefinedProperties setting found. Offline installed SDK batch.create with orderId:undefined reproduces validation exception before network/commit. This blocks membership in-app delivery and rejects maintenance Promise.all. Correction: conditionally include orderId or null; retain schema and transaction controls. Regression: membership activation/expiry jobs without orderId deliver once and subsequent maintenance is idempotent.
2. HIGH supply-chain gate, conditional exposure: fresh npm audit --omit=dev confirms 6 high,51 moderate,0 critical. Six package reports do not equal six independent exploited paths. Main high advisories: GHSA-q7rr-3cgh-j5r3 Prometheus malformed-request DoS requires exposed/running Prometheus exporter (OTEL_METRICS_EXPORTER=prometheus); GHSA-45rx-2jwx-cxfr Jaeger malformed-header DoS requires sole active Jaeger propagator. Bounded source has neither setup; live environment is unverified. Preserve high audit gate; no waiver or exploit claim. Latest registry Genkit/core/google-cloud remain1.42.0 and declare sdk-node^0.52/core~1.25/auto-instrumentations^0.49; published patched sdk-node0.217+,auto-instrumentations0.75+,Jaeger2.9 exceed compatible ranges. Blind overrides cross coordinated OTel cohorts and are not verified compatible. Safe remediation options: obtain coordinated upstream patched Genkit release; or separately approved narrow fork/backport of exact fixes with trace/telemetry/Genkit tests and license/provenance; or remove Genkit to a reviewed direct provider implementation (material scope change). Simply disabling AI settings does not remove installed dependency chain.
3. MEDIUM correctness: readNotification whitelist /^[a-zA-Z0-9-]{1,80}$/ excludes valid underscore and long producer IDs. membership-${UID}-${UUID} can176 chars with128 UID; expiry IDs also exceed80. jobs copies outbox ID unchanged. Fix strict leaf ID /^[A-Za-z0-9_-]{1,256}$/ and owner/locked tests; do not allow slash/path traversal.

## Threat boundaries and positive controls

Unauthenticated browser→Google/Firebase identity→AppCheck callables→server current role/lock/ownership→transaction/immutable history→Firestore/Storage; public published content/AI are separate bounded read paths; webhook requires provider signature; secrets bind through Functions params. command schema strict, operationId UUID, idempotency hash bound user/request, owner-specific customer actions, assigned BUYER checks and recent MFA for finance. Firestore client writes deny-all with published-only public reads and owner reads; Storage deny-all, mediated uploads enforce role/current locks and image verification. AI order context ownership enforced; no arbitrary URL fetch and draft requires customer submission. No weakening, credential reads, production/data/provider mutations, or dependency edits performed.

## Live deployment blockers versus defects

Client Firebase services remain beta-gated; production callable AppCheck enforced, while missing site key merely skips client init, causing fail-closed unavailability rather than auth bypass. Actual Auth/OneTap interaction, AppCheck registration/site binding, Firestore/Storage provisioning/rule deployment, backend deployment, service IAM, TOTP rollout, owner bootstrap, approved payment/email secrets/config, business data/fees/policies, spend/rollback proof and full acceptance remain NOT_TESTED/BLOCKED. Prior provider billing=false is team context, not newly refreshed by this auditor. Storage rules deny all direct client access deliberately; configured server-mediated workflow requires live bucket. Existing jobs recovery already restricts blocked_external to emailAttempts0/no claimedAt. No open recovery defect asserted.

Commands/evidence: READY JSON, codegraph query --path . --limit5 --json genkit; ccc search --limit3 security authentication AppCheck; targeted source reads; npm audit --omit=dev --json (/tmp/satsunicgo-security-current-audit.json); npm view genkit/core/google-cloud latest dependencies (all1.42.0); installed Firestore validator offline; shasum -a256 scoped candidates. No broad test suite claimed.

Primary sources:
- https://github.com/open-telemetry/opentelemetry-js/security/advisories/GHSA-q7rr-3cgh-j5r3
- https://github.com/open-telemetry/opentelemetry-js/security/advisories/GHSA-45rx-2jwx-cxfr
- npm publisher package metadata for genkit/@genkit-ai/core/@genkit-ai/google-cloud1.42.0

Hashes:
package-lock.json 917d96ed9935616c82cd446d50f0a9b85b1c20a81124183de56ce8d3e983bbe8
functions/package.json 29498ce6bcb50ad5bb62648d49bf7e1f5cbcbb616a7750a4f94348acf5375b5f
functions/src/index.ts 2de664f9f5d881d6402cbd761466acb9329de780b59e0e4105eedb6f3a1895cb
functions/src/ai/ask.ts c13c0d4d8b0839af7e63e309c86dd92b2760a1d3a02f8909dec829c6a2b55570
functions/src/jobs.ts 072881fbb0fd8501fd891b6bcbb7a06c337dfe15daae2f7f25b4d72a6f2fa621
functions/src/media.ts 36ec34e2ecfb1b910bf47606d56aa020e8c7683fc4ff213c999e1642b4bfac07
src/shared/firebase.ts 8275090d88105ec6d29cb3800b45c26c460bed712ea08bde136dacaeb6beeb0c
firestore.rules cebc3c332b92612ed35c0ac3d2aebce788cbf46a71d7c4a5fc3ad490dea749a9
storage.rules 4a043206e7ecbd14ffb97ce055cd22fe2a1f1300fb4f61d1a984f5b27b6889cf
firebase.json 6b2709c4ab2bf2258c76509eca72c13aafbd6c7da92999dd6c7a686a22b0e629

Recommendation: CHANGES REQUESTED for concrete notification findings; full live release remains BLOCKED independently. This is scoped security evidence, not full application certification. Memory candidate: None; no relevant memory used.

## Approved follow-up: verified Google guard

HIGH requirement/security gap: MASTER_PROMPT.md68/242 requires verified Google for private/business flows, but frozen functions/src/auth/guards.ts contained only recentMfa, private callable handlers checked uid, and firestore.rules signed() checked any auth. A future additional provider/custom token or unverified session could use uid-only handlers, contrary to the explicit requirement. No evidence of that provider being enabled in current live project is asserted.

Approved by lead after thaw: only functions/src/auth/guards.ts and tests/unit/verified-google.test.ts. Added requireVerifiedGoogle for Firebase-runtime-verified auth: requires nonempty UID, boolean email_verified===true, firebase.sign_in_provider==='google.com'. Linked identities alone are deliberately insufficient. Existing recentMfa unchanged. Firebase documents primary provider and second factor as separate claims; tests retain Google provider alongside totp second factor and do not substitute linked identities for current session. Real Google/MFA token readback remains NOT_TESTED.

Primary claim contract: https://firebase.google.com/docs/reference/admin/node/firebase-admin.auth.decodedidtoken and https://firebase.google.com/docs/reference/js/v8/firebase.FirebaseIdToken . Do not apply guard to arbitrary client JSON; callable Firebase runtime verifies tokens. No emulator bypass added.

Integration required (module owners): command, changeCommand, membershipCommand, refundCommand, returnCommand, consolidationCommand, shippingCommand; all CRM/workspace private callable handlers; orderHistory; uploadOrderImage/listOrderImages/readOrderImage; uploadContentImage; createPaymentLink; readNotification. Ask keeps anonymous public questions but requireVerifiedGoogle before private orderContext. Firestore signed() needs equivalent verified provider/email check for owner/private reads while public published queries remain anonymous. Auth fixture/seed token metadata must represent verifiedGoogle explicitly; emulator fixtures do not prove real login. Helper alone does not close system gap; no caller/rules integration performed by this agent.

# First go-live — SATSUNICGO-FIRST-GOLIVE-008 v1

Status: PREPARED; awaiting scope/business inputs and concrete production approval. User request: complete first go-live, 2026-10-04.

## Verified starting point

Production-006 foundation completed: APIs, empty Native Firestore and Firebase Storage in asia-southeast1. Google provider/origins already configured. Latest Auth config: IDENTITY_PLATFORM, MFA DISABLED; App Check Enterprise config exists but has no siteKey. No Functions deployed. Local current typecheck/lint and 91 unit tests pass; fresh rendered emulator Google customer submission saved order e4cd7e64-5219-4b27-adc4-a1c5a7d61ac8 and navigated to authoritative detail. This is not real Google login evidence. Dependency audit still reports six high package findings through Genkit/OTel; assess actual exposure before any release, do not hide findings.

Two independent sessions are actively editing public UI and Ask orchestration; preserve ownership and freeze a coherent checkpoint before final candidate review. Repository intelligence currently DEGRADED; do not reuse earlier READY/final-review receipts as current certification.

## Proposed first scope

Public pages, real Google account, request submission/account status, private support and owner/staff request review. No invented catalog/commercial data. Paid quote acceptance, payments, refunds, membership sales, automated external email and model AI remain unavailable until their own verified owner/provider configuration. Existing FAQ Ask may answer supported public questions without model/provider effects. Scope is a request intake release, not full live purchase/payment certification.

## Concrete implementation and setup

1. Confirm public operating identity/contact, privacy/retention text and first OWNER Google account. Retrieve authoritative verified Google UID, do not grant role based only on client email. Obtain explicit approval for that exact bootstrap identity.
2. Enable reCAPTCHA Enterprise API and create a web site key restricted to satsunicgo.web.app and satsunicgo.firebaseapp.com; configure the existing Firebase Web app Enterprise App Check mapping. Do not turn off callable App Check enforcement or use production debug tokens. Local emulator retains separate demo project. Real-local provider testing needs a separately approved local site/domain registration strategy.
3. Enable optional TOTP MFA on existing Identity Platform configuration; preserve providers/domains. Owner enrolls through account security. Verify MFA challenge/current role on protected actions before granting production readiness.
4. Store public SDK/site-key configuration only in ignored environment file; build VITE_BETA_RELEASE=false and VITE_USE_EMULATORS=false. Verify production bundle contains no emulator fixture controls/project endpoints.
5. After current source tests and fresh final review, deploy approved Firestore/Storage deny-by-default rules and query indexes; deploy only core/public callable functions needed by intake/support/owner management and Hosting rewrites. Exclude secret-bound payOS functions and deliverEmail, plus AI callable until reviewed/configured. No placeholder secrets.
6. Bootstrap one separately approved OWNER with audit evidence using authoritative UID. No customer fixtures, money entries, approved pricing/paid plans or fabricated business policy in production.
7. Validate production public HTML/assets, Google login, App Check token/callable denial and success, customer request persistence/account isolation/support, staff visibility and role/MFA denial. Live sanity writes limited to clearly identified owner test request/ticket; no money or external messages. Record exact candidate/artifact/deployed version evidence.

## Files and responsibilities

Root: .env.local ignored public config, firebase.json only if required release correction, production setup/verification scripts, docs/plans/approvals/reviews and immutable release manifest. Existing approved E2E source corrections stay within local approvals. UI session owns Content/Support and related styles; Ask session owns its chat source/backend/tests. No overlapping edits without explicit handoff.

## Risk, validation and rollout

HIGH: authenticated customer data, privileged bootstrap, App Check/MFA and production release. No weakening auth, roles, MFA, validation or transaction guards. Manual scope flags are not authorization controls; absent approved pricing/provider settings must remain server fail-closed. Current rules/unit/HTTP tests plus browser entry paths and live provider checks are required. Secret values never enter chat/artifacts/commits. Source build success alone does not satisfy live authentication.

Read current release before deploy, retain Hosting version for rollback, and record each Functions deployment/status. Stop release on failed smoke; restore prior Hosting version without deleting persistent data. Database resource deletion is not rollback. Cost remains workload-dependent on Blaze; bounded instances follow reviewed source configuration. Monitoring/recovery and policy gaps require explicit review, not silent acceptance.

No public Git push, IAM expansion, real payments/refunds, external email/marketing, secret access, or full commerce acceptance in this scope. Additional provider/live business activation requires reviewed delta.

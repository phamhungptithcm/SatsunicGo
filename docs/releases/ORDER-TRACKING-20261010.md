# CRM → Account/Ask release candidate — 2026-10-10

Status: source candidate frozen locally; production release NOT_READY. No deploy, push, tag or production mutation authorized/performed. Base is production v0.11.0 / b5c0a1c285c07faeacf1d3b8ba544f76d885ceb6. Branch hunpeolabs/tracking-release-20261010. Existing main push workflow automatically deploys: do not push this work to main before all gates and deployment approval.

## Changes and compatibility

CRM shipping/consolidation writes order revision, safe timeline event and customer projection in the same transaction. Account and Ask read the authoritative owner projection; Ask uses the compact approved timeline. Guest Ask accepts an owner-issued high-entropy SGT capability, not an enumerable order ID. Response is strict publicStatus/updatedAt/observedAt/eta only. Manual ETA is an estimate from CRM, not carrier GPS. Legacy events without dates stay unknown. No new master-data editor, auto carrier feed or historical backfill.

Public lookup enforces App Check and transactional quotas. Codes expire logically after 30 days; owner can replace/revoke; only hashes persist. Locked owner, wrong code/owner, invalid DTO and revoked/expired codes fail closed. Receipt requires canonical delivered quantities and retains financial guards. Ask abort/auth-generation fencing, online/visibility checks, single-flight and guest 60-second budget remain. Preserve upstream history navigation/read-only behavior and remove only approved language toggle; history pauses tracking refresh.

## Executed candidate validation

Node22.23.3: production public-config validation, TypeScript/Vite production build, Functions build, AST preflight and scoped ESLint passed. Backend5 files108 tests, unit13 files130 tests, Ask36 tests and Account/code9 tests passed. Immutable release packaging regression106/106 passed (tamper/path traversal/provider parity cases). Native candidate guest uses actual Account/Ask frontend bundle against existing shared demo transport; hidden provider/analytics clients disabled; zero forbidden sinks and axe zero violations/incomplete. Actual candidate backend behavior is established separately by108 emulator tests. This is not full production-shell/hosted acceptance. Prior46-case matrix is layered historical evidence, not46 fresh native E2Es.

## Read-only production observations

Existing shippingCommand, consolidationCommand, command and customerOrderTracking are ACTIVE, Node22, asia-southeast1. Codebase has98 Functions; promoted candidate has100: only publicOrderTracking/managePublicTrackingCode added, none removed. Existing non-codebase emailSelfTest is preserved and excluded from comparison. Seven existing held exports remain held by immutable artifact packaging.

Enterprise App Check web registration and GitHub site key agree. Auth domain is authorized; MFA ENABLED. Existing owner callable public Cloud Run transport is expected: callable auth/owner/App Check checks remain authoritative. This transport metadata does not prove candidate authentication success.

## Blocking prerequisites before deploy

1. GUEST_TRACKING_QUOTA_KEY is NOT_FOUND. An authorized operator must provision a cryptographically random secret of at least32 characters, grant only the actual runtime service account secretAccessor for this secret, and verify an enabled version/binding without printing the value. Keep the value stable across retries; rotation invalidates deterministic issuance replay and needs a separate plan. Never use the emulator key in production.
2. Missing Firestore TTL policies: guestTrackingQuotas.expiresAt; guestTrackingCodes.deleteAfter; guestTrackingOperations.deleteAfter. Fields are Firestore Timestamp. Enable and verify active policies through approved infrastructure process. Do not TTL guestTrackingAccess: its activeHash is the revocation fence. Logical expiry already rejects expired codes; TTL is asynchronous cleanup, not authorization.
3. The two guest callables are not deployed. After separately approved deployment, verify region, Node22, secret version/runtime binding, maxInstances2/concurrency8, public transport invoker only as required for Firebase callable use, and App Check enforcement. Never weaken owner callable authentication to solve403.
4. Exact candidate CI/immutable deployable artifact and independent release review are NOT_RUN. Local source archive is not a signed production deployment bundle or reserved version. Select/reserve version only through the existing release pipeline after approval. Require checksum and exact SHA equality, holds retained and no unrelated function deletion.
5. Hosted candidate smoke is NOT_VERIFIED: verified owner + actual CRM staff MFA, safe approved synthetic order, CRM status/ETA update→Account/Ask refresh, guest code issue/read/revoke; invalid/missing App Check, wrong owner, expired/revoked code, quotas, offline/timeout and account-switch recovery. Production data writes require separate explicit authorization. Before deployment only the existing live version can be checked.

## Rollout and rollback for later approval

No migration/backfill of orders; new guest collections additive. Provision prerequisites before publishing client controls. Deploy only the immutable release artifact through existing serialized workflow; check all100 promoted source/revision inventories and Hosting hashes, then release-version.json exact SHA/version before publishing. Capture403/429/error rates and latency; no codes, IPs or customer fields in logs. Existing quota global window caps10,000/minute, per-IP reads30/minute and per-owner issue10/minute; two public instances with concurrency8 limit capacity. Regional sustained load/cold starts/billing not measured; tests bound local workloads only.

Rollback uses the previous verified immutable v0.11.0 artifact with explicit authorization; do not rebuild previous source. Return frontend and existing modified handlers together; ensure new public functions do not remain unintentionally callable and validate inventory. Retain guest access revocation state and TTL cleanup; do not bulk-delete tracking collections or rotate key as an improvised rollback. Re-read previous receipt/current provider state before any action.

## Remaining assurance

Repository intelligence DEGRADED (stale indexes); bounded source/compiler/Git/test/provider checks used. Self-review only. Whole-repository CI, provider-runtime acceptance, physical OS motion setting, hardware assistive technology and sustained production load NOT_RUN. Existing build chunk/dynamic-import warnings unchanged. No assertion of zero unknown issues or production readiness. Tokens and actual billed cost Unavailable. Memory candidates: None.

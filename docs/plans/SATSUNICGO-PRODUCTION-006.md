# Production foundation delta — SATSUNICGO-PRODUCTION-006 v1

Status: APPROVED on 2026-10-04; evidence in docs/approvals/SATSUNICGO-PRODUCTION-006.md. Execution evidence is recorded separately.

## Current evidence

2026-10-04 live readback: billingEnabled=True. Enabled-service list lacks Cloud Functions, Firestore, Cloud Run, Cloud Build, Artifact Registry, Eventarc, Cloud Scheduler, Secret Manager and Firebase App Check APIs. Functions/database list calls return SERVICE_DISABLED, which does not prove those resources absent. Storage bucket list succeeds with no rows. Existing firebase.json targets nodejs22 and asia-southeast1; production callable App Check enforcement remains enabled.

Repository intelligence is DEGRADED after concurrent approved changes; bounded source and live CLI readback support this infrastructure inventory. Earlier READY audit receipt is not current source certification.

## Proposed bounded setup

1. Enable only required backend APIs for project satsunicgo: cloudfunctions, firestore, run, cloudbuild, artifactregistry, eventarc, cloudscheduler, secretmanager and firebaseappcheck. Re-read service status before proceeding.
2. Re-check database/bucket inventory. If missing, create Firestore Native default database in asia-southeast1 and the Firebase default Storage bucket using the supported Firebase setup flow in the same region. Stop on conflicting existing locations; do not replace resources.
3. Verify resource metadata, location and retained access controls. Record responses without tokens, credentials or customer data.

This enables billable infrastructure; usage costs depend on later workloads. It does not include IAM grants, privileged OWNER bootstrap, secret payload access/creation, commercial configuration, production customer seeding, real payments/email, App Check registration/security changes, backend release, public Git push or Hosting deployment. Each release requires a fresh reviewed candidate and its concrete rollout scope.

## Impact and validation

No source behavior change. Runtime topology follows existing Firebase configuration. Database/bucket region choices affect residency and future migration; obtain explicit approval for asia-southeast1 before creation. Preserve fail-closed Google verification, role checks, MFA and App Check. Verify enabled API state and resource metadata after setup. No destructive rollback: retain empty resources and stop workloads if setup fails; do not delete production resources autonomously.

## Remaining release gates

Current rendered acceptance, fresh final review, runtime dependency advisories, real One Tap/MFA/App Check, approved business data, provider configuration and Node 22 runtime evidence remain separate gates. Billing activation alone does not satisfy these.

# Production foundation setup evidence — 2026-10-04 America/Chicago

Scope: approved SATSUNICGO-PRODUCTION-006 v1 only. No application release.

## Completed

- API batch activation operation acf.p2-278913913091-0ec5cca2-138f-474c-8763-0fab2a2c7e5c succeeded; readback confirmed all nine planned APIs enabled. Required Firebase Storage API also activated successfully (operation acat.p2-278913913091-716b6bc1-013d-41b8-9ebf-fb954fbcf5c7), an intrinsic dependency of approved Firebase bucket creation.
- Inventories before creation: Firestore databases=[] and Storage buckets=[].
- Firestore `(default)` created successfully, FIRESTORE_NATIVE, STANDARD, asia-southeast1. Post-create describe matched. Delete protection and PITR retain defaults DISABLED; not a backup/restore certification.
- Firebase supported defaultBucket REST creation succeeded. Resource projects/satsunicgo/defaultBucket; bucket satsunicgo.firebasestorage.app, ASIA-SOUTHEAST1. Metadata readback matched.
- Bucket IAM contains project-owner/editor legacy owner and project-viewer legacy reader groups only; no allUsers/allAuthenticatedUsers. Uniform access false and public-access prevention inherited are provider defaults, not hardened settings claimed.
- Anonymous Firestore orders list rejected HTTP403; anonymous Storage objects list rejected HTTP401. No writes, customer records or object contents inspected.
- Firebase Rules release readbacks returned404 for cloud.firestore and firebase.storage/satsunicgo.firebasestorage.app. No application Security Rules published in this scope; observed anonymous denial is bounded evidence and does not replace approved rules deployment.
- Functions list now succeeds with no rows; no functions deployed.

REST contract: https://firebase.google.com/docs/reference/rest/storage/rest/v1alpha/projects.defaultBucket/create

## Final implementation review — cycle 1

Decision: PASSED for foundation setup scope; full application readiness NOT_READY.
Approval/requirements: resources and location match explicit approval. Security: tokens captured in process memory, never printed/stored; no secret payloads, privileged bootstrap, IAM changes or customer seeding. Database: additive empty infrastructure, no migrations/datafix/deletion. Compatibility: follows existing Firebase/nodejs22/asia-southeast1 topology; frontend environment not altered. Failure/retry: inventories checked first; CLI credential-cache filesystem errors rerun with approved sandbox escalation, successful API/resource readbacks verified; no duplicate or destructive retry. Observability: provider operation IDs and metadata retained, workload monitors not applicable until deployment. Product language/code/performance: no application source or user-facing strings changed. Residual defaults and missing Rules releases recorded above; require reviewed release before using customer workflows. No actionable defect within approved setup scope found in these checks.

## Task completion report

All three foundation criteria completed and verified: API activation, resource creation/location, bounded access-control readback. No weighted percentage invented. Repository intelligence DEGRADED: stale optional indexes; native firebase.json/source/API evidence used, gate receipt /tmp/satsunicgo-production006-gate.json. Application worktree remains dirty from parallel approved work; no commit/push/deploy in this task. Runtime ledger command unavailable in the current shell; this is a manual evidence report, not a fabricated runtime receipt. Provider token usage and billed/estimated cost Unavailable. Memory candidates: None.

Remaining application gates: fresh complete candidate review, published security rules/indexes, App Check registration, owner-authorized bootstrap and commercial data, provider secrets/configuration, interactive One Tap/MFA, real provider and full master scenario verification. Existing unresolved application dependency advisories remain release blockers. No full production acceptance claimed.

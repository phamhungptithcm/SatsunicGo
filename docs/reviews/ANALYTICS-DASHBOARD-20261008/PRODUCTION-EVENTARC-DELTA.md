# First Firestore trigger delivery setup

Source/candidate stay `d427c1c270f41e4606dee6a36e5c9a685bde72f9` / v0.5.0, checksum `2d8fa415786e4c87910f8ed374d319b828c3a675083e4c11f48622921aab80d0`. The approved getMetadata-only delta was applied and verified:49→50permissions, no removals, dedicated CI role/member unchanged. CI attempt2 passed database discovery then stopped before source upload at the newly-enabled retry acknowledgement.

## Observed prerequisites

Project number278913913091 and default runtime278913913091-compute@developer.gserviceaccount.com were verified from provider metadata. Existing64production functions have no event triggers. Required APIs are enabled; attempt2 ran Pub/Sub/Eventarc service identity generation. Read-only project policy has none of the following three exact role/member bindings. Existing compute Editor gives run.routes.invoke but lacks Eventarc receiver permissions; SDK15.32.1 matches exact bindings rather than equivalent roles. Google-managed service identity lookup resolves numeric resources but IAM get on them is denied; exact identity response must be checked before granting any role.

SDK `prompts.js` requires retry confirmation, followed by `prepare.js` / `checkIam.js` automatically adding first-event-service bindings without a separate prompt. A live SDK dry-run still invokes API ensures and service identity generation, so it is not a read-only check. Independent offline mocks verified these behaviors. No bootstrap or additional IAM grant has occurred.

## Exact proposed binding additions in satsunicgo — revised minimum

| Principal | Project role | Purpose |
|---|---|---|
| service-278913913091@gcp-sa-eventarc.iam.gserviceaccount.com | roles/eventarc.serviceAgent | Google Eventarc delivery/transport service agent |
| service-278913913091@gcp-sa-pubsub.iam.gserviceaccount.com | roles/pubsub.serviceAgent | Google Pub/Sub transport service agent |
| 278913913091-compute@developer.gserviceaccount.com | roles/eventarc.eventReceiver | Receive Firestore events for the approved trigger runtime |

These three project-scoped bindings apply only to the verified Google service agents/current runtime, preserving all other policy bindings and conditions. Do not give serviceAgent roles to humans or CI. Do not grant CI project IAM write, data access, TokenCreator, Editor/Owner or account keys. The existing runtime Editor is preserved, not broadened/reassigned. Native Pub/Sub serviceAgent includes the required token methods; it is a consequential service identity role whose scope needs explicit approval.

The earlier draft five-binding Firebase CLI bootstrap is rejected in favor of native gcloud bootstrap, which supports the equivalent existing Pub/Sub serviceAgent token permissions and compute run.routes.invoke. This avoids the two redundant project TokenCreator/Invoker bindings required by Firebase CLI's first-event-service literal checks. Installed gcloud functions v2 deploy_util.py explicitly accepts roles/pubsub.serviceAgent as an alternative; its deployment implementation was inspected for prompts/IAM paths. The original Firebase CI needs no first-service delta after the three existing Firestore triggers are read back.

Required authorization is for only the three listed additions, idempotent identity verification for eventarc.googleapis.com/pubsub.googleapis.com and native bootstrap of only the three source-approved retry triggers from the same candidate. No other role, principal, source, pipeline or behavior change is included.

## Execution and verification

After human approval, obtain idempotent service-identity responses through the Google API used by the existing deployer; require returned emails match the exact project-derived agents. Capture project policy baseline with metadata/hashes only; add exactly missing listed bindings using policy version checks and preserve all existing bindings/conditions. Read back all three matches and effective runtime run.routes.invoke. Confirm collection remains off and current main still equals the candidate source.

Use gcloud functions deploy --gen2 only for analyticsOrderChanged, analyticsPaymentCreated and analyticsJobCreated. Explicit project satsunicgo; runtime nodejs22; region/trigger location asia-southeast1; current compute runtime/build/trigger account; memory256Mi/CPU1, timeout60s, maxInstances2, minInstances0 and concurrency8; --retry; exact written/created/created event types, (default) database/namespace and document paths from the artifact's actual __endpoint exports. Set firebase-functions-codebase=satsunicgo and only public Firebase admin environment metadata (project/bucket/source). Use an external ignore/env file, a fresh strict-hash-verified extraction and locked package without scripts/recompile or source modifications. Do not add an unauthenticated invoker. No --force, CI edit, deletion/unsafe migration, secret/data access or additional IAM mutation. Stop if gcloud requests an unexpected role or source/region/identity mismatch. Collection remains disabled. PRODUCTION-RETRY-BOOTSTRAP.md's interactive Firebase procedure is superseded.

Read back the three ACTIVE trigger names, paths and retry policies, then rerun only the failed job of run37812638036. The normal pipeline must still publish its exact-artifact Hosting/Functions proof. Only after that proof proceed with previously approved2indexes/13analyticsTTLpolicies and guarded config activation.

Rollback removes only bindings added by this operation after checking concurrent policy versions; it would disable event delivery and may prevent deployment. Disable collection before operational rollback. Do not delete canonical data or blindly retry unknown outcomes.

## Review and approval

PENDING human approval. The earlier one-permission approval does not cover these newly discovered production IAM bindings. AGENTS.md46 requires a reviewed delta-impact approval for material scope changes. Relevant official guidance: [Eventarc target roles](https://docs.cloud.google.com/eventarc/docs/roles-permissions), [Eventarc service agent role](https://cloud.google.com/iam/docs/roles-permissions/eventarc). Retain SDK-specific overlap and effective role scope as an explicit operational trade-off; do not present it as a newly minimized runtime role design.

## Approval received

APPROVED by direct owner reply "Approved" after the exact three-role proposal and bounded plan/source review. This supersedes pending status above and authorizes only the three listed bindings, exact service-identity verification and same-artifact native three-trigger bootstrap. The superseded five-binding/Firebase-interactive approach remains excluded. Execute approved scope and preserve all other IAM/config/data.

# Production deployment permission delta

2026-10-08. Source commit: `d427c1c270f41e4606dee6a36e5c9a685bde72f9`. Candidate: `v0.5.0`. Release run: `37812638036`. Quality and immutable artifact build passed; deployment failed before uploading/promoting the candidate when Firebase CLI read Firestore database metadata and received HTTP 403. Hosting still serves verified `v0.4.0` / `b62d5cf0b017adbad0b45bcd052598896123316c`. Analytics collection remains off.

Artifact checksum was verified locally against the published candidate checksum: `2d8fa415786e4c87910f8ed374d319b828c3a675083e4c11f48622921aab80d0`.

## Exact proposed change

Add only `datastore.databases.getMetadata` to existing project custom role `projects/satsunicgo/roles/satsunicgoProductionDeployer`. Current provider policy has exactly one binding/member for this role: deployment service account `github-release@satsunicgo.iam.gserviceaccount.com`, without a condition. No membership or other role permission changes are proposed.

This permits reading database metadata needed by Firebase CLI to validate the new Firestore triggers. It grants no Firestore document read/write/delete permission. Required Eventarc, Pub/Sub and Cloud Scheduler services are already enabled. Other production IAM permissions remain outside this delta. Verified against the current [official API permissions table](https://docs.cloud.google.com/firestore/native/docs/security/iam): projects.databases.get requires datastore.databases.getMetadata. The earlier draft incorrectly named datastore.databases.get (transaction begin/rollback); it is superseded and was never applied.

Command, after explicit human approval:

```sh
gcloud iam roles update satsunicgoProductionDeployer --project=satsunicgo --add-permissions=datastore.databases.getMetadata
```

Capture the role's complete prior permission set in memory; verify provider readback adds exactly this one permission and preserves all prior permissions, role stage and binding scope. Retry only failed jobs of the same release run (`gh run rerun 37812638036 --failed`), reusing the existing candidate artifact without rebuilding. Inspect the new attempt's actual output. Do not pre-grant further privileges for hypothetical failures.

After verified promotion, proceed with previously approved two additive indexes, thirteen analytics-only TTL/index exemptions and guarded `analyticsConfig/current` activation. No production orders/payments, canonical data deletion or emulator reset.

Rollback of this IAM delta removes only the newly added permission, after checking the role version and that no concurrent IAM changes would be overwritten. Failed or unknown outcomes require provider reconciliation. Removing it would again block deployments that create Firestore triggers.

## Approval boundary

This is a new production IAM permission beyond release plan v2's normal CI/CD and analytics configuration changes. Repository AGENTS.md requires: "If implementation deviates materially, stop and request approval for a delta-impact plan." The plan above is concrete and ready for review; permission mutation remains pending human approval.

Repository intelligence is DEGRADED. Current source, Firebase CLI failure, exact artifact checksum, live IAM scope and read-only provider metadata support this bounded delta. No native governing-kit receipt is claimed.

## Human approval and execution

APPROVED by the repository owner in this task: direct reply "Approved" after the corrected getMetadata-only proposal and blocked-release report. This supersedes the pending status above. Fresh provider readback before mutation confirms 49 existing permissions, stage GA, no getMetadata permission, and exactly one unconditional role binding/member for the dedicated CI account. Execute the approved one-permission addition, verify exact set preservation and then rerun failed deploy only. No broader IAM delta is authorized.

# RETENTION-IAM v1

Status: PROPOSED — no IAM changes performed. This is a separate concrete delta to PRODUCTION-TEST v1 because the normal deployment identity lacks the two index permissions in its observed direct project role. The production-test feature approval does not silently authorize a new security-sensitive grant.

## Current evidence

`RETENTION-IAM-METADATA.json` records a fresh read of project `satsunicgo` and custom role `satsunicgoProductionDeployer`. The deployment service account `github-release@satsunicgo.iam.gserviceaccount.com` has that direct project role. It includes `cloudscheduler.jobs.get`; it excludes `datastore.indexes.list` and `datastore.indexes.create`. Inherited/deny/database-resource effective access is not proved by this read. Recheck effective applicable bindings before mutation; do not add a redundant grant if the required permission already exists.

## Exact proposed diff

Create a separate project custom role `projects/satsunicgo/roles/satsunicgoFeedbackRetentionIndexes`, using the exact two-permission JSON in `RETENTION-IAM-DELTA-ROLE.json`, then add one project binding for only `serviceAccount:github-release@satsunicgo.iam.gserviceaccount.com` to that role. Preserve every existing binding and role. Use policy etag / the provider's additive operation to avoid overwriting concurrent IAM changes. If the role name already exists with different permissions, or an unexpected principal is bound, stop rather than overwriting it. An existing role must have exactly the reviewed permission set. Preserve all existing IAM conditions; never add an unconditional grant over an existing conditional binding for this member/role. If an existing retention-role binding has any different member set, condition or binding shape, stop and refresh the concrete diff before mutation. This proposal creates one unconditional binding only when that exact role/member binding is wholly absent; it never removes or broadens a condition.

No service-account key, tokenCreator, Owner/Editor, document read/write/delete, secret access, index update/delete, TTL, authentication relaxation, public exposure, WIF subject expansion, or new recipient is included. The existing trusted production workflow restriction remains unchanged.

The permissions are granted at project scope; IAM does not here prove collection-specific confinement. The reviewed launcher separately validates immutable artifact/source and allows exactly these three index specs, each `retentionClass ASCENDING`, `expiresAt ASCENDING`, queryScope COLLECTION: `askFeedback`, `askFeedbackReviewOperations`, `askFeedbackQuota`. Existing unrelated indexes are listed but never reconciled or deleted. Index creation itself does not erase documents; cleanup activation remains separately gated and defaults inactive.

## Validation and rollback

Before grant, record role/binding metadata and exact proposed JSON digest; review the bounded privilege delta. After explicit approval, create/add only if missing, then read back exact role permissions/member binding/unchanged WIF. Normal release must independently verify the three exact indexes become READY before any retention readiness acceptance. A denied API/permission or unmatched spec fails closed. No production deletion fixture is created.

Rollback removes only the root-added exact member/role/condition tuple after owned changes are verified, preserving concurrent members, conditions and bindings. Delete the new role only if root created it and absence of all project and resource bindings is proved; otherwise retain the unused role without a grant. Existing approved indexes may stay since this is additive metadata and rollback must not delete indexes or feedback. Disable retention activation before any artifact rollback.

## Approval source

AGENTS.md requires explicit reviewed-plan approval for material infrastructure changes. Its non-negotiable says: “Do not broaden a scoped task into ... infrastructure changes without explicit scope and impact analysis.” This concrete IAM delta needs human approval before implementation. Provider/effective permissions and actual rollout remain NOT_VERIFIED; token usage and actual billed cost Unavailable; memory candidates None.

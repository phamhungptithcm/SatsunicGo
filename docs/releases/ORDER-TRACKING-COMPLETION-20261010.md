# Tracking release completion v2.1

Human authorization: current user approved CI/artifact workflow, explicitly no deploy; user will perform human review. Prior source candidate is cherry-picked without changes onto v0.11.1 auth/CSP fix. Current branch hunpeolabs/tracking-release-final-20261010. Previous source archive/readbacks describe v0.11.0 and are historical only. Current CI/provider evidence supersedes them.

Candidate workflow uses read-only repository permissions; no cloud authentication, secrets, IAM, tags, releases or deploy. New workflow bootstraps via same-repository tracking-branch pull request because workflow_dispatch requires the file on the default branch. It keeps manual dispatch for future runs. Both jobs restrict to the approved branch prefix and reject fork PRs. Artifact checkout/manifest/checksum bind the PR head SHA, distinct from the temporary merge SHA. Existing ci.yml is also dispatched on the branch for exact-head full quality evidence. Existing production workflow is unchanged. v0.12.0 remains unreserved candidate-only; do not deploy this bundle as an approved release.

Operator steps: see TRACKING-PRODUCTION-SETUP-20261010.md; secret creation and minimal IAM are human-run. TTL is asynchronous deletion of expiry-marked tracking documents, so also requires human action here. No production provisioning performed by agent. Three TTL fields only, never guestTrackingAccess. After setup, agent verifies metadata only.

PR remains draft for the user's review. Do not merge to main: existing release.yml automatically deploys on main push. Hosted candidate acceptance remains pending explicit deployment approval and safe test order/identity. Tokens and billed cost Unavailable; memory candidates None.

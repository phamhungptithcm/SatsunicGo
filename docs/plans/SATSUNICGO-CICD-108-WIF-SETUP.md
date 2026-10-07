# SATSUNICGO-CICD-108-WIF-SETUP — production activation proposal

Status: PROPOSED, not executed; separate infrastructure/IAM approval required by the approved implementation plan.

Read-only observations on 2026-10-07: GitHub repository `phamhungptithcm/SatsunicGo` (repository ID `1403691876`, owner ID `32831453`) has no release variables/secrets/environments or releases. GCP project `satsunicgo` has no global Workload Identity Pool. An inspected Function uses runtime/build account `278913913091-compute@developer.gserviceaccount.com`. All Function service-account identities must be inventoried before granting actAs.

## Concrete resources and boundaries

- Create service account `github-release@satsunicgo.iam.gserviceaccount.com`, with no private key.
- Create pool `github-release`, OIDC provider `satsunicgo-main`, issuer `https://token.actions.githubusercontent.com`, in project number `278913913091`.
- Map `google.subject=assertion.sub`, `attribute.repository_id=assertion.repository_id`, `attribute.repository_owner_id=assertion.repository_owner_id`.
- Provider attribute condition must require repository ID `1403691876`, owner ID `32831453`, ref `refs/heads/main`, event `push`, workflow ref `phamhungptithcm/SatsunicGo/.github/workflows/release.yml@refs/heads/main`, and subject `repo:phamhungptithcm@32831453/SatsunicGo@1403691876:environment:production`.
- Grant `roles/iam.workloadIdentityUser` only on the new deploy account to this provider's repository-ID principalSet. No account-key creation or project-wide impersonation.
- Create GitHub `production` environment with a `main` deployment branch policy; set its WIF provider/deploy-account variables. Existing organization protections remain intact. This proposal does not authorize changing main branch protection, tag protection or required reviewers.
- Set the five public frontend repository variables listed in `docs/releases/CICD-108.md` from verified production web configuration. Do not transfer backend secrets or print private values.

## Permission review before apply

Prepare a read-only IAM diff for the new principal. Prefer a custom deploy role with the exact Firebase CLI deployment/readback permissions rather than Owner/Editor. Firebase CLI permission preflight requires Function create/delete/get/list/update and operation reads even though this workflow explicitly blocks deletion; do not remove the deletion guard to satisfy IAM. Review Cloud Functions/Cloud Run IAM handling for HTTP invoker policy, Hosting version/release deployment, required project/API reads, build operations and Secret Manager metadata reads. No secret-version payload access or Firestore/customer-data permissions.

Grant `roles/iam.serviceAccountUser` only on the verified runtime/build accounts required by these Functions. Scope source verification's `roles/storage.objectViewer` to the existing Function source bucket `gcf-v2-sources-278913913091-asia-southeast1`, not all project buckets. Do not modify runtime accounts' existing roles, existing service agents, API enablement, billing, cleanup policies or application authorization. If role validation needs additional resources/permissions, produce the exact delta for approval before applying it.

## Activation and validation

After setup approval: record actual resource/IAM diff; verify provider conditions and new account bindings; read back GitHub environment/variable names without values. Validate a negative OIDC trust case (wrong branch/repository/workflow/environment rejected) and positive main/production identity. Any real deployment still follows the source tests, immutable-artifact checks and provider verification in the release workflow.

Commit/push activation and the first production run must use the exact reviewed CI/CD diff and green required checks. Record tag, GitHub release, artifact checksum, Hosting version, Function revisions and provider receipt; a queued/run-started workflow is not deployed proof.

This approval would authorize the resources and narrowly scoped bindings above, not production data changes, secret access, destructive deployment, dependency upgrades, unrelated fixes or branch-protection changes. No changes under this proposal have been executed.

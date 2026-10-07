# Automated production releases

The `Production release` workflow runs on pushes to `main` and promotes a versioned artifact to project **satsunicgo**, region **asia-southeast1**. Pull requests run quality checks without production authentication. The pipeline is implemented locally; remote activation and a successful production run require the setup below.

## Release contract

`quality → version/artifact → production deployment → provider verification → published GitHub Release`

- Quality: TypeScript checks, ESLint, all Vitest tests, release-helper tests, public-config tests, rules/HTTP/restore emulator tests and the existing production dependency audit threshold (`high`). Functions compilation before HTTP integration tests is a test prerequisite. The production artifact is built only after every quality gate passes.
- Version: ordinary commits default to patch; `feat:`/`feat(scope):` implies minor; `type!:` and a `BREAKING CHANGE:`/`BREAKING-CHANGE:` footer imply major. Commit bodies are examined, including merge messages. Unstructured messages cannot reliably signal a breaking change; use Conventional Commits for releases that need a larger version increment. The first ordinary release is `v0.0.1`; feature history produces `v0.1.0`, and breaking history produces `v1.0.0`. Reserved tags and draft releases occupy their versions.
- Notes: categorized complete commit history since the last verified production release, GitHub-generated PR/contributor notes, migration context from breaking footers, compare link, validation, source SHA, artifact checksum and provider evidence. If there is no prior verified production release, the full source history is included. Manual releases are never silently assumed to have deployed production.
- Artifact: `release-vX.Y.Z.tar.gz`, `bundle.sha256`, and `manifest.json`. The archive contains Hosting `dist`, precompiled Functions `lib`, generated public-asset bindings, exact dependency locks, version metadata, a deployment-only configuration, candidate metadata and release notes. Functions package/lock version equals the tag without `v`. Its standalone lock is derived offline from the tested root workspace lock and overrides; any new version/integrity or changed dependency declarations blocks release. This avoids using the older separate Functions lock while leaving source dependencies/locks unchanged. The deployment lock also receives the existing `high` audit gate. No source dotenv, credentials or `node_modules` are packaged.
- Metadata: `https://satsunicgo.web.app/release-version.json` returns tag/SHA/run identity. Functions carry `release.json` inside their package. No UI changes or runtime environment overwrites are needed.
- Promotion: deploy downloads the immutable artifact by ID, validates archive paths, verifies every file checksum and SHA/tag, then deploys without npm/Vite/TypeScript rebuilding. The provider builds its managed Node runtime from that precompiled package; a local archive is not a claim about an identical provider container binary.
- Verification: served Hosting metadata and all visible static files must match; all Functions must be ACTIVE and their provider source ZIP members must match the package manifest, with stable revisions before/after verification. A sanitized receipt records the Hosting version and Function revisions/generations. Successful command exit alone does not publish the release.

## GitHub and GCP prerequisites

Create a GitHub environment named `production`, restricted to `main`. Automatic releases require an environment without per-run manual reviewer gates; keep any existing organization policy intact and obtain approval for required changes. Protect `main` with required quality checks and review, and restrict tag/release edits to authorized release operators. No branch-protection changes are made by this implementation.

The workflow uses short-lived OIDC/WIF credentials, not a service-account key or Firebase token. Configure GCP trust for the numeric repository/owner identities, `main`, the exact release workflow and the `production` environment. A separate setup proposal is in `docs/plans/SATSUNICGO-CICD-108-WIF-SETUP.md`. Grant only deployment/verification permissions; do not grant Owner/Editor, production data access or secret payload access. The service account must be able to read provider source archives and finalized Hosting release metadata for verification.

Set these **repository variables**, which are public frontend build configuration. Never put runtime secrets in `VITE_*` variables:

| Variable | Requirement |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | Verified public Firebase web SDK value |
| `VITE_FIREBASE_AUTH_DOMAIN` | Verified production auth domain |
| `VITE_FIREBASE_STORAGE_BUCKET` | Verified production storage bucket |
| `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY` | Verified public App Check Enterprise site key |
| `VITE_GOOGLE_CLIENT_ID` | Optional public One Tap client ID; empty explicitly disables it |

Project `satsunicgo`, app ID `1:278913913091:web:e40355cd8ad5abe00f9936`, region, and emulator/beta flags are fixed to the existing production guard. Do not bypass `check-public-config.mjs` when values are missing.

Set these **production environment variables**:

| Variable | Requirement |
| --- | --- |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Provider resource under project number `278913913091` |
| `GCP_DEPLOY_SERVICE_ACCOUNT` | Approved deployment account in `satsunicgo.iam.gserviceaccount.com` |

Existing backend secrets stay in Secret Manager. The deployment package contains no `.env`; the current Firebase CLI retains existing runtime environment values in this mode. Confirm secret bindings and the existing Functions Artifact Registry cleanup policy before enabling production; the pipeline intentionally never uses `--force` to set a cleanup policy or allow deletion automatically.

## Concurrency and retry

Production runs serialize without canceling an active deployment. GitHub keeps one pending run by default and may replace an older pending run with a newer push. The newest main SHA is checked before build/tag reservation and immediately before deployment; superseded candidates fail closed. Commits skipped as individual releases are included in the next successful release's notes. External/manual deployments must coordinate with this same production lock; Actions concurrency cannot lock the provider against other tools.

Rerun the original workflow after fixing an infrastructure/configuration failure. It reuses the draft's original bundle, or a retained artifact from the same main SHA and exact release workflow when asset upload/tag reservation was interrupted. It never overwrites a tag or existing release asset. If the original artifact is expired/unavailable, recovery stops rather than rebuilding a reserved version. Restore the original verified artifact through an approved recovery operation. Published releases are immutable to this pipeline and reruns skip deployment.

Actions artifacts/evidence retain for 90 days (subject to repository retention limits); release attachments retain as GitHub release assets. Upload completes before production changes begin. Failed deployment/verification remains a draft. Inspect the Actions summary and provider state: Hosting and Functions deploy nonatomically, so failure may leave part of production updated. There is no automatic rollback that could silently overwrite a newer deployment.

## Rollback procedure

1. Coordinate with the release operator; stop/hold queued production promotion before making a manual rollback. Record the current Hosting version and Function revisions. Do not delete a tag or force-push `main`.
2. Select a previous **verified published release**, download its archive and checksum, verify the archive checksum, safely unpack with `scripts/release/unpack.py`, and run `artifact.mjs verify` with that release's original `GITHUB_SHA` and `RELEASE_TAG`.
3. Prefer Firebase Hosting's verified previous-version rollback for a Hosting-only incident. For a full rollback, inspect the old Function inventory against the current provider inventory first. Removing newly introduced Functions is destructive and is outside automatic rollback: leave them in place or obtain a separate reviewed removal plan. Do not use `--force`.
4. With named human authorization and approved OIDC/deployment credentials, deploy the inspected precompiled package with its deployment-only configuration. Do not rebuild it or modify runtime secret bindings. A full rollback may remain blocked if the earlier inventory would delete current Functions.
5. Run provider verification for the selected artifact and record a separate rollback receipt. Do not rewrite the historical release receipt or publish the old release as a new version. For the next forward release, push a reviewed fix/revert to `main` so normal version allocation and tests apply.

## Scope and limitations

Automatic deployment covers Hosting and Functions only. Firestore/Storage rules and indexes require a separate reviewed release. No migration, financial correction, production seed, IAM mutation, secret creation/rotation or business-data deletion runs here. Infrastructure config missing, failed checks, archive mismatch, missing Functions, unexpected source ZIP files, stale Hosting bytes, tag conflicts and incomplete verification block publication.

Provider package/revision evidence does not establish live payment, authentication/MFA, App Check provider configuration, restore acceptance or other business-flow readiness. Maintain those acceptance gates separately.

Official references: [GitHub concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency), [GitHub releases API](https://docs.github.com/en/rest/releases/releases), [Google auth action/WIF](https://github.com/google-github-actions/auth), [Firebase Functions management](https://firebase.google.com/docs/functions/manage-functions), [Firebase IAM](https://firebase.google.com/docs/projects/iam/permissions).

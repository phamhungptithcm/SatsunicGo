# SATSUNICGO-CICD-108 — automated production releases

Status: APPROVED for local implementation on 2026-10-07; owner reply "apporved". Evidence: SATSUNICGO-CICD-108-APPROVAL.md. Production IAM setup is separately proposed.

## Verified baseline and intelligence

Source inspected at HEAD 5f6393dd63453e0c305808ca7998c385eea527a9.
Repository intelligence is DEGRADED: CodeGraph stale; CocoIndex stale/unhealthy. Index recovery attempted. Conclusions below use bounded source inspection, not complete indexed coverage.

- `.github/workflows/ci.yml` runs on pull requests/manual dispatch only. It checks types, lint, unit tests, build, rules/HTTP/restore integration tests and dependency audit. It does not release or deploy.
- Root package uses npm workspaces, React/Vite/TypeScript and Vitest. Functions use Node 22 and TypeScript.
- `firebase.json` binds Hosting `dist`, Functions codebase `satsunicgo`, Firestore rules/indexes and Storage rules. Functions predeploy recompiles, which must be avoided in artifact promotion.
- `scripts/release/check-public-config.mjs` and `preflight.mjs` already guard the production project/configuration and frontend/backend asset binding. Preflight explicitly does not prove provider acceptance.
- Existing local changes and shared frontend/emulators are outside this task.

## Proposed behavior

1. Every push to `main` validates the exact event SHA. Pull requests retain checks and cannot obtain production credentials.
2. Run lint, unit tests, release configuration checks, rules/HTTP/restore integration tests and production dependency audit before the production build. Compile dependencies required by integration tests only when their source requires it; do not mistake this for release build approval.
3. Compute an immutable SemVer tag from existing release tags. Default patch; Conventional Commit `feat` means minor, breaking markers mean major. Support ordinary merge/squash messages and document limitations. No release commit or recursive push to main.
4. Build frontend and Functions once with production public configuration and the chosen tag. Write nonsecret version metadata (tag, SHA, run identity) into the artifact. Capture file checksums, generated public asset bindings and deployment configuration.
5. Save versioned immutable artifacts. Deployment downloads that artifact, verifies checksums and SHA, and never rebuilds locally. Firebase may build its managed runtime remotely from the uploaded Functions package; record that provider boundary explicitly.
6. Deploy Hosting and Functions to project `satsunicgo` using GitHub OIDC/Google Workload Identity Federation and a scoped service account. Preserve runtime secrets on the provider. Exclude rules/index changes from automatic deployment in this scope.
7. Serialize production mutations, check for superseded SHAs before promotion, prevent older candidates from overwriting newer releases, and fail closed on tag conflicts. Reruns reuse the same candidate and tolerate a partial release without moving an existing tag.
8. Create a draft GitHub release/tag for the tested candidate, attach the artifact and checksum manifest; publish only after deployment verification. Failed/partial deployment remains explicitly unsuccessful with the draft and diagnostic evidence retained.
9. Generate professional release notes from all commits/associated PRs since the preceding successful release: features, fixes, security, performance, maintenance, breaking changes, comparison link, validation, tag/SHA/checksums and verified deployment status. Preserve uncategorized changes; never invent business summaries.
10. Read back deployed Hosting version metadata/assets and Functions revisions/package identity where supported; reject incomplete verification. Provide a documented recovery/rollback procedure using retained artifacts. Hosting and Functions are not an atomic deployment; a partial failure must be reported and cannot publish success.

## Files and scope

- `.github/workflows/ci.yml`: reuse validation without weakening current gates.
- `.github/workflows/release.yml`: main-triggered validation, version/build, artifact promotion, verification and publication.
- `.github/release.yml`: release-note categories and excluded automation noise.
- `scripts/release/`: small version, manifest, notes, deployment-config and verification helpers; invoke existing configuration/preflight guards.
- `tests/unit/`: meaningful tests for version selection, first release, reruns/conflicts, checksums, note range and failure handling.
- `docs/releases/`: setup/runbook for environment variables, WIF trust restricted to repository/main/production, minimum permissions, branch protections, release policy, diagnostics, retention and rollback.
- Task approval, quality evidence, final review and completion documents.

No application UI, business logic, schema, database data, dependency upgrades, secret values or shared-runtime changes. Generated assets are regenerated through their source script only. Use existing dependencies and pin third-party Actions to verified commits.

## Risk and prerequisites

HIGH operational risk: production deployment credentials and concurrent releases. Limit workflow permissions by job; production credentials only in the deployment job, no pull_request_target, no arbitrary workflow inputs executed as shell code, no destructive Functions deletions.

Remote GitHub environment/WIF configuration, permissions and existing release tags require authenticated inspection before implementation decisions are finalized. Missing WIF/public configuration blocks actual deployment, not preparation of reviewable code. Changes to provider IAM/trust or repository protection require a separately concrete setup scope before mutation. Existing red tests block release; unrelated application fixes require a delta plan.

## Validation and acceptance

Validate YAML/action contracts against current official documentation, run workflow lint where available, helper unit tests, existing release-config checks and all applicable CI commands. Exercise first release, ordinary/Conventional Commits, breaking changes, retries, manifest tampering, deployment failure and concurrency cases. Verify artifact reuse and deploy config has no local compilation hook.

Run mandatory final-implementation-review, fix findings within approved scope and rerun checks/review until fresh PASS. Local checks do not prove GitHub execution or production deployment. Record unavailable provider evidence, token/cost availability and memory candidates honestly.

Approval requested: implement the files and behavior above, with automatic Hosting + Functions deployment on future pushes to main. Approval does not authorize unrelated application fixes, destructive operations or production data changes.

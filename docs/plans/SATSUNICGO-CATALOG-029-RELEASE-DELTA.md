# CATALOG-029 release delta v1

Status: PROPOSED — reviewed-plan approval required before protected edits, commit/push/deploy.

Human request: publish all current local source to the environment named production for sanity checking, then continue catalog import. This is not authorization to start live financial/provider operations. Existing CATALOG-029 v1 excludes release; this document defines the material delta.

## Current evidence

- Intelligence DEGRADED: shell index freshness/daemon checks incomplete; CodeGraph and CocoIndex MCP retrieval and critical source verification succeeded.
- `satsunicgo.web.app/products` runs static beta with Firebase clients disabled and Google login disabled. Rebuilding that beta cannot enable catalog administration.
- Read-only cloud inventory: Google provider enabled/configured; default Firestore Native and Storage in asia-southeast1; zero Cloud Functions. Billing API returned403, so billing eligibility is UNKNOWN.
- Current `git status --porcelain` reported492 changed/untracked entries; main upstream gone. `git ls-remote --heads origin` succeeded with no heads. Candidate is not frozen and may include concurrent WIP.
- Typecheck FAILED at tests/rules/blog-studio-advanced027.test.ts:306: queue.items possibly undefined. Unit suite389/390 passed; one telemetry test was blocked by sandbox localhost listen and is being rerun outside the sandbox. These are local evidence, not cloud acceptance.

## Proposed implementation and file ownership

1. Freeze an explicit manifest of all source/config/tests/docs intended for the release; inspect tracked/untracked files for credentials/private data, exclude ignored runtime outputs. Preserve concurrent edits and record SHA256 before validation. New changes after freeze require revalidation; do not silently stage them.
2. In tests/rules/blog-studio-advanced027.test.ts, assert moderation items exist before searching, preserving the authorization/privacy assertion. No application behavior change. Fix other reproduced release blockers only after a bounded delta if they materially change behavior.
3. Use package.json scripts and existing Firebase configuration. Run typecheck, lint, unit/integration tests, production build, relevant isolated rules/browser checks; never reset shared emulators. Apply repository quality/product-content/final-review gates to the complete candidate. Record excluded/unrun checks and provider boundaries.
4. Inspect deployed service configuration read-only, including App Check and owner role availability, without printing credentials or reading secret values. No bypass or bootstrap role write. If owner role or required platform setup is absent, stop and identify the exact setup action.
5. Commit the reviewed all-local candidate using Conventional Commits, push hunpeolabs/catalog029-sanity-release to origin, and bind artifact/release evidence to that commit. Do not force-push or overwrite another contributor's work.
6. Publish Hosting with Firebase clients enabled plus reviewed Firestore/Storage rules and required catalog/auth/public-content backend functions. Keep the environment a sanity release with no live transactions. Inventory all exported functions before selecting deployment targets: payment/AI/SMTP and scheduled maintenance jobs are not activated merely by publishing source. Do not use blanket functions deploy if it binds secrets or activates jobs. Use existing production access controls and App Check; missing configuration is a blocker, not a reason to weaken controls.
7. If billing/API activation, new secret/IAM setup, financial disabling configuration or backend changes are required, produce an exact setup delta first. No secret creation/access, IAM grants, billing changes or paid service activation in this delta.
8. Verify Hosting build identity, Google sign-in, authorized admin access, catalog read/save and image upload/readback. Continue approved CATALOG-029 import through authenticated existing functions:26 unique research-backed products, reference prices only, orderable=false, no fake stock/ratings/sales. Archive only verified mock records; preserve order/history references and capture rollback evidence.

## Risk, rollback and acceptance

HIGH: first backend deployment, new remote publication and broad shared WIP. Whole-source publication is distinct from activation of every service. Before release retain previous Hosting version/configuration and inventory data touched; rollback Hosting/functions/rules only to verified previous artifacts. Do not delete financial history or database collections. Since functions inventory is empty, rollback of first deployed backend must be explicitly recorded before deployment, not improvised.

Acceptance: current candidate checks and fresh final review pass; exact commit pushed; deployment identity/readback verified; authenticated catalog upload/save succeeds;26 unique records have valid reviewed images and source-backed details; unsupported details absent; prices clearly reference-only; mocks archived by exact IDs. Do not claim real-production readiness or live-provider success from sanity checks.

Approval requested: delta v1 steps1–8, including bounded test correction, candidate freeze, commit/push and scoped sanity deployment. Provider/IAM/billing/secret activation remains outside this delta.

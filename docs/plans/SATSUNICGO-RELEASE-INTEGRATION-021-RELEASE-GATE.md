# Production release gate — reviewable scope

Target: production satsunicgo, no new staging project, target October6 America/Chicago. Candidate source/build hashes:docs/reviews/release021/SOURCE_MANIFEST.json. Approval021 remains local-only; this document does not grant deploy authority.

Before a deployment can be authorized/executed:
1. Finish native200percent zoom/keyboard/AT and interrupted browser retry acceptance; resolve current Product Language Gate without weakening it.
2. Review remaining raw dependency advisories and verify actual release telemetry configuration complies with guard; do not substitute local tests for live config evidence.
3. An authorized production operator must establish billing/IAM/AppCheck enforcement, staff MFA/owner assignment, seller/catalog/terms, provider configuration securely. No secret/token should be pasted into chat. Billing403 is unknown.
4. Prepare scoped deploy inventory with public/commerce endpoints and rules/indexes. Separately review scheduled email/campaign/payment jobs before deploying: do not accidentally activate live sends or financial effects through a blanket deploy. Providers/Ask purchase activation stay disabled until approved acceptance.
5. Capture current Hosting version/function inventory and a reviewed rollback path. Backend metadata currently empty is not a recoverable old backend. Do not remove data or issued statements to roll back.
6. Obtain explicit exact release-scope approval. Then deploy the authorized components, read back artifact/version/config, run controlled auth/MFA/AppCheck and provider acceptance under separately authorized financial/send operations. Do not mark READY from HTTP200 alone.

Production datafix, secret access, actual money collection/refund and customer sends are outside local021 approval. Preserve shared WIP. The current gate is BLOCKED; no deploy command has been executed.

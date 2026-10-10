# CI delta v2.1 — approval pending

Problem verified: existing ci.yml runs quality only, without a retained versioned deployment artifact. Existing release.yml builds an artifact and then automatically deploys on main push. It cannot be used to complete artifact verification under the no-deploy constraint.

Concrete proposal: add only .github/workflows/tracking-candidate.yml using the exact proposed file beside this plan. Manual workflow_dispatch; read-only repository permissions, no id-token/WIF/cloud credentials, no production environment, no release/tag/merge/deploy command. Reuse existing complete ci.yml quality job then build production public-config artifact, verify checksum/manifest and audit standalone Functions lock. Limit artifact job to hunpeolabs/tracking-release-* branch. v0.12.0 is an explicitly UNRESERVED candidate label; it does not reserve/publish a version or authorize promotion. Upload artifact retention30days, bind exact GITHUB_SHA. Existing ci.yml/release.yml unchanged.

Validation: YAML parse; all action SHAs pinned to existing released workflow; assert no deploy/auth/secret/write permissions; verify workflow's local build/package commands; inspect remote run commit and artifact manifest/checksum. Negative artifact-tamper/path tests existing release108 suite. Whole quality failures fixed only within approved tracking scope; unrelated dependency/CI architecture changes require separate delta.

Human approval requested because existing-system CI changes require reviewed plan approval per .ai/workflows/plan-existing-system-change.md step15 and previous v1 excluded CI changes. No new workflow file will be installed until approval. User will perform security-sensitive cloud provisioning and human review; no deploy.

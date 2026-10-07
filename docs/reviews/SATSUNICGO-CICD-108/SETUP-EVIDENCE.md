# Production setup evidence — 2026-10-07

Owner authorization: `setup all thing required`.

- Created keyless `github-release@satsunicgo.iam.gserviceaccount.com`.
- Enabled STS; pool `github-release`, provider `satsunicgo-main` read back ACTIVE.
- Exact provider restrictions and deploy permissions are recorded in `scripts/release/production-wif.json` and `production-deployer-role.json`. GitHub confirmed immutable OIDC subject enabled; provider uses verified owner/repository IDs in subject.
- Bound custom production deploy role to the new account, runtime actAs only to existing compute account, source-object read only to the regional Functions source bucket, federated access only to this repository ID. No account key, customer-data access or secret payload access granted.
- Created `production` environment with custom `main` branch policy; configured WIF/account environment variables and five validated public frontend repository variables. Readback reports names only.
- Existing main is unprotected; branch-protection changes excluded from approved setup.
- Isolated temporary clone contains only scoped CI/CD changes; concurrent product edits and generated asset manifest remain excluded.
- Production authentication, integration tests and first release must still be verified by Actions. Setup resource creation alone is not deployed proof.

Setup review findings and corrections:
- Remote Node22 typecheck found two browser reference specs depended on machine-local `/private/tmp` fixture imports. Three unchanged fixture files are now checked in with SHA-256 provenance and relative imports; no test exclusions or relaxed compiler options.
- Current production evidence explicitly holds seven Functions. Artifact packaging now preserves that exact entry boundary with bounded AST checks, without compiling again or changing application source. Secret Manager list is empty; no provider secret payload was accessed/created.
- Existing Functions image repository lacked a policy, which makes Firebase noninteractive deploy exit nonzero after successful updates. Configured a KEEP-only policy, dry-run enabled; no DELETE action or artifact deletion. Readback confirmed KEEP and dry-run. Deployment account has no repository-update permission.

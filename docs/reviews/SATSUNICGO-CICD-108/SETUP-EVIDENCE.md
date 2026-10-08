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

Remote integration correction scope (same approved CI setup):
- Run 37701345937 passed compilation/lint/unit/helpers/config, then failed rules: 31 suites/499 cases passed; 9 suites failed (8 assertions and 5 suite setup failures), 32 cases skipped by existing hooks. No deployment occurred.
- Dedicated cart/pilot/delivery suites keep their exact local isolation guards. A GitHub-only launcher starts fresh loopback Auth/Firestore/Storage instances per group, with exact demo identities/ports and no shared local runtime. All original rule files remain included across groups.
- Auth emulator is included to prevent Admin Auth from looking for real credentials.
- Scheduled-maintenance fixtures now use its actual authorized canonical demo database, retaining unique synthetic document IDs.
- Payment/SMTP transaction-core suites retain their existing fake SDKs and assertions, with a narrowly scoped test-only capability mock that rejects real identities, nonloopback stores and injected cloud credentials. Real provider-hold tests remain unmocked. Paid-AI assertions now verify the actual unconditional release hold before provider invocation and preserve the quota counter; application gates are unchanged.

Final verification corrections:
- Main run 37702785743 passed quality and reached build dependency installation; cancelled before artifact upload, tag/draft reservation or provider deployment.
- Provider verification now binds initial/final Hosting release/version/time around all file/source checks; replacement, disable and unfinished versions fail closed. Identity is refreshed before provider readback to reduce OIDC expiry interruptions.
- Rules runner selects Storage port9298, enabling the existing conditional private-image transaction test without changing its selector/assertions.

First release run37704171123 passed allquality gates, then failed the production public-config guard with INPUT_INVALID. Two unused VITE_RELEASE keys were outside its existing whitelist; they are removed from the build environment. The guard is unchanged. Tag/SHA binding remains in candidate, Functions package version, dist/release-version.json, Functions release.json and the file-hash manifest. No artifact upload, tag/draft or deployment occurred.

## Provider activation corrections

Run37705487725 reserved immutable v0.1.0/tag/assets. Firebase CLI15.32.1 unconditionally checks Appspot actAs even for Gen2; granted only the new deploy account iam.serviceAccountUser on existing satsunicgo@appspot.gserviceaccount.com. Runtime/build accounts remain compute; no token creator or broad SA grant. Attempt2 completed Functions/Hosting promotion but correctly retained a draft after failed verification. Hosting REST diagnosis returned SERVICE_DISABLED consumer projects/32555940559. Fixed metadata headers bind quota to satsunicgo; live response HTTP200. No broader IAM/API enablement required. New approved source da9f5438e549ca68efe636b7340910f3c5c1384e is running37707571610. Production success pending receipt.

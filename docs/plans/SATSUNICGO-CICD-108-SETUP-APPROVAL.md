# CICD-108 production setup authorization

Approval status: APPROVED
Approver: repository owner in current chat
Approval evidence: 2026-10-07 user instruction "setup all thing required" after the WIF activation proposal and required manifest cleanup were presented.
Scope: provision the deployment service account, numeric-repository-bound OIDC pool/provider, narrowly scoped deploy/metadata permissions, runtime/build actAs binding, source-bucket verification access, GitHub production environment/variables, required STS API if absent; validate the scoped code on a temporary CI branch and activate the exact green candidate on main. Future releases follow the tested immutable-artifact workflow. No runtime secret payload access, customer data, keys, destructive operations or unrelated WIP included.

Read-only permission inventory: every deployed Function uses runtime/build account `278913913091-compute@developer.gserviceaccount.com`. The project already enables IAM and IAM Credentials; STS enablement is part of required WIF setup if absent. Existing main branch is unprotected; protections are not silently changed by this setup.

Deploy principal will receive only a custom role for Function CRUD/operations/source/IAM, Hosting get/list/update, Run service/revision/operation read plus HTTP invoker policy update, Cloud Build read, Scheduler create/get/list/update and project/API reads plus Secret Manager metadata reads. Function deletion appears in Firebase CLI's mandatory permission preflight but is blocked by inventory checks and no-force noninteractive deploy. No project IAM policy write, secret payload access, datastore access, account-key creation or generic Editor/Owner role. Runtime/build actAs applies only to the verified compute account. Source object read applies only to the GCF source bucket.

Permission list and condition are saved in `scripts/release/production-deployer-role.json` and `scripts/release/production-wif.json` before resource mutation and source-verified against installed Firebase CLI. Changes needed beyond these specific permissions require a documented delta bound to this setup authorization.

Validation: provider condition negative cases; resource/IAM readback without values; GitHub variable-name/environment-policy readback; remote CI including isolated emulators; main release tag/artifact/checksum/Hosting/Function provider receipt. Token and actual billed cost unavailable unless provider evidence exists.

Manifest cleanup: the command reviewer still rejects `git restore`; leave that validation output untouched and exclude it from the scoped candidate. Do not bypass the rejection using another tool.

## Required CLI actAs delta — 2026-10-08

Bound to owner instruction `setup all thing required`. Run37705487725 positively verified OIDC, immutable bundle upload, tag/draft reservation and pre-deploy inventory; Functions deployment stopped before provider updates. Installed Firebase CLI15.32.1 `checkServiceAccountIam(projectId)` unconditionally tests `iam.serviceAccounts.actAs` on `${projectId}@appspot.gserviceaccount.com`, independently of the62 observed Gen2 compute runtime/build identities.

Smallest required setup delta: grant `roles/iam.serviceAccountUser` to the dedicated release principal only on existing `satsunicgo@appspot.gserviceaccount.com`. Keep compute actAs binding and every runtime account unchanged. No project-wide service-account role, token-creator role, account key, customer-data or secret-payload access is added. This is the CLI prerequisite account, not a claim that deployed Gen2 runtimes use App Engine. Verify binding, then rerun failed deploy job against the preserved original artifact; do not rebuild or move its tag.

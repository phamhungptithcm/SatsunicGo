# Purchase receipt retry-policy impact

Independent Technical Lead; 2026-10-09T06:08:35.088709+00:00. Read-only source, dependency implementation, local artifact and supplied provider-receipt analysis. No deployment, tests, SDK handler execution, browser/provider/credential/model call, source/workflow edit or Git mutation by reviewer. Intelligence gate **DEGRADED**: installed healthy CodeGraph1.5.0/CocoIndex indexes stale at53d59bd; exact frozen0d6 source and artifact evidence used. Review lease **RELEASED**.

Decision: **PREFERRED_NARROW_INTERACTIVE_PREREQUISITE_WITH_GATES**. The existing approved retry:true worker is a necessary release prerequisite under the human's explicit main-release/enable-necessary-functions and continuing fix/review authority. This note neither authorizes a new capability/hold removal nor executes the prerequisite. Overall final/customer/Product Language review remains **BLOCKED**, production **NOT_READY**. Existing FINAL-REVIEW-r4.json remains immutable, SHA `f531506756a9ea2bdce40cc58b66f9576506143105faa5fb3adebff60df19e9d`.

Current reviewed source is `0d6e721698608eebb36b0b2f68021c3054d97d1c` only. Dirty shared purchase/payment/receipt WIP is excluded. Parent reports current CI and immutable build passed; reviewer directly verifies artifact identity/closure, not a new whole-CI execution. Run37890490893 failed at the newly-retry safety confirmation before function upload; failure log SHA `5e6846c68865905473154086957eea7ad8f74641ade1fc107c58481a55ea0e3c`. This run's pre-upload failure is not general proof that any later cancelled deployment had no effects.

## Exact artifact boundary

- Stage: `/private/tmp/satsunicgo-release-local-0d6e721-verify-20261009/release-stage`.
- v0.7.0 / source0d6 / project satsunicgo; bundle SHA `7da5b4e2257930f924e91db65a42ee149a7a70e1b1c3b74d6ac966a1277d0cca`; manifest SHA `2c589717213d95ac0890ceb28198aeb337829fc33551adadc09a5cb44e38d771`.
- All317 manifest file hashes independently match before/after review. Inventory94, eight preserved holds: askFeedbackCleanup, askWorkflow, createPaymentLink, currentAskConversation, deliverEmail, maintenance, payosWebhook, reconcilePayments. purchaseDemoPayment remains excluded. Exactly one worker inventory entry, region asia-southeast1.
- Compiled worker SHA `98e4739671f35b967b4de14b04986085b4aac1beb96bb693e960a33ec769abfd`; packaged firebase.json SHA `27bf1c3cd7b09952d08fb0830c02d3457748846baad4b49bd825dcb074f65c12` has predeploy:[]; source firebase.json would rebuild and must not be used.
- Root readback SHA `6dc5f5c57d2de9a11d4f496a632d7f9bbfc71966a32dd2971fd5b299f6180977` and compiled-comparison receipt SHA `233c2cd7cb8cebe84507cd12f3f0cd12168aa93418f42bf002473c39bfa5d1b0` report116 compiled modules equal the current build, transformed entry subject to reviewed hold/demo policy. These receipts do not certify provider execution.
- Supplied post-failure inventory SHA `9e581ebae2c5ef1f6d3a27e1abd67f419b596e4a2f5e705bb10e4df795c8b110` contains73ACTIVE, only asia-southeast1 names, no worker/prefix match. The JSON does not attest collection query flags; do not present it alone as all-region collision proof.

## Retry and idempotency behavior

`functions/src/purchase-receipts.ts:140–150` declares Gen2 onDocumentCreated for purchaseReceiptJobs/{id}, region asia-southeast1, maxInstances2, concurrency4, retry:true. Processing first transaction reads job/receipt, no-ops on missing/ready/failed or unexpired active lease, fences claims with random token, increments attempts and leases120seconds before PDF/Storage I/O. Attempts>=3 terminates the application job. Commit transaction rechecks claim/state and immutable snapshotHash, writes one deterministic private receipt object path and one outbox document ID, then marks ready. Replays of completed work return; stale claims cannot commit newer state. Existing actual purchase fixture source asserts duplicate processing, expired lease recovery, attachment digest, missing recipient, retry cap, and no extra financial entry. Current CI success is parent-reported; no reviewer invocation occurred.

This is **not a cap of three cloud invocations or zero retry charges**. Firestore/initial-transaction failure before claimed attempts, failed error-cleanup transaction, initialization failure or process timeout can still cause cloud retry. Official Firebase documentation currently describes a24-hour Gen2 retry window and exponential backoff; CLI warning generically mentions up to7days. Retried invocations incur normal execution charges. [Firebase retry semantics](https://firebase.google.com/docs/functions/retries).

PDF/storage exceptions handled by the catch mark queued/failed and return successfully. Cloud retry does not replace the scheduled purchaseReceiptRecovery path for acknowledged queued jobs or expired claims. Recovery source bounds each scheduled batch to at most10 IDs; it is in the unchanged allowed artifact inventory and still needs normal deployment/provider verification. No finite cloud-invocation/payment/cost SLA is asserted. Worker does not write financialEntries or call real email/payment/model transports: email without configured production transport remains pending_configuration/unconfigured, missing recipient stays pending_recipient. Deterministic render source contains no current-time/random PDF metadata, but no provider-level byte/lease/concurrency certification is claimed.

## Firebase CLI selection and safety

Pinned installed Firebase Tools15.32.1 is matched by the frozen root lock. `functionsDeployHelper.js:26–37,44–83` parses codebase+ID and matches **exact ID or ID-prefix followed by hyphen**, in every matched region. Therefore `functions:satsunicgo:purchaseReceiptWorker` is not intrinsically a singleton equality selector. Prepare.js334–337 filters the newly-retry prompt; planner.js99–112 filters desired/live endpoints before create/update/delete planning. No dry-run/test/runtime deployment was executed by reviewer. Official docs support selective function deployment; exact prefix semantics are verified against the installed pinned CLI, not inferred from documentation. [Firebase selective deployment](https://firebase.google.com/docs/functions/manage-functions#deploy_functions).

Force bypasses more than retry confirmation: prompts.js40,55,88,117,182,198 bypass retry, deletion, unsafe migration, minimum-bill, cleanup-retention and declarative security confirmations. **Do not add global --force** to functions:satsunicgo,hosting or the CI workflow. A filtered-force route would require equivalent explicit zero-delete/zero-migration/zero-security/retention controls and remains less safe than interactive confirmation; it is not selected by this review.

Prefer a one-time interactive deployment from a hash-verified prepared workspace of the exact immutable artifact, using the pinned CLI/Node22 and existing authenticated release identity. Command shape for root's reviewed plan, not reviewer execution:

```sh
node <verified-pinned-firebase-cli-path> deploy --project satsunicgo --config firebase.json --only functions:satsunicgo:purchaseReceiptWorker --message "v0.7.0 / 0d6e721698608eebb36b0b2f68021c3054d97d1c / retry prerequisite"
```

Use the prepared immutable deployment directory as cwd. Omit --force and --non-interactive. Do not use dirty shared source, run predeploy rebuilds, add Hosting/rules/other Functions targets, install different CLI or edit retry/source/manifest bytes.

Before the command, root must bind bundle/manifest/workspace hashes, current main/source reservation, project/codebase/region and fresh live identity/inventory. Independently assert exactly one desired matching worker; check all regions/codebases for collisions, no existing foreign/prefix IDs, and no targeted deletion/delete-and-recreate/platform/trigger/region migration. Current supplied worker-absent receipt supports a create-only route but not future TOCTOU or all-region facts. Retain existing verify-production before guard; its provider query is asia-southeast1/codebase-only, so it does not substitute for the all-region singleton check.

Answer **only** the recognized retry-policy confirmation after its warning lists only satsunicgo:purchaseReceiptWorker(asia-southeast1). Do not pipe blanket yes or auto-accept prompts. Cancel any unexpected selection, removal, migration, new IAM/declarative security/minimum-bill or retention change and review that concrete delta. CLI also enables required APIs/service-agent roles during normal prepare; unchanged normal release prerequisites remain root-owned and must not be mistaken for a promise of function-only zero infrastructure effects.

Cleanup-retention confirmation can occur **after** function mutation: release/index.js89 applies the plan, then100/148–159 configures Artifact Registry cleanup. Do not answer a new image-deletion policy prompt as part of this worker consent. If cancelled/nonzero after mutation, inspect/read back provider status and source before deciding retry; do not claim no change or deploy again blindly.

After exact-worker success, root must record active region/codebase/source/retry/trigger revision and unchanged holds/other functions, then rerun only the failed original GitHub deployment job against the same reserved0d6/v0.7.0 artifact. Existing checksum/head/implicit-deletion guards, keyless identity and full normal non-interactive deploy must stay unchanged; do not rebuild or promote/publish on prerequisite success alone. If retry:true is already live, CLI's newly-retry check no longer prompts. Full source/Hosting/provider readback, immutable artifact verification and release publication remain mandatory. No workflow/source delta is required for this route.

## Scope and remaining gates

All seven engineering dimensions are bounded here: requirement match uses the exact existing retry prerequisite; security preserves auth/holds/deletion gates; code quality uses pinned source/CLI and immutable bytes; failure/error paths distinguish claimed retries from cloud failures and post-mutation cancellation; production readiness remains blocked; trade-off favors one-time interactive acknowledgement over broad forced deployment. No new UI/customer strings or meaning contract is changed. Purpose, Agency, Responsibility, Familiarity and Simplicity are supported only for this precise operator plan/unchanged application; Flexibility, Craft and Delight remain without fresh native/customer evidence. Whole Product Language/native AT stays BLOCKED; no eight-principle waiver or successful customer handoff.

The explicit function-prerequisite authority does not enable held AI/email/payment/maintenance/cleanup exports, real purchase adapters, official corpus/policy/effective dates, feedback retention, permanent regulated-data deletion, AI budget replenishment/accounting or new paid verification calls. Fully reserved50000VND ledger and expired live windows remain unchanged. Prior JP/KR receipt glyph and purchase Analytics attribution limitations remain. No production datafix/reseed/customer synthetic fixture or credentials stored in this note. Actual deployed worker behavior, live Storage/email policy, runtime charges and customer accessibility are NOT_VERIFIED. Runtime progress/token usage/cost unavailable; memory candidates None.

## Hash-bound inspected inputs

| Isolated0d6 path | SHA256 |
| --- | --- |
| `functions/src/purchase-receipts.ts` | `1b76b21d3a2ac6f67e52354156417d6e9adb38cba8c95a0e0315c7701db3ae72` |
| `functions/src/purchase-pdf.ts` | `036cd9e7d9f384c1dd454227aa4c24ee42333af65e4f3815e7b7c3c5c483c44d` |
| `scripts/release/verify-production.mjs` | `0f628837698ea2c4457ef532d8bd491475cc8ebcdf712f951351065e38d80616` |
| `.github/workflows/release.yml` | `ccd3fd7d97593225257ba85531eea1fab244c0b74619bb21c167f50adb48bd92` |
| `package-lock.json` | `d2ef5388dbee9d04f0a8e269d0e43a7d149dd5bc001e9de701cf0ebaf6cc5800` |
| `node_modules/firebase-tools/package.json` | `7264bfa4275706af930190da9d90533e7b5d0b43a1f2cd87d99959ac38cbff89` |
| `node_modules/firebase-tools/lib/deploy/functions/functionsDeployHelper.js` | `bab283f3bc970573bfb787e594fe79f73a37d4f8e8452e7bcb43130bb4e5cc84` |
| `node_modules/firebase-tools/lib/deploy/functions/prompts.js` | `b39d852ffd7df03709297cc5ec29908ab2da5283d7378b051a0b72188209efa0` |
| `node_modules/firebase-tools/lib/deploy/functions/prepare.js` | `bdfd372e737ab84b9ce4242ad9ea69652400bef9080400cbb096005217df5d04` |
| `node_modules/firebase-tools/lib/deploy/functions/release/planner.js` | `3a33f50daaa9d976e3aa0bea207c586da9a36fd9df1fc5084ee6ec31e57e7821` |
| `node_modules/firebase-tools/lib/deploy/functions/release/index.js` | `03c7a0acae1ad8096370fcc263631947f048676ee4b42f3cd43dc0c64a3b6a6e` |

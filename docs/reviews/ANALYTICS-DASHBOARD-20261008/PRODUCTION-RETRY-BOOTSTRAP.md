# Confirm the approved trigger retry configuration

Safety hold: read-only policy discovery and independent SDK review found missing first-event-service IAM bindings. No interactive bootstrap may execute until PRODUCTION-EVENTARC-DELTA.md is approved, its exact identities/bindings are verified, and the SDK would add no IAM delta. This supersedes any earlier implication that retry acknowledgement alone was sufficient.

Run37812638036 attempt2 passed Firestore metadata discovery after the approved single getMetadata grant, then failed before source upload: Firebase CLI15.32.1 requests explicit acknowledgement for newly enabled retry policies in non-interactive deployment. The immutable v0.5.0 artifact already contains retry:true for exactly analyticsOrderChanged, analyticsPaymentCreated and analyticsJobCreated in asia-southeast1. No source change, new permission or retry behavior is proposed.

Execution adaptation within the owner's existing instruction to deploy and enable this approved configuration: extract and validate the preserved checksum-bound candidate using the trusted release unpack/verify code. Install only its locked runtime dependencies with scripts disabled, without recompiling or changing artifact files. Use the same installed Firebase CLI version to deploy only these three functions in interactive mode. Confirm only the retry acknowledgement after inspecting the exact three function names, explicit satsunicgo project, region and source binding. Do not use --force, change CI, acknowledge deletion/unsafe migration or grant additional IAM.

Command from the verified extracted deployment directory:

```sh
node /Users/hunpeo97/Desktop/Workspace/Coder/SatsunicGo/node_modules/firebase-tools/lib/bin/firebase.js deploy --project satsunicgo --config firebase.json --only functions:satsunicgo:analyticsOrderChanged,functions:satsunicgo:analyticsPaymentCreated,functions:satsunicgo:analyticsJobCreated --message 'v0.5.0 / d427c1c270f41e4606dee6a36e5c9a685bde72f9 retry bootstrap'
```

Inspect every prompt; answer yes only to the already-approved retry acknowledgement for those exact functions. Additional prompts, unsafe migration/deletion, altered source, superseded main or IAM requirements cause a stop for investigation. Canonical customer data is not read or mutated. Analytics collection remains disabled throughout bootstrap.

After bootstrap, read back the three ACTIVE trigger identities, document paths and RETRY_POLICY_RETRY. Re-run only the failed CI deploy against the same immutable artifact. The original no-force non-interactive deployment recognizes these existing retry policies and continues without the new-policy acknowledgement. The CI still must promote all expected functions/Hosting and produce its verified immutable source/edge receipt before analytics indexes, TTL or collection activation.

This implements configuration already approved in the analytics source and production enable instruction; it does not authorize new behavior or relax the pipeline deletion safeguard. Unknown deploy outcomes require metadata reconciliation. Do not retry blind or delete created functions to roll back; disabled collection and preserved candidate are the recovery boundary.

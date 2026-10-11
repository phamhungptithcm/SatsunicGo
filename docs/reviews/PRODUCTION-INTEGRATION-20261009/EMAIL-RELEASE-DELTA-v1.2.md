# Email release — packaging and domain setup v1.2

Status: APPROVED by direct human reply “Duyệt v1.2 và cấu hình DNS” to request_user_input_async/call_2b47b74bfd064668ab85ac88d3b5b64d question0 in this chat. This is a concrete delta to approved v1/v1.1, not activation evidence.

## Verified gaps

The updated artifact excludes the five guarded demo exports, but its existing production hold still removes `deliverEmail` and the `./email` import. This prevents the customer worker approved in v1 from reaching production. The independent artifact test discovered 97 expected endpoints with that hold still present; a successful package test does not prove both workers ship.

Authenticated Resend Domains showed **No domains yet**. The Add domain form is prepared with `hunpeolabs.com`, but has not been submitted. The owner selected `contact@hunpeolabs.com` and confirmed GoDaddy manages DNS. Sender selection and the earlier self-test do not establish domain verification.

## Exact changes for approval

1. In `scripts/release/artifact.mjs`, remove only `deliverEmail` from `BASE_HELD_EXPORTS` and only `./email` from `applyProductionHolds` blocked modules. Keep the six other base holds, `askFeedbackCleanup`, immutable hashes, trigger inventory, deletion protection, five demo exclusions and all CI steps. In `tests/unit/release108.test.mjs`, verify the compiled customer worker survives, its SDK schedule endpoint is discovered, every other hold remains absent, and old rollback packages still verify.
2. Add only `hunpeolabs.com` to the existing authenticated Resend account to obtain its exact provider-generated sending DNS records. Do not enable inbound email, buy a plan, expose credentials, create an API key, change access, or send a message.
3. In the owner's authenticated GoDaddy DNS page for exactly `hunpeolabs.com`, inspect existing records and prepare a record-by-record diff using only the sending-verification records returned by Resend. Add missing TXT/DKIM/SPF and dedicated return-path records only when they do not conflict. Preserve website records, existing root MX/SPF, DMARC and other providers. Do not replace or delete existing records. If a required name conflicts or domain permissions/security confirmation is required, stop at that specific decision rather than guessing.
4. Read back GoDaddy records and authenticated Resend status. Only a verified sending domain satisfies the domain gate. DNS propagation pending is pending. Keep customer sending disabled until all v1 artifact, handoff, consent, secret metadata/version and live-release conditions pass.

## Verification and rollback

Run source-bound release108/preflight tests and actual Firebase SDK discovery on an isolated frozen source copy with network disabled. Verify both email workers are present and all unrelated holds/demos absent. Re-run the mandatory implementation review on current hashes.

Record the exact public DNS diff and readback without account credentials or personal data. For rollback, disable customer sending first. Roll back the application using the immutable release artifact; do not reset accepted/unknown states or quota history. Newly added DNS records may be removed only under an explicit recoverable DNS rollback decision; never delete pre-existing mail or website records automatically.

No runtime activation, secret payload access, production datafix, real email, paid upgrade, or CI bypass is authorized by this delta alone. Existing conditional automatic-release authorization continues after the required evidence passes.

Token usage and actual billed cost: Unavailable. Memory candidates: None.

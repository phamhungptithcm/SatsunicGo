# Production release authorization and constraints

Plan ID: SATSUNICGO-PRODUCTION-RELEASE-067 v1.
Approval: APPROVED by repository owner in current chat, 2026-10-06: “Hardness config và make it ready for release” and “Release all to production commit and push to main”. Earlier local all-fix/test approval remains applicable.

Authorized: prepare and validate current source/config/artifacts; fix reviewed in-scope configuration gaps; commit release application source/tests/config/documentation and push main without force; deploy verified production candidate only after required security/data-protection/release gates pass. No repository security-gate exemption is implied.

Preserved constraints: no real-money tests, customer email/dispatch, financial corrections, destructive data operations or secret exposure. AI/email/payment/scheduled effects held pending provider/operational acceptance. Local tests never certify live auth/provider/backup. Preserve unrelated shared WIP and active emulators. Local runtime artifacts/browser profiles/output/credentials are excluded from commits.

Concrete scope: new read-only local release preflight and pure public configuration validation/tests, current source inventory59 not historical46, compile-time provider-effect holds before side effects, source/artifact hash coupling, immutable candidate validation and operator release/readback checklist. Existing source modifications use independently reviewed exact leases. Missing AppCheck public key is input-dependent; no weakened enforcement or fabricated key.

Fresh read-only production inventory2026-10-06: billingenabledtrue, Googleenabled/clientconfiguredtrue, zero deployedFunctions. Other actualOAuth/MFA/AppCheck/OWNER/merchant/SMTP/model/monitoring/restore gates not verified. Main remote heads absent on authenticated ls-remote; creation of main allowed by explicit pushmain instruction.

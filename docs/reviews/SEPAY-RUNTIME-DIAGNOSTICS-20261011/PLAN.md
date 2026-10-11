# SePay runtime diagnostics delta

Base: 579a788e25c9b3dc88d1288a2acc72f11fe0b990.
Authorization: human explicitly approved production blocker fixes, review, test, merge and release automatically in this task. This bounded diagnostic repair is necessary to resolve an observed genuine sandbox reconciliation 503. No further authentication or secret access is authorized by this document.

Intelligence: DEGRADED stale CodeGraph/CocoIndex; critical paths verified in purchase-sepay.ts, payments/sepay-sandbox.ts, domain/purchase-sepay.ts and existing tests. Official SePay sandbox/detail API documentation matches current host, path and authorization contract. No confirmed settlement defect yet.

Observed: synthetic checkout reached SePay sandbox, simulated payment redirected successfully; authenticated webhook bound provider order metadata. Checkout remains unknown, reconcile returns unavailable. Current catches conceal all transport/domain failures and cannot distinguish provider response failure from invalid proof.

Plan: add bounded internal diagnostic codes to existing adapter and callable error paths; log only allowlisted failure codes, numeric HTTP status, boolean JSON content type, and capped schema issue counts plus allowlisted schema field names (unknown keys become other; numeric indexes become *). Never log raw exceptions, payloads, provider URLs, IDs, headers, credentials, recipient data or prompts. Preserve customer error text, all payment proof/ownership/environment/MFA/transaction gates and unknown outcome. No dependencies, API, UI, database schema or infrastructure changes. Test adversarial raw errors and transport failure diagnostics; typecheck and focused lint/unit, independent review, CI and immutable artifact release. Then retry reconciliation of the same synthetic checkout to diagnose/fix the actual blocker; never create duplicate payment or mark paid from redirect.

Risk: internal observability only; medium due payment boundary. Rollback: previous immutable release, leaving unknown sandbox outcome intact. Product language unchanged.

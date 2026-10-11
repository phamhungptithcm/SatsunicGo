# Private SePay ambiguity diagnostic

Approval: human production autofix/review authority in this conversation. No additional financial or secret authority inferred.

Repository intelligence: DEGRADED; indexes stale. Verified exact production c6ff6b39 source, callable, verifier, inbox retry guard and focused tests directly. Shared context map/build docs are placeholders. No nested AGENTS.

Observed: v0.15.4 same synthetic checkout reconciles with SEPAY_AMBIGUOUS_PAYMENT, not HTTP404. Authenticated ORDER_PAID/PAYMENT/APPROVED inbox exhausted five attempts before invoice repair (RETRY_LIMIT). Current diagnostic cannot distinguish zero eligible transactions from multiple.

Smallest change: split private fixed error codes for zero and multiple eligible payments; allowlist these fixed codes in the existing private logger. Keep the generic customer response and every admission, binding, amount, transaction, lease, retry and settlement rule unchanged. No raw payload/IDs/counts/PII, API/UI/schema/dependency/CI/config changes. No datafix or retry reset.

Validation: executable unit cases for zero/multiple and private-code redaction, existing payment verifier regression, backend TypeScript and targeted lint; independent review, exact CI and immutable native artifact before hosted readback. New diagnostics identify the next evidence-backed correction; this patch alone is not settlement readiness.

# Scoped diagnostics review

Base 579a788e; final three-source-file diff SHA256 0b9e7d3443e314860aee1c0463aa374a92330040bb35fd686fde5801b804edc2 independently reviewed and approved. Plan authorization: production blocker repair approved by human in this task.

Requirement: fixed internal codes distinguish transport stages and invalid proof without changing settlement. Security: no raw exceptions, credentials, provider payloads, recipient values, order identifiers or arbitrary schema keys logged. Unknown schema keys become other; indexes become *; ten issues maximum, issue count capped100. Correctness/failure paths: same timeout, response-size cap, TLS host/redirect restrictions, proof binding, leases, masked customer errors and unknown outcome. Product language not applicable: no visible content/UX change. Performance: bounded extra metadata only on failures; no new calls/retries. Production: needs normal CI/artifact/deployment followed by same-checkout diagnosis, not completion of payment blocker.

Primary tests:108/108 two files. Independent focused purchase SePay95/95. Fresh backend TypeScript compiler and focused ESLint both passed against the final schema-path diff. Initial test spy fixture could not redefine CJS logger export; corrected to isolated Vitest mock, no production code/control weakening.

No source findings remain in this diagnostics scope. Overall production completion remains BLOCKED pending underlying sandbox reconciliation cause, final hosted UX acceptance and human fresh MFA for shipping publication/AI customer promotion. Token usage/cost unavailable. Memory candidates: None.

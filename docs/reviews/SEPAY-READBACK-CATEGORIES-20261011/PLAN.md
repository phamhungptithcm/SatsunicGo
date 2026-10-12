# Fixed private readback categories

Authority: human authorized automatic in-scope production fixes/review; independent reviewer recommends bounded private diagnostics after hosted reproduction. Existing source and official contract do not justify accepting dashboard labels or changing proof semantics.

Change-impact: existing zero-eligible-payment throw is split into empty transactions, absent PAYMENT, absent APPROVED and unmatched authenticated notice. All cases still throw; no status normalization, financial writes, retries, identity/count/raw-status logging, public text, permissions or dependency changes. Add only exact fixed codes to existing logger allowlist. Preserve binding checks, multiple-proof rejection, amount/time/auth/idempotency guards. Test each category and suffix-redaction; focused units/TSC/lint and independent review before merge, exact CI/artifact before hosted check. Rollback returns to previous diagnostic only, with same refusal.

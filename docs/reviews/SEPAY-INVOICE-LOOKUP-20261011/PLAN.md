# SePay immutable invoice lookup correction

Authority: human explicitly authorized auto-fix/review/test production AI and sandbox until complete, including merging all MRs. This narrowly repairs current approved sandbox flow; no new financial operation, auth grant or settlement datafix.

Intelligence: DEGRADED (both indexes stale at ea187228); bounded source, official SDK, compiler/tests. Hosted v0.15.3 same-checkout readback returns404 JSON, not timeout. Official Node SDK retrieve(order_invoice_number) and its installed implementation use invoice in order/detail URL; current reconciliation passes provider order_id. REST prose conflicts, so hosted confirmation remains required.

Plan: purchase-sepay.ts reconciliation passes existing immutable intent.invoice. payments/sepay-sandbox.ts names argument invoice and admits only existing sepayInvoiceSchema before constructing same fixed HTTPS sandbox URL. No alternate identifier/host fallback. Existing verifier must still bind returned invoice, provider order ID, internal ID, amount/currency/transaction/provenance. Preserve pre-IPN deferred admission, leases, retry/unknown, no callback-only settlement, financial guards, auth/AppCheck and secret confidentiality.

Tests: update transport regression to expect invoice URL; reject provider ID/path traversal before transport; retain non-OK/content-type/size/JSON/network redaction tests. Rules fixture asserts all real reconcile readbacks receive immutable invoice, proving caller wiring. Run focused unit, backend TSC/lint, independently review full diff, CI including Rules, original immutable artifact and native provider receipt, then reconcile SAME existing sandbox checkout; no second payment or real-money test.

Files: functions/src/purchase-sepay.ts; functions/src/payments/sepay-sandbox.ts; tests/unit/purchase-sepay.test.ts; tests/rules/purchase-sepay.test.ts; this review folder. No UI, deps, config, CI, schema or migration change. Rollback source revert through existing reviewed release; never edit settled financial data.

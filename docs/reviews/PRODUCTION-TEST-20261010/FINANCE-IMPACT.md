# Production test finance and fulfillment boundary

Approved scope: PRODUCTION-TEST v1, call_5081fd46f74546c08b78d7a095730a9a item0. Base608d2e0. Shared repository intelligence brief is DEGRADED; protected edits await refreshed READY under current developer requirement.

Observed: purchase-settlement writes financialEntries, collected balances, orders, receipts, outbox and timeline in one transaction. No checkout catalog stock decrement/reservation writer was found in the bounded checkout/settlement trace. Existing testMode tags do not prevent analytics or staff actions.

Implementation boundary:
- purchase-settlement.ts: validate pinned production-test provenance, route test financial entries to purchaseTestFinancialEntries, preserve provenance in orders/receipts/proofs/outbox/audit/jobs; reject mixed balance targets before mutating them. No external I/O inside transactions.
- purchase-adjustment.ts: allow authenticated test sourcing proposal/approval, preserve provenance; no real financial ledger effects.
- finance-review.ts and refunds.ts: reject test records from real finance/refund operations before writes.
- purchase-test-boundary.ts (new): centralized legacy/current test classification, validated provenance and real-operation fence.
- analytics-worker.ts: exclude test orders and entries from enqueue and source application; no test revenue in aggregate.
- order-history.ts: read the corresponding test ledger for test orders while preserving owner/staff checks.
- shipping.ts, consolidation.ts, changes.ts and returns.ts: reject test orders from physical/financial operations before writes.
- crm.ts: exclude test records from live operational aggregate; UI agent owns customer order projection in the same file.
- index.ts: release agent owns file, receives a guard hunk for command actions; no concurrent edits here.

Compatibility: real records with no test provenance retain current behavior. Unknown/partial provenance fails closed. Legacy sepay_sandbox/testMode records remain test-classified and cannot gain live authority. No data migration or relabeling of existing records, no fixture or production database writes. New test collection is backend-only; existing catch-all rules deny client writes.

Validation: focused in-memory transaction handler tests for actual settlement, mixed-target rejection, every real-operation fence, isolated history and analytics; strict compiler and focused lint. Provider/live acceptance remains separate.

Rollback: disable new test admissions and sending first; preserve pinned attempts, proof, test ledger, audit and idempotency history. Never copy test ledger to live or reinterpret sandbox proof as money.

## Approved bounded consumer addendum

Parent assigned minimal `invoices.ts` isolation under v1 after source trace found generic draft/issue/share/email could convert a sandbox order into an unmarked sales document and consume real statement numbering. Guard source orders at draft/refresh; re-read and guard source plus document before issue, numbering, share/email or other document mutations. Keep test purchase PDFs separate; do not implement a second invoice system. Existing valid real invoice flow and auth/MFA retained. Missing source fails closed rather than issuing/share/email without authoritative provenance. Add actual handler negatives asserting zero document/counter/outbox/share writes and positive real behavior.

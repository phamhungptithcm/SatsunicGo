# Backend023 bounded impact plan

Approval: human-approved local hardening scope in ../TEAM_CONTEXT.md. Shared checkout WIP preserved. Repository intelligence check on 2026-10-05: DEGRADED (CodeGraph stale; CocoIndex stale and daemon permission failure). Source is authority; no completeness claim.

Confirmed source defect candidates to reproduce before fixing:
1. email.ts accepts an invoiceIssued outbox job with empty/nested documentId, then passes it to db.doc after claiming. Invalid Firestore document path throws outside per-message SMTP catch; worker exits and later queued jobs are not processed. Small fix: validate invoice document IDs before claim, mark blocked_document using existing state. No new public text/contract.
2. SMTP timeout sets unknown without reconciliationRequired whereas abandoned claims set it true. Unknown cannot currently retry, but persisted reconciliation metadata is inconsistent. Set flag true in same failure transition; never automatically retry.

Files: functions/src/email.ts; tests/unit/email-delivery-security.test.ts; private backend reports. Tests use mocked Firestore/Auth/SMTP, no providers/services/secrets. No compile/install/integration window. Risk: low local validation, no financial writes or auth changes; unknown outcomes remain fail closed. Existing claim/version and late-outcome logic preserved. Runtime/provider acceptance remains NOT_READY.

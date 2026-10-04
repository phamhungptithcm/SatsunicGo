# Operations runbook

Use LOCAL_RUNBOOK.md for executable local commands and provider state. Source is IN_PROGRESS; do not run this against real business data as a release procedure.

Inspect bounded staff queues; reload on version conflict. Confirm bank statements and unique references before verifying pending transfers. Preserve evidence/reasons for corrections. Review holds, actual per-line purchase/receipt quantities, package allocations, final freight and customer approvals before dispatch. Batch dispatch checks every included order; partial parcel delivery does not complete remaining parcels.

On uncertain payment link creation or callback allocation, preserve intent and reconcile through authenticated provider readback; never create another charge blindly. Email unknown outcomes require reconciliation rather than automatic resend. Exceptions/dead-letter operational resolution UI and complete refund/reversal workflow remain open.

Maintenance is bounded: scheduled publication, membership expiry, notification delivery and separately approved technical quota cleanup. SMTP requires enabled validated settings; marketing requires current consent. Customer export/delete requests go to support for authorized handling under approved policy.

Backup Firestore and Storage separately. npm run test:restore proves isolated fixture import only. Production schedule, retention, access control, recovery-time/recovery-point targets, monitoring and restore rehearsal are NOT_RUN. Do not start payment/email jobs during restore. No production datafix, refund or destructive restore is authorized here.

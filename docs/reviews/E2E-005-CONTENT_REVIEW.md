# Product Content Review — E2E-005

Status: BLOCKED. This is source and historical browser evidence, not acceptance of the complete current candidate.

Scope: Vietnamese web CRM, staff workspace, order actions/history, returns, refund requests, manual financial review, private order images, operational details and private account restoration. Audience: customers and authorized operations staff. Primary job: follow a customer/order and record the next real action with minimal setup. Reviewer: Codex, 2026-10-04. Apple HIG is not the platform contract for this web application; platform fit requires web keyboard, responsive layout, focus and accessible names.

Verified facts: CRM data persists via authorized callables; appointment seconds survive an unchanged local-minute edit; role-filtered work queues use pagination; physical returns never silently refund money; refund reservations reduce available funds; reversals append ledger entries; exception allocation only accepts verified inbound payment evidence. New source uses loading/error/empty states separately, immutable retry payloads and current-account/current-order component identities. Historical browser evidence is in docs/reviews/e2e005, including 320/390/768/1440 widths and menu Escape/focus behavior. Those images predate the final financial and identity fixes.

Unknowns: current rendered financial, media, membership/CMS integration, Ask streaming, provider faults and all master acceptance scenarios. Coordinating root owns the resumed browser review after user restored access. This session does not bypass another session's browser policy.

## Inventory and state coverage

| Surface | Strings/states under review | Meaning/source | Current in-context evidence |
| --- | --- | --- | --- |
| Workspace/CRM | Module titles, customers, follow-up period/assignee filters, search, loading, no result, forbidden, retry, pagination | CRM/current staff access; capped pages must not imply complete totals | Historical CRM browser; final state NOT_RUN |
| Customer | Notes, tags, responsible staff, appointment, saving/saved/error/retry, related orders/tickets, more results | Current customer record/version; local timezone, saved epoch | Historical persisted browser edit; current NOT_RUN |
| Orders/operations | Queue labels, exact order lookup, purchase/receive/pack, shelf/condition/weight/dimensions, waiting/error | Authorized workflow and private operations projection | Source and server checks; rendered NOT_RUN |
| Returns | Receive, inspect, close, quantities, remaining, saving/error/retry | Authorized physical-return quantities; closing does not release money/hold | Server regression; rendered NOT_RUN |
| Refunds | Request, cancel, pending/confirmed/cancelled, amount, bank reference, beneficiary, retry | Reserved VND amount; bank-confirmed refund is separate from request | Historical queue only; final form NOT_RUN |
| Financial review | Reverse payment, original entry, amount, bank proof, reason; allocate/close exception, loading/error/retry | Append-only reversal; verified inbound exception; closing does not move money | Server regressions; rendered NOT_RUN |
| Private images | Category, choose/upload, size/type error, loading/empty/open/close, retry | Authenticated PNG/JPEG/WebP bytes, 2 MB/20-order limit; no public download token | Storage tests; rendered NOT_RUN |
| Account/support | Restore pending, forbidden, reply loading/empty/error, sending/retry | Current UID/ticket; no previous account or stale ticket reply display | Typecheck/source; rendered NOT_RUN |

Full changed-string in-context inventory remains incomplete; this document explicitly blocks the language gate rather than treating a string-file review as acceptance.

Data semantics: VND amounts use integer backend values. Null/unavailable/loading/error are distinct from zero/empty. Dates are local UI display from epoch values; query cutoff remains stable through pagination. Financial source of truth is the immutable ledger, order balances and reservations. Private details are limited by current roles, ownership, buyer assignment and verified Google identity. Client data is not an authorization boundary.

## Mandatory principles

| Principle | Status | Evidence or missing check |
| --- | --- | --- |
| Purpose | NOT_RUN | Source jobs clear; current full rendered flow pending |
| Agency | NOT_RUN | Explicit actions/cancel/retry present; final controls/focus pending |
| Responsibility | NOT_RUN | Money/physical-state separation tested; all current copy pending |
| Familiarity | NOT_RUN | Vietnamese vocabulary and native web dialogs; final context pending |
| Flexibility | NOT_RUN | Responsive/filter/pagination source; all role/device flows pending |
| Simplicity | NOT_RUN | CRM linked work and dedicated queues; final action count pending |
| Craft | NOT_RUN | Historical widths/focus pass; final candidate/motion pending |
| Delight | NOT_RUN | Saved feedback and durable retry source; final timing pending |

Required follow-up: root's current browser acceptance, complete string/state inventory, all eight current in-context principle decisions, then fresh final review. No production claim.

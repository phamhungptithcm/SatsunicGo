# Current hardening scenarios

| Scope | Happy case | Bad/race case | Evidence |
|---|---|---|---|
| CRM notes | Normal create/update, last safe increment, completed replay | Missing stored version, exhausted version: reject without replacing notes/operation/audit | crm-before.json, hardening-after.json |
| Private images | Current owner and mixed allowed role grants, upload/read replay | Truthy inactive, malformed roles, substring BUYER assignment reject before storage | media-before.json, media-after.json |
| Returns/consolidation | Authorized fully inspected close and valid packed batch seal/replay | Invalid active/roles reject with unchanged order/return/parcel/batch | auth-before.json, hardening-after.json |
| Staff queue/command | Exact BUYER array assignment, valid claim and replay | Truthy active, malformed roles, substring/object assignments deny/no mutation | workspace-before.json, command-before-corrected.json, command-after.json |
| Cancellation/payment | Paid cancellation rejects, checkout identity replay intact | Same-version cancel/payment race exactly1winner, new collection aftercancel denies, late callback quarantines once | biz-before.json, hardening-after.json |
| CRM navigation | SPA customer/follow-up views each load correct list, filter reset | Deferred committed reconciliation response cannot reload obsolete kind | ui-before.json, ui-after-round1.json |
| Support recent window | Native submitted ticket remains first with >30 old own tickets | Foreign future ticket never visible; bounded30 and recentheading truthful | support-before.json, support-after.json |
| Ask identity restoration | Held actual Auth lookup defers Ask until account is ready; usable composer remains stable | No transient anonymous launcher/dialog during restored identity; real two-step resume and lost-response checkout preserves one order | auth-ui-before.json, ask-contract-repeat.json, final full50 receipt |
| Cancelled transfer error | Native existing Workbench action responds with clear rejection | Stored order and zero financial entries unchanged | finance-ui-after.json, cancelled-transfer-error.png |

Complete browser regression covers catalog checkout/reload retries, custom2payments lifecycle, proposal acceptance/rejection, private image role restrictions, CRM roles, document immutability/retries/printing, responsive layout/keyboard/native200% zoom and deferred requests. All currently configured native cases will be rerun on final source; do not equate this inventory with exhaustive production acceptance.

NOT_RUN: live Google/MFA/AppCheck/provider/signature/bank/email/model, production backup/restore/rollback/deploy, actual screen reader, comprehensive load/frame profiling. Legacy standalone HTTP/restore entry points require separate dedicated ports and are not restarted over shared services. Audit metadata external upload pending authorization after automatic rejection.

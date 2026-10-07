# Release026 fresh source cross-check

2026-10-05. Readonly database specialist handoff. Original STAFF_SECURITY_MAP.md remains historical before-patch evidence. Exact current SHA256 values are in STAFF_SECURITY_FINAL_HASHES.json (36 files including all functions/src TypeScript, conversation domain helper, App/SiteChrome/helper, rules and indexes). Concurrent work can stale this snapshot. Repository intelligence remains DEGRADED; bounded direct source inspection used. No source/rules/index edits or runners.

## Known findings after source changes

| Previously identified boundary | Current source evidence | Source result |
| --- | --- | --- |
| changeCommand | changes.ts:71-75 strict active, roles array before some | Known malformed-active/roles clause addressed |
| uploadContentImage | media.ts:45-51 strict active, roles array, both locks in shared authorization helper | Known clause addressed |
| outboxCommand | outbox-command.ts:45-51 strict active, roles array, both locks | Known clause addressed |
| refundCommand | refunds.ts:52-58 strict active, roles array, both locks | Known clause addressed |
| financeReview | finance-review.ts:72-78 strict active, roles array, both locks | Known clause addressed |
| invoiceCommand | invoices.ts:64-68 strict active, roles array before some, both locks | Known clause addressed |
| invoiceList | invoices.ts:303-310 locks and strict active/roles array for privileged scope; canIssue/canConfigure short-circuit behind staff at 323-329 | Known clause addressed; customer scope retained |
| invoiceDetail | invoices.ts:348-358 strict active, roles array and locks before privileged branch | Known clause addressed |
| orderHistory | order-history.ts:30-38 locks and strict active/roles array before privileged branch | Known clause addressed; owner branch retained |
| membershipCommand | membership.ts:100-118 locks; strict active/roles array projection before grant includes and confirm some | String-role substring grant addressed; customer actions retained |
| shippingCommand | shipping.ts:57-65 strict active and roles array before allowed role includes; both locks | String-role substring clause addressed |
| Conversation read/command/assignee helper | packages/domain/order-conversation.ts:45-52 strict active, roles array; BUYER orderIds array before exact includes | Known malformed-active/roles/assignment clauses addressed |
| workspaceCommand | workspace.ts:305-312 locks and strict active/roles array projection | Known clause addressed |
| readOwnerConfiguration/readStaffAccess | workspace.ts:692-696,779-783 strict active, array before OWNER includes, both locks | Known clauses addressed |
| readOrderOperations | workspace.ts:817-828 roles array projection, BUYER assignment array, strict active and both locks | Known clauses addressed |
| ticketMessages | workspace.ts:730-739 owner-or-staff branch, strict active/roles array for staff, both locks | Known clause addressed |
| App/SiteChrome | App.tsx:1118; SiteChrome.tsx:203 use src/shared/staff-access.ts | Helper rejects nonboolean active, truthy locked, nonarray roles and nonstring elements; exact role semantics and runtime navigation remain separately verified by root |

Full functions/src active/roles/orderIds scan found no recurrence of the originally identified raw stored-staff predicates in this snapshot. workspace staffGrant's truthy own.active check follows a Zod boolean/roles-string-array parse (workspace.ts:518-524), so it is not the same unchecked Firestore predicate. Membership lifecycle active variables and subscription active queries are domain state, not staff authority.

## Remaining evidence limits and risks

- Runtime: NOT RUN by this specialist. Root-reported initial/private/mutation/conversation receipts are coordination context, not independently inspected receipts. REM25 post-patch result was pending at assignment; no final aggregate or complete action coverage inferred.
- Action-level authorization, revoked idempotent replay, version/conflict handling, all role combinations, member purchase behavior, assignment changes and no-write/no-I/O failure assertions remain dependent on root/backend test receipts. Array guards stop string substring behavior; they do not independently validate every stored array element or certify every permission rule.
- Provider/production: Google/MFA/AppCheck enforcement, Storage side effects, mail delivery, payOS signature/reconciliation/accounting behavior, scheduled IAM, deployment and rollback/restore NOT TESTED here.
- Indexes: hashes identify local index/rules files only. Deployed composite-index availability, rules rollout and live query behavior UNKNOWN. Stale CodeGraph/CocoIndex do not establish final blast radius.
- Lock parity: readNotification (jobs.ts:246-280) still checks notification owner/user lock but does not read staffAccess.locked. Whether that lock is global for customer notification marking remains a policy decision; do not claim an authorization exploit or impose staff activation on customers from this observation.
- UI helper checks staff access lock; actual user-lock route behavior and all caller paths require separate UI/runtime evidence. Empty/unknown string roles behavior is not automatically a private authorization grant.

Conclusion: known source-clause defects are addressed in this snapshot. Runtime/local whole-system readiness UNKNOWN; production NOT_READY. No successful final implementation certification issued by database. Memory candidates: None. Token/cost totals unavailable to this specialist.

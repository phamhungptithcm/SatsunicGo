# Release026 stored staff authority map

Scope: readonly database specialist source inspection, 2026-10-05. Shared checkout is changing concurrently. Historical READONLY.md and HASH_SNAPSHOT.json remain frozen. Repository intelligence is DEGRADED: stale CodeGraph and stale/unhealthy CocoIndex; direct bounded source fallback. No code, rules, indexes, data or runtime runners changed here.

This maps all exported Firebase entry points found under functions/src to their stored-staff authority boundary. It is not a complete security audit or runtime certification. Malformed-record findings require corrupted/admin-created staffAccess data; client writes to that collection are restricted. TypeScript annotations do not validate Firestore data.

## Remaining source findings at snapshot

| Entry point | Evidence | Concrete consequence to verify |
| --- | --- | --- |
| changeCommand | changes.ts:62-76 | Staff propose/apply uses truthy active and unchecked roles.some; nonboolean truthy active with valid privileged roles passes. Customer accept/reject retains owner branch. |
| uploadContentImage | media.ts:41-50 | Content upload authorization uses truthy active and unchecked roles.some, including reauthorization helper. Deny malformed authority before Storage I/O. |
| outboxCommand | outbox-command.ts:45-52 | Privileged job changes accept truthy active; roles unchecked. Production MFA is an additional independent gate. |
| refundCommand | refunds.ts:52-62 | Refund mutations accept truthy active; unchecked roles.some. Preserve production MFA, reservation and replay checks. |
| financeReview | finance-review.ts:72-82 | Financial review accepts truthy active; unchecked roles.some; MFA remains separate. |
| invoiceCommand | invoices.ts:62-78 | Money/admin mutations use truthy active and unchecked roles.some. Configuration also requires OWNER. |
| invoiceList | invoices.ts:302-327 | Truthy active can select privileged list scope and internal seller configuration; malformed roles can throw. |
| invoiceDetail | invoices.ts:346-355 | Truthy active with canonical privileged roles can read another customer's document, including draft. Preserve legitimate customer ownership/non-draft path. |
| orderHistory | order-history.ts:30-41 | Truthy active privileged branch can return another customer's order, timeline and financial entries. |
| membershipCommand | membership.ts:100-121 | Grant uses raw roles.includes(OWNER); string NOT_OWNER matches substring. Confirmation uses unchecked roles.some. Preserve legitimate customer purchase behavior and MFA. |
| shippingCommand | shipping.ts:57-64 | Truthy active and raw roles.includes: string NOT_OWNER can satisfy OWNER. Parcel action privilege differs for trackParcel versus warehouse actions. |
| readOrderConversation, orderConversationCommand | packages/domain/order-conversation.ts:41-51; functions/src/order-conversation.ts:28,103,121,176,214 | Shared helper uses truthy active, unchecked roles.some/includes and BUYER orderIds.includes without array validation. String assignments can substring-match another order; affects private/internal access and assignee eligibility. Customer owner acts as customer even if also staff. |

Unchecked roles.some on a string generally throws rather than grants access; distinguish this failure path from truthy-active grants and string includes substring grants. No exploit was executed by this specialist.

## Other staff-authorized entry points

| Entry points | Source classification |
| --- | --- |
| command | index.ts:62-74 strict active === true plus roles array; BUYER assignment array checked at 115-116; user/staff locks. Per-action authorization and replay ordering remain separate obligations. |
| uploadOrderImage, listOrderImages, readOrderImage | order-media.ts:30-38,68-69 strict active/roles/assignment arrays, locks; role-kind union preserved. |
| returnCommand | returns.ts:54-58 strict active/roles array and locks. |
| consolidationCommand | consolidation.ts:62-66 strict active/roles array and locks. |
| listCustomers, listFollowUps, listCrmStaff, readCustomer, saveCustomerNotes, operationalDashboard | crm.ts shared authorize:203-206; assignee:371-374; dashboard:436-439 strict active/roles array and locks. Staff choices additionally use boolean-active query. |
| membershipReminderPolicy | membership-reminder-policy.ts:51-55 strict active/roles array and locks; save also requires recent MFA. |
| listWork | workspace.ts:31-34 strict active/roles array and locks; BUYER assignments array at 131. |
| ticketMessages | workspace.ts:728-737 owner-or-staff branch; staff branch now strict active/roles array, user/staff locks. Backend owns current patch and runtime evidence. |
| workspaceCommand, readOwnerConfiguration, readStaffAccess, readOrderOperations | Backend-owned active hardening. Snapshot previously had raw/truthy predicates at workspace.ts:310-311,691-694,777-780,814-821. Current final state and runtime proof UNKNOWN until backend handoff; do not certify earlier inspection as final. |

## Independent trust boundaries; active-staff predicate not applicable

| Entry points | Boundary and coverage limit |
| --- | --- |
| catalogCheckout | Authenticated customer UID and lock checks; staff activation must not be required for customer purchase. |
| ask, askWorkflow, currentAskConversation | Verified customer session, owner-scoped private conversation/order access and locks. Model/tool boundaries separate from staff authorization; no financial/role authority should be conferred by AI. |
| createPaymentLink | Verified customer owner, payment intent and lock checks. Actual provider behavior NOT TESTED here. |
| readNotification | jobs.ts:246-280 verified session, notification owner and user lock; does not read staff lock. Policy parity with other customer handlers needs root decision, not an inferred staff-role restriction. |
| invoiceShare | Bearer token SHA256 lookup, issued document/share epoch/expiry, quota and owner/user-staff locks. Callable is intentionally unauthenticated bearer access, not HTTP onRequest. Staff roles N/A; runtime/token-abuse verification NOT RUN here. |
| publicPage, publicDiscovery, publicImage | Published public-content boundary, not private staff authorization. Complete publication/XSS/cache verification UNKNOWN in this source-predicate pass. |
| payosWebhook | POST plus SDK webhook verification and payment application; provider signature, replay and accounting integration proof NOT RUN here. |
| reconcilePayments, maintenance, deliverEmail | Scheduled service authority. No caller staff role. IAM, scheduler delivery, external email/provider and production runtime UNKNOWN in this pass. |

Support-only source modules (auth/guards, email-content, ai/product-images, ai/telemetry-policy, ai/knowledge-retrieval) expose no additional Firebase entry points. requireVerifiedGoogle checks email_verified === true and actual google.com sign-in provider; recentMfa checks finite integer session time and second factor. These are independent controls, not substitutes for stored staff validation.

## Validation handoff

Root/backend received the remaining source findings before this document. Root serializes runners. Recommended focused regressions: active false/string/number; roles missing/string/object; BUYER assignment string/object; exact legitimate role and assignment; locked user/staff; role revocation before same-operation replay; owner-customer happy path. Assert permission-denied and no privileged write/Storage/provider I/O for malformed authority. Keep production MFA/AppCheck unchanged.

Runtime results for this extension: NOT RUN. Final candidate review: UNKNOWN pending root/backend changes and fresh verification. Production: NOT_READY. Memory candidates: None.

# Customer email / notification subscription sync receipt

Date: 2026-10-09. Scope: read-only contract reconciliation and focused tests; no production-code changes, provider activation or sending.

Human coordination request verified in `Define customer notifications`, thread 01a12102-d68a-7fb2-864d-d02df0c7d127, user turn 01a1214a-fb79-7341-89cc-4d7775d927b1: asks whether main notification flows have been integrated and synced with the notification chat for use. This receipt responds to the handoff from that thread; it does not grant new activation authority.

## Shared contract confirmed from current source

- Checkout and profile use the `notificationPreferences` callable and canonical packages/domain/notification-preferences.ts schema. Three independent topics: orderEmail, promotionsEmail, orderSms. Requested is not confirmed; only matching current generation is active.
- `prepareCustomerEmail` reads the same notificationPreferences owner record and calls optionalOrderNotificationAllowed using current verified Auth email. `email.ts` repeats emailPreferenceAllowed immediately before provider I/O. Missing, malformed, pending, revoked or changed-destination consent fails closed for optional order messages. Promotions consent cannot substitute.
- Financial/action-required/document and existing membership-service policy remains separately classified. This is intentional, not a second source of optional consent.
- `deliverEmail` consumes outboxJobs and renders typed customer event templates. Inbox projection consumes the same immutable event/snapshot hash; the inbox projector does not perform SMTP I/O.
- `deliverSubscriptionEmail` consumes notificationEmailJobs only, rendering subscriptionContent confirm/welcome messages. Both workers use SMTP but their queue collections and job purposes do not overlap. No duplicate dispatcher for the same job was identified in the inspected paths; this is source/test evidence, not a real-provider exactly-once claim. Claims fence concurrency; unknown outcomes require reconciliation.
- Subscription confirm/welcome templates are separate from the 42-event catalog and do not yet reuse its v2 layout/renderer. Do not count them in 42/42 coverage or assume design unification. No renderer rewrite is required to share consent; any further visual unification should be an explicitly scoped change.
- Existing releaseCapabilityAllowed("email") hold remains unchanged. Subscription sending additionally needs settings/email.subscriptionsEnabled. Customer-event sending also retains approved policy/cutover. Consent alone does not activate external sending or drain historical backlog.

## Gaps deliberately retained

SMS: schema, confirmation/welcome text, generation/opt-out lifecycle, provider-neutral SubscriptionSender and orderSms policy helper are prepared. Availability is false; there is no live SMS provider, scheduled SMS sender or business-order SMS dispatcher. Provider adapter, event/dispatcher wiring, sender approval, delivery receipts and actual handset acceptance remain future activation work.

Full authenticated browser → shared callable → provider acceptance/delivery has not been certified. Production retention/export/deletion coverage and activation gates remain open as described in INTEGRATION.md. No shared runtime was rebuilt/restarted for this sync. No other task's owned implementation file was modified.

## Current verification

- CodeGraph then CocoIndex queried. CocoIndex returned a previous version of notification-order-policy; DEGRADED coverage retained. Canonical source inspected for critical claims.
- Notification implementation source manifest: 24/24 recorded files unchanged from prior reviewed snapshot at the time of reconciliation.
- Fresh focused joint check: `npx vitest run tests/unit/customer-emails.test.ts tests/unit/email-content.test.ts tests/unit/email-delivery-security.test.ts tests/unit/notification-subscriptions.test.ts tests/unit/notification-endpoint.test.ts` — **106 tests, 5 files PASSED**, exit 0.
- The other chat's reported 309 unit / 15 emulator assertions are its snapshot evidence, not rerun or reattributed here.
- Prior subscription-specific real Firestore emulator test remains separate evidence; not rerun because no relevant source changed in this read-only sync.

Decision: shared consent contract confirmed locally; no same-job sender duplication found within inspected paths and executed checks. Production readiness remains NOT_READY / NOT_ACTIVATED. Memory candidates: None. Token usage and billed cost: Unavailable.

## Coordination delivery status

NOT_SENT / BLOCKED: the attempt to send the reconciliation result to `Define customer notifications` was rejected by automatic approval review. Its reason: the human asked whether synchronization existed, which was not explicit permission to send a follow-up message to another chat. No workaround or second send attempt was made. This receipt exists locally; sharing it through the thread messaging tool requires direct human authorization. This delivery limitation does not change the source/test verification above.

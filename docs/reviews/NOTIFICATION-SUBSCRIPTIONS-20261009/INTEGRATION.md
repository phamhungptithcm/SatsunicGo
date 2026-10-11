# Notification subscriptions — integration boundary

User-approved local scope: r5 source-screen design; SMS has no provider and is prepared only. No production release or sending authorization.

- Callable `notificationPreferences`: owner-authenticated `read`, `save`, `resend`; token-only `confirm`, `unsubscribe`. Owner is derived from verified Google auth and current Firebase Auth email. App Check follows the repository's emulator/production convention.
- Three independent topics: `orderEmail`, `promotionsEmail`, `orderSms`. Checkout bundles the two email topics in one native checkbox; profile manages each separately. Delivery recipient phone is never silently used as subscriber phone.
- Selection is saved independently after successful checkout preview, without changing checkout commit/payment transactions. Save failures surface outside the recipient panel and never cancel an order. Profile saving retains existing legacy marketing consent when editing a name.
- Requested is not confirmed. Changing destination or disabling a topic increments its generation; old links cannot reactivate it. Current verified email is checked again before delivery and confirmation. Confirmation tokens are random 256-bit values, stored only as SHA-256 hashes, expiring after 24h. Revocation links expire after 90 days. Fragments are removed from the browser URL when captured; explicit button interaction handles email-scanner visits safely.
- Per-owner/per-destination quotas limit confirmations. Operations are idempotent; concurrent saves use expected versions. Unknown provider outcomes require reconciliation and are never blindly retried. Historical confirmation jobs expire after 24h; welcome jobs after 7d.
- `deliverSubscriptionEmail` reuses SMTP settings/secret conventions and the existing `releaseCapabilityAllowed("email")` hold, plus `settings/email.subscriptionsEnabled === true`. No secret was read or created. The hold remains closed.
- `prepareCustomerEmail` and the existing email worker recheck confirmed optional-order/promotion preferences. Financial, invoice, security and action-required message policy remains intact. Existing in-app inbox behavior is preserved.
- Collections are server-only under existing deny-by-default Firestore rules: notificationPreferences, notificationPreferenceOperations, notificationConsentEvents, notificationRecipientQuotas, notificationChallenges, notificationEmailJobs, notificationSmsJobs. No client collection grants were added. Preferences contain contact data; do not place them in logs. Audit/job records contain owner IDs, hashes, generations and technical state, not raw message tokens.

## SMS adapter follow-up

`SubscriptionSender` provides `available(channel)` and `send(channel,destination,content,idempotencyKey)` with `accepted | rejected | unknown`. SMS confirmation/welcome text and confirmed order-SMS policy are prepared. Production availability is explicitly false. There is no live SMS worker or order-SMS dispatcher; those must be wired to the selected provider after credentials, sender/Brandname approval, delivery receipts, segment pricing and reconciliation behavior are verified. Never use Firebase phone-auth SMS as a generic order-notification transport.

Before enabling any channel: approve provider/configuration and cutover; configure retention and account-data export/deletion coverage for the new collections; verify indexes/TTL requirements; run authenticated callable/browser-to-emulator tests with the rebuilt shared Functions runtime; verify provider acceptance and handset/inbox delivery separately. No migration automatically turns historical consent into current confirmed consent.

## Rollback

Keep external release hold and subscriptionsEnabled closed; roll back the additive UI/functions changes. Preserve server consent/audit records for an owner-reviewed retention action rather than deleting them autonomously. Do not replay unknown delivery jobs. Rollback does not affect payment totals, allocations or checkout commits.

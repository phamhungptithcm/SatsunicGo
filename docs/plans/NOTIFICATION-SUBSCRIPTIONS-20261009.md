# Email/SMS subscriptions — proposed scope r2

## r2 presentation delta requested by user

Remove hero, sidebar, numbered preview navigation, repeated explanations and large cards. Keep two compact checkbox rows below contact fields, three compact settings rows, short email/SMS templates. Put secondary policy details in native disclosure controls. The Continue action simulates saving only; this is not an implemented checkout.

Additional references checked: [Shopee notification settings](https://help.shopee.vn/portal/4/article/79369) documents account settings with selectable notification/email categories; [Amazon privacy notice](https://digprjsurvey.amazon.com/csad/help/node/GX7NJQ4ZB8MHFRNJ) directs customers to communication preferences. These support settings organization, not claims of exact visual parity with authenticated Shopee/Amazon checkout. No authenticated reference screenshots were inspected. The compact layout is a SatsunicGo design adaptation.

Date: 2026-10-09. Status: MOCKUP / AWAITING_IMPLEMENTATION_APPROVAL. No application, backend, rules, deployment or provider settings changed. Preview: `docs/previews/NOTIFICATION-SUBSCRIPTIONS-20261009.html`.

## Repository intelligence brief

CodeGraph queried first, CocoIndex second. Both returned useful matches. CodeGraph also matched an `output/cart107/baseline` copy; that is not authoritative. Global index freshness against the dirty worktree has not been verified: **DEGRADED** coverage. Critical facts below checked in current source. Preserve concurrent checkout, receipts, Ask, deployment and email-template WIP.

- React 19 / TypeScript 6 / Vite 8 frontend; Firebase 12 client, Cloud Functions backend, Firestore persistence; Vitest/Playwright present in package.json.
- `src/features/cart/purchase-checkout.tsx`: signed-in flow, recipient form, server preview/commit, existing recovery/idempotency. No subscription choices in the inspected form. `packages/domain/purchase-checkout.ts` recipient schema has delivery phone, no email/subscription fields.
- `src/features/profile/Profile.tsx`: profile/address persistence. `src/app/App.tsx` account `view=notifications` renders `Notifications`; `src/features/notifications/Notifications.tsx` is an owner-scoped inbox, not preference management. Reuse the inbox and add a clearly labeled settings destination; final route chosen during approved implementation.
- `functions/src/jobs.ts`: outbox → in-app notifications → email queue. `functions/src/email.ts`: verified Auth email, account lock checks, legacy `marketingConsent` guard, SMTP sender and uncertain outcome handling. These are source facts, not proof that customer email works in production.
- `functions/src/email/` also contains self-test delivery infrastructure; do not confuse self-test provider acceptance with customer subscription delivery. Reconcile adapters before selecting the customer email transport.
- `docs/reviews/CUSTOMER-EMAILS-20261009/`: existing transactional template proposal; preserve/reuse its verified event guards, do not replace its 42 templates.
- Shared frontend listener observed on 127.0.0.1:5207. No server started, restarted, or data reseeded.

## Proposed behavior and design

Exactly two unchecked checkout choices:

1. **Nhận cập nhật đơn hàng và ưu đãi qua email**. Makes two explicit email purposes visible; profile lets the customer disable either separately. A narrower future variant could separate marketing in checkout too, but that would exceed the requested two-checkbox design.
2. **Nhận cập nhật và theo dõi đơn hàng qua SMS**. Order updates only; no implied SMS marketing permission.

Both optional, neither blocks purchase. Saving records requested consent, then sends a confirmation request; active status requires confirmation. The mockup's separate save button demonstrates the consent flow only. In implementation, the existing Continue/Save action persists the consent intent without creating an extra required checkout step. A failed subscription operation does not roll back an order or payment; show its independent state and allow safe retry.

Destination: authenticated account email; a notification phone the account holder controls, verified independently from delivery contact. Never subscribe a gift recipient automatically. Existing verified account phone may be reused only with explicit channel/purpose consent; phone verification alone never means marketing consent. Changing destination cancels pending verification and re-verifies before any new delivery. Keep previously confirmed channel working when requesting additional consent purposes until those new purposes are confirmed; the prototype uses a conservative whole-email pending proxy.

Profile → Notifications: separate email order updates, email promotions and SMS order updates; show off/pending/active/failed/unavailable honestly. Save changes with version conflict protection; cancel restores last server state. Customer opt-out and one-click marketing unsubscribe revoke queued sends; in-app order history remains. Required invoices, security and action-required transactional messages must be classified explicitly rather than silently bundled with optional updates. Final classification and disclosure require owner approval.

## References checked 2026-10-09

- [Shopify checkout options](https://help.shopify.com/en/manual/checkout-settings/checkout-form-options): separate contact/marketing purposes and SMS opt-in. Adopt explicit choice; choose unchecked defaults for both channels in SatsunicGo.
- [Shopify contact collection](https://help.shopify.com/en/manual/promoting-marketing/create-marketing/customer-contact-information): confirmation/double opt-in email pattern.
- [Walmart order text messages](https://www.walmart.com/help/article/help-with-text-messages-for-online-orders/b41ba5c8bc404807aac6ef48ea476352): order texts controlled in checkout and account communication settings. Adapt that interaction; do not copy its default/processing timelines.
- [Firebase phone authentication](https://firebase.google.com/docs/auth/web/phone-auth): SMS verification for sign-in, not a general order-message API. [FCM](https://firebase.google.com/docs/cloud-messaging) is push messaging to apps/web.
- [Twilio Vietnam guidelines](https://www.twilio.com/en-us/guidelines/vn/sms): provider/country sender requirements. Provider final choice remains open. Brandname registration, templates, HTTPS link acceptance, recipient-country coverage, send/reply capabilities and actual cost must be verified before activation. Do not promise STOP reply on a one-way sender.

Visual direction: native web form controls, blue #163cff / navy #111c35, thin borders, compact surfaces. Coinbase reference used only for restrained blue/white hierarchy, no assets or trade dress. No third-party fonts/scripts or tracking in prototype.

## Technical impact / proposed files

Risk: medium-high integration (PII, consent, billable delivery, retries); prototype low risk, no network sends.

| Area | Proposed change |
| --- | --- |
| `src/features/cart/purchase-checkout.tsx` + scoped CSS | Two choices, recipient/account distinction, pending feedback; preserve pricing, payment and recovery behavior |
| New `src/features/notifications/NotificationPreferences.tsx` + CSS; `src/features/profile/Profile.tsx`, `src/app/App.tsx` | Owner settings destination, three independent preferences, explicit save/cancel, verification and opt-out |
| New `packages/domain/notification-preferences.ts` | Strict channel/purpose/destination schemas, explicit version, consent text version and pending/active/revoked states |
| New `functions/src/notification-preferences.ts` | Auth/AppCheck owner-only read/update, compare-and-swap, confirmation, resend and revoke commands; idempotency and bounded abuse controls |
| New `functions/src/notification-delivery.ts`, SMS provider adapter; `functions/src/index.ts` | Server-only dispatch, secrets references, delivery callbacks with signature validation, bounded worker |
| `functions/src/jobs.ts`, `functions/src/email.ts`, `functions/src/email-content.ts` | Classify events, reuse outbox, recheck current destination/version/consent immediately before send; preserve existing financial document guards and unknown-outcome reconciliation |
| `firestore.rules`, indexes if queries require, rules/unit/integration tests | Owner privacy, protected server fields and restricted token/consent writes; query-specific indexes only |
| Existing customer email templates + new subscription templates | Escaped HTML email, plain text, signed bounded links, confirmed event guards; preview HTML is not the production email renderer |

No blanket migration of legacy `marketingConsent=true` into new consents without attributable purpose/destination/version evidence. Unknown historical consent becomes not subscribed for the new purposes. Avoid subscribing users during deployment.

Proposed private collections: notification preferences keyed by uid, append-only consent events with server timestamp/text version/source and purpose, hashed single-use verification/unsubscribe tokens with expiry, per-channel outbox attempts. Do not put private contacts into public documents, analytics, URLs or logs. Transactional tokens must not authenticate access to orders. Order links require ownership checks. Unsubscribe token is purpose-scoped and permits revocation only; provide a no-login one-click email opt-out and compliant List-Unsubscribe headers for marketing. Do not unsubscribe via GET link prefetch.

Use Firebase for identity, Firestore consent/outbox and Functions orchestration; connect an SMS provider for custom messages. Notification phone verification must not sign the customer into another Firebase account or overwrite their current identity. Avoid using Auth SMS solely as a general-purpose verification transport without an approved identity design.

Idempotency: stable event+owner+channel+purpose+destination-version key; one confirmation per consent request; avoid same-state event spam. Provider acceptance != delivered. Model queued/sending/accepted/delivered/failed/unknown separately; ambiguous sends require provider reconciliation before retry. Recheck consent at dispatch and suppress revoked queued work; an already handed-off message may still arrive. Handle destination changes and in-flight cancellation explicitly. Delivery callbacks are authenticated, idempotent and tolerate out-of-order events. Apply per-user/phone/IP quotas, resend cooldown, OTP attempt limits and provider budgets; do not publish invented numeric limits.

## Validation and rollout after approval

- All four checkbox combinations; order completes without opting in; no false subscribed status before confirmation.
- Email confirmation token wrong/expired/replayed; SMS code wrong/expired/limited; verified destination changed; old token cannot restore revoked consent.
- Account A cannot subscribe/read B; gift recipient not automatically used; unsubscribe purpose cannot grant access; no contact leakage in logs.
- Change/disable races versus queued worker and confirmation; duplicate order events; provider timeout, unknown acceptance, bounce, unreachable phone and out-of-order callbacks.
- Email promotions off retains optional order email; all optional off preserves inbox and explicitly classified required messages. No automatic channel fallback without independent consent.
- Desktop 1440 and mobile 390/320, keyboard, 200% text scaling, loading/offline/error/unauthorized, verified consent text/version and signed links; real email clients and real Vietnam carrier delivery.
- Staged provider sandbox/approved test recipients only; live sending remains disabled until sender/domain verification, SMS sender/template approval, budget, actual received email/SMS and opt-out readback exist. Never claim both channels work from the mockup.
- Separate UI consent persistence from billable activation. Deploy via existing governed release path after separate authorization. Rollback disables dispatch while retaining consent history and opt-outs; never revert revocations through rollback.

Approval requested: this two-checkbox design, three profile preferences, purpose-specific confirmation/opt-out flows and the scoped backend plan. Provider selection/paid activation/deployment remain separate decisions supported by concrete configuration and cost evidence.

## r3 typography delta
Direct user feedback authorizes prototype-only reduction: Arial regular 12px, label/help 11px, headings 14px/500, 560px cards, 32px desktop fields/buttons and tighter spacing. Interaction, purpose and delivery plan unchanged.

## Current r4/r5 direction (supersedes standalone styling)
Generate preview directly from actual PurchaseCheckout/Profile/AccountRail with fixture initial data and captured actual app shell/styles. Preserve surrounding application layout and typography. Add checkbox rows within recipient fieldset, and a third profile tab using current stepper/cards with scoped three-column adjustment. Replace existing profile marketing checkbox with settings link. r5 removes the two helper lines specifically selected by user; labels and backend confirmation/consent plan unchanged. No protected implementation authorized or performed.

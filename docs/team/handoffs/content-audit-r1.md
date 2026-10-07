# Content audit handoff revision1

Status: READ_ONLY; no application edits. Team context revision1. Source observations only, not live provider/browser acceptance.

## Observed baseline
- CMS saves enforce current OWNER/CONTENT_EDITOR, strict schema, current version, operation hash, slug uniqueness, media ownership linkage and version/audit records. Public reads filter published status. HTML escapes values and includes SEO metadata. Media requires rightsConfirmed=true and staff authority.
- Scheduled products/posts publication is bounded and transaction-rechecks current status/time; a replay test covers versions and in-app notification exactly once. External social posting is explicitly disabled; UTM copy is honestly labeled manual.
- Email claim precedes provider send outside transactions, consent is checked for marketing=true; ambiguous send changes to unknown (no automatic blind resend). SMTP configuration/real delivery remain external and NOT_TESTED.

## Prioritized precise gaps and scoped write proposal
1. P1 ContentEditor kind switch can apply a late prior-kind list result; loading failure leaves previous rows. Add sequence/unmount guards, clear prior rows and errors on kind switch; paginated listWork cursor consumes next rather than silently hiding beyond 30.
2. P1 ContentEditor editing scheduled content does not initialize publishAt. Campaigns editing scheduled plan does not initialize scheduledAt; ordinary edit drops the planned date because server replaces campaign document (merge:false). Restore local date inputs with timezone-safe helper and regression tests. Add publishAt to ContentRow type (shared file lead ownership).
3. P1 Both new content and campaign saves create fresh operationId for each retry; response-loss retry can create duplicate new records. Retain operationId keyed by canonical submitted payload; exact retry reuses key, changed payload gets new key. Never reuse key for changed input. Clear state only after confirmed success. Test failed-response retry and edited payload.
4. P1 Notifications query has no createdAt ordering; limit30 is arbitrary document order, not latest. Add desc order and required composite index through shared-file owner. UI should clear errors on account switch, loading state, guarded callback, retry and bounded read mutation feedback.
5. P1 Notification generic fallback always says order updated and constructs /account/orders/undefined for non-order membership notifications. Current outbox producer exists only index.ts order commands and refunds.ts; membership/changes/shipping/consolidation/support changes have no corresponding outbox creates. Add typed event target projection + producers atomically with authoritative changes, lead coordination required across owned modules.
6. P2 Scheduled maintenance processes only queued outbox; jobs already marked blocked_external cannot resume when SMTP later becomes configured. Add bounded current-role operational retry/reconciliation command only for provably safe states; unknown must require operator resolution rather than blind resend. No provider operation or claims in this scope.
7. P2 CMS preview only saved body; change history saved but no version-history browsing/restore UI. CMS pagination/loading/empty/error controls and campaigns load failure currently underspecified.
8. P2 Master asks AI draft/rewrite for authorized campaign/content approval; current Ask assistant is customer-scoped, cannot publish and offers no authoring command. Requires bounded authorized draft endpoint/UI with consent/quota/injection protection, not weakening existing Ask.

## Requested independent writable scope
- First slice: src/features/content/ContentEditor.tsx, Campaigns.tsx and new content-local helper/tests for stale load guard, durable retry identity, local scheduled timestamps and list pagination. Exclude functions/workspace.ts, shared/public-content.ts, jobs, indexes, App routes until owner conflict decision.
- Second slice: src/features/notifications/Notifications.tsx only after lead owns index/typed event integration decision.
- Shared server recommendations handed to lead: workspace version preview endpoint; jobs bounded recovery and event expansion; tests/rules/server.test.ts remains active CRM owner.

## Evidence boundary
Commands: rg bounded source inventory, targeted sed/cat reads; no tests run by this agent yet. Existing test source is coverage intent, not a new PASS. No browser/provider/production access, no global memory writes.

## Immutable source SHA256 at audit readback
- `src/features/content/ContentEditor.tsx`: `9d9810a561a12ff997bf371a8b663166eaab43f7fb318fe7f3cad1b1ce83c9d2`
- `src/features/content/Campaigns.tsx`: `dbed1dcee29012b26befb54c91a9590b777dd1a7e774ca1ba8013cd221423346`
- `src/features/content/Content.tsx`: `41e63dd94857ef71bd8a8fff17156cdbcce711473c6988d0dd76c03bd6f37db9`
- `src/features/notifications/Notifications.tsx`: `716ece2011461cf7b7dab21d9469a878c5b9a52e8f415356b5c27758307e6b0f`
- `functions/src/workspace.ts`: `48aa27bcf98c835ee9bf947358421fe94abfbd1379ae5d7fb490f436ac9eb940`
- `functions/src/jobs.ts`: `2f8f2b558bcee8822aa4c65bc3c28b753b53ea47e884fa8cfa51d408e5309745`
- `functions/src/email.ts`: `5d43c110ac0fe7d22d701172c5d7247471f353ce61814cba8ad0fcce9491c839`
- `functions/src/public.ts`: `d24fd8a331f43becfa76a91f5f68cb63a1ff91291038bd0bfd0bd1aa34647164`
- `functions/src/media.ts`: `36ec34e2ecfb1b910bf47606d56aa020e8c7683fc4ff213c999e1642b4bfac07`
- `functions/src/index.ts`: `1c9816590998892ff432d015a9e964257267472041d313ddd51d127f90fe9a52`
- `tests/rules/server.test.ts`: `07abd11c4aba627c72588fde1778f906bd1f4eb31125020b79763dbabae99e9c`
- `firestore.rules`: `cebc3c332b92612ed35c0ac3d2aebce788cbf46a71d7c4a5fc3ad490dea749a9`

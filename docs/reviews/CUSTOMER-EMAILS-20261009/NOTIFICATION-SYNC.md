# Customer email / notification subscription sync

Checked at: 2026-10-09T15:37:22.512324+00:00

User requested direct coordination with the notification chat. Handoff delivered to `01a12117-e221-7411-aaa6-431277459111` (Thiết kế tùy chọn email và SMS). The chat acknowledged in its current assistant status that both features share the consent contract, optional order mail requires confirmed orderEmail and current destination, promotionsEmail is independent, and separate queues prevent both workers consuming the same job. Its final reconciliation report was still in progress at this check.

## Verified in this chat

- All 30 source/dependency hashes still match IMPLEMENTATION-SOURCE-MANIFEST.json.
- Canonical v2 catalog: 42 templates; 37 connected producer/explicit-document paths; 5 dormant by policy. Detailed delivery policy: RUNTIME-COVERAGE.md.
- Business events feed typed outbox/in-app projection and guarded customer-email sender. Main connected flows include quotes, confirmed payments, price/change proposals, purchasing, warehouse issues, final balance, shipment/delivery exceptions, cancellation and refunds.
- prepareCustomerEmail uses notification-order-policy.ts; email.ts repeats emailPreferenceAllowed immediately before provider I/O. Optional order updates and promotions require their own current confirmed topic/destination. Financial/action-required mail keeps its separate policy. Template eligibility remains an additional gate; consent alone never enables a disabled template.
- Subscription confirmation/welcome messages have their own templates and notificationEmailJobs queue; they are outside the 42 business-event templates. Customer event email uses the existing outbox sender. These are distinct purposes, not duplicate business dispatchers.
- Fresh joint validation: npx vitest run tests/unit/customer-emails.test.ts tests/unit/email-content.test.ts tests/unit/email-delivery-security.test.ts tests/unit/notification-subscriptions.test.ts tests/unit/notification-endpoint.test.ts — 5 files, 106 tests passed, exit 0.
- CodeGraph queried before CocoIndex; semantic index returned stale policy content. Critical contract verified against current source; repository intelligence remains DEGRADED.

## Remaining boundaries

SMS preference/token/content preparation exists, but no live order-SMS dispatcher or provider is wired. Email releaseCapability remains false; customer email is not production-enabled. Provider delivery, rebuilt authenticated runtime end-to-end acceptance, activation and deployment are NOT_VERIFIED / NOT_READY. No source changes, runtime restarts, data reseeds, real messages, commits or deployment were performed during this sync. Previous broader test/emulator evidence remains tied to the implementation manifest, not new production evidence.

Memory candidates: None. Token usage and actual cost: unavailable.

## Subsequent concurrent changes

After the sync check above, a new freshness check found changes in functions/src/purchase-settlement.ts, functions/src/shipping.ts and tests/unit/notification-subscriptions.test.ts. Earlier 30-file freshness and 106-test results describe the prior checked snapshot; they do not certify these subsequent edits. A separate chat reported whole-worktree typecheck errors in tests/rules/order-tracking-security.test.ts. Source inspection confirms its shared claims object widens firebase.sign_in_provider to string; this untracked tracking test is outside customer-email ownership. No cross-owner edits or messages were made on the basis of that agent-only request. Current whole-worktree integration acceptance remains NOT_VERIFIED pending owners' fixes and renewed checks.

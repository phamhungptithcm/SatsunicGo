# Order tracking design — 2026-10-09

Scope: user requested research and an interactive mockup using the existing SatsunicGo style. Only a new standalone HTML preview and design evidence are created. No application, contract, runtime or production changes are authorized by this request.

## Repository intelligence brief

Base HEAD: 0d6e721698608eebb36b0b2f68021c3054d97d1c. Worktree already contains substantial unrelated WIP; preserve it.
Gate: DEGRADED. CodeGraph and CocoIndex MCP returned useful matches, but the gate reports stale index metadata; local CocoIndex health fails on daemon.log permissions. Bounded source verification replaces claims of complete impact coverage. No installation or reindexing performed for this isolated design task.
Verified source: packages/domain/order-tracking.ts; src/features/ask/OrderTracking.tsx; src/features/orders/AccountTracking.tsx; src/features/shipping/DeliveryEstimate.tsx; src/features/shipping/CustomerShipments.tsx; src/styles/global.css; src/styles/account.css.
Shared 5207 listener reused; no runtime restart or data seeding.

## Research and design

Shopee: https://shopee.vn/blog/kiem-tra-don-hang-shopee/ — status and detailed shipping journey.
Shopee ETA: https://help.shopee.vn/portal/4/article/79573 — estimates are conditional, shown per shipping group.
Amazon Shipping: https://shipping.amazon.com/help — tracking number, status, location updates and ETA.
Research concerns documented behavior; no authenticated competitor app was exercised. Competitor artwork and branded colors are not copied.

Design read: a compact account view puts current state and ETA first, then a milestone chart, detailed history, next step and parcel details.
Brand: blue #163cff, navy #111c35, white, thin #e2e6ef borders; account rail and system/Arial fallback fonts. Layout variance 3/10, motion 1/10 (no animated chart), density 6/10.
Desktop has horizontal milestones and two detail columns; narrow/mobile view uses a vertical timeline and stacked details. All timestamps are explicitly synthetic UTC+7; research date uses the user's 2026-10-09 context.

## Mapping and limits

The principal example is a custom order with upfrontPayment enabled: initial payment → purchase → origin warehouse/packing → remaining costs review → shipping → delivery. This follows trackingMilestones. Do not apply remaining costs or deposit milestones to a catalog order.
Stage progression is ordinal, never percentage completion or elapsed-duration prediction. Past milestone labels mean passed stage, not proof of a particular payment event.
Current API provides stage, timeline action/time, route, carrier, tracking, update time, staff ETA and partial flags. It does not provide current geographic position, hub scans, driver location, stops remaining or customs milestones. A route is not a location. The prototype says location unavailable instead of inventing it.
ETA is a staff estimate, not a promise. Preserve expiry, failed delivery, hold, returned parcels, incomplete allocations, owner scoping and whole-order versus single-parcel differences.
Mockup selectors change synthetic fixtures only. Retry restores the fixture; it is not a backend request.

## Concrete implementation plan for later approval

1. src/features/ask/OrderTracking.tsx: separate hero, milestone chart, event history and parcel section; retain the existing domain functions, locale, support destination and all partial/error/hold semantics. Use the same renderer from AccountTracking and Ask.
2. src/styles/global.css orderTracking rules or a dedicated scoped stylesheet: blue/white timeline styling and narrow stacking without changing CRM or other public pages.
3. src/features/shipping/DeliveryEstimate.tsx: reuse current estimate parsing/formatting; any display variant must preserve aggregate and freshness semantics.
4. src/features/orders/AccountTracking.tsx: preserve auth identity and request generation guards, loading, retry and account changes. No new caching.
5. Relevant existing tracking unit and browser tests: catalog/custom/upfront variants, null/expired ETA, failed/returned/hold/cancelled/delivered, multi-parcel, partial data, account switching, narrow widths, pointer/keyboard and reduced motion.
6. Location integration is a separate data-contract proposal if desired: verify permitted source, privacy projection, timestamp/freshness and ownership before adding any field. GPS maps and precise delivery times require an authoritative provider.

Risk: low for standalone mockup; medium for eventual shared application renderer and financial milestone semantics. No persistence, dependency, release, infrastructure or API change is included in this design scope. Rollback is removal of new preview/evidence only.
Application implementation awaits explicit approval of this plan under .ai/workflows/plan-existing-system-change.md. This requirement does not block the requested mockup deliverable.

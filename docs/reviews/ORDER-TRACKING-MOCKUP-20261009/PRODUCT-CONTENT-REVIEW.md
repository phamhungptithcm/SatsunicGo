# Product Content Review

## Scope and evidence
Surface: standalone order tracking prototype, vi-VN web, synthetic customer/order data. Audience: a buyer checking progress, next step and delivery expectations. Files: docs/previews/ORDER-TRACKING-20261009.html and CONTENT-INVENTORY.json. Reviewer: Codex, 2026-10-09.
Web conventions: native select, buttons, links, heading/list semantics, visible focus, aria-current and polite updates. Apple-specific controls: not applicable. Existing SatsunicGo source and rendered home were inspected.
Verified facts and assumptions: see PLAN.md. Fixture dates, counts and reference are design data, not actual customer data. Exact current location is unavailable in the existing DTO. No notification, delivery guarantee, refund or carrier connection is implied.

## Content inventory
CONTENT-INVENTORY.json contains the rendered content for all 15 scenarios. Shared chrome includes mockup/data label, Desktop/Mobile controls, Xem trạng thái, SatsunicGo home, account navigation, Theo dõi đơn hàng, synthetic order/market, Liên hệ hỗ trợ and footer. Icons are decorative; the compact support link retains its accessible name.

## State coverage
Default: transit with ETA and next step. Loading: identified progress load. Empty: no orders. Success: recorded delivery. Error: progress load failed, retry fixture. Unauthorized: session changed, account destination. Stale: old estimate is labeled and replaced with Cần cập nhật. Partial: no aggregate ETA, missing parcel data disclosed. Failed/returned/hold/cancelled: explanatory content; no invented recovery schedule or automatic refund. Destructive/confirmation: not applicable; no mutation actions.

## Data semantics
All sample content is marked illustrative. ETA is a range recorded by staff and may change. Unknown location/tracking is text, not zero or a fabricated map. Multi-parcel completion stays separate from order completion. UTC+7 is explicit for these Vietnamese fixtures; application implementation must retain existing locale-aware formatting and source timestamps. Timeline is ordinal, not a percentage chart. No PII, authentication, storage or backend network calls.

## Mandatory principles — prototype review
| Principle | Result | Evidence |
| --- | --- | --- |
| Purpose | PASSED | Current stage and ETA lead; steps and history answer progress questions. |
| Agency | PASSED | Native state selector and mode buttons; support is visible; keyboard focus checked. |
| Responsibility | PASSED | Illustrative data, non-live freshness, staff estimate and missing location are explicit. |
| Familiarity | PASSED | Existing brand tokens and account pattern; conventional ecommerce milestones. |
| Flexibility | PASSED | 1440/390/320 rendered; tested narrow states have no horizontal overflow. |
| Simplicity | PASSED | One hero, one chart, two detail sections; no invented percent or map. |
| Craft | PASSED | 15 scenarios exercised; warehouse chronology and compact support accessible name corrected. |
| Delight | PASSED | Current icon, connected steps and restrained blue hierarchy clarify progress without motion. |

## Pattern and dimension results
Meaning/behavior, audience/context, natural voice, brevity, terminology, state coverage, data/privacy and target-platform fit: PASSED for this synthetic prototype. Actions match prototype behavior. In-context verification: PASSED via browser snapshots and screenshots at listed widths. Basic accessibility: PASSED for names, native semantics, non-color labels, current-step semantics and sampled keyboard navigation. Full screen-reader audit: NOT_RUN; production accessibility acceptance is not asserted. Localization: Vietnamese text wraps at 320px; multilingual/text-expansion/200% zoom acceptance NOT_RUN, deferred to implementation. No translations shipped. Alerts are inline and passive; no irreversible actions.

## Verification
15 scenario selections rendered. Error retry restored transit. Desktop/Mobile preview controls changed layout. Narrow 320px scenarios fit without horizontal overflow. Tab from scenario select reached named home link. Browser console error readback was empty. Screenshots: desktop.jpg, mobile-390.jpg, mobile-320.jpg. No live provider, auth integration or production behavior tested.
Decision: PASSED for mockup content review only. Production Product Language Gate: NOT_READY pending implementation and full applicable accessibility/localization checks. Residual limitation: no current-location provider. Owner decision: approve application plan separately if this direction is accepted.

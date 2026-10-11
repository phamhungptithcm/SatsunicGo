# Product Content Review

## Scope

- Surface: homepage hero and shared public navigation, proposed standalone preview only.
- References: HOME-CATALOG-NAV v1 PLAN.md and docs/previews/HOME-CATALOG-NAV-20261010.html.
- Audience/task: Vietnamese shoppers browse listed products first; request another product by name/link/photo when needed.
- Business outcome: make catalog the primary route without removing custom purchasing.
- Platform: responsive web, links navigate, button opens disclosure; matching accessible names, keyboard focus,44px targets and reduced motion. Apple HIG compliance not claimed; local principles used as human-centered quality reference.
- Reviewer/date: /root,2026-10-10 UTC.

## Context And Evidence

Verified: /products catalog; /request name/link/image composer; /membership plans/benefits; /fees existing pricing route; /posts,/support existing routes. Source and actual shared5207 homepage DOM inspected. Listing does not establish stock availability. Product-first priority comes directly from user. Assumptions: current headline/lead remain suitable; existing brand remains authoritative. Unknown: actual signed-in/staff responsiveness after implementation, spoken AT and genuine zoom. No backend promise is added.

## Content Inventory

| Location/state | Current | Proposed | Job/evidence |
|---|---|---|---|
| Hero primary | Gửi yêu cầu mua hộ→/request | Xem sản phẩm→/products | Main browsing path chosen by user; existing catalog |
| Hero secondary | Xem cách hoạt động→/how-it-works | Gửi yêu cầu mua hộ→/request | Alternate custom request; existing composer accepts name/link/photo |
| Journey footer | No link | Xem cách hoạt động→/how-it-works | Preserve discovery after hero hierarchy change |
| Journey step1 | Chọn hàng có sẵn hoặc gửi món cần mua hộ. | Chọn sản phẩm đã đăng hoặc gửi món cần mua hộ. | Listing semantics, no stock promise |
| Desktop request action/mobile nav | Mua hộ | Mua hộ theo yêu cầu | Distinguishes custom request from catalog |
| Main nav | Biểu phí | Phí dịch vụ | Existing service pricing destination |
| Main/account nav | Membership | Thành viên | Existing plans and member benefits, familiar Vietnamese term |
| Menu closed/open | Mở menu/Đóng menu | Same | aria-expanded matches visibility; Escape restores focus |
| Other labels | Sản phẩm/Bài viết/Hỗ trợ/Giỏ hàng | Same | Preserve familiar destinations; cart states remain app-owned |

## State Coverage

| State | Applicable | Evidence/status |
|---|---|---|
| Default/action | Yes | Preview DOM/desktop/mobile screenshots, exact hrefs |
| Hover/focus/selected | Yes | Visible focus styling, Enter/Tab/Escape exercised; actual route-selected state after implementation NOT_RUN |
| Loading/pending/disabled | Existing cart/account | Preserve existing loading/cache/error/busy/99+ states; real app NOT_RUN for this proposal |
| Empty/error/offline/stale | Existing destination/cart | No new copy or behavior; preserve existing meaning, no fabricated success |
| Unauthorized/forbidden | Existing staff/account | Preserve role-gated CRM and account permissions; actual state NOT_RUN |
| Confirmation/destructive | No new action | Pure navigation, no submit/payment/account mutation |
| Success | No new durable operation | No success message or financial outcome |

## Data Semantics

No metric/currency/time-range change. Existing cart count remains actual/cached/loading/error-aware. No synthetic count in preview. Catalog listings do not imply warehouse stock; custom request remains a separate destination. No new personal data, price, delivery or authentication claim.

## Mandatory Human Interface Principles

| Principle | Status | Evidence |
|---|---|---|
| Purpose | PASSED | Primary catalog route, secondary custom request, direct user requirement |
| Agency | PASSED | Both routes retained; how-it-works remains discoverable; no forced purchase/account |
| Responsibility | PASSED | No stock/payment/price promise; no collection or mutation |
| Familiarity | PASSED | Concrete Vietnamese labels and standard web anchors/disclosure |
| Flexibility | NOT_RUN | Preview390/320 and keyboard pass; real signed-in/staff, actual zoom and spoken AT remain required |
| Simplicity | PASSED | Exactly2 hero buttons, one desktop request entry, mobile equivalent |
| Craft | NOT_RUN | Preview spacing/wrapping/focus checked; full implemented component/states not yet available |
| Delight | PASSED | Calm blue emphasis, balanced hierarchy, no decorative motion/interruption |

## Platform Fit

Responsive web; preserve existing React Router/native links, browser history and keyboard conventions. Existing blue-white-navy system is authoritative. Local retail reference informed spacing/CTA hierarchy only; no external logo/font/brand expression used. No Apple-only control or HIG compliance claim. Result PASSED within proposal scope.

## Human Interface Pattern Checks

| Pattern | Applicable | Result/evidence |
|---|---|---|
| Writing/labels/controls | Yes | PASSED proposed meaning checked against source and DOM |
| Feedback/interruptions | Yes | PASSED no new interruption, focus disclosed |
| Alerts/consequential choices | No new behavior | NOT_APPLICABLE |
| Onboarding/help | Journey link | PASSED optional existing information route retained |
| Privacy/accounts/permissions | Existing header | NOT_RUN in actual implemented states; preserve rules/role/account handlers |
| Inclusion/accessibility/localization | Yes | NOT_RUN final; Vietnamese prototype responsive/keyboard evidence only |

## Gate Results

| Dimension | Status | Evidence |
|---|---|---|
| Human Interface principles | NOT_RUN | Flexibility/Craft need actual implementation evidence |
| Target-platform fit | PASSED | Standard responsive web proposal |
| Meaning matches behavior | PASSED | Existing route/composer/source contract |
| Audience/business context | PASSED | Direct catalog-first user requirement |
| Natural/respectful tone | PASSED | Plain concrete Vietnamese, no stock/delivery guarantee |
| Concise without meaning loss | PASSED | Action/destination labels; no helper filler |
| Actions/state coverage | NOT_RUN | Preview disclosure pass; actual account/cart/staff states pending |
| Data semantics/privacy | PASSED | No personal data/metrics/financial action; listings wording corrected |
| Accessibility | NOT_RUN | Keyboard proxy pass; spoken/actual implementation pending |
| Localization/text expansion | NOT_RUN | Vietnamese widths checked; genuine zoom still required |
| Terminology consistency | PASSED | Plan includes account Membership label alignment |
| In-context verification | PASSED | Explicit standalone proxy screenshot/DOM, not app acceptance |

## Verification Evidence

PREVIEW-CHECKS.json binds screenshots, dimensions, keyboard and href checks. Actual source hashes unchanged. No app compiler/tests/build/provider call needed or claimed for a plan-only prototype. Existing JourneyTimeline animation is statically represented, not replaced. Signed-in long names, staff CRM, actual200%zoom and spoken AT remain NOT_RUN.

## Decision

Product Language Gate: BLOCKED for final implementation handoff; proposal is reviewable. Preview correction:320px headline reduced to34px to avoid an orphaned “xa.” line. Required owner decision: approve HOME-CATALOG-NAV v1 layout/labels before protected app edits.

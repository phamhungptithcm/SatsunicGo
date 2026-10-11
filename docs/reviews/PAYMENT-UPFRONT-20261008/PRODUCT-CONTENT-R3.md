# Product Content Review — r3

## Scope

- Surface: retained RequestForm proxy, mixed cart, delivery, payment status, grouped receipt HTML, staff sourcing illustration.
- Files: r3 HTML, its Python generator and JS, DESIGN-R3.md; application scope proposed in plan v2.
- Audience/job: Vietnamese customers requesting international purchases; select items, enter delivery, understand total and additional costs. Staff identifies what needs sourcing after verified initial payment.
- Locale/platform: vi-VN web; native HTML inputs/selects/buttons, existing SatsunicGo components and source CSS. Apple principles applied as quality reference; Apple-platform compliance not applicable.
- Reviewer/date: root self-review, 2026-10-08. Current rendered proxy; not authenticated production.

## Context And Evidence

Verified source facts: RequestForm three steps/direct submit, catalog-only cart/per-product checkout, saved free-text addresses, single-order payment intent. User requires retaining form with add-to-cart and sourcing flag. Proposed behavior is explicitly labeled in proxy. Unknowns: full authoritative address dataset/version/carrier mapping, commercial fees/FX, merchant activation, actual order/ledger/schema implementation, live PDF/mail.

## Content Inventory

Complete static/accessible attributes and Vietnamese JS literals: CONTENT-INVENTORY-R3.json, generated from HTML and JS. Dynamic customer names/variants/quantities and monetary totals are user inputs/Intl-formatted illustrative values; their composition is bounded in the script, rendered examples checked below.

| Location/state | Current code behavior | R3 wording | User job / evidence |
| --- | --- | --- | --- |
| Request final | Sends request, creates order | Thêm vào giỏ hàng | Retained three steps then cart; no order or staff task before checkout. |
| Custom line | No custom in cart | Cần tìm mua | Derived from custom intake; source price not verified purchase price. |
| Catalog line | Fixed listing price | Giá niêm yết | Do not imply warehouse stock; actual listing example name retained. |
| Review total | Per-product order | Thanh toán toàn bộ ban đầu | Selected lines only; 4,695,000 example reconciles exact split. |
| Delivery error | Free text | Specific required name/phone/region/street errors | aria-describedby/invalid + focus first invalid field; inputs retained. |
| Unknown payment | Needs server reconciliation | Tiếp tục kiểm tra lần đang chờ; không thanh toán lại | Reserved lines/CTA disabled, resume path; simulated state only. |
| Staff paid | Existing Workbench | Cần tìm mua · Đã trả đủ ban đầu | Staff proxy remains empty before confirmation, catalog and unpaid line excluded. |
| Receipt | Fixed independent r2 sample | Mẫu giỏ · thanh toán toàn bộ ban đầu | Main HTML amount/rows/totals from frozen checkout; PDFs clearly fixed examples. |

## State Coverage

| State | Evidence/status |
| --- | --- |
| Default/action/disabled | Three request stages, empty cart, selection and consent CTA, default unavailable Maps notice checked in browser. |
| Loading/pending/unknown | UI simulation plus temporary line lock/resume checked; real async server loading NOT_RUN. |
| Empty/true zero | Empty cart default; zero selected after confirmed purchase; no buyer/revenue inferred from clicks. |
| Success | Simulated paid, repeated button safe, only selected lines consumed, remaining áo khoác preserved. Real durable server success NOT_RUN. |
| Error/recovery | Empty recipient validation, first invalid focus, province change clears ward, editing street clears consent checked. |
| Offline/stale/partial | Static manual Maps fallback and unknown price/shipping copy; real network/recovery NOT_RUN. |
| Unauthorized/forbidden | No authenticated backend in proxy. Application guard acceptance NOT_RUN; cannot claim a pass. |
| Confirmation/destructive | Explicit checkout consent, reversible cart removal; real contract/financial/refund operations NOT_RUN. |

## Data Semantics

Catalog 1,650,000 VND is illustrative fixed unit price. Custom 58 USD × 2 × 25,000 = 2,900,000 VND; illustrative fee 5% = 145,000; initial total 4,695,000 including catalog. Unknown custom freight is “Chưa chốt”, not zero or free shipping. Customer research price, source-kind, sourcing progress and payment status are separate. Receipt has the actual simulated group context; r2 PDF links retain fixed values. Phone/address values synthetic; no third-party query/API transmission. Prototype does not persist personal inputs across reload.

## Mandatory Human Interface Principles

| Principle | Status | Current evidence |
| --- | --- | --- |
| Purpose | PASSED | One cart/checkout; request retains three steps and add action. |
| Agency | PASSED | Select subset; unselected item retained; back/edit and explicit consent; unknown resume. |
| Responsibility | PASSED | Demo disclosure, shipping unknown, price origin and approval-before-extra-spend, no staff work before paid. |
| Familiarity | PASSED | Current source shell/form/tab conventions and native controls retained in disclosed proxy. |
| Flexibility | NOT_RUN | 390/768/1280 and keyboard subset checked; full AT, actual 200% zoom and localization expansion not run. |
| Simplicity | PASSED | Three checkout steps, one delivery address, one selected total, no duplicate custom payment route. |
| Craft | NOT_RUN | Receipt mismatch/pending lock/mobile rail fixed and rechecked; full form image/multi-item/reload/auth and assistive evidence still missing. |
| Delight | PASSED | Preserve safe field input and unselected items, calm recovery and no fake urgency; scoped prototype evidence. |

## Platform Fit

Web, existing blue/white/navy, HTML semantics, persistent labels, Arrow keys move tab focus without activating and Enter activates. No Apple-only convention/expression. Real RequestForm mobile rail is retained, scoped horizontal checkout rail verified. Target-platform fit PASSED for proxy; no WCAG/HIG compliance claim.

## Human Interface Pattern Checks

| Pattern | Result / evidence |
| --- | --- |
| Labels/actions | PASSED in proxy; add vs purchase vs receipt clearly distinct. |
| Feedback | PASSED in proxy; inline status/error/resume, no transient-only financial state. |
| Consequential choice | PASSED in proxy; checkout consent reset on address/selection edits. |
| Onboarding/help | PASSED in proxy; form help and preview disclosure, no forced popup. |
| Accounts/privacy | NOT_RUN application; owner guards specified but not executed. |
| Inclusion/accessibility/localization | NOT_RUN full gate; DOM labels/keyboard/responsive subset only. |

## Gate Results

| Dimension | Status / reason |
| --- | --- |
| Human Interface principles | NOT_RUN complete; Flexibility/Craft pending. |
| Target-platform fit | PASSED proxy evidence above. |
| Meaning/behavior | PASSED only for disclosed simulation; server behavior NOT_RUN. |
| Audience/tone/brevity/terminology/data semantics | PASSED self-review of rendered proxy, source-derived proposed contracts. |
| Actions/state coverage | NOT_RUN application failure/auth/async state acceptance. |
| Accessibility | NOT_RUN full AT; accessible DOM + keyboard subset checked. |
| Localization/text expansion | NOT_RUN; vi-VN money visible, translations/200% not verified. |
| In-context verification | PASSED proxy, not app/provider/production. |

## Verification Evidence

Browser screenshots: r3-mixed-cart-desktop.png, r3-mixed-cart-tablet.png, r3-mixed-cart-mobile-viewport.png; review, staff and receipt images. Current 390/768/1280 overflow false; scoped checkout columns checked. Space consent, Enter tab activation, ArrowRight focus-only behavior checked. Source parser: 96 unique IDs, 7 tab/panel relationships, existing stylesheets, no network mutations/unsafe HTML sink; refreshed STATIC-CHECKS-R3.json. Node syntax and Prettier checked. Browser error log readback empty at the specific final receipt test, not a full-session console guarantee.

## Decision

Product Language Gate: **BLOCKED** for full implementation acceptance. Fixed: pending reservation affordance, receipt amount mismatch, mobile checkout rail and invalid-field focus. Remaining: full AT/zoom/localization and actual app/backend/provider integration. Required owner decision: approve reviewed plan v2 before protected implementation.

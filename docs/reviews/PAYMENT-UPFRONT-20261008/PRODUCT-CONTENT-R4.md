# Product Content Review — R4

## Scope

- Surface: additional checkout after existing cart; local design proxy. Files: r4 generator, JS, CSS and generated HTML.
- Audience/job: customers finish delivery and initial payment for items already added. Business outcome: a funded request can reach staff sourcing, with later approved cost adjustment.
- Vietnamese web; existing SatsunicGo Inter/blue-white-navy/native control conventions. Apple platform compliance not applicable; eight principles applied as a human-centered reference. Root self-review, 2026-10-08.

## Context And Evidence

Verified source: cart icon → `/cart`, existing Cart appearance, per-product checkout, current tariff schema/calculator/public origin semantics. User requires existing Cart/form appearance preserved, custom add action and subsequent checkout only. R4 uses an explicit 2-line/3-item fixture, not real cart/backend. Tariff reference is not a chargeable published quote. Unknowns: domestic regional rate table, complete authoritative directory, production fees/FX, PayOS credentials, server mixed-cart/payment/PDF/email integration. Source/intent comparison in plan v3; live source manifest, static inventory, browser readbacks and screenshots below.

## Content Inventory

Complete static/accessible and JS string inventory: CONTENT-INVENTORY-R4.json. Imported source category/price/clearance labels listed separately from local copy. Dynamic names, quantities and currency are input/Intl compositions; bounded script and actual rendered readbacks are the evidence.

| Location/state | Content/action | Meaning and evidence |
| --- | --- | --- |
| Preview/default | Checkout mẫu sau giỏ hàng · 2 dòng / 3 món | Discloses seed, no backend/PayOS/real money. |
| Cart/edit | ← Giỏ hàng; Sửa trong giỏ hàng | Real existing local `/cart` link; no redesigned cart screen shown. |
| Recipient | Thông tin nhận hàng; province → ward | Same recipient for group; changing province clears ward and saved-address association. |
| Journey/default/review/payment | Nhận hàng → Tổng quan → Thanh toán; Tổng quan đơn hàng; Xem tổng quan →; Xác nhận & thanh toán [amount] | Three real design stages; future payment disabled until confirmation. Overview shows items/address/payment details; confirmation follows details. Payment current marker means payment screen, not money received. |
| Payment details/freight | Cước vận chuyển; Ước tính / điều chỉnh cước; Điều kiện và phí khác | One freight estimate inside payment details. Initial payable amount is separate and shown first; estimate controls are optional disclosures. |
| Shipping/unknown | Chưa tính | Weight optional, no synthetic price. |
| Shipping/estimate | Cước quốc tế tham khảo; Cước quốc tế dự tính · chưa thu | Actual shared calculator, USD amount; disclosed demo VND estimate separate from initial charge. |
| Shipping/ambiguous | Cần báo giá | Oregon/ambiguous tier remains uncharged and confirmation-required. |
| Shipping/unavailable | Chưa có cước | No silent reference-price fallback when unavailable is selected. |
| Domestic | Giao nội địa; Phí cần xác nhận | Existing tariff has no province-price matrix; region changes context, no invented fee. |
| Confirmation | Tôi đã kiểm tra món, địa chỉ và số tiền… | Deliberate consent; shipping/address edits clear consent and disable payment action. |
| Payment/unknown | Tiếp tục kiểm tra lần đang chờ | Locked checkout/quote controls; immutable simulated attempt, receipt disabled. |
| Receipt/paid | Cước…Chưa thu · sẽ chốt trước khi gửi | Initial 4,695,000 exactly matches listing/goods/fee; unpaid estimate not represented as received. Fixed PDF downloads disclosed. |
| Staff | Cần tìm mua · Đã trả đủ ban đầu | Only paid custom fixture; no pre-payment task. |

## State Coverage

| State | Evidence/status |
| --- | --- |
| Default/action/disabled | Current three-step fixture, existing cart links, shipping inside payment details, future step/consent-disabled action inspected. |
| Loading/pending | Source dynamic import has loading/unavailable paths. Real loading race/offline import failure NOT_RUN; actual reference import completed. Payment simulation checked. |
| Empty/zero | Blank weight → unknown, no estimate charged; no fabricated domestic zero. Real empty cart/signed-out/recovery integration NOT_RUN. |
| Success | Simulated paid once, funded custom staff row and exact receipt readbacks; backend success NOT_RUN. |
| Error/recovery | Zero/precision validation, required recipient focus, stale saved-address clearing, unavailable quote recovery checked. |
| Offline/stale/partial | Manual unavailable selector tested; real callable/offline/stale-version recovery NOT_RUN. |
| Unauthorized/forbidden | No auth/API in proxy; actual app guards NOT_RUN. |
| Confirmation/destructive | Consent/change reset checked, cart editing routes to existing page. No real financial/contract/destructive action executed. |

## Data Semantics

Goods/fees fixture: 58 USD × 2 × 25,000 = 2,900,000 VND; 5% demo fee = 145,000; listing 1,650,000; initial payment 4,695,000. Example category tariff 8.90 USD/kg, minimum 1 kg: 0.5 kg → 8.90 USD; 1.5 kg → 13.35 USD, approximately 333,750 VND using disclosed demo FX. Calculator output remains USD cents; display conversion is not money received or a committed quote. Unknown customs/insurance/domestic delivery remain separate. Recipient province is not origin warehouse. Reference source/version:null is not a published production tariff. Phone/address are synthetic; no third-party API or PII transmission, no browser persistence.

## Mandatory Human Interface Principles

| Principle | Status | Current evidence |
| --- | --- | --- |
| Purpose | PASSED scoped proxy | Finish checkout after retained cart, not redesign shopping entry. |
| Agency | PASSED scoped proxy | Edit via existing cart/address, optional weight, explicit consent, no auto-extra-charge. |
| Responsibility | PASSED scoped proxy | Reference/estimate/unpaid/unknown separated; domestic prices not invented. |
| Familiarity | PASSED scoped proxy | Existing source Cart icon/CSS/link and product vocabulary; native labels/controls. Production visual parity NOT_RUN. |
| Flexibility | NOT_RUN full gate | 320/390/768/1280 widths and consent keyboard subset; full AT/actual 200% zoom/localization missing. |
| Simplicity | PASSED scoped proxy | Recipient → overview → payment; one payment-detail block with expandable freight controls; existing cart remains edit destination. |
| Craft | NOT_RUN full gate | Address/lock/price/receipt fixes verified; actual cart/form/image/multi-item/backend states not implemented. |
| Delight | PASSED scoped proxy | Preserve entered data during correction, calm durable price/unknown feedback, no invented urgency. |

## Platform Fit

Web semantics, shared visual tokens, visible field labels, live shipping feedback, reduced-motion inherited source styles; no new animation. No Apple-only control or protected expression. Source parity is not a deployed visual acceptance claim.

## Human Interface Pattern Checks

| Pattern | Result |
| --- | --- |
| Labels/feedback/help | PASSED proxy; optional weight, exact unit/source and correction guidance shown. |
| Consequential choices | PASSED simulation; consent/unknown lock tested, real financial acceptance NOT_RUN. |
| Permissions/privacy/accounts | NOT_RUN implementation; no real account/private address read. |
| Accessibility/localization/RTL | NOT_RUN full gate; DOM/labels/mobile/VI currency subset only. |

## Gate Results

Meaning/behavior, tone, audience, concise terminology and data semantics: PASSED **disclosed proxy subset**. In-context verification: source/DOM/screenshot evidence present. Full principles, state coverage, accessibility and localization: NOT_RUN; overall Product Language Gate **BLOCKED** for application completion. Existing Cart UI is not certified from a production screenshot in this turn. Real payment/backend/PDF/email/Maps proof missing.

## Verification Evidence And Decision

BROWSER-CHECKS-R4.json, STATIC-CHECKS-R4.json and source manifest; r4-checkout-address-desktop.png, r4-checkout-mobile.png, r4-checkout-tablet.png and r4-receipt.png. Scoped review loops repaired province/saved-address association, VI decimal units and pending quote synchronization. Full implementation approval/validation remains pending plan v3. No successful application or production handoff.

Current layout refinement: BROWSER-LAYOUT-R4.json; r4-overview-shipping-desktop.png and r4-overview-shipping-mobile.png. Current 390/1280 in-context screenshots inspected; 320 width measured without horizontal overflow. Confirmation is below the full details in DOM/visual order; field edits reset consent and exact initial amount is maintained when entering payment. Earlier screenshots cover historical layout/states, not this layout acceptance. Full AT/actual 200% zoom/localization and app/backend/provider checks remain NOT_RUN.

## Connected-node refinement

Visible labels unchanged: Nhận hàng, Tổng quan, Thanh toán. Node numbers and checked glyph `✓` remain `aria-hidden`; the active stage keeps `aria-current="step"`, future actions keep native disabled state. Checkmark denotes a previously checked stage, never money received. On the payment screen prior-node completion is only rendered when a confirmed synthetic attempt exists. Three 30px nodes joined by 2px lines replace the tab underline/plain text payment row, following existing StepForm/RequestForm source tokens. No new product promise or fee meaning introduced.

Current in-context evidence: BROWSER-STEPPER-R4.json, r4-stepper-nodes-desktop.png, r4-stepper-nodes-mobile.png and r4-stepper-payment-mobile.png. Desktop/mobile screenshots inspected; 320 width measured, back/confirmation/pending receipt states read back. Earlier layout screenshots are historical for the changed node styling.

| Principle | Evidence for this refinement |
| --- | --- |
| Purpose | Three real stages remain visible; lines clarify sequence. |
| Agency | Existing back, validation and deliberate confirmation retained. |
| Responsibility | Checked stages do not imply confirmed funds; pending receipt remains disabled. |
| Familiarity | Existing 30px node/2px connector/colors, rather than a tab underline. |
| Flexibility | 390/1280 visually checked, 320 no overflow; native button/ARIA semantics retained. Full AT/zoom/localization still NOT_RUN. |
| Simplicity | Same concise labels and one connected rail; no extra actions. |
| Craft | Line/node centers and completed/current/future states verified on both screens. |
| Delight | Clear progress and preserved entered address when stepping back; no new animation. |

Scoped connector/meaning checks pass. Full Product Language/application gate remains **BLOCKED** for missing implementation and complete accessibility/localization evidence; no production acceptance claim.

## Current compact overview and product image refinement — R19–R22

Supersedes earlier overview layout descriptions. Items, count, delivery and terms share one card. Initial amount, freight and confirmation/actions share the payment card; the confirmation stays after those details in DOM/mobile order. One disclosure contains freight controls/conditions; demo options are outside the card.

| Changed content or display | Verified meaning |
| --- | --- |
| Sửa giỏ hàng; Sửa địa chỉ | Existing `/cart` link and return to recipient stage; no edit destination removed. |
| Thanh toán ban đầu; Xác nhận & thanh toán | Exact amount immediately above the consent/action, same deliberate confirmation gate; no new charge or shortened money semantics. |
| 100% giá hàng và phí mua hộ…; Quốc tế dự tính · chưa thu | Initial amount excludes uncollected custom freight. Listing stays trọn gói. |
| Xem / điều chỉnh cước | Single optional disclosure holds existing inputs, exclusions, source and demo FX; uncertain fee is not hidden as zero. |
| Chưa biết cân nặng? Có thể chốt cước sau, trước khi gửi. | Unknown estimate remains unknown; initial amount does not change. |
| Giá niêm yết giữ trọn gói…bạn duyệt khoản trả thêm trước khi gửi. | Listing/custom distinction retained; no automatic extra payment. |
| Thanh toán mô phỏng, không chuyển tiền thật.; Tùy chọn bản thiết kế | Prototype-only action and controls explicitly disclosed. |
| 44px square photo, 8px corners | Illustrative seed image beside each named product, no brand/model verification claim. Decorative empty alt/hidden wrapper avoids repeating product name. Names/flags/prices remain readable if photo absent or fails. |

Current in-context evidence: BROWSER-COMPACT-R4.json plus r4-compact-overview-desktop.png/mobile.png. Both local thumbnail requests loaded; 390/320 no horizontal overflow, button height 44px. Keyboard consent, quote-edit reset, unavailable estimate, confirmed pending amount 4,695,000 and disabled receipt/quote/demo controls verified. Real image-load failure, full AT/zoom/localization, authenticated cart/custom-upload image integration remain NOT_RUN; source fallback preserves frame and text.

| Principle | Compact/image evidence |
| --- | --- |
| Purpose | Product identity, address and initial payment are visible together for final review. |
| Agency | Cart/address edits and optional freight controls retained; consent still required. |
| Responsibility | Initial money and uncollected freight remain distinct; demo image/proxy boundary disclosed. |
| Familiarity | Existing blue-white-navy, shared connected nodes, natural product names and compact thumbnails. |
| Flexibility | Current 320/390/1280 geometry checked; product name is text independent of image. Full AT/zoom/localization NOT_RUN. |
| Simplicity | Two compact cards, one freight disclosure, no demo test controls mixed into price rows. |
| Craft | Local 4.6KB asset, fixed image dimensions/corners, no layout shift; visible names/prices retained. |
| Delight | Faster item recognition and less empty space; no animation or extra interaction. |

Scoped content/layout checks pass; full financial application Product Language Gate remains BLOCKED for earlier unimplemented/incomplete evidence, not completed by these cosmetic changes.

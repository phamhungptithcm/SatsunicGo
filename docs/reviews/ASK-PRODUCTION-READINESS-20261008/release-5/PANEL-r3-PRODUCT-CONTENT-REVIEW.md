# Compact Ask panel content review

Local review date:2026-10-08 America/Chicago. Root executor/source/pixel review; BA and Technical Lead independent bounded source observations. **DESIGN ONLY. Application Product Language Gate remains BLOCKED.** Current HTML8071ceecc7e8e7a9456d38684cea318f6f1bc80ebf40f99670d087b5aab76548 and [current executor receipt](PANEL-r3-EXECUTOR-r1.json) bind nine fresh screenshots. No r2/precursor pixel is accepted as a current screenshot.

## Context and content inventory

User requested four specific corrections to the r2 preview: remove History/VI/EN controls; compact adjacent blue form links; an item with photo like the existing cart; smaller balanced buttons and no routine no-payment/coaching prose. The new prototype implements those corrections within the existing outer Ask footprint. Source Cart.tsx/cart.css informs composition; this is neither a global-cart session nor an actual cart/order mutation.

The [complete current inventory](PANEL-r3-CONTENT-INVENTORY.json) lists every55VI/EN key, old/new values, nine added/changed keys and18removed keys. Three new keys support per-item unit, photo alternative and truthful photo fallback. Public chrome literals are retained as an inert context proxy. Image/quantity/unit/total/terms remain illustrative rather than current stock, price or official terms. Actual private Profile/address/recipient/Membership save behavior stays outside this prototype and retains its own native Save/Cancel and server persistence.

| Surface/job | Current VI / EN | Behavior evidence |
| --- | --- | --- |
| Catalog-specific order action | Tạo đơn / Create order | Existing selection review; no Add to cart/Pay or completed-order meaning |
| Compact form actions | Về chat / Back to chat; Cập nhật / Update selection | Native validation and fresh review, not commercial dispatch |
| Secondary disclosure | Điều khoản / Terms | Blue same-row native summary, expands in the stream |
| Photo | White AIRism; unavailable alternative for black/error | White-only public reference; neutral fallback verified after black3 selection |
| Price |490000VND per shirt,980000VND for2 | Sample unit×qty, locale formatted; all-inclusive accessible unit label retained |
| Quantity | Số lượng / Quantity | Persistent native label, required/min1/max100; native invalid0 stops update |
| Expanded consequence | Recipient details before full payment | Only shown when opening Terms; default coaching/no-payment prose removed |
| Recovery | Existing unknown, not sent, stale, unavailable messages | Relevant exceptions preserved; no false durable success |

## Verified meaning and unknowns

The specific order action and material item/total/terms affordance replace redundant default prose. User explicitly asked for this simplification; it does not waive future application consent, price, ownership or payment guards. The prototype's visible receipt is not certification of a migrated real consent contract. Expanded terms retain delivery review before full payment. No new statutory/policy/retention fact is asserted.

The local prototype has no order/cart/payment/provider transport. Its confirmation therefore explicitly says not sent/no order created. Unknown outcome remains unknown after a local check, retaining the target and disabling editing. Existing official-source, retention, billing and production gates remain unchanged. Price490000VND, terms1.2 and public photograph are local design references, with no publication/license/canonical SKU clearance or stock claim.

## State coverage

| State | Result and evidence |
| --- | --- |
| Default/action | PASSED bounded desktopVI/EN/mobile: only Close toolbar; photo/item/unit/total; compact action row |
| Loading/pending/disabled | PASSED bounded Check outcome -> checking -> still unknown; editor composer visibly paused by return-to-chat placeholder |
| Empty/no result/true zero | NOT_RUN rendered; existing source empty/unavailable distinction retained. No catalog-result/zero claim |
| Success | NOT_APPLICABLE durable success in prototype; explicit local not-sent outcome verified. Actual business success NOT_RUN |
| Error/recovery | PASSED bounded unknown and native invalid0; provider/error integration NOT_RUN |
| Offline/stale/partial | PASSED bounded stale selection after Escape; offline/partial integration NOT_RUN |
| Unauthorized/forbidden | NOT_RUN authenticated/provider acceptance; source controls unchanged |
| Confirmation/destructive | PASSED local same-selection yes/notSent. No destructive action, spending or agreement executed |

## Mandatory Human Interface principles

| Principle | Status | Current bounded evidence or required limitation |
| --- | --- | --- |
| Purpose | PASSED | One chat stream and compact item/action; all nine current images |
| Agency | PASSED | Edit/back/Escape, preserved draft, native invalid0; specific Create order and no blind retry |
| Responsibility | PASSED | Unit/total/variant/terms retained; sample facts disclosed in review; truthful not-sent/unknown and image fallback |
| Familiarity | PASSED | Existing cart rhythm, native labeled fields, blue native button/summary semantics and ordinary VI/EN |
| Flexibility | NOT_RUN | Desktop/mobile/short/text200 and keyboard verified; native speech/AT, actual browser zoom, soft keyboard and real device missing |
| Simplicity | PASSED | Three controls removed; no routine coaching, card stack or footer spread; adjacent actions5px after fields |
| Craft | NOT_RUN | First-click pointer shift found/fixed/retested; native validation, focus and localization verified; actual AT/private-form integration missing |
| Delight | NOT_RUN | Compact composition and continuity observed; human layout acceptance pending |

## Platform fit and pattern checks

Target is responsive web, SatsunicGo blue-white-navy. Native buttons styled as links retain button semantics; Terms is a native disclosure. The new action buttons and mobile form fields have44px interaction height; the primary button has compact34px paint. Desktop input/select fields are36px and the inherited Send control is38px; no uniform44px target claim is made. Mobile native input text16px; EN text200 fixture has28px fields and reachable actions. This is not an Apple platform or an Apple-only convention/compliance claim; Apple HIG is not asserted as a current platform contract here. No added gesture/menu or RTL locale.

Writing/actions are concise and semantic. Ordinary disabled/editor state uses a return-to-chat placeholder rather than duplicate coaching. Consequential unknown/not-sent copy remains durable. Onboarding is unchanged. Existing Google processing notice is retained; its invisible state reserves intrinsic space and is absent from AX rather than collapsing the Send target during pointer-down/up. No permission/account/retention policy change. Locale key sets match55each; links and alternative names preserve purpose beyond color.

| Gate dimension | Status | Limit |
| --- | --- | --- |
| Human Interface principles | NOT_RUN | Required complete Flexibility/Craft/Delight evidence absent |
| Target-platform fit | PASSED bounded | Web-native semantics and touch/keyboard evidence |
| Meaning matches behavior | PASSED bounded | Local actions and typed catalog meaning preserved |
| Audience/business context | PASSED | Source-bound catalog order, not payment/global cart |
| Natural respectful tone | PASSED | Default filler removed; nine current pixels and BA source observations |
| Concision | PASSED | Item/money/actions remain; secondary details disclose only on demand |
| Actions/state coverage | NOT_RUN complete | Core local states pass; full authenticated/provider/offline paths missing |
| Data semantics/privacy | PASSED bounded | Sample/current distinction and private-save boundary preserved |
| Accessibility | NOT_RUN complete | Keyboard, new44pxaction/mobile-field targets, native validation and hidden AX verified; native AT speech/live regions missing |
| Localization/text expansion | PASSED bounded | VI/EN55keys, current EN/text200 and mobile captures; native zoom not claimed |
| Terminology | PASSED | Create order, unit/total, update selection, specific recovery remain distinct |
| In-context evidence | PASSED bounded | Nine current hashed screenshots + source/actual UI/DOM observations |

## Review and correction

Initial r3 static/BA/TL source review found no blocking wording defect. Root pointer execution subsequently found privacy collapse moved Send by25.047px, preventing the first pointer click from submitting. FE appended only `.privacy[hidden]{display:block!important;visibility:hidden}`. Current live pointer test proves unchanged605.953px Send/595.953px composer positions, cleared input and one clarification reply. Enter decimal/oversized cases preserve2/980000VND; native0 validation, black3 fallback/1470000VND, draft4Escape, short-height keyboard, EN/text200 and settled unknown were re-executed on the successor. All nine images were recaptured.

Independent final review corrected one documentation claim:44px applies to the new action buttons and mobile fields, not every desktop field or the inherited Send control. No source change was required.

Formal Product Language Gate **BLOCKED for application completion**, with formal UX QA **NOT_RUN** under its READY-only role restriction. Repository DEGRADED fallback permits these bounded root source/rendered observations but is not promoted to formal QA. Human layout approval, application integration and native/provider/production acceptance remain separate. No application edit, paid-provider request, release or memory update; memory candidates None.

# Ask panel — compact cart and form revision

Local review date:2026-10-08 America/Chicago. **DESIGN ONLY; no application integration approval.** User explicitly requests revising the current preview: remove History/VI/EN header buttons; group compact blue form actions in one row without wasted footer space; show a product thumbnail/cart item; remove routine no-payment/explanatory prose; make primary buttons smaller and balanced. This authorizes these prototype edits without another prototype permission request. Application approval remains pending.

## Intelligence and ownership

Repository Intelligence Gate rerun: **DEGRADED**. CodeGraph1.5.0/CocoIndex installed/healthy but indexes stale. Native bounded source fallback allowed. Shared HEAD53d59bd88fa7da9d1243692336ecd09b6540ea31 and dirty/concurrent application WIP preserved. No index refresh, READY claim, server restart, reseed or provider call. Shared5207 is the only frontend.

Current immutable r2 HTML9d893540cdbadf77d66e29946e103772995fcf3c5e0f95c63cb91dd63e728d07 and its plan remain historical, not edited. New HTML `docs/previews/ASK-PANEL-CONTINUOUS-r3-20261009.html` is owned by frontend_engineer only during its lease. Root owns this plan, the new image asset and rendered/content/review evidence. Technical Lead receives a read-only current receipt for final scoped review. Agents share the workspace; never revert another author's work. Existing release candidate/source/artifact stays unchanged.

## Source and design

Cart.tsx:231–283 and cart.css:67–128 use a small86×104thumbnail, native product/variant/unit price and compact actions, with60×78thumbnail under400px. PurchaseThumbnail/public media source is real app media authority; this prototype never invents an app mediaId or fetches private draft images. Adapt that row into the conversation, capped at680px: picture, name/variant/quantity/unit price, clear total and one compact Create order action with Edit.

Image reference: public [UNIQLO AIRism product listing](https://www.uniqlo.com/kr/ko/products/E448819-000/00), discovered through image search; downloaded unmodified from `https://image.uniqlo.com/UQ/ST3/AsianCommon/imagesgoods/448819/item/goods_00_448819_3x4.jpg?width=600` to `docs/previews/ask-demo-airism-white-r3.jpg`. Reference photo for local design only; no publication, stock, current-price, canonical-SKU/variant or licensing clearance claim. Sample490000VND ×2 and terms1.2 are illustrative. White photo must not represent a selected black variant: use a truthful neutral missing-image fallback for black unless a verified matching asset exists.

Outer panel dimensions/breakpoints, middle containment and composer remain r2. Remove the three specified visible/accessible controls without adding a replacement menu. VI/EN localized previews can use the documented `?lang=en` fixture; no production locale policy change is proposed by this artifact.

Remove the routine “Check the variant…” introduction, “No order/payment yet”, duplicated help and “This step does not collect payment” prose from default chat/editor. Preserve unit/total/canonical selection and exact Create order semantics. Terms remain a compact blue disclosure/link next to actions; its expanded content may carry full delivery/full-payment meaning. Recovery, unknown, stale, validation and explicit prototype not-sent outcome stay visible when applicable. No terms consent, money authority or real app review control is removed. The design's local visible receipt requires material product/variant/unit/total/terms affordance/specific action; actual domain guards remain unchanged.

Editor fits content at its natural height near the top, with blue text actions together immediately after fields, rather than a footer spread across the panel. Compact desktop control heights32–36px and13–14px labels with balanced spacing. Touch layouts retain at least44px interaction targets while avoiding oversized painted buttons. Native labels/quantity1–100 validation, inner-first Escape, draft retention, pending target and paused composer remain. Long/short/text-expanded forms still scroll inside Ask without covering the composer.

## Scope and verification

Only the new preview HTML, public reference JPEG and task docs/evidence may be authored. Application, dependencies, backend, tests, candidate artifacts, payment, auth, provider, retention and CI are unchanged. No order/cart mutation happens in this prototype, and local confirmation must not claim it does.

Verify current rendered desktop VI chat/editor, mobile chat/editor,320×480short-height, EN/text200, native field validation, Escape/draft return, guarded malformed quantity and unknown outcome. Confirm zero History/VI/EN visible controls; no horizontal overflow; form actions adjacent and inside panel; image decode and truthful variant fallback. Save exact current hashes/screenshots, content inventory/eight-principle review, independent final review and evidence report. Native AT/browser zoom/authenticated/private/production acceptance stays NOT_RUN rather than inferred from DOM screenshots. Production remains NOT_READY under existing gates; no new paid call, actual usage/cost Unavailable; memory candidates None.

## Future application approval

This proposal supersedes only the r2 presentation request. The six-file protected application delta is still a separate reviewed-plan approval decision after showing current results. No permission to change Cart, private forms, domain commands, queue/preview ownership, payment or retention is inferred from this design feedback.

## Rendered fix cycle

Precursor HTML7d010cc37b9cf46863dbb57cc3dac6d901feae30e0803d8f917324b741a8e922 passed bounded static/source review. Root live pointer testing then found `R3-COMPOSER-FOCUS-SHIFT`: privacy text hiding on textarea blur moved Send from y605.953 to631 and composer from y595.953 to621 before pointer-up. The first click focused Send but did not submit; input remained unchanged. This is an observed same-call failure, distinct from excluded shared-preview reload/stale-locator attempts.

The authorized smallest prototype correction reserves the existing notice's intrinsic row while hidden, using visibility rather than collapsing layout. Notice text/locale, submit timing, validation, visible-receipt authority and app source remain unchanged; no submission on pointer-down. Recheck first pointer click, keyboard Enter, focus/blur geometry, editor/short/text200 containment and unknown recovery; recapture all screenshots against the final successor hash. Hidden notice accessibility must remain hidden in the browser AX representation; actual native speech acceptance remains NOT_RUN.

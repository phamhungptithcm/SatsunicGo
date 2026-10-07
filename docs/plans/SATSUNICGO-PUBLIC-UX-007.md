# SATSUNICGO-PUBLIC-UX-007 v1

Status: PLAN_READY, pending explicit reviewed-plan approval. Owner request: current chat, 2026-10-04 America/Chicago, six screenshots supplied. Prior E2E-005 approval remains valid for its implementation; this delta specifies the new public conversion redesign and request entry interaction.

## Intelligence and facts

Gate executed: DEGRADED; CodeGraph installed/healthy but stale, CocoIndex installed/stale and health failed because daemon log unavailable in sandbox. Bounded rg/source/Git inspection authoritative. No installs or index repair required. Shared .ai context files are placeholders; package/source govern. React19/TS6/Vite8/Firebase; dirty shared worktree preserved. Source: src/features/requests/RequestForm.tsx exposes CSV/store/budget/date before item entry; existing schema, draft/reorder and durable operation ID protect submission. src/styles/global.css compactFooter has bottom padding120px; fixed Ask composer needs visibility-aware clearance instead of stacked static whitespace. SiteChrome brand currently includes attribution; no source logo asset found in bounded filename scan. Header lacks explicit scroll compact state. Products and membership depend on published real records; one fixture is not a full catalog.

## Concrete design

Reviewable prototype: docs/previews/PUBLIC-UX-007.html, four tabs: home/request/products/membership. Prototype only; it does not write data or submit requests. Blue #163cff, navy #111c35, white/light-gray, thin borders, compact typography. Logo proposal: original outlined parcel mark beside wordmark; existing brand asset can replace it if supplied. Attribution only in footer.

1. Request: default screen shows market US/JP/KR, one large name-or-URL field, quantity1, optional variant, clear submit. Valid pasted URL maps to URL and a readable provisional item label; no silent metadata fetch or market inference. Backend contract still requires the same validated item. Additional item button keeps up to30 items. CSV, budget, desired date, store and notes move into accessible details. Product CTA pre-fills source/market/variant safely; user can edit. Preserve saved draft, reorder, schema validation, current-UID isolation and operation ID across uncertain retries. Logged-out user fills first, authenticates at submit, keeps draft and proceeds with explicit final send; no loss/duplicate send or bypass of verifiedGoogle. Status, field error, network retry and account-order link remain visible.
2. Header: parcel mark+wordmark; remove header attribution; links plus primary request CTA. Sticky72px desktop/64px mobile, compact60px/56px after scroll threshold32px, subtle shadow. Inner spacing/mark animation180–220ms; hysteresis to avoid scroll threshold bounce; keep stable reserved header space to prevent jumps. Reduced-motion disables transition. Mobile menu keyboard/Escape/outside/focus retained; no horizontal overflow320px.
3. Footer: two compact rows, attribution and legal/support links; 24–32px spacing. Remove excessive static padding; use actual Ask expanded/collapsed/off state to reserve only necessary clearance, including safe-area. Footer final links must remain visible/reachable; short pages use viewport layout rather than giant main padding. Preserve source motion/timing of Ask itself.
4. Home: meaningful H1 'Mua hộ từ Mỹ, Nhật, Hàn'; short value copy and first request input in hero. Smaller single product/task-focused area; three brief process steps, source selection and concise question/answer content grounded in service behavior. Keep quote-before-deposit and50% accepted quote semantics. No unsupported delivery time, guaranteed availability, testimonials, fake stats or business-price claims.
5. Products: compact heading, name search and real source filters; image/card ratio4:3, title, source, valid reference price+date only when available, concise variant/detail, prominent request CTA. Detail has actual published content and safe source link, accessible image fallback, pre-filled request. Preserve loading/empty/error, pagination and published visibility. Never turn fixture into real stock.
6. Membership: clean plan comparison inspired by ChatGPT information density, Satsunic identity; real published plans only, price/period prominent, short check-list benefits, same-height cards and clear selected/current state. Logged-out CTA routes to sign-in with return; paid request is not activation. Keep invoice pending/confirmed, manual renewal intent/cancel, history, discount service-fee-only and cap semantics. No invented FREE/PRO tiers or autocharge.
7. SEO/GEO/AEO: align public UI and server initial HTML with descriptive H1/title/description, crawlable links and source-backed answers. Structured data only matches visible factual content; no guaranteed rankings or AI citations. Reference: https://developers.google.com/search/docs/appearance/ai-features and structured-data policies. Preserve draft/private isolation.

## File-by-file scope and impact

- src/features/requests/RequestForm.tsx: quick item entry, progressive options, auth/draft handoff; domain parser helper under packages/domain only if necessary, no schema migration.
- src/app/SiteChrome.tsx + src/styles/global.css: original mark, scroll state, compact navigation/footer and responsive tokens; retain staff/access behavior.
- src/app/App.tsx: compact Home and public how-it-works copy; preserve private routes/keys.
- src/features/content/Content.tsx + src/shared/public-content.ts: catalog/detail composition and prefill, actual content types.
- src/features/membership/Membership.tsx: presentation and logged-out/current-plan CTA; preserve existing handlers/listeners.
- src/features/ask/Ask.tsx: minimal root visibility/class coordination for footer clearance only, no new Ask interaction design.
- packages/domain/public-content.ts, functions/src/public.ts or public renderer actual entry: sync truthful metadata/initial HTML if changed; inspect before any edit.
- tests/unit and tests/http: meaningful parser/draft/HTML/regression checks; docs/reviews and runbook evidence.
- Generated public asset manifest: regenerate only through npm run build.

Risk MEDIUM: request draft/auth/prefill and shared chrome; LOW: presentation; public rendering/data leakage MEDIUM. No database schema/rules/auth/provider/pricing changes planned; no dependencies/cloud/deploy/push/real transactions. Coordinate shared source ownership via docs/team before editing; do not touch another session's active files until released.

Alternatives: a multistep wizard adds screens and remembering; keep one default quick form and optional details. Do not remove advanced business fields. Do not fabricate catalog or plan content to fill grids. Rollback scoped source diff, retain persisted requests/ledger.

## Verification / acceptance

- Current typecheck/lint/build; relevant unit/HTTP initial HTML, schema/draft/URL prefill/idempotency checks. No emulator database reset while demo used by another session.
- Authorized browser320/390/768/1440, zoom200%, keyboard, reduced-motion, scrolling shrink/restore, long text, mobile menu; current screenshots.
- Request name-only and URL-only, multiple items/CSV invalid, options, auth draft retention, same-payload retry, validation, post-success order tracking; fakeGoogle emulator acceptance separate from live OAuth.
- Product empty/loading/error/filter/detail/prefill; membership actual plans/signed-out/current/pending/renewal; footer with Ask expanded/launcher/closed states and bottom links visible.
- Inventory every changed visible/accessibility string and state, eight Product Language principles with actual in-context evidence; source-only is not final PASS.
- Fresh final implementation review, fix approved findings, verify again; report readiness and outstanding evidence. Prototype is a proposal, not completed implementation or production acceptance. Tokens/cost unavailable; memory candidates None.

Approval requested: PUBLIC-UX-007 v1 local implementation and emulator/browser verification only.

## Owner refinement — unified box (2026-10-04)

Replace separate product name/URL/image controls with one accessible composition box. Textarea accepts product name, description and pasted URL; attachment tray accepts clipboard image files, drag/drop and native file picker (mobile fallback). Preserve ordinary text paste and mixed text/image paste. Thumbnail remove controls have accessible names; drag state never replaces keyboard operation. Quantity defaults1; variant/additional options progressive. Do not guess whether unrelated pasted links describe multiple items; ambiguous content needs review before creating lines. Multiple pictures alone default to one described item, not silent separate orders.

Prototype updated with local thumbnail preview/removal, paste/drop and max6 PNG/JPEG/WebP images2 MB each. Object URLs are local only. Image-only input must be accepted in actual implementation using a truthful provisional label 'Sản phẩm theo ảnh', editable before quote; source market remains an explicit choice. Do not invent product identity from image. Backend can record the request then associate private request images through existing uploadOrderImage; verify owner/category/image limits and durable replay. Freeze attachment set and content for uncertain retries. Show per-image upload state; retry only failed attachments against same created order, never resubmit a duplicate request. Do not display fully sent-with-images success while an attachment failed. Authentication retains draft and in-memory image files until user leaves/reloads; if refreshed before upload, clearly request reattachment rather than falsely claiming image preservation. Size/count must be validated on client and backend; never trust MIME alone. Private receipts never become public.

Additional impact: request item normalization and post-create private image upload integration; existing rules/private-media handler remain authority. Relevant tests: name-only, URL-only, image-only, mixed clipboard, text-only paste unchanged, rejected type/oversize/count, duplicate/retry, sign-in attachment retention, failed upload recovery and cross-customer denial. No additional provider or image AI dependency. Pending approval remains PUBLIC-UX-007 v1 including this owner refinement.

### Unified composer visual refinement

Owner requests no visible label: use placeholder plus persistent accessible name (aria-label), not placeholder-only accessibility. Refined proposal uses a single neutral rounded surface, normal-weight16px placeholder, icon attachment picker with accessible name/title, local64px thumbnails and remove controls. Drag-over overlay gives explicit drop target without pointer interception; paste and native picker remain alternatives. Focus ring quiet but visible, restrained180ms transitions and reduced-motion off. No separate name/link/image input surface, no duplicate outer label. Prototype textareas now satisfy this composition; actual implementation remains subject to reviewed-plan approval and current browser verification.

### Compact refinement

Owner requests fewer repetitive labels. Composer retains only concise placeholder 'Tên, link hoặc ảnh sản phẩm…', accessible name and attachment icon; removes idle help row and per-image success chatter. Keep only necessary validation/error/upload state. Padding12–14px, textarea minimum54–58px, thumbnail56px. Avoid repeated copy outside the composer.

Owner refinement: around the request composer, retain only the heading “Bạn muốn mua gì?”; remove repeated introductory/payment/sign-in helper paragraphs and request eyebrow. Necessary validation and actual auth/upload state remain contextual, not idle explanatory text.

### Approved owner steering after implementation starts
User: “trang chủ hiện tại khá clean rồi trang này nên ở yêu cầu mua hộ”. Preserve Home unchanged; remove planned hero redesign/composer and Home-function edits from implementation scope. Unified composer lives only at /request. Shared navbar/footer and products/membership remain in approved scope. No Home marketing rewrite in this task.

## Approved product refinement
Owner requests full product details (origin/function/use) and explicitly selects SatsunicGo-curated ordering. Add backward-compatible optional featured, featuredOrder0–9999, origin/functions/usage max4000 each in existing authorized saveContent schema, editor, public type and renderer. Published legacy records remain visible until explicitly deselected. Order within existing30-record published window, disclose that limit; a full-catalog ranking beyond that needs a separate query/migration design. No automatic request-count ranking. Product CTA prefills actual product name/referenceURL/source; never infer manufacturing origin from purchase country. Existing media/publication/security bounds retained.

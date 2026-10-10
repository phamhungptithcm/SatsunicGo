# SatsunicGo customer email — final design proposal v2

Status: **DESIGN COMPLETE / NOT INTEGRATED**. 2026-10-09 America/Chicago. Supersedes the v1 visual/copy artifacts archived under `v1/`. User explicitly requested a more compact, professional design with the project's actual branding and links. This revision covers all 42 scenarios, not a single showcase.

## Brand and links verified from source

- Wordmark: **SatsunicGo**, navy `#111c35` + blue `#163cff`; spelling and split from `src/app/SiteChrome.tsx:274`; attribution **by HunpeoLabs** from its footer.
- Palette and border `#e2e6ef` from `src/styles/global.css`. Email uses Arial/Helvetica system fallbacks; no font download, logo-image dependency or external artwork. The live site box mark remains available in `public/favicon.svg`, but SVG is deliberately not required to read or identify the email.
- Origin: `https://satsunicgo.web.app`, verified from `functions/src/public.ts` PUBLIC_ORIGIN fallback and `public/robots.txt` sitemap. Production renderer must use deployment-approved configured origin.
- Links: home `/`, account `/account`, support `/support`, terms `/terms`, privacy `/privacy`, Membership `/membership`, documents `/account/documents`; routes verified in App and footer.
- Actual live availability **NOT_VERIFIED**: native HTTP requests returned URLError and web tool could not access the origin. Source-valid links are not presented as proof of deployed/authenticated behavior.
- No invented support email, phone number, social page, company address or tax registration. No sender address implied by the display name.

## One shared design for every event

1. **Header:** linked navy/blue wordmark, small attribution, thin divider.
2. **Status + heading:** short human-readable state, headline without repeating long order IDs or the full subject.
3. **One-sentence lead:** the fact or decision the customer needs. Essential uncertainty preserved.
4. **Optional amount panel:** blue amount on a pale blue surface. Only for actual money events: quote, confirmed payment, price proposal, final balance, excess, refund or allocation. Labels distinguish received, proposed, due and recorded refund.
5. **Small fact table:** exact order/parcel reference and 1–4 relevant facts; no repeated paragraph of the same values. Variable length wraps; money and currency stay together.
6. **One primary link:** a descriptive action/destination, minimum practical tap height 44px. Email GET navigates, never pays, accepts a quote or refunds.
7. **Optional short close:** thanks at request/payment/delivery; important qualification at refund, cancellation, ETA and documents. No repeated ceremonial sign-off.
8. **Shared footer:** Tài khoản · Hỗ trợ · Điều khoản; Quyền riêng tư · SatsunicGo by HunpeoLabs. Live source routes, no placeholder `#` links.

Card maximum 580px; desktop padding 32px, mobile 22px. H1 27/35px (mobile 24/31), body 14/23, facts 13/21, amount 34/44 (mobile 30/40). Blue is the brand/action color; amber only accompanies explicit “Cần bạn xem” wording, not color-only meaning. No shadow-heavy panels, decorative illustrations, gradients, celebration or animation.

## Scenario adaptation

| Family | Primary information |
| --- | --- |
| Payment/quote/refund | One amount + correct scope label, order reference, relevant financial qualification |
| Price/item decision | Proposal total/old total/difference or new item and cost impact, explicit customer choice |
| Warehouse/purchase | Per-item quantities, partial vs complete, issue detail when present |
| Delivery | Parcel/order reference, carrier/tracking/items; partial vs full delivery separate |
| Membership | Actual plan name and exact term; no repeated “Gói Gói”, no auto-renewal claim |
| Support | Short message alert and conversation destination; no private message body or internal notes |
| Documents | Document reference/type and tax-invoice qualification, no duplicated receipt success |

## Deliverables and integration contract

- `TEMPLATES.vi.json` schemaVersion 2, template version 2: all typed field inventory + semantic `design.heading/lead/details/hero/closing/treatment`.
- `templates/*.html` and `templates/*.txt`: 42 raw template pairs with placeholders; **not approved application code or a production renderer**.
- `samples/*.html` and `samples/*.txt`: 42 fictional rendered examples for review. Never send samples to real customers.
- `preview.html`: one-at-a-time selector, group filter on desktop and native select on mobile. Loads a single local sample iframe; script is only in the preview, never in email templates.
- `design-v2.py`: artifact-only deterministic builder, preserves v1 and updates all 42 outputs. Not an app import.

Raw template `{{ctaUrl}}` must be supplied by an authenticated server mapping to the exact owner-scoped entity. Prototype uses real account-level routes because its references are fictional; it does not fabricate real order IDs. Renderer must HTML-escape/attribute-escape each value, reject header CRLF and unapproved origins, validate required typed values, and preserve immutable versions/idempotency. A raw string `.replace()` of untrusted values is not an acceptable renderer.

Financial guard from INTEGRATION-PLAN still applies: reserved refunds can make available money differ from net paid. The compact final-balance template is blocked if its two displayed facts and requested balance cannot be represented truthfully; add the reservation row in implementation if needed. Final design feedback does not approve financial/backend changes or enable provider delivery.

## Verification

All 42 samples exercised at browser 320px through the real selector: one H1 each, no horizontal overflow in gallery or iframe, no unresolved placeholders. Evidence: MOBILE-AUDIT-v2.json. Screenshots: design-v2-desktop.jpg, design-v2-320.jpg, design-v2-390.jpg. All links syntactically point to source-verified origin/routes; no fake order deep links or arbitrary recipient/action URL. Structural checks cover raw HTML/text parity and no script/form/image requirement.

Browser proof is a disclosed proxy. Gmail/Outlook/Apple Mail, screen reader, mail dark mode, actual provider delivery and authenticated deep-link acceptance remain NOT_RUN. No “email-client compatible” or production-readiness claim is made from the browser screenshots.

Review: v2 cycle 1 redesigned all layouts/content; cycle 2 corrected title escaping, supplied raw text parity and variable contracts, verified all 42 mobile cases. Final artifact review scoped PASSED; actual integration remains pending previously documented approval.

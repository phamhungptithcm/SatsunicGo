# Product content review — SATSUNICGO-001

Decision: BLOCKED. Date: 2026-10-04. Audience: Vietnamese customers and authorized staff. Platform: responsive web; existing HunpeoLabs motion reference and Satsunic white/blue visual direction. Apple-only controls are not a requirement. Review references: `.ai/templates/product-content-review.md`, product-content profile, source inventory `CONTENT_STRING_INVENTORY.json` (superset extraction, not complete semantic review).

## Verified behavior and meaning

Transfer notification persists pending review and never changes collected money. Integer VND totals distinguish estimated quote, 50% deposit, actual net collected (collected minus refunded), approved final charge and outstanding balance. Zero is formatted as zero, unknown commercial pricing is unavailable. Approved rational FX and membership snapshots are server-bound. Profile advertising consent is explicit, persisted and recorded in append-only consent history. CRM unknown final charges are shown as not finalized; dashboard counts are labelled bounded UTC observations, not total-business metrics. Campaign copy is manual draft/copy behavior, not external posting. Requests permit no-link products and multiple bounded lines within one origin. Customer and staff views have bounded listeners/queries and current server authorization.

Quote expiry is shown in the browser locale/timezone; a timezone-label review remains open. A customer-facing estimate is not verified stock or a delivery guarantee. Empty catalogs and membership offers show unavailable data rather than sample offers. Failed calls do not optimistically mark paid, purchased or shipped.

## State and content inventory

| Surface | Covered source states | Evidence | Remaining |
| --- | --- | --- | --- |
| Request/CSV | default, limits, invalid import, sign-in, sending, error | RequestForm.tsx, csv.test.ts | Browser import and keyboard |
| Profile/address | owner-only, loading snapshot, save, error, consent | Profile.tsx/workspace.ts | Conflict/lost-edit rendering |
| Order/transfer | quote acceptance, expiry, deposit/final balance, hold, pending transfer, error | App.tsx/TransferNotice.tsx, domain/handler tests | Responsive and all actions in context |
| Staff/content/membership/support | private access, bounded empty/error, persisted commands | feature sources and handlers | Staff task completion, ticket threads, commercial forms |
| Ask | idle, hint, open, close, reply, cancellation, backend failure, reduced motion | HunpeoLabs hashes, Ask.tsx/module.css | Reference parity at 390/768/1440, focus/keyboard, screen reader, live provider disclosure |

String extraction contains JSX text, accessible attributes and literal strings, plus internal candidates. Every changed string still requires state classification and in-context acceptance; this inventory does not satisfy that gate alone.

## Eight principles

| Principle | Source assessment | Gate |
| --- | --- | --- |
| Purpose | Request and order steps support buying and understanding cost | BLOCKED: rendered task evidence missing |
| Agency | Customer accepts quote/final charges; transfer report is distinct from verified funds | BLOCKED: complete confirmation UI not verified |
| Responsibility | Server owns money, rights and shipping gates; unavailable providers fail closed | BLOCKED: live provider/MFA evidence missing |
| Familiarity | Vietnamese purchase and bank terminology, standard web labels/details/forms | BLOCKED: accessibility and domain review incomplete |
| Flexibility | Multi-line requests, CSV, no-link products, reduced motion branches | BLOCKED: mobile/keyboard/English coverage incomplete |
| Simplicity | Quote fee breakdown and current balance are explicit | BLOCKED: density and wrapping not reviewed live |
| Craft | Integer currency display, expiry, pending and safe failure messages | BLOCKED: all states and timezone labels incomplete |
| Delight | Reference hint/morph/scroll cleanup retained in source | BLOCKED: visual and interruptibility parity unverified |

Browser automation rejected access to the existing local URL under its URL security policy. No alternate automation surface was used to bypass this rejection. The review remains BLOCKED; no 100% parity or product-language acceptance claimed.

Current refresh: Node22 suite 29 unit / 23 Rules checks and HTTP HTML/metadata fixtures pass. Request condition/preferences, change proposal confirmation, finance pending review, staff access, membership, CRM/dashboard, campaign/media rights and privacy intake strings are included in refreshed inventory. These have source-level meaning review; rendered per-state acceptance remains BLOCKED. No principle is promoted to PASS from compiler or string extraction.

UI-002 current slice review: UI-002-CONTENT_REVIEW.md inventories shell/catalog/toast states and maps all eight principles. Current 39-unit checks do not promote any rendered principle to PASS.

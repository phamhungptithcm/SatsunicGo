# Product content review — 2026-10-17

Scope: Vietnamese public purchase terms; Vietnamese/English product options in cart, checkout, Ask selection. Web platform; native HTML labels/selects and project blue/navy design. No Apple platform contract applies. Reviewed by the implementing agent against actual source and rendered UI.

Verified meaning: `catalogOptions` is the exact source of purchasable options. One option is displayed as a specification; multiple options require selection. Empty options invent no specification; stale nonempty options are never automatically replaced. Checkout preserves pending selection and cart version review. The terms use `packages/domain/public-content.ts` for both client and Functions public content. `Support.tsx` supplies authenticated support tickets. `changes.ts` uses accepted proposals, immutable catalog totals, actual costs and return checks; refunds distinguish requests from recorded movements. No fixed refund SLA, new fee, product claim or forfeiture of consumer rights was invented.

Legal reference checked: https://xaydungchinhsach.chinhphu.vn/luat-bao-ve-quyen-loi-nguoi-tieu-dung-sua-doi-nguoi-tieu-dung-co-nhung-quyen-gi-119230623174030727.htm. This is editorial grounding in consumer information, choice and complaint rights, not a legal certification of the whole business.

## String inventory

| Location | State | Before → after | Purpose/evidence |
| --- | --- | --- | --- |
| purchaseTerms title/intro and seven headings/bodies | Default | Three sections including unapproved placeholder → seven specific sections | Price, changes, cancellation, defects, change of mind, refunds, support/privacy; shared server/client data |
| TermsPage action | Action | Request purchase → Contact support | `/support` exists and supplies support tickets |
| CatalogOption | Single valid | Dropdown with one option → Quy cách / Product option plus exact value | Removes redundant decision; retains actual SKU specification |
| CatalogOption | Multi/empty/stale | Mẫu / Color-size-variant → Chọn quy cách / Choose product option | Native required select; stale value displays placeholder |
| Checkout | Invalid/stale | Mẫu → quy cách | Consistent correction guidance; price review remains |
| Checkout | Terms | Added Xem điều khoản đổi trả và hoàn tiền | New tab preserves current selection; noopener/noreferrer |
| CatalogChat | Invalid | Mẫu/variant → quy cách/product option | Existing stale recovery remains |

Loading, pending, disabled, offline, authentication, error and success messages remain inherited from the original caller; controls retain disabled flags. Single valid specification is static and not focusable. No-option field is omitted. No network or write action was added. Confirmation and financial state transitions remain unchanged.

## Principles and platform fit

| Principle | Result | Evidence |
| --- | --- | --- |
| Purpose | PASSED | Seven policy sections tell customers what to do; actual specification next to quantity |
| Agency | PASSED | Multi-option choice, support route, consent before changes and return costs |
| Responsibility | PASSED | Pending refund distinguished from transferred money; no fixed SLA or guaranteed supplier acceptance |
| Familiarity | PASSED | Quy cách, chai, viên, ml; native select/input and existing web design |
| Flexibility | PASSED | Support for cancellation/partial return/defects; explicit multiple choices remain |
| Simplicity | PASSED | Single option shown without redundant dropdown; no generic color/size on supplements |
| Craft | PASSED | Real TermsPage at desktop, 390 and 720 px; zoom 200% scrollWidth=client width 756 |
| Delight | PASSED | Customers immediately see exact product contents and can proceed without extra selection |

## In-context evidence

CUA Chrome served from isolated authorized `127.0.0.1:5208`. Actual TermsPage rendered with app shell at desktop and framed 390/720 px. Component harness imported actual CatalogOption, cart CSS and global CSS, showing oil 36 ml, biotin 100 capsules and lip oil Cristal Clear 101 5 ml at 320/720 px. Harness surrounding cards are fixtures, not production catalog evidence. Native select changed to 60 ml; action became enabled and status showed the exact value. Escape/Tab moved focus from select to Continue; accessible names observed. Actual Chrome zoom confirmed 200%; terms width and scroll width both 756. No horizontal clipping observed. Full screen-reader narration was not tested.

Screenshots in task artifacts: terms-responsive-local.png, options-responsive-local.png, terms-local-desktop.png, terms-local-200.png. Desktop styling: terms uses existing stylesheet; no new animation, no app-specific Apple conventions. Vietnamese text expansion and long specification wrapping observed. English labels rendered in unit check.

Product Language Gate: PASSED for changed scope. Publication must still pass the exact-SHA production pipeline and public readback. No claim of live refund execution or payment-provider verification.

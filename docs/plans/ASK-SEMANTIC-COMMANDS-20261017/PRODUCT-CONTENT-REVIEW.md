# Product Content Review

Surface: Ask conversation, product selection and embedded canonical purchasing. Audience: customers describing shopping/service needs naturally. Platform: responsive web, existing SatsunicGo blue/navy styles and native form/dialog semantics. Locales: Vietnamese/English controls, multilingual generated text. Reviewer: Codex, 2026-10-17. Apple HIG platform compliance: not applicable; the skill's eight human interface principles are a quality reference, not an Apple UI specification.

## Inventory and meaning

| Changed content | State and purpose | Verified behavior |
| --- | --- | --- |
| `Thêm vào giỏ` / `Add to cart` | Deliberate confirmation of selected item | Calls existing cart merge after current product/version/variant check; no order or payment |
| “có thể nhắn để sửa mẫu hoặc số lượng” / “Ask to change the variant or quantity” | Editing help | Gemini select_product uses current selected context; controls remain editable |
| “Giá được kiểm tra lại…” / “The price is checked…” | Consequence and freshness | Fresh product read before add; canonical checkout preview rechecks price |
| “Chưa xác nhận được lần thêm vào giỏ…” | Unknown mutation result | Directs customer to inspect cart, does not claim failure or auto-repeat |
| “Chưa thêm được sản phẩm…” | Stale/read failure | Visible alert retains candidate and offers re-selection; no mutation on stale data |
| `Giỏ hàng` / `Cart`, `Thêm món mua hộ` / `Request an item` | Utility navigation | Opens canonical component inside Ask; disabled during pending operations |
| `Mua hàng` / `Purchase`, `Kiểm tra sản phẩm` / `Review product` | Task headings | Names current surface rather than implying a submitted buying request |
| `Mua hàng trong Ask Anything` / `Purchase in Ask Anything` | Region accessible name | Real named section containing reused canonical components |
| “Kiểm tra sản phẩm, người nhận và tổng tiền…” / “Review items, recipient and total…” | Checkout consequence | Order commit remains a separate explicit customer control; payment state comes from backend |
| `Đang mở tác vụ mua hàng…` / `Opening purchase…` | Lazy-loading feedback | Suspense loading state, never a success message |
| “câu hỏi và tối đa 6 lượt hội thoại…” / “question and up to 6 recent turns…” | Privacy notice | Matches approved bounded redacted history sent to Google; explicitly states filters can miss details |
| `Kiểm tra thông tin` / `Review information` and neutral system-status explanation | Model completion-claim fallback | Replaces unverified submission/payment prose; preserves only admitted read/navigation proposal |
| Gemini response title, paragraphs, bullets | Conversation/clarification | Untrusted plain React text, no HTML/code execution; contentLanguage and dir=auto support language and bidi rendering |

Canonical recipient, cart total, payment, request form, validation and receipt strings are reused unchanged. Their values retain existing sources and units. “Total” on product selection means listed unit price × quantity, before checkout shipping; final order total comes from the canonical checkout preview. Missing/unknown payment remains unknown, never paid.

## In-context evidence and state coverage

`tests/browser/ask-semantic.spec.ts` renders actual Ask, CatalogChat, Cart and PurchaseCheckout, with synthetic service boundaries. `output/ask-semantic/checkout-{1440,390,320}.png` captures current rendered layouts; viewport checks pass. Role-based browser assertions inspect accessible regions, titles, controls and alerts. Keyboard entry/Enter submission is exercised. Human screen-reader listening was not performed; this is bounded DOM/accessibility verification, not full accessibility certification.

- Default/selected: Japanese query reaches semantic transport unchanged, response title remains Japanese, two White/L items populate exact controls; cart total is 700,000 VND from synthetic product data.
- Pending/disabled: explicit cart and purchase requests expose busy state and disable conflicting utility navigation. No order command occurs from model response or Add to cart.
- Empty/clarification: zero-command conversation returns to visible chat on mobile; cart supports canonical empty state.
- Success: cart mutation is acknowledged before opening cart; order/payment success belongs to existing canonical handlers. Eleven local HTTP checks validate demo payment/receipt boundaries.
- Error/recovery: model unavailable exposes retry; stale product version displays the new error and sends zero cart mutations. Unknown-state canonical payment/retry behavior is covered by HTTP checks.
- Offline/stale/partial: existing canonical offline/cache/recovery controls retained; source query pagination retains filtered budget without mutating cached results. No new offline success promise.
- Unauthorized: existing sign-in/account fencing and server owner validation retained; no new guest AI access or financial write.
- Confirmation: selection → cart → recipient/total → explicit checkout confirmation. No conversational “yes” becomes payment authority.

## Mandatory principles

| Principle | Result | Evidence |
| --- | --- | --- |
| Purpose | PASSED | Natural conversation resolves to an editable selection or relevant utility; no exact wording instructions |
| Agency | PASSED | Editable variant/quantity, back-to-chat, separate Add to cart and checkout confirmation |
| Responsibility | PASSED | No model payment authority; disclosed Google context transfer and imperfect redaction; sandbox boundary in release report |
| Familiarity | PASSED | Existing web cart, recipient form, links, buttons, status and errors reused |
| Flexibility | PASSED | Three viewport checks, multilingual provider samples, locale metadata/bidi text, keyboard submission, existing manual controls |
| Simplicity | PASSED | One command per turn; clarification instead of guessed mandatory values; no internal command/schema names in product flow |
| Craft | PASSED | Stale selection error visibility and mobile response visibility found and fixed; privacy wrapping adjusted after screenshot review |
| Delight | PASSED | Contextual “that one / two / white large” interpretation reduces repeated entry; conversation remains editable and recoverable |

Target-platform fit, meaning, context, respectful tone, brevity, state coverage, data semantics, terminology and in-context verification: PASSED within the evidence above. Existing canonical forms are not newly translated into every model language; multilingual interpretation is not a full application-localization claim. Text expansion is bounded by responsive wrapping and scrollable task content; large text/voice-input/human assistive technology exhaustive coverage remains outside this scoped verification.

Product Language Gate: PASSED for this bounded change. Residual risks and production gates are in REVIEW.md. No new brand assets, Apple-specific expression, marketing guarantees or fabricated business rules.

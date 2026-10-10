# Catalog chat content review

Scope: Ask, CatalogChat, numbered CatalogSearch links and Commerce recovery/snapshot messages. Customers select a listed product by chat, edit its variant/count, review VND totals and explicitly create an order. Browser web surface, VI/EN; existing blue/white/navy Ask controls, no Apple assets or Apple-platform compliance claim. Root review 2026-10-08 UTC. Based on the repository's write-product-content skill, product-content profile and bundled Human Interface principles/surface patterns. Original server catalog/custom rules verified in source.

Facts: catalog product is published/orderable, has a positive listed VND price, source market, product version and terms version. Backend rechecks version/options/total; catalog creation sets collected=0 and does not issue a custom staff quote. A selected catalog item does not submit a preserved custom draft. Public selection is ephemeral, fenced to identity/conversation and expires after five minutes. A stale source cannot be selected. Private recipient fields never enter this selection or its browser pending envelope. Real merchant research/stock/reviews, provider calls and production acceptance remain unavailable/unverified.

## Changed content inventory

| Location/state | Vietnamese | English | Meaning/evidence |
|---|---|---|---|
| CatalogSearch result link | `1. {title}`, `2. {title}`… | Same | Position in displayed list, including quote-only rows; source title unchanged; ordinal unit/browser cases |
| CatalogChat region | Sản phẩm đang chọn | Selected product | Selected public catalog snapshot |
| Product heading | Published title | Published title | No translated/invented product name |
| Source field | Mua từ | Source market | US/JP/KR from product, cannot change to a different market through chat |
| Unit amount | Giá mỗi sản phẩm | Price per item | Listed VND price; localized grouping and ₫ unit |
| Variant label | Màu / size / phiên bản | Color / size / variant | Required native select when options exist; decorative required mark |
| Variant placeholder | Chọn phiên bản | Choose variant | Empty choice cannot create a multi-option order |
| Options | Original catalog option | Original catalog option | Only canonical listed values; no fuzzy guessed variant |
| Quantity | Số lượng | Quantity | Required integer 1–100; visible one-unit default |
| Total | Tổng tiền | Total | Unit price × count, positive/bounded; hidden if incomplete/invalid, no synthetic zero |
| Edit/confirmation help | Anh/chị có thể sửa bằng chat, ví dụ “số lượng 2”. Kiểm tra mẫu và tổng tiền, rồi nhắn “xác nhận lựa chọn và tạo đơn”. | Edit by chat: “quantity 2”. Review the variant and total, then type “confirm selection and create order”. | Supported exact command example; review precedes consequential action |
| Price/payment explanation | Giá được kiểm tra lại khi tạo đơn. Hàng trong danh mục thanh toán đủ trước khi xử lý. | The price is checked again when creating the order. Catalog orders require full payment before processing. | Server price/version and existing full-payment catalog semantics; never says paid |
| Terms | Điều khoản: `{termsVersion}` | Terms: `{termsVersion}` | Actual product terms revision; no invented legal text |
| Incomplete/expired status | Chọn mẫu hợp lệ và số lượng từ 1 đến 100. Nếu lựa chọn đã cũ, hãy tìm sản phẩm lại. | Choose an available variant and a quantity from 1 to 100. Search again if this selection has expired. | Clear repair instructions; native disabled action and chat guard |
| Submit button/command | Xác nhận lựa chọn và tạo đơn | Confirm selection and create order | Explicit catalog consent; disabled for guest/busy/pending/invalid selection |
| Chat update heading | Đã điền sản phẩm đang chọn | Selected product updated | Preview update, no purchase/payment claim |
| Chat update explanation | Em đã điền vào thẻ bên dưới. Anh/chị kiểm tra mẫu, số lượng và tổng tiền trước khi xác nhận tạo đơn. | The selection is filled in below. Review the variant, quantity and total before confirming the order. | Actual controlled fields and displayed amount verified |
| Clarification heading | Anh/chị muốn chọn mẫu nào? | Which variant would you like? | Clarification applies also to stale/unavailable selection; explanatory text identifies the repair |
| Clarification explanation | Chọn sản phẩm trong danh sách mới nhất, rồi cho biết mẫu và số lượng từ 1 đến 100. Giá và thị trường theo sản phẩm đang chọn. | Select a product from the latest list, then specify its variant and a quantity from 1 to 100. Price and source market follow the selected product. | Does not infer a product, new market or price; rejects unrelated custom submission |
| Guest heading | Đăng nhập để tạo đơn | Sign in to create an order | Authentication required for server command |
| Guest explanation | Đăng nhập, tìm và chọn lại sản phẩm để tạo đơn trong tài khoản của anh/chị. | Sign in, then search and select the product again to create an order in your account. | Guest choice cannot transfer consent to another account |
| Success heading | Đã tạo đơn | Order created | Requires validated command result and current owner/conversation |
| Success explanation | Đơn đã được tạo. Anh/chị xem trạng thái và bước thanh toán trong thẻ đơn bên dưới. | The order was created. Review its status and payment step in the order card below. | Payment is a next step; order readback uses existing card, live deployed readback not certified |
| Malformed result alert | Chưa xác minh được kết quả. Hãy đối chiếu thao tác đang chờ trước khi thử lại. | The result could not be verified. Recover the pending action before trying again. | Preserves pending ID; avoids blind new submission |
| Recovery failure alert | Chưa đối chiếu được thao tác. Thử lại; không gửi yêu cầu mới. | The pending action could not be recovered. Retry recovery before sending a new request. | Existing operation remains pending; VI/EN actual recovery failure cases |
| Corrupt envelope alert | Chưa đọc được thao tác đang chờ. Liên hệ hỗ trợ để đối chiếu. | The pending action could not be read. Contact support to reconcile it. | Never removes corrupt identity or sends it to a different conversation |
| Invalid conversation alert | Chưa xác minh được hội thoại. Hãy tải lại hoặc liên hệ hỗ trợ. | The conversation could not be verified. Reload or contact support. | Blocks hydration/composer; appears in idle surface and current panel without exposing foreign draft |

## State coverage and data semantics

Default/selection/edits: actual Ask → actual CatalogSearch → domain parser → controlled CatalogChat and CommercePanel; VI/EN happy cases. Manual variant/count fields and chat edits reflect each other. Loading/pending/disabled: existing Ask phase/busy and recovery controls, native disabled create/select/count controls; unknown/malformed replies never show a created-order heading. Empty/unorderable/out-of-range: clarify; no invented product or zero price. Success: validated ID/version, repeated confirmation sends no second catalog command. Errors: invalid option/count rejects all edits; stale/expired/account-switch/reload/new mixed search invalidate selection. Unauthorized: guest can preview/edit; command blocked and sign-in message shown. Confirmation: review + explicit complete command; questions/negation/mixed transactions never consent. Existing catalog button path and preserved custom draft remain available when no chat choice is active.

Quantity-one and single-option defaults match the existing catalog form and are visible before confirmation. A source cache miss is not exhaustive catalog absence. Five-minute expiry does not refresh when reopening the panel/paginating the same list. Amounts are catalog VND totals, not exchange-converted research estimates, staff quotations or collected money. Partial/unknown amounts do not become zero. Terms are the published revision identifier; full terms navigation is the existing product link. No new privacy permission or raw chat learning retention is added.

## Mandatory Human Interface principles

| Principle | Bounded result | Current in-context evidence |
|---|---|---|
| Purpose | PASSED | The selection card contains product/market/variant/count/total and one creation action; current VI/EN rendered form inspected |
| Agency | PASSED | Edit through chat or native controls; multi-option requires a choice, review precedes creation, questions/guest/mixed custom commands cannot submit |
| Responsibility | PASSED | Server rechecks price; full-payment consequence stated; no paid claim; corrupt/unknown outcomes preserve identity and provide recovery |
| Familiarity | PASSED | Numbered product list, existing catalog terms, native selects/number input and familiar Vietnamese labels; LLM is not artificially translated into product copy |
| Flexibility | PASSED | VI/EN current renders, keyboard Enter, mobile 390px and manual control cases; zero horizontal dialog overflow; Safari/assistive technology not certified |
| Simplicity | PASSED | One selected product and explicit next action; unrelated custom form suppressed while selected, saved draft retained; no technical recovery payload exposed |
| Craft | PASSED | Real controlled field values, VND grouping, required labels, error/recovery states, account/reload fences and immutable scenario evidence |
| Delight | PASSED | A chat edit fills the real preview without navigating away; familiar composer focus/controls and existing brand retained, no decorative interruption added |

Platform fit: native browser roles/labels/validation, existing Ask design system; no new motion or Apple-only expression. Keyboard and mobile state tests are bounded evidence, not WCAG/Safari/AT certification. Applicable patterns reviewed: labels/controls, respectful feedback, consequential choice, contextual help, authentication/privacy and text expansion. RTL is NOT_APPLICABLE to current VI/EN locales.

Verification: tests/browser/ask-catalog-chat.spec.ts (24 cases including guest); tests/unit/catalog-chat.test.ts (34); ask-command-result.test.ts (35); ask-conversation-snapshot.test.ts (13); two actual catalog handler scenarios. Shared frontend 5207; actual Ask/Commerce hook/panel/CatalogSearch/CatalogChat with synthetic auth/API/Firestore snapshots. Actual server handlers run against demo Firestore with crafted auth. Additional same-component screenshots at desktop 1280×1000 and mobile 390×844 show the full form/scrollable mobile content; output/ask-catalog-evidence.config.ts introduces no server.

Scoped product-content review passes for executed states. Full Ask product-language/release gate remains BLOCKED: general free-form understanding, web/merchant/provider answers, other account/service locales and authenticated production journeys remain incomplete. Screenshots alone are not live-provider or production evidence.

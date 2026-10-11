# Product Content Review — research and answer feedback

## Scope

Audience: SatsunicGo customers using Ask to find a product, prepare a custom purchase request or flag an answer. Web, VI/EN; actual CatalogSearch → WebResearch and AnswerFeedback components on the shared 5207 frontend. This task owns only new components/CSS and import/mount integrations. Concurrent analytics/CRM/product edits are preserved and not adopted as this task's UI approval.

Business outcome: compare staff-reviewed references and fill an existing draft; explicitly consent to a feedback category linked to a persisted answer. No source price becomes an invoice or a payment amount. Automatic Gemini discovery in customer Ask remains unimplemented/disabled. No new production policy or deployment.

Reviewer: root separate source/product review, 2026-10-08. write-product-content/product-content/web/visual profiles applied. Apple HIG is a human-centered reference only; web native controls and SatsunicGo styles are authoritative. No current Apple-platform compliance or user research claim.

## Context and evidence

Verified: server requires verified Google identity/account lock checks; reviewed offer hash/version/expiry/current merchant policy checked before selection; draft saved via existing saveDraft command only. Missing price/reviews stay null. Feedback requires explicit consent, actual saved answer hash/version and owner; OWNER/recent MFA review records disposition and validates any linked approved source against current publication. Review never edits knowledge/model. Retention policy and server TTL activation on production are NOT_VERIFIED; server refuses new feedback absent its policy.

Assumptions: repository VI/EN conventions and current business separation between catalog full-upfront purchase and custom staff quotation remain authoritative. Historical public-only Gemini calls used Best Buy, B&H and Sony US. Current first-party-only test policy removes Best Buy because its Marketplace shares that host. Remaining B&H/Sony links are unverified candidates; no real seller, price or review certification is inferred from grounding.

Unknowns: authoritative business corpus, feedback retention/withdrawal/deletion policy, Search Suggestions rendering/integration, live auth/App Check, full customer/staff/payment journeys. Product-wide gate remains BLOCKED. Canonical research provenance notes use English technical reference text; UI explanatory controls are VI/EN. Notes are not a generated quotation or a localized marketing message.

## Content inventory

Before: these controls/statuses did not exist. Current approved content below; each tuple is source-extracted without translating technical provider names. Backend guard messages are separately listed in the implementation's HttpsError literals; they are not raw-displayed by the new client, whose localized safe error is below.

| Source | Vietnamese | English | User job and behavior evidence |
|---|---|---|---|
| WebResearch.tsx:101 | Chưa có nguồn phù hợp đã được kiểm tra. Anh/chị vẫn có thể gửi yêu cầu mua hộ. | No matching reviewed source yet. You can still request an item. | New reviewed-source/feedback control; trace to actual component and domain/handler fixtures. |
| WebResearch.tsx:132 | Bản nháp đã được lưu. Anh/chị xem lại rồi gửi yêu cầu để nhân viên báo giá. | Draft saved. Review and send the request for a staff quotation. | New reviewed-source/feedback control; trace to actual component and domain/handler fixtures. |
| WebResearch.tsx:141 | Chưa hoàn tất. Anh/chị kiểm tra kết nối rồi thử lại; chưa có yêu cầu mua hàng nào được gửi. | Could not finish. Check your connection and retry; no purchase request was submitted. | New reviewed-source/feedback control; trace to actual component and domain/handler fixtures. |
| WebResearch.tsx:156 | Nguồn bán tham khảo | Seller references | New reviewed-source/feedback control; trace to actual component and domain/handler fixtures. |
| WebResearch.tsx:159 | Tìm nguồn bán ngoài danh mục | Find sellers beyond the catalog | New reviewed-source/feedback control; trace to actual component and domain/handler fixtures. |
| WebResearch.tsx:162 | Tra cứu các nguồn nhân viên đã kiểm tra. Giá và review là thông tin tại thời điểm kiểm tra; nhân viên sẽ báo giá trước khi thanh toán. | Search sources reviewed by staff. Prices and reviews reflect the check date; staff will quote before payment. | New reviewed-source/feedback control; trace to actual component and domain/handler fixtures. |
| WebResearch.tsx:169 | Đăng nhập để tra cứu và lưu bản nháp. | Sign in to search and save a draft. | New reviewed-source/feedback control; trace to actual component and domain/handler fixtures. |
| WebResearch.tsx:184 | Sản phẩm cần tìm | Product to find | New reviewed-source/feedback control; trace to actual component and domain/handler fixtures. |
| WebResearch.tsx:202 | Thị trường | Market | New reviewed-source/feedback control; trace to actual component and domain/handler fixtures. |
| WebResearch.tsx:218 | Đang kiểm tra… | Checking… | New reviewed-source/feedback control; trace to actual component and domain/handler fixtures. |
| WebResearch.tsx:219 | Tìm nguồn tham khảo | Find references | New reviewed-source/feedback control; trace to actual component and domain/handler fixtures. |
| WebResearch.tsx:224 | Kết quả giới hạn trong phần nguồn đã kiểm tra. | Results cover only the sources checked. | New reviewed-source/feedback control; trace to actual component and domain/handler fixtures. |
| WebResearch.tsx:235 | Số lượng | Quantity | New reviewed-source/feedback control; trace to actual component and domain/handler fixtures. |
| WebResearch.tsx:264 | Giá tham khảo / sản phẩm | Reference unit price | New reviewed-source/feedback control; trace to actual component and domain/handler fixtures. |
| WebResearch.tsx:265 | Chưa xác nhận giá | Price not confirmed | New reviewed-source/feedback control; trace to actual component and domain/handler fixtures. |
| WebResearch.tsx:269 | review tại nguồn bán | seller-site reviews | New reviewed-source/feedback control; trace to actual component and domain/handler fixtures. |
| WebResearch.tsx:270 | Chưa xác nhận review | Reviews not confirmed | New reviewed-source/feedback control; trace to actual component and domain/handler fixtures. |
| WebResearch.tsx:273 | Kiểm tra lúc | Checked | New reviewed-source/feedback control; trace to actual component and domain/handler fixtures. |
| WebResearch.tsx:289 | Thay bản nháp bằng lựa chọn này | Replace draft with this choice | New reviewed-source/feedback control; trace to actual component and domain/handler fixtures. |
| WebResearch.tsx:293 | Soạn yêu cầu từ lựa chọn này | Prepare request from this choice | New reviewed-source/feedback control; trace to actual component and domain/handler fixtures. |
| AnswerFeedback.tsx:94 | Đã nhận góp ý. Nhân viên sẽ xem xét; nội dung hướng dẫn chỉ đổi sau khi được duyệt. | Feedback received. Staff will review it; guidance changes require approval. | New reviewed-source/feedback control; trace to actual component and domain/handler fixtures. |
| AnswerFeedback.tsx:102 | Chưa xác nhận được góp ý. Thử lại để gửi đúng góp ý này. | Feedback is not confirmed. Retry to send the same feedback. | New reviewed-source/feedback control; trace to actual component and domain/handler fixtures. |
| AnswerFeedback.tsx:115 | Góp ý về câu trả lời | Give feedback on this answer | New reviewed-source/feedback control; trace to actual component and domain/handler fixtures. |
| AnswerFeedback.tsx:125 | Câu trả lời này thế nào? | How was this answer? | New reviewed-source/feedback control; trace to actual component and domain/handler fixtures. |
| AnswerFeedback.tsx:133 | Hữu ích | Helpful | New reviewed-source/feedback control; trace to actual component and domain/handler fixtures. |
| AnswerFeedback.tsx:135 | Thiếu thông tin | Missing information | New reviewed-source/feedback control; trace to actual component and domain/handler fixtures. |
| AnswerFeedback.tsx:138 | Thông tin chưa đúng | Incorrect information | New reviewed-source/feedback control; trace to actual component and domain/handler fixtures. |
| AnswerFeedback.tsx:141 | Khó hiểu | Hard to understand | New reviewed-source/feedback control; trace to actual component and domain/handler fixtures. |
| AnswerFeedback.tsx:151 | Tôi đồng ý gửi loại góp ý đã chọn để cải thiện câu trả lời. Không gửi thêm nội dung chat hay thông tin cá nhân. | I agree to send this feedback category to improve answers. No additional chat text or personal details are sent. | New reviewed-source/feedback control; trace to actual component and domain/handler fixtures. |
| AnswerFeedback.tsx:158 | Đang gửi… | Sending… | New reviewed-source/feedback control; trace to actual component and domain/handler fixtures. |
| AnswerFeedback.tsx:160 | Gửi lại góp ý này | Retry this feedback | New reviewed-source/feedback control; trace to actual component and domain/handler fixtures. |
| AnswerFeedback.tsx:161 | Gửi góp ý | Send feedback | New reviewed-source/feedback control; trace to actual component and domain/handler fixtures. |

Generated fields: ordinal and actual title/variant/market; reference *unit* price, explicit USD/JPY/KRW (USD minor units /100, JPY/KRW whole units); rating out of 5 plus source-site review count; checked date/time in device timezone and locale. Canonical note retains UTC timestamp, source URL, original item/variant, offer id/version/full hash and unit reference price; budget/payment fields absent. Static enum values are options with complete localized labels; no model/tool label is exposed as a customer heading.

## State coverage

| State | Applicable | Implemented meaning | Evidence |
|---|---|---|---|
| Default/action | Yes | Product query and market, quantity 1..99; prepare versus explicitly replace draft. Feedback optional details, category and unchecked consent. | Actual components VI/EN/mobile; server strict schemas |
| Loading/pending/disabled | Yes | Checking/sending, no repeated clicks; existing order/unknown commerce operation blocks research mutation. Unknown feedback retains exact UUID/category and disables editing until correlated receipt. | research-pending, feedback-lost; server concurrent feedback replay |
| Empty/no result | Yes | No matching *reviewed* source yet; optional custom request still needs review/submission. Empty is not proof of full web/catalog absence. | research-empty; server bounded search metadata |
| Success | Yes | Draft saved only after existing run succeeds; feedback received only after exact id/version receipt. Neither means purchased, submitted, paid or source promoted. | happy research VI/EN, feedback VI/EN, handler tests |
| Error/recovery | Yes | Could not finish; no purchase request submitted. Unknown feedback retry reuses original operation. Malformed or foreign results discarded. | research-offline/stale/malformed; feedback-offline/malformed/lost |
| Offline/stale/partial | Yes | Explicit limited coverage, expired source cannot select, failed requests do not display synthetic zero/reviews/prices. | research-partial/expired/unknown-price; expiry/response unit tests |
| Unauthorized/forbidden | Yes | Sign-in message; account switch clears results and prevents later mutation/success. OWNER approval/MFA and client direct access denial. | research-switch, feedback-switch, actual-handler auth/role/lock/client tests |
| Consequential confirmation | Yes | Replace button names replacement; customer reviews and separately submits via existing flow. Per-event opt-in feedback. No new destructive/payment action. | saved draft and no submit/pay command assertions; feedback-unchecked |

## Mandatory Human Interface principles

| Principle | Status | Current evidence and limit |
|---|---|---|
| Purpose | PASSED | Source choice fills a request and shows actual provenance; feedback records a category on the answer. |
| Agency | PASSED | Explicit replacement, editable query/market/count, optional collapsed feedback and unchecked consent; no automatic submit/payment. |
| Responsibility | PASSED | Reference/unknown/freshness/partial terms; strict currency/provenance and account fences; no automatic policy/model training. Production privacy gates remain blocked. |
| Familiarity | PASSED | Native forms, persistent labels, existing Ask colors/density, familiar VI/EN actions. LLM/Vertex remain technical names in engineering evidence. |
| Flexibility | PASSED | VI/EN, 320/390 narrow views, native keyboard type-ahead/consent/submit and actual CSS zoom=2; horizontal overflow assertions. Full AT/Safari not certified. |
| Simplicity | PASSED | Secondary feedback in details; price and check date beside source, one draft action per offer, localized recovery text. |
| Craft | PASSED | Required marker remains with label; quantity grouped; native checkbox no full-width input styling; narrow action wraps below details; exact receipt/cancellation/owner guards. |
| Delight | PASSED | Preserve query/draft and offer a clear next step on recoverable failure; calm anh/chị copy, no false purchase success or pressure. No subjective user-satisfaction claim. |

## Platform fit and pattern checks

Web native input/select/button/details/checkbox, aria-hidden required markers, descriptive links and polite role=status. Labels remain readable with word wrapping; keyboard focus stays on native controls, no new animation or focus stealing. Existing brand #163cff/#111c35/thin light borders; new CSS scoped to these components. No Apple-only asset/gesture/control expression.

| Pattern | Result | Evidence |
|---|---|---|
| Writing, labels, controls | PASSED | Complete paired messages above; required-label regression includes new fields |
| Feedback/interruption | PASSED | Inline role=status and optional details; no forced dialog |
| Consequential choices | PASSED | Replace/prepare are distinct; existing submit/payment separate |
| Contextual help | PASSED | Staff review/check date/reference price explained at lookup |
| Permission/privacy/accounts | PASSED | Explicit category consent and owner switch/late-response denial; production retention/withdrawal not ready |
| Accessibility/localization | PASSED | Chromium role/label queries/native keyboard/VI/EN/320px/zoom; manual screen-reader, speech input and Safari NOT_RUN |

## Verification evidence and decision

Current screenshots: output/ask-research-feedback/{research-vi,research-en,research-mobile,research-narrow,research-scaled,feedback-mobile,feedback-keyboard,feedback-vi,feedback-en}.png. These show actual components with synthetic authenticated API/data inside a disclosed minimal route, not production Ask/payment acceptance. Bottom JSON draft diagnostic belongs to the fixture only. Images inspected after the CSS fixes; final hashes recorded in SOURCE_MANIFEST.json.

The first keyboard popup ArrowDown/Enter fixture failed to commit a native macOS selection; revised type-ahead plus Tab retains exact category/focus/consent/send assertions and focused test passed. No skip or weakened domain assertion. Current frozen browser snapshot 2026-10-08T06-40-22-636Z passes 119/119 cases, including all 23 research/feedback cases and 29 Membership cases, with no skip/flaky/retry and sourceStable=true. Demo snapshot 2026-10-08T06-40-22-897Z passes 60/60 cases including 10 new handler cases. Unit snapshot 2026-10-08T06-40-22-244Z passes all 21 new research/context/feedback/budget cases; full suite remains FAILED for two missing Dashboard required markers. All three 664-file source snapshots are identical and match current source. Frontend/backend TypeScript and scoped ESLint exit 0.

| Gate | Result | Rationale |
|---|---|---|
| Eight principles, platform fit, meaning, audience, tone, brevity, terminology | PASSED | Source/domain/in-context review and paired inventory |
| Actions/states/data/privacy | PASSED | Actual focused scenarios; production retention and terms separately blocked |
| Accessibility/localization/in-context | PASSED | Native labels/roles/keyboard and rendered actual-component proxies; no comprehensive AT claim |
| Full Ask product language/live acceptance | BLOCKED | Service/provider/corpus/full locale and real staff/customer journeys incomplete |

Product Language Gate: **BLOCKED overall**; scoped content review above is bounded and cannot authorize production. Fixed findings: mobile action width, detached required mark, checkbox size, honest source/price/reviews/feedback outcome wording. Required owner input: official business corpus and feedback retention/deletion/withdrawal policy. No fabricated business promise, price/review, coverage or training improvement.

Membership recovery correction: no new visible string or business promise. A fresh plan purchase click now cannot replay an operation restored by a concurrent storage event; only the existing “Thử lại thao tác đang chờ” control passes its exact saved envelope. Six repeated actual two-tab contention cases and current full 29-case Membership regression pass. Original purchase/free/pending-payment/renewal meanings remain unchanged; this is not live financial acceptance.

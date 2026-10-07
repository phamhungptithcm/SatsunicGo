# Product content review — integrated080

Candidate `d511e4f4409c931c5692b2f742940ad8b78dfcd8a81fc7a20037a3e1e9671d45`. All22 actual shared paths match SOURCE_FREEZE.json. Review scope is local product/CRM/review content and declared fixture semantics, not production or full authenticated5207 CRM.

## Current context and inventory
CONTENT_STRING_INVENTORY.json extracts current actual JSX/literal strings with path/line; it is a superset including internal string literals. CONTENT_CONTEXT_BINDING.json binds exact path hashes and differentiates current native/SSR context from unchanged staged components. Earlier mock screenshots are illustrative only and do not certify this candidate. No stale0a5 screenshot is treated as newest proof.

Observed via CUA on existing5207, read-only and without restart/new data: catalog→empty-body Synthetic listed product showed correct listed checkout, missing image, distinct manufacturing/purchase-country/retailer and actual public review empty response. Unknown retailer now says “Chưa xác minh”. Empty general-detail heading/region disappeared after final source update. Selecting existing populated Synthetic sanity-01531 product via real search retained heading and existing body. Scrolling showed login-review button reachable above Ask dock. No checkout/review/auth mutation performed.

Four listener-free actualReact SSR cases on current ProductDetails verify empty region omission, real description retention, instructions-only bullet retention and honest unknown origin/retailer. Current50 scoped unit PASS.52 adjacent checkout/CRM/retry/preflight regressions PASS. Current build/frontendbackend compiler/lint and preflight PASS.

Staged8 actualReact browser suites and3 canonical inline-loading checks exercise current hash-identical ProductReviews, ProductInformationFields, ProductReviewModeration, ContentEditor, reviewCSS and their reviewed contracts. They cover320/390/768/1440, goldstar color/fractional fill, bullets/add/reorder/preview, unsafe links, long Vietnamese, simulatedIME, lostACK exactretry, A-B-A and sameUIDread/write denial, archive response. ProductDetails subsequently changed only truthful missing-retailer wording and omission of empty informational regions; these new branches are verified by currentSSR/native context above.23 earlier isolated emulator checks remain unchanged backend/domain proof, not a new full integrated UI run.

## Strings and states
| Surface/state | Current copy/meaning | Evidence |
|---|---|---|
| Product default | brand/title, Xuất xứ, Quốc gia mua hàng, Nơi dự kiến mua | source/native5207; manufacturing separate from market/retailer |
| Missing origin/retailer | Chưa xác minh | current native +SSR; no active-work promise |
| Missing/broken image | Chưa có ảnh / Chưa tải được ảnh | reviewed source +staged actualReact; no fake photo/update promise |
| Empty description | no empty heading/region | current native empty product +SSR |
| Description/instructions | actual body/functions; Hướng dẫn sử dụng +bullets | current native populated +SSR +hash-identical CRM list tests |
| Listed checkout | real listed price per product; full upfront label/action | current native +catalog/schema regressions; no price fabricated |
| Unlisted | Chờ báo giá / request CTA | prior interactive stage unchanged branch; no direct checkout authority |
| Reviews loading/busy | shared inline Đang tải đánh giá… / Đang xử lý… | exact0319 staged inline proof/current unchanged component; actual public read |
| Empty/unavailable summary | Chưa có đánh giá vs unavailable | current native zero; domain/browser unavailable tests; no invented0 |
| Form | order received/name/stars/review/send | current hash-identical form native radios/labels; scoped staged browser |
| Pending/timeout | waiting moderation vs unknown result/same-operation retry | scoped browser +domain/emulator receipts; immutable retry payload |
| Account/denied | short retry/permission feedback, private draft removed | sameUID and A-B-A staged actualReact +server guards |
| Archived submit | Sản phẩm hiện không còn nhận đánh giá. | staged8th case/current unchanged review code; definite response, no endless retry |
| Withdraw/moderation | confirmation, reason, approve/reject/hide/reply | current source +transaction and form tests; staff cannot rewrite stars/text |
| CRM structured fields | origin/brand/summary/retailer/source/instructions | current unchanged CRM module/browser+unchanged backend persistence checks |

## Principles and target platform
| Principle | Scoped result | Current evidence |
|---|---|---|
| Purpose | PASSED | purchase/product/review facts ordered visibly on5207; validated CRM fields |
| Agency | PASSED | real CTA/navigation, native radios/labels, cancel/withdraw confirm and same-operation retry |
| Responsibility | PASSED | unknown != active work/zero; no invented metadata; private revocation clears |
| Familiarity | PASSED | short Vietnamese, native forms/list/rating conventions, no technical flow jargon |
| Flexibility | PASSED | unchanged staged responsive320–1440 and long VI/simulatedIME; current SSR empty/populated/instructions-only |
| Simplicity | PASSED | empty detail omitted; two-column metadata/gallery; one visual brand; concise state copy |
| Craft | PASSED | current native composition, source-hashed goldstars/bullet/label styling, source-matched checks |
| Delight | PASSED | restrained consistent blue/gold and scoped loading/recovery without false progress |

Responsive web target. Native web labels, focusable actions, actual radio semantics,44px controls/font16, scoped reduced-motion CSS are verified within source/staged context. Apple platform HIG not applicable; no Apple-only convention copied. Data semantics, respectful tone, concise wording, action meanings, terminology, localized expansion and in-context scoped evidence PASSED. Accessibility evidence covers semantics/labels/layout; screen-reader/AT NOT_RUN and no WCAG certification claimed. CSS zoom test is layout-scale only; native200% zoom NOT_RUN. NativeOSIME, full authenticated5207CRM, liveGoogle/AppCheck/payment/provider/production NOT_RUN.

Product Language Gate: PASSED for the declared local implementation/content-contract scope, conditional on independent review of this exact binding. Whole production readiness NOT_READY. Newest final independent integrated review pending; no successful whole-project handoff until that review returns.

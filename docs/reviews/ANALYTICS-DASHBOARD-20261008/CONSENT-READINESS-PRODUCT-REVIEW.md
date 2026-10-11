# Product Content Review — consent readiness correction

Scope: existing optional analytics consent on public web routes, Vietnamese with the existing English summary; no string or data-meaning change. Audience: guest/account shoppers choosing whether visits, products and Ask topics may be counted. Source consent hash d59d5cb0929bf1131631482db8ff9620a24e2c8fccedccfd932e8d595d22d7b3; browser-test hash c905f1dc0a8b6e6cfe46017faf5f33f647169f16186b5e65e6c5b0052e994902. Review date2026-10-08. Web design-system controls/keyboard/focus remain authoritative; Apple platform contract is not applicable. Existing complete analytics product review remains applicable to all unchanged strings/charts.

Verified facts: panel is now presented before auth restoration on public routes. Tracking effects still return until ready. Explicit pre-ready opt-in produces zero transport; revocation before ready then restoration also produces zero transport. Subsequent opt-in, product-view/click, safe Ask topic, account lifecycle and withdrawal checks pass. Private routes still have no panel. Three delayed-readiness fixture cases pass at1440/390/320 with real component/CSS and fixed header; controls' bounding boxes and hit-test centers are inside unobscured viewport without locator auto-scroll. This is synthetic transport/component-shell evidence, not live App Check or authenticated commerce proof. Deployed v0.6.1/73dc7d5 now also passes whole public-shell reload checks at390/320/1440: scrollY0 and both controls unobscured. Actual dimensions, DOM hit tests and three JPEG captures are recorded in PRODUCTION-CONSENT-READBACK.json. The first override applied before creating the tab did not affect the new tab; that dimension label was discarded and all three widths were verified on the bound tab.

## Content inventory

| State | Unchanged content | Meaning and evidence |
| --- | --- | --- |
| Initial/pre-ready | Cho phép thống kê để cải thiện SatsunicGo? | Optional choice now appears without waiting for auth; no collection starts early |
| Explanation | Ghi nhận phiên truy cập, lựa chọn sản phẩm và chủ đề Ask. Không lưu nguyên văn câu hỏi trong thống kê. Bạn vẫn mua hàng bình thường khi từ chối. | Same consent scope; no raw question text; analytics transport remains independent |
| English summary | Optional analytics. Declining does not affect shopping. | Same guest/account purchase boundary |
| Privacy/accessibility | Cách sử dụng dữ liệu; Quyền thống kê truy cập | Existing privacy link and landmark label preserved |
| Initial choices | Từ chối; Cho phép thống kê | Explicit no/yes preferences; no pre-ready transport |
| Existing preference | Quyền thống kê | Reopen choices, including before readiness |
| Revoke/close | Dừng ghi nhận; Đóng | Revoke preference/withdrawal path preserved; close retains current preference |

## State coverage and semantics

Default/action, pending auth, explicit opt-in, decline, success preference, reopen and withdrawal: PASSED in three-width regression. Offline transport/privacy/account boundaries are unchanged and covered by existing14analytics unit checks. Private/forbidden presentation remains excluded by publicRoute. Error/null/zero/financial/partial semantics are unchanged; prior chart/state checks remain applicable. No financial action, canonical data mutation, raw query storage or retrospective backfill is introduced. Presentation is not evidence of successful delivery; live provider checks remain separate. No destructive confirmation applies.

## Human Interface principles

| Principle | Status | Current evidence |
| --- | --- | --- |
| Purpose | PASSED | Optional analytics choice visible before readiness; same visits/products/Ask purpose |
| Agency | PASSED | Both controls in viewport; pre-ready yes/no choices supported; zero premature transport |
| Responsibility | PASSED | Effects keep readiness gate; raw text excluded; decline leaves shopping available |
| Familiarity | PASSED | Existing Vietnamese labels, ordinary buttons and privacy link retained |
| Flexibility | PASSED |1440/390/320 layouts; reopen/revoke and account lifecycle retained |
| Simplicity | PASSED | One existing panel; no new copy, modal or delayed forced scroll |
| Craft | PASSED | Bounding-box and center hit-test assertions; fixed-header shell; width-specific screenshots |
| Delight | PASSED | Choice is immediate; no forced later scroll or progress overlay added |

Platform fit: PASSED for browser layout/controls/focus and canonical blue-white-navy styles. Existing keyboard/text-scaling checks remain unchanged. Accessibility/localization/terminology/meaning/audience/tone/privacy gates: PASSED for unchanged content plus the readiness state. Full deployed public-shell responsive presentation PASSED; screen-reader device acceptance remains NOT_VERIFIED. Permission/privacy pattern PASSED; alerts/destructive patterns NOT_APPLICABLE.

Verification: focused lint/typecheck and14analytics unit cases PASS;8unchanged browser cases PASS;3updated delayed-readiness cases PASS. The first run's three selector failures were test defects (after yes, the existing label is Dừng ghi nhận); corrected without relaxing assertions. Independent review found fixed screenshot names would overwrite width evidence; paths now include width, and all three cases reran PASS.

Current separate fixture captures: screenshots/consent-1440.png, consent-390.png, consent-320.png; matching withdraw and privacy files for each width. Deployed captures: production-consent-1440.jpg, production-consent-390.jpg, production-consent-320.jpg. New strings: None. Product Language Gate: PASSED for source/fixture and deployed public presentation; delivery/worker and authenticated commerce proof remain separate evidence. No additional owner decision required within the already-approved review/fix loop.

# Product Content Review — source-based design r2

## Scope

- Surface: synthetic HTML design, RequestForm/Checkout/payment/cost-revision/receipt scenarios. No application wording changed.
- References: `DESIGN-R2.md`, `../../previews/SATSUNICGO-UPFRONT-PAYMENT-20261008-r2.html`, `CONTENT-INVENTORY-R2.json` (227 entries: static, accessible, example values and dynamic Vietnamese messages).
- Audience/task: Vietnamese customer entering researched prices, checking the initial total and reviewing later costs/payment receipts.
- Locale/platform: vi-VN, responsive web; VND totals, USD source-price sample. PDF samples are unchanged from v1 and keep explicit sample/non-tax labels.
- Conventions: existing SiteChrome, RequestForm markup, PageTabs keyboard convention, Checkout selection/total, Documents table and statementTotals. Five actual existing CSS files are loaded in-browser.
- Apple HIG platform compliance: NOT_APPLICABLE; the eight principles are a quality reference, no Apple-specific UI copied.
- Reviewer/date: root, 2026-10-08. No independent application or assistive-technology certification.

## Context and evidence

Verified: current custom request has three input/review stages and no structured researched price; listing uses full server-owned payment; StatementView is an internal statement with explicit non-tax meaning. PageTabs has manual keyboard activation. The prototype has no Firebase/PayOS/SMTP calls and uses labelled fake amounts.

Assumptions: initially collect goods plus known fees; shipping not yet priced is later disclosed/approved. The sample 5% fee and exchange rate are not production policies. Statutory issuer and PayOS/SMTP setup remain unverified.

## Content inventory

The complete r2 inventory is in `CONTENT-INVENTORY-R2.json`. Material transitions:

| Location/state | Existing meaning | Proposed content | User job / evidence |
| --- | --- | --- | --- |
| Request heading/default | Staff quote and two payments | Enter researched price, review initial amount, pay in full before staff buys | Price field is an estimate; backend snapshot is future authority, not this calculator. |
| Request steps | Input/review stages | Món hàng / Thông tin thêm / Kiểm tra, “Đã kiểm tra bước” | Step color describes form checks only; not order fulfillment or received money. |
| Price/error | No structured price currently | Per-field errors; missing name, negative price and total limit block next | Browser checks did not mark valid quantity invalid when price was negative. |
| Budget/optional | Metadata | “Ngân sách tham khảo”; does not replace payable | Same optional input context; explicitly differentiated from the researched unit price. |
| Initial review/consent | Legacy deposit acceptance | 100% of known initial goods/fees; “Vận chuyển: Chưa chốt” | 3,045,000 sample; checkbox/Space enables demo, editing price clears it. |
| Listing | Immutable listed total | “Thanh toán toàn bộ một lần”, no second charge | Qty 0 blocks; qty 2 × 1,650,000 = 3,300,000; option changed to black and shown in summary. |
| Additional/default | Final cost approval | 200,000 goods + 10,000 fee + 240,000 shipping = 450,000 extra | Known revision, already paid and total visible together. |
| Additional/recovery | Hold blocks fulfillment | Request cost review; approval/payment disabled | Mobile readback both disabled; no artificial immediate re-acceptance. |
| Payment/pending/unknown | Bank/provider verification | Status sample explicitly pending/unknown; check existing attempt before another payment | 450,000 top-up flow and unknown screenshot; UI never writes ledger. |
| Payment/success/partial PDF | Funds and document jobs differ | “Trạng thái mẫu: đã thanh toán. Phiếu đang được xử lý.” | Explicit sample success viewed; not a payment provider result. |
| Receipt/default | Final-only internal statement | Payment receipt, source-shaped product table and totals | Fixed 3,045,000 example independent of edited calculator/listing; disclosed before downloading. |
| Sample navigation | No shipping timeline | “Các màn hình mẫu… không phải tiến độ mua hàng” | Five independent tabpanels; manual arrows move focus, Enter activates. |

## State coverage

| State | Applicability/result | Evidence or limit |
| --- | --- | --- |
| Default/action/focus | PASSED within sample | Desktop, 390px and 320px; current-source styling, readable wrapped product name. |
| Pending/disabled | PASSED within sample | Initial unchecked, invalid price/name/quantity/overflow, additional review hold and pending payment. |
| Empty/true zero | NOT_RUN for app | Empty name is covered; empty documents and live zero ledger not represented. |
| Success | PASSED as labelled sample only | Payment/PDF states differentiated; no real payment or email claim. |
| Error/recovery | PASSED subset | Inline errors/unknown/cost review; server error and PDF/email failures NOT_RUN. |
| Offline/stale/partial | NOT_RUN for app | Covered in v1 implementation plan; no backend in r2. |
| Unauthorized/forbidden | NOT_RUN for app | Header does not fabricate a logged-in customer; private reads not exercised. |
| Confirmation/destructive | PASSED subset | Explicit initial/additional confirmation. No destructive action in sample. |

## Data semantics

Unit price is source currency; integer/rational sample conversion yields VND. Known money and unpriced shipping are separate. Missing/invalid never displays a synthetic zero. Amounts are fixed synthetic examples except the labelled calculator; receipt PDFs do not change with calculator edits. Receipt snapshot and final statement remain separate. No real customer/bank/merchant/contact data was introduced.

## Mandatory Human Interface principles

| Principle | Status | Current evidence / limit |
| --- | --- | --- |
| Purpose | PASSED | Product → context → amount/confirmation is the existing form sequence; totals and additional reason precede action. |
| Agency | PASSED | Edit controls, unchecked consent, preserved text across tab changes, cost review with held approval, no implicit extra payment. |
| Responsibility | PASSED | Estimates, unpriced freight, demo funds, fixed PDFs and non-tax receipt interpretation labelled in context. |
| Familiarity | PASSED | Existing labels/components, navy/blue/white tokens, normal web controls and Vietnamese money. |
| Flexibility | NOT_RUN | 320/390/1280 and keyboard subset passed; full AT/200%/localization acceptance absent. |
| Simplicity | PASSED | Keeps existing staged form; preview selector not mistaken for purchase steps; no forced modal or new operational workspace. |
| Craft | NOT_RUN | Actual source CSS and current screenshots reviewed; complete implemented state/real-shell accessibility evidence still absent. |
| Delight | PASSED | Calm inline feedback, retained draft, clear additional-cost explanation; uncertain funds receive no success celebration. |

## Platform fit and pattern checks

Web platform fit PASSED for the sample: transparent underline tabs with 44px targets, mobile scrolling and manual activation; native input/select/checkbox; visible focus and persistent role=alert/status. Desktop actual CSS imports and 18px form radius verified in browser. Mobile form uses the current 74px step rail. Checkbox is 18px with consent label flex after specificity repair. No Apple assets or navigation conventions imported.

| Pattern/dimension | Status | Evidence |
| --- | --- | --- |
| Writing/actions/tone/terminology | PASSED subset | Inventory, fields and sample states rendered in their context. |
| Feedback/interruption | PASSED subset | Inline pending/unknown and held-cost status, no transient-only recovery. |
| Alerts/consequential choices | PASSED subset | Explicit amount consent; sample action cannot transfer funds. |
| Context help/onboarding | PASSED subset | Currency/estimated price/freight help in form; no forced tutorial. |
| Privacy/accounts | NOT_RUN for app | Synthetic-only design; owner download/email recipient authorization awaits implementation. |
| Inclusion/accessibility/localization | NOT_RUN | Keyboard/tab/Space/Escape and narrow widths checked; screen reader and 200% text scaling not run. |
| In-context verification | PASSED sample | Source CSS, desktop/mobile screenshots, exact sample amounts and table/totals. |

## Verification evidence

- Images: `r2-request-desktop.jpg`, `r2-request-review-desktop.jpg`, `r2-request-mobile.jpg`, `r2-request-review-mobile.jpg`, `r2-request-review-320.jpg`, `r2-catalog-desktop.jpg`, `r2-additional-mobile.jpg`, `r2-payment-unknown.jpg`, `r2-document-mobile.jpg`.
- Primary visual proof: `r2-request-review-viewport.jpg`, a normal viewport capture. Full-page captures can reposition the fixed header during stitching; they are supplemental content evidence, not a claim of header geometry. Draft persistence was verified across stages/tabs, not page reload/HMR.
- Executed subset: name/price/quantity/overflow; 58.25 USD × 2 = 3,058,125 including sample fee; notes retained through tabs; consent resets; top-up 450,000; listing qty/options; pending/unknown/paid-with-PDF-processing; cost hold; manual tab activation and menu Escape.
- Narrow views read contentWidth=viewportWidth at 390px and 320px for inspected form/review/cost/receipt states. This is not 200% or AT proof.
- Structure/script/format: `STATIC-CHECKS-R2.json`, `node --check /private/tmp/payment-upfront-r2.js`, Prettier PASS. Existing application tests were not rerun for this design-only change.
- Browser session also recorded Firebase App Check/network warnings on an incidental real `/membership` navigation during a mobile click attempt. Returned to the design URL and used explicit keyboard actions; no backend restart or authentication change. No console-clean or live-runtime certification claim.

## Decision

**Product Language Gate for application handoff: BLOCKED.** This review supports the source-based design, not completed new-policy implementation. Need approved implementation plus current real-shell auth/server/error/PDF/email, complete accessibility and fresh review evidence before passing the app gate. Fee-policy/PDF interpretation assumptions remain in plan v1. No new owner question is introduced by this design revision.

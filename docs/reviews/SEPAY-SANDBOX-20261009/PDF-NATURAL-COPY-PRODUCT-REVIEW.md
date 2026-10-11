# PDF natural copy product review

Task PDF-NATURAL-COPY-20261009; reviewer Codex; 2026-10-09. Current source hashes are recorded in PDF-NATURAL-COPY-FINAL-REVIEW.json. Scope is the approved PDF copy/presentation refinement in purchase-pdf.ts and its existing unit tests. Audience: Vietnamese purchase customers checking a completed payment. Target: printable A4 PDF using the existing blue/white/navy brand and embedded Vietnamese font. Apple platform contract is not applicable; Human Interface principles are used as a human-centered reference, without Apple-only expression.

## Context and inventory

Verified: method/provider and paidAt come from the receipt snapshot, not the PDF creation time. Renderer is shared by initial and incremental receipts. Financial values, authorization, settlement and delivery are unchanged. Previews are synthetic local renderer outputs, not provider transactions. No assumption of NAPAS/card availability is introduced.

| Location/state | Previous content/behavior | Current content/behavior | Customer purpose and evidence |
| --- | --- | --- | --- |
| Method, SePay sandbox | Extra Không thu tiền thật helper | Helper removed; QR chuyển khoản · SePay sandbox retained | Clearly identify the method without duplicate explanation; initial/sourcing/final/catalog/multipage render and extraction |
| Method, demo | Thanh toán demo plus helper | Unchanged | Demo disclosure preserved; existing unit test |
| Merchant label, SePay | Đơn vị nhận thanh toán thử | Mã đơn vị SePay | Short label identifies a merchant code, not a bank/account; rendered metadata |
| Initial, custom goods | Longer logistics note | Cước vận chuyển, thông quan và giao nội địa của hàng cần tìm mua chưa thu. Bạn duyệt các phí này trước khi gửi hàng. | Distinguishes collected goods/service from future logistics; initial PDF and unit assertions |
| Initial, mixed cart | Longer bundled-price distinction | Hàng niêm yết giữ giá trọn gói. | Unpaid logistics note is explicitly limited to custom goods; initial PDF |
| Initial, catalog only | Longer bundled-price note | Giá niêm yết là giá trọn gói. | Avoid implying another freight charge; catalog PDF and unit test |
| Sourcing increment | Longer explanation | Bạn đã trả phần chênh lệch giá mua. Cước và phí còn lại sẽ được chốt trước khi gửi hàng. | Explains this increment without representing it as all final costs; sourcing PDF |
| Final increment | Longer explanation | Bạn đã thanh toán phần chi phí còn lại theo tổng tiền đã duyệt. | Explains final balance; final PDF |
| Final page | No thank-you | Cảm ơn bạn đã tin tưởng và chọn dịch vụ mua hộ của SatsunicGo. | Sincere, concise closing; centered once, verified in all five PDFs and multipage last page |
| Every-page footer | Chứng từ xác nhận khoản đã thu. Không thay thế hóa đơn thuế. | Không thay thế hóa đơn thuế. | Retains document distinction in a short footer; extraction and visual evidence |

No changed action or accessible control labels. Metadata spacing is reduced only for the removed sandbox helper. The exact payment time and Giờ Việt Nam (GMT+7) remain visible.

## States and data semantics

| State | Coverage |
| --- | --- |
| Default/success | Actual rendered initial, sourcing increment, final increment, catalog-only and 30-item/8-page PDFs inspected |
| Demo | Existing unit assertion retains Thanh toán demo and Không thu tiền thật |
| Pending/loading/disabled | Not applicable to this static completed-payment renderer refinement; no new receipt state |
| Empty/invalid/error | No validation changes; existing renderer bounds/error behavior retained; this slice does not certify all malformed snapshots |
| Offline/stale/partial | Existing immutable ready PDFs are not rewritten. Download/offline/storage behavior unchanged and not exercised here |
| Unauthorized/forbidden | Delivery/download ownership boundary unchanged; no authenticated-route acceptance claimed |
| Confirmation/destructive | No controls or consequential actions added |

Source of truth remains server receipt fields: amount in VND, paidAt shown in Asia/Ho_Chi_Minh with seconds, provider/method/reference from the same snapshot. No estimated value is presented as collected money. Missing identifiers keep their existing Chưa có mã fallback. No new PII, analytics, network calls or secret fields. Existing validation remains responsible for rejecting invalid amounts/times before rendering.

## Mandatory Human Interface principles

| Principle | Status | Current in-context evidence |
| --- | --- | --- |
| Purpose | PASSED | Product rows, collected total and how/when paid remain legible in the initial and balance PDF renders |
| Agency | PASSED | Notes retain customer approval of future custom-goods fees; no new payment action or forced choice |
| Responsibility | PASSED | Sandbox name and tax distinction retained; custom/catalog distinctions preserved; no invented bank details |
| Familiarity | PASSED | Plain Vietnamese, Cảm ơn bạn, VND, day/month/year and explicit Vietnam time |
| Flexibility | PASSED | Same closing works for initial and both incremental receipts; 30 long items paginate to eight pages |
| Simplicity | PASSED | Duplicate sandbox helper removed; notes shortened while preserving financial meaning |
| Craft | PASSED | Centered final-page closing, aligned metadata, intact Vietnamese glyphs and no clipping in six inspected PNGs |
| Delight | PASSED | Warm one-sentence thanks gives the receipt a considerate ending without promotional text |

## Platform and pattern checks

A4 PDF fit PASSED using actual rendered pages. Existing font, hierarchy and brand retained. Text remains extractable Unicode; full tagged-PDF/screen-reader certification is NOT_RUN, not claimed. No browser controls, motion, keyboard focus or responsive webpage behavior changed. Enlarged raster inspection and 30 long item names cover text expansion within this PDF layout; no new locale support claimed.

Writing/labels and feedback proportionality PASSED: short, factual metadata and a quiet closing, no alert or interruption. Consequential choices, onboarding, permissions/accounts are NOT_APPLICABLE. Inclusion/localization review PASSED for Vietnamese glyphs and visible/extractable text; RTL is NOT_APPLICABLE to this Vietnamese-only slice.

Meaning, audience fit, natural respectful tone, brevity, applicable states, data semantics/privacy, terminology, localization, visible readability and in-context evidence: PASSED within the stated scope. No claim of complete PDF accessibility conformance.

## Evidence and decision

Actual renderer generated output/pdf/pdf-natural-copy-20261009/{initial,sourcing,final,catalog,multipage}.pdf. Validation.json records hashes, bounds, payment method/time and final-page-only thank-you assertions for all five. Visually inspected initial.png, sourcing.png, final.png, catalog.png, multipage-1.png and multipage-8.png. PDF unit8/8 plus checkout regression12/12 passed on the current hashes.

Cycle1 finding: an early shortened logistics note could read as applying to the whole mixed cart. Fixed by explicitly saying của hàng cần tìm mua and preserving the catalog bundled-price sentence. Existing assertions strengthened, all affected checks and renders rerun. Cycle2: no actionable product-content finding within executed checks. Product Language Gate PASSED for this refinement. Provider payment, delivery, production and authenticated browser evidence remain outside this review.

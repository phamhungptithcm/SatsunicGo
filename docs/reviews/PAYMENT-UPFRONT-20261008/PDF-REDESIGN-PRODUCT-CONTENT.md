# Product Content Review — purchase payment PDF

## Scope

Surface: generated private A4 PDF; small approved failed-document support-link repair. Files: purchase-pdf.ts, purchase-completion.tsx, focused tests. Audience: Vietnamese customers checking purchased items and recorded payment. Outcome: clear product rows, amounts, method and time. Locale: vi-VN / VND / Asia/Ho_Chi_Minh. Platform: portable PDF plus existing web recovery link. Apple HIG compliance NOT_APPLICABLE; human-centered principles used as reference, no Apple expression or assets. Primary reviewer, 2026-10-09T04:01:25.162Z. Candidate: PDF-REDESIGN-MANIFEST.json (9c3b3452daacda72f33a24a673e71bce54aa35d69c57deb3757ebad4bd522dda).

## Context And Evidence

Verified: immutable receipt fields carry product/variant/quantity, goods, service, total, provider/reference/paidAt, purpose, prior paid/approved total/reference. Registered worker creates a private hashed object and outbox; authentication/ownership/locked-account checks remain in the existing callable. Initial goods unit price is exact goods divided by quantity when integer; otherwise the exact row goods total is shown with “Theo tổng dòng”, never rounded into a fabricated price. Row fee is the fee for that full product row; quantity × unit goods + row fee = collected row total. Catalog amounts are bundled prices with fee “Đã gồm”, not a new surcharge. Summary “Giá sản phẩm” covers both bundled listing and custom goods.

Assumption: existing blue/navy/white brand and Vietnamese customer document are desired, matching current user request. No user-research improvement or faster reading measurement asserted. Unknowns: real channel/bank account/card details and recipient/address are absent from this receipt contract, so not invented. Current channel is demo. Live PayOS/mail/fiscal issuance remains deferred.

## Content Inventory

Complete literals/templates: PDF-REDESIGN-CONTENT-INVENTORY.json. Behavioral mapping:

| Location/state | Old content | Current content | User job / behavior evidence |
| --- | --- | --- | --- |
| Header/paid | Large all-caps body title | Thanh toán mua hộ; CHỨNG TỪ THANH TOÁN; Đã thanh toán | Brand and verified transaction state; actual backend-generated PDFs. |
| Metadata | Linear Mã chứng từ/Mã giao dịch/Xác nhận/Kênh list | Two-column Mã chứng từ/Mã giao dịch/Phương thức thanh toán/Thời gian thanh toán | Match the actual receipt/reference/provider/paidAt. |
| Demo/method | Thanh toán demo - không thu tiền thật | Thanh toán demo; Không thu tiền thật | Honest channel; does not claim bank/card or PayOS execution. |
| Time | Locale timestamp plus Việt Nam | DD/MM/YYYY · HH:MM:SS; Giờ Việt Nam (GMT+7) | Exact verified paidAt projected to Vietnam, tested explicit UTC fixture. |
| Initial/table | MÓN / PHÂN BỔ THANH TOÁN; SL; ĐÃ THU | Sản phẩm; SL; Đơn giá; Phí mua hộ; Thành tiền | Item names/variants/order IDs, integer unit goods, full-row fee and collected total. |
| Product type | Cần tìm mua; Sản phẩm niêm yết - giá trọn gói | Cần tìm mua; Giá niêm yết trọn gói; Đã gồm | Preserve sourced versus fixed bundled meaning. |
| Initial/summary | TỔNG TIỀN ĐÃ THU and large amount | Giá sản phẩm; Phí mua hộ; Đã thanh toán | Exact goods+service reconciliation; one overall payment amount. |
| Balance/table | Bổ sung chi phí prefix and generic amount | Actual product plus Khoản bổ sung | Increment is not represented as a new unit goods price. |
| Balance/summary | Inline prior paid/approved total/previous receipt | Tổng giá đã duyệt or Tổng chi phí đã duyệt; Đã thanh toán trước; Thanh toán lần này; Chứng từ trước | Exact prior+increment=approved total and previous receipt chain. |
| Freight/context | Long generic statement | Purpose-specific note, listing-only note | Custom initial shipping excluded; listing-only never implies its bundled freight is unpaid. |
| Pagination | Generic continuation header | Branded continuation, receipt code, repeated column titles and page number | Long names/30 product rows remain identifiable. |
| Footer/classification | Internal receipt disclaimer | Chứng từ xác nhận khoản đã thu. Không thay thế hóa đơn thuế. | No fiscal issuer/provider capability invented. |
| Failed PDF/web | Support link hidden when error also present | Liên hệ hỗ trợ in actual failed/error alert | Existing same support route; SSR regression assertion preserved and now passing. |

## State Coverage

Default/action: PASSED — document supports view/search/copy/print; actual three downloaded PDFs. Loading/pending/disabled: NOT_APPLICABLE inside a static issued PDF; existing asynchronous PDF UI remains, busy controls preserved. Empty/no result: NOT_APPLICABLE to a valid paid receipt; existing renderer rejects zero lines/invalid sums. Success: PASSED — paid state and private background object verified. Error/recovery: PASSED — failed/error support link SSR proxy, unchanged payment state; prior invalid allocation guards tested. Offline/stale/partial: PASSED for portable snapshot semantics; issued receipt is a timestamped transaction, not a claim of current shipping/order state. Unauthorized: PASSED — fresh HTTP foreign-owner denial; no client access contract change. Confirmation/destructive: NOT_APPLICABLE — no new transaction/approval/deletion.

## Data Semantics

Source: immutable verified receipt, not browser cart/profile/current exchange rates. VND money totals stay exact integers; unit price only exact divisible goods, row service and totals remain distinct. Balance shows only this additional payment with prior/approved totals. Unknown bank/card/recipient data is omitted, never zero or invented. Demo is explicitly identified. Paid time is Asia/Ho_Chi_Minh (GMT+7), seconds preserved, not document render time. Financial privacy/access and signed snapshot/hash/outbox unchanged. Ready issued objects are not regenerated or modified; new demo transactions create new documents.

## Mandatory Human Interface Principles

| Principle | Status | Current evidence |
| --- | --- | --- |
| Purpose | PASSED | Each product/quantity/amount, method/time and collected total prominent in actual PDFs. |
| Agency | PASSED | Searchable/copyable Unicode text and transaction/order references enable customer checking; support recovery link exists. |
| Responsibility | PASSED | Demo and uncollected custom freight disclosed; no fiscal/card/bank/email-arrival or fulfillment claim. |
| Familiarity | PASSED | Standard invoice-like product columns and right-aligned money with familiar Vietnamese labels. |
| Flexibility | PASSED | A4 scalable PDF; word wrapping and repeated headings on 8 pages; fractional unit fallback preserves exact data. |
| Simplicity | PASSED | Compact header, metadata grid, one initial total, distinct additional-payment summary. |
| Craft | PASSED | Licensed embedded Vietnamese font, aligned cells, bounded amount widths, exact Vietnam timestamp, inspected pages and geometry. |
| Delight | PASSED | Calm own-brand styling, clear paid status and simple checking; no animation/distraction or invented promise. |

## Platform Fit / Pattern Checks

Portable document and native web link patterns PASSED. No Apple-platform compliance claim. Writing/labels PASSED; feedback PASSED through text plus check rather than color alone; alerts/consequential choices NOT_APPLICABLE inside PDF, web failure repair PASSED; contextual help PASSED with concise source/final/freight notes; permission/privacy PASSED with unchanged private download. Vietnamese/Latin Unicode extraction, wrapping, numbers/time PASSED. RTL NOT_APPLICABLE to this Vietnamese template. Text is searchable and extracted by independent pdfplumber; formal PDF/UA tags/native assistive-technology, device-specific zoom/print tests and international CJK/emoji font coverage are NOT_RUN/not claimed. Existing semantic Link in alert is verified through current server-rendered markup, a disclosed proxy rather than a native AT browser test.

## Gate Results / Verification

Human principles, platform fit, meaning/behavior, audience, respectful tone, brevity with costs preserved, applicable actions/states, data/privacy, scoped text accessibility, Vietnamese/wrapping, terminology and in-context evidence: PASSED within this portable-document review. Actual current initial/source/final PDFs, rendered PNGs, independent text geometry checks; 30-row 8-page preview, first/last inspected; 80 unit tests including seven focused PDF cases and failed-link regression; 17 current HTTP scenarios; root/functions builds and scoped lint passed. Full native AT/PDF-UA and live provider acceptance deferred, not implied. Product Language Gate: PASSED for local document scope. Findings fixed: exact unit versus row fee/balance interpretation, long-word/reference layout bounds, bundled-only note, support recovery omission. No owner decision required for this refinement.

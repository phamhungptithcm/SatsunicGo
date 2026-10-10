# Product content review — current implementation

Scope: current RequestForm-to-cart operation, mixed Cart data, checkout/recipient/freight/confirmation, payment completion, sourcing approval, order tracking/actions and generated PDF. Audience: Vietnamese shopping customers and authorized purchasing staff. Platform: responsive web, Vietnamese primary; optional existing tracking English projection. Reviewer: primary Codex agent, 2026-10-09T03:28:07.946Z. Boundary: local demo, not deployed acceptance. Source binding: IMPLEMENTATION-SOURCE-MANIFEST.json (5ccf75159d4aed7c10a164024abc1a4fd95dd4c5b1eb9ab6fe23bb916f69871b). Inventory: IMPLEMENTATION-CONTENT-INVENTORY.json.

## Facts, assumptions and boundaries

Server snapshots derive listing prices, researched source price conversion, fixed initial service fee, consent, owner, versions and exact allocations. Initial custom freight is an estimate outside the initial collected sum. Fixed listings retain bundled prices. Excess sourcing spend requires approved and funded increment; dispatch requires approved final costs, enough net funds, packing and no hold/refund reservation. Receipts describe recorded money, not delivery completion, fiscal invoicing or email arrival. No real email delivery is promised by the compact success card; demo transport remains identified in the payment step, receipt itself and backend evidence. Live provider/email/Maps and domestic tariff contract are deferred, not inferred.

## Key changed strings and their behavior

| Location/state | Current content | Job and evidence |
| --- | --- | --- |
| RequestForm/action | Thêm vào giỏ hàng | Adds private researched request; no staff order yet; HTTP replay check. |
| Cart/custom | Cần tìm mua | Identifies a sourced item in the existing cart row; immutable paid order carries requiresSourcing. |
| Checkout/steps | Nhận hàng; Tổng quan; Thanh toán | Connected nodes represent actual staged review; initial desktop/mobile screenshots. |
| Checkout/confirmation | Tôi đã kiểm tra món, địa chỉ và số tiền cần thanh toán ban đầu. | Explicit consent is reset after editing; commit revalidates server hash/version/expiry. |
| Freight/estimate | Quốc tế dự tính · chưa thu; Phí cần xác nhận | No invented domestic price or inclusion in initial charge; 13.35 USD is outside 4,695,000 VND. |
| Paid/current refinement | Thanh toán thành công | Actual paid state, not purchase/delivery completion. One amount; green check and words both convey success. |
| Paid/order links | #actual-order-UUID; Xem đơn hàng | Child IDs are real links; one order opens detail, group opens existing order list. |
| Paid/icon download | Tải chứng từ PDF | Accessible name and tooltip; compact 44px control invokes guarded existing download. |
| PDF pending/failure | Đang tạo chứng từ. Bạn có thể tải lại sau.; Chứng từ chưa tạo được. Khoản thanh toán vẫn đã ghi nhận. | No reversal of payment state; failure offers implemented support route. |
| Unknown | Kết quả chưa rõ… đối chiếu cùng lượt; không tạo khoản khác. | Unknown is sticky; cancellation unavailable; same checkout ID resumes. |
| Price adjustment | Chênh lệch giá mua; Duyệt giá mua mới | Customer accepts an actual versioned proposal before spending beyond original price. |
| Remaining costs | Duyệt tổng phí cuối; Duyệt và thanh toán thêm | Final approval/funding precede shipping; browser plus HTTP verified. |
| PDF/classification | CHỨNG TỪ THANH TOÁN; Không thay thế hóa đơn thuế. | Private exact-money receipt with actual reference, purpose, prior payment and previous receipt. |

Full literal/template coverage is in the linked inventory; the table is the behavioral mapping, not a substitute for that inventory.

## State coverage

| State | Result/evidence |
| --- | --- |
| Default/action | PASSED — actual form/cart/checkout, customer approval controls and completion links. |
| Loading/pending/disabled | PASSED — loading states, consent-disabled submit, in-flight lock, receipt processing, busy download accessible state. |
| Empty/zero | PASSED — paid cart is empty; no remaining-charge CTA at zero; missing setup/price/quote never becomes a fabricated zero. |
| Success | PASSED — current centered completion screenshots; authenticated PDF bytes; exact ledger/state. |
| Error/recovery | PASSED — rules/HTTP reject stale/foreign/invalid attempts; pending envelope retries same operation. Paid PDF errors remain separate from payment. |
| Offline/stale/partial | PASSED within executed scope — ambiguous payment survives reload; partial image operations retained; preview expiry/CAS tests; real disconnected-network/device matrix NOT_RUN. |
| Unauthorized | PASSED — verified owner and locked-account guard review, foreign HTTP/rules rejection, current unauthenticated sign-in screen observed after demo restart. |
| Consequential confirmation | PASSED — current amount/recipient review + checkbox; source-price and final-cost versioned approval. No new destructive operation. |

Data units: VND integers; source minor units USD cents, JPY/KRW whole units; rational FX; initial source fee frozen. Browser timestamps use existing locale; PDF explicitly uses Asia/Ho_Chi_Minh. Missing tariff/recipient/configuration remains unavailable/pending, never a success or zero. Address and receipt access remain owner private. No customer data goes to a Maps service.

## Mandatory principles and platform fit

| Principle | Status | Current evidence |
| --- | --- | --- |
| Purpose | PASSED | Overview explains recipient and amount before payment; completion foregrounds payment result and actionable order ID. |
| Agency | PASSED | Edit cart/address, view tariff, approve a price change, confirm exact preview; unknown never invites duplicate payment. |
| Responsibility | PASSED | Estimate versus collected funds remains explicit before payment/PDF; no email/fiscal/delivery claim; receipt error does not undo recorded money. |
| Familiarity | PASSED | Existing Vietnamese cart/form; real web links/buttons/selects, connected stages, familiar green completion check. |
| Flexibility | PASSED | Multiple listings/custom rows, coded VN destination, saved-address/manual fallback, explicit retry; actual 320/390/1280px layouts. |
| Simplicity | PASSED | Compact two-card overview; current success has one amount, no repeated implementation labels, centered icon/CTA. |
| Craft | PASSED | 44px rounded thumbnails and icon control, thin borders, typography, Vietnamese glyphs, focus outline, exact UUID navigation. |
| Delight | PASSED | Calm verified completion and direct next action; no animation or invented fulfillment claim. |

Target-platform fit PASSED: responsive web conventions, native semantic controls and own blue/white/navy brand. Apple HIG is a human-centered reference only; no current Apple-platform compliance claim or copied Apple expression. No new motion; reduced-motion preferences add no competing animation.

Writing/controls, feedback level, consequential choices, contextual help, privacy/account boundaries and Vietnamese inclusion: PASSED in the demonstrated web scope. RTL is NOT_APPLICABLE to this Vietnamese-only checkout. English tracking projection has regression tests; full checkout translation is not claimed. Keyboard focus and accessible tree/roles were checked; native VoiceOver/speech-input, real-device zoom and complete AT conformance remain NOT_RUN, not implied by DOM evidence. Long strings/UUIDs wrap at 320px and long PDF rows paginate; exhaustive pseudo-localization is not claimed.

Gate dimensions: Human Interface principles, target-platform fit, behavior meaning, audience, respectful natural tone, brevity, actions/states, data/privacy, semantic accessibility, locale formatting/wrapping, terminology and current in-context verification: PASSED within this local web review. Staff authenticated CRM browser path is not claimed: customer actions were exercised in browser; staff command paths via real HTTP and existing staff component/source are an explicitly disclosed proxy. Production acceptance needs the deferred provider/AT/environment checks.

Product Language Gate: PASSED for the current local implementation. Fixed findings: misleading final/source top-up descriptions, missing recipient incorrectly appearing delivered, raw transport errors, invalid fixed-listing balance action, repeated successful-payment labels, missing latest-receipt discovery. Remaining limitations and production owner decisions are recorded in IMPLEMENTATION-REPORT.md.

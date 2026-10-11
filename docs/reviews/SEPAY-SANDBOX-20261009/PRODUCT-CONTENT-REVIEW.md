# Product Content Review — integrated sandbox payment

## Scope and evidence boundary

Vietnamese web customers review a mixed cart, pay full initial goods/service charges, then review any staff-proposed balance before paying again. This review covers the SePay-specific payment/completion notices, newly exposed handler feedback, payment capability/method semantics and PDF metadata. Existing recipient/cart wording is not redesigned. SatsunicGo blue/white/navy and native web controls remain authoritative. Apple Human Interface principles are a human-centered reference, not an Apple-platform compliance claim; no Apple-only expression or assets are used.

Reviewer: integration owner, 2026-10-09. Contracts: `.ai/rules/product-content-integrity.md`, product-content/visual-design/web-app profiles, write-product-content references. Method selector evidence and its eight-principle review are in PAYMENT-METHODS-PRODUCT-REVIEW.md and PAYMENT-METHODS-COLORS-REVIEW.md; both disclose the actual-component/synthetic-surrounding-page proxy. Current PDF evidence is five actual-renderer synthetic fixture variants, including an eight-page30line case, in output/pdf/pdf-website-branding-20261009. Independent copy/branding reviews and text/bounds/brand equivalence checks are in PDF-NATURAL-COPY-* and PDF-WEBSITE-BRANDING-*. Earlier persisted-receipt previews are historical; current emulator/unit checks separately verify rendering/private receipt jobs. No real customer or provider data is used.

Unknown/blocker: the current authenticated PurchasePayment route could not be rendered/interacted with through the browser tool because it rejected localhost access. That rejection was respected; no alternate browser, protocol or automation workaround was attempted. Existing source and PDF evidence cannot establish live payment-route keyboard, dynamic-state or narrow-layout acceptance.

## Content inventory

| Location/state | Current new/changed content | Job and verified behavior |
| --- | --- | --- |
| Payment/pending sandbox | QR chuyển khoản qua SePay sandbox. Đây là thanh toán thử, không thu tiền thật. | Distinguishes the test provider from real money; provider is pinned server-side |
| Completion/paid sandbox | Thanh toán thử, không thu tiền thật. | Qualifies the existing success title only after durable paid state |
| Payment/readback error retained | Chưa kiểm tra được lượt thanh toán. Tải lại để tiếp tục với cùng mã. | Existing owned checkout remains visible before provider readback; reload/reconcile uses same ID |
| Payment/unknown retained | Tiếp tục kiểm tra thanh toán; Kiểm tra lại trạng thái | SePay unknown invokes read/reconcile rather than posting another payment form |
| API/environment or missing proof | Kênh thử chưa khả dụng.; Chưa xác minh được giao dịch. | Exact demo identity/proof guard, not a payment success |
| API/invalid ID | Kiểm tra lại mã thanh toán. | Strict UUID/action schema; no resource details exposed |
| API/unauthorized | Chưa mở được thanh toán.; Tài khoản chưa thể tiếp tục mua hàng. | Verified Google owner and unlocked account required |
| API/intent mismatch | Lượt thanh toán cần đối chiếu.; Mã thanh toán cần đối chiếu. | Immutable amount/hash/method/invoice binding fails safely |
| API/stale or closed attempt | Lượt này cần kiểm tra kết quả trước khi tiếp tục.; Xem lại lượt thanh toán trước khi tiếp tục. | Existing expired/terminal attempt cannot be re-signed as a new payment |
| API/config unavailable | Kênh thanh toán đang chờ thiết lập. Lượt của bạn được giữ lại. | No provider form when readiness absent; no deletion of existing intent |
| API/readback failure | Chưa xác minh được với SePay. Giữ cùng lượt và kiểm tra lại sau. | Redacted transient error; same intent/invoice persists |
| Checkout/unavailable retained | Kênh thanh toán đang chờ thiết lập. Giỏ và thông tin của bạn được giữ lại.; Kênh thanh toán đang chờ thiết lập. | Unsupported/missing method/config cannot commit a sandbox checkout |
| Staff/order hold on VOID | Giao dịch thanh toán cần đối chiếu | Authenticated VOID freezes fulfillment; no automatic refund/reversal |
| Balance mismatch hold retained | Khoản trả thêm cần đối chiếu | Received money retained without silently funding a stale target |
| PDF/method | QR chuyển khoản · SePay sandbox | Matches BANK_TRANSFER; comes from immutable sandbox receipt provider/method |
| PDF/test | SePay sandbox | User-requested concise sandbox designation remains in the method; duplicate “Không thu tiền thật” removed for SePay only. Demo retains its helper; UI keeps explicit test/no-real-money notice |
| PDF/invoice | Mã thanh toán SePay | Pinned provider invoice, distinct from receipt ID and transaction reference |
| PDF/merchant | Mã đơn vị SePay | Fixed sandbox merchant identifier, distinct from invoice/transaction |
| PDF/missing invoice or merchant fallback | Chưa có mã | Missing values do not become blank success or zero; actual settled fixtures contain both |
| PDF/time retained | Thời gian thanh toán; Giờ Việt Nam (GMT+7) | Immutable verified paidAt, formatted vi-VN / Asia/Ho_Chi_Minh; never local render time |
| PDF/receipt meaning | Không thay thế hóa đơn thuế. | Concise footer preserves the tax-invoice boundary |
| PDF/initial custom note | Cước vận chuyển, thông quan và giao nội địa của hàng cần tìm mua chưa thu. Bạn duyệt các phí này trước khi gửi hàng. | Explicitly limits unpaid charges to custom sourcing items |
| PDF/mixed-cart extra note | Hàng niêm yết giữ giá trọn gói. | Only shown when catalog items exist; does not imply unpaid listed-item freight |
| PDF/catalog-only note | Giá niêm yết là giá trọn gói. | Server-listed price meaning retained |
| PDF/sourcing balance note | Bạn đã trả phần chênh lệch giá mua. Cước và phí còn lại sẽ được chốt trước khi gửi hàng. | Paid approved sourcing increase; final shipping still separate |
| PDF/final balance note | Bạn đã thanh toán phần chi phí còn lại theo tổng tiền đã duyệt. | Paid final approved balance, no extra payment promise |
| PDF/final page | Cảm ơn bạn đã tin tưởng và chọn dịch vụ mua hộ của SatsunicGo. | Direct human refinement; centered once on final page, including multipage receipts |
| PDF/branding | SatsunicGo; MUA HỘ QUỐC TẾ | Website parcel vector and navy Satsunic/blue Go, current website token colors; payment text/values equivalent to copy version |
| Selector/all states | Full inventory delegated to paired method/product/color reviews | Three native radios; only ready BANK_TRANSFER; explicit unavailable alternatives |

Extracted settlement retains previous demo strings. User-facing generic UI error mapping does not expose raw provider or secret errors. Internal failure codes/enum values are private evidence, not displayed to customers. No secret is part of the content inventory.

## State coverage

| State | Status and evidence |
| --- | --- |
| Default/action | PASSED for selector/PDF proxies; payment-route actual interaction NOT_RUN |
| Loading/pending/disabled | Selector busy/missing/unavailable proxy PASSED; new payment-route provider/pending transition visual acceptance NOT_RUN |
| Empty/true zero | NOT_APPLICABLE to paid receipt; absent capability explicitly unavailable; no paid-zero receipt allowed |
| Success | Backend/PDF PASSED: exact settlement only; actual payment/completion route visual state NOT_RUN |
| Error/recovery | Server fixtures PASSED: wrong amounts, timeouts, retry, configuration, stale target and auth. Payment-route dynamic announcement/interaction NOT_RUN |
| Offline/stale/partial | Source preserves same checkout and ignores stale generations; full browser offline/account-switch NOT_RUN |
| Unauthorized/forbidden | Owner/schema/rules tests PASSED; sign-in screen redesign not in this delta |
| Confirmation/destructive | Selector confirmation proxy PASSED; no refund/delete action added; public payment submission NOT_RUN |

## Data semantics and privacy

The source of truth is immutable server-calculated checkout plus authenticated, persisted provider readback proof. A callback URL is only a signal. Money uses integer VND, itemized goods/service sums and exact balance due. Estimated shipping remains distinct from collected charges. PDF time is transaction paidAt in Vietnam; receipt ID, invoice, merchant and transaction reference are separately labeled. Unknown provider result remains unknown, wrong/late/second money remains review evidence. No financial TTL or automatic reversal. Owner receipt API/private storage and deny-by-default provider collections preserve access boundaries. Synthetic records are tagged testMode/provider and exist only in the exact demo database. The PDF copy refinement does not change those values, settlement, tax meaning or demo helper text; it removes duplicate SePay wording while preserving the sandbox designation and current explicit UI notice.

## Mandatory principles

| Principle | Status | Current evidence |
| --- | --- | --- |
| Purpose | PASSED | Existing Overview selector and itemized payment PDF support review/payment recognition; no new step |
| Agency | PASSED for verified slices | Native selector, same-attempt manual recovery, no callback-driven success; actual route interaction remains a separate missing check |
| Responsibility | PASSED | Test/no-real-money notice, wrong-money review, no tax-invoice claim or autonomous refund |
| Familiarity | PASSED | Vietnamese bank/QR terminology, native controls, VND and familiar receipt hierarchy |
| Flexibility | NOT_RUN for complete payment route | Selector320px/200% proxy and PDF pages inspected; payment-route mobile/keyboard/account-switch not exercised |
| Simplicity | PASSED for verified slices | One enabled method, brief test notice, metadata grouped in the existing PDF panel |
| Craft | NOT_RUN for complete payment route | Current PDF alignment/text and selector accessibility verified; new route dynamic feedback cannot be certified from source |
| Delight | PASSED for verified slices | Quiet existing compact card, full-row targets, readable PDF; no added animation or interruption; no user-research claim |

## Platform/pattern/gate checks

Cross-platform web conventions apply. Native radio labels and disabled states carry meaning beyond color. No new animation; reduced-motion behavior is unchanged. PDF is printable A4 with embedded Unicode font and no remote resources. Vietnamese is the configured locale; RTL/new translations and full screen-reader sessions are NOT_RUN.

| Gate | Status | Evidence |
| --- | --- | --- |
| Meaning matches behavior/business context | PASSED | Domain/unit/emulator tests and current PDF readback |
| Natural respectful tone/concision/terminology | PASSED by contextual source+PDF/selector review | No unsupported promise of shipping, refund, email or real payment |
| Source state coverage/data semantics/privacy | PASSED | Explicit pending/unknown/review paths; private proofs; no false zero/success |
| Target-platform fit | PASSED for selector/PDF; route NOT_RUN | Existing web conventions; no Apple compliance claim |
| Accessibility/localization/text expansion | NOT_RUN for complete payment route | Selector proxy verified; current route keyboard/live-region/zoom evidence missing |
| Current in-context verification | NOT_RUN for complete payment route | Browser rejection; independent selector/PDF evidence limited to their slices |

Product Language Gate: **BLOCKED for the integrated payment-route handoff**. Selector and PDF slices have passing bounded reviews, but cannot substitute for missing route evidence. No wording defect remains identified within executed checks. Required next evidence: authenticated current payment/completion route at desktop/narrow widths, keyboard/dynamic states and account-switch/offline recovery through an authorized browser environment. Real provider acceptance is separately unverified; public IPN remains user-deferred.

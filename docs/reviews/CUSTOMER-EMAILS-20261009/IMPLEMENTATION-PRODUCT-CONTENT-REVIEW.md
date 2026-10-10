# Product Content Review — implemented v2

Surface: Vietnamese transactional email subject, hidden preheader, HTML/plain-text body, owner inbox title and destination. Target: HTML email and web inbox. Browser-rendered email is the disclosed proxy for native mail clients. Reviewer: Codex, 2026-10-09.

Verified source: canonical customer-email-catalog.ts, customer-notification.ts, event producers, email-content.ts, customer-email-job.ts, Notifications.tsx. Approved v2 appearance retained; inherited overflow-wrap:anywhere is the only shell adjustment, verified with 900-character unbroken Vietnamese text and maximum safe integer amounts.

## Content inventory

| Template/state | Heading | Meaning and action evidence |
| --- | --- | --- |
| `request_received` | Đã nhận yêu cầu mua hộ | Runtime strict fields; typed owner destination; RUNTIME-COVERAGE.md |
| `order_received` | Đơn hàng đã được tạo | Runtime strict fields; typed owner destination; RUNTIME-COVERAGE.md |
| `quote_ready` | Báo giá đã sẵn sàng | Runtime strict fields; typed owner destination; RUNTIME-COVERAGE.md |
| `quote_accepted` | Đã lưu lựa chọn của bạn | Runtime strict fields; typed owner destination; RUNTIME-COVERAGE.md |
| `payment_reported` | Đã nhận thông tin chuyển khoản | Runtime strict fields; typed owner destination; RUNTIME-COVERAGE.md |
| `payment_confirmed` | Đã xác nhận thanh toán | Runtime strict fields; typed owner destination; RUNTIME-COVERAGE.md |
| `payment_review` | Cần đối chiếu thanh toán | Runtime strict fields; typed owner destination; RUNTIME-COVERAGE.md |
| `payment_failed` | Thanh toán chưa hoàn tất | Runtime strict fields; typed owner destination; RUNTIME-COVERAGE.md |
| `payment_expired` | Lượt thanh toán đã hết hạn | Runtime strict fields; typed owner destination; RUNTIME-COVERAGE.md |
| `price_change_proposed` | Bạn xem giúp giá mua mới | Runtime strict fields; typed owner destination; RUNTIME-COVERAGE.md |
| `change_proposed` | Có phương án thay đổi | Runtime strict fields; typed owner destination; RUNTIME-COVERAGE.md |
| `change_accepted` | Đã lưu phương án bạn đồng ý | Runtime strict fields; typed owner destination; RUNTIME-COVERAGE.md |
| `change_rejected` | Đã lưu lựa chọn từ chối | Runtime strict fields; typed owner destination; RUNTIME-COVERAGE.md |
| `change_applied` | Đơn hàng đã được cập nhật | Runtime strict fields; typed owner destination; RUNTIME-COVERAGE.md |
| `order_hold` | Đơn hàng đang tạm dừng | Runtime strict fields; typed owner destination; RUNTIME-COVERAGE.md |
| `purchase_partial` | Đã mua một phần hàng | Runtime strict fields; typed owner destination; RUNTIME-COVERAGE.md |
| `purchase_completed` | Đã mua đủ hàng | Runtime strict fields; typed owner destination; RUNTIME-COVERAGE.md |
| `warehouse_received` | Kho đã nhận hàng | Runtime strict fields; typed owner destination; RUNTIME-COVERAGE.md |
| `warehouse_issue` | Hàng nhận có vấn đề | Runtime strict fields; typed owner destination; RUNTIME-COVERAGE.md |
| `final_balance_due` | Chi phí cuối đã được chốt | Runtime strict fields; typed owner destination; RUNTIME-COVERAGE.md |
| `final_no_balance` | Đơn hàng đã đủ thanh toán | Runtime strict fields; typed owner destination; RUNTIME-COVERAGE.md |
| `excess_payment_review` | Có khoản thanh toán dư | Runtime strict fields; typed owner destination; RUNTIME-COVERAGE.md |
| `shipment_dispatched` | Kiện hàng đã được gửi | Runtime strict fields; typed owner destination; RUNTIME-COVERAGE.md |
| `shipment_progress` | Hành trình có cập nhật | Runtime strict fields; typed owner destination; RUNTIME-COVERAGE.md |
| `delivery_estimate_changed` | Lịch giao dự kiến thay đổi | Runtime strict fields; typed owner destination; RUNTIME-COVERAGE.md |
| `delivery_failed` | Kiện hàng chưa giao được | Runtime strict fields; typed owner destination; RUNTIME-COVERAGE.md |
| `shipment_returned` | Kiện hàng được ghi nhận hoàn về | Runtime strict fields; typed owner destination; RUNTIME-COVERAGE.md |
| `parcel_delivered_partial` | Đã giao một kiện hàng | Runtime strict fields; typed owner destination; RUNTIME-COVERAGE.md |
| `order_delivered` | Đơn hàng đã được giao đủ | Runtime strict fields; typed owner destination; RUNTIME-COVERAGE.md |
| `order_cancelled` | Đơn hàng đã được hủy | Runtime strict fields; typed owner destination; RUNTIME-COVERAGE.md |
| `refund_requested` | Đã ghi nhận yêu cầu hoàn tiền | Runtime strict fields; typed owner destination; RUNTIME-COVERAGE.md |
| `refund_request_cancelled` | Yêu cầu hoàn tiền đã được hủy | Runtime strict fields; typed owner destination; RUNTIME-COVERAGE.md |
| `refund_recorded` | Đã ghi nhận khoản hoàn tiền | Runtime strict fields; typed owner destination; RUNTIME-COVERAGE.md |
| `financial_adjustment` | Thanh toán có điều chỉnh | Runtime strict fields; typed owner destination; RUNTIME-COVERAGE.md |
| `payment_allocated` | Đã đối chiếu khoản thanh toán | Runtime strict fields; typed owner destination; RUNTIME-COVERAGE.md |
| `order_reply` | Bên mình đã trả lời về đơn | Runtime strict fields; typed owner destination; RUNTIME-COVERAGE.md |
| `support_reply` | Bạn có phản hồi mới | Runtime strict fields; typed owner destination; RUNTIME-COVERAGE.md |
| `membership_activated` | Gói của bạn đã được kích hoạt | Runtime strict fields; typed owner destination; RUNTIME-COVERAGE.md |
| `membership_expiring` | Gói của bạn sắp hết hạn | Runtime strict fields; typed owner destination; RUNTIME-COVERAGE.md |
| `membership_expired` | Gói của bạn đã hết hạn | Runtime strict fields; typed owner destination; RUNTIME-COVERAGE.md |
| `receipt_ready` | Chứng từ thanh toán đã sẵn sàng | Runtime strict fields; typed owner destination; RUNTIME-COVERAGE.md |
| `internal_document_issued` | Chứng từ đơn hàng đã được xuất | Runtime strict fields; typed owner destination; RUNTIME-COVERAGE.md |

Additional changed strings: six fixed PaymentScope copies; purchased/remaining/received quantities; public warehouse/hold/price-change explanations; customer-safe refund cancellation/reversal descriptions; parcel-only summaries. Private staff notes, bank references and other owners’ items are excluded. Inbox displays the same approved heading and CTA, with validated route fallback. No forms, buttons changing business state or tracking pixels appear in email.

## State coverage

| State | Result | Evidence |
| --- | --- | --- |
| Default/action | PASSED | 42 runtime samples and correct authenticated routes |
| Loading/pending | PASSED | reported payment and proposed/refund pending copy; inbox existing loading retained |
| Empty/zero | PASSED | missing fields blocked; zeroAmount strictly zero; final-zero versus excess distinguished |
| Success | PASSED | verified payment, purchased/delivered and recorded refund stay distinct |
| Error/recovery | PASSED | preflight failed vs provider unknown; no success fallback |
| Stale/partial | PASSED | renewed membership, old proposal/refund/warehouse suppressed; partial parcel copy |
| Unauthorized | PASSED | owner-only projection and active verified Auth; no private note or cross-owner allocation |
| Consequential choices | PASSED | email GET navigates only; app domain command retains approval and money authority |

Data: integer VND, vi-VN; timestamps Asia/Ho_Chi_Minh. Null/unknown never become zero. Refund recorded does not claim bank credit. Final balance excludes ambiguous reserved/held cases. Forecast wording never becomes a promise.

## Human Interface principles

| Principle | Status | Current evidence |
| --- | --- | --- |
| Purpose | PASSED | One state, amount where relevant, one primary destination |
| Agency | PASSED | Navigation-only CTA; confirmed optional order purpose rechecked before send; conditional channels remain off |
| Responsibility | PASSED | Owner/resource validation, financial arithmetic checks, no bank-credit or delivery guarantee |
| Familiarity | PASSED | Actual SatsunicGo wordmark, blue-white-navy colors, existing account/support/terms/privacy routes |
| Flexibility | PASSED | HTML/plain-text parity, no image/font dependencies, long Vietnamese content at 320px |
| Simplicity | PASSED | Compact header, lead, details and CTA; no generic long thank-you paragraphs |
| Craft | PASSED | 42 mobile overflow checks, actual backend samples, desktop/mobile images; stale-state guards |
| Delight | PASSED | Brief context-appropriate thanks, calm errors, no celebratory or coercive failure copy |

Platform fit: cross-platform email/web, not Apple UI. Table layout marked presentation, semantic h1 and readable links. No Apple-specific expression imported. Browser proxy all 42 at 320px: no overflow/unresolved fields, one h1 each. Keyboard Tab from primary CTA reaches Tài khoản. Desktop 1280x960 screenshot saved. Long-content overflow improved from 6605px to 320px.

Patterns: writing/control names PASSED; interruption level PASSED (policy-separated inbox/email); consequences PASSED; onboarding NOT_APPLICABLE; privacy/purpose PASSED; accessibility/localization PASSED within proxy. Actual Gmail/Outlook/Apple Mail, screen-reader session and authenticated inbox end-to-end are NOT_RUN; no mail-client or deployed-UX acceptance claimed.

Product Language Gate: PASSED for implemented local/proxy scope. Production activation remains NOT_READY; actual mail-client and deliverability acceptance remain separate.

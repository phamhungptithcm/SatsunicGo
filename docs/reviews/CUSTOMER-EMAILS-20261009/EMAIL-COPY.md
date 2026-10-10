# SatsunicGo · Bộ mẫu email v2

42 mẫu dùng chung một hệ thiết kế. Bản mẫu, chưa tích hợp gửi email. Dữ liệu ví dụ là minh họa.

## 01. request_received

**Tiêu đề email:** Đã nhận yêu cầu mua hộ {{orderRef}}
**Dòng xem trước:** Bạn có thể theo dõi yêu cầu trong tài khoản.

### Đã nhận yêu cầu mua hộ

Bạn có thể xem lại yêu cầu và theo dõi bước tiếp theo trong tài khoản.

- Đơn hàng: {{orderRef}}

**Nút:** Xem yêu cầu

Cảm ơn bạn đã tin tưởng SatsunicGo.

Điều kiện gửi: Request exists and belongs to recipient. No purchase or payment success implied.
Kênh: in_app_only

## 02. order_received

**Tiêu đề email:** Đơn {{orderRef}} đã được tạo
**Dòng xem trước:** Đơn đã được lưu; khoản thanh toán vẫn cần được xác nhận.

### Đơn hàng đã được tạo

Đơn đã được lưu và đang chờ xác nhận thanh toán.

- Đơn hàng: {{orderRef}}
- Sản phẩm: {{itemSummary}}

**Nút:** Xem đơn hàng

Cảm ơn bạn đã chọn SatsunicGo.

Điều kiện gửi: Only legacy saved-unpaid catalog flow. Suppress when the checkout creates orders only after verified payment.
Kênh: email_and_in_app

## 03. quote_ready

**Tiêu đề email:** Báo giá cho yêu cầu {{orderRef}} đã sẵn sàng
**Dòng xem trước:** Xem chi phí và điều khoản trước khi quyết định.

### Báo giá đã sẵn sàng

Bạn xem chi phí và điều khoản trước khi quyết định nhé.

**Tổng báo giá: {{quotedTotal}}**

- Đơn hàng: {{orderRef}}

**Nút:** Xem báo giá



Điều kiện gửi: Legacy quote flow only; exact quote revision still awaiting customer acceptance. No invented expiry.
Kênh: email_and_in_app

## 04. quote_accepted

**Tiêu đề email:** Bạn đã đồng ý báo giá cho {{orderRef}}
**Dòng xem trước:** Xem khoản cần thanh toán trong đơn.

### Đã lưu lựa chọn của bạn

Bạn đã đồng ý báo giá. Khoản thanh toán vẫn cần được xác nhận.

- Đơn hàng: {{orderRef}}
- Báo giá đã đồng ý: {{quotedTotal}}

**Nút:** Xem thanh toán



Điều kiện gửi: Acceptance is persisted; not proof of payment; do not use for upfront checkout.
Kênh: in_app_only

## 05. payment_reported

**Tiêu đề email:** Đã nhận thông tin chuyển khoản cho {{orderRef}}
**Dòng xem trước:** Thông tin đã được lưu, khoản tiền chưa được xác nhận.

### Đã nhận thông tin chuyển khoản

Khoản tiền đang chờ đối chiếu. Bạn chưa cần chuyển lại.

- Đơn hàng: {{orderRef}}

**Nút:** Xem trạng thái thanh toán



Điều kiện gửi: Only actual pending transfer review; never map browser return to this event.
Kênh: in_app_only

## 06. payment_confirmed

**Tiêu đề email:** Đã xác nhận thanh toán · {{orderRef}}
**Dòng xem trước:** Khoản thanh toán đã được xác nhận.

### Đã xác nhận thanh toán

{{paymentScope}}

**Khoản đã nhận: {{paidAmount}}**

- Đơn hàng: {{orderRef}}

**Nút:** Xem thanh toán

Cảm ơn bạn đã tin tưởng SatsunicGo.

Điều kiện gửi: One message per payment receipt/checkout, not one per order line. Exact initial/full/balance scope; no unverified future shipping total.
Kênh: email_and_in_app

## 07. payment_review

**Tiêu đề email:** Cần kiểm tra khoản thanh toán cho {{orderRef}}
**Dòng xem trước:** Xem thông tin cần bổ sung trước khi thanh toán thêm.

### Cần đối chiếu thanh toán

{{customerReason}}.

- Đơn hàng: {{orderRef}}

**Nút:** Xem việc cần bổ sung

Nếu đã chuyển tiền, bạn chưa cần chuyển lại trong lúc kiểm tra.

Điều kiện gửi: Verified review state plus safe customer reason and real evidence-submission path. Unknown transport alone does not trigger email.
Kênh: email_and_in_app_if_action_required

## 08. payment_failed

**Tiêu đề email:** Thanh toán cho {{orderRef}} chưa hoàn tất
**Dòng xem trước:** Kiểm tra trạng thái trước khi thử lại.

### Thanh toán chưa hoàn tất

Kiểm tra trạng thái trước khi thanh toán lại.

- Đơn hàng: {{orderRef}}

**Nút:** Kiểm tra thanh toán

Nếu ngân hàng đã trừ tiền, bạn liên hệ hỗ trợ để kiểm tra nhé.

Điều kiện gửi: Terminal failure must come from provider readback; unknown/pending cannot use failed wording.
Kênh: in_app_only

## 09. payment_expired

**Tiêu đề email:** Lượt thanh toán cho {{orderRef}} đã hết hạn
**Dòng xem trước:** Xem lại trạng thái và giá hiện tại trước khi tiếp tục.

### Lượt thanh toán đã hết hạn

Bạn xem lại trạng thái thanh toán và giá hiện tại trước khi tiếp tục.

- Đơn hàng: {{orderRef}}

**Nút:** Xem thanh toán



Điều kiện gửi: Checkout preview expiresAt alone does not prove provider session expired; reconcile late payments first.
Kênh: in_app_only

## 10. price_change_proposed

**Tiêu đề email:** Bạn xem giúp giá mua mới cho {{orderRef}}
**Dòng xem trước:** Giá thay đổi cần bạn đồng ý trước khi mua tiếp.

### Bạn xem giúp giá mua mới

{{customerReason}}.

**Tổng theo giá mới: {{proposedTotal}}**

- Đơn hàng: {{orderRef}}
- Giá trước đó: {{previousTotal}}
- Chênh lệch tăng: {{differenceAmount}}

**Nút:** Xem giá mua mới

Phần mua theo giá mới cần bạn đồng ý.

Điều kiện gửi: Current unapproved proposal; exact version, same-currency totals and preserved paid scope; approved is not paid. Previous total must be an authoritative amount in the same cost scope as proposed total.
Kênh: email_and_in_app

## 11. change_proposed

**Tiêu đề email:** Có phương án thay đổi cho đơn {{orderRef}}
**Dòng xem trước:** Xem nội dung và chi phí trước khi quyết định.

### Có phương án thay đổi

Bạn xem phương án và chi phí trước khi chọn đồng ý hoặc từ chối.

- Đơn hàng: {{orderRef}}
- Phương án: {{changeSummary}}
- Chi phí: {{costImpact}}

**Nút:** Xem phương án



Điều kiện gửi: Current proposal pending customer decision; alternatives supported by actual change UI; no raw internal reason.
Kênh: email_and_in_app

## 12. change_accepted

**Tiêu đề email:** Đã lưu lựa chọn của bạn cho {{orderRef}}
**Dòng xem trước:** Bạn đã đồng ý phương án thay đổi.

### Đã lưu phương án bạn đồng ý

Lựa chọn đã được lưu. Bạn có thể xem bước tiếp theo trong đơn.

- Đơn hàng: {{orderRef}}
- Phương án: {{changeSummary}}

**Nút:** Xem đơn hàng



Điều kiện gửi: Acceptance persisted for exact proposal version; do not imply applied or additional payment confirmed.
Kênh: in_app_only

## 13. change_rejected

**Tiêu đề email:** Đã lưu lựa chọn của bạn cho {{orderRef}}
**Dòng xem trước:** Bạn đã từ chối phương án thay đổi.

### Đã lưu lựa chọn từ chối

Bạn có thể trao đổi thêm với bên mình trong đơn.

- Đơn hàng: {{orderRef}}
- Phương án đã từ chối: {{changeSummary}}

**Nút:** Xem đơn hàng



Điều kiện gửi: Exact rejection persisted; no promise of cancellation/refund.
Kênh: in_app_only

## 14. change_applied

**Tiêu đề email:** Đơn {{orderRef}} đã được cập nhật
**Dòng xem trước:** Phương án bạn đồng ý đã được áp dụng.

### Đơn hàng đã được cập nhật

Phương án bạn đồng ý đã được áp dụng.

- Đơn hàng: {{orderRef}}
- Nội dung cập nhật: {{changeSummary}}

**Nút:** Xem thay đổi



Điều kiện gửi: Same accepted proposal successfully applied; amount changes requiring new approval must not use this template.
Kênh: in_app_only

## 15. order_hold

**Tiêu đề email:** Đơn {{orderRef}} đang tạm dừng xử lý
**Dòng xem trước:** Xem lý do và bước tiếp theo trong đơn.

### Đơn hàng đang tạm dừng

{{customerReason}}.

- Đơn hàng: {{orderRef}}

**Nút:** Xem tình trạng đơn

{{nextStep}}

Điều kiện gửi: Only reviewed safe reason and supported next step; internal notes must never be copied verbatim.
Kênh: email_and_in_app_if_action_required

## 16. purchase_partial

**Tiêu đề email:** Đã mua một phần hàng trong {{orderRef}}
**Dòng xem trước:** Xem các món đã mua và phần còn lại.

### Đã mua một phần hàng

Bạn có thể theo dõi từng món trong đơn.

- Đơn hàng: {{orderRef}}
- Đã mua: {{purchasedSummary}}
- Còn lại: {{remainingSummary}}

**Nút:** Xem tiến độ mua



Điều kiện gửi: Derived from recorded per-line quantities; no full-order success or invented next purchase date.
Kênh: in_app_only

## 17. purchase_completed

**Tiêu đề email:** Đã mua đủ hàng cho {{orderRef}}
**Dòng xem trước:** Các món trong đơn đã được mua đủ.

### Đã mua đủ hàng

Các món trong đơn đã được mua đủ.

- Đơn hàng: {{orderRef}}
- Sản phẩm: {{itemSummary}}

**Nút:** Xem tiến độ



Điều kiện gửi: Recorded purchased quantities cover all ordered quantities; not warehouse receipt.
Kênh: optional_progress_email

## 18. warehouse_received

**Tiêu đề email:** Kho đã nhận hàng cho {{orderRef}}
**Dòng xem trước:** Xem số lượng hàng đã nhận.

### Kho đã nhận hàng

Số lượng hàng nhận đã được cập nhật trong đơn.

- Đơn hàng: {{orderRef}}
- Đã nhận: {{receivedSummary}}

**Nút:** Xem hàng đã nhận



Điều kiện gửi: Exact receipt quantities only; do not claim all items or inspection passed unless recorded.
Kênh: in_app_only

## 19. warehouse_issue

**Tiêu đề email:** Có vấn đề với hàng của đơn {{orderRef}}
**Dòng xem trước:** Xem phần hàng bị ảnh hưởng và hướng xử lý.

### Hàng nhận có vấn đề

{{customerReason}}.

- Đơn hàng: {{orderRef}}

**Nút:** Xem tình trạng hàng

{{nextStep}}

Điều kiện gửi: Reviewed shortage/damage facts and real next step; no invented replacement or refund guarantee.
Kênh: email_and_in_app

## 20. final_balance_due

**Tiêu đề email:** Chi phí cuối của {{orderRef}} đã có
**Dòng xem trước:** Xem chi tiết khoản còn cần thanh toán.

### Chi phí cuối đã được chốt

Bạn xem bảng chi phí trước khi thanh toán phần còn lại nhé.

**Còn cần thanh toán: {{balanceDue}}**

- Đơn hàng: {{orderRef}}
- Chi phí cuối: {{finalTotal}}
- Đã thanh toán sau điều chỉnh: {{netPaid}}

**Nút:** Xem chi phí và thanh toán



Điều kiện gửi: Final approved version; positive balance excludes reserved refunds per domain; no deadline unless policy exists.
Kênh: email_and_in_app

## 21. final_no_balance

**Tiêu đề email:** Chi phí đơn {{orderRef}} đã được chốt
**Dòng xem trước:** Bạn không cần thanh toán thêm theo chi phí đã chốt.

### Đơn hàng đã đủ thanh toán

Bạn không cần thanh toán thêm theo bảng chi phí đã chốt.

**Cần thanh toán thêm: {{zeroAmount}}**

- Đơn hàng: {{orderRef}}
- Chi phí cuối: {{finalTotal}}

**Nút:** Xem bảng chi phí



Điều kiện gửi: Current approved total fully funded, no excess, no unresolved reversal or refund reservation; zero is explicit. zeroAmount is literal formatted integer zero, not null fallback.
Kênh: in_app_only

## 22. excess_payment_review

**Tiêu đề email:** Có khoản chênh lệch cần xử lý cho {{orderRef}}
**Dòng xem trước:** Khoản chênh lệch chưa phải là tiền đã hoàn.

### Có khoản thanh toán dư

Bạn có thể trao đổi với bên mình về cách xử lý khoản chênh lệch.

**Khoản dư đã đối chiếu: {{excessAmount}}**

- Đơn hàng: {{orderRef}}

**Nút:** Xem khoản chênh lệch

Khoản này chưa được xác nhận hoàn tiền.

Điều kiện gửi: Verified excess after net collections, adjustments and pending refund reservations; no auto-refund promise.
Kênh: email_and_in_app

## 23. shipment_dispatched

**Tiêu đề email:** Kiện {{parcelRef}} đã được bàn giao vận chuyển
**Dòng xem trước:** Theo dõi kiện hàng của đơn {{orderRef}}.

### Kiện hàng đã được gửi

Kiện đã được bàn giao cho đơn vị vận chuyển.

- Đơn hàng: {{orderRef}}
- Kiện hàng: {{parcelRef}}
- Đơn vị vận chuyển: {{carrierName}}
- Mã vận đơn: {{trackingCode}}
- Hàng trong kiện: {{parcelItems}}

**Nút:** Theo dõi kiện hàng



Điều kiện gửi: Actual handoff persisted; deduplicate batch/order/parcel paths; customer-only allocations; ETA omitted unless current and verified.
Kênh: email_and_in_app

## 24. shipment_progress

**Tiêu đề email:** Kiện {{parcelRef}} có cập nhật vận chuyển
**Dòng xem trước:** Xem vị trí hoặc chặng vận chuyển mới.

### Hành trình có cập nhật

{{trackingSummary}}.

- Đơn hàng: {{orderRef}}
- Kiện hàng: {{parcelRef}}
- Ghi nhận lúc: {{observedAt}}

**Nút:** Xem hành trình



Điều kiện gửi: Only public tracking fact; no email for repeated scans, metadata edits or same-state retries.
Kênh: in_app_only

## 25. delivery_estimate_changed

**Tiêu đề email:** Dự kiến giao kiện {{parcelRef}} đã thay đổi
**Dòng xem trước:** Đây là thời gian dự kiến, chưa phải cam kết giao hàng.

### Lịch giao dự kiến thay đổi

{{customerReason}}.

- Đơn hàng: {{orderRef}}
- Kiện hàng: {{parcelRef}}
- Dự kiến trước đó: {{previousWindow}}
- Dự kiến mới: {{deliveryWindow}}

**Nút:** Xem lịch giao dự kiến

Thời gian trên là dự kiến, chưa phải cam kết giao hàng.

Điều kiện gửi: New wiring required: setDeliveryEstimate currently emits no notification. Both windows valid, current in-transit/failed policy, materiality rule approved.
Kênh: email_and_in_app_if_material

## 26. delivery_failed

**Tiêu đề email:** Kiện {{parcelRef}} chưa giao được
**Dòng xem trước:** Xem lý do và thông tin cần kiểm tra.

### Kiện hàng chưa giao được

{{customerReason}}.

- Đơn hàng: {{orderRef}}
- Kiện hàng: {{parcelRef}}

**Nút:** Xem hướng xử lý

{{nextStep}}

Điều kiện gửi: Recorded failed attempt, customer-safe reason and supported next step; no automatic re-delivery date.
Kênh: email_and_in_app

## 27. shipment_returned

**Tiêu đề email:** Kiện {{parcelRef}} đã được ghi nhận hoàn về
**Dòng xem trước:** Xem tình trạng và cách xử lý tiếp theo.

### Kiện hàng được ghi nhận hoàn về

Bạn xem tình trạng và trao đổi hướng xử lý tiếp theo trong đơn.

- Đơn hàng: {{orderRef}}
- Kiện hàng: {{parcelRef}}

**Nút:** Xem tình trạng kiện



Điều kiện gửi: Persisted returned state; do not imply warehouse has received returned parcel or refund paid.
Kênh: email_and_in_app

## 28. parcel_delivered_partial

**Tiêu đề email:** Đã giao kiện {{parcelRef}} của đơn {{orderRef}}
**Dòng xem trước:** Đơn vẫn còn hàng đang được xử lý hoặc vận chuyển.

### Đã giao một kiện hàng

Đơn vẫn còn hàng đang được xử lý hoặc vận chuyển.

- Đơn hàng: {{orderRef}}
- Kiện hàng: {{parcelRef}}
- Đã giao trong kiện: {{parcelItems}}
- Phần còn lại: {{remainingSummary}}

**Nút:** Xem các kiện còn lại



Điều kiện gửi: Exact parcel allocation; order not fully delivered; suppress full-order delivery message.
Kênh: email_and_in_app

## 29. order_delivered

**Tiêu đề email:** Đơn {{orderRef}} đã được giao đủ
**Dòng xem trước:** Cảm ơn bạn đã tin tưởng SatsunicGo.

### Đơn hàng đã được giao đủ

Nếu hàng nhận có vấn đề, bạn có thể mở đơn để trao đổi với bên mình.

- Đơn hàng: {{orderRef}}

**Nút:** Xem đơn hàng

Cảm ơn bạn đã tin tưởng SatsunicGo.

Điều kiện gửi: All quantities delivered across all parcels; delivery is not customer satisfaction. Catalog variant removes mua hộ claim.
Kênh: email_and_in_app

## 30. order_cancelled

**Tiêu đề email:** Đơn {{orderRef}} đã được hủy
**Dòng xem trước:** Trạng thái hủy không thay thế xác nhận hoàn tiền.

### Đơn hàng đã được hủy

Bạn có thể xem trạng thái xử lý khoản đã thanh toán trong đơn.

- Đơn hàng: {{orderRef}}

**Nút:** Xem đơn đã hủy

Thông báo hủy đơn chưa phải xác nhận hoàn tiền.

Điều kiện gửi: Persisted cancellation only; do not expose a cancellation action unsupported for funded upfront orders.
Kênh: email_and_in_app

## 31. refund_requested

**Tiêu đề email:** Đã ghi nhận yêu cầu hoàn tiền cho {{orderRef}}
**Dòng xem trước:** Yêu cầu đang chờ xử lý, tiền chưa được xác nhận hoàn.

### Đã ghi nhận yêu cầu hoàn tiền

Yêu cầu đang chờ xử lý. Tiền chưa được xác nhận hoàn.

**Số tiền đề nghị hoàn: {{refundAmount}}**

- Đơn hàng: {{orderRef}}

**Nút:** Xem yêu cầu hoàn tiền



Điều kiện gửi: Actual pending refund reservation; staff-created request is not falsely attributed to customer submission.
Kênh: email_and_in_app

## 32. refund_request_cancelled

**Tiêu đề email:** Yêu cầu hoàn tiền cho {{orderRef}} đã được hủy
**Dòng xem trước:** Xem chi tiết xử lý trong đơn.

### Yêu cầu hoàn tiền đã được hủy

{{customerReason}}.

- Đơn hàng: {{orderRef}}
- Số tiền trong yêu cầu: {{refundAmount}}

**Nút:** Xem yêu cầu hoàn tiền

Bạn có thể trao đổi với bên mình trong đơn nếu cần làm rõ.

Điều kiện gửi: Cancellation persisted; reason must be reviewed for customer visibility, not raw finance notes.
Kênh: email_and_in_app

## 33. refund_recorded

**Tiêu đề email:** Đã ghi nhận hoàn {{refundAmount}} cho {{orderRef}}
**Dòng xem trước:** Xem xác nhận khoản hoàn trong đơn.

### Đã ghi nhận khoản hoàn tiền

Bạn có thể xem xác nhận khoản hoàn trong đơn.

**Khoản hoàn đã ghi nhận: {{refundAmount}}**

- Đơn hàng: {{orderRef}}
- Ghi nhận ngày: {{refundRecordedAt}}

**Nút:** Xem khoản hoàn

Nếu chưa thấy tiền về, bạn liên hệ bên mình để kiểm tra nhé.

Điều kiện gửi: Finance refund entry plus evidence; wording does not assert recipient bank credited. Provider settlement would require a distinct verified event.
Kênh: email_and_in_app

## 34. financial_adjustment

**Tiêu đề email:** Khoản thanh toán của {{orderRef}} có điều chỉnh
**Dòng xem trước:** Xem phần thay đổi và số tiền hiện tại.

### Thanh toán có điều chỉnh

{{customerReason}}.

- Đơn hàng: {{orderRef}}
- Ảnh hưởng đến chi phí: {{costImpact}}

**Nút:** Xem điều chỉnh thanh toán



Điều kiện gửi: Verified immutable correction and current balance; no claim of new payment or refund; reason redacted.
Kênh: email_and_in_app_if_action_required

## 35. payment_allocated

**Tiêu đề email:** Đã đối chiếu khoản tiền cho {{orderRef}}
**Dòng xem trước:** Khoản tiền đã được ghi nhận vào đúng đơn.

### Đã đối chiếu khoản thanh toán

Khoản tiền đã được ghi nhận vào đúng đơn.

**Khoản đã đối chiếu: {{paidAmount}}**

- Đơn hàng: {{orderRef}}

**Nút:** Xem thanh toán

Cảm ơn bạn đã chờ bên mình kiểm tra.

Điều kiện gửi: Allocate actual exception, not new charge; deduplicate against payment_confirmed for same allocation.
Kênh: email_and_in_app

## 36. order_reply

**Tiêu đề email:** Bên mình đã trả lời về đơn {{orderRef}}
**Dòng xem trước:** Mở cuộc trao đổi để xem và trả lời.

### Bên mình đã trả lời về đơn

Bạn mở cuộc trao đổi để xem và trả lời khi tiện nhé.

- Đơn hàng: {{orderRef}}

**Nút:** Xem phản hồi



Điều kiện gửi: Staff message only, never internal note/assignment; unread rule needs message-read evidence, not inbox read boolean.
Kênh: email_if_unread

## 37. support_reply

**Tiêu đề email:** Bạn có phản hồi mới từ SatsunicGo
**Dòng xem trước:** Xem phản hồi cho yêu cầu hỗ trợ {{ticketRef}}.

### Bạn có phản hồi mới

Bên mình đã trả lời yêu cầu hỗ trợ của bạn.

- Yêu cầu hỗ trợ: {{ticketRef}}

**Nút:** Xem phản hồi



Điều kiện gửi: Owner recipient; unread grace policy proposed, requires real conversation-read tracking.
Kênh: email_if_unread

## 38. membership_activated

**Tiêu đề email:** {{planName}} của bạn đã được kích hoạt
**Dòng xem trước:** Xem quyền lợi và thời hạn sử dụng.

### Gói của bạn đã được kích hoạt

Bạn có thể xem các quyền lợi áp dụng trong thông tin gói.

- Gói sử dụng: {{planName}}
- Có hiệu lực đến: {{endsAt}}

**Nút:** Xem gói của bạn

Cảm ơn bạn đã sử dụng gói của SatsunicGo.

Điều kiện gửi: Persisted subscription and exact endsAt; do not invent discount or auto-renewal.
Kênh: email_and_in_app

## 39. membership_expiring

**Tiêu đề email:** {{planName}} sẽ hết hạn vào {{endsAt}}
**Dòng xem trước:** Bạn có thể xem gói và chọn gia hạn khi cần.

### Gói của bạn sắp hết hạn

Bạn có thể chọn gia hạn nếu còn nhu cầu.

- Gói sử dụng: {{planName}}
- Ngày hết hạn: {{endsAt}}

**Nút:** Xem thông tin gia hạn

SatsunicGo không tự trừ tiền để gia hạn.

Điều kiện gửi: Active exact subscription term and approved daysBeforeExpiry, recheck before dispatch; one per term.
Kênh: email_and_in_app

## 40. membership_expired

**Tiêu đề email:** {{planName}} của bạn đã hết hạn
**Dòng xem trước:** Xem quyền lợi hiện tại và lựa chọn gia hạn.

### Gói của bạn đã hết hạn

Bạn có thể xem quyền lợi hiện tại và gia hạn khi cần.

- Gói sử dụng: {{planName}}
- Đã hết hạn ngày: {{endsAt}}

**Nút:** Xem gói của bạn

Cảm ơn bạn đã sử dụng gói trong thời gian qua.

Điều kiện gửi: Expired term still relevant; suppress if renewed before send.
Kênh: email_and_in_app

## 41. receipt_ready

**Tiêu đề email:** Chứng từ thanh toán {{receiptRef}} đã sẵn sàng
**Dòng xem trước:** Xem lại khoản thanh toán và tải chứng từ trong tài khoản.

### Chứng từ thanh toán đã sẵn sàng

Bạn có thể xem và tải chứng từ trong tài khoản.

- Chứng từ: {{receiptRef}}
- Khoản thanh toán: {{paidAmount}}

**Nút:** Xem chứng từ

Chứng từ này không thay thế hóa đơn thuế.

Điều kiện gửi: Document state ready, exact owner and immutable receipt; prefer merge with payment_confirmed when ready, no claim attachment unless attached.
Kênh: email_and_in_app

## 42. internal_document_issued

**Tiêu đề email:** Chứng từ đơn hàng {{documentNumber}} đã được xuất
**Dòng xem trước:** Số tiền phản ánh thời điểm xuất chứng từ.

### Chứng từ đơn hàng đã được xuất

Số tiền trên chứng từ phản ánh thời điểm xuất.

- Chứng từ nội bộ: {{documentNumber}}

**Nút:** Xem chứng từ đơn hàng

Đây không phải hóa đơn điện tử thuế.

Điều kiện gửi: Issued exact number and owner; payment receipt and internal statement are distinct documents.
Kênh: email_on_explicit_request

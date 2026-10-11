# Bộ email khách hàng SatsunicGO — bản đề xuất v1

**Chưa tích hợp hoặc gửi email.** Dữ liệu trong bản xem trước là minh họa. Tất cả điều kiện gửi phải được backend kiểm tra trước khi dùng.

Giọng viết: rõ việc trước, cảm ơn đúng lúc, không mở đầu bằng “Kính gửi Quý khách”, không nhắc lại “trân trọng cảm ơn” ở mọi email. Chữ ký chung: **Đội ngũ SatsunicGO**. Không dùng lời AI tự suy đoán làm căn cứ gửi.

Các mẫu chỉ dùng trong app vẫn được soạn đầy đủ để tái sử dụng; không có nghĩa là bật gửi tất cả qua email.

## 01. request_received · Đặt hàng

- Kênh đề xuất: Chỉ trong tài khoản
- Khi gửi: submitRequest committed
- Điều kiện: Request exists and belongs to recipient. No purchase or payment success implied.
- Nguồn: `functions/src/index.ts`

**Tiêu đề:** Đã nhận yêu cầu mua hộ {{orderRef}}
**Dòng xem trước:** Bạn có thể theo dõi yêu cầu trong tài khoản.

SatsunicGO đã nhận yêu cầu mua hộ {{orderRef}} của bạn.

Cảm ơn bạn đã tin tưởng nhờ bên mình mua hàng. Bạn có thể xem lại sản phẩm và thông tin đã gửi trong đơn.

**Nút:** Xem yêu cầu

Đội ngũ SatsunicGO

## 02. order_received · Đặt hàng

- Kênh đề xuất: Email + trong tài khoản
- Khi gửi: catalogCheckout committed
- Điều kiện: Only legacy saved-unpaid catalog flow. Suppress when the checkout creates orders only after verified payment.
- Nguồn: `functions/src/catalog-checkout.ts`

**Tiêu đề:** Đơn {{orderRef}} đã được tạo
**Dòng xem trước:** Đơn đã được lưu; khoản thanh toán vẫn cần được xác nhận.

Đơn {{orderRef}} đã được lưu với {{itemSummary}}.

Cảm ơn bạn đã chọn SatsunicGO. Đơn hiện chưa có xác nhận thanh toán; bạn có thể xem bước tiếp theo trong chi tiết đơn.

**Nút:** Xem đơn hàng

Đội ngũ SatsunicGO

## 03. quote_ready · Đặt hàng

- Kênh đề xuất: Email + trong tài khoản
- Khi gửi: issueQuote committed
- Điều kiện: Legacy quote flow only; exact quote revision still awaiting customer acceptance. No invented expiry.
- Nguồn: `functions/src/index.ts`

**Tiêu đề:** Báo giá cho yêu cầu {{orderRef}} đã sẵn sàng
**Dòng xem trước:** Xem chi phí và điều khoản trước khi quyết định.

Bên mình đã gửi báo giá {{quotedTotal}} cho yêu cầu {{orderRef}}.

Bạn xem chi tiết sản phẩm, chi phí và điều khoản trong đơn trước khi quyết định nhé.

**Nút:** Xem báo giá

Đội ngũ SatsunicGO

## 04. quote_accepted · Đặt hàng

- Kênh đề xuất: Chỉ trong tài khoản
- Khi gửi: acceptQuote committed
- Điều kiện: Acceptance is persisted; not proof of payment; do not use for upfront checkout.
- Nguồn: `functions/src/index.ts`

**Tiêu đề:** Bạn đã đồng ý báo giá cho {{orderRef}}
**Dòng xem trước:** Xem khoản cần thanh toán trong đơn.

Bạn đã đồng ý báo giá {{quotedTotal}} cho yêu cầu {{orderRef}}.

Khoản cần thanh toán và hướng dẫn tiếp theo nằm trong chi tiết đơn.

**Nút:** Xem thanh toán

Đội ngũ SatsunicGO

## 05. payment_reported · Thanh toán

- Kênh đề xuất: Chỉ trong tài khoản
- Khi gửi: transferReview committed
- Điều kiện: Only actual pending transfer review; never map browser return to this event.
- Nguồn: `functions/src/index.ts`

**Tiêu đề:** Đã nhận thông tin chuyển khoản cho {{orderRef}}
**Dòng xem trước:** Thông tin đã được lưu, khoản tiền chưa được xác nhận.

Bên mình đã nhận thông tin bạn báo chuyển khoản cho đơn {{orderRef}}.

Khoản tiền vẫn đang chờ đối chiếu. Bạn chưa cần chuyển lại.

**Nút:** Xem trạng thái thanh toán

Đội ngũ SatsunicGO

## 06. payment_confirmed · Thanh toán

- Kênh đề xuất: Email + trong tài khoản
- Khi gửi: authoritative payment allocation committed
- Điều kiện: One message per payment receipt/checkout, not one per order line. Exact initial/full/balance scope; no unverified future shipping total.
- Nguồn: `functions/src/purchase-settlement.ts; functions/src/payments/payos.ts; functions/src/index.ts`

**Tiêu đề:** Đã nhận {{paidAmount}} cho {{orderRef}}
**Dòng xem trước:** Khoản thanh toán đã được xác nhận.

SatsunicGO đã xác nhận khoản thanh toán {{paidAmount}} cho {{orderRef}}.

{{paymentScope}}

Cảm ơn bạn đã tin tưởng sử dụng dịch vụ. Bạn có thể xem khoản đã thanh toán và tiến độ trong tài khoản.

**Nút:** Xem thanh toán

Đội ngũ SatsunicGO

## 07. payment_review · Thanh toán

- Kênh đề xuất: Email khi cần khách xử lý
- Khi gửi: payment reconciliation needs customer evidence
- Điều kiện: Verified review state plus safe customer reason and real evidence-submission path. Unknown transport alone does not trigger email.
- Nguồn: `functions/src/purchase-sepay.ts; functions/src/finance-review.ts`

**Tiêu đề:** Cần kiểm tra khoản thanh toán cho {{orderRef}}
**Dòng xem trước:** Xem thông tin cần bổ sung trước khi thanh toán thêm.

Khoản thanh toán cho {{orderRef}} chưa thể được xác nhận: {{customerReason}}.

Bạn xem thông tin cần bổ sung trong đơn nhé. Nếu đã chuyển tiền, bạn chưa cần chuyển lại khi kết quả còn đang được kiểm tra.

**Nút:** Xem việc cần bổ sung

Đội ngũ SatsunicGO

## 08. payment_failed · Thanh toán

- Kênh đề xuất: Chỉ trong tài khoản
- Khi gửi: authoritative terminal payment failure
- Điều kiện: Terminal failure must come from provider readback; unknown/pending cannot use failed wording.
- Nguồn: `functions/src/purchase-sepay.ts`

**Tiêu đề:** Thanh toán cho {{orderRef}} chưa hoàn tất
**Dòng xem trước:** Kiểm tra trạng thái trước khi thử lại.

Lượt thanh toán cho {{orderRef}} chưa hoàn tất.

Bạn có thể kiểm tra trạng thái trong tài khoản. Nếu tài khoản ngân hàng đã bị trừ tiền, hãy liên hệ hỗ trợ trước khi thanh toán lại.

**Nút:** Kiểm tra thanh toán

Đội ngũ SatsunicGO

## 09. payment_expired · Thanh toán

- Kênh đề xuất: Chỉ trong tài khoản
- Khi gửi: authoritative payment session expiry
- Điều kiện: Checkout preview expiresAt alone does not prove provider session expired; reconcile late payments first.
- Nguồn: `functions/src/purchase-checkout.ts; functions/src/purchase-sepay.ts`

**Tiêu đề:** Lượt thanh toán cho {{orderRef}} đã hết hạn
**Dòng xem trước:** Xem lại trạng thái và giá hiện tại trước khi tiếp tục.

Lượt thanh toán cho {{orderRef}} đã hết hạn.

Bạn xem lại trạng thái thanh toán và giá hiện tại trong tài khoản trước khi tiếp tục nhé.

**Nút:** Xem thanh toán

Đội ngũ SatsunicGO

## 10. price_change_proposed · Thay đổi đơn

- Kênh đề xuất: Email + trong tài khoản
- Khi gửi: proposePurchasePrice committed
- Điều kiện: Current unapproved proposal; exact version, same-currency totals and preserved paid scope; approved is not paid.
- Nguồn: `functions/src/purchase-adjustment.ts`

**Tiêu đề:** Bạn xem giúp giá mua mới cho {{orderRef}}
**Dòng xem trước:** Giá thay đổi cần bạn đồng ý trước khi mua tiếp.

Giá mua cho {{orderRef}} đã thay đổi: {{customerReason}}.

Tổng tiền của phương án mới là {{proposedTotal}}, tăng {{differenceAmount}} so với phương án trước.

Phần mua theo giá mới cần bạn đồng ý. Bạn có thể xem chi tiết và trao đổi với bên mình trong đơn.

**Nút:** Xem giá mua mới

Đội ngũ SatsunicGO

## 11. change_proposed · Thay đổi đơn

- Kênh đề xuất: Email + trong tài khoản
- Khi gửi: change-propose committed
- Điều kiện: Current proposal pending customer decision; alternatives supported by actual change UI; no raw internal reason.
- Nguồn: `functions/src/changes.ts`

**Tiêu đề:** Có phương án thay đổi cho đơn {{orderRef}}
**Dòng xem trước:** Xem nội dung và chi phí trước khi quyết định.

Bên mình đề xuất thay đổi cho đơn {{orderRef}}: {{changeSummary}}.

{{costImpact}}

Bạn có thể xem phương án và chọn đồng ý hoặc từ chối trong đơn.

**Nút:** Xem phương án

Đội ngũ SatsunicGO

## 12. change_accepted · Thay đổi đơn

- Kênh đề xuất: Chỉ trong tài khoản
- Khi gửi: change-accept or approvePurchasePrice committed
- Điều kiện: Acceptance persisted for exact proposal version; do not imply applied or additional payment confirmed.
- Nguồn: `functions/src/changes.ts; functions/src/purchase-adjustment.ts`

**Tiêu đề:** Đã lưu lựa chọn của bạn cho {{orderRef}}
**Dòng xem trước:** Bạn đã đồng ý phương án thay đổi.

Bạn đã đồng ý phương án {{changeSummary}} cho đơn {{orderRef}}.

Lựa chọn đã được lưu. Bạn có thể xem bước tiếp theo trong đơn.

**Nút:** Xem đơn hàng

Đội ngũ SatsunicGO

## 13. change_rejected · Thay đổi đơn

- Kênh đề xuất: Chỉ trong tài khoản
- Khi gửi: change-reject committed
- Điều kiện: Exact rejection persisted; no promise of cancellation/refund.
- Nguồn: `functions/src/changes.ts`

**Tiêu đề:** Đã lưu lựa chọn của bạn cho {{orderRef}}
**Dòng xem trước:** Bạn đã từ chối phương án thay đổi.

Bạn đã từ chối phương án {{changeSummary}} cho đơn {{orderRef}}.

Bạn có thể trao đổi thêm với bên mình trong đơn.

**Nút:** Xem đơn hàng

Đội ngũ SatsunicGO

## 14. change_applied · Thay đổi đơn

- Kênh đề xuất: Chỉ trong tài khoản
- Khi gửi: change-apply committed
- Điều kiện: Same accepted proposal successfully applied; amount changes requiring new approval must not use this template.
- Nguồn: `functions/src/changes.ts`

**Tiêu đề:** Đơn {{orderRef}} đã được cập nhật
**Dòng xem trước:** Phương án bạn đồng ý đã được áp dụng.

Đơn {{orderRef}} đã được cập nhật theo phương án bạn đồng ý: {{changeSummary}}.

Bạn có thể xem lại sản phẩm và chi phí trong đơn.

**Nút:** Xem thay đổi

Đội ngũ SatsunicGO

## 15. order_hold · Thay đổi đơn

- Kênh đề xuất: Email khi cần khách xử lý
- Khi gửi: hold committed with customer-visible reason
- Điều kiện: Only reviewed safe reason and supported next step; internal notes must never be copied verbatim.
- Nguồn: `functions/src/index.ts`

**Tiêu đề:** Đơn {{orderRef}} đang tạm dừng xử lý
**Dòng xem trước:** Xem lý do và bước tiếp theo trong đơn.

Đơn {{orderRef}} đang tạm dừng xử lý: {{customerReason}}.

{{nextStep}}

**Nút:** Xem tình trạng đơn

Đội ngũ SatsunicGO

## 16. purchase_partial · Mua hàng & kho

- Kênh đề xuất: Chỉ trong tài khoản
- Khi gửi: recordPurchase committed with purchasedQuantity below total
- Điều kiện: Derived from recorded per-line quantities; no full-order success or invented next purchase date.
- Nguồn: `functions/src/index.ts`

**Tiêu đề:** Đã mua một phần hàng trong {{orderRef}}
**Dòng xem trước:** Xem các món đã mua và phần còn lại.

Bên mình đã mua {{purchasedSummary}} trong đơn {{orderRef}}.

Phần còn lại gồm {{remainingSummary}}. Bạn có thể theo dõi từng món trong đơn.

**Nút:** Xem tiến độ mua

Đội ngũ SatsunicGO

## 17. purchase_completed · Mua hàng & kho

- Kênh đề xuất: Email tiến độ theo lựa chọn
- Khi gửi: recordPurchase reaches PURCHASED
- Điều kiện: Recorded purchased quantities cover all ordered quantities; not warehouse receipt.
- Nguồn: `functions/src/index.ts`

**Tiêu đề:** Đã mua đủ hàng cho {{orderRef}}
**Dòng xem trước:** Các món trong đơn đã được mua đủ.

Bên mình đã mua đủ {{itemSummary}} cho đơn {{orderRef}}.

Bạn có thể xem tiến độ nhận hàng tại kho trong chi tiết đơn.

**Nút:** Xem tiến độ

Đội ngũ SatsunicGO

## 18. warehouse_received · Mua hàng & kho

- Kênh đề xuất: Chỉ trong tài khoản
- Khi gửi: receive committed
- Điều kiện: Exact receipt quantities only; do not claim all items or inspection passed unless recorded.
- Nguồn: `functions/src/index.ts`

**Tiêu đề:** Kho đã nhận hàng cho {{orderRef}}
**Dòng xem trước:** Xem số lượng hàng đã nhận.

Kho đã nhận {{receivedSummary}} cho đơn {{orderRef}}.

Thông tin hàng nhận đã được cập nhật trong đơn.

**Nút:** Xem hàng đã nhận

Đội ngũ SatsunicGO

## 19. warehouse_issue · Mua hàng & kho

- Kênh đề xuất: Email + trong tài khoản
- Khi gửi: receive detects missing/damaged goods and hold
- Điều kiện: Reviewed shortage/damage facts and real next step; no invented replacement or refund guarantee.
- Nguồn: `functions/src/index.ts`

**Tiêu đề:** Có vấn đề với hàng của đơn {{orderRef}}
**Dòng xem trước:** Xem phần hàng bị ảnh hưởng và hướng xử lý.

Khi nhận hàng của đơn {{orderRef}}, bên mình ghi nhận: {{customerReason}}.

{{nextStep}}

Xin lỗi bạn vì sự bất tiện này.

**Nút:** Xem tình trạng hàng

Đội ngũ SatsunicGO

## 20. final_balance_due · Chi phí cuối

- Kênh đề xuất: Email + trong tài khoản
- Khi gửi: approved final cost with positive authoritative outstanding
- Điều kiện: Final approved version; positive balance excludes reserved refunds per domain; no deadline unless policy exists.
- Nguồn: `functions/src/index.ts; packages/domain/index.ts`

**Tiêu đề:** Chi phí cuối của {{orderRef}} đã có
**Dòng xem trước:** Xem chi tiết khoản còn cần thanh toán.

Chi phí cuối của đơn {{orderRef}} là {{finalTotal}}.

Khoản đã thanh toán sau các điều chỉnh là {{netPaid}}; khoản còn cần thanh toán là {{balanceDue}}.

Bạn xem bảng chi phí trong đơn trước khi thanh toán phần còn lại nhé.

**Nút:** Xem chi phí và thanh toán

Đội ngũ SatsunicGO

## 21. final_no_balance · Chi phí cuối

- Kênh đề xuất: Chỉ trong tài khoản
- Khi gửi: approved final cost with zero outstanding and no excess
- Điều kiện: Current approved total fully funded, no excess, no unresolved reversal or refund reservation; zero is explicit.
- Nguồn: `functions/src/index.ts; packages/domain/index.ts`

**Tiêu đề:** Chi phí đơn {{orderRef}} đã được chốt
**Dòng xem trước:** Bạn không cần thanh toán thêm theo chi phí đã chốt.

Chi phí cuối của đơn {{orderRef}} là {{finalTotal}}. Khoản đã ghi nhận đủ cho chi phí này.

Bạn không cần thanh toán thêm theo bảng chi phí đã chốt.

**Nút:** Xem bảng chi phí

Đội ngũ SatsunicGO

## 22. excess_payment_review · Chi phí cuối

- Kênh đề xuất: Email + trong tài khoản
- Khi gửi: verified excess amount needs resolution
- Điều kiện: Verified excess after net collections, adjustments and pending refund reservations; no auto-refund promise.
- Nguồn: `functions/src/finance-review.ts; packages/domain/index.ts`

**Tiêu đề:** Có khoản chênh lệch cần xử lý cho {{orderRef}}
**Dòng xem trước:** Khoản chênh lệch chưa phải là tiền đã hoàn.

Sau khi đối chiếu đơn {{orderRef}}, bên mình ghi nhận khoản thanh toán vượt chi phí đã chốt là {{excessAmount}}.

Bạn có thể xem khoản chênh lệch và trao đổi cách xử lý trong đơn. Đây chưa phải xác nhận hoàn tiền.

**Nút:** Xem khoản chênh lệch

Đội ngũ SatsunicGO

## 23. shipment_dispatched · Vận chuyển

- Kênh đề xuất: Email + trong tài khoản
- Khi gửi: dispatchParcel, batch-dispatch or dispatch confirmed
- Điều kiện: Actual handoff persisted; deduplicate batch/order/parcel paths; customer-only allocations; ETA omitted unless current and verified.
- Nguồn: `functions/src/shipping.ts; functions/src/consolidation.ts; functions/src/index.ts`

**Tiêu đề:** Kiện {{parcelRef}} đã được bàn giao vận chuyển
**Dòng xem trước:** Theo dõi kiện hàng của đơn {{orderRef}}.

Kiện {{parcelRef}} của đơn {{orderRef}} đã được bàn giao cho {{carrierName}}.

Mã vận đơn: {{trackingCode}}. Kiện gồm {{parcelItems}}.

Bạn có thể theo dõi hành trình trong tài khoản.

**Nút:** Theo dõi kiện hàng

Đội ngũ SatsunicGO

## 24. shipment_progress · Vận chuyển

- Kênh đề xuất: Chỉ trong tài khoản
- Khi gửi: trackParcel or track meaningful progress
- Điều kiện: Only public tracking fact; no email for repeated scans, metadata edits or same-state retries.
- Nguồn: `functions/src/shipping.ts; functions/src/index.ts`

**Tiêu đề:** Kiện {{parcelRef}} có cập nhật vận chuyển
**Dòng xem trước:** Xem vị trí hoặc chặng vận chuyển mới.

Kiện {{parcelRef}} của đơn {{orderRef}} có cập nhật: {{trackingSummary}}.

Thông tin được ghi nhận lúc {{observedAt}}.

**Nút:** Xem hành trình

Đội ngũ SatsunicGO

## 25. delivery_estimate_changed · Vận chuyển

- Kênh đề xuất: Email khi thay đổi đáng kể
- Khi gửi: material customer-visible delivery estimate revision
- Điều kiện: New wiring required: setDeliveryEstimate currently emits no notification. Both windows valid, current in-transit/failed policy, materiality rule approved.
- Nguồn: `functions/src/shipping.ts`

**Tiêu đề:** Dự kiến giao kiện {{parcelRef}} đã thay đổi
**Dòng xem trước:** Đây là thời gian dự kiến, chưa phải cam kết giao hàng.

Thời gian giao dự kiến cho kiện {{parcelRef}} của đơn {{orderRef}} được cập nhật từ {{previousWindow}} sang {{deliveryWindow}}.

Lý do cập nhật: {{customerReason}}. Đây là thời gian dự kiến, chưa phải cam kết giao hàng.

**Nút:** Xem lịch giao dự kiến

Đội ngũ SatsunicGO

## 26. delivery_failed · Vận chuyển

- Kênh đề xuất: Email + trong tài khoản
- Khi gửi: trackParcel state failed
- Điều kiện: Recorded failed attempt, customer-safe reason and supported next step; no automatic re-delivery date.
- Nguồn: `functions/src/shipping.ts`

**Tiêu đề:** Kiện {{parcelRef}} chưa giao được
**Dòng xem trước:** Xem lý do và thông tin cần kiểm tra.

Kiện {{parcelRef}} của đơn {{orderRef}} chưa giao được: {{customerReason}}.

{{nextStep}}

**Nút:** Xem hướng xử lý

Đội ngũ SatsunicGO

## 27. shipment_returned · Vận chuyển

- Kênh đề xuất: Email + trong tài khoản
- Khi gửi: trackParcel state returned
- Điều kiện: Persisted returned state; do not imply warehouse has received returned parcel or refund paid.
- Nguồn: `functions/src/shipping.ts`

**Tiêu đề:** Kiện {{parcelRef}} đã được ghi nhận hoàn về
**Dòng xem trước:** Xem tình trạng và cách xử lý tiếp theo.

Kiện {{parcelRef}} của đơn {{orderRef}} đã được ghi nhận hoàn về.

{{nextStep}}

**Nút:** Xem tình trạng kiện

Đội ngũ SatsunicGO

## 28. parcel_delivered_partial · Vận chuyển

- Kênh đề xuất: Email + trong tài khoản
- Khi gửi: parcel delivered but order not fullyDelivered
- Điều kiện: Exact parcel allocation; order not fully delivered; suppress full-order delivery message.
- Nguồn: `functions/src/shipping.ts`

**Tiêu đề:** Đã giao kiện {{parcelRef}} của đơn {{orderRef}}
**Dòng xem trước:** Đơn vẫn còn hàng đang được xử lý hoặc vận chuyển.

Kiện {{parcelRef}}, gồm {{parcelItems}}, đã được ghi nhận giao thành công.

Đơn {{orderRef}} vẫn còn {{remainingSummary}}. Bạn có thể theo dõi phần còn lại trong tài khoản.

**Nút:** Xem các kiện còn lại

Đội ngũ SatsunicGO

## 29. order_delivered · Vận chuyển

- Kênh đề xuất: Email + trong tài khoản
- Khi gửi: fullyDelivered or authoritative whole-order delivery
- Điều kiện: All quantities delivered across all parcels; delivery is not customer satisfaction. Catalog variant removes mua hộ claim.
- Nguồn: `functions/src/shipping.ts; functions/src/index.ts`

**Tiêu đề:** Đơn {{orderRef}} đã được giao đủ
**Dòng xem trước:** Cảm ơn bạn đã tin tưởng SatsunicGO.

Đơn {{orderRef}} đã được ghi nhận giao đủ hàng.

Cảm ơn bạn đã tin tưởng nhờ SatsunicGO mua hộ. Nếu hàng nhận có vấn đề, bạn có thể mở đơn để trao đổi với bên mình.

**Nút:** Xem đơn hàng

Đội ngũ SatsunicGO

## 30. order_cancelled · Hủy & hoàn tiền

- Kênh đề xuất: Email + trong tài khoản
- Khi gửi: cancelRequest reaches CANCELLED
- Điều kiện: Persisted cancellation only; do not expose a cancellation action unsupported for funded upfront orders.
- Nguồn: `functions/src/index.ts`

**Tiêu đề:** Đơn {{orderRef}} đã được hủy
**Dòng xem trước:** Trạng thái hủy không thay thế xác nhận hoàn tiền.

Đơn {{orderRef}} đã được hủy.

Nếu có khoản đã thanh toán, bạn có thể xem trạng thái xử lý khoản tiền trong đơn. Email này chưa phải xác nhận hoàn tiền.

**Nút:** Xem đơn đã hủy

Đội ngũ SatsunicGO

## 31. refund_requested · Hủy & hoàn tiền

- Kênh đề xuất: Email + trong tài khoản
- Khi gửi: refund-request committed by authorized staff
- Điều kiện: Actual pending refund reservation; staff-created request is not falsely attributed to customer submission.
- Nguồn: `functions/src/refunds.ts`

**Tiêu đề:** Đã ghi nhận yêu cầu hoàn tiền cho {{orderRef}}
**Dòng xem trước:** Yêu cầu đang chờ xử lý, tiền chưa được xác nhận hoàn.

Bên mình đã ghi nhận yêu cầu hoàn {{refundAmount}} cho đơn {{orderRef}}.

Yêu cầu đang chờ xử lý. Đây chưa phải xác nhận tiền đã được hoàn.

**Nút:** Xem yêu cầu hoàn tiền

Đội ngũ SatsunicGO

## 32. refund_request_cancelled · Hủy & hoàn tiền

- Kênh đề xuất: Email + trong tài khoản
- Khi gửi: refund-cancel committed
- Điều kiện: Cancellation persisted; reason must be reviewed for customer visibility, not raw finance notes.
- Nguồn: `functions/src/refunds.ts`

**Tiêu đề:** Yêu cầu hoàn tiền cho {{orderRef}} đã được hủy
**Dòng xem trước:** Xem chi tiết xử lý trong đơn.

Yêu cầu hoàn {{refundAmount}} cho đơn {{orderRef}} đã được hủy.

{{customerReason}}. Bạn có thể trao đổi với bên mình trong đơn nếu cần làm rõ.

**Nút:** Xem yêu cầu hoàn tiền

Đội ngũ SatsunicGO

## 33. refund_recorded · Hủy & hoàn tiền

- Kênh đề xuất: Email + trong tài khoản
- Khi gửi: refund finance entry committed with evidence
- Điều kiện: Finance refund entry plus evidence; wording does not assert recipient bank credited. Provider settlement would require a distinct verified event.
- Nguồn: `functions/src/index.ts`

**Tiêu đề:** Đã ghi nhận hoàn {{refundAmount}} cho {{orderRef}}
**Dòng xem trước:** Xem xác nhận khoản hoàn trong đơn.

SatsunicGO đã ghi nhận khoản hoàn {{refundAmount}} cho đơn {{orderRef}} vào {{refundRecordedAt}}.

Bạn có thể xem xác nhận khoản hoàn trong đơn. Nếu chưa thấy tiền về, hãy trao đổi với bên mình để kiểm tra.

**Nút:** Xem khoản hoàn

Đội ngũ SatsunicGO

## 34. financial_adjustment · Thanh toán

- Kênh đề xuất: Email khi cần khách xử lý
- Khi gửi: reverse committed and customer-visible balance changes
- Điều kiện: Verified immutable correction and current balance; no claim of new payment or refund; reason redacted.
- Nguồn: `functions/src/finance-review.ts`

**Tiêu đề:** Khoản thanh toán của {{orderRef}} có điều chỉnh
**Dòng xem trước:** Xem phần thay đổi và số tiền hiện tại.

Một khoản đã ghi nhận cho đơn {{orderRef}} được điều chỉnh: {{customerReason}}.

{{costImpact}}. Bạn có thể xem chi tiết và trao đổi với bên mình trong đơn.

**Nút:** Xem điều chỉnh thanh toán

Đội ngũ SatsunicGO

## 35. payment_allocated · Thanh toán

- Kênh đề xuất: Email + trong tài khoản
- Khi gửi: allocateException committed
- Điều kiện: Allocate actual exception, not new charge; deduplicate against payment_confirmed for same allocation.
- Nguồn: `functions/src/finance-review.ts`

**Tiêu đề:** Đã đối chiếu khoản tiền cho {{orderRef}}
**Dòng xem trước:** Khoản tiền đã được ghi nhận vào đúng đơn.

Khoản thanh toán {{paidAmount}} đã được đối chiếu và ghi nhận vào đơn {{orderRef}}.

Cảm ơn bạn đã chờ bên mình kiểm tra. Bạn có thể xem số tiền hiện tại trong đơn.

**Nút:** Xem thanh toán

Đội ngũ SatsunicGO

## 36. order_reply · Hỗ trợ

- Kênh đề xuất: Email khi khách chưa đọc
- Khi gửi: staff customer-visible message committed
- Điều kiện: Staff message only, never internal note/assignment; unread rule needs message-read evidence, not inbox read boolean.
- Nguồn: `functions/src/order-conversation.ts`

**Tiêu đề:** Bên mình đã trả lời về đơn {{orderRef}}
**Dòng xem trước:** Mở cuộc trao đổi để xem và trả lời.

Bên mình vừa gửi phản hồi về đơn {{orderRef}}.

Bạn mở cuộc trao đổi trong đơn để xem và trả lời khi tiện nhé.

**Nút:** Xem phản hồi

Đội ngũ SatsunicGO

## 37. support_reply · Hỗ trợ

- Kênh đề xuất: Email khi khách chưa đọc
- Khi gửi: staff replyTicket committed
- Điều kiện: Owner recipient; unread grace policy proposed, requires real conversation-read tracking.
- Nguồn: `functions/src/workspace.ts`

**Tiêu đề:** Bạn có phản hồi mới từ SatsunicGO
**Dòng xem trước:** Xem phản hồi cho yêu cầu hỗ trợ {{ticketRef}}.

Bên mình đã trả lời yêu cầu hỗ trợ {{ticketRef}} của bạn.

Bạn có thể mở mục Hỗ trợ để xem phản hồi và trao đổi tiếp.

**Nút:** Xem phản hồi

Đội ngũ SatsunicGO

## 38. membership_activated · Membership

- Kênh đề xuất: Email + trong tài khoản
- Khi gửi: membershipActivated committed
- Điều kiện: Persisted subscription and exact endsAt; do not invent discount or auto-renewal.
- Nguồn: `functions/src/membership.ts`

**Tiêu đề:** {{planName}} của bạn đã được kích hoạt
**Dòng xem trước:** Xem quyền lợi và thời hạn sử dụng.

{{planName}} của bạn đã được kích hoạt, có hiệu lực đến {{endsAt}}.

Cảm ơn bạn đã sử dụng gói của SatsunicGO. Bạn có thể xem quyền lợi trong thông tin gói.

**Nút:** Xem gói của bạn

Đội ngũ SatsunicGO

## 39. membership_expiring · Membership

- Kênh đề xuất: Email + trong tài khoản
- Khi gửi: membershipExpiring with approved reminder policy
- Điều kiện: Active exact subscription term and approved daysBeforeExpiry, recheck before dispatch; one per term.
- Nguồn: `functions/src/jobs.ts`

**Tiêu đề:** {{planName}} sẽ hết hạn vào {{endsAt}}
**Dòng xem trước:** Bạn có thể xem gói và chọn gia hạn khi cần.

{{planName}} của bạn sẽ hết hạn vào {{endsAt}}.

Bạn có thể xem lại quyền lợi và chọn gia hạn nếu còn nhu cầu. SatsunicGO không tự trừ tiền để gia hạn.

**Nút:** Xem thông tin gia hạn

Đội ngũ SatsunicGO

## 40. membership_expired · Membership

- Kênh đề xuất: Email + trong tài khoản
- Khi gửi: membershipExpired committed
- Điều kiện: Expired term still relevant; suppress if renewed before send.
- Nguồn: `functions/src/jobs.ts`

**Tiêu đề:** {{planName}} của bạn đã hết hạn
**Dòng xem trước:** Xem quyền lợi hiện tại và lựa chọn gia hạn.

{{planName}} của bạn đã hết hạn vào {{endsAt}}.

Cảm ơn bạn đã sử dụng gói trong thời gian qua. Bạn có thể xem quyền lợi hiện tại và gia hạn khi cần.

**Nút:** Xem gói của bạn

Đội ngũ SatsunicGO

## 41. receipt_ready · Chứng từ

- Kênh đề xuất: Email + trong tài khoản
- Khi gửi: purchase receipt ready with ownership and snapshot hash verified
- Điều kiện: Document state ready, exact owner and immutable receipt; prefer merge with payment_confirmed when ready, no claim attachment unless attached.
- Nguồn: `functions/src/purchase-receipts.ts`

**Tiêu đề:** Chứng từ thanh toán {{receiptRef}} đã sẵn sàng
**Dòng xem trước:** Xem lại khoản thanh toán và tải chứng từ trong tài khoản.

Chứng từ {{receiptRef}} ghi nhận khoản thanh toán {{paidAmount}} đã sẵn sàng.

Bạn có thể xem và tải chứng từ từ tài khoản. Chứng từ này không thay thế hóa đơn thuế.

**Nút:** Xem chứng từ

Đội ngũ SatsunicGO

## 42. internal_document_issued · Chứng từ

- Kênh đề xuất: Email theo yêu cầu gửi chứng từ
- Khi gửi: invoiceIssued queued after issue
- Điều kiện: Issued exact number and owner; payment receipt and internal statement are distinct documents.
- Nguồn: `functions/src/invoices.ts`

**Tiêu đề:** Chứng từ đơn hàng {{documentNumber}} đã được xuất
**Dòng xem trước:** Số tiền phản ánh thời điểm xuất chứng từ.

Chứng từ nội bộ {{documentNumber}} đã được xuất.

Số tiền trên chứng từ phản ánh thời điểm xuất. Bạn có thể xem hoặc lưu PDF trong tài khoản. Đây không phải hóa đơn điện tử thuế.

**Nút:** Xem chứng từ đơn hàng

Đội ngũ SatsunicGO

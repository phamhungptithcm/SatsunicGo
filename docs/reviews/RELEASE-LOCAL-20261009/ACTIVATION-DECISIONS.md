# Các điều kiện để bật tính năng trên production

Bản ghi từ BA/Product audit, đối chiếu source DEGRADED. Root giữ phân biệt code phát hành và tính năng live. Commit/push không tự xác nhận customer checkout, email hay AI hoạt động. Không có policy/ngân sách/retention được tự suy từ câu Approved chung.

- Purchase checkout/balance có guard chỉ cho demo. PayOS/SMTP của luồng cũ đã có nhưng bị giữ; settings không mở được capability trong code và không bổ sung nhánh PayOS cho purchase. Cần tích hợp thực, merchant/sender, webhook/idempotency/đối soát cùng cấu hình phí, tỷ giá, điều khoản, địa giới và cước được duyệt.
- purchaseReceipt tạo PDF và purchaseEmailOutbox; ngoài demo là pending_configuration. Chưa thấy consumer gửi email cho outbox này; SMTP của outboxJobs không tự xử lý nó.
- Nguồn Ask cần publication thật qua posts/blogPublished, source/sourceId/contentHash/expectedVersion, locale vi/en và hiệu lực. Admission qua OWNER active/unlocked, verified Google, recent MFA, preview/approve/readback. Trang static hay một câu Approved không cung cấp đủ bản nguồn đã admit.
- AI production fallback hiện là pilot OWNER đã hết cửa sổ định giá. Web research có deadline2026-10-09T00:00:00Z, trần50000VND, reservation25000VND/lượt và dự phòng cũ nhập tối thiểu50000VND; không còn chỗ cho lượt mới. Cần đối soát billed cost, phạm vi/ngân sách khách hàng và code/model/region/giá/thời hạn còn hiệu lực. Không tự gia hạn/replenish; thực chi Unavailable.
- Feedback cần enabled/version/retentionDays1–90/expiresAt và consent đúng version. Đề xuất30ngày chưa chốt; không có callable ghi policy hiện tại. Nhận feedback và xóa vật lý là hai quyết định khác nhau. Cleanup hold không được bỏ; financial records/chat/backup không được hứa cùng hạn30ngày.
- Privacy/đổi trả/hủy/hoàn tiền còn đánh dấu chờ nội dung chính thức. Cần điều kiện/ngoại lệ/phí/thời hạn và thông tin vận hành trước khi công bố cam kết. Không suy giá/giao hàng/eligibility/kết quả thanh toán từ hướng dẫn hoặc dữ liệu demo.

Main pipeline chỉ promote Functions+Hosting, không promote rules/indexes/Storage rules. Readback cấu hình/index/inventory trước;48composite hiện READY theo root metadata receipt, không cần blanket index deploy.13TTLtrong source không được kích hoạt/xóa tự động như tác dụng phụ. Các API deploy/Vertex đã bật; provider activation vẫn cần điều kiện riêng. Phiên BA không có provider read, root receipt mới có phạm vi metadata rõ ràng.

Learning/evaluation chỉ đề xuất retrieval thay đổi, automaticPromotion=false; owner vẫn phải review/publication/admit revision mới. Không tự huấn luyện hay phát hành policy.

Source anchors: functions/src/purchase-checkout.ts commit/balance/setup; purchase-receipts.ts production pending_configuration; payments/payos.ts và email.ts existing held integrations; ai/ask.ts OWNER pilot; packages/domain/ask-knowledge.ts admission; packages/domain/ask-feedback.ts policy; provider-release-gate.ts immutable controls. Đây là điều kiện còn thiếu, không phải bằng chứng live. Production acceptance NOT_READY. Không có paid call, production data write hoặc retention activation trong audit. Memory candidates None.

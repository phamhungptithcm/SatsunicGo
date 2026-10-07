# INTEGRATION — 46 scenarios

Mọi case hiện NOT_RUN. Expected là test oracle để kiểm chứng, không là kết luận implementation đã đúng. Áp dụng [README](README.md) về fixture/reset/invariants và evidence. Mỗi variant cần result con riêng.

## INT — Luồng integration xuyên hệ thống

### SG-INT-001 — Catalog đầy đủ vòng đời

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. Publish product
2. customer checkout qty2
3. finance verify fixture
4. buyer mua
5. warehouse receive/pack
6. dispatch
7. delivered
8. confirmReceipt
9. issue document

**Mong đợi:** Một order xuyên website/Ask/account/CRM/docs; giá all-inclusive; không quote lại hoặc thu balance lần hai; ledger và quantity conservation.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-002 — Custom đầy đủ vòng đời

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. Submit request 2 dòng
2. issue quote 100001
3. save recipient
4. accept
5. verify 50001
6. mua đủ
7. receive/pack
8. finalize 120001
9. approve
10. verify 70000
11. dispatch/deliver/confirm

**Mong đợi:** Custom giữ hai kỳ thu; net collected=120001; giao đủ mới COMPLETED; consent/version/history đúng.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-003 — Catalog partial payment

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. Checkout 200002
2. verify 200001
3. thử claim
4. verify thêm 1
5. claim/pack

**Mong đợi:** Thiếu 1 đồng chặn procurement; đủ tiền verified mới mua; không coi stage QUOTE_ACCEPTED là đã trả.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-004 — Custom partial deposit

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. Quote total100001
2. accept
3. verify50000
4. claim denied
5. verify1
6. claim

**Mong đợi:** Deposit ceil=50001; một ledger mỗi bank; không mua từ số cọc thiếu.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-005 — Quote race customer/staff

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. A đọc v1
2. staff issue v2
3. A accept v1
4. refresh accept v2
5. finance verify

**Mong đợi:** Không payment intent/acceptance gắn quote cũ; UI/DB cùng version.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-006 — Catalog price race checkout

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. A/B cùng mở v1
2. editor publish v2
3. A submit v1
4. B submit current

**Mong đợi:** A conflict không tạo đơn giá cũ; B snapshot v2; account/CRM/docs khớp.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-007 — Lost ack xuyên API/UI

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. Submit/checkout commit nhưng cắt response
2. reload Ask/account
3. retry same operationId

**Mong đợi:** Một order, một conversation binding; không hàng trùng trong CRM.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-008 — Hai finance phân bổ một bank

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. Hai finance verify cùng bank vào hai orders đồng thời
2. mở dashboard/invoices

**Mong đợi:** Chỉ một allocation; no double collected; loser có lỗi phục hồi rõ.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-009 — Reconcile và webhook race

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. Fake adapter verified event được apply qua webhook handler harness và reconcile cùng lúc

**Mong đợi:** Receipt/ledger/order version tăng đúng một effect; provider live path vẫn gate đóng.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-010 — Refund reservation trước dispatch

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. Order ready
2. finance request refund
3. warehouse dispatch cùng thời điểm

**Mong đợi:** Transaction quyết định an toàn; không dispatch bằng tiền đã reserve; cả UI/DB state đúng.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-011 — Refund confirm vs cancel

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. Pending refund
2. finance confirm và cancel concurrent
3. đọc bank,refund,reserved

**Mong đợi:** Một terminal outcome; refunded/reserved không âm hoặc double release.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-012 — Refund sau ready giảm tiền

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. Đủ tiền và ready
2. confirm refund
3. reload account/finance
4. dispatch denied

**Mong đợi:** Trạng thái displayed đúng net funds, không chỉ stage cached.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-013 — Partial procurement nhiều line

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. Mua line0=2,line1=1
2. receive đúng
3. thử pack đủ5
4. mua và receive line1 còn2

**Mong đợi:** Chặn pack sớm; cuối cùng mỗi line quantity đúng, không dùng aggregate để che lỗi.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-014 — Wrong-line nhận hàng

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. Mua line0=2,line1=1
2. receive total3 nhưng phân bổ line0=1,line1=2

**Mong đợi:** Reject atomic; account timeline, CRM quantity và evidence không thay thành công giả.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-015 — Substitution dòng đã mua

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. Order có bought line0
2. propose đổi cả line0 và line1
3. kiểm tra rollback

**Mong đợi:** Proposal/financial/history không mutate; báo rõ cần xử lý hàng đã mua riêng.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-016 — Substitution hợp lệ có consent

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. Propose line1 chưa mua
2. A accept
3. staff apply
4. mua line1 mới
5. issue document

**Mong đợi:** Đúng variant đã đồng ý; purchased line0 nguyên vẹn; document snapshot đúng.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-017 — Partial cancellation + refund

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. Hủy lượng chưa mua qua propose/accept/apply
2. reserve rồi confirm phần refundable

**Mong đợi:** Không xóa chi phí thực đã mua; refundable/net balances đúng; document/history phản ánh.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-018 — Reject change và release hold

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. Staff propose change
2. A reject
3. staff thử apply
4. tiếp tục workflow gốc nếu source cho phép

**Mong đợi:** Không âm thầm đổi hàng; hold lifecycle đúng; không dùng reject như cancel toàn đơn.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-019 — Final approval với freight v2

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. Seal batch freight v1
2. customer approve
3. reseal/update theo contract v2
4. dispatch

**Mong đợi:** Approval cũ không đủ; customer phải đọc nghĩa vụ mới; no hidden collection.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-020 — Catalog gom với custom

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. Pack catalog/custom trong batch
2. allocate freight
3. approve custom
4. dispatch

**Mong đợi:** Catalog customer payable giữ all-inclusive; custom freight version được duyệt; internal costs không thành catalog charge.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-021 — Batch mixed owners

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. Gom A/B
2. seal/dispatch
3. A đọc tracking/Ask và documents
4. B đọc lại

**Mong đợi:** Private projection chỉ phần mình; không leak batch manifest, address, notes B.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-022 — Batch atomic failure

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. Một member held, một thiếu balance, một ready
2. dispatch batch

**Mong đợi:** Không member nào dispatch một phần do failure; quantities/versions giữ nguyên.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-023 — Split shipment giao một phần

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. Order5 items split parcels3+2
2. deliver parcel3
3. customer confirm
4. deliver2
5. confirm lại

**Mong đợi:** Không COMPLETED trước đủ hàng; account/Ask/CRM nhất quán parcel và remaining quantities.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-024 — Returned parcel→return→finance

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. Dispatch
2. tracking returned
3. receive return
4. inspect damaged
5. close
6. review refund nếu hợp lệ

**Mong đợi:** Không tự refund do hàng trả; chain parcel/return/refund/ledger đúng source.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-025 — Profile→recipient→delivery

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. Save address
2. save recipient
3. accept quote
4. sửa address gốc
5. dispatch/issue document

**Mong đợi:** Shipment/document dùng snapshot được chấp thuận; không tự giao địa chỉ mới chưa đồng ý.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-026 — Membership purchase→quote discount

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. Purchase plan
2. confirm invoice
3. issue custom quote trong hạn
4. accept
5. expire subscription

**Mong đợi:** Discount snapshot được đóng băng; quote mới sau expiry không hưởng sai.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-027 — Renewal bank id retry

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. Request renewal same plan
2. confirm lost ack
3. retry
4. maintenance reminder scan

**Mong đợi:** Một lần gia hạn, không mất ngày còn lại; reminders dựa endsAt mới.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-028 — Active plan đổi gói

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. A active plan1
2. purchase/confirm plan2
3. đọc subscription/history/CRM

**Mong đợi:** Không commercial migration ngầm; rejection không tạo active benefits mới.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-029 — Order→invoice→profile edit

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. Issue document cho order
2. đổi product/seller/profile
3. mở detail/print/share

**Mong đợi:** Issued snapshot bất biến; live account info không rewrite document.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-030 — Share revoke giữa read

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. Create share fixture token
2. begin read
3. revoke
4. request lại
5. inspect cache policy

**Mong đợi:** Các read sau revoke bị deny theo source; không giữ share authority vô hạn.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-031 — Issue→email unknown→resolution

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. Ở fake mail harness queue job
2. provider fake nhận rồi mất ack
3. resolve sent
4. rerun worker

**Mong đợi:** Không double send; UI không nói delivered khi unknown; production SMTP vẫn khóa.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-032 — Support cross channel

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. A mở ticket từ Ask order
2. staff reply
3. account/Ask hiển thị cùng thread

**Mong đợi:** Một thread context; nội bộ notes không gửi cho khách; message IDs không trùng.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-033 — Staff revoke giữa read/write

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. Buyer load assigned work
2. owner revoke
3. buyer submit/replay cached operation

**Mong đợi:** Current role deny; không trả prior private result hoặc mutate qua token cũ.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-034 — Order reassignment

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. Buyer1 assigned order
2. reassign Buyer2
3. Buyer1 stale recordPurchase
4. Buyer2 current

**Mong đợi:** Chỉ assignment hiện hành đủ quyền; không mua trùng hoặc lộ operations ngoài scope.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-035 — Sign out tất cả channels

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. A mở Ask/order/document/support listeners
2. logout rồi B login
3. delay A callbacks

**Mong đợi:** Không private content A ở bất kỳ channel B; listeners/cache cleanup.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-036 — Firestore Rules vs Admin SDK

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. A direct đọc B order/media và gọi handler tương ứng
2. staff đúng scope dùng callable

**Mong đợi:** Rules deny trực tiếp; Admin SDK handler vẫn enforce identity/authority, không dựa Rules để bảo vệ Admin.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-037 — Studio publish→public→Ask

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. Editor publish post có taxonomy/media
2. public renderer/canonical/search đọc
3. retrieval Ask đọc

**Mong đợi:** Đúng published version; draft/archived không vào retrieval; paid AI không tự mở.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-038 — Studio revoke→scheduled publish

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. Writer schedules theo quyền
2. revoke member
3. approved demo clock đến hạn

**Mong đợi:** Authority/schedule contract được recheck; không publish nội dung bị thu quyền trái source.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-039 — Post unpublish→comment/media

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. Post published có ảnh/comment
2. unpublish
3. public page, image,comments,retrieval refresh

**Mong đợi:** Không bypass publication qua children hoặc stale URLs; cache thu hồi theo hợp đồng.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-040 — Banner schedule→public→checkout

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. Publish banner link catalog
2. clock window boundaries
3. click checkout version current

**Mong đợi:** Visibility và target hợp lệ; banner không cố định giá checkout từ nội dung cũ.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-041 — Rate config→Ask quote→order

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. Publish rate
2. Ask tính estimate
3. create custom quote với actual freight
4. customer accept

**Mong đợi:** Estimate freight-only khác quote payable; không tự thêm tax/FX hoặc cam kết total.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-042 — CRM partial read→export

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. Fail summary source
2. staff list/customer detail/export
3. retry

**Mong đợi:** Không biến unknown thành zero hoặc export summary giả full coverage; scope hiển thị rõ.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-043 — Transaction failure rollback

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. Inject transaction abort sau đọc, trước commit trong mutation tài chính/quantity
2. retry

**Mong đợi:** Không partial ledger/order/audit success; retry đúng một effect.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-044 — Network recovery phiên offline

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. Giữ draft, mất mạng sau commit, reload khi online
2. reconcile orders/conversation/doc

**Mong đợi:** Không tuyên bố mutation thành công từ offline cache; tìm authoritative result trước retry.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-045 — Restore toàn lineage

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.

**Các bước**

1. Ở emulator snapshot order/ledger/packages/docs/notes
2. restore fixture
3. chạy reads và domain consistency

**Mong đợi:** IDs/versions/net funds/quantities/ownership không lệch; restore production vẫn NOT_RUN.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-INT-046 — Provider readiness kiểm chứng riêng

- Priority: **P0** · Status: **NOT_RUN** · Environment: `APPROVED_PROVIDER_SANDBOX`
- Vai trò: customer, OWNER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR
- Điều kiện/fixture: Mỗi ca tạo namespace riêng; A/B + 7 staff; O-CAT và O-CUSTOM; hai dòng [2,3]; fake provider cho core; provider thật cần approval riêng.
- Điều kiện chưa đủ: `CURRENT_CODE_OWNED_PROVIDER_HOLD; AUTHORIZATION_AND_CANDIDATE_REQUIRED`

**Các bước**

1. Khi approved candidate mở gate thật, chạy Google/MFA/AppCheck,PayOS sandbox/SMTP/Gemini từng integration
2. capture sanitized readback

**Mong đợi:** Mỗi provider có evidence riêng; hiện BLOCKED, không dùng fake/unit/emulator để đánh dấu live PASS.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/shipping.ts](../../../functions/src/shipping.ts), [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [functions/src/invoices.ts](../../../functions/src/invoices.ts), [functions/src/membership.ts](../../../functions/src/membership.ts), [functions/src/crm.ts](../../../functions/src/crm.ts), [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

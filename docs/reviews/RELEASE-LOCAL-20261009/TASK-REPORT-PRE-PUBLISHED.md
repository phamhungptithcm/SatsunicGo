# Phát hành mã local lên main

Commit hiện tại: `0d6e721698608eebb36b0b2f68021c3054d97d1c`. Đã push lên main và đọc lại từ GitHub: MATCH. Bảy commit local đã tích hợp các thay đổi upstream bằng merge thông thường. Không force push.

[Pipeline production](https://github.com/phamhungptithcm/SatsunicGo/actions/runs/37890490893) đang chạy. Artifact và provider chưa được xác nhận trong lượt này. Review độc lập hiện tại: **BLOCKED** ở các điều kiện nghiệm thu toàn sản phẩm; an toàn của phần source được phát hành: **PASSED**. Khả năng phục vụ khách hàng trên production: **NOT_READY**.

## Tiêu chí và bằng chứng

| Tiêu chí | Trọng số | Kết quả |
|---|---:|---|
| Chọn đúng source, giữ WIP khác | 25 | PASSED: 3.138 file khớp Git blob và bản validation; không có drift |
| Kiểm tra local trên đúng commit | 25 | PASSED: 1.493 unit, 84 release/config contracts, typecheck, lint, production build |
| Giao source lên main | 20 | PASSED: push và authenticated readback khớp |
| Artifact, deploy và provider readback | 20 | NOT_RUN: pipeline hiện tại đang chạy |
| Bật đầy đủ các chức năng cho khách hàng | 10 | BLOCKED: điều kiện chính sách, thanh toán, email, AI và nghiệm thu còn thiếu |

Tổng trọng số đã có bằng chứng: 70/100. Đây là ledger thủ công cho tiêu chí giao mã, không phải phần trăm production readiness. CLI runtime quản trị không có sẵn; kết quả nghiệm thu vẫn fail-closed.

## Kiểm tra hiện tại

- Source fence: 3.138 file; SHA-256 và Git blob khớp trước/sau review. SHA fence `28430c6e4dce76c3e50c33be2b866c26a168df46e1490b090eb94a004aee0e15`.
- Unit: 1.493/1.493, 138 file, không fail/skip. Node22, dependency graph đã được duyệt, chạy trong bản source riêng.
- Release/config contracts: 84/84. Typecheck, Functions compiler, toàn bộ lint và production build: exit0.
- Audit của dependency graph không đổi: high0/critical0, còn 2 low/13 moderate. Đây là readback trước đó; audit CI hiện tại còn phải chạy.
- Rules/HTTP/restore: CI mới chưa có kết quả. Run trước đã qua baseline602 và purchase5; cart3PASS/1FAIL do lỗi projection đã được sửa. Không chạy thêm emulator local hoặc reset shared data.
- Browser: 139/139 ca mocked, bằng chứng lịch sử ở21a1acc; 3.773 TS source-map matches, không ghi nhận mismatch/error. CSS và fixture routes chưa được bind đầy đủ. Các ca đó không thực thi backend cart vừa sửa và không chứng minh native AT/customer/provider acceptance.
- Intelligence: DEGRADED vì index cũ; dùng source/Git/compiler/test có phạm vi. Áp dụng profiles TypeScript, React19, Node22, web/API/database/concurrency/devops/security/product content.
- Product Language/native/full customer acceptance: BLOCKED. Bản sửa cart giữ nguyên thông điệp và các ràng buộc số lượng; test handler không thay thế bằng chứng UI trong ngữ cảnh.
- Không thay đổi production schema, Firestore/Storage rules, TTL, dữ liệu khách hàng hoặc workflow phát hành.

## Các vòng review và sửa lỗi

1. Review source ban đầu yêu cầu sửa kiểm tra export, asset PDF, owner guard và trạng thái recovery. Không dùng kết quả hẹp của candidate cũ để nghiệm thu toàn bộ source.
2. Sửa có phạm vi: owner-handler red1FAIL/2PASS rồi green60; 75 preflight/71 release contracts. Giữ vấn đề font JP/KR và analytics attribution như residual.
3. Merge upstream thông thường: giữ Analytics HTTP, demo endpoint và các guard consent/recovery/auth. Validation cũ trở thành lịch sử khi source đổi.
4. Kiểm tra source sau merge: sửa 7 required markers thật; test red1/2 rồi green3/3. Tách lỗi env/socket/timing của runner, giữ nguyên timeout và assertions.
5. Review browser phát hiện Membership fixture cũ bỏ qua cross-task guard; yêu cầu sửa fixture và bind source đang được trình duyệt phục vụ.
6. Fixture Membership được sửa đúng luồng pending/replay/keyboard recovery. 139 mocked browser cases và 1.462 units qua; formal review vẫn BLOCKED vì native/customer/policy/provider thiếu bằng chứng.
7. CI37885468606 thất bại: baseline593PASS/7FAIL/5SKIP và lỗi setup suite. Endpoint fixture sai, thời hạn research cố định và tracking whitelist thiếu key an toàn. Build/deploy SKIPPED.
8. Review test expiry mới phát hiện oracle pricing cũng hết hạn policy. Chỉ sửa thời hạn của policy synthetic do fixture sở hữu và khôi phục trong finally; không sửa deadline/budget production.
9. Successor e3b2f39 qua checks local và review source. Các kiểm tra thật trên CI còn bắt buộc.
10. CI37886868261: baseline604PASS/3FAIL, không skip. Purchase thiếu settings và receipt phụ thuộc ca trước thất bại. Build/deploy SKIPPED.
11. Tách nhóm purchase CI serial ở đúng demo18207; fixture tạo settings riêng, từ chối dữ liệu có trước và cleanup theo ownership. Receipt được tạo qua handler thật độc lập. Test selection red2FAIL/3PASS rồi green5; giữ path-error invocation là NOT_RUN.
12. Successor5c7e867: 1.467 units/84 contracts và compiler/lint/build qua, review source PASSED; formal review BLOCKED.
13. CI37888720044: baseline602PASS, purchase5PASS, cart3PASS/1FAIL. Lỗi thật: Zod4 từ chối pick trên schema có refinement. Các nhóm sau và build/deploy chưa chạy.
14. Sửa tối thiểu cart projection bằng catalogSelectionSchema với cùng 3 field/strip. Handler regression trên code cũ:17FAIL/9PASS; bản sửa:26/26, cùng24cart/catalog thành50/50. Toàn repo1.493 units/84 contracts/compiler/lint/build qua. Review r4 bind đúng0d6 và3.138 file: source PASSED, formal BLOCKED. Pipeline mới37890490893 đang chạy.

Bulk-copy source riêng bị kẹt trước khi ghi file và được dừng. Hai lượt check khởi động trước khi copy xong được giữ với nhãn before-freeze-NOT_VERIFIED và không tính vào kết quả hiện tại. Freeze sau đó chỉ tái sử dụng file khớp Git blob, lấy hai blob thay đổi từ commit và đối chiếu toàn bộ 3.138 file. Test telemetry cần socket loopback được chạy lại ngoài sandbox theo quyền đã cấp, không thay đổi test.

Bằng chứng chi tiết của các vòng cũ được giữ tại [báo cáo lịch sử](TASK-REPORT-r7-HISTORY.md), các review r1–r4 và log riêng; không xóa các lần thất bại.

## Findings và giới hạn

- TL-LOCAL-01/02 (HIGH): export/import/region/binding và runtime asset allowlist đã sửa, verified bằng source/contract/PDF tests; giữ nguyên các production holds.
- TL-LOCAL-03 (MEDIUM): owner guard trước khi ghi, test handler chứng minh denial zero-write và luồng cùng chủ sở hữu.
- FE-REL-01 (MEDIUM): recovery chỉ được kết thúc với schema/identity/version đúng; helper/domain tests qua. Injection trên component tài chính và provider thật chưa chạy.
- TL-LOCAL-05/06 (MEDIUM): giữ nguyên các file upstream đã phát hành; sửa Membership fixture và bind mocked UI. Full runtime vẫn phụ thuộc CI/live tier.
- TL-CI-01/02/03: research clock/expiry, client endpoint, tracking bool whitelist đã sửa và được baseline thật kiểm chứng; không mở rộng quyền hay đưa dữ liệu tài chính vào payload.
- TL-CI-04/05/06: purchase fixture, nhóm CI và selection oracle đã sửa; run5c đã qua đủ5purchase cases.
- TL-CI-CART-01 (MEDIUM): projection đã sửa; current unit handler verified, actual cart CI mới còn pending.
- TL-LOCAL-04 (MEDIUM): font receipt thiếu glyph CJK/Japanese/Hangul; chữ gốc được giữ khi extract nhưng chưa nghiệm thu đọc bằng mắt cho JP/KR.
- FE-REL-03 (MEDIUM): đơn purchase mới chưa nối đầy đủ consented analytics attribution; không coi báo cáo conversion là đầy đủ.
- Dependency residual: 2 low/13 moderate; chưa có scope nâng cấp dependency rộng hơn.
- Fixture analytics HTTP có rủi ro LOW khi đổi ngày UTC giữa tạo event và query; chưa reproduce và chưa gắn với lỗi CI hiện tại.
- Native AT, real-device, full Product Language, customer authentication, real AI billing, live purchase/email và load acceptance: NOT_RUN/BLOCKED.

## Production activation

Giữ nguyên8holds: askWorkflow, currentAskConversation, maintenance, createPaymentLink, payosWebhook, reconcilePayments, deliverEmail, askFeedbackCleanup. purchaseDemoPayment chỉ có trong demo và bị loại riêng khỏi artifact. Không suy ra bật chức năng từ việc export tồn tại.

Purchase và balance mới còn demo-only; email purchase chưa có production consumer/sender. Legacy PayOS/SMTP có code nhưng bị giữ. Cần cấu hình merchant/sender, tích hợp và kiểm chứng đúng owner/amount/idempotency trước giao dịch thật. Nguồn knowledge phải qua publication/admission đúng content hash/version/locale/thời hạn. Nội dung chính sách chính thức và retention/cleanup chưa có readback đầy đủ.

Pricing windows của pilot/research đã hết hạn, ledger research50.000đ đang reserved toàn bộ. Không reset/replenish và không gọi Gemini có phí trong tác vụ phát hành này. Approval generic không thay cho publication, dữ liệu phí/tỷ giá thực hoặc ngân sách dùng cho khách hàng.

Readback trước phát hành thấy48composite indexes READY và deploy/Vertex APIs cần thiết đã bật. Pipeline chỉ promote Functions và Hosting. Hosting trước làv0.6.1/73dc; artifact/receipt rollback tồn tại, chưa thực hiện rollback. Cần đọc kết quả pipeline và receipt mới trước khi xác nhận deployed source.

## Git, chi phí và evidence

Concurrent payment/receipt/frontend/generated changes, private artifacts và layout r3 chưa duyệt được giữ ở local, ngoài commit đã frozen. Các bản tài liệu/ảnh upstream khác nhau có hai backup kiểm chứng. Worktree DIRTY có chủ ý; source review không nghiệm thu WIP chưa chọn.

Token usage: Unavailable. API-equivalent estimate: Unavailable. Actual billed cost: Unavailable. Memory candidates: None; không cập nhật memory.

- [Delivery receipt](DELIVERY-RECEIPT.json)
- [Quality gates r9](QUALITY-GATES-r9.json)
- [Final review r4](FINAL-REVIEW-r4.json)
- [Source fence](SOURCE-FENCE.json)
- [Cart delta plan](CI-CART-DELTA-PLAN.md)
- [Cart red/green evidence](CI-CART-FIX.md)
- [Provider activation facts](ACTIVATION-DECISIONS.md)

Kết quả CI/deploy/provider mới đang chờ; sẽ cập nhật từ receipt thật.

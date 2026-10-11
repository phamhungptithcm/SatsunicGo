# Phát hành v0.7.0

Đã push 7 commit local đã review lên `main`, kết thúc tại `0d6e721698608eebb36b0b2f68021c3054d97d1c`. Authenticated GitHub readback khớp commit này. Đã phát hành [v0.7.0](https://github.com/phamhungptithcm/SatsunicGo/releases/tag/v0.7.0) lúc 2026-10-09 06:24:22 UTC qua [pipeline 37890490893, attempt 2](https://github.com/phamhungptithcm/SatsunicGo/actions/runs/37890490893), cả quality, build và deploy SUCCESS.

**Phạm vi release đã được kiểm chứng:** Hosting 189 file đúng hash và 94 Functions ACTIVE, source archive/revision khớp artifact. **Toàn bộ sản phẩm cho khách hàng vẫn NOT_READY:** các production holds và điều kiện chính sách, adapter, AI, native/customer acceptance còn thiếu. Review độc lập r5: source và guarded release VERIFIED, không có code blocker mới; formal/full customer acceptance BLOCKED. Không dùng trạng thái deploy để thay cho nghiệm thu toàn sản phẩm.

Concurrent payment/demo/generated WIP phát sinh ngoài source fence và layout Ask r3 chưa duyệt được giữ ở local, không đưa vào release này. Không force push, reset, clean, bỏ assertion hoặc mở các hold để làm CI xanh.

## Tiêu chí và bằng chứng

| Tiêu chí | Trọng số | Kết quả |
|---|---:|---|
| Chọn đúng source, giữ WIP khác | 25 | PASSED: 3.138 file khớp Git blob và bản validation, không drift |
| Kiểm tra local trên đúng commit | 25 | PASSED: 1.493 unit, 84 contracts, typecheck, lint, production build |
| Giao source lên main | 20 | PASSED: push và authenticated readback khớp |
| Artifact, deploy và provider readback | 20 | PASSED: artifact 317 file; Hosting 189 hash; 94 source archives/revisions; receipt VERIFIED đã publish |
| Bật đầy đủ các chức năng cho khách hàng | 10 | BLOCKED: chính sách, payment/email/AI và nghiệm thu còn thiếu |

Ledger thủ công: 90/100 trọng số tiêu chí giao mã có bằng chứng; đây không phải phần trăm production readiness. Runtime CLI quản trị không có sẵn, các điều kiện nghiệm thu vẫn fail-closed. Intelligence DEGRADED vì index cũ; dùng source/Git/compiler/test có phạm vi, không giả định index READY.

## Kiểm chứng hiện tại

- Source fence: 3.138 file, SHA-256/Git blob khớp trước và sau review. Fence SHA `28430c6e4dce76c3e50c33be2b866c26a168df46e1490b090eb94a004aee0e15`.
- Local đúng commit 0d6, Node22/dependency graph được duyệt: 1.493/1.493 units trong 138 file; 84/84 contracts; compiler, typecheck, lint và production build exit 0.
- CI thật trên cùng source: 1.493 units; 71 release + 13 public-config contracts; 629 rules cases gồm baseline 602, purchase 5, cart 4, pilot 3, delivery 15. HTTP và restore PASS. HTTP là emulator-only, AppCheck/real Google NOT_TESTED; restore ở demo riêng, production restore NOT_TESTED.
- Production dependency audit qua ngưỡng high/critical: 0 high/critical, còn 2 low/13 moderate. Npm ci toàn graph báo 2 low/14 moderate/7 high; chưa triage/upgrade rộng, không gọi toàn dependency graph sạch.
- Artifact v0.7.0 có 317 file, bundle SHA `7da5b4e2257930f924e91db65a42ee149a7a70e1b1c3b74d6ac966a1277d0cca`, manifest SHA `2c589717213d95ac0890ceb28198aeb337829fc33551adadc09a5cb44e38d771`. 116 compiled nonentry modules khớp bản compile local đúng source; entry chỉ biến đổi theo hold/demo exclusion đã review.
- Pipeline tải từng Hosting file và 94 source archives thực tế để đối chiếu từng member/hash với manifest; kiểm tra Hosting finalized/stable và revisions/source references không đổi trong verification. Receipt SHA `747e45f80ba1909771b5d68c264ba25fd6569ee19a178c1ff3720ce898836615`, khớp digest asset GitHub đã publish.
- Root đọc lại inventory mọi region: đúng 94 tên, tất cả ACTIVE ở asia-southeast1, không missing/extra; revision và sourceGeneration khớp receipt. Hosting public trả đúng v0.7.0/0d6. Version `sites/satsunicgo/versions/9c7564a8f33ea291`, releaseTime 06:21:33.069 UTC.
- Browser lịch sử ở 21a1acc: 139/139 mocked cases, 3.773 TS source-map matches, không mismatch/error. CSS và fixture routes chưa bind đầy đủ. Không dùng kết quả đó để chứng minh backend cart vừa sửa, native AT hoặc customer/provider flow thật.
- Native AT/VoiceOver và real-device không chạy trong tác vụ release này. Product Language/full customer acceptance vẫn BLOCKED; handler units không thay cho evidence UI trong ngữ cảnh.

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
14. Sửa tối thiểu cart projection bằng catalogSelectionSchema với cùng 3 field/strip. Handler regression trên code cũ:17FAIL/9PASS; bản sửa:26/26, cùng24cart/catalog thành50/50. Toàn repo1.493 units/84 contracts/compiler/lint/build qua. Review r4 bind đúng0d6 và3.138 file: source PASSED, formal BLOCKED. CI37890490893 sau đó qua đủ629rules, HTTP, restore và build.

15. Attempt 1 của đúng 0d6 qua toàn quality/build nhưng Firebase CLI từ chối tạo purchaseReceiptWorker có retry trong chế độ noninteractive. Root đọc lại provider: Hosting vẫn v0.6.1 và 73 Functions, worker chưa có. Không thêm --force hoặc đổi workflow. Lập retry prerequisite plan; TL review tác động prefix selector/all-region, khả năng mutation trước prompt và giới hạn retry. Artifact 317 file và singleton desired/absent worker được kiểm chứng trước thao tác.
16. CLI lần đầu với TTY vẫn auto-noninteractive do AI-agent detection, dừng ở retry gate; được giữ là failed attempt. Dùng official --interactive và chỉ xác nhận prompt retry có đúng tên worker đã được user cho phép enable. Worker ACTIVE, source ZIP hash/member khớp artifact; inventory 73→74 chỉ thêm worker, 0 revision cũ thay đổi. Rerun failed deploy của cùng run, giữ source/artifact/quality/build cũ: attempt 2 SUCCESS, Hosting và đủ 94 Functions verified, release mới được publish. Fresh final review r5 xác nhận guarded release VERIFIED; formal/full customer acceptance BLOCKED.

Các lần check bắt đầu trước khi freeze riêng hoàn tất được giữ nhãn before-freeze-NOT_VERIFIED, không tính vào green hiện tại. Lỗi loopback sandbox được chạy lại theo quyền đã cấp, không sửa test. Các lần CI thất bại và review cũ được giữ tại [lịch sử](TASK-REPORT-r7-HISTORY.md), final reviews r1–r4 và log riêng.

17. Review packet cuối phát hiện câu “không đổi IAM” quá rộng so với evidence: inventory/revision không phải IAM-policy diff. Chỉ sửa metadata/report thành không cấp IAM thủ công; giữ khả năng Firebase-managed effects chưa audit độc lập. Giữ metadata r1, cập nhật hash successor và đối chiếu lại receipt, không sửa source hay deploy thêm.

## Findings và phần còn thiếu

- TL-LOCAL-01/02/03 và TL-CI-01..06: export/binding/asset allowlist, owner zero-write guards, fixture endpoint/clock/whitelist, purchase isolation và CI grouping đã sửa có phạm vi. Giữ guards, transactions, idempotency và assertion; không broaden quyền hoặc dữ liệu payload.
- TL-CI-CART-01: lỗi Zod4 pick trên schema refined đã sửa bằng canonical selection schema cùng 3 field/strip. Old source red 17 FAIL/9 PASS, sửa 26/26 handler + 24 cart/catalog PASS; actual CI cart 4/4 PASS trên 0d6. Không chỉ dựa unit mocks.
- FE-REL-01 recovery chỉ kết thúc với schema/identity/version đúng; unit/domain PASS, financial component fault injection/provider flow chưa nghiệm thu.
- TL-LOCAL-04 MEDIUM: NotoSans receipt thiếu glyph Japanese/Korean/CJK; Unicode extract giữ chữ nhưng chưa nghiệm thu đọc bằng mắt JP/KR.
- FE-REL-03 MEDIUM: purchase mới chưa đầy đủ consented analytics attribution; conversion reporting chưa đầy đủ.
- LOW: analytics HTTP fixture có rủi ro đổi ngày UTC giữa tạo event/query, chưa reproduce; không sửa rộng trong release này.
- Native/full Product Language, customer-auth/AppCheck, live AI billing, real purchase/payment/email, load acceptance: NOT_RUN/BLOCKED. Không suy ra từ deploy success hoặc thời gian test.

## Production activation và rollback

Đã enable prerequisite retry của purchaseReceiptWorker từ đúng artifact; worker không thực hiện thanh toán hoặc gửi email thật. Retry managed của Gen2 có cửa sổ 24 giờ; ba business attempts không phải trần chi phí Cloud. Không thu hồi lease hoặc sửa dữ liệu tài chính. Không thêm global --force, cấp IAM thủ công, đổi workflow/auth configuration, budget hoặc CI controls. Firebase có thể đảm bảo service-agent roles theo quy trình deploy chuẩn; không có IAM-policy diff để khẳng định tổng IAM delta bằng 0.

Giữ nguyên 8 holds: askWorkflow, currentAskConversation, maintenance, createPaymentLink, payosWebhook, reconcilePayments, deliverEmail, askFeedbackCleanup. Source inventory 102 production exports thành 94 trong artifact; purchaseDemoPayment bị loại riêng vì demo-only. Không coi export tồn tại là tính năng đã bật.

Purchase/balance mới vẫn demo-only, production trả payos_unavailable trước khi tạo giao dịch. Email purchase còn pending_configuration, chưa có production consumer/sender. Legacy PayOS/SMTP có code nhưng bị giữ. Merchant/sender/webhook và kiểm chứng owner/amount/idempotency/delivery thật còn thiếu. Cần phí/tỷ giá/thời hạn/termsVersion/region/commune/shipping chính thức, không invent settings.

Knowledge chính thức phải qua publication/admission có source ID, content hash/version/locale/effective window; static pages hoặc chữ Approved không chứng minh đã vào corpus. Privacy/refund/cancel và retention/cleanup chưa có owner facts/readback đầy đủ. Đề xuất feedback 30 ngày không đồng nghĩa toàn bộ chat/financial/backup đã được giữ/xóa 30 ngày. Learning không tự promote nguồn chưa duyệt.

Pricing pilot/research đã hết hạn; ledger research 50.000đ reserved toàn bộ. Không reset/replenish, không gọi Gemini có phí trong tác vụ release. Không suy ra ngân sách vận hành khách hàng từ ngân sách thử 50.000đ.

Readback trước phát hành có 48 composite indexes READY và deploy/Vertex APIs cần thiết đã bật. Firebase deploy đảm bảo service prerequisites tiêu chuẩn, chỉ promote Functions/Hosting. Không promote Firestore/Storage rules, indexes, TTL hoặc production datafix; không tuyên bố các phần đó đã được nghiệm thu mới.

Rollback reference v0.6.1 tại 73dc7d51cffd89ea2e62d2ee16b3f3ec5ccf2a36 có artifact/receipt. Chưa rollback; không coi việc có artifact là đã thử restore production.

## Evidence, chi phí và handoff

Worktree DIRTY có chủ ý: concurrent purchase/payment/demo/generated changes và private artifacts chưa review được giữ nguyên. Layout r3 là preview, chưa được duyệt và chưa tích hợp. Các biến thể tài liệu/ảnh upstream có hai backup kiểm chứng. Reports local không tự được đưa công khai vào source commit.

Token usage: Unavailable. API-equivalent estimate: Unavailable. Actual billed cost: Unavailable. Không có paid Gemini call hoặc budget reset trong tác vụ release. Memory candidates: None; không ghi memory.

- [Final independent review r5](FINAL-REVIEW-r5.json)
- [Delivery receipt](DELIVERY-RECEIPT.json)
- [Quality gates r10](QUALITY-GATES-r10.json)
- [Provider deployment receipt](PROVIDER-DEPLOYMENT-37890490893-2.json)
- [Root provider verification](PROVIDER-RELEASE-VERIFIED.json)
- [Source fence](SOURCE-FENCE.json)
- [Retry prerequisite plan](RETRY-POLICY-PREREQUISITE-PLAN.md)
- [Independent retry impact](RETRY-POLICY-IMPACT.md)
- [Cart red/green evidence](CI-CART-FIX.md)
- [Activation decisions](ACTIVATION-DECISIONS.md)

Fresh review r5 SHA `bab99d71c7e390302a56ebd2501c3f543110c0b0baa5358d444af28dea3a0ec7`: source fence 3.138 file và artifact 317 file không drift trước/sau review; guarded release VERIFIED, formal/full customer readiness NOT_READY và all-feature activation BLOCKED. Không có code blocker mới trong phạm vi release này. Lease độc lập RELEASED.

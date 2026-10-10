> Current email/DNS integration receipt: [EMAIL-REPORT.md](EMAIL-REPORT.md) and [EMAIL-VERIFICATION-LEDGER.json](EMAIL-VERIFICATION-LEDGER.json). The older counts and handoff state below are historical.

# Production integration — scenarios và kiểm chứng

Updated 2026-10-09 15:50 UTC. Baseline `0d6e721698608eebb36b0b2f68021c3054d97d1c`, shared dirty checkout. **Local QA checks passed; overall production release remains NOT_READY.** Automation `ph-t-h-nh-satsunicgo-sau-b-n-giao` is ACTIVE with the user's explicit permission to continue every 10 minutes after handoff and release only when required checks/approvals pass.

## Đã thực hiện

- Viết **92 scenario thực tế**: 25 happy/valid transitions, 67 negative/boundary/failure cases. Bao phủ chat tự nhiên, knowledge/chunking/feedback, mua hàng/tiền, email/SMS consent, tracking/UI, PII/authorization, concurrency/performance và release. `SCENARIOS.md` là ma trận dễ đọc; `SCENARIOS.json` phân loại và giữ trạng thái bằng chứng riêng. Đây không phải tuyên bố 92 E2E đã chạy.
- Chạy **183 focused unit**, **550 Ask/context/research unit** và toàn bộ root suite **1.879/1.879 unit test** bằng Node22. Các lần chạy chồng coverage, không cộng thành số test độc lập. Full-suite result có một file performance test đổi sau khi bắt đầu; đã chạy lại file hiện hành **1/1 passed**, production source trong fingerprint không đổi từ full rerun. `CHECKS.json` và `TEST-OBSERVATIONS.json` giữ kết quả có giới hạn này.
- **5/5 test tích hợp Firestore thật** passed: durable self-test claim/cooldown/quota/unknown replay, anonymous technical read/write denial, subscription replay/confirmation/scoped opt-out/stale token. Provider được giả lập. Chỉ dùng demo18207; không restart, reseed hay đổi rules.
- Tái hiện và kiểm chứng bản sửa **N-17/P-02** trên Firestore emulator thật, cùng batch limit20 và hai lượt xử lý. Probe code ở `probes/subscription-batch.cjs`, artifact trước/sau ở private/tmp; source/compiled hashes và kết quả ở `QUEUE-PROBE.json`.
- Node22 frontend/backend `tsc --noEmit`, isolated backend emit trước/sau, probe `node --check` và `git diff --check` passed. Chưa build artifact production mới, chưa audit graph production mới, chưa claim CI/deployed/live acceptance.

## Lỗi đã sửa và kiểm tra lại

**N-17 — job xác nhận chặn hàng đợi.** Source cũ trả `blocked_recipient` khi identity unverified/disabled/missing nhưng giữ job `queued`; nhánh này còn chạy trước expiry check. Qua hai batch, 20 job không hợp lệ giữ cả thư hợp lệ phía sau ở trạng thái chờ.

Đã bàn giao repro cho chat sở hữu notifications theo quyền sync chat trực tiếp của người dùng; không sửa chồng source. Owner sửa `subscription-delivery-service.ts` và thêm regression trong `notification-subscriptions.test.ts`: retire exact queued snapshot trong transaction; permanent invalid identity và malformed content được chặn; transient Auth errors giữ retryable; expiry được kiểm trước lookup; terminal/sending/unknown hoặc snapshot mới không bị ghi đè; consent không reset.

| Cùng probe Firestore thật | Trước sửa | Sau sửa |
| --- | --- | --- |
| Job còn queued | 21 | 0 |
| Blocked recipient | 0 | 20 |
| Job hợp lệ accepted bởi sender giả | 0 | 1 |
| Số lần gọi sender giả | 0 | 1 |
| Cleanup fixture có readback | PASSED | PASSED |

Mỗi run seed63 documents riêng; challenge của fixture hợp lệ cũng được dọn. Không tạo Auth account thật, không gửi email/SMS hoặc gọi provider. Focused postfix regression **126/126** gồm customer-email, delivery-security và subscriptions passed. Không coi fake sender accepted là Resend accepted hoặc inbox delivered.

## Review / fix loop và giới hạn

Cycle1: phát hiện N-17, source handoff drift và release preflight failure. Test Firestore đầu timeout do sandbox không kết nối loopback; curl cùng môi trường trả000. Full-suite đầu 1877/1879: telemetry HTTP probe bị listen EPERM; performance case mới sửa trong lúc run và chỉ báo generic STACK_TRACE_ERROR. Không kết luận các lỗi môi trường này là lỗi nghiệp vụ.

Cycle2: owner sửa N-17; kiểm tra compiled service trước/sau, unit regressions và actual Firestore probe. Chạy lại Firestore với quyền kết nối demo được duyệt: 5/5 passed. Performance test chạy riêng passed; full rerun với quyền loopback và4workers passed1879/1879, không giảm assertion hoặc nới timeout. File performance test sau đó đổi để tránh ghi đè review artifact mặc định; file hiện hành chạy lại1/1 passed. Review mới xác nhận bản sửa N-17 không thay consent, payment hoặc release controls.

Final local QA verification: **PASSED trong các kiểm tra đã chạy**. Overall release review: **BLOCKED / NOT_READY** do required release/live gates chưa có. Không phải independent external audit hoặc chứng nhận không còn bug. Trạng thái/timestamp/hashes ở `QA-SOURCE-MANIFEST.json` là fingerprint có giới hạn, không phải immutable candidate; các chat vẫn có thể sửa source.

## Còn phải hoàn thành

- Chờ tất cả handoff hiện hành, chốt scope/candidate, refresh review phụ thuộc khi source đổi. Không push main sớm vì workflow tự deploy khi push.
- Production preflight snapshot hiện **FAILED**: `FUNCTION_INVENTORY_INVALID`, `PUBLIC_ASSET_BINDING_INVALID`. Cần xử lý demo-only exports và regenerate asset từ candidate theo approved delta; không bypass gate.
- Worker customer/subscription vẫn SMTP + `SMTP_PASSWORD`, trong khi secret metadata chỉ có alias Resend `SFTP_PASSWORD` và SePay sandbox key. Cần approved transport/cutover delta, secret binding/IAM tối thiểu và queue handoff production. Không mở maintenance toàn hệ thống chỉ để gửi email.
- From được chọn là **contact@hunpeolabs.com**; provider domain verification **NOT_VERIFIED**. SMS provider chưa có. Real SePay/public IPN, actual sender/inbox/handset delivery, rebuilt authenticated browser flow và measured production load/SLO chưa được chứng nhận.
- 92 business scenarios còn cần mapping/cấp bằng chứng tương ứng; unit tests liên quan không tự chứng minh toàn hành trình chat → order → real payment → real email → tracking. UI/AT/browser reports của owner cần source hiện hành và integration acceptance.
- Runtime secrets, knowledge/feedback/retention, collection lifecycle, queues/metrics/alerts, config activation và rollback phải kiểm tra đúng candidate và quyền đã duyệt trước release. Không bịa policy hoặc reset unknown/financial records để vượt kiểm tra.

## Quality gates và vận hành

Compilation, local unit, selected emulator integration, probe syntax, diff check, bounded API/security/concurrency review: **PASSED** trong phạm vi nêu trên. Repository intelligence: **DEGRADED**, tools respond nhưng indexes stale; dùng canonical source/compiler/tests. Architecture và privacy: reviewed transaction fences, exact demo guard, fake provider, owner-isolated fixture cleanup, no secret payload access. Profiles: universal, TypeScript/JavaScript, API, database và concurrency. QA artifact không thay product UI/text; Product Language Gate cho các UI/email triển khai thuộc reports của owner và phải refresh trước release. Public SEO/motion/DB migration: NOT_APPLICABLE cho artifact/probe mới.

Real provider/live/browser/load, fresh production artifact/audit/deployment/readback: **NOT_RUN hoặc BLOCKED**, nên production không đạt READY. Mandatory runtime CLI unavailable; file ledgers là bằng chứng thay thế có công bố, không claim runtime receipt. Git vẫn dirty, giữ WIP khác; không commit/push/PR/deploy mới trong đợt QA này. Automation là thay đổi vận hành duy nhất của chat này, đã được tạo/readback sau xác nhận người dùng; lần automatic approval rejection trước đó đã được xử lý bằng explicit authorization, không bypass.

Provider token usage: **Unavailable**. Actual billed cost/API-equivalent estimate: **Unavailable**. Không gọi Gemini, đọc payload secret hoặc gửi email thật trong đợt này. Memory candidates: **None**.

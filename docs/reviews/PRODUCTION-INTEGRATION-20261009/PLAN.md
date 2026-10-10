# SatsunicGo — tích hợp và phát hành production

Plan: PRODUCTION-INTEGRATION-20261009/v1. Prepared 2026-10-09 15:26 UTC.
Baseline: `0d6e721698608eebb36b0b2f68021c3054d97d1c` on `main`; concurrent, dirty checkout.
Status: **WAITING_FOR_HANDOFF / NOT_READY**. This is a release preparation plan, not evidence that customer sending or any other provider is enabled.

## Yêu cầu và quyền đã có

Người dùng yêu cầu: “phải bật để triển khia lên production toàn bộ sau khi các chat hoàn thành session của họ”. Đã có quyền chuẩn bị tích hợp, theo dõi các chat và thực hiện phát hành sau khi công việc hoàn tất và đạt kiểm chứng. Không đẩy `main` trong lúc các chat còn sửa vì `release.yml` tự động phát hành khi push.

Các plan triển khai riêng vẫn áp dụng đúng phạm vi đã duyệt. Thử Resend trước đó chỉ duyệt một email đến chủ tài khoản, không phải quyền dùng `onboarding@resend.dev` gửi cho khách. Những thay đổi mới về transport, release gate hoặc runtime cần bản delta cụ thể và bằng chứng duyệt theo `.ai/workflows/plan-existing-system-change.md`; không tự ghi nhận kế hoạch này đã được duyệt. Không tự chọn domain gửi, nhà cung cấp SMS, thông tin thanh toán thật hay nguồn chính sách doanh nghiệp.

Xác nhận bổ sung của người dùng sau khi trình kế hoạch: From tạm thời **`contact@hunpeolabs.com`**, có thể thay sau. Đây là lựa chọn địa chỉ, chưa phải bằng chứng domain đã verified trên Resend. Người dùng cũng trả lời **“Cho phép tiếp tục và phát hành tự động”** cho câu hỏi rõ phạm vi automation trong chính chat, kiểm tra mỗi 10 phút, tiếp tục tích hợp sau bàn giao và phát hành khi đủ các kiểm tra cùng approval bắt buộc. Xác nhận này cho phép thử tạo lại automation; không bỏ các gate của repo hoặc điều kiện người dùng đã đặt.

## Các bản bàn giao cần đợi

| Chat | ID | Điều kiện bàn giao |
| --- | --- | --- |
| Define customer notifications | `01a12102-d68a-7fb2-864d-d02df0c7d127` | Renderer, event producers, delivery policy, review và source hashes hiện hành |
| Thiết kế tùy chọn email và SMS | `01a12117-e221-7411-aaa6-431277459111` | Checkout/profile, confirmation/opt-out, consent integration, review và source hashes |
| Mockup timeline theo dõi đơn hàng | `01a12113-3f9a-70f3-a031-fa88365f61a4` | Tracking UI/backend, ownership/privacy, browser evidence, review và source hashes |
| Tiến hành làm lại trang tổng quan một cách hardness loo… (2) | `01a120df-2ef2-79b2-a108-1bc1f32012a7` | Purchase/SePay scenarios, financial regression, current snapshot và limitations |

Tất cả bốn chat còn active tại lần đọc cuối. `idle` không đồng nghĩa hoàn tất hoặc production-ready. Đọc final report/review và xác nhận source hashes trước khi tích hợp. Không gửi tin vào chat khác khi chưa có bằng chứng người dùng cho phép nhắn chat đó. Không sửa các file đang thuộc chat khác, khởi động lại hoặc reseed runtime dùng chung.

## Những gì đã kiểm chứng

- Repository intelligence: **DEGRADED**; CodeGraph và CocoIndex trả lời, nhưng metadata index stale. CodeGraph còn trả cả bản sao trong `output/`; kết luận chỉ dùng canonical source và kiểm tra có giới hạn.
- TypeScript frontend và Functions: hai lệnh `tsc --noEmit` chạy bằng Node **22.23.3**, exit **0**. Không build đè `functions/lib` của runtime đang dùng.
- Preflight hiện tại: **FAILED**, `FUNCTION_INVENTORY_INVALID` và `PUBLIC_ASSET_BINDING_INVALID`. Đây là snapshot WIP, không phải bản build production mới.
- `functions/src/index.ts:553–570` có thêm conditional demo webhook/SePay exports; preflight hiện chỉ nhận diện exception `purchaseDemoPayment`. Không xóa/bỏ qua kiểm tra để cho deployment qua.
- `provider-release-gate.ts` giữ `email`, `payments`, `ai`, `scheduledMaintenance` ở false; hàm chỉ cho maintenance chạy trong demo xác định chính xác.
- `email.ts` và `subscription-email.ts` vẫn dùng Nodemailer + `SMTP_PASSWORD`. Resend adapter đã có ở `email/resend.ts`; private trial có source/archive/provider readback riêng. Chưa nối adapter vào hai worker gửi khách.
- Secret **metadata** production hiện có `SFTP_PASSWORD` và `SEPAY_SANDBOX_SECRET_KEY`; không có `SMTP_PASSWORD`. Không đọc payload secret. `SFTP_PASSWORD:1` là alias Resend người dùng đã xác nhận cho lần thử.
- `projectCustomerNotification` vẫn ghi `blocked_external` cho email đủ điều kiện; bật setting email đơn lẻ chưa làm gửi khách hoạt động.
- `maintenance` có cả precheck demo-only và nhiều nghiệp vụ khác; phần chuyển `blocked_external` → `queued` bên trong nó còn kiểm tra các trường SMTP. Không mở toàn bộ maintenance để giải quyết email. Delta cần nối enqueue từ trigger hiện có hoặc một recovery giới hạn được duyệt, không vô tình bật expiry/delete/các job nghiệp vụ khác.
- Chat SMS đã nhận câu trả lời người dùng: “Chưa có, chuẩn bị tích hợp trước”. Chưa có provider SMS, không được trình bày SMS đã gửi.
- Run release mới nhất được đọc qua GitHub: `37890490893`, success, đúng baseline. Điều này không chứng nhận các thay đổi local hiện tại.

## Trình tự thực hiện sau bàn giao

1. **Chốt candidate.** Đọc lại các chat và reports; lập scope manifest gồm canonical app source/tests/config, base SHA, từng file SHA-256 và các thay đổi ngoài phạm vi. Không đưa `.playwright-cli`, caches, `tmp`, private env hoặc dữ liệu test chứa PII vào commit. Giữ WIP khác nguyên trạng. Nếu có chat mới sửa cùng scope, bỏ freeze và chờ bàn giao mới.
2. **Chốt delta để duyệt.** Với email, xác định sender/domain Resend đã xác minh; transport chung dùng adapter hiện có và secret version được xác nhận, không tạo thêm consumer cho cùng outbox. Ghi rõ cutover, giới hạn gửi, quyền runtime, schema/settings và rollback. Với các capability khác, liệt kê điều kiện thực tế còn thiếu riêng từng capability. Không đổi toàn bộ boolean thành true.
3. **Tích hợp trong phạm vi đã duyệt.** Thay SMTP transport ở `email.ts` và `subscription-email.ts` bằng đường Resend đã kiểm chứng; giữ claim/fencing, immutable recipient/content hash, consent hiện hành, owner/locked-account checks. Phân biệt provider accepted với delivered; unknown không tự resend. Đồng bộ `customer-notification-delivery.ts`/`jobs.ts` để chỉ enqueue email sau thời điểm cutover được duyệt; không drain lịch sử. Ưu tiên trigger hiện có và recovery giới hạn; không mở maintenance toàn hệ thống chỉ để enqueue email. Release gate chỉ mở capability có đủ bằng chứng.
4. **Hoàn chỉnh artifact.** Giải quyết demo-only exports trong `index.ts` theo delta được duyệt và preflight có kiểm tra tương ứng; sandbox không được thành endpoint production. Regenerate public asset manifest bằng source build ở candidate cô lập đã được phép, không sửa generated file bằng tay. Không thay framework, release workflow hoặc thêm dependency ngoài scope.
5. **Kiểm chứng chung.** Node22 clean install/typecheck/lint/unit; release configuration/contracts và preflight; rules/integration trên runtime được phối hợp; business E2E và UI ở desktop/mobile/keyboard. Kiểm thử outbox trùng, timeout/unknown, đổi email, revoke consent, stale confirmation, provider từ chối, hàng đợi cũ, concurrent claims, tiền/phân bổ/PDF đúng, tracking partial/private. Chỉ chạy build/rules runtime mutation khi có ownership và không ảnh hưởng phiên khác.
6. **Review → fix → verify → review.** Áp dụng final-implementation-review cho candidate hiện tại; mọi required gate phải có evidence mới. Bất kỳ source hash thay đổi nào làm invalid các kết quả phụ thuộc. Không coi unit/emulator là bằng chứng provider hoặc production.
7. **Commit/push và deploy.** Chỉ sau các điều kiện trên: Conventional Commits, secret/PII scan, source fence; push `main` hoặc PR nếu branch protection yêu cầu. Dùng `.github/workflows/release.yml`, giữ immutable artifact, audit, inventory và Hosting/Functions source verification. Không deploy trực tiếp dirty checkout hoặc dùng đường khác để bypass CI/production environment gates.
8. **Kích hoạt và kiểm tra live.** Bật runtime/settings/capability đúng candidate và approved cutover; sender/domain/secret/IAM/scheduler được readback. Canary trong quyền và ngân sách đã có; không gửi thử cho khách ngoài scope. Xác nhận consent/confirmation/opt-out, provider accepted/delivery status, backlog không phát hàng loạt, browser flows và monitoring. Nếu lỗi: tắt sending trước, bảo toàn job states, rollback artifact; không reset unknown hoặc sửa tài chính.

## File/function dự kiến chịu tác động của delta email

| Path | Thay đổi cần được duyệt | Rủi ro và kiểm chứng |
| --- | --- | --- |
| `functions/src/email.ts` / `deliverEmail` | Gọi adapter Resend server-only; cấu hình sender/secret; mapping outcome | Không duplicate, không PII log, consent/owner recheck, accepted ≠ delivered |
| `functions/src/subscription-email.ts` / `deliverSubscriptionEmail` | Chung transport, giữ queue riêng và confirmation generations | Không bật lại lựa chọn đã hủy; link cũ/timeout không xác nhận nhầm |
| `functions/src/email/resend.ts` | Ưu tiên tái sử dụng; chỉ sửa nếu contract thực tế đòi hỏi | Request/response bounds, timeout, redirect refusal, idempotency |
| `functions/src/customer-notification-delivery.ts`, `functions/src/jobs.ts` | Cutover + eligible queue handoff; một consumer cho mỗi job | Không phát backlog, event integrity và trạng thái suppressed/unknown |
| `functions/src/provider-release-gate.ts` | Mở email theo phạm vi production đã đủ điều kiện, giữ các gate khác có lý do riêng | Exact project/runtime, không bật qua setting thiếu bằng chứng |
| `functions/src/index.ts`, `scripts/release/preflight.mjs` và release tests | Chốt demo-only export contract khi candidate hoàn tất | Không deploy sandbox, không xóa Function, giữ fail-closed preflight |
| Secret bindings/IAM và `settings/email`, `settings/customerNotifications` | Metadata/config tối thiểu theo sender/domain đã xác nhận | Không đọc/commit key; quyền đúng resource, rollback tắt gửi trước |

## Điều kiện còn thiếu

**WAITING:** bốn bản bàn giao cuối và hashes; xác minh domain cho From `contact@hunpeolabs.com`; delta transport/cutover có reviewed-plan approval; clean candidate/artifact; provider/live evidence và final review. SMS/provider thanh toán thật chỉ kích hoạt sau khi có cấu hình và scope thực tế được duyệt. Feedback/knowledge/AI gates cần kiểm tra source/readback hiện tại thay vì dựa vào ghi nhớ cũ.

Email A+B vừa gửi handoff `IMPLEMENTATION-SOURCE-MANIFEST.json` (28 files), report và final review cycle 2. Kiểm tra nhận bàn giao phát hiện ba hash đã đổi (`customer-email-job.ts`, `email.ts`, `customer-emails.test.ts`); không nhận snapshot này là frozen hoặc tái sử dụng test cũ cho nội dung mới. Chờ handoff cuối hiện hành sau khi các owner kết thúc.

Token usage và actual billed cost: **Unavailable**. Không gọi Gemini hoặc gửi email trong bước chuẩn bị này. Memory candidates: **None**.

## Theo dõi sau phiên

Automation heartbeat **`ph-t-h-nh-satsunicgo-sau-b-n-giao`** đã được tạo thành công, trạng thái **ACTIVE**, gắn đúng chat hiện tại `01a116b3-a055-7190-b275-a4461826678a`, mỗi 10 phút. View/readback đã mở được automation card. Lần tạo đầu bị automatic approval review từ chối do thiếu quyền riêng cho recurring production mutations; sau đó người dùng xác nhận rõ và lần tạo lại thành công. Một lần gọi thiếu targetThreadId bị validation từ chối trước mutation; không có automation trùng được báo tạo. Nội dung automation giữ các gate, yêu cầu source handoff, tránh notification lặp, chỉ phát hành sau đủ điều kiện và tự pause sau kiểm chứng production hoàn tất.

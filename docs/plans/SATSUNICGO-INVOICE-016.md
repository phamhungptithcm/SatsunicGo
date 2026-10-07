# SATSUNICGO-INVOICE-016 v1 — Hóa đơn online và gửi cho khách

Status: AWAITING_HUMAN_APPROVAL. Chưa triển khai. Base: 3bd0d093255963a2cbf66ddd80d27456da7076e0; worktree có nhiều WIP phải giữ nguyên.

## Evidence and intelligence

Repository gate đã chạy, refresh một lần: CodeGraph current/healthy; CocoIndex stale/unhealthy. DEGRADED, không khẳng định phân tích toàn bộ repo. CodeGraph query deliverEmail/orderHistory/membershipCommand và source xác nhận React 19, TypeScript 6, Vite 8, Firebase/Firestore, callable Functions, Zod, Vitest. Context repository-map/build-test-commands hiện là placeholders.

Observed: membershipInvoices là yêu cầu mua gói; OrderTools chỉ in bảng đối chiếu và xuất CSV. orderHistory kiểm tra chủ đơn hoặc vai trò staff hiện tại. financialEntries chứa khoản đã xác nhận. deliverEmail dùng SMTP secret, claim giao dịch, trạng thái unknown khi kết quả chưa rõ, lịch 30 phút; chưa có nội dung hóa đơn riêng. Không xác minh cấu hình SMTP production hay provider gửi tin.

## Proposed scope and workflow

MVP đề xuất là chứng từ bán hàng nội bộ, cần người dùng xác nhận loại chứng từ trước khi chốt phạm vi. Hóa đơn điện tử thuế là scope riêng cần nhà cung cấp và thông tin pháp nhân, không suy diễn từ PDF hoặc membershipInvoices.

Nhân viên mở đơn → Tạo chứng từ → xem trước → Xuất → chọn Gửi email hoặc Sao chép link/Chia sẻ. Khách xem trang riêng trên mobile và in/lưu PDF bằng trình duyệt. Nút phải ghi rõ In / Lưu PDF, không hứa file PDF đính kèm do server nếu chưa có renderer.

Trang staff có danh sách, lọc nháp/đã xuất/đã hủy, lịch sử gửi; account chỉ xem chứng từ thuộc chủ tài khoản. Chi tiết gồm người bán, người mua, dòng hàng/dịch vụ, tổng chi phí, tiền đã xác nhận, còn phải thanh toán, thời điểm dữ liệu. Làm rõ khoản mua hộ và doanh thu dịch vụ; không gán tất cả khoản thu thành doanh thu chịu thuế. Tiền VND tính bằng số nguyên và kiểm tra giới hạn; không suy diễn thuế suất.

MVP chia sẻ link thủ công qua ứng dụng hoặc clipboard cho Zalo/Messenger; mở chia sẻ không phải đã gửi. Tự động Zalo OA/ZBS và Facebook Page Messenger là phase 2, cần tài khoản/app, quyền, định danh người nhận, điều kiện gửi, hạn mức và phí được xác nhận. Không dùng API tài khoản cá nhân hoặc tự động đăng hóa đơn lên Facebook công khai.

## Data and security

Collection mới salesDocuments tách membershipInvoices: ownerId, sourceOrderId/sourceVersion, version, kind, currency, seller/buyer snapshot, lines, totals, paymentSnapshot, state, issueNumber, issuedAt. Draft có thể cập nhật bằng expectedVersion. Khi xuất, server kiểm tra nguồn và đóng băng snapshot; số chứng từ cấp trong transaction, operationId gắn actor/action/payload/version tránh trùng. Bản đã xuất không sửa đè; hủy có lý do/audit, bản thay thế liên kết bản cũ.

Không thay đổi sổ tiền, payment flow hoặc trạng thái đơn khi xuất/gửi. Người OWNER/FINANCE xuất/hủy; quyền SUPPORT gửi cần được xác nhận trong duyệt phạm vi. Server kiểm tra active/locked và chủ đơn; client không ghi trực tiếp. App Check/auth theo pattern hiện tại.

Khách đăng nhập xem theo quyền. Link chia sẻ dùng token ngẫu nhiên đủ mạnh, lưu hash, hết hạn/thu hồi và giới hạn request; không chứa PII trong URL, không ghi token vào logs/audit, no-store/noindex và Referrer-Policy. Người giữ link có quyền xem phạm vi tối thiểu được mô tả rõ trước khi tạo link.

Job gửi liên kết bản xuất cố định, đúng email Google đã xác minh của chủ tài khoản trong MVP. Email tùy ý hoặc khách chưa có tài khoản cần scope xác minh riêng. Giữ sent/failed/unknown riêng; SMTP accepted không chứng minh inbox delivery. Timeout sau gửi không tự retry mù; retry rõ lỗi tạm thời phải có backoff và giới hạn. Không lưu nội dung nhạy cảm vào telemetry.

## File/function plan

| File | Intended change |
| --- | --- |
| packages/domain/invoices.ts (new) | schemas, validateLines, calculateTotals, snapshot/revision rules |
| functions/src/invoices.ts (new) | invoiceCommand: createDraft/updateDraft/issue/void/createShare/revokeShare/queueEmail; invoiceDetail/list |
| functions/src/invoice-share.ts (new) | bounded token read endpoint, expiry/revocation/privacy headers |
| functions/src/index.ts | export invoice endpoints |
| functions/src/email.ts, email-content.ts | invoice job payload/template; preserve existing notification behavior |
| src/features/invoices/* (new) | staff list/editor/preview, account view, share view, print styles |
| src/app/App.tsx, src/features/operations/Workbench.tsx | route and staff navigation following actual router structure |
| src/features/orders/OrderTools.tsx | contextual entry to create/view document |
| firestore.rules, firestore.indexes.json | owner/staff reads, deny client writes, bounded list indexes |
| tests/unit/invoices.test.ts, email-content.test.ts | arithmetic, state transitions, source meanings, template escaping |
| tests/rules/invoices.test.ts, tests/http/callable.mjs | ownership/role/lock, retries/concurrency, share expiry/revoke, financial isolation |
| docs/reviews/INVOICE-016-* | content review, exact-candidate review/validation/report |

No dependency additions in MVP. Dedicated server PDF renderer, tax provider integration, immediate email trigger and social provider automation require separately reviewed scope. Existing 30-minute SMTP schedule is explicit UX constraint unless approved for change.

## Validation and delivery

Check money rounding/overflow, partial payments/refunds, stale source version, duplicate issue/send, operation key reused with changed payload, concurrent numbering, locked actor, cross-owner read, canceled document, invalid/expired/revoked link, XSS and unsafe URL, provider unavailable and ambiguous send. Invoice creation must not create financialEntries or change collected balances.

Run typecheck/lint, relevant Vitest, emulator rules/HTTP regression for orders/membership/payment/email. Browser mobile/desktop checks: empty/loading/error/no access, edit/preview/issued/void, print pagination, keyboard/focus/labels, Vietnamese copy. Apply product-content profile with full string/state inventory and all eight principles, in-context evidence. Final implementation review must pass fresh candidate before implementation handoff. Rollback stops new issuance/sending and preserves issued/audit data; never delete financial history. Deployment and real provider tests require separately authorized configuration, no live messages during planning.

## Open decisions and approval

Required: internal sales document or legally issued tax invoice (or both); seller identity and business basis; PDF browser export acceptable or downloadable attachment required; manual social sharing or automatic delivery; recipient and permission scope. Tax invoice and automatic social delivery cannot be promised as MVP without these decisions.

Approve by citing SATSUNICGO-INVOICE-016 v1 with chosen scope/constraints; record human identity and task reference in tracked approval record before protected edits. Current status: PLANNING_ONLY / IMPLEMENTATION_BLOCKED_PENDING_APPROVAL. No application changes, runtime tests, production configuration or sends performed for this task. Final implementation review NOT_RUN because implementation has not begun; production NOT_READY. Token usage and actual cost Unavailable. Memory candidates: None.

References: https://developers.zalo.me/docs/ ; https://oa.zalo.me/home/documents/vie/guides/tong-quan-cac-loai-tin-nhan-tren-zalo-official-account-_3651713298729094511 ; https://www.postman.com/meta/messenger-platform-api/folder/vilwbh4/send-api

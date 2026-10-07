# SATSUNICGO-E2E-005 v1 — CRM và hoàn thiện master prompt

Status: APPROVED — owner replied `approved`; evidence: docs/approvals/SATSUNICGO-E2E-005.md.
Ngày: 2026-10-04, America/Chicago. Candidate nền: `3bd0d093255963a2cbf66ddd80d27456da7076e0` cộng WIP hiện tại.

## Mục tiêu và ranh giới phê duyệt

Hoàn thiện nghiệp vụ theo MASTER_PROMPT.md, từ UI đến callable, Firestore/Storage, phân quyền và kiểm thử. CRM phải dùng được để theo dõi khách/đơn/việc; public navbar và không gian vận hành phải phù hợp desktop/mobile và source HunpeoLabs.

Đã có SATSUNICGO-001 v1 cho triển khai local A–E và UX-AUTH-004 cho chrome/auth. Không yêu cầu phê duyệt lại hai kế hoạch đó. Kế hoạch này cụ thể hóa thay đổi trên hệ thống hiện tại: thêm API danh sách/tìm khách và việc chăm sóc, cấu trúc điều hướng CRM theo route, indexes và các trạng thái nghiệp vụ còn thiếu. Cần review v1 này theo workflow existing-system trước triển khai các thay đổi đó. Không tự ghi APPROVED.

Phạm vi môi trường: local và emulator `demo-satsunicgo`. Setup dữ liệu thử nghiệm tái lập được; cấu hình thương mại thật chỉ nhận từ owner và kiểm tra. Deploy, billing, IAM, secret, bootstrap owner thật, giao dịch thật, email ra ngoài và public push cần authority riêng.

## Evidence hiện tại

- Gate đã chạy và refresh đúng một lần. Gate vẫn DEGRADED: metadata báo stale cả hai index, CocoIndex health failed; MCP CodeGraph/CocoIndex truy vấn được. Kết quả index chỉ hỗ trợ định vị; kết luận bên dưới xác minh từ source.
- React 19.3, TypeScript 6.0.3, Vite 8.3.2; Firebase client 12.19; Functions TypeScript/Node 22; Firestore/Storage; Zod/Vitest/ESLint. Giữ stack hiện tại.
- `src/app/App.tsx::Staff` render tất cả module theo quyền trong cùng một trang, chưa có workspace sidebar và route riêng từng công việc.
- `src/features/crm/Customer.tsx::load/save` yêu cầu nhập UID. Sau lưu xóa hồ sơ và yêu cầu tải lại. `followup` không có giá trị mặc định: sửa ghi chú mà không nhập lại hẹn gửi `followUpAt: 0`, làm mất lịch hẹn hiện có.
- `functions/src/crm.ts::readCustomer` đọc tối đa 30 đơn/ticket, không sắp xếp theo thời gian và không có cursor cho hồ sơ. `saveCustomerNotes` có version/idempotency và audit; phải giữ những bảo vệ này.
- `functions/src/workspace.ts::listWork` không hỗ trợ danh sách khách/việc CRM; hiện trả data document theo collection. Cần review projection theo vai trò trước gắn vào màn hình mới, đặc biệt WAREHOUSE/SUPPORT và staff nhiều vai trò.
- `operationalDashboard` chỉ đếm tối đa 100 bản ghi tạo trong khoảng UTC; không phải toàn bộ tồn đọng. Không đổi nhãn thành tổng toàn hệ thống.
- `SiteChrome.tsx` đã có hamburger, Escape và route/resize close; CSS có nhiều lớp override breakpoint. Chưa có rendered evidence để kết luận vỡ navbar hay đạt parity.
- Reference đã đọc: HunpeoLabs `components/site-header.tsx`, `app/admin/blog/layout.tsx`, `components/blog-admin/chrome.tsx` (StudioShell/StudioLinks). Port pattern sang React Router, không mang auth/Next.js vào app.
- `docs/REQUIREMENTS_MATRIX.md` ghi cả A01–E02 PARTIAL; `PRODUCTION_READINESS.md` ghi NOT_READY. Đây là trạng thái tài liệu cũ, không thay cho acceptance mới.
- Baseline hiện tại: `npm run typecheck` PASS; `npm test` PASS, 14 files/42 tests. Rules, HTTP, restore và browser chưa chạy trong audit này. Không lấy kết quả cũ làm bằng chứng mới.

## Luồng và phương án cụ thể

Public/customer/staff UI → `callService`/`sendCommand` → auth/App Check → quyền hiện hành/ownership/assignment → Zod → expectedVersion/operationId → Firestore transaction → projection/timeline/audit/outbox → đọc lại dữ liệu có thẩm quyền. Provider effects nằm ngoài transaction retry. Giữ accepted quote/terms/benefit snapshot, ledger append-only, chặn xuất gửi khi thiếu tiền/hold.

### 1. Navbar và CRM workspace

Files: `src/app/SiteChrome.tsx`, `src/app/App.tsx`, `src/styles/global.css`; thêm `src/features/crm/Workspace.tsx` khi cần tách shell.

- Public header gọn, active link, brand/actions không tràn khi đã đăng nhập; mobile menu có target đủ lớn, Escape, focus recovery, route-change close, scroll/safe-area và reduced motion. Không thêm nút đăng nhập trên navbar trái UX-AUTH-004.
- Workspace riêng `/staff/*`: tổng quan, yêu cầu/báo giá, mua hàng, kho/kiện, vận chuyển/gom kiện, tài chính, khách hàng, hỗ trợ, nội dung, membership, nhân viên, audit và cấu hình. `/staff` giữ landing tương thích; menu chỉ hiện module được phép, server vẫn quyết định quyền.
- Sidebar desktop; menu mobile; breadcrumb/title/action rõ; bảng có vùng cuộn riêng hoặc card thích hợp, không làm toàn trang tràn ngang. Chỉ mount listener/module đang mở; cleanup khi đổi route/logout/quyền bị thu hồi.
- Đối chiếu hình ảnh HunpeoLabs/Studio, lưu reference hash và screenshot. Không tuyên bố giống 100% từ source.

### 2. CRM theo dõi được từ danh sách tới hồ sơ

Files: `src/features/crm/Customer.tsx`, `Dashboard.tsx`, module CRM list/follow-up mới; `functions/src/crm.ts`, exports `functions/src/index.ts`; `firestore.indexes.json`; tests Rules/server/HTTP/browser.

- Thêm callable `listCustomers`: cursor giới hạn 30, tìm exact UID và prefix tên theo field được chuẩn hóa phía server; output projection tối thiểu. Không giả full-text, không đọc toàn collection về client.
- Hồ sơ có thông tin/consent, membership, ghi chú/tag, người phụ trách, đơn/ticket/chứng từ được phép và việc theo dõi. Link tới đúng detail; các tab có pagination/thứ tự ổn định, loading/empty/error/retry.
- Thêm `listFollowUps` cho sắp đến hạn/quá hạn/theo người phụ trách; query `crmCustomers` bằng `followUpAt`, `assigneeId`, cursor ổn định và indexes phù hợp. Chưa tự thêm collection task vô hạn hoặc workflow engine.
- `saveCustomerNotes`: xác minh khách tồn tại, assignee hiện hành đúng quyền; giữ version/idempotency. UI điền lại lịch địa phương, refresh snapshot sau lưu, giữ payload/operationId qua retry và bỏ kết quả request cũ khi chuyển khách. Hoàn tất/đổi hẹn có audit, không thay consent khách bằng thao tác staff.
- Dashboard dẫn vào hàng đợi có filter tương ứng; phân biệt cohort theo ngày tạo với backlog hiện tại. Chỉ tính giao trễ khi có ETA hợp lệ; receipt/packing discrepancies phải có dữ liệu thật.
- Review quyền đọc hồ sơ/tài chính và nhiều vai trò: membership thương mại không cấp staff, customer không đọc CRM notes, WAREHOUSE chỉ nhận projection cần cho giao nhận.

### 3. Đóng gaps nghiệp vụ theo master, không bỏ phần sau

| Nhóm | Files/module dự kiến | Hoàn thiện và acceptance |
| --- | --- | --- |
| Yêu cầu/báo giá | requests/orders, domain, functions/index.ts, media.ts, Storage rules | Ảnh riêng, missing variants, version/expiry/acceptance; tên sản phẩm không tự thu cọc; nhiều quốc gia tách đơn |
| Thanh toán/ngoại lệ | payments/Finance.tsx, functions/payments/payos.ts, index.ts, domain | Review transfer, sai/thiếu/thừa/trễ tiền, reversal, refund pending/reservation/confirmed và reconciliation; chứng từ version/print đúng nghĩa; test không ghi có hai lần |
| Mua/kho/trả hàng | operations/Workbench.tsx, warehouse, functions/changes.ts, changes/domain | Bằng chứng mua/kiểm hàng riêng, một phần/thiếu/hỏng, return authorization → nhận trả → kiểm tra → quyết định tài chính có quyền |
| Kiện/vận chuyển | shipping, functions/shipping.ts, consolidation.ts, domain | Packing list/checklist/địa chỉ snapshot, failed delivery/lost/return, từng kiện/số lượng; batch dispatch kiểm tra mọi đơn và conservation cước |
| Membership/business | membership, business, functions/membership.ts | Gia hạn/hủy ý định/nhắc/hết hạn, benefit snapshot, CSV/reorder/export; tiền membership tách đơn |
| Support/CMS/marketing | support, content, functions/workspace.ts, public.ts | Assignment, messages/internal notes, draft/preview/schedule/archive, HTML metadata theo publish, consent/UTM; external posting disabled khi chưa cấu hình |
| Thông báo/vận hành | notifications, functions/jobs.ts/email.ts, settings | Coverage event, trạng thái queued/sent/failed/unknown, bounded retry, màn hình ngoại lệ; lỗi email không rollback tiền |
| Ask/auth | ask/auth, functions/ai/ask.ts, shared/firebase.ts | Giữ hợp đồng mục 14, stream/cancel/retry/quota/injection/ownership, draft xác nhận; Google fallback/logout/mobile; live provider evidence riêng |

Mỗi nhóm trace UI → command → database → quyền → failure paths trước edit. Nếu phát hiện thay đổi materially ngoài hợp đồng master/plan này (provider/framework mới, commercial policy mới, topology mới), dừng riêng phần đó để delta approval. Không bỏ gap độc lập chỉ vì provider chưa có credentials.

### 4. Database và setup dữ liệu ready

Files: `scripts/` (seed/reset/check-config emulator mới), `.env.example` nếu thiếu option hiện hành; Firebase rules/indexes; `docs/LOCAL_RUNBOOK.md`, `ARCHITECTURE_AND_DATA.md`, `EXTERNAL_SETUP_REQUIRED.md`.

- Seed deterministic chỉ khi demo project + đúng loopback emulator host; fail closed khi thiếu emulator/target khác. Batch/bounded writes, namespace fixture riêng, seed lặp không trùng và reset chỉ namespace fixture. Không cần credentials production.
- Bộ fixture: customer A/B, đủ staff roles, revoked/locked; đơn ở từng bước, follow-up overdue/upcoming, tickets, transfer pending, warehouse mismatch, multiple packages/hold, membership/CMS/outbox. Dữ liệu demo hiện rõ trong môi trường thử; không seed paid giả lên production.
- Tách technical defaults khỏi rates/beneficiary/membership/terms/business identity chưa được duyệt. Có checklist config thiếu, không tự tạo thương mại để mở bán.
- Schema bổ sung tương thích; normalized search fields server-owned. Backfill có dry-run/count/cursor/resume, không chạy production trong scope. Indexes cập nhật cùng query; giữ client write deny. Rollback UI/API dùng dữ liệu cũ; không xóa ledger/audit.
- Hướng dẫn start web + emulators + seed + login fixture + chạy lifecycle, một entry point rõ. Test restore Firestore và Storage riêng, không phát lại provider effects.

## Risk, alternatives và chất lượng

HIGH: tiền/permission/private files/concurrency; MEDIUM: CRM API/schema/query/search, shell route; LOW: style thuần. Nguy cơ stale detail, duplicate submit, lịch hẹn mất, overfetch, role projection leak, old-link break và layout overflow. Giảm bằng server projection/current-role checks, cursor, atomic guards, input bounds, listener cancellation và regression đúng bug.

Chọn reuse domain/commands/collections, additive CRM endpoints và route shell gọn. Không chọn viết lại backend hoặc scan toàn bộ data cho search. Firestore prefix search là giới hạn V1 hợp lệ; dedicated full-text search cần yêu cầu khác. Bounded dashboard trung thực tốt hơn global count không có reconciliation.

Profiles: universal, typescript-javascript, frontend-html-css, web-app, api, database, concurrency, product-content, visual-design, animation-motion; thêm profile khi implementation thực sự ảnh hưởng SEO/memory. Product Language Gate dùng write-product-content: inventory string/state, Purpose/Agency/Responsibility/Familiarity/Flexibility/Simplicity/Craft/Delight và screenshot in-context, không chỉ string file.

## Kiểm thử và điều kiện hoàn tất

1. `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
2. `npm run test:rules`, `npm run test:http`, `npm run test:restore`; API denial anonymous/cross-customer/role/assignment/revoked/locked trực tiếp.
3. Regression CRM: ghi chú giữ hẹn, hai người sửa cùng version, retry cùng operationId, cursor không trùng/mất, filter quá hạn, timezone roundtrip, stale response/cross-account cleanup, không lộ notes/customer khác.
4. Chạy cả 12 acceptance scenarios mục 18 MASTER_PROMPT; lưu requirement → implementation → test → evidence trên current candidate. Domain test không thay browser E2E.
5. Browser 390/768/1440px, bổ sung 320px/zoom 200%/long name/logged-in; keyboard/focus/menu/dialog, slow network/offline/error, reduced motion, click tới detail, không tràn trang hoặc che nút bởi composer. Xin phép URL chỉ bằng surface được phép nếu policy chặn; không bypass restriction.
6. Current `final-implementation-review`: review → fix in-scope → verify → review đến fresh PASS; Product Content review và quality gates current. Ghi findings/cycles/task report/candidate hash.
7. Cập nhật requirements, test evidence, runbooks, readiness; token/cost Unavailable khi provider không cung cấp. Memory candidates: None; không ghi durable memory.

`IMPLEMENTATION_COMPLETE` chỉ khi mọi gap source và acceptance độc lập đều hoàn thành. `VERIFIED_IN_STAGING` cần staging thật. `READY_FOR_LIVE_TRANSACTIONS` cần provider/policy/readiness đầy đủ. Hiện cả ba chưa đạt; production NOT_READY. Credentials/live OAuth/MFA/App Check/SMTP/AI/payOS/carrier/policy chưa xác minh phải ghi BLOCKED_EXTERNAL hoặc NOT_RUN đúng lý do, không giả PASS.

## Phê duyệt cần có

Phê duyệt SATSUNICGO-E2E-005 v1 cho local implementation và emulator/browser verification theo các file/commands/data boundaries ở trên. Ghi approver và câu trả lời/task reference thật vào approval record trước protected edits. Phê duyệt này không tự cho phép cloud mutation hay giao dịch thật.

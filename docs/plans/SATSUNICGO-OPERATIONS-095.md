# SATSUNICGO-OPERATIONS-095 — Thiết kế lại 5 trang vận hành

Version: 1. Status: IMPLEMENTED_LOCAL. Human approval: docs/approvals/SATSUNICGO-OPERATIONS-095.md. Evidence: docs/reviews/OPERATIONS-095/TASK_REPORT.md. Scope: frontend local.

## Bằng chứng và intelligence brief

HEAD khảo sát: 269aca833a748ac08b4152aa7de5a23d6cc4900a; shared worktree có WIP khác, phải giữ nguyên. Gate ban đầu DEGRADED: CodeGraph/CocoIndex health passed nhưng metadata stale; đã thử refresh một lần. Kết luận được kiểm tra bằng source hiện tại, không tuyên bố coverage toàn repo. CodeGraph xác định Workspace → Workbench → ActionForm/OperationsDetails và CrmHeading dùng chung 34 callers. CocoIndex tìm thấy lịch sử hardening CRM021/028; approval cũ không được suy diễn thành approval redesign này.

Source: src/features/operations/Workbench.tsx, OperationsDetails.tsx, Returns.tsx; src/features/orders/Changes.tsx (ChangeQueue); src/features/crm/CrmPresentation.tsx, Workspace.tsx, Workspace.css; package.json. Repository map/build context là placeholder. Stack: React, TypeScript, Vite, Firebase callable, Vitest. Server 127.0.0.1:5207 có listener; không restart hay thêm server.

Observed: ba trang yêu cầu/báo giá, mua hàng, kho dùng cùng Workbench. ActionForm lọc theo roles và loại catalog/custom; backend vẫn quyết định quyền/trạng thái. Returns có receive/inspect/close, uncertain retry và version guards. ChangeQueue chỉ đọc accepted proposals, lấy phiên bản đơn trước apply, có pending/uncertain guards. Phân trang Workbench/Returns thay trang; ChangeQueue tải thêm. Không đổi các semantics này.

## Mục tiêu và bố cục cụ thể

Giúp nhân viên biết việc nào cần xử lý, đọc thông tin cần thiết và ghi nhận đúng thao tác với ít cuộn. Không tạo KPI, SLA, doanh thu hay bộ lọc backend giả.

```text
Tên công việc · mô tả ngắn                         [Tải lại]
[Hàng đợi hiện có]         Số đơn trong trang (chỉ sau tải thành công)
┌ Danh sách 340–400px ┐  ┌ Chi tiết đơn linh hoạt ───────────────┐
│ Tên hàng / thị trường│  │ Tên hàng · trạng thái · mã đơn       │
│ Trạng thái / tạm giữ │  │ Số lượng và tiền theo quyền         │
│ Mã đơn · chọn đơn    │  │ Hàng hóa / thông tin đặt hàng       │
│ Phân trang           │  │ Thao tác → nhóm trường → xác nhận   │
└─────────────────────┘  │ Trao đổi / bằng chứng / công cụ      │
                         └─────────────────────────────────────┘
```

Desktop: tiêu đề 24–28px, nội dung 14–16px, surface trắng trên nền xám nhạt, navy #111c35 và royal blue #163cff; spacing 4/8px, border nhẹ, ít shadow. Dùng functional density từ IBM làm tham khảo, giữ typography/radius/token SatsunicGo. Không sao chép thương hiệu hay thêm thư viện UI.

Mobile: danh sách → chi tiết với nút quay lại; giữ focus/scroll restoration hiện có. Form một cột, mã dài wrap, không tràn ngang ở 320/390px. Desktop không buộc người dùng cuộn qua toàn danh sách để thao tác.

### Yêu cầu & báo giá

Toolbar chứa bộ lọc hàng đợi hiện có. Chi tiết nhóm thành hàng hóa, nhu cầu khách và báo giá. Form báo giá chia: xác minh sản phẩm → chi phí/tiền nguồn/tỷ giá → điều khoản/hạn báo giá → gửi. Nhãn và đơn vị luôn hiện; không sửa phép tính hoặc payload. Catalog vẫn không có issueQuote/finalize.

### Mua hàng

Thông tin cần mua và tình trạng thanh toán nằm trước form. Giữ prerequisite của claimPurchase và khác biệt toàn bộ tiền catalog/cọc custom. Ghi nhận mua nhóm số lượng từng dòng, đơn cửa hàng, tiền nguồn thực trả và bằng chứng. Không đổi điều kiện nhận việc hay tự ghi nhận thanh toán.

### Nhận kho & đóng gói

Đặt tổng/đã nhận/đã đóng gói cạnh trạng thái. Nhận hàng: số lượng theo dòng → tình trạng/vị trí kệ → bằng chứng. Đóng gói: cân nặng/kích thước → checklist/bằng chứng → xác nhận. Đơn vị g/cm phải rõ. Dữ liệu lần ghi nhận gần nhất và nhãn in nội bộ vẫn có qualification hiện tại.

### Nhận & kiểm tra hàng trả

Card công việc gọn, bảng số lượng trước vùng xử lý. Nhóm thao tác theo receive/inspect/close, chỉ hiện trường áp dụng như hiện tại. Cảnh báo hoàn tất kiểm tra không tự hoàn tiền/gỡ giữ đặt sát hành động hoàn tất. Giữ retry đúng command đã gửi, canClose và version/quantity guards.

### Thay đổi chờ áp dụng

Card cho thấy loại đề xuất, lý do, tổng sau thay đổi, chi phí và mã đơn; badge khách đã duyệt. Nút áp dụng đi cùng hậu quả thực tế đã có trong source. Giữ đọc accepted, version readback, khóa khi uncertain và tải thêm deduplicate. Chỉ đổi presentation ChangeQueue; CustomerChanges/ProposeChange không thuộc redesign này.

### Trạng thái

Empty đầy đủ chiều rộng vùng công việc, icon trung tính và mô tả đúng phạm vi; không dùng check như bằng chứng đã hoàn tất việc. Loading riêng, lỗi có retry, permission failure không hiển thị private data cũ. Không chuyển chưa tải/thất bại thành 0. Số lượng chỉ là số bản ghi trong trang/đã tải, không tổng hệ thống. Pending giữ draft và disabled guard; focus rõ, thông báo lỗi gắn vùng form, reduced motion.

## Kế hoạch theo file / impact

1. src/features/operations/Workbench.tsx: heading/toolbar/list/detail hierarchy; nhóm ActionForm bằng fieldset/legend và grid; giữ form names, handlers, action selection, generation/mutation guards, refs, role filters và route params.
2. src/features/operations/Returns.tsx: heading/empty/card/table/form hierarchy; giữ returnPayload, execute, uncertain retry, canClose, pagination và native validation.
3. src/features/orders/Changes.tsx: chỉ presentation trong ChangeQueue, thêm class scope và metadata/action hierarchy; không đổi useChangeMutation/CustomerChanges/ProposeChange hoặc command contract.
4. src/features/operations/operations-workbench.css (mới): style scope riêng, import từ các entry cần dùng; tránh global selectors.
5. src/features/operations/OperationsPresentation.tsx (mới nếu cần): layout/empty/section presentation dùng chung nội bộ operations, compose CrmHeading/CrmIcon/CrmReference thay vì sửa shared primitive.
6. tests/unit/workbench-ui.test.ts, workbench-ui-lifecycle.test.ts, returns-contextual.test.ts: chỉ bổ sung assertions có ý nghĩa khi markup thay đổi. Test browser scoped mới nếu cần; không sửa fixtures/runtime của chat khác.
7. docs/reviews/OPERATIONS-095/: product-content inventory/review, quality evidence, final review cycles, task report.

Risk MEDIUM: UI điều khiển công việc và tài chính. Bảo toàn server authorization, API/schema, money semantics, idempotency, stale-response protection, version checks và khóa submit. Chú ý markup không làm mất required/disabled/names, draft, focus hoặc hiện action sai role. Nếu phát hiện bug cần thay contract/backend, xin delta approval. Không dependencies, deploy, runtime/infra hoặc seed changes. Rollback bằng scoped diff, không revert WIP khác.

## Đồng bộ các chat

Đã gửi yêu cầu coordination tới “Redesign the confusing page form” (shipping) và “Redesign business overview page” (dashboard), theo yêu cầu sync của người dùng. Hướng thống nhất: compact enterprise, brand hiện có, CrmPresentation, CSS scope riêng. Không sửa Workspace.tsx/Workspace.css/CrmPresentation.tsx/App.tsx hay files shipping/dashboard; mọi thay đổi shared cần owner agreement và delta scope. Chưa tuyên bố các chat đã xác nhận contract.

## Kiểm chứng sau approval

Áp dụng write-product-content cùng profiles TypeScript/frontend/web-app/visual-design/product-content. Inventory toàn bộ string/state, đối chiếu actual behavior; review Purpose, Agency, Responsibility, Familiarity, Flexibility, Simplicity, Craft, Delight và web-platform fit bằng evidence in-context.

Chạy Vitest focused workbench-ui, workbench-ui-lifecycle, returns-contextual và tests changes hiện có; TypeScript noEmit; ESLint scoped. Browser shared 5207: desktop, 390/320px, keyboard/focus/back, zoom 200%, reduced-motion, dài mã/tên, loading/empty/error/pending/uncertain, role/catalog/custom, pagination, giữ input khi lỗi. Không claim fixture/local thành provider/production.

Mandatory final-implementation-review: review → fix approved findings → verify → fresh review, lưu mỗi cycle. Hiện implementation/tests/browser/final review: NOT_RUN; production readiness: NOT_READY. Token usage và actual billed cost: Unavailable. Memory candidates: None.

## Approval

Cần human approval cho OPERATIONS-095 v1, frontend và files scoped trên, trước protected edits theo .ai/workflows/plan-existing-system-change.md bước 15. Approval không bao gồm deployment/backend/shared runtime. Đây là kế hoạch thiết kế, chưa triển khai ứng dụng.

# SATSUNICGO-CRM-STEPPER-098 — Đồng bộ form nhiều bước CRM

Version: 1. Status: AWAITING_HUMAN_APPROVAL. Date: 2026-10-06.

## Yêu cầu và intelligence

Yêu cầu mới nhất của người dùng mở rộng Shipping094 sang toàn bộ CRM pages có form tương tự. Mẫu chuẩn là functional stepper của Request083 trong RequestForm.tsx và request-form.css, không phải các section đánh số cùng hiển thị.

Intelligence: DEGRADED. CodeGraph health passed nhưng index stale; CocoIndex stale và daemon không khởi động được do quyền ghi ngoài sandbox. Đã rà source Workspace.tsx, các form dưới đây và Git status hiện tại bằng bounded source reads. Không xem index cũ là bằng chứng hiện hành. React 19 / TypeScript / Vite; dùng component và CSS hiện có, không thêm thư viện.

Worktree có các thay đổi CRM từ những phiên khác. Baseline triển khai phải là nội dung hiện tại từng file, không phải HEAD. Không hoàn tác, ghi đè hoặc format toàn file ngoài phần cần sửa; kiểm tra diff và thay đổi đồng thời trước mỗi edit. Các form Shipping đang có implementation dở dang của delta094v2; chưa được kiểm chứng và chưa đủ điều kiện handoff.

## Thiết kế cụ thể

Một component shared tại src/shared/StepForm.tsx và step-form.css: desktop vòng số/check nối rail; current xanh thương hiệu, completed có check và nhãn đã kiểm tra; mobile rail dọc bên trái cùng vùng nội dung bên phải như Request083. Chỉ một bước hiện, giữ các trường mounted để giữ draft/FormData. Quay lại và Tiếp tục; validate bước đang nhập, focus lỗi hoặc heading; chỉ bước cuối gọi handler nghiệp vụ. Validate lại toàn bộ trước submit. Check chỉ biểu thị dữ liệu bước đã kiểm tra, không biểu thị đã lưu/thu tiền/giao hàng.

Không áp dụng bước giả cho search/filter, date range, lookup UID, chat reply, acknowledgement và hành động xác nhận ngắn. Toàn bộ trang CRM vẫn được rà; chỉ form có nhóm nội dung hoặc trình tự nghiệp vụ rõ mới dùng stepper. Số bước theo form, không bắt mọi form thành bốn bước.

## File và form dự kiến

| File | Form / nhóm bước |
| --- | --- |
| shipping/Shipping.tsx, Consolidation.tsx, ShippingStepForm.tsx, shipping-workbench.css | Tạo kiện: Chọn đơn → Hàng → Thông tin kiện → Kiểm tra. Chốt lô: Chọn kiện → Phân bổ → Cước và dịch vụ → Kiểm tra. Chuyển helper local sang shared. |
| operations/Workbench.tsx | Form thao tác phục vụ Đơn hàng/Mua hàng/Kho: bước theo action báo giá, mua hàng, nhận hàng, đóng gói; giữ action selector và payload từng action. Reset navigation khi đổi action, giữ semantics draft hiện có. |
| operations/Returns.tsx, orders/Changes.tsx | Kiểm hàng trả / đề xuất thay đổi: Đối tượng và số lượng → Thông tin và bằng chứng → Kiểm tra. |
| invoices/Documents.tsx, payments/Finance.tsx, Refunds.tsx, FinancialReview.tsx | Form tạo chứng từ/ghi nhận/hoàn tiền có nhiều nhóm: Đối tượng → Giá trị và bằng chứng → Kiểm tra. Hành động ngắn giữ nguyên. Không đổi giao dịch tài chính. |
| crm/Customers.tsx | Form chăm sóc chi tiết: Phân công và nhãn → Ghi chú và lịch → Kiểm tra, nếu source hiện hành có đủ nhóm để giảm tải thực tế. |
| content/ContentEditor.tsx, Campaigns.tsx, WebsiteBanners.tsx | Nội dung dài: Nội dung → Media/liên kết hoặc tracking → Lịch/trạng thái → Kiểm tra theo từng editor. Giữ upload, preview, dirty-state và draft hiện có. |
| membership/PlanEditor.tsx | Gói: Thông tin → Giá và quyền lợi → Trạng thái và kiểm tra. Tặng gói: Người nhận → Gói và lý do → Kiểm tra. |
| settings/StaffAccess.tsx, Settings.tsx | Quyền: Tài khoản → Phân quyền → Trạng thái và kiểm tra. Chính sách: Điều khoản → Tỷ giá → Hiệu lực → Kiểm tra. Không thay authorization. |
| shipping/ShippingRates.tsx | Editor biểu cước dài: Phạm vi → Mức cước → Kiểm tra nếu adapter giữ nguyên semantics source hiện hành. Không thay public estimate flow. |
| tests/browser và docs/reviews/CRM-STEPPER-098 | Scoped navigation/validation regression và evidence từng nhóm form. Không dùng kết quả cũ để chứng nhận implementation mới. |

Không sửa RequestForm mẫu, shared PageTabs, shell/loading, backend, API/schema, auth hoặc CSS global. Những file vừa được phiên khác thay đổi cần đối chiếu lại trước triển khai; nếu source cần đổi hợp đồng nghiệp vụ, dừng ở delta plan.

## Tác động và bảo toàn

Risk MEDIUM frontend; riêng financial/permissions presentation cần kiểm tra guard chặt. Rủi ro: validation hidden fields, submitter/formNoValidate, controlled inputs, reset/key lifecycle, async uploads, retry unknown outcome, shared busy locks, unmount draft. Adapter phải giữ input names, original submitter, remove/cancel bypass hiện có, fieldset disabled, role/version checks, idempotency, error/readback và acknowledged reset. Không tự gọi submit khi điều hướng.

Không deployment, restart server, ghi dữ liệu production hoặc dependency change. Reuse 5207. Rollback chỉ diff thuộc 098 và delta shipping, giữ WIP khác.

## Kiểm chứng và hoàn tất

Scoped TypeScript/ESLint, domain unit suites tương ứng, browser synthetic trên 5207: progression/error/back/draft/reset, final submit một lần, busy/reconcile/retry, upload pending, quyền, desktop/mobile320/390, keyboard/focus/zoom200. Không seed hoặc mutate backend nếu fixtures có thể intercept command. Product content inventory, tám principles, current in-context screenshot cho từng nhóm. Profiles TS/frontend/web/visual/product/concurrency. Fresh final-implementation-review → fix → verify → fresh review và task completion report; trạng thái production NOT_APPLICABLE, các phần chưa test ghi NOT_TESTED. Memory candidates None; token/cost unavailable.

## Approval cần thiết

Approval Shipping094 trước đó không bao phủ các module CRM bổ sung. Theo plan-existing-system-change.md step15 và implementation-approval-gate.yaml additional_modules/material_plan_deviation, chờ người dùng duyệt 098v1 trước protected edits ngoài shipping. Không tự coi việc mở rộng yêu cầu là đã review plan này.

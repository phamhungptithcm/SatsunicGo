# SATSUNICGO-SHIPPING-094 — Thiết kế lại Kiện & vận chuyển

Version: 1. Status: AWAITING_HUMAN_APPROVAL. Phạm vi: frontend local.

## Mục tiêu và bằng chứng

Người dùng kho/vận hành cần tạo kiện, gom lô, phân bổ cước và bàn giao đúng đối tượng, ít cuộn và dễ kiểm tra trước khi gửi.

Repository Intelligence Gate: READY; CodeGraph và CocoIndex health/current đã xác nhận trong phiên này. CodeGraph xác định Workspace → Shipping → Consolidation/DeliveryEstimate; CocoIndex trả về kế hoạch CRM028 cũ và ca hợp đồng consolidationCommand. Kế hoạch cũ là lịch sử, không phải phê duyệt cho 094. Đã đối chiếu source Shipping.tsx, Consolidation.tsx, queue-state và các test contextual. HEAD khảo sát: 269aca833a748ac08b4152aa7de5a23d6cc4900a; worktree có WIP khác, phải giữ nguyên.

Quan sát: hai danh sách và form tạo mới xen kẽ; phân trang kiện nằm sau khu vực lô; hướng dẫn dài ở đầu; form dài một cột; empty state dùng biểu tượng check dễ bị hiểu như thành công. Dữ liệu mỗi trang tối đa 30, không phải tổng hệ thống. Chọn đơn tối đa 10; gom tối đa 20 kiện/10 đơn. Có khóa dùng chung, version checks, retry thao tác chưa rõ kết quả và cơ chế giữ bản nháp.

## Phương án giao diện

```text
Kiện & vận chuyển
Đóng kiện, gom lô và theo dõi bàn giao.

[ Kiện hàng ]  [ Lô gom & cước ]

Kiện hàng                         [Tải lại] [＋ Tạo kiện]
Danh sách / trạng thái tải, lỗi, trống
Mã kiện | Trạng thái | Kho → Tuyến | Khối lượng | Thao tác
Phân trang của danh sách này

Khu vực tạo kiện mở ngay dưới thanh công cụ:
1. Chọn đơn       Mã đơn + Thêm đơn; hàng đủ điều kiện; đã chọn
2. Hàng trong kiện  Sản phẩm / biến thể / số lượng
3. Thông tin kiện  Kho + Tuyến; Khối lượng; Dài / Rộng / Cao
4. Kiểm tra        Bằng chứng + xác nhận checklist
                              [Tạo kiện nội bộ]
```

Tab lô gom có thanh công cụ, danh sách và phân trang riêng. Form lô gồm: Chọn kiện → Phân bổ khối lượng → Cước & dịch vụ → Kiểm tra và chốt. Tổng khối lượng đã chọn và quy tắc phân bổ ở ngay khu vực nhập. Cảnh báo “Chốt lô chỉ phân bổ cước, chưa ghi nhận thu tiền” đặt cạnh nút chốt. Kiện phải cùng kho/tuyến, gồm toàn bộ kiện của các đơn tham gia; giữ kiểm tra hiện có.

Hai khu vực giữ mounted khi chuyển tab, dùng hidden và semantics tab chuẩn, tránh mất form, retry hoặc thay khóa dữ liệu. Không đếm dữ liệu chưa tải thành 0; nếu hiển thị số lượng, ghi rõ “trong trang”. Không thêm KPI/tổng toàn hệ thống hoặc bộ lọc giả.

Visual: nền xám nhạt, surface trắng, navy, xanh thương hiệu; khoảng cách theo nhịp 4/8px; tiêu đề 24–28px, nội dung 14–16px; border nhẹ, ít shadow. Lấy functional density từ reference IBM, giữ component/token hiện tại. Desktop form có nhóm trường 2–3 cột; mobile một cột, kích thước kiện vẫn chia hợp lý nếu đủ chỗ. Dữ liệu dài wrap; focus rõ, nhãn luôn hiện, không dựa vào màu; tránh animation không cần thiết.

## Kế hoạch theo file

1. `src/features/shipping/Shipping.tsx`: state chuyển khu vực; markup toolbar/tab; đưa danh sách, phân trang và trạng thái kiện về cùng khu vực; nhóm form pack; giữ handlers addOrder/submit/execute/refresh/reconcileRecords, names và payload hiện có.
2. `src/features/shipping/Consolidation.tsx`: toolbar lô, vùng tạo lô, nhóm form selection/weights/freight/handoff; danh sách và phân trang liền nhau. Giữ selectParcel/submit/execute/consolidationSelection và ShippingLock.
3. `src/features/shipping/shipping-workbench.css` (mới): toàn bộ style scope vào trang shipping; không sửa CSS dùng chung, App.tsx hoặc ShippingRates.
4. Test browser scoped nếu cần: chuyển khu vực giữ draft, mở form, phân trang đúng danh sách, lỗi/empty/loading, bàn phím, responsive. Tận dụng fixture có sẵn, không sửa seed/shared runtime.
5. Evidence dưới `docs/reviews/SHIPPING-094/`: string inventory, product-content review, quality-gate kết quả, review cycles và completion report. Screenshot tạm ngoài source.

## Tác động, rủi ro và giới hạn

Risk: MEDIUM — UI điều khiển dữ liệu vận hành và cước. Thay đổi hierarchy và disclosure; API/schema/backend/quyền/cước/transaction giữ nguyên. Rủi ro chính: mất draft khi chuyển khu vực, refs đọc hidden subtree, focus vào kết quả tab khác, disabled guard bị mất khi nhóm lại fieldset. Phải kiểm tra và điều chỉnh presentation trong scope; nếu cần thay command contract/quyền/backend, dừng xin delta approval.

Không thêm dependencies, không deploy, không restart server/emulator. Reuse http://127.0.0.1:5207 (listener đã xác nhận). Rollback bằng diff của các file scoped; không hoàn tác WIP khác. Không claim production hoặc live-provider từ kiểm tra local.

## Kiểm chứng sau approval

- TypeScript noEmit; ESLint scoped; test shipping-contextual, shipping-queue028, shipping, consolidation.
- Browser desktop/mobile 390px và 320px; keyboard, focus, zoom 200%, mã dài, form có dữ liệu/trống, tải/lỗi/không quyền, giữ draft khi chuyển khu vực, kết quả chưa rõ và retry.
- Xác nhận role-based actions, khóa khi pending, version/reconcile guards, không tạo mutation do mở form/chuyển tab.
- Product Language Gate: inventory từng string/state, source meaning, Purpose/Agency/Responsibility/Familiarity/Flexibility/Simplicity/Craft/Delight và web-platform fit; bằng chứng in-context sau triển khai.
- Profiles: typescript-javascript, frontend-html-css, web-app, visual-design, product-content; áp dụng concurrency cho guard hiện có.
- Mandatory final-implementation-review: review → fix approved findings → verify → fresh review. Handoff chỉ sau review mới nhất pass; thiếu browser/fixture ghi BLOCKED/NOT_TESTED.

## Quyết định cần phê duyệt

Phê duyệt 094 v1 cho các file và frontend scope trên. Chưa sửa application code. Không có deployment authorization. Memory candidates: None. Validation triển khai: NOT_RUN; chi phí/token chính xác: unavailable.

## Delta v2 — functional stepper matching Request083

2026-10-06: direct human correction requests the previously implemented real stepper, replacing static numbered sections, applied throughout. Current bounded assumption while scope clarification is pending: both multi-stage creation forms on this shipping page (parcel and batch); no authorization inferred to change unrelated CRM pages.

Verified reference: RequestForm.tsx requestStepper and request-form.css. Circles with connected rail; blue current, green/check validated prior stages, gray future; one stage visible; back/continue; desktop horizontal, narrow screens integrated vertical left rail. Completed means validated input, never persisted shipping/payment success.

Exact implementation delta:
- Add src/features/shipping/ShippingStepForm.tsx: reusable local form wrapper, mounted hidden stages, disabled-state propagation, backward editing, step-local native/domain validation, final all-stage validation, focus heading/invalid field, reset only on existing acknowledged form reset. Enter advances before last stage; final stage alone calls the unchanged command submit handler.
- Shipping.tsx: wrap pack form in four steps (Chọn đơn/Hàng trong kiện/Thông tin kiện/Kiểm tra); selected eligible orders and at least one positive item quantity required before progression. Existing input names, FormData payload, role guards, readback, shared locks and retries unchanged. Final stage includes actual input summary, checklist/evidence and existing submit.
- Consolidation.tsx: wrap seal form in four steps (Chọn kiện/Phân bổ/Cước & dịch vụ/Kiểm tra); selected eligible parcels/complete order references required, weights must equal parcel total; native fields validated; final stage summarizes selection/freight/service and keeps existing consequence/submit.
- shipping-workbench.css: reference-equivalent connected step rail and integrated narrow-screen content; no shared CSS or RequestForm edits.
- tests/browser/shipping094.spec.ts and docs/reviews/SHIPPING-094/: revise browser evidence for real staged navigation, validation/back/draft/locks/retry, mobile/zoom/current-completed states and language review.

Short dispatch/tracking forms remain single-stage; adding artificial steps would increase effort without improving the task. No new dependency, backend/API/permission/persistence or shared server changes. User's direct correction authorizes this targeted presentation/navigation delta; application edits begin only after this concrete plan and tracked correction evidence. Original approval remains applicable to business/safety constraints. Larger scope requires a concrete additional impact plan, not a mass replacement.

Risk MEDIUM: hidden required controls/native validation, accidental early submit, draft loss, stale completion. Controls: noValidate with scoped explicit validation, all fields remain mounted/enabled under existing fieldset disabled state; final revalidates all prior steps; forward steps inaccessible until validated; named handlers token comparison; UI test intercepted commands. Repository intelligence DEGRADED; current reference/target source and tests verified, optional index refresh already failed earlier.

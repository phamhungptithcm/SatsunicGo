# Product Content Review — OPERATIONS-095

## Scope and context
Web CRM, Vietnamese, staff handling quotes, purchases, receiving/packing, returns and accepted order changes. Current source and local Chromium synthetic callable projection are evidence; screenshots under /private/tmp/operations095-*.png. No Apple-only components; platform conventions are native web inputs, buttons, select, details, heading hierarchy, focus and responsive grids. Reviewer: primary agent, 2026-10-06 America/Chicago. Apple platform-specific HIG not applicable; bundled human-interface principles applied.

Verified: three Workbench routes share handlers; catalog cannot reprice; purchase prerequisites differ from custom deposits; Returns close does not refund/unhold; ChangeQueue lists accepted proposals. Backend authority, amounts and version semantics unchanged. Assumption: compact enterprise layout fits recurring staff work; no user research or measured productivity claim. Unknown: actual production workloads and provider behavior.

## Complete changed-string inventory
| Location/state | New or revised content | Meaning/evidence |
|---|---|---|
| Workbench/request description | Xem yêu cầu của khách, kiểm tra hàng hóa và xử lý báo giá. | Existing order/details/quote actions |
| Purchasing description | Kiểm tra điều kiện thanh toán, nhận việc và ghi nhận hàng đã mua. | claimPurchaseBlockReason and recordPurchase |
| Warehouse description | Kiểm tra số lượng nhận, tình trạng hàng và thông tin đóng gói. | receive/pack payloads |
| Workbench count | {orders.length} đơn trong trang | Loaded rows, shown only when nonempty; not system total |
| Workbench empty | Chưa có đơn trong hàng đợi này | Successful empty listWork result |
| Workbench empty explanation | Chỉ hiển thị đơn trong phạm vi bạn được phân công. Bạn có thể tải lại để kiểm tra dữ liệu mới. | listWork authorization and refresh |
| Form legend | Chọn thao tác và kiểm tra thông tin trước khi ghi nhận | Disabled fieldset and chosen action |
| Quote heading | Sản phẩm và chi phí báo giá | verifiedProduct and price fields |
| Quote label | Phiên bản điều khoản | termsVersion payload, previously English Version |
| Quantity group | Số lượng xử lý lần này | receive/purchase quantities preserve incremental semantics |
| Purchase heading | Thông tin mua hàng | supplierOrder/actualSourceMinor |
| Packing heading | Kiểm tra kiện hàng | g, cm, checklist preserved |
| Receiving heading | Kiểm tra hàng và lưu kho | condition/shelf |
| Returns empty | Chưa có hàng trả trong trang này | Loaded cursor page, no claim of global zero |
| Returns explanation | Hồ sơ hàng trả xuất hiện tại đây khi đề xuất trả hàng đã được khách duyệt. | Authorized return workflow |
| Returns count | {rows.length} hồ sơ trong trang | Current loaded cursor page |
| Close warning | Hoàn tất kiểm tra không tự hoàn tiền hoặc gỡ tạm giữ đơn. Tài chính cần đối soát riêng. | Existing return workflow, placed next to submit |
| ChangeQueue description | Kiểm tra đề xuất khách đã duyệt trước khi áp dụng vào đơn. | accepted-state query |
| ChangeQueue empty | Chưa có thay đổi đã duyệt cần xử lý | ready && zero changes |
| ChangeQueue explanation | Đề xuất xuất hiện tại đây sau khi khách chấp nhận. | accepted query |

All other labels, currencies, required input constraints, statuses, error/retry/uncertain copy and action labels retained. Decorative box icon hidden from assistive technology; empty region role=status, heading and explanatory paragraph.

## States and semantics
Default/action: current rendered forms and card hierarchy. Loading/pending/disabled: original loaders/fieldset guards retained; unit regression verifies disabled controls. Empty/true zero: local synthetic empty response verified on all five routes. Error/recovery: synthetic unavailable shows alert, no empty-success state; refresh recovers. Success: existing post-command refresh unchanged, no manufactured success string. Offline/uncertain: existing retry semantics unchanged, reviewed with contextual tests; live network timeout execution NOT_RUN. Unauthorized: original server authority and role filtering unchanged, unit coverage retained; no permissions weakened. Confirmation: close warning adjacent to button, original native input requirements retained. Money remains net collected/finalPayable/actualCosts according to original source; no revenue/KPI invention. No new financial writes, telemetry, storage or private data exposure.

## Human Interface principles
| Principle | Status | Current evidence |
|---|---|---|
| Purpose | PASSED | Route-specific task descriptions and operation form after order context |
| Agency | PASSED | Existing action choices, native disclosure, refresh and back controls retained |
| Responsibility | PASSED | Return-close consequence at submit; payment prerequisites and role tests retained |
| Familiarity | PASSED | Existing CRM tokens/icons and native web controls; Vietnamese domain terms |
| Flexibility | PASSED | Chromium 1440/390/320 projection, no horizontal overflow; native labels and focus rules |
| Simplicity | PASSED | Two-column form desktop, one column mobile; no extra KPI or fake urgency |
| Craft | PASSED | Actual desktop/mobile screenshots inspected, consistent spacing and scoped CSS |
| Delight | PASSED | Calm empty guidance and orderly workspace; no animation added or forced interactions |

## Limits
Local synthetic presentation evidence only. No production/provider/financial transaction certification. Reduced motion adds no new animation; existing animation contract preserved. 720px effective-viewport reflow covers the layout space of 200% zoom on a 1440px screen; actual browser zoom controls, live-provider permissions and all uncertainty variants require additional evidence before release certification. Unchanged sibling customer forms may import the scoped CSS, which only matches operations095 containers.

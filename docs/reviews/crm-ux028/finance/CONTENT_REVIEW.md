# Finance028 product language and state review

Vietnamese CRM, explicit root exclusive Finance.tsx/FinancialReview.tsx lease and approved concrete plan. No server/helper/authority/MFA/financial contract change or real money/provider transactions. Header and actual-money warnings retained.

Changed controls: Nhóm đối soát group has Chuyển khoản / Hóa đơn thành viên / Ngoại lệ pressed buttons. Each queue keeps own mounted pending form and own Trang chuyển khoản tiếp theo / Trang hóa đơn tiếp theo / Trang ngoại lệ tiếp theo. Current read cursors retained on refresh. Unknown states Cần kiểm tra trạng thái rather than implied pending/completed. Actual exception reason shown with existing fallback. Membership invoice amount is read-only authoritative actual row amount.

Selected native disclosures: Xác nhận tiền vào và kích hoạt gói, Đối chiếu giao dịch ngân hàng, existing Đối soát ngoại lệ / Ghi nhận tiền vào bị ngân hàng đảo; grouped one open action at a time. Closing exception has no order field; verified allocation and reversal require Mã đơn. All original evidence/bank/entry/amount/reason and inbound eligibility controls preserved. Contextual submits Đóng ngoại lệ đã kiểm tra / Phân bổ tiền đã xác minh / Ghi nhận ngân hàng đảo tiền, Đang xác nhận… or existing actual-money confirmation. Closing records a check only; allocation does not release order; reversal retains financial hold/history server semantics.

Recovery: reads before issuing command can fail without claiming sent mutation; unknown issued result freezes original action/payload/operation/version/bank/evidence and exposes Thử lại thao tác đang chờ. Hóa đơn đang chờ shows complete actual invoice ID. Parent scope/refresh/pagination disabled while any child busy/unresolved; sections stay mounted so changing scope cannot discard pending state. Immediate sending guards prevent double submit. Confirmed actions distinguished from refresh errors; refresh/read outage clears private queues and stale pagination.

| Principle | Status | Evidence |
|---|---|---|
| Purpose | PASSED | Separate queue scopes and conditional decision fields |
| Agency | PASSED | Explicit actual-money actions and context retained |
| Responsibility | NOT_RUN | Frozen retry/context source reviewed, native lost-response/stale/permission acceptance pending |
| Familiarity | PASSED | Existing CRM native details/fieldset/buttons |
| Flexibility | NOT_RUN | Group visibility/keyboard/AT pending |
| Simplicity | PASSED | One browse scope and explicit action form |
| Craft | NOT_RUN | Current widths/focus/zoom pending |
| Delight | NOT_RUN | Actual feedback timing/reduced-motion pending |

6 new finance authority/projection regressions plus29prior focused tests =35 PASS; targeted eslint PASS. Cases close excludes order/money, allocation requires verified inbound, reversal retains actual original transaction context, closed/unknown decisions denied, uncertain service codes retained, unknown displayed states not false completion. Root compiler and serial native actions/faults required. Source-only checks do not prove banking/provider/production or UI100. Product gate BLOCKED.

Review cycle2: unknown status mapping requires own properties; inherited constructor/prototype names remain Cần kiểm tra trạng thái.35focused tests and scoped lint rerun PASS. Native/compile still pending.

Current endpoint delta: financeRejection requires service context. Explicit precommit CAS aborted releases financeReview/verifyTransfer pending action with existing rejection/reload guidance; membershipCommand retains conservative unknown behavior. Prior auth/replay occurs before CAS.7finance+4customer tests=11PASS; scoped lint PASS. Root4native Finance passes are previous source only, not acceptance of this new delta. Pending state also lost on route unmount, not only full reload. Compiler/native current acceptance remains pending.

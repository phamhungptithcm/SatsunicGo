# Product Content Review — ADMIN096

Scope: PlanEditor, ReminderSettings, StaffAccess, Settings, Activity, staff ShippingRates. Audience: owner and permitted operations staff. Primary tasks: plans/gifting, staff authority, audit/outbox, tariffs, pricing policy. Platform: Vietnamese web; native labelled controls, disclosure sections and aria-pressed button groups. Apple-platform component contract NOT_APPLICABLE; bundled human-interface reference used as quality framework.

## Verified context
Workspace route/role mapping verified. Existing callables, integer bounds, currency units, owner checks, expectedVersion and operation IDs retained. Static mock is a proposal only. Browser evidence is shared demo5207; no real provider, production or financial mutation proof. No persisted settings or staff roles changed during verification.

## Changed string inventory
| Surface/state | Proposed visible/accessibility content | Meaning |
|---|---|---|
| Plans heading | Gói thành viên; Quản lý giá, kỳ hạn, quyền lợi và cấp tặng. | Scope includes listing/edit/gift |
| Plans action | Tạo gói; Tải lại | Open local editor / existing list read |
| Plans task group | Tác vụ gói thành viên; Danh sách gói; Cấp tặng; Nhắc gia hạn | Selected task buttons, no new route |
| Plans editor | Đóng chỉnh sửa | Close disclosure; does not promise discard or undo |
| Gift action | Cấp tặng gói thành viên | Existing grant command |
| Gift guidance | Kiểm tra đúng tài khoản và gói đã duyệt trước khi cấp tặng. Thao tác được ghi vào lịch sử gói thành viên. | Existing target/plan/record semantics |
| Gift success | Đã cấp tặng và ghi lịch sử gói thành viên. | Only after callable success |
| Reminders heading/action | Nhắc gói sắp hết hạn; Bật nhắc trước khi gói hết hạn | Existing policy behavior; no charge or guaranteed email |
| Staff stage/title | Bước 1 · Kiểm tra tài khoản; Phân quyền nhân viên; Bước 2 · Cập nhật quyền | Second stage conditional on verified read |
| Staff field/hint | Mã tài khoản nhân viên; Dùng mã định danh của tài khoản đã xác minh. | UID, no invented email lookup |
| Staff pending | Đang kiểm tra… | Read request pending; save uses existing Đang lưu… |
| Staff guide/accessible label | Trước khi lưu quyền; Điều kiện cập nhật quyền | Side guidance |
| Staff guide | Chỉ chủ doanh nghiệp được cấp quyền. Mỗi lần lưu cần xác thực gần đây và hai lớp. | Existing boundary |
| Staff guide | Kiểm tra đúng mã tài khoản trước khi chọn vai trò và phạm vi đơn hàng. | Correct target |
| Staff guide | Sau khi lưu, kiểm tra lại quyền trước khi chỉnh sửa tiếp. | Existing ready=false after success |
| Settings heading | Tỷ giá & điều khoản | Policy scope |
| Settings guide/accessible label | Áp dụng cho báo giá mới; Phạm vi áp dụng chính sách | Existing accepted-quote snapshot preserved |
| Settings guide | Báo giá đã chấp nhận giữ nguyên tỷ giá và điều khoản tại thời điểm chấp nhận. | Existing snapshot rule |
| Settings guide | Thời gian bắt đầu và hết hạn hiển thị theo giờ trên thiết bị. | datetime-local / localTime |
| Activity reference | Mã đối tượng; Chưa xác định | Full ID, null remains unavailable |
| Shipping stage | Chỉnh sửa → Lưu bản nháp → Công bố | Existing save/publication distinction |

All other field labels, error/retry messages, confirmations, enum/currency units and data formatting remain existing strings. CSS affects selected/disabled/focus wrapping, not meaning.

## State coverage and verification
Default: populated plans, create editor, gifting, staff lookup, populated audit and notification selection observed. Loading: account/permission restoration and shipping fetch observed. Error: settings read failure with disabled save and retry observed; shipping no-result connection error observed. Empty: source retained, not observed this run. Success: existing handlers retained, new gift success NOT_RUN in browser. Offline/stale/partial: existing source locks/fences reviewed; not simulated. Forbidden: authority boundary preserved; owner-only read failure not diagnosed as confirmed denial. Confirmation/destructive: existing publish/delete confirmation preserved; NOT_RUN in browser. No source changes to save/retry authorization.
Mobile: 390px document scrollWidth = innerWidth on membership, staff, settings, activity, shipping loading; membership desktop1280 passed. Input 12345 persisted when switching gift and back. Opening editor focused SUMMARY. Closing editor with Enter worked. Full screen-reader, 200% zoom, invalid-staff-input verification, full successful owner forms and final side-guide render are NOT_RUN or incomplete.

## Data semantics
VND price/cap, days, integer bps (100 bps=1%), numerator/denominator per smallest source currency unit retained. No fake zero/totals/identity. vi-VN timestamp rendering remains; local device time disclosed for policy validity. Full IDs wrap. No new data fetch, logging or provider exposure.

## Human Interface principles
| Principle | Status | Evidence |
|---|---|---|
| Purpose | PASSED | Task-specific heading/group and owner source |
| Agency | PASSED | Explicit create/close/task controls; preserved input observed |
| Responsibility | PASSED | Permission, units, publication and uncertain-result source retained |
| Familiarity | PASSED | Web native labels, inputs, disclosures, aria-pressed buttons |
| Flexibility | NOT_RUN | Narrow layout/focus observed; 200% zoom and assistive tech incomplete |
| Simplicity | PASSED | Bounded form, one membership task, list hidden during editing |
| Craft | NOT_RUN | Owner success/error/uncertain state matrix not fully executed |
| Delight | PASSED | Predictable focus and preserved drafts; no added animation |

Platform fit, tone, brevity, terminology and data semantics: PASSED by source and observed demo surfaces. Accessibility/in-context full coverage: NOT_RUN for the gaps above. Product Language Gate: BLOCKED; no complete product-content certification claimed. Required remaining work: current final renders, keyboard/zoom/assistive evidence and safe isolated owner success/failure/uncertainty tests on shared5207 without global reset.

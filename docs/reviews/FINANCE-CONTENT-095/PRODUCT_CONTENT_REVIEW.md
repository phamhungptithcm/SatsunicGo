# Product Content Review — UX095

Scope: Documents staff workspace, Refunds, Finance, Campaigns and WebsiteBanners; compatible ContentEditor092 preserved under its owner. Audience: Vietnamese finance operators/content editors; web CRM, desktop and mobile browsers. Reviewer: current coding agent, client date2026-10-06. Target platform is web; repository human-centered HIG principles are a quality reference, no Apple-only UI conventions/assets copied.

Verified behavior: invoice draft differs from issued immutable snapshot; refund request reserves a possible refund and does not transfer money; financial confirmation requires actual banking proof; membership payment is separately allocated; caption approval does not post to social media; banner mode changes persist immediately, separate from banner publication. Inputs use existing server validation/operation identity/version checks. Unknown states never produce invented success or totals.

## Changed/moved content inventory
| Location/state | Current095 content | User job and source agreement | Evidence |
| --- | --- | --- | --- |
| Shared composer action | Đóng biểu mẫu | Hide inline composer, retain mounted form; locked pending operation cannot close | Composer source; pre-final invoice/refund browser |
| Invoice header primary | Tạo bản nháp | Opens form; does not issue invoice | Documents source/browser |
| Invoice composer heading | Tạo bản nháp từ đơn hàng | Identify creation task | Documents source/browser |
| Invoice helper | Dùng mã đơn đã chốt tổng cuối. Bản nháp chưa được xuất cho khách. | Use approved final-total order; draft differs from issuing | Documents createDraft + domain invoice rules |
| Invoice relocated settings | Thông tin người bán; Tên doanh nghiệp/người bán; Địa chỉ; Thông tin liên hệ; Lưu thông tin người bán | Existing seller form/validation retained; separate from list | Documents configure source |
| Invoice relocated creation | Mã đơn đã chốt tổng cuối; Tạo bản nháp từ đơn | Existing order identifier and command retained | Documents source/browser |
| Refund heading | Hoàn tiền | Destination noun simplifies previous long title | Refunds source/browser |
| Refund helper | Tạo yêu cầu và đối chiếu giao dịch hoàn tiền theo đơn. | Names the two existing steps | Refunds source/browser |
| Refund primary/submission | Tạo yêu cầu hoàn tiền | Creates request only; warning adjacent specifies no bank transfer | Refunds source/browser |
| Refund composer | Yêu cầu hoàn tiền mới | Inline task heading | Refunds source/browser |
| Refund amount | Số tiền cần hoàn (₫) | Positive integerVND request, authoritative confirmation uses reserved row amount | Refunds source + refunds-contextual units |
| Refund list | Yêu cầu hoàn tiền; Danh sách theo trang | Loaded page only; no invented global total | Refunds listWork source/browser |
| Finance helper | Kiểm tra tiền vào, kích hoạt gói và xử lý giao dịch chưa khớp. | Names three verified workflows | Finance/FinancialReview source; rendered NOT_RUN |
| Finance relocated action | Tải lại | Reload existing three queues; uncertainty lock retained | Finance source |
| Finance queue labels | Chuyển khoản; Hóa đơn thành viên; Ngoại lệ | Existing labels/handlers with aria-pressed; selected group only visible | Source; full rendered NOT_RUN |
| Campaign heading | Chiến dịch | Page destination | Campaigns source; rendered NOT_RUN |
| Campaign helper | Soạn nội dung cho các kênh và quản lý banner website. | Two independent retained content groups | Campaigns source |
| Campaign primary | Tạo bản nháp | Opens editorial form, no publication | Campaigns source |
| Campaign group names | Nhóm nội dung chiến dịch; Nội dung các kênh; Banner website | Accessible tablist names and visible tabs, hidden sections retain mounted state | Campaigns source |
| Campaign caution | Lịch là kế hoạch nội dung. Duyệt caption không đăng lên mạng xã hội; bạn tự đăng sau khi kiểm tra. | Actual workspaceCommand stores caption/schedule only | Campaigns source |
| Campaign switch confirmation | Bỏ thay đổi chưa lưu để mở chiến dịch khác? | Dirty-editor switch discards only after explicit confirmation; same new draft preserved | Campaigns source |
| Campaign composer | Chỉnh sửa chiến dịch; Bản nháp chiến dịch mới | Task state, dependent on selected row | Campaigns source |
| Campaign tracking helper | Các mã UTM giúp phân biệt nguồn và chiến dịch trong link được sao chép. | Existing source/medium/campaign query parameters, not provider metrics | campaign-contextual units |
| Campaign schedule group | Lịch và trạng thái biên tập | Existing datetime-local scheduling/approval state controls | Campaigns source |
| Banner helper | Quản lý vị trí, bản nháp và thời gian hiển thị. | Existing placements/versioned drafts/published dates | WebsiteBanners source |
| Banner placement consequence | Thay đổi cách hiển thị được lưu ngay. Xuất bản banner là thao tác riêng. | Existing mode onChange immediately calls versioned command; publish is separate | WebsiteBanners source |
| Existing notices/states moved | Invoice internal-tax warning; refund banking warning; finance membership allocation warning; invoice/refund loading/error/empty; campaign pending retry | Preserve consequence, scope, uncertainty; no false empty during invoice list loading | Source + focused units; partial rendered evidence |

Unchanged fields/validation/status labels retained, including existing template errors, banking evidence, explicit request retry, campaign UTM keys and banner privacy/media-rights confirmations. Displayed currency remains vi-VN with₫; scheduled input remains local time. No metrics added.

## State coverage
Default invoice/refund empty and composer: observed pre-final LOCAL_SYNTHETIC. Keyboard open→first-field, Escape→hide→trigger focus, retained reopening: observed. Invoice mobile-like capture was487CSSpx due80% browser zoom; refund compositor measured390CSSpx and no horizontal overflow. No final screenshot matrix.
Loading/error invoice: observed real frontend showing failed read before shared5207 stopped; not provider proof. Source suppresses false empty while loading/error. Pending/disabled/uncertain behavior: source and existing contract units reviewed; full browser confirmation NOT_RUN. Campaign/banner empty/populated/error/denied states: NOT_RUN. Success: domain units/source only, not rendered; never announce bank/provider success. Offline/stale/partial: existing notices retained; full UI matrix NOT_RUN. Unauthorized: guards preserved; browser NOT_RUN. Destructive/confirmation: existing invoice void/refund cancel, banner publish/hide and draft-switch consequence source reviewed; browser NOT_RUN.

## Eight principles (aggregate gate)
| Principle | Status | Evidence/limit |
| --- | --- | --- |
| Purpose | NOT_RUN in full | Source task hierarchy and invoice/refund observations support decisions; campaigns/banner current context missing |
| Agency | NOT_RUN in full | Explicit commands, retained composers, dirty editor switch; full pending/campaign interaction evidence missing |
| Responsibility | NOT_RUN in full | No fabricated metrics, transfer/post promises; mode consequence explicit; consequential UI matrix incomplete |
| Familiarity | NOT_RUN in full | Web headings/buttons/inputs/section grouping and vi-VN formatting; remaining rendered surfaces missing |
| Flexibility | NOT_RUN in full | Scoped breakpoints + observed390refund;768/1440 matrix incomplete |
| Simplicity | NOT_RUN in full | One finance empty and focused forms from source; remaining in-context matrix missing |
| Craft | NOT_RUN in full | Type/lint/unit checks and partial focus evidence; screen-reader/complete visual states missing |
| Delight | NOT_RUN in full | Reduced interruption/retained inputs, restrained motion; full real-flow observation unavailable |

Platform fit: source follows normal browser controls and existing Satsunic components; partial rendered fit observed. Complete accessible-label/focus checks across all095 flows NOT_RUN. No claim of WCAG compliance or Apple platform parity.

Gate results: meaning/data/privacy/source agreement PASSED at source-review scope; natural Vietnamese text reviewed; eight-principle full in-context review NOT_RUN. Product Language Gate BLOCKED. Required next evidence is fresh final-candidate shared5207 UI matrix after runtime restoration. Screenshot invoice-mobile.png is pre-final limited evidence; source manifest is current. Do not certify current release from it.

Shared tabs follow owning ADMIN096-TABS approval; selected state now uses aria-selected, tabs and panels have associated IDs, Arrow/Home/End move focus and Enter/Space activate. New shared keyboard behavior has source evidence only in this task; fresh rendered verification NOT_RUN.

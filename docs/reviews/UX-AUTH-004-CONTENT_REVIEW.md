# Product Content Review — UX-AUTH-004

Scope: fixed navigation, mobile menu, compact footer, unavailable catalog and One Tap errors; Vietnamese responsive web for shoppers. Source: approved v1, current HunpeoLabs header/controller, current SatsunicGo implementation. Native web links/buttons, visible focus, aria-expanded/controls and reduced motion apply. Apple-only conventions not applicable. Reviewer: current agent, 2026-10-04.

Facts: preview services remain disabled; no live catalog or auth acceptance. Assumptions: users prefer compact footer per direct request. Unknown: real commercial data, supported local IP OAuth origin, provider configuration, mobile/rendered acceptance. No invented prices/products or guarantees.

Inventory: removed Beta0.1/banner; removed navbar Google login; retained account-page login recovery; menu accessible names Mở menu/Đóng menu; footer Mua hộ Mỹ·Nhật·Hàn, Hỗ trợ, Quyền riêng tư, Điều khoản & hoàn tiền, Hàng hạn chế, by HunpeoLabs, Phí và chính sách thương mại đang chờ xác nhận; catalog Danh mục/Bài viết đang được cập nhật, Nội dung sẽ xuất hiện tại đây khi được xuất bản, Xem yêu cầu mua hộ; auth Chưa đăng nhập được/Chưa kết nối được Google. Mở tài khoản để thử lại; MFA error retained; added explicit Mở tài khoản recovery link. Navigation labels/routes and signed-in account/sign-out labels preserved.

State coverage: default/active nav and open/closed menu verified in source; Escape focus returns to menu toggle, route closes menu, desktop resize closes. Closed menu uses visibility:hidden to remove keyboard targets. Pending/disabled sign-out preserved. Auth network/error recover through account; duplicate exchange and disposed callback verified by tests; success cancels Google prompt, without invented toast/session success. Empty/unavailable catalog remains neutral and does not claim data exists. Existing normal catalog loading, stale/offline/error states unchanged. No new destructive or consent state. Full rendered keyboard, viewport and assistive-technology checks NOT_TESTED.

| Principle      | Evidence                                                            | Gate                         |
| -------------- | ------------------------------------------------------------------- | ---------------------------- |
| Purpose        | Clear navigation and unpublished-content state                      | Rendered NOT_TESTED          |
| Agency         | Explicit toggle/Escape/links, no forced Google consent              | Rendered NOT_TESTED          |
| Responsibility | Missing provider/data not represented as live success               | Source checked; live BLOCKED |
| Familiarity    | Standard hamburger and short Vietnamese wording                     | Rendered NOT_TESTED          |
| Flexibility    | Responsive menu, keyboard controls, reduced-motion override         | Rendered NOT_TESTED          |
| Simplicity     | Compact footer and removed environment labels                       | Rendered NOT_TESTED          |
| Craft          | Satsunic colors/type retained, finite transform/opacity transitions | Rendered NOT_TESTED          |
| Delight        | Small reversible menu motion, no forced repeated prompt             | Rendered NOT_TESTED          |

Data meaning: no monetary/date/unit changes; live source remains published Firestore content when configured. Privileged/private data boundaries unchanged. Product Language Gate BLOCKED until current rendered evidence exists. Isolated string/source review does not constitute acceptance.

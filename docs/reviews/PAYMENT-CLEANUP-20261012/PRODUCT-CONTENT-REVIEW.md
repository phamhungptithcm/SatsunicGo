# Product content review

Scope: Vietnamese web payment status, main255a9669 → cleanup candidate. Audience: buyer checking the existing owned checkout, especially after provider return. Existing blue/white SatsunicGo CSS/native web controls. Apple platform compliance not applicable; bundled human-interface principles applied. Review2026-10-12UTC.

## Context and semantics
Observed source: server-authoritative PurchaseCheckout; read(status→reconcile→status), original checkoutid retained; paid delegates existing completion. No provider payment evidence, price, policy or financial changes. Unknown is not failure or success. receivedAmount=0 differs from undefined. VND locale formatting/quantity/line total unchanged. Sandbox disclosure never implies real collection. Assumption: status-first hierarchy reduces scanning; no user research claim.

Official reference: https://help.shopee.vn/portal/4/article/79472 describes distinct order states; use familiar state labels, do not copy brand/trade dress.

## Complete changed content inventory
|Location/state|Before|After|Meaning/evidence|
|---|---|---|---|
|Header|Thanh toán đơn hàng + long continue instruction|Thanh toán|Current task; stepper unchanged|
|Failed status|Chưa kiểm tra được lượt thanh toán… cùng mã|Chưa cập nhật được thanh toán. Thử kiểm tra lại.|read catch, recovery retains same id|
|Summary pending|Đang chờ thanh toán.|Chờ thanh toán|Unconfirmed pending|
|Summary unknown|Kết quả chưa rõ + cart/balance implementation prose|Chưa xác nhận thanh toán + Không thanh toán lại khi chưa có kết quả.|No paid proof, payment-again caution retained|
|Cancelled|Lượt thanh toán/ trả thêm đã hủy + retained items/balance|Đã hủy thanh toán + Các món vẫn ở trong giỏ./Khoản còn thiếu vẫn được giữ trong đơn.|State and retention unchanged|
|Review|Khoản tiền cần đối chiếu trước khi phân bổ…|Cần đối chiếu thanh toán + [Đã nhận amount when defined] Liên hệ hỗ trợ để đối chiếu. Không thanh toán lại.|No false allocation; zero tested|
|Test disclosure|QR/SePay sandbox/demo implementation paragraph|Thanh toán thử · Không thu tiền thật|Both test providers only, all uncompleted states|
|Gateway|Tiếp tục thanh toán / Tiếp tục kiểm tra thanh toán|Thanh toán / Mở thanh toán thử (demo unknown)|Actual openGateway operation; SePay unknown gateway removed as duplicate read|
|Check|Tiếp tục kiểm tra thanh toán + Kiểm tra lại trạng thái|Kiểm tra thanh toán / Đang kiểm tra…|Single SePay unknown button calls read, disabled in flight|
|Reference|Thanh toán ban đầu · mã UUID|Chi tiết thanh toán → Thanh toán đơn hàng/Thanh toán thêm, Mã thanh toán, UUID, Liên hệ hỗ trợ|Native details, full reference retained; same support route|
|Product|name · quantity món · total|name × quantity, separate total|No quantity/price changes|

Unchanged: back links, gateway route, sign-in, paid receipt/PDF states, loading initial text, cancelled navigation, server auth and owner checks.

## State coverage
Default/pending: rendered component matrix. Loading/disabled: deferred-reconciliation test shows disabled single CTA and settles correctly. Empty/unavailable: failed initial status has alert and same-route retry, no false success. Success: paid completion delegation and cart refresh tested. Error/offline/timeout: rejected SDK fixtures retain owned unknown amount and recovery; physical offline not claimed. Unauthorized: existing PurchaseSignIn branch unchanged, no checkout fetched without user. Account switch: deferred old reconciliation ignored. Confirmation/destructive: no new consequential choice. Stale provider: unknown remains unknown, no payment creation. Cancel/review: no payment CTA.

## Human interface principles
|Principle|Status|Evidence|
|---|---|---|
|Purpose|PASSED|State, amount, products, one unknown CTA|
|Agency|PASSED|Retry, back, native details and support retained|
|Responsibility|PASSED|Test label/no-money and do-not-pay-again caution; no paid assumption|
|Familiarity|PASSED|Plain Vietnamese state/action names; official status-based reference|
|Flexibility|PASSED|Actual390CSSpx narrow render no overflow; keyboardEnter expands/collapses; reference wraps|
|Simplicity|PASSED|Removed intro, repeated check and exposed UUID|
|Craft|PASSED|State matrix/zero amount/deferred guard/account switch, desktop/narrow screenshots|
|Delight|PASSED|Calm concise feedback, no gratuitous animation/urgent copy|

## Pattern and gate results
Writing/labels, feedback, consequential state clarity, contextual help, privacy, accessibility/native web platform fit, natural tone, meaning, state coverage, data semantics and terminology: PASSED within scoped evidence. Localevi and long English product wrap checked; no new localization framework. Web/native details and44px existing buttons retain focus outlines. No Apple-only patterns. In-context candidate component fixture uses exact Journey source and actual Payment/CSS, mocked SDK/auth only, on existing5207. Desktop and390CSSpx observed; keyboardEnter tested for unknown/review details; full UUID no overflow. Screenshots recorded in primary PRODUCTION-COMPLETE-20261011/PAYMENT-CLEAN-{DESKTOP,MOBILE}.png. Actual screen-reader speech and production checkout render: NOT_RUN, not asserted as tested. No animation added.

Decision: PASSED for scoped product language, component/render evidence only. Production release/financial proof readiness separate.

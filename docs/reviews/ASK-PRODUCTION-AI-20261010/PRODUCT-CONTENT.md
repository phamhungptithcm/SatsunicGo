# Product Content Review — Ask customer AI

Scope: `AskPilot.tsx`, customer-facing admission errors in `ask-production.ts`, policy errors in `workspace.ts`. Reviewer: Codex, 2026-10-10. OWNER administration is Vietnamese web UI; Ask keeps existing VI/EN answer schema. Purpose: enable a bounded customer trial after a validated OWNER canary. Browser evidence is synthetic local component evidence, not hosted production proof.

Verified: callable requires verified Google and App Check; configuration requires OWNER and recent MFA; fixed total 50,000 VND, per-user 5,000 VND, reservation 1,000 VND, no refunds for uncertainty, at most 24 hours bounded by code pricing expiry. Ledger is authoritative; remaining amount is reservation capacity, not actual cloud billing. Read failure clears configuration and blocks enable. No secret or customer prompt appears in administrative readback.

## Changed content inventory

| Location/state | Content | Job and source behavior |
|---|---|---|
| Customer heading/access name | AI cho khách hàng; Tải lại AI cho khách hàng | Distinguish customer budget from legacy OWNER trial; fresh readOwnerConfiguration |
| Audience explanation | AI văn bản cho khách hàng đã đăng nhập và xác minh tài khoản Google. Thử bằng tài khoản chủ doanh nghiệp trước khi mở cho khách hàng. | Exact text-only authenticated audience and canary-first policy |
| Budget note | Tổng giới hạn 50.000 ₫, mỗi tài khoản tối đa 5.000 ₫. | Fixed transactional ceilings; reused note explains giữ 1.000 ₫/lượt, lỗi/dừng, no reset and not cloud invoice |
| Provider readback | Đã kiểm tra kết nối AI / Chưa kết nối được AI | countTokens access only, does not claim successful generation |
| Active customer/canary/disabled/expired | Đang mở cho khách hàng đã xác minh. / Đang thử bằng tài khoản chủ doanh nghiệp. / AI cho khách hàng đang tắt. / Đã hết thời gian bật AI cho khách hàng. | Effective audience and expiry from sanitized policy readback |
| Confirmation title | Mở AI cho khách hàng? / Bật thử AI trước khi mở cho khách hàng? | Consequential scope shown before mutation; Escape/cancel do not mutate |
| Confirmation consequence | Bật tối đa 24 giờ trong ngân sách còn lại của giới hạn 50.000 ₫. Không đặt lại số tiền đã giữ. Cần xác thực hai lớp gần đây. | Actual code expiry cap, lifetime ledger and MFA requirement |
| Promotion action | Mở cho khách hàng | Disabled before validated server canary proof |
| Acknowledged update | Đã cập nhật phạm vi AI. Kiểm tra trạng thái bên dưới. | Success requires mutation response and fresh configuration; states exact current audience |
| Missing provider/policy | Em chưa thể hỗ trợ yêu cầu này lúc này. Anh/chị có thể gửi yêu cầu mua hộ. / Chưa thể cập nhật AI cho khách hàng. / Chưa xác minh kết nối AI. | Paid I/O denied; offers established request workflow |
| Exhaustion/rate | Đã đạt giới hạn ngân sách tư vấn. / Đã đạt giới hạn tư vấn. Thử lại sau. | Lifetime exhaustion has no retry promise; transient rate denial permits retry |
| Account denial | Không thể dùng tư vấn với tài khoản này. | Locked account or unauthorized canary denied without private account details |
| Replay | Lượt tư vấn này đã được xử lý. Kiểm tra hội thoại trước khi tiếp tục. | Stable attempt identity prevents blind paid retries |
| Input bound | Nội dung quá dài. Anh/chị vui lòng rút gọn câu hỏi. | Serialized bytes/tokens bounded before paid call |
| Canary promotion failure | Cần thử Ask thành công bằng tài khoản chủ doanh nghiệp trước khi bật cho khách hàng. | Server proof follows source/schema/context validation |

Reused UI state strings retain their previous meaning: Bật/Tắt/Chưa xác minh; Giới hạn/Đã giữ/Còn lại; Đang cập nhật…; Hết hạn; Bật AI/Tắt AI; Hủy xác nhận/Xác nhận bật AI; pending reconciliation, stale-result, MFA unfinished, reload/read failures. Unknown/null never renders as zero or NaN. Offline, malformed and partial readback disable admission. Zero budget remaining disables enable and promotion. Unauthorized configuration does not render data. Success and errors use existing feedback semantics.

## Data and platform contract

VND uses vi-VN formatting. Expiry uses the operator browser local timezone and vi-VN date formatting; actual server timestamp controls admission. No billing estimate is labeled spend. Customer budget is independent of 10,000 VND OWNER trial. Admin readback exposes no UID, prompt, order context or provider credential. No public SEO surface changes. Native web dialog, semantic buttons/heading/region, busy status, focusable dialog title, Escape and returned trigger focus fit existing blue-white SatsunicGo web styling. Apple HIG is not a target-platform contract; human-centered principles are applied through the repository reference, without Apple-specific expression.

| State | Evidence/result |
|---|---|
| Default/disabled/zero/unknown | Rendered component; unknown ledger blocks action; source explicit zero handling |
| Loading/pending | Source busy flags; retry retains operationId for reconciliation |
| Success | Synthetic canary, promotion and disable commands use versions 1/2/3 and exact payload |
| Error/offline/stale/malformed | Synthetic read modes block enable and avoid NaN; mutation error paths inspected |
| Unauthorized | Workspace tests OWNER/MFA/verified Google denial; UI clear-on-error |
| Confirmation/recovery | Escape produced no command; native modal and cancel retained |

| Human Interface principle | Status | In-context evidence |
|---|---|---|
| Purpose | PASSED | Customer scope, limits and next action shown in one card |
| Agency | PASSED | Explicit confirmation; Escape cancels without mutation; separate disable |
| Responsibility | PASSED | Reservations, uncertainty and billing distinction adjacent to values |
| Familiarity | PASSED | Existing CRM headings/buttons and vi-VN currency |
| Flexibility | PASSED | Reload, cancel, retry unknown operation and disable |
| Simplicity | PASSED | Fixed ceilings; canary-first action; no provider settings exposed |
| Craft | PASSED | 320/390/720/1440 no horizontal overflow; semantic labels, wrapped copy |
| Delight | PASSED | Quiet inline states and predictable cancellation; no distracting motion |

Gate dimensions: platform fit, meaning, audience, tone, brevity, states, semantics/privacy, keyboard accessibility, terminology and responsive in-context evidence PASSED within the executed synthetic component check. Admin is existing VI-only surface; VI text expansion tested at 320 pixels. No new English admin locale or RTL layout is introduced. Screen-reader audio, browser zoom and actual hosted customer acceptance NOT_RUN. Browser evidence: `output/playwright/ask-ai-20261010/budget-{320,390,720,1440}.png`, `unknown-state.png`; fixture `/private/tmp/ask-ai-browser.js`.

Decision: Product Language Gate PASSED for this local component scope. Fixed findings: connection-only readiness wording and budget-exhaustion retry promise. Production proof remains a separate acceptance gate.

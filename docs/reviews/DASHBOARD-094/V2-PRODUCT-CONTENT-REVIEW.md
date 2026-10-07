# Product Content Review — DASHBOARD-094 visual v2

## Scope

- Surface: authenticated web operational overview for OWNER/OPERATIONS_MANAGER; Vietnamese.
- Files: Dashboard.tsx, dashboard094-model.ts, dashboard094.css.
- Job: understand bounded queue workload and choose the next operational queue.
- Target: web native buttons, links, form labels, disclosure, status/alert; preserve Satsunic identity.
- Apple HIG: Apple-platform conformity NOT_APPLICABLE; repository Human Interface principle reference applied without Apple-only expression.
- Reviewer: Codex, 2026-10-06 America/Chicago. Implementation approval: human user, DASHBOARD-094.

## Context and evidence

Verified: callable returns current states of records created in selected UTC interval, <=31 days, up to 100 records per source. Queues can overlap. Existing links retain original destinations. No money totals or time series exists. All counts come from callService; test transport alone is synthetic. Authorization remains server-enforced. Bounded source/CodeGraph evidence; CocoIndex freshness DEGRADED. No claim of conversion, total unique orders, global completeness or revenue.

Assumption: operators benefit from a compact read-first dashboard. User explicitly requested more intuitive numbers/charts; no independent user research claimed.

## Content inventory

The complete surface inventory is grouped by rendering location; labels/notes are literal source values. Dynamic dates/counts are locale/formatted patterns, not additional business metrics.

| Location/state | Content | User job and behavior evidence |
| --- | --- | --- |
| Header | Tổng quan vận hành; Nắm tình hình đơn hàng. Chọn việc cần xử lý tiếp theo. | Read workload and act; source Dashboard |
| Shortcuts | Lịch chăm sóc; Khách hàng | Existing route links |
| Presets | Khoảng thời gian; Hôm nay; 7 ngày; 30 ngày; Tùy chọn | Native pressed buttons; inclusive UTC days |
| Refresh | Làm mới; Đang tải số liệu… | Explicit read; disabled pending |
| Custom form | Từ ngày (UTC); Đến ngày (UTC); Áp dụng; Chọn tối đa 31 ngày, không vượt hôm nay theo UTC. | Labeled native date inputs; validate before call |
| Invalid dates | Chọn ngày bắt đầu và ngày kết thúc hợp lệ.; Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.; Chọn khoảng tối đa 31 ngày.; Ngày kết thúc không được vượt hôm nay theo UTC.; Chưa có khoảng thời gian để xem. Thử lại sau hoặc chọn ngày trước.; Khoảng ngày không hợp lệ. | Exact resolver messages, unit tests; last helper guard is internal-only for invalid preset programming input |
| Scope/status | UTC; date/date-range; Đang tải số liệu; Đang tải [range] · đang hiển thị lần đọc trước; Chưa tải được [range] · số liệu lần đọc trước; Chưa có số liệu; Đọc lúc [time] UTC · cập nhật khi làm mới | Applied data range separate from request range, observed UTC time; no live freshness claim |
| KPI/row label | Yêu cầu mới; Báo giá chờ khách duyệt; Sẵn sàng mua hàng; Sẵn sàng xuất gửi; đơn | Current operational counts, not financial KPI |
| KPI explanation | Tiếp nhận và chuẩn bị báo giá; Theo dõi phản hồi của khách; Đủ tiền, không bị tạm giữ; Đủ điều kiện xuất gửi | Purchasing/ready eligibility comes from existing server filters |
| Chart | Đơn hàng cần xử lý; Số đơn theo từng hàng đợi hiện tại; Đơn hàng; So sánh khối lượng từng hàng đợi, không phải tỷ lệ chuyển đổi. | Four labeled bars with numeric textual equivalent; no total or funnel |
| Action panel | Cần theo dõi; Thanh toán, đơn tạm giữ và chăm sóc khách | Existing work destinations |
| Action rows | Ngoại lệ tài chính / Kiểm tra và đối soát; Chuyển khoản chờ xác minh / Xác minh trước khi ghi nhận tiền; Đơn đang tạm giữ / Kiểm tra lý do tạm giữ; Đơn còn tiền cần thanh toán / Theo dõi phần tiền còn thiếu; Hội thoại đang mở / Tiếp tục trao đổi với khách | Five observed queue counts; no fabricated urgency or SLA |
| Permission | Chưa có quyền xem tổng quan vận hành; Cần tài khoản chủ sở hữu hoặc quản lý vận hành. Kiểm tra tài khoản đang đăng nhập. | Clear previous private counts on permission/unauthenticated error |
| Failure/recovery | Chưa tải được số liệu; Số liệu trả về chưa hợp lệ; Kiểm tra kết nối và thử lại. Khoảng ngày bạn chọn vẫn được giữ.; Thử lại | Connection/response error retained input and retry |
| Partial | Số liệu chưa đầy đủ; Có nguồn đạt giới hạn 100 bản ghi. Thu hẹp khoảng ngày để kiểm tra thêm.; Một số chỉ số chưa có dữ liệu hợp lệ. Chúng được hiển thị bằng dấu —.; Một số chỉ số chưa có dữ liệu hợp lệ và được hiển thị bằng dấu —. | Missing keys not zero; cutoff visible before cards |
| Zero | Không có công việc thuộc các hàng đợi trong mẫu đã đọc; Chọn khoảng khác để xem thêm. Đây không phải tổng công việc toàn hệ thống. | Only when all nine keys equal zero, no truncation/missing data and not stale |
| Disclosure | Phạm vi và cách đọc số liệu | Native details/summary keyboard control |
| Disclosure body | Current states of records created in range; 100 newest/source; overlapping queues cannot be summed; no revenue/profit/trend/late-shipping inference; linked destinations use their own filters; — differs from 0 | Full Vietnamese explanatory paragraphs verified in current source, in-context expanded disclosure browser test |
| Footer | Bản ghi tạo trong khoảng đã chọn · tối đa 100 bản ghi mỗi nguồn · các trang đích có bộ lọc riêng | Visible qualification even while disclosure closed |
| Values | Numeric count; —; 0 | vi-VN formatter; safe integers 0..100, missing malformed count unavailable |

## State coverage

| State | Result | Evidence |
| --- | --- | --- |
| Default/actions/success | PASSED | Real component success render; four KPI links, nine labels, presets/refresh |
| Loading/pending/disabled | PASSED | Deferred fixture; d94Data aria-busy, status and disabled refresh; no fabricated zero |
| Empty/zero | PASSED | zero.png; all known counts zero; partial zero is suppressed |
| Error/retry | PASSED | Browser offline/malformed retry with retained applied scope and draft |
| Stale/partial | PASSED | partial.png; retained old range and labeled requested failure; missing counts — |
| Unauthorized | PASSED | permission.png; private counts cleared; real unauthenticated app gated |
| Confirmation/destructive | NOT_APPLICABLE | Only reads/navigation, no financial or destructive action |

## Data semantics

Source: operationalDashboard unchanged. Unit: queue records, primary cards are orders. No currency. UTC creation-period filter; sampled current states, no transition series. Refresh only, no polling. No private records returned. No sum across overlapping queues. Destination scope differences explicitly disclosed.

## Mandatory Human Interface principles

| Principle | Status | Current evidence |
| --- | --- | --- |
| Purpose | PASSED | desktop-1440.png: metrics and queue actions above explanatory metadata |
| Agency | PASSED | Presets/custom selection, explicit refresh/retry, retained input, native disclosure |
| Responsibility | PASSED | Visible sample cap, missing/zero distinction, no fake revenue, stale applied period retained |
| Familiarity | PASSED | Existing Vietnamese domain labels, native dates/buttons/links, original destinations |
| Flexibility | PASSED | 1440/390/320 viewport screenshots, keyboard Tab, 200% CSS text scaling, textual bar values |
| Simplicity | PASSED | Presets replace oversized initial form; custom fields only on request; no mandatory click to load |
| Craft | PASSED | Success/loading/empty/error/permission/partial in-context tests; numeric formatting, wrap/overflow checks |
| Delight | PASSED | Saves initial submit, direct queue access and calm recoverable errors; no decorative motion |

## Platform fit and pattern checks

PASSED web fit: semantic h1/h2 sections, named buttons/native links, labeled date inputs, aria-pressed/expanded, polite statuses/alerts, decorative icons hidden, graphical bars hidden with same numeric labels in text. Brand retained; no Apple assets/gestures. No confirmation for low-risk reads. No direct sensitive error details. Vietnamese messages authored in complete sentences.

## Gate results

Meaning, audience, tone, brevity, state coverage, data semantics/privacy, terminology, web fit, keyboard/DOM accessibility, localization wrapping and in-context verification: PASSED within executed Chromium component checks. Other browsers, real screen-reader software, production provider and performance field metrics: NOT_RUN; no conformance or production certification claimed.

## Verification evidence

Existing server 127.0.0.1:5207. Browser plugin absent; Playwright used. Evidence under /private/tmp/dashboard094-v2-evidence: desktop-1440.png, desktop-390.png, desktop-320.png, zero.png, partial.png, permission.png, text-scale200.png and browser-results.json. Real component modules/shared styles loaded; synthetic call transport is clearly separated from actual emulator integration. Known dev-only Vite HMR local-network errors excluded from app-error assertion and documented; no server control changed.

## Decision

Product Language Gate: PASSED for scoped local UI. Review fix: empty-state wording qualified to sampled records and suppressed for partial coverage; stale failed requests identify requested period. Remaining environment/provider and assistive-technology limitations are recorded in TASK_REPORT.


## Visual v2 current evidence

No readable/accessible string, metric definition, business logic, route or request changed in this refinement. Complete original inventory remains applicable. Only dashboard094.css changed; source/test SHA256 comparison confirms that boundary. All prior states were rendered again in the current 7-test suite (7 passed, 8.6 seconds).

Eight principles re-reviewed against new screenshots: Purpose — larger KPI values and count badges make the existing workload easier to scan; Agency — presets, refresh, native forms and retry remain available; Responsibility — sample/stale/unavailable qualifiers retained; Familiarity — existing navy/royal-blue web language retained; Flexibility — 1440/390/320, keyboard and CSS text scaling 200% passed; Simplicity — unified toolbar and stronger primary control; Craft — label alignment, mobile wrapping and state screenshots checked; Delight — improved legibility with no additional animation or interruption. Each principle: PASSED within scoped executed evidence.

Text contrast measured: white on royal blue 6.72:1; muted light text on blue anchor 5.71:1; royal blue on numeric badge 5.96:1. Keyboard focus remains explicit. No color-only count meaning; actual values remain text. Browser plugin absent; Playwright fallback as before. Other engines/real assistive technology NOT_RUN. Product Language Gate: PASSED for local v2; no live-provider or production claim.

# Product Content Review

## Scope

- Surfaces: CRM Tổng quan/customer and operations tabs, chart alternatives, optional statistics permission, added privacy section. Integrations change event hooks, not commerce/Ask copy.
- Audience/task: Vietnamese staff understanding recorded demand and verified purchase outcomes; shoppers deciding whether optional statistics are allowed.
- Business outcome: useful recorded traffic, product interest, questions and authoritative payment flow without implying exact humans, revenue or guaranteed fulfillment.
- Locale/platform: Vietnamese web UI; consent additionally carries a short English explanation. Existing public privacy and CRM language remains Vietnamese. English marketing/commerce copy is outside this change.
- References: write-product-content skill and product-content quality profile; local Human Interface principles reference checked 2026-08-20. Apple platform compliance is not claimed; these principles are a human-centered web quality reference.
- Reviewer: root, 2026-10-08. Current source inventory: PRODUCT-STRINGS.json; evidence refreshed by browser suite, not string-file inspection alone.

## Context and evidence

Observed: server-derived identity; positive canonical ledger payment versus browser interaction; finalTotal for full catalog payment; distinct range memberships; 7-day recorded-session cohort; 30-minute idle session; bounded topic vocabulary; no raw Ask query; OWNER/manager authorization and finance payload segregation. Optional statistics is independent of purchasing and marketing permission.

Assumptions: synthetic QA values illustrate valid contracts. They are not observed business statistics. Current provider functions/retention activation and authenticated full-app end-to-end collection are NOT_VERIFIED. Source documents describe intended configured retention, not confirmed active provider deletion.

## Content inventory

The complete added Vietnamese strings/templates and short English consent explanation are enumerated with source line/hash in PRODUCT-STRINGS.json. Groups below bind them to behavior and rendered state.

| Location/state | Current content group | User job | Behavior/evidence |
| --- | --- | --- | --- |
| Overview navigation/default | Tổng quan; Khách hàng & mua hàng; Vận hành; website-effectiveness explanation | Choose the business question | URL-backed tabs; screenshots/dashboard-1440.png and dashboard-320.png |
| Time controls | Hôm nay; 7 ngày; 30 ngày; Tùy chọn; Từ/Đến ngày (UTC); Áp dụng; 31-day explanation and invalid URL correction | Choose a comparable period | Native date controls, range validator, browser presets/custom/reload |
| Loading/recovery | Đang tải…; Làm mới; Đang đọc dữ liệu…; chưa tải được; invalid payload; earlier-read status | Know whether values are current | Request-generation fence, same-period stale retention, malformed/offline browser case |
| Unauthorized | Bạn chưa có quyền xem thống kê | Understand access failure | Server authorization first; denial clears snapshot; browser denial case |
| Collection/coverage | Start time, as-of UTC, disabled, partial/backlog, em dash explanation | Judge the coverage | Snapshot start/availability/backlog fields; disabled/bounded browser cases |
| KPI | Phiên; Trình duyệt; Khách có đơn thanh toán; paid-session percentage and denominator notes | Separate units and outcomes | Session/account/browser unions; payment owner membership; cohort subset test |
| Traffic/funnel | Daily page views/session starts, nested product-view session funnel, first payment in 7 days, temporary observation notice | See demand versus recorded purchase conversion | No overall buyer/visitor division; cohort and final-payment tests; Back/Forward and remount counts verified |
| Product ranking | Sản phẩm được quan tâm; Xem; Chọn; Đơn đủ tiền; sort labels; top10 selection and unknown/unavailable explanation | Compare interest with verified full allocation | Explicit clicks versus detail views; first threshold once; keyboard sorting with unknown last; unavailable populated-row browser case |
| Ask ranking | Fixed topic labels, comparison bars; questions/sessions; minimum 5 sessions; not raw query | Identify frequent question topics | Local taxonomy only; separate command turns; 5-session emulator test |
| Operations | Đơn mới theo nguồn hàng; actual stage labels; current states in created-at period; overlapping queues explanation | Understand operations without counting queues as totals | Latest canonical version; market columns; real stageLabels; legacy max100 queue regression |
| Money | Thu; Hoàn; Đảo; Ròng; VND/UTC; neither revenue nor profit explanation | Read recorded cash movement | Canonical ledger signs; permission strips money; unavailable values remain em dash |
| Chart controls/accessibility | Previous/next day; keyboard instruction; daily/market tables; captions; selected-day output | Read exact values without hover or color | Keyboard browser checks, table alternatives, 200% text screenshot |
| Consent/default/action | Purpose, optional English explanation, privacy link, Từ chối, Cho phép thống kê, settings | Make an informed optional choice | No transport before consent; refusal leaves product interaction functional |
| Consent/withdrawal | Quyền thống kê; Dừng ghi nhận; Đóng | Stop future recording | Queue cleared, capability revoked; real component browser and late-response units |
| Privacy | Fields, account/order relation, pseudonymous limits, prospective withdrawal, 7/45/365-day retention, background deletion limitation | Understand data meaning and control | In-context privacy-390 screenshot; actual collection/TTL source contracts |

## State coverage

| State | Applicable | Content and evidence |
| --- | --- | --- |
| Default/action | Yes | Loaded charts, presets/tabs, consent choice; desktop/mobile screenshots |
| Loading/pending/disabled | Yes | Busy button, status and disabled collection notice; browser cases |
| Empty/zero | Yes | Genuine empty states distinct from unavailable; zero donut has no fabricated arc; operational regression |
| Success | Yes | Confirmed snapshot displayed, consent preference persists; no fabricated payment success |
| Error/recovery | Yes | Safe messages plus refresh, invalid dates preserve input; browser failure cases |
| Offline/stale/partial | Yes | Earlier-read indication; range ownership; false availability suppresses retained rows |
| Unauthorized | Yes | Snapshot cleared, specific access message; no client-only protection claim |
| Confirmation/destructive | Limited | Consent withdrawal stops future collection. No source-data delete or commerce confirmation added |

## Data semantics

Recorded sessions and pseudonymous browsers are not exact distinct humans. Buyer accounts include a verified deposit. A catalog paid-order occurrence means canonical full payable was reached historically; later refunds do not erase that occurrence. The session conversion numerator belongs to sessions started in the selected period and requires a linked first positive payment within seven days. Product-view conversion is a nested subset; custom buying can still appear in overall conversion. Gross collection/refund/reversal series use ledger time, not revenue recognition. Units and UTC are visible. Unavailable is em dash, available empty is zero/empty. Recent conversion is provisional. Consent/blockers/offline/missing attribution mean undercoverage.

## Mandatory Human Interface principles

| Principle | Status | Current evidence |
| --- | --- | --- |
| Purpose | PASSED | Focal recorded traffic/purchase KPIs followed by demand/rankings; operations has its own tab |
| Agency | PASSED | Refuse, allow, reopen and withdraw; choices do not block browsing/purchase; date and tab choice persists |
| Responsibility | PASSED | Explicit recorded/pseudonymous/retention/undercoverage explanations; no fake revenue, progress, raw question or exact-person claim |
| Familiarity | PASSED | Natural Vietnamese labels, familiar web buttons/date inputs/tabs/tables, same metric names throughout |
| Flexibility | PASSED | 320/390/1440px, 200% text, keyboard stepping/table alternatives; visible values without hover |
| Simplicity | PASSED | Four focal KPIs, separate count/money units, <=31 points/top10, queues remain within operations |
| Craft | PASSED | Shared CRM heading/tabs, blue-white-navy, responsive borders/spacing, unavailable and stale state corrections |
| Delight | PASSED | Immediate period/tab response, stable reload, lightweight chart interaction; no decorative motion or interruption |

## Platform fit and patterns

Web controls and semantic HTML remain native. Keyboard focus is visible; chart colors have textual values/tables; reduced motion is exercised with no new animation. No Apple asset, proprietary copy or platform-only control is introduced. Consent is an inline optional panel, not a forced modal. Feedback uses status/alert only where needed; purchase is independent. RTL/new locale translation is not introduced. Existing app browser support applies; Chromium evidence does not establish Safari/Firefox or assistive technology certification.

## Gate results and verification

| Dimension | Status | Evidence |
| --- | --- | --- |
| All eight principles / platform fit | PASSED | Mapping above plus actual rendered components |
| Meaning, context, tone, brevity, terminology | PASSED | Source contract/canonical ledger review; natural privacy copy; no backend/TTL jargon in shopper paragraph |
| Actions and state coverage / privacy | PASSED | Unit/emulator/browser cases listed above |
| Accessibility and text expansion | PASSED within executed scope | Keyboard/tables/focus/reduced motion/mobile/200% browser evidence; screen reader and cross-browser NOT_RUN |
| In-context evidence | PASSED | Final 16-case browser suite green; desktop/mobile dashboard, consent and privacy screenshots visually inspected; refreshed desktop/320px sorting and topic-bar captures inspected after cycle 3 fixes |

Decision: PASSED within the executed Chromium component/browser and emulator scope. No provider activation or legal-policy approval is implied by this review.

## Release v2a current-context addendum

Inventory rebound to isolated release source: 162 entries, including two decorative required markers on mandatory UTC date fields. Natural Vietnamese, action and data meanings unchanged. Purpose: range choice controls the existing query; Agency: users choose presets/custom range; Responsibility: required/UTC/31-day scope explicit and unavailable remains —; Familiarity: existing requiredMark convention; Flexibility: keyboard native dates and 320/390/1440 checks; Simplicity: one marker per mandatory label; Craft: marker is aria-hidden, label retains input accessible association; Delight: calm unobtrusive treatment. All eight principles PASSED within executed web component scope. Current shared5207 Dashboard hash equals isolated candidate, 16 browser checks rerun after the marker correction; synthetic transport is not full-app/provider acceptance. Prior screenshots retained; no production metrics or customer data captured.

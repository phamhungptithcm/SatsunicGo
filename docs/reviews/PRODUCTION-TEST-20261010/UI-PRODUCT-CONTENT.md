# Product Content Review — production test presentation

## Scope

- Account order list/detail, CRM queues/customer summary/operations detail, staff feedback inbox, receipt PDF and receipt job projections. Root-owned email prefix and finance/policy error strings are included as integration dependencies.
- Audience: the customer or staff member trying the approved production test flow; their job is to recognize simulated records, inspect the correct amounts and receipt, and avoid actual fulfillment.
- Locale/platform: Vietnamese web application and Vietnamese PDF. `Test`, `sandbox`, `SePay` and `PDF` retain their familiar technical names. No public marketing, search metadata, claim, tracking, experiment or new motion changes.
- Design boundary: existing blue-white-navy system, compact native controls, existing account/CRM layouts. Apple HIG is a human-centered reference, not an Apple platform contract here. No Apple-only styling added.
- Reviewer: `/root/test_mode_ui`, 2026-10-10 UTC. RIG: `DEGRADED` in the isolated checkout; optional indexes unavailable. Bounded source, compiler, SSR and actual PDF render evidence used.

## Context and evidence

Verified: canonical production test provenance is server-derived; the conservative presentation classifier also marks legacy demo/SePay and malformed partial provenance. Read projections preserve role filtering and expose no new PII. A display marker grants no mutation authority. Server fulfillment, finance and invoice fences are separately owned by finance; root owns email activation and policy enforcement. Test sourcing adjustments remain their existing simulated flow.

Assumptions: a staff member recognizes the concise English `Test` label in this Vietnamese UI. Native select controls follow the browser's existing behavior; this has not been verified with keyboard or assistive technology in the changed views.

Unknowns: exact candidate account/CRM browser viewport, focus, text scaling and spoken AT acceptance are `NOT_RUN` by this contribution. No hosted runtime, provider acceptance, inbox delivery or production readiness is asserted. Shared runtime and real accounts were not changed.

## Content inventory

| Location/state | Existing content | Current approved content | User job and behavior evidence |
| --- | --- | --- | --- |
| Account/CRM test list/detail | No explicit test marker | `Test`; accessible `Đơn test` | Recognize simulated/unsafe provenance; rendered SSR tests, safe projection tests |
| Feedback inbox option/detail | Category/date only | `Test · ` prefix; `Test` with accessible `Góp ý test` | Identify test feedback without adding a control; SSR marker test; backend optional testMode contract |
| CRM kind selector | No kind selector | `Loại đơn`, `Tất cả`, `Đơn thật`, `Đơn test` | Filter only already loaded records; same classifier as marker |
| CRM loaded-page count | `N đơn trong trang` | `X/Y đơn trong trang` | X displayed, Y loaded; not a server total or whole dataset |
| CRM filtered empty | No kind-filter state | `Không có loại đơn này trong trang đã tải.` | Honest partial-page result, not a claim that no test orders exist |
| Test account/CRM money | `Đã thu ròng` | `Thanh toán test` | Same numeric snapshot; explicitly simulated amount |
| Account test paid state | Staff will buy after payment | `Đã xác nhận thanh toán test.` | Remove real purchase promise; actual fulfillment is denied |
| Account test catalog paragraph | Payment required for staff purchase | Total retained, fulfillment promise suppressed | Preserve price data without promising real work |
| Test staff action form/prerequisite | Live action form | `Đơn test. Các thao tác mua và giao hàng đang tắt.` | No form/button/input rendered; actual test/legacy/partial cases SSR verified |
| Test order history heading | `Lịch sử và bảng đối chiếu tiền` | `Lịch sử và thanh toán test` | Distinguish simulated ledger |
| Test history hint | Real internal reconciliation explanation | `Các khoản thanh toán trong lần test này.` | Natural concise context for test history |
| Test history entries | `Tiền đã xác nhận` | `Thanh toán test` | Same amount/reference/date; test ledger supplied by finance |
| Test live actions/document routes | Actual quote/cancel/final/receipt/PayOS/sales-document affordances | Hidden on classified test records; private purchase-receipt PDF remains | Avoid offering real fulfillment or sales-document issuance; live history route regression retained |
| PDF every-page header | `CHỨNG TỪ THANH TOÁN` | `CHỨNG TỪ TEST` | Visible and extracted 6-page fixture; page 1 and page 6 header rendered and inspected |
| PDF initial status/summary | `Đã thanh toán` | `Thanh toán test` | Clear simulated status/amount; genuine payment copy unchanged |
| PDF continuation | `Thanh toán mua hộ - tiếp theo` | `Thanh toán test - tiếp theo` | Continuation remains distinguishable independently |
| PDF footer | `Không thay thế hóa đơn thuế.` | `Chứng từ test · Không thay thế hóa đơn thuế.` | Test/tax meaning remains explicit on every page |
| PDF balance summary | `Thanh toán lần này` | Unchanged | Preserve incremental payment meaning; header/footer identify test |
| Receipt legacy outbox subject | `SatsunicGo · Chứng từ thanh toán {id}` | `SatsunicGo · Chứng từ test {id}` | Test PDF attachment context; id is the existing public receipt reference |
| Receipt legacy outbox body | Real payment confirmation paragraph | `Thanh toán test {amount} ₫. Chứng từ PDF được đính kèm.` | Simulated amount and attachment, no false bank confirmation |
| Root-owned customer email subject | Existing localized template subject | `[Test] {existing subject}` | prepareCustomerEmail preserves template after authoritative entity/job matching; fresh affected 58-test run includes 21 production-test-email cases and 37 presentation cases |
| Policy unavailable/denied | Existing API error rendering | `Kênh thử chưa khả dụng.` | Policy owner reports handler/unit coverage; browser error presentation NOT_RUN |
| Finance unsupported action | Existing API error rendering | `Đơn thử không dùng cho thao tác này.` | Finance-owned TEST_OPERATION_NOT_SUPPORTED fence; no sensitive fields |
| Finance provenance mismatch | Existing API error rendering | `Đơn và lượt thanh toán chưa khớp.` | Finance-owned PURCHASE_EXECUTION_MISMATCH; no misleading success |

The last three error strings are owner-provided integration inventory, not claimed browser acceptance. Detailed finance/policy handler receipts remain authoritative for those paths.

## State coverage

| State | Applicable | Content/rationale | Evidence |
| --- | --- | --- | --- |
| Default/action | Yes | One small marker; native kind selector; existing layout | SSR marker/action tests and source |
| Loading/pending/disabled | Yes | Existing loading/retry states preserved; marker does not change query | Source; exact rendered loading/focus NOT_RUN |
| Empty/no result/true zero | Yes | Explicit loaded-page empty copy and X/Y count | Source branch; browser NOT_RUN |
| Success | Yes | Test status and receipt, no actual fulfillment promise | Actual PDF rendered; genuine/test PDF regression |
| Error/recovery | Yes | Safe test-channel/mismatch/unsupported denial; existing recovery retained | Owner handler coverage; browser NOT_RUN |
| Offline/stale/partial | Yes | Read projection does not throw for malformed provenance; test label and suppression remain | Negative pure-function and SSR tests; UI offline NOT_RUN |
| Unauthorized/forbidden | Yes | No new access; warehouse role projection stays restricted | Source review; root integration/security acceptance needed |
| Confirmation/destructive | Yes | Live ActionForm and real customer fulfillment actions suppressed; test-only sourcing flow retained | SSR no-form/input/button; backend enforcement owned by finance |

## Data semantics

- Source of truth: persisted server execution provenance plus legacy test tags for conservative display. Presentation never authorizes settlement, identity, email or fulfillment.
- Malformed/partial provenance: displayed and filtered as test; canonical metadata emitted only if schema-valid. No null-to-zero conversion. Genuine legacy records receive no new metadata.
- Amounts remain integer VND snapshots; existing PDF payment method, approved totals, Vietnam timestamp and purpose semantics remain. Balance remains `Thanh toán lần này`.
- CRM X/Y means visible/loaded in this page, not total count. The filter adds no backend query or tracking. Existing pagination remains.
- No owner identifier, testRunId, contact detail or secret is printed in the marker or receipt. Existing authorized receipt reference remains. Projection tests explicitly exclude recipient/email/money fields.

## Mandatory Human Interface principles

| Principle | Status | Evidence/rationale |
| --- | --- | --- |
| Purpose | PASSED | Marker and receipt make simulated state visible; no unrelated content |
| Agency | PASSED | Existing review/download and simulated adjustment remain; live fulfillment is not offered |
| Responsibility | PASSED | Test amount is explicit; no real purchase promise; page-limited count is honest; no added PII |
| Familiarity | PASSED | Existing blue/navy layout, native select, standard history/PDF terminology; actual PDF rendering inspected |
| Flexibility | NOT_RUN | Changed account/CRM controls not tested at narrow viewport, zoom, keyboard or AT |
| Simplicity | PASSED | Small non-interactive marker; no new panels, dialogs, repeated setup instructions or motion |
| Craft | NOT_RUN | Actual PDF page 1 and page 6 header/footer passed bounded visual inspection; full browser text expansion/layout/focus is unverified |
| Delight | NOT_RUN | Restraint is evidenced in source/PDF; interaction comfort in real account/CRM surface remains unverified |

## Platform fit and pattern checks

| Pattern | Applicable | Result | Evidence/rationale |
| --- | --- | --- | --- |
| Writing/labels/controls | Yes | PASSED | Natural compact Vietnamese, one technical Test marker, existing controls |
| Feedback/interruption | Yes | PASSED | No modal, toast, sound, animation or extra prompt added |
| Alerts/consequential choices | Yes | PASSED | Explicit denied operation; real action forms suppressed; no fake successful payment |
| Onboarding/contextual help | Yes | PASSED | Context lives beside record; no new walkthrough |
| Permission/privacy/accounts | Yes | PASSED | No added permission request, account changes, external calls or PII projection |
| Inclusion/accessibility/localization/RTL | Yes | NOT_RUN | Accessible marker names asserted in SSR; full changed-view keyboard/AT/zoom and text expansion not run; product remains current Vietnamese LTR |

## Gate results

| Dimension | Status | Evidence/rationale |
| --- | --- | --- |
| Human Interface principles | NOT_RUN | Required Flexibility/Craft/Delight browser interaction evidence missing |
| Target-platform fit | PASSED | Existing React web components and PDF typography, no Apple-only convention |
| Meaning matches behavior | PASSED | Conservative test classification; live suppression; genuine records preserved |
| Audience/business context | PASSED | Test customer/staff, simulated receipt and read-only separation |
| Natural/respectful tone | PASSED | Short record/status wording; no invented assurances |
| Concise without meaning loss | PASSED | Tiny marker, one action-state sentence, contextual PDF header |
| Actions/state coverage | NOT_RUN | SSR proves suppression; rendered queue/loading/error interaction not verified |
| Data semantics/privacy | PASSED | Display-only safe projection and negative fixtures; no added PII |
| Accessibility | NOT_RUN | SSR accessible-name coverage does not substitute for spoken AT |
| Localization/text expansion | NOT_RUN | Vietnamese Unicode PDF verified; live browser zoom/expansion not run |
| Terminology consistency | PASSED | Test/Thanh toán test/Chứng từ test use the same conservative classification |
| In-context verification | NOT_RUN | Actual PDF context verified; browser account/CRM context missing |

## Verification and decision

- Automated: 57 scoped UI/PDF/workbench tests pass; fresh affected 58-test run includes 37 presentation and 21 production-test-email cases (counts overlap, do not add them); frontend/backend strict and scoped ESLint pass; scoped diff whitespace check passes. An earlier 20-test email/renderer run is historical after root added email cases.
- Actual artifact: synthetic 30-line, six-page PDF rendered from current source (654,701 bytes). Page 1 and page 6 header/footer inspected at 1400px render; no overlap observed in those views. Unicode extraction checks explicit test header/footer on every page and absence of owner/testRunId. See UI-CHECKS.json for hashes and local artifact paths.
- Keyboard/AT/account/CRM viewports: NOT_RUN. No shared runtime/account modifications and no hosted/provider checks.
- **Product Language Gate: BLOCKED** for complete web UI acceptance. PDF/content engineering checks pass within the evidence above. Root must bind current account/CRM desktop+narrow, loading/empty/error, keyboard/focus and spoken AT evidence before a successful UI completion claim.
- Findings fixed: legacy demo classification; partial read projection safety; receipt reply type compatibility; generic real sales-document links hidden on test records; submit-time UI test check. Finance separately fenced actual sales-document issuance.
- Required owner decision: no repeated approval request. Root continues the already authorized integration and obtains missing acceptance evidence without bypassing gates.

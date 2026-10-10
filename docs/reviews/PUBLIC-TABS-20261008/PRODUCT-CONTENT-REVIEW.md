# Product Content Review

## Scope and context
Public customer web pages: Account order filters/detail sections, product country filters, public shipping direction and Ask Conversation/Current task. Locale vi-VN; existing EN labels preserved in Ask. Review date 2026-10-08 America/Chicago. Source and browser evidence at shared 127.0.0.1:5207. User screenshot 2 supplies direction: plain text tabs with optional neutral count badge. Layout variance 2/10, motion 0/10, density 6/10; compact existing page rails. Web native links/buttons retained. Apple HIG current platform compliance NOT_APPLICABLE; bundled human interface principles applied as a quality reference.

Verified: Account queries at most 50 owned orders; delivered includes COMPLETED; unknown stages belong only to All. Customer account groups and detail handlers preserved. Country filtering applies to loaded products; shipping direction resets warehouse/service/product. Ask language and history controls retain their separate roles. Account task expansion controls (Profile/Membership) remain disclosures, not page tabs. CRM excludes public styling through staff/isCrmPath guards; shared PageTabs source/CSS unchanged.

## Content inventory
| Location/state | Current -> resulting content | Behavior/data evidence |
| --- | --- | --- |
| Account filters, loaded | Existing Tất cả / Chưa giao / Đã giao / Đã hủy labels plus numeric badges | ownerOrders filtered with existing matchesCustomerOrderFilter; successful emulator read showed 50/50/0/0 |
| Account scope, every filter | Bộ lọc áp dụng cho tối đa 50 đơn đã tải trong tài khoản. -> Bộ lọc và số lượng áp dụng cho tối đa 50 đơn đã tải trong tài khoản. | limit(50), moved near rail and linked with aria-describedby |
| Account unavailable/pending/error | Existing labels only, no new numerical value | db && !loading && !error guards; pending state directly observed |
| Other rails | Existing labels unchanged; only presentation | Native aria-pressed and existing handlers |

Counts are numbers of owned order records in the loaded list, not total account history, products, units, money, or progress. Zero is shown after a successful snapshot; absent Firebase/loading/error has no count. No new query, API, estimate, permission or telemetry. New accessible names naturally include each label and count; browser accessibility snapshot confirms Tất cả 50 and Đã hủy 0. Scope is visibly disclosed above results.

## State coverage
| State | Result/evidence |
| --- | --- |
| Default/hover/selected/focus | PASSED: transparent rails, selected semibold dark text; browser screenshots and native selection state |
| Loading | PASSED: Account loading captured with no badges; existing loading messages retained |
| Empty/true zero | PASSED: cancelled zero badge plus existing empty-state recovery link in browser |
| Success | PASSED: successful owned read supplies counts; public tabs make no save/completion promise |
| Error/recovery | PASSED scoped review: existing Account error suppresses badges; Ask error rendered with preserved question; no error handlers changed |
| Offline/stale/partial | PASSED scoped review: explicit loaded-list boundary; no fabricated total or freshness claim; existing error handling retained |
| Unauthorized | PASSED scoped review: account rail conditional on authenticated user and owner-filtered records; no count for signed-out state |
| Confirmation/destructive | NOT_APPLICABLE: no confirmation, payment or destructive action modified |

## Mandatory principles
| Principle | Status | Evidence |
| --- | --- | --- |
| Purpose | PASSED | Rails help select the existing list/page section with less visual weight |
| Agency | PASSED | Existing links/buttons and recovery paths retained; no automatic activation or data mutation |
| Responsibility | PASSED | Counts disclose 50-record scope; hide unknown/error/loading values |
| Familiarity | PASSED | Native link/button semantics, established Vietnamese labels and existing route URLs |
| Flexibility | PASSED | 390px/mobile and desktop screenshots; 44px targets; keyboard Tab moves to Ask task with visible 2px outline |
| Simplicity | PASSED | No pill backgrounds/baseline/underline; optional badges only where meaningful |
| Craft | PASSED | Shared scoped CSS; type/color/spacing consistent; current browser visuals reviewed |
| Delight | PASSED | Quiet predictable selection without decorative motion or interruption |

## Platform fit and patterns
PASSED for web target: semantic controls and native focus/selection; no Apple-only component or asset copied. No new icon/image/branding. Actions remain the same. Feedback/interruptions and privacy/account messages remain intact. Alerts/destructive choices and onboarding: NOT_APPLICABLE to this visual change. Inclusion/localization: native accessibility tree verified, labels untruncated at tested widths, horizontal scrolling supports longer rails. No live screen-reader speech session or 200% browser zoom claim.

## Gate dimensions
All applicable dimensions PASSED for scoped change: human interface principles, target-platform fit, behavior agreement, audience/context, natural respectful tone, concise meaning, action/state coverage, data semantics/privacy, accessibility, localization/text expansion (mobile long Vietnamese detail labels), terminology consistency, in-context verification. Evidence includes actual rendered Account zero/loaded/pending, products country selection, shipping direction defaults, Ask selected/error and keyboard focus. Count error suppression is source-reviewed, not an injected browser outage.

## Verification evidence and limitations
Screenshots: output/public-tabs-20261008/{account,order,products,fees,ask}-{desktop,mobile}.jpg. Browser tested mobile 390x844 plus initial 513px products width, desktop 1280x850. Buttons/links at least 44px; detail rail measured 350px width/scrollWidth with all labels visible. Ask mobile document overflow false. Source review confirms mounted detail panels and handlers unchanged; navigation exercised between all three sections. No draft submission, payment, upload, runtime reset, production or provider certification. The demo Ask answer failed; tab selection and preserved question were verified separately from answer generation. Native AX/DOM evidence is not a full assistive-technology audit.

Decision: Product Language Gate PASSED for scoped presentation and badge meaning.

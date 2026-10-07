# Product content review — current cycle 8

## Scope and context
Vietnamese web customers and staff; catalog checkout, custom request, Ask recovery, profile/privacy, CRM operations, internal statements and outbox. Root self-review on the current candidate, 2026-10-05. Native web HTML forms, links, tables, keyboard and responsive layout apply. Apple platform contract is not applicable. No Apple-only expression introduced. Changed strings and locations: STRING_INVENTORY.json (conservative AST inventory, includes baseline WIP; not proof of rendered coverage).

Verified: fixed catalog quantity/variant/terms and all-inclusive VND price, one verified collection before buying; unlisted custom review/accepted quote/initial50%/final approval/balance. Legacy absent kind remains custom. QR, redirect, transfer notice and AI do not establish funds. Explicit receipt confirmation completes delivery. Known account lock clears private profile/addresses and blocks late callbacks until explicit fresh retry. Exact order link reads its own document rather than the first50 list. Unique CRM component keys prevent duplicate forms.

Assumptions: controlled Vietnamese synthetic fixtures represent the documented local journeys. Unknown: real provider delivery, live authentication, assistive-technology output, commercial policy approval and production configuration. No full-product certification.

## Content inventory and state coverage
| Location/state | Current content and user job | Behavior/evidence |
|---|---|---|
| Catalog default/invalid/pending/success | Variant, quantity, total and full-payment action; prevent invalid submit | CAT-H01/B01/B02; committed response loss reload retains one order |
| Custom and Ask | Submit unlisted review; recover original committed checkout; safe provider-unavailable feedback | REQ-H01, ASK-B01; no synthetic payment treated as bank receipt |
| Profile lock/error/retry | “Tài khoản đang bị khóa…”; clear stored and typed address, disable saves, explicit retry | PROFILE-B02 plus reducer late-error/success/UID regression; generic listener failure only unit/source, not native fault injection |
| Order inaccessible/empty | “Chưa mở được đơn này”; check link or return to own list | ORDER-B01 own link outside50 and foreign customer denial |
| Delivered/action/pending | “Xác nhận đã nhận đủ hàng”; check full receipt before explicit action | FLOW-UI01 and RECEIPT-B01 held/underfunded/in-transit hidden |
| CRM reload/stale/invalid action | Clear old selection/actions, one form, truthful prerequisite failure | CRM-B02; CRM-UI390/768/1440 keyboard/reduced motion/zero-money refusal |
| Documents empty/loading/error/recovery | Retry list, preserve latest selection; saved-but-detail-failed feedback avoids resubmission | DOC-B03/B05/B06 and DOC-B02 actual commit response loss |
| Issued/shared/void/revoke | Frozen internal statement, retained void history, minimal public projection and revoked link | DOC-H01/B01/B02; no order cancellation, refund or tax status inferred |
| Print/text scaling | All20 long rows, repeated headers, VND totals; enabled print only issued | PRINT-H01, three PDF pages extracted and visually inspected; UI-H200 real Chrome zoom checkout and statement |
| Outbox uncertain | Proof/version reconciliation; no blind resend | OUT-B01 and email integration |
| Support/privacy | Explicit personal-data request links and owned support thread | PROFILE-UI01, SUP-UI01; request link does not promise automatic deletion |

Default/action, pending/disabled, empty, success, error/recovery, stale/partial, forbidden and consequential confirmation have the bounded evidence above. Whole-app offline and actual screen-reader coverage remain NOT_RUN.

## Data semantics
Authoritative order/payment ledger remains backend-owned. VND integer amounts, quantity is ordered quantity, confirmed0 remains zero; unknown delivery/provider outcome stays unknown. Statements freeze dated approved totals and seller version, are internal rather than tax invoices, and cannot change money. No added date/period/timezone aggregation. Public sharing omits private recipient/customer IDs; revoked and locked access fail closed. Synthetic PDF seed is render-only, not an issued production transaction or valid20-line catalog purchase.

## Mandatory principles
| Principle | Status | Current evidence |
|---|---|---|
| Purpose | PASSED | Catalog/custom distinction and explicit customer receipt/native journeys |
| Agency | PASSED | Explicit variant/quantity, retry, receipt, issue/share/revoke and consent withdrawal |
| Responsibility | PASSED | No model/money authority, privacy clearing, uncertain outcome wording and immutable statement history |
| Familiarity | PASSED | Vietnamese actions, VND formatting and native web controls in actual rendered states |
| Flexibility | PASSED | Keyboard, responsive390/768/1440, native200% zoom, print pagination and response-loss recovery |
| Simplicity | PASSED | One CRM action form, owned document links, minimal public statement and contextual retry |
| Craft | NOT_RUN | Native scoped keyboard/AX/contrast/zoom passed; actual assistive technology and complete whole-app state coverage still missing |
| Delight | PASSED | Useful saved feedback, focus/Escape restoration and reduced-motion support observed; no decorative motion added |

## Platform and pattern checks
Web platform fit, labels/controls, safe feedback, consequential choices, contextual recovery and account/privacy patterns PASSED in the named journeys. Existing design-system boundaries retained. RTL is NOT_APPLICABLE for this Vietnamese-only change; full multi-locale expansion NOT_RUN. Inclusion/accessibility remains NOT_RUN for actual assistive technology. Primary button contrast tested only; no full WCAG claim.

## Gate results and verification
Meaning/behavior, audience, natural tone, brevity, bounded actions/states, data semantics/privacy, terminology and in-context named journeys PASSED. Full Human Interface principles, accessibility and exhaustive localization/text expansion NOT_RUN. Evidence: current-browser.log/browser-results.json, native screenshots and AX snapshots in output/playwright/release021, current PDF/extraction, unit/integration reports. AX snapshots are not real screen-reader use. Independent QA NOT_RUN because refreshed intelligence remains stale/DEGRADED despite healthy tools.

Decision: **Product Language Gate BLOCKED** for remaining Craft/assistive-technology/full-state acceptance. Fixed incorrect recovery, private lock state, missing receipt action and duplicate CRM controls. No inferred owner risk acceptance or production success.

LOGIN-B02 current native logout/private-route/reload denial PASS; actual Google session and AT remainNOT_RUN. Full35browser report is current.

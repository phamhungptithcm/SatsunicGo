# Product Content Review — payment method selection

## Scope

- Surface: existing checkout Overview for initial and balance payments; shared `PurchasePaymentMethods`.
- Audience/task: Vietnamese customers review an order and choose how to pay before confirming.
- Locale/platform: Vietnamese web, native HTML fieldset/legend/radio controls. SatsunicGo blue-white-navy, existing compact checkout spacing. Apple principles used as a quality reference only; Apple platform expression/conventions are not applicable.
- Reviewer/date: current implementation chat, 2026-10-09.
- Evidence boundary: real selector and real checkout CSS rendered in `PAYMENT-METHODS-FIXTURE.html`; surrounding order/recipient/summary and scenario controls are synthetic. No provider payment, API, authentication or database flow is proved by this UI proxy.

## Context and evidence

Verified: `purchaseCheckoutSetup.paymentCapabilities` is the integration contract; only provider `demo`/`sepay_sandbox` with explicit `BANK_TRANSFER.available === true` can enable QR. The backend owner implements validation and method pinning; current UI passes the selected method in commit and acknowledgement admission. Missing capabilities disable payment. NAPAS/cards remain unavailable even if a malformed UI caller enables them.

Assumption: the first release exposes the three requested payment categories while only bank QR is operational. This is the direct user requirement. A later card/NAPAS launch requires coordinated capability, provider and UI validation.

Unknowns: actual SePay provider round trip, public IPN and production availability remain unverified. The UI does not claim these passed.

## Complete changed content inventory

| Location/state | Content | User job and behavior evidence |
| --- | --- | --- |
| Group legend/default | Phương thức thanh toán | Names the native selection group |
| Bank visible/accessibility label | QR chuyển khoản ngân hàng | Matches `BANK_TRANSFER`; native radio name equals label |
| Bank description | Quét mã bằng ứng dụng ngân hàng. | Describes the requested QR method, not payment completion |
| NAPAS visible/accessibility label | QR NAPAS chuyển khoản | Future method, disabled in this phase |
| Card visible/accessibility label | Thẻ ngân hàng | Future method, disabled in this phase |
| Card description | Visa, Mastercard, JCB | Method categories from the user's supplied reference; unavailable status is adjacent |
| All unavailable methods | Chưa khả dụng | Explicit limitation; no merchant registration/onboarding details |
| No ready method/live status | Chưa có phương thức thanh toán khả dụng. Tải lại thông tin để kiểm tra. | Explains why confirmation is disabled; browser reload re-fetches setup |
| Decorators | Generic bank, QR and card SVG; `aria-hidden` | Supports scanning without redundant accessible content or third-party network assets |

The labels/descriptions are complete Vietnamese messages. NAPAS/cards do not display merchant onboarding states. Existing order prices, shipping semantics, confirmation copy and success wording are unchanged by this slice.

## State coverage

| State | Result | Evidence |
| --- | --- | --- |
| Default/selected | PASSED | Three radios; only ready QR checked/enabled |
| Disabled | PASSED | Native disabled controls, explicit text; attempted NAPAS label action blocked; ArrowDown leaves QR selected |
| Pending | PASSED | Fieldset locks all controls while keeping original checked method |
| Empty/missing/partial capability | PASSED | No selected method; all disabled; status explains unavailable; confirmation blocked |
| Error/offline | PASSED for this slice | Missing/failed setup cannot synthesize readiness; existing durable checkout error remains; provider failures owned by integration chat |
| Success | NOT_APPLICABLE | Choosing a method does not pay, create an order or announce success |
| Unauthorized | NOT_APPLICABLE to new selector | Existing checkout authentication gate preserved |
| Confirmation | PASSED | Method is selected before existing confirmation; changed selection clears confirmation |
| Destructive | NOT_APPLICABLE | No new destructive action |

## Data semantics

Capabilities are backend availability, not settled-money evidence. Unknown and unavailable are never converted into ready. No client total or provider credential is added. Availability can become stale after setup; server commit validation remains authoritative. No currency, time, aggregation or personal data mapping changes.

## Mandatory Human Interface principles

| Principle | Status | Current evidence |
| --- | --- | --- |
| Purpose | PASSED | Method choice appears in the existing Overview beside the information being confirmed |
| Agency | PASSED | Native selection, explicit disabled alternatives, existing back/edit controls; no new step or automatic submit |
| Responsibility | PASSED | Missing capability blocks confirmation; no false payment success, real-money claim or merchant-paperwork leakage |
| Familiarity | PASSED | Recognizable bank/QR/card categories and standard web radio/fieldset behavior |
| Flexibility | PASSED | Keyboard skips disabled methods; 320px layout has scrollWidth320; 200% component text-size proxy also has scrollWidth320 and no row clipping |
| Simplicity | PASSED | Three compact rows, one enabled choice, brief inline limitation and no modal |
| Craft | PASSED | Native names/descriptions, visible focus, 72px row targets, whitespace fixed and text contrast corrected; desktop/mobile screenshots |
| Delight | PASSED | Quiet stable layout, full-row label targets, no unnecessary animation/interruption; this is an observed interaction property, not a user-research claim |

## Platform and pattern checks

Web conventions and established product palette are authoritative. Semantic radio inputs retain browser keyboard behavior. Text plus checked/disabled state carries meaning beyond color. No Apple-only controls, branded provider assets or new icon dependency. No animation or external asset request is introduced.

Writing/labels, feedback, contextual help, consequential choice and accessibility/localization: PASSED within this slice. Permission/account/destructive patterns: NOT_APPLICABLE to the added selector. Locale is currently Vietnamese; new translated locales and full OS/browser screen-reader sessions were not tested. Browser accessibility-tree evidence is recorded, not described as a full assistive-technology certification.

## Verification

- `output/sepay-payment-methods-20261009/browser-evidence.json`: ready, missing, unavailable, busy, balance, keyboard and text-size states.
- Screenshots: `desktop.png`, `mobile-320.png`, `text-200-mobile.png`, `unavailable.png` in that same output directory.
- 320px normal and 200% component text-size proxy: no horizontal overflow; rows grow rather than clip. The text-size test is a fixture font-size override, not a claim about full browser zoom.
- Small-description contrast: changed from `#69758b` (4.31:1 on selected background) to `#53627b` (5.73:1 selected; 5.96:1 disabled surface; 6.17:1 white).
- Unit/contract checks: payment-selection tests and existing recipient/acknowledgement regressions; 84 tests passed in the scoped three-file run. ESLint and TypeScript passed.

## Decision

Product Language Gate: **PASSED for the scoped selector and disclosed UI proxy**. Fixed: card accessible description joined without separation; selected-row helper contrast below AA. Remaining: authenticated full application checkout and provider E2E are integration-owner evidence, not supplied by the proxy. No production-readiness claim.

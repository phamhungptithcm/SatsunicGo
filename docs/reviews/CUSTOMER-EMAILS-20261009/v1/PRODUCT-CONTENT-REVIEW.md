# Product Content Review — CUSTOMER-EMAILS-20261009-v1

## Scope

- Surface: 42 Vietnamese proposed transactional email/in-app messages; static HTML gallery, not deployed email renderer.
- Files: `TEMPLATES.vi.json`, `EMAIL-COPY.md`, `preview.html`, `PREVIEW-FIXTURES.json`, `INTEGRATION-PLAN.md`.
- Audience/task: Vietnamese customers following purchases, reviewing prices/costs, checking payment and delivery, asking support, managing Membership.
- Goal: understand the actual state and act without duplicate payments or mistaken success assumptions.
- Platform: cross-platform HTML email and plain text; gallery is a browser proxy. No Apple-platform HIG compliance claim. Repo's eight human-interface principles applied as quality reference.
- Reviewer: Codex, 2026-10-09. All fixture references/amounts/items/carrier/plan are fictional; not customer records.

## Context and evidence

Verified source boundaries are recorded file-by-file in `INTEGRATION-PLAN.md`. Price adjustment currently lacks outbox; setDeliveryEstimate intentionally emits none; support inbox read is not message-read evidence; refund entry is not bank-credit proof. Draft use remains conditional on sendGuard. Old design `docs/designs/ask-agent-architecture/DESIGN.md` is a proposal, not deployed-system evidence.

Assumptions: Vietnamese audience, brand spelling SatsunicGO as requested by user, vi-VN dates and Asia/Ho_Chi_Minh for customer-facing event timestamps after implementation. Prototype has inert disabled CTA buttons. In production these must become authenticated navigation links, never one-click financial commands. No contact phone/email address invented.

Unknowns/blockers: final sender/domain/reply-to, actual backend integration and provider delivery, real email-client rendering, transport quotas, bounce policy, unread watermark, material ETA threshold and customer preferences. Draft creation does not resolve these.

## Content inventory

`TEMPLATES.vi.json` is the full inventory: one record per scenario with subject/preheader/paragraphs/CTA, exact required variables, source/trigger/sendGuard/deliveryPolicy. `EMAIL-COPY.md` provides all 42 complete messages. Max placeholder-form body length 46 whitespace-delimited words; this is a draft measure, not a cap for rendered real data.

| Group | States included | User job | Meaning constraint |
| --- | --- | --- | --- |
| Đặt hàng | request/order received, quote ready/accepted | Find request and next step | No payment/purchase confirmation from saved request |
| Thanh toán | reported/confirmed/review/failed/expired, adjustment/allocation | Know what money was recorded and whether to act | Unknown is not failed; scope initial/full/balance explicit |
| Thay đổi đơn | proposed/accepted/rejected/applied/hold | Decide on exact proposal | Acceptance is neither payment nor application |
| Mua hàng & kho | partial/full purchase, received/issue | Know exact items and exception | Quantities authoritative; no all-items success from one line |
| Chi phí cuối | due/fully funded/excess | Review remaining cost | Approved final state; reservations may require extra line/block |
| Vận chuyển | dispatch/progress/ETA/failed/returned/partial/full delivery | Follow own parcels and resolve issues | ETA tentative; parcel vs order distinct; no other owner's manifest |
| Hủy & hoàn tiền | cancel/request/request cancel/refund recorded | Understand request vs money outcome | Not bank-credit evidence; staff request not falsely customer-authored |
| Hỗ trợ | order/ticket reply | Read and respond | No notes; unread requires message watermark |
| Membership | activation/expiry reminder/expired | Understand term and choose renewal | Approved lead time, no invented benefits or auto charge |
| Chứng từ | payment receipt/internal issued document | View correct financial snapshot | Receipt and internal statement distinct; neither tax invoice claim |

## State coverage

| State | Applicable | Content/rationale | Evidence |
| --- | --- | --- | --- |
| Default/action | Yes, prototype | Subject/body/CTA specific; filter labeled | preview desktop + screenshots |
| Loading/pending/disabled | Partial | Draft CTAs inert; payment/refund pending have distinct copy | template guards + browser proxy; real sender pending NOT_RUN |
| Empty/no result/true zero | Partial | 10 fixed groups nonempty; final zero balance explicit | validation inventory; missing values blocked in plan |
| Success | Yes | Persistence-based event only, partial states separate | source mapping + draft content |
| Error/recovery | Yes | Payment review/delivery failed/warehouse issue with actual next step required | source/sendGuard; production recovery NOT_RUN |
| Offline/stale/partial | Yes | Partial purchased/delivered; expired/unknown distinct | templates + suppress/reconcile plan |
| Unauthorized | Not a customer email type | Backend blocks delivery; avoid identity/resource leakage | integration plan; executable check NOT_RUN |
| Confirmation/destructive | Yes | Email navigates to actual app decision; cancellation/refund status only | plan; production links NOT_IMPLEMENTED |

## Data semantics

- Money: backend integer amount + typed currency; no floating arithmetic in templates. Unknown/null/zero cannot be interchanged. No guessed shipping costs.
- Payment scope: enum-derived language for catalog/full, mua hộ initial, sourcing difference, final balance or mixed. Draft `paymentScope` is a conceptual placeholder, not client-supplied arbitrary prose.
- Date: explicit customer timezone when relevant; no invented deadlines or refund SLAs. Prototype date values are examples, not scheduling rules.
- Freshness: action-required guard rechecks proposal/balance/subscription version before dispatch. Old email remains historical; app authoritative.
- Privacy: no names, street address, bank account, internal notes, transcript, raw errors or pixel; own parcel allocations only. Real transactional email still contains financial/item info and needs recipient ownership checks.

## Mandatory Human Interface Principles

Statuses below apply to the disclosed DRAFT/PROTOTYPE only, not production implementation.

| Principle | Status | Current evidence |
| --- | --- | --- |
| Purpose | PASSED | Each of 42 records identifies actual event, next action, destination and guard |
| Agency | PASSED | Price/quote choice stays in authenticated app; no email-triggered spending; Membership renewal optional |
| Responsibility | PASSED | Payment reported vs confirmed, refund record vs bank credit, no invented money/ETA; server guards explicit |
| Familiarity | PASSED | Vietnamese “đơn”, “kiện”, “báo giá”, “khoản thanh toán”; route names match app |
| Flexibility | PASSED | Browser proxy 320/390/1280; plain text contract; no required image, font or animation |
| Simplicity | PASSED | Draft bodies at most 46 placeholder-form words, one CTA; in-app-only prevents routine email noise |
| Craft | PASSED | All variables resolve in fictional fixtures; 42 cards no horizontal overflow at 320; plan-prefix and currency wraps corrected |
| Delight | PASSED | Gratitude at request/payment/delivery and relevant Membership points; problem messages calm and specific, no ceremonial filler |

## Platform fit and patterns

- Plain HTML email proposal with table layout/inline styles, text-first, no JavaScript in actual emails. Gallery filter script is preview-only; **do not send preview.html as an email**.
- Native select label and details keyboard tested in browser; disabled CTA deliberately communicates no live action. Email-client CTA must be a semantic anchor plus plain-text URL, not a disabled button.
- No Apple-only assets, copied reference artwork, or platform claims. Own brand typography/colors used for draft. Static optional metadata is outside email body.
- Feedback/interruption: user action + money + delivery exceptions high priority; routine progress opt-in/in-app. No generic marketing footer inserted into transactional copy.
- Accessibility proxy: semantic headings, labeled select, live count, reading order, no color-only meaning; screenshot/DOM check. Actual screen reader and Gmail/Outlook/Apple Mail tests NOT_RUN.

## Gate results

| Dimension | Draft/proxy status | Evidence/limitation |
| --- | --- | --- |
| Human Interface principles | PASSED | Table above, scope restricted to draft |
| Target-platform fit | PASSED | Email-style browser proxy; no native email-client claim |
| Meaning matches behavior | PASSED for proposed guards | Missing wiring explicitly blocks sending |
| Audience/business context | PASSED | Order/payment/parcel/refund flow source verified |
| Natural respectful tone | PASSED | In-context read-through, concrete statements and selective gratitude |
| Concise without meaning loss | PASSED | 42 short complete bodies, one CTA |
| Actions/state coverage | PASSED for draft | Conditional sending cases all guarded |
| Data semantics/privacy | PASSED for plan | No real data used; execution NOT_RUN |
| Accessibility | PASSED proxy / NOT_RUN actual AT | Browser heading/filter/keyboard, native email-client AT missing |
| Localization/expansion | PASSED sample / NOT_RUN real extremes | vi-VN fixtures, 320 width; hostile/maximum values planned for implementation |
| Terminology consistency | PASSED | Gói Gói fixture/grammar corrected; brand consistent |
| In-context verification | PASSED proxy | preview-desktop.jpg, preview-320.jpg, preview-390.jpg |

## Decision

- Draft copy/prototype review: **PASSED within the disclosed proxy scope**.
- Product Language Gate for actual application/email integration: **BLOCKED / NOT_IMPLEMENTED**. Needs approved implementation, exact production renderer, maximum-value/hostile-data tests, real email-client and accessibility evidence.
- No claim these templates are currently sent, production-ready, or customer-accepted.

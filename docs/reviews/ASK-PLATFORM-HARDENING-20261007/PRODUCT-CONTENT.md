# Product Content Review

Scope: existing Ask panel success/error/cancel/retry meaning; Vietnamese/English web product. No labels, copy, accessible names, styling or navigation changed by this task. The consumer now accepts an answer only after final validation. Existing error and pending strings remain authoritative.

Reviewer: current implementation agent, 2026-10-07. Reference: repository human-interface principles checked 2026-08-20, used as a web quality reference. Current Apple-platform compliance is not claimed.

## Context and facts

Browser fixture loads actual Ask component and actual compiled stream consumer with synthetic provider, mocked auth/commerce. Demo server-handler integration verifies workflow recovery, not deployed App Check. No policy completeness, provider cost or payment status is inferred from chat text. Source excerpts may remain partial. No customer-facing technical contract labels were introduced.

## Inventory and states

| State | Inventory / meaning | Evidence / status |
|---|---|---|
| Default | Existing Hỏi SatsunicGo field/control names unchanged | Enter/mobile browser PASSED |
| Pending | Existing information-checking message while final response is unresolved; no premature success | Browser before-final assertion, screenshots; PASSED |
| Success | Original answer text appears after stream/final agreement | Actual-consumer enter/mobile PASSED |
| Error/retry | Existing retained-question message and Thử lại; rejects mismatch/provider failure; retry settles | Actual-consumer error/draft PASSED |
| Close/cancel | Existing controls; closes pending panel, no page error | Browser close plus stalled cancellation units PASSED |
| Empty / offline | No new UI strings or empty/offline behavior designed | NOT_APPLICABLE to current string inventory; live offline browser NOT_RUN |
| Unauthorized | Existing server denial retained, no successful draft write | Synthetic demo identity/locked/mismatched-owner integration PASSED |
| Confirmation / persistence | No new confirmation UX; explicit submit invokes existing workflow; recovered draft is a saved draft, not purchase/payment | Demo draft → submit → recovery PASSED |

## Data semantics

Final answer validity comes from strict domain schema and final result agreement. A streamed success event alone is insufficient. A saved draft operation's result recovers its conversation version, not an order/payment. Result order IDs must match current owned conversation. Collected remains zero for newly requested custom order. Excerpts use original text and character bounds, never claimed as model-token counts. No arbitrary URLs, user IDs or financial write actions added.

## Human Interface principles

| Principle | Status | Evidence |
|---|---|---|
| Purpose | PASSED | Actual panel shows verified answer or actionable error; no premature success |
| Agency | PASSED | Browser close/retry and unit cancellation preserve control; no inferred consent |
| Responsibility | PASSED | Rejects mismatched final, failed provider and corrupt recovery; synthetic order remains unpaid |
| Familiarity | PASSED | Existing Vietnamese controls and terms preserved; inspected actual error screenshot |
| Flexibility | PASSED for scoped behavior | Mobile + desktop, Enter + close + draft browser states; language-neutral schema comparison; no new untranslated strings. Full screen-reader audit NOT_RUN |
| Simplicity | PASSED | No new controls or copy; existing retry/error path carries failure |
| Craft | PASSED for scoped behavior | Real rendered pending/error states inspected; after-retry assertion waits for completion; Unicode regression |
| Delight | PASSED | Draft preserved after failure, cancellation settles promptly; no decorative additions |

In-context screenshots: output/askplatform/enter.png, error.png, draft.png, mobile.png. Error screenshot inspected with view_image. Composer reduced-motion regression passed separately (ask109).

Limits: real provider phrasing, all locales, live offline and full assistive-technology audit not verified. This scoped review does not approve unfinished architecture features or production readiness.

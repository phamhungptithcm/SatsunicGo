# Product Content Review — checkout revision guard

## Scope and verified context

- Component: `src/features/cart/purchase-checkout.tsx`, one invalidation effect only; see CHANGE.patch.
- Audience/job: Vietnamese shoppers confirm mixed catalog/custom purchases and continue paying once.
- Locale/platform: vi-VN responsive web. Existing SatsunicGo blue/white/navy controls and semantics preserved. Apple HIG is not a web platform contract; no Apple-only expression is introduced.
- Reviewer: Codex root, 2026-10-09 local / 2026-10-10 UTC.
- Verified behavior: successful commit atomically sets activeCheckoutId and increments cart revision. The effect previously interpreted that expected increment as a new customer edit. Active checkout navigation now owns this state. Ordinary cart edits still invalidate the overview; server commit still revalidates owner, revision, hash, expiry, current prices and policy.
- Unknown: genuine SePay hosted UI/IPN and actual email delivery. This review does not certify them.

## Complete changed content inventory

No string bytes, labels, accessible names, monetary mappings or formatting were changed. One existing error's applicability changed:

| Location / state | Current and retained content | Correct applicability | Evidence |
| --- | --- | --- | --- |
| Checkout alert, stale overview | Giỏ đã đổi. Xem lại tổng quan trước khi thanh toán. | Display only for a changed cart revision when no active checkout owns payment navigation. | F1, CHANGE.patch; UI18 two-tab regression; UI11 post-fix commits. |
| Commit success transition | No error alert; navigate existing active checkout. | A committed checkout is an existing payment to resume, not a request to review again. | UI11/UI12/UI13; UI-DURABLE.json. |

## State coverage

| State | Applicability and evidence |
| --- | --- |
| Default/action | Overview shows server-authoritative items/recipient/total; UI03 and UI-OVERVIEW-MOBILE.jpg. |
| Loading/pending/disabled | Single flight, persisted retry command and disabled acknowledgement/payment controls retained; UI09/UI12 and source commit(). |
| Empty/no result/true zero | Region no-result and dependent reset observed UI06/UI08. Missing shipping is unknown, not zero; UI03. |
| Success | Paid completion follows server state, two order links + receipt; UI13–16 and durable ledger. |
| Error/recovery | Changed message only for actual stale cart; UI18. Decline/underpay keep safe recovery boundaries; UI10/UI19. |
| Offline/stale/partial | Unknown response retains same checkout, no optimistic paid state; UI12, synthetic SP timeout/lease tests. Offline browser network toggling was not run and is not claimed. |
| Unauthorized/forbidden | Owner/verified/locked checks unchanged; SePay direct-read/write and private-PDF rules tests pass. No new sign-in surface. |
| Confirmation/destructive | Acknowledgement before commit retained; no destructive UI change. UI09. |

## Data meaning and privacy

Source of truth is authenticated backend preview/commit and verified settlement, not return URL or cached cart. VND listing 1,650,000 + researched custom goods 2,900,000 + fee 145,000 = 4,695,000. Shipping estimates/uncollected amounts remain distinct. PDF time includes GMT+7, demo method explicitly says no real money; receipt is a payment confirmation and does not replace a tax invoice. Exact owner-only download/hash boundary is unchanged and tested. UI20 proves forged success does not turn underpayment into paid.

## Mandatory Human Interface principles

| Principle | Status | Current evidence |
| --- | --- | --- |
| Purpose | PASSED | UI11 continues to the committed payment instead of requesting an unnecessary overview. |
| Agency | PASSED | Actual changed cart still requires review and acknowledgement; UI18/UI09. |
| Responsibility | PASSED | Unknown/underpaid outcomes never claim paid; UI12/UI19/UI20 and durable ledger. |
| Familiarity | PASSED | Existing connected checkout stepper, Vietnamese terms and web controls preserved; screenshots and native DOM. |
| Flexibility | PASSED | Keyboard autocomplete and 390 px layout exercised; UI07/UI08/UI17. |
| Simplicity | PASSED | Removes a misleading interruption without adding copy or another confirmation. UI11. |
| Craft | PASSED | Actual post-fix commits and two-tab stale guard both checked; accessible alert retained. |
| Delight | PASSED | Less interruption while retaining the exact cart/recipient data; predictable completion and working order/PDF links. No decorative motion added. |

## Platform/pattern and gate checks

Writing/actions, respectful tone, brevity, terminology, data semantics, eight principles, target-platform fit and current in-context verification: PASSED for this delta. Web keyboard selection, accessible labels, error associations and status role observed; no color-only success. No changed localized string or text expansion requirement. No new motion, permission, onboarding or account prompt. Screen-reader speech, browser zoom/text scaling, RTL and full accessibility audit: NOT_RUN, outside this one-condition delta; do not claim full WCAG certification.

Rendered evidence: UI-PAID-DESKTOP.jpg, UI-PAID-MOBILE.jpg, UI-OVERVIEW-MOBILE.jpg, UI-UNDERPAY-MOBILE.jpg, UI-FORGED-RETURN.jpg; source hash in FINAL-MANIFEST.json. Actual normal pointer/keyboard interactions, not screenshots alone. Product Language Gate: PASSED for the revised applicability of the existing alert. Full provider/production acceptance remains BLOCKED separately.

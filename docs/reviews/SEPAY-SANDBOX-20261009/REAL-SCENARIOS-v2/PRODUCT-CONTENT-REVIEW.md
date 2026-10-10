# Product content and data semantics review

Date: 2026-10-09. Scope: corrective timestamp admission and terminal unpaid
cancellation replay, with regression review of existing payment/receipt surfaces.
Audience: Vietnamese customers reviewing products, recipient, payment and PDF.
Platform: existing React website; preserve its own blue/white/navy design system.
No product label, accessible name, visual design or PDF design changed in v2.
Apple platform compliance is not applicable and is not claimed.

## Inventory and behavior

| Location/state | Current meaning | v2 correction | Evidence |
|---|---|---|---|
| SePay paidAt, valid provider date | Vietnam local time for SQL; explicit offset for ISO | Same result for valid dates, including midnight, last second, leap day and fractional milliseconds | unit-final.json, valid clock boundary tests |
| SePay paidAt, malformed hour/minute/second | Must not become a different payment date | Reject 24:00:00 and components outside bounds before Date.parse | cycle1-clock-red.json and unit-final.json |
| Demo cancelled, repeated reconcile | Trusted provider has confirmed no payment | Return same cancelled state without rewriting checkout/cart or implying paid | cycle2-cancellation-red.json and integration-final.json |
| Existing paid/PDF UI | Paid only after durable proof/allocation; PDF failure is separate | No string change; source/SSR proxies retain actual order links and receipt recovery | purchase-checkout and purchase-pdf unit tests |

No currency, fees, time format, customer promise or real-payment wording was
invented. Sandbox remains sandbox. Unknown/review are not displayed as paid based
on these backend assertions. Full current rendered behavior is not certified.

## State coverage

| State | Status | Evidence or limitation |
|---|---|---|
| Default / valid timestamp | PASSED | Executable valid timezone and boundary fixtures |
| Pending / unknown / missing provider ID | PASSED | Emulator state and no-allocation assertions |
| Empty / zero | PASSED | Zero/fractional/invalid VND denied; missing provider evidence does not mean zero paid |
| Paid / PDF ready | PASSED | Synthetic allocation, private PDF and layout assertions |
| Invalid date / PDF failed / retry exhausted | PASSED | Bounded errors and state isolation tested locally |
| Cancelled replay | PASSED | No writes or later-cart unlock; wrong link rejected |
| Forbidden / locked | PASSED | Owner, guest, profile/access lock and private-rules tests |
| Actual route offline / focus / error announcement | NOT_RUN | Browser access denial; no indirect substitute used |

## Mandatory human interface principles

| Principle | Status | Current evidence / limitation |
|---|---|---|
| Purpose | PASSED | Preserve correct transaction day and stable cancellation result; no phantom charge |
| Agency | NOT_RUN | Backend retry works; actual customer retry/focus/navigation path not exercised |
| Responsibility | PASSED | Under/over/late/stale money retained for review, no false real-payment or real-email claim |
| Familiarity | PASSED | Existing VND, Vietnam timezone and order/receipt terms retained in tested proxies |
| Flexibility | NOT_RUN | Actual narrow viewport, keyboard and assistive-technology paths unavailable |
| Simplicity | NOT_RUN | No new UI, but current authenticated rendered composition cannot be signed off |
| Craft | NOT_RUN | Data boundaries tested; live errors, announcement, wrapping and focus still unverified |
| Delight | NOT_RUN | No added animation/copy; humane complete context cannot be assessed from source alone |

## Platform and pattern checks

Data semantics and privacy pass within executable backend/PDF/SSR proxies.
Writing/label edits, onboarding, Apple-specific expression, motion and new alerts
are NOT_APPLICABLE to this delta. Existing web interaction, responsive forms,
keyboard, screen reader, text scaling and offline patterns remain NOT_RUN for
full payment-route acceptance. No new control or tone claim is inferred from
thin borders, icons or screenshots. The original rendered-route blocker is
preserved, not bypassed by a proxy.

## Decision

Product Language Gate: **BLOCKED** for the full workflow. The timestamp/state
semantic correction has passing executable evidence; the required real in-context
UI dimensions above remain unavailable. No successful full UI/UX handoff or
production-ready claim is made. Resume those checks only in an authorized browser
environment; no repeat confirmation for already approved code fixes is needed.

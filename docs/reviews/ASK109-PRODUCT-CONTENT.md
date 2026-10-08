# ASK109 Product content and motion review

Vietnamese/English responsive web Ask composer and question bubble. Audience: visitor submitting a question. Current actual component rendered at desktop and390px using synthetic transport; not provider or production proof. Existing blue/white/navy design, native form/dialog, keyboard Enter and submit button retained. No added copy or duplicated accessible text. Changed error recovery semantics: question remains in panel with existing Retry; composer no longer repopulates; a newer unsent draft remains intact. Empty, invalid, busy/locked/commit guards retain prior behavior.

Inventory: composer Hỏi SatsunicGo / Ask SatsunicGo, Gửi câu hỏi / Send question; error text says question remains, Retry submits preserved turn; response/stop labels unchanged. No animation implies successful purchase, submission, payment or provider response. Cost/provider/privacy text unchanged. Turn aria-label and single question paragraph retained. Reduced motion disables new300ms spatial animation and existing CSS reveal. Existing live log/focus behavior retained. No new currency, metric, guarantee or persistence claim.

| Principle | Status | Evidence |
|---|---|---|
| Purpose | PASSED | Clear composer when accepted, visual origin-to-question relationship |
| Agency | PASSED | Error Retry and stop remain; new draft preserved during pending/preparation |
| Responsibility | PASSED | No provider/budget/auth/payment changes; no hidden duplicate transcript |
| Familiarity | PASSED | Web Enter/button parity and existing chat bubble |
| Flexibility | PASSED | Desktop/mobile, keyboard, reduced-motion browser cases |
| Simplicity | PASSED | One submitted question in panel, no repeated text in composer |
| Craft | PASSED | Original labels, aria-log, focus and error recovery retained; screenshots reviewed |
| Delight | PASSED | One short send transition; cancellation on close without delaying requests |

Meaning, tone, terminology, platform fit, localization, data/privacy, state coverage and in-context verification PASSED within changed scope. Apple-specific styling/HIG claim N/A. Screen-reader certification and full alternative-locale audit not claimed. Rendered evidence output/ask109/{enter,error,mobile,reduced,preparing}.png;8browser cases use actual Ask component and CSS, stub backend only.

Motion: WAAPI transform/opacity only,300ms cubic-bezier(0.2,0.8,0.2,1), actual composer/bubble rectangles after layout frames; no dependency, loop, persistent layers, accessibility clone or delay in data flow. Handle/frame canceled on new turn, close, unmount; no fill so cancel reveals ordinary content. Instrumented browser tests verify300ms trigger, no reduced-motion trigger and close cancellation. No FPS/mobile-hardware performance claim. Product Language/Motion Gate PASSED for scoped local change.

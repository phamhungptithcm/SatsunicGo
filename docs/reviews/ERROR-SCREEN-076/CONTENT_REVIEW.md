# Product Content Review — ERROR-SCREEN-076

Scope: shared render-error fallback; Vietnamese web UI for customers/staff recovering from an application render failure. Source: ErrorBoundary.tsx; web React19/TypeScript6/Vite8. Review date: 2026-10-06.
Platform: ordinary web main/heading/button; Satsunic white/royal blue/navy. Bundled Human Interface principles read as web quality reference; no current Apple-platform compliance claimed.

## Context and inventory

Verified: main.tsx wraps App and ToastHost in ErrorBoundary. Failed render replaces children. Button reloads current URL. No command retry, success claim, provider action, raw exception details, or private data is displayed. Root cause is unknown/out of scope.

| State/location | Content | Behavior |
| --- | --- | --- |
| Heading/error | Chưa mở được màn hình | Existing title retained; names the unavailable screen |
| Recovery description | Tải lại trang để thử tiếp. | Existing sentence retained, moved into separate paragraph |
| Primary button | Tải lại trang | Existing label retained; window.location.reload |
| Transaction caution | Nếu vừa gửi một thao tác, kiểm tra lịch sử đơn trước khi gửi lại. | Existing caution retained; does not imply operation failed or authorize duplicate submission |
| Accessible name | main references screenErrorTitle | Visible heading labels main; SVG is decorative aria-hidden |

Applicable states: render error, recovery action, hover, active, keyboard focus; persistent render failure returns same fallback after reload (observed deliberate fixture). Healthy children unchanged by source review. Offline does not assert connectivity cause; reload remains ordinary browser reload. Empty/loading/success/authorization/destructive confirmation are not states handled by this boundary. Data semantics: no values, metrics or state-changing command; operation outcome stays unknown. No locale expansion added; Vietnamese wraps naturally at320px.

## Human Interface principles

| Principle | Status | Evidence |
| --- | --- | --- |
| Purpose | PASSED | One clear failure heading and reload action |
| Agency | PASSED | Manual reload only; no automatic retry/timer navigation |
| Responsibility | PASSED | Transaction caution retained; no invented persistence guarantee |
| Familiarity | PASSED | Native labeled button with visible keyboard focus |
| Flexibility | PASSED | 320x740 and1280x800 browser views; no horizontal overflow;46px button; loaded reduced-motion rule disables animation/transition |
| Simplicity | PASSED | Short recovery text; separate readable caution |
| Craft | PASSED | Current desktop/mobile screenshots, AX tree, keyboard and reload checks |
| Delight | PASSED | Gentle sad parcel; bounded transform-only motion under5s; decorative only |

Platform fit, meaning/behavior, audience/context, natural tone, concise meaning, applicable states, privacy, terminology and in-context verification: PASSED within executed checks. Accessibility: native web semantics and keyboard/AX inspection PASSED; actual assistive technology NOT_TESTED. Reduced-motion browser rule inspected; OS setting toggling NOT_TESTED. Text zoom and non-Vietnamese locales NOT_TESTED; no new text/locale surface introduced.

Evidence: desktop.png, mobile.png; isolated preview mounted actual ErrorBoundary with a throwing child, production component CSS plus actual global CSS. This is disclosed isolated runtime evidence, not live backend or production evidence. No shared demo state was changed.
Decision: Product Language Gate PASSED for scoped Vietnamese web error surface. Residual: actual AT and OS preference toggle not tested.

Final user refinement: smaller illustration184px desktop/164px mobile, title30px maximum, tighter gaps, balanced caution lines. Rechecked current screenshots and no horizontal overflow.

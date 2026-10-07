# LOADING-082 Product Content Review

Surface: shared LoadingOverlay, Vietnamese web customers/staff waiting for an operation. Target React19/TypeScript6/Vite8. Approved2026-10-06. Actual labels unchanged: Đang xử lý…; Thông tin sẽ cập nhật khi có kết quả.; after10s Thao tác đang cần thêm thời gian. Existing polite/atomic status semantics retained. Decorative bar aria-hidden; no progress percentage, ETA, success claim or invented operation result. Inline LoadingState ring unchanged. API/auth/data semantics unchanged.

Applicable default/pending/long-wait/unmount/remount states observed in isolated real-component browser fixture. Button beneath overlay toggled loading, confirming pointer pass-through and retained focus. Actual320x740 and1280x800 no horizontal overflow; card280px. Loaded reduced-motion rule disables beam animation and leaves static indicator. OS preference toggle and actual assistive technology NOT_TESTED. Error/success/cancel behavior remains owned by callers; no action duplicated by loader. Timer cleanup on unmount remains clearTimeout, verified fresh initial copy after remount.400ms display delay in ToastHost unchanged.

| Principle | Status | Evidence |
| --- | --- | --- |
| Purpose | PASSED | Visible waiting status retained |
| Agency | PASSED | Overlay never traps focus or blocks recovery controls |
| Responsibility | PASSED | Indeterminate bar, no fake percentage/time/result |
| Familiarity | PASSED | Standard calm waiting card and horizontal indicator |
| Flexibility | PASSED | Mobile/desktop wrap, reduced-motion rule, native status semantics |
| Simplicity | PASSED | Compact280px card; original short copy retained |
| Craft | PASSED | Current screenshots, actual slow state/unmount/remount checks |
| Delight | PASSED | Gentle1.8s glide while pending, subordinate to status text |

Motion purpose: essential activity indication during pending operation; does not imply elapsed fraction/completion. CSS transform-only lifecycle stops with unmount; no animation timers/listeners added. Reduced motion remains static. Existing inline spinner and progress ownership unaffected.
Web platform fit and all applicable content dimensions PASSED within executed checks; bundled HIG principles used as quality reference, no Apple-platform compliance claim. Unknown backend outcomes remain unknown. Screenshots desktop.png/mobile.png/slow.png show isolated current component plus production global CSS; background controls are fixture. Production and backend NOT_TESTED.
Decision: Product Language Gate PASSED.

# Product Content Review — Google checkout sign-in

Scope: signed-out PurchaseCheckout/PurchasePayment, Vietnamese web customers signing in to continue checkout; 2026-10-09 Codex self-review. Preserve the product shell and existing Google Firebase flow. Non-Apple web conventions apply; no Apple-platform compliance claim. Sources: App.signIn, shared/firebase.login, actual localhost5207 browser DOM/screenshots and GOOGLE-SIGNIN-SOURCE-MANIFEST.json. Google current branding checked at https://developers.google.com/identity/branding-guidelines .

Verified: callback invokes GoogleAuthProvider popup; existing popup-blocked redirect/MFA/error handling and App concurrency/progress cleanup remain unchanged. New component only renders a native type=button and calls that callback. Assumption: current Vietnamese locale continues; the font subset is explicitly limited to this fixed label. Unknown: live Google OAuth provider result; NOT_RUN for this presentation-only task.

| Location/state | Previous | Current | Job and behavior |
| --- | --- | --- | --- |
| Both signed-out buttons, accessible name | Đăng nhập để tiếp tục | Đăng nhập với Google | Name the actual existing provider action; does not submit a payment |
| Decorative image | absent | empty alt | Avoid duplicate announcement of the visible Google label |

State coverage: default and keyboard focus verified in actual UI; native text and button accessible name agree. Hover/active styles source-reviewed, not separately automated. No animation. Pending/disabled/error/cancel/offline remain the existing App sign-in progress/error handler; no new promise or success claim. Successful sign-in switches the existing user branch. Empty/zero/financial-confirmation/forbidden-data content is not added. Live provider success/failure testing NOT_RUN, unchanged auth code source-reviewed. No displayed totals, data definitions, persistence, permissions, consent or currencies changed. There are no newly added metrics or zero/null interpretations.

| Principle | Status | Current evidence |
| --- | --- | --- |
| Purpose | PASSED | Label directly names signing in with the actual provider |
| Agency | PASSED | Native user-triggered button; existing cancellation/recovery retained; no forced login on render |
| Responsibility | PASSED | Sign-in never labelled payment success; local assets need no third-party rendering request |
| Familiarity | PASSED | Official current gradient G, white pill, Google Sans50014/20, thin border |
| Flexibility | PASSED | Native keyboard target/focus2px;44px height;actual320/390 CSS widths no overflow;visible text does not rely on icon |
| Simplicity | PASSED | One short action; no extra cards, labels or explanatory clutter |
| Craft | PASSED | Shared component in both branches; local image and font loaded;decorative alt;source/built asset license verified |
| Delight | PASSED | Compact calm control, no heavy shadow or motion;visual screenshot reviewed |

Evidence: output/google-checkout-signin-20261009/browser.json, payment-desktop.png, payment-mobile390.png, assets-check.json. All eight principles PASSED for the bounded new content; no user research is claimed. Product Language Gate PASSED.

# Product Content Review — inline cart Google sign-in

## Scope

- Surface/component: existing guest cart summary, shared PurchaseSignIn.
- Changed files: Cart.tsx and purchase-sign-in.css; interrupted centering additions removed from purchase route fallbacks.
- Audience/task/outcome: Vietnamese shoppers review their chosen items and sign in in place before explicitly continuing to checkout.
- Locale/platform: vi-VN, responsive web. Native button, visible keyboard focus, 44px target.
- Apple HIG: not an Apple platform; no Apple-specific component or expression introduced. Existing human-centered principles applied below.
- Reviewer/date: Codex self-review, 2026-10-09. Current candidate hashes in GOOGLE-SIGNIN-INLINE-SOURCE-MANIFEST.json.

## Context and evidence

Verified: Cart's guest branch already called signIn without navigation; authenticated branch alone navigates to checkout/payment. The same callback is now passed to the shared Google button. Cart rows and prices remain visible. Purchase route fallbacks still protect private information for direct links/lost sessions. App signIn has an in-flight guard, progress, catch and finally cleanup; Firebase retains popup/redirect handling. No routing/auth/backend change.

Assumption: production configuration continues to use the existing Google Firebase provider. Unknown: live OAuth/provider acceptance, not exercised here. In-context browser evidence is local demo only; no order/payment created.

## Content inventory

| Location/state | Before | After | User job | Behavior evidence |
| --- | --- | --- | --- | --- |
| Guest cart summary action | Đăng nhập để đặt mua | Đăng nhập với Google | Sign in using identified provider without leaving cart | Same signIn prop; browser /cart with product and total visible |
| Checkout/payment direct-link fallback | Existing Google button and heading | Same, centering additions removed | Resume protected destination | Existing !user guard and unchanged URL/callback |
| Accessible name | Old action text | Đăng nhập với Google; decorative image alt empty | One clear control name | Browser AX button, native button, type=button |

## State coverage

| State | Applicable | Content/rationale and evidence |
| --- | --- | --- |
| Default/action | Yes | Small Google action in summary; desktop screenshot |
| Loading/pending/disabled | Yes | Existing App progress and duplicate-flight guard retained; source reviewed. No new pending state |
| Empty/zero | Yes | Existing cart empty branch unchanged; no misleading login-only empty cart introduced |
| Success | Yes | Existing auth listener/success feedback and cart merge retained; explicit checkout action remains. Provider execution NOT_RUN |
| Error/recovery | Yes | Existing authError/redirectError and Firebase popup fallback retained; source reviewed. Provider failure execution NOT_RUN |
| Offline/stale/partial | Yes | Cart loading/unknown-price semantics and authenticated checkout guards unchanged |
| Unauthorized/forbidden | Yes | Guest action shown in cart; direct private purchase routes retain !user gate |
| Confirmation/destructive | No | Sign-in is not order submission; button type=button. No financial action added |

## Data semantics

- Source of truth: existing cart/auth modules. No arithmetic, currency, estimate, freshness or aggregation change.
- Null/unknown prices, quantity and totals unchanged; screenshot fixture is existing synthetic product 129.900 ₫.
- Privacy: no account/order data exposed to signed-out users; local logo/font avoid new third-party asset requests.

## Mandatory Human Interface Principles

| Principle | Status | Current evidence |
| --- | --- | --- |
| Purpose | PASSED | Provider and sign-in action explicit; item/total context visible |
| Agency | PASSED | Same callback; no auto-advance; continue shopping and cart editing remain available |
| Responsibility | PASSED | Action describes sign-in, no payment completion claim; private route guards retained |
| Familiarity | PASSED | Existing Google mark and compact sign-in control reused |
| Flexibility | PASSED | Native keyboard target, 2px focus ring; measured 44px height, no overflow at 320px |
| Simplicity | PASSED | One contextual action; no new sign-in route or full-screen centering |
| Craft | PASSED | Shared component, scoped CSS, aligned icon/text; desktop and mobile rendered evidence |
| Delight | PASSED | Calm small action preserves cart context; no additional page transition introduced |

## Platform fit and pattern checks

Responsive web fit PASSED: native semantic button, visible focus, accessible name, decorative icon, Vietnamese text. Existing blue-white cart design remains intact; neutral Google action is scoped to its own class. No Apple-only convention introduced.

| Pattern | Applicable | Result/evidence |
| --- | --- | --- |
| Labels and controls | Yes | PASSED: identified provider; button is not form submit |
| Feedback/interruption | Yes | PASSED: existing auth progress/error handling preserved |
| Alerts/consequential choices | No | NOT_APPLICABLE: no payment submission/change |
| Onboarding/contextual help | No | NOT_APPLICABLE: existing shopping surface; no new onboarding |
| Permission/privacy/accounts | Yes | PASSED: existing Google flow; no permissions expanded |
| Inclusion/accessibility/localization | Yes | PASSED: keyboard focus, 44px, vi-VN; 320px viewport; RTL not targeted |

## Gate results

| Dimension | Status | Evidence |
| --- | --- | --- |
| All eight principles and target platform | PASSED | Tables above; actual web screenshots |
| Meaning/behavior and business context | PASSED | Same signIn callback, no checkout auto-submit |
| Natural tone, brevity, terminology | PASSED | Đăng nhập với Google matches provider and shared component |
| Actions/states, semantics/privacy | PASSED | Existing auth and cart branches reviewed; execution limits explicit |
| Accessibility/localization | PASSED | 320px measurement: width 200.02, height 44, outline 2px; AX name correct |
| In-context verification | PASSED | output/google-signin-inline-20261009/cart-desktop.png and cart-mobile-320.png |

## Verification and decision

Local browser: product added to guest cart from catalog, /cart remains visible with item/total and Google button; no sign-in was activated. Keyboard Tab reaches button with blue focus ring. Desktop 1280 and mobile 320 document widths equal viewport widths. TypeScript, targeted ESLint, Prettier and diff checks pass. No screen-reader app/live OAuth/production execution; those are not claimed.

Product Language Gate: PASSED for this scoped presentation refinement. No content findings remain in executed checks. No owner decision required. Broader payment release readiness is outside this refinement.

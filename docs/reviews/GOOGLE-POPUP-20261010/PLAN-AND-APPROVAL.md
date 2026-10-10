# GOOGLE-POPUP-20261010 / v2

Plan ID/version: GOOGLE-POPUP-20261010/v2
Repository intelligence gate status: READY
Approval status: APPROVED
Approver: Human user in this chat
Approval timestamp or task reference: 2026-10-10; approval of step 1 followed by explicit popup-only instruction

## Approved outcome

Keep Google as the only provider. Login must stay on the current page, use Google One Tap or a native provider popup, blur the retained page while waiting, and preserve guest cart and unfinished input. Never redirect the main window as a fallback. Cancel, blocked popup, offline and unsupported embedded browsers need honest in-place recovery. Safari and mobile provider completion require real-device evidence, not synthetic browser claims.

## Verified impact and implementation

- `src/shared/firebase.ts`: `login` currently falls back to `signInWithRedirect`. Replace with a synchronous gesture-initiated, single-flight popup controller. Keep legacy redirect-result consumption for already-started historical sessions; no new redirect calls.
- `src/features/auth/google-popup-login.ts`: shared observable lifecycle, deduplication, safe errors, MFA handoff and dismissal. Every existing caller of `login`, including Ask and product comments, receives the same dialog.
- `src/features/auth/GoogleLoginDialog.tsx` and CSS: native accessible modal, blurred backdrop, pending/error/retry/close and copy-current-link recovery. No fake Google credential fields or embedded OAuth page.
- `src/features/auth/AuthPageBoundary.tsx`: retain guest-to-authenticated page instance; remount on logout or changing an authenticated account. Preserve server guards, owner checks, MFA, async generations and private component keys.
- `src/app/App.tsx`: connect shared dialog, boundary and popup-only progress; retain request form, checkout selection and Ask composer through guest login. No navigation on login success.
- `src/features/requests/RequestForm.tsx`: preserve in-memory inputs, step and images; re-read account-scoped pending attempts after login so removing the remount cannot hide uncertain commands.
- `src/features/ask/Ask.tsx`: retain unsubmitted composer input across guest login without carrying private order/authority/conversation state. Existing context invalidation stays.
- `src/features/cart/cart-store.tsx`: preserve volatile guest items across authentication when storage is unavailable; durable transfer remains fenced/idempotent and never claims success without acknowledgment.
- `src/features/auth/auth-feedback.ts`, `one-tap-controller.ts`: actionable popup/browser messages and ITP-compatible optional One Tap.
- Focused unit and browser tests, operational note and evidence in this directory.

Risk: medium; authentication UX and account-transition state. No server auth, rules, schema, payment, provider or dependency changes. No production deployment, commit/push, runtime restart, emulator reseed or extra server. Single owner; serial review personas, no delegation needed.

Approved paths:
- `src/shared/firebase.ts`
- `src/app/App.tsx`
- `src/features/auth/google-popup-login.ts`
- `src/features/auth/GoogleLoginDialog.tsx`
- `src/features/auth/google-login-dialog.css`
- `src/features/auth/AuthPageBoundary.tsx`
- `src/features/auth/auth-feedback.ts`
- `src/features/auth/one-tap-controller.ts`
- `src/features/requests/RequestForm.tsx`
- `src/features/ask/Ask.tsx`
- `src/features/cart/cart-store.tsx`
- `tests/unit/google-popup-login.test.ts`
- `tests/browser/google-popup-login.spec.ts`
- `tests/unit/one-tap-controller.test.ts`
- `docs/reviews/GOOGLE-POPUP-20261010/**`

## Validation and rollback

Test popup success, duplicate click, blocked/closed popup, error retry, dismissed/late results, MFA, invalid provider payload, and no navigation. Browser tests on shared 5207 with synthetic SDK transport exercise native dialog focus, blur, 320/390/1440 widths, request fields/images/step, Ask input, cart and logout/account-switch isolation in Chromium, Firefox and WebKit where installed. Provider login on physical iPhone/Samsung/Xiaomi etc remains a separately reported gate. Run focused regression, TypeScript, scoped lint and frontend bundle into ignored task output. Review actual changes against saved dirty-worktree baseline, never restore entire files. Rollback is reversal of task hunks only; no migration.

## Centered clean refinement (user approved)

The user supplied the pending-dialog screenshot and requested centering and cleaner presentation. Apply explicit native-dialog inset/margins, compact centered typography, blue action, responsive text sizes and keyboard containment. Remove duplicate App error toast because the Google dialog already owns recovery. No authentication method, credential UI, server or production change.

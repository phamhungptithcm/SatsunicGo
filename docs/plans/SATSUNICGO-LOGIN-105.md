# LOGIN-105 — Smooth staff MFA onboarding and automatic code verification

Status: APPROVED by the human reply `Approved` on 2026-10-07. Approval and implementation evidence are recorded separately under `docs/approvals/SATSUNICGO-LOGIN-105.md` and `docs/reviews/LOGIN-105/`.

## Outcome and boundary

After Google sign-in, an authorized active, unlocked staff member with verified absent TOTP enrollment receives a compact setup dialog: QR, small manual key and adjacent copy button, then six-digit code input. Customers receive no mandatory enrollment prompt. Customers who already enrolled MFA still complete Firebase's sign-in challenge. Normalize typing/paste and submit a complete six-digit code automatically, with a manual retry control and one request in flight.

This adds staff onboarding UX; it does not establish a new server authorization policy. Preserve authoritative staff-role checks, App Check, verified Google identity, and existing recent-MFA backend requirements. Enrollment count never proves a recent MFA session. No provider/IAM/rules, payment, AI, production data, dependency or release configuration changes. Deployment requires completion of verification and review; this plan covers implementation and validation only.

## Current source evidence and gap

- `src/features/auth/LoginChallenge.tsx` handles enrolled-factor sign-in in a native dialog, but requires explicit submit.
- `src/features/auth/Security.tsx` already generates TOTP QR, manual key and copy feedback; enrollment is only available through the security page and requires explicit submit.
- `src/app/App.tsx` verifies `staffAccess/<uid>` before opening Workspace. `src/shared/staff-access.ts` rejects inactive, locked or malformed access. No verified staff MFA-required field exists in this contract.
- `src/shared/firebase.ts` captures Google popup/redirect MFA challenges; `src/features/auth/mfa.ts` protects replacement challenge identity.
- `functions/src/auth/guards.ts` requires recent token MFA evidence for protected operations. Preserve this independently of enrollment.
- LOGIN-093 approved inline existing-factor challenges and preservation of enrollment policy, not this new automatic staff enrollment flow.

## Implementation by file

1. Add a shared auth enrollment controller/component under `src/features/auth/`: generate a TOTP secret for the current Firebase user only; keep secret in memory; QR with manual fallback; copy control; verified enrollment readback and identity/attempt guards. Reuse in Security and the staff dialog to prevent competing setup sessions.
2. `src/app/App.tsx`: observe current-user authoritative staff access and enrollment state; show required staff setup only after successful reads and nonempty authorized roles. Gate staff Workspace until setup succeeds; offer sign-out instead of silently granting entry. No prompt for absent/denied/locked staff metadata. On lookup failure provide retry without pretending the user is a customer or granting staff access. Clear all setup state on identity/access changes.
3. `LoginChallenge.tsx`, `Security.tsx` and shared enrollment component: submit exactly six normalized digits once per attempt; synchronous flight lock; no repeated automatic retry of a rejected code; permit edit/paste of a fresh code and explicit retry. Guard every completion against old user, challenge or attempt. Preserve factor selection, cancellation where optional, code expiry handling and keyboard focus.
4. Auth dialog styles: balanced compact QR/key/input layout, responsive sizing, accessible labels and focus, reduced motion. Staff setup dialog has a clear sign-out exit. Validation errors stay adjacent to input; transient feedback uses the existing toast mechanism without shifting the page.
5. Add focused unit/browser regression tests using existing shared port 5207 and synthetic provider fixtures. Do not create another server or change shared demo data.

## Failure paths and risk

Risk: HIGH (authentication UX). Do not log/store secrets or OTPs, or capture real secret-bearing screenshots. Handle QR rendering failure with manual entry, clipboard rejection, invalid/expired code, network failure, recent-login requirement, role revocation, logout, resolver replacement and uncertain enrollment acknowledgement. If enrollment succeeds but readback fails, retry readback rather than enrolling twice. SDK-required Google reauthentication starts from an explicit user gesture. A setup success toast must follow verified enrollment, not merely successful validation.

## Validation and acceptance

- Authorized unenrolled staff: setup dialog appears after login, QR/manual/copy present, complete code auto-submits once, verified success resumes intended staff screen.
- Customer without MFA: ordinary login proceeds with no required setup. Existing enrolled customers retain required Firebase challenge.
- Existing enrolled staff: sign-in challenge uses the same automatic submission behavior; no duplicate enrollment prompt.
- Invalid code, paste, incomplete input, rapid edits, duplicate events, cancellation, stale callbacks, replacement resolver and identity/access changes cannot produce duplicate submissions or stale success.
- Keyboard focus/escape behavior, mobile layout, QR fallback, clipboard failure, loading/retry/sign-out paths verified in context.
- Run focused tests, typecheck/build and lint; mandatory product-content review and fresh final implementation review. Iterate fixes within approved scope until passing; report remaining provider verification separately.
- Emulator/fixture checks do not prove real Google/Firebase MFA. Real provider enrollment/sign-in acceptance remains NOT_TESTED unless observed with user-entered credentials and codes.

## Intelligence and rollback

Baseline: `22214b64743d6abbcaf4162382b6e53605348adc`. CodeGraph/CocoIndex were stale; CocoIndex health failed. One incremental refresh attempted; use bounded source/test/Git evidence if unavailable. Do not claim complete indexed coverage. See LOGIN-105 intelligence brief for refresh result.

Rollback application changes as a bounded commit; do not unenroll existing factors or disable provider MFA. Keep unrelated worktree artifacts untouched.

SDK reference: https://firebase.google.com/docs/auth/web/totp-mfa

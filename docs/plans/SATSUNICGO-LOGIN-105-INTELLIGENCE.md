# LOGIN-105 Repository Intelligence Brief

Gate: DEGRADED. Baseline main `22214b64743d6abbcaf4162382b6e53605348adc`; stale indexed baseline `700317e`. CodeGraph health passed but stale; CocoIndex health failed and stale. One bounded refresh attempted. No stale index claim is used as current evidence.

Bounded source tracing: App auth callback → staffAccess snapshot → staffRoles → Workspace; Firebase Google login → captureMfa → LoginChallenge → resolver verification; Security → getSession → TOTP secret/QR → enrollment → user reload/readback. Firebase SDK 12.19.0, React 19.3.0, TypeScript 6.0.3, Vitest/Playwright. Staff metadata is read-only to the caller under firestore.rules; QR/OTP are ephemeral client state. Existing backend recentMfa checks use token evidence, not enrollment count.

Source inspected: App.tsx, Security.tsx, LoginChallenge.tsx, mfa.ts, auth-feedback.ts, CrmAccessScreen.tsx, firebase.ts, staff-access.ts, functions/src/auth/guards.ts, provider-release-gate.ts, firestore.rules and package.json. Prior plan/approval LOGIN-093 establishes the existing-factor challenge boundary. Relevant tests: mfa-login093.test.ts, auth-guards.test.ts, security-enrollment076.spec.ts and login093 fixtures.

Unknowns: real provider enrollment/session behavior and current-account MFA policy cannot be established from fixtures. Resolve with real provider acceptance after approved implementation, without exposing credentials. New UX must not imply backend staff MFA enforcement where no verified server policy exists.

Quality profiles: web/frontend, TypeScript, security, product content, accessibility and failure/concurrency paths. Shared local listener 5207 is reused; no demo reset/reseed/restart authorized. Scope and tests are recorded in SATSUNICGO-LOGIN-105.md. App implementation awaits plan approval.

# Production candidate 2026-10-09

Base: `0d6e721698608eebb36b0b2f68021c3054d97d1c`.

Scope: reviewed checkout and guest/account cart recovery, recipient projection and order tracking, compact catalog/image presentation, notification preferences and server-side Resend delivery with consent, immutable claims, unknown-outcome fences, forward-only cutover and shared daily/rate limits. Production packaging excludes five emulator exports and retains seven unrelated capability holds. No production payment, AI, SMS, global maintenance, rules/index migration or historical queue drain activation.

Frozen source: 967 files, manifest SHA-256 `d989f561a110cb55da432477b76ae24f72d45fdba8788360e940280aaebc8f07`. Local evidence for that exact source: 2353 unit tests; frontend/backend strict typechecks; ESLint; 112 release/config tests; production-config build; 351 artifact files; 98 SDK endpoints; standalone runtime/source comparisons. Current root and packaged Functions audits passed the existing high/critical threshold; moderate/low advisories remain. These local checks do not replace this branch's real CI or production verification.

Release decision: BLOCKED / NOT_READY. PRE-001 requires legitimate candidate recipient producer-to-CRM acceptance with staff MFA and spoken screen-reader acceptance of the address combobox. The current Auth Emulator cannot enroll the required TOTP factor. Main push triggers automatic production deployment and must wait for the required acceptance or an explicit reviewed owner decision on the rollout sequence. This branch is for CI and review only.

After release eligibility: use the unchanged normal production workflow, verify exact artifact/Hosting/Function source revisions, approved secret version/IAM/schedulers and inactive settings, then perform only the approved forward cutover and owner-opt-in canary. Preserve accepted/unknown/consent/quota state during rollback and disable sending first. Provider acceptance does not establish inbox delivery.

Memory candidates: None. Token usage and actual billed cost: Unavailable.

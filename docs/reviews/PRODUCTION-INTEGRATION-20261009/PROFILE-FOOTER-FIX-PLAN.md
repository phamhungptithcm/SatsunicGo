# Profile footer layout correction

Status: APPROVED IN-SCOPE FIX. The notification r5 approval explicitly covers
`src/features/profile/profile.css`; subsequent hardening authorization covers
bugs found in that surface. Approval evidence is recorded in
`docs/reviews/NOTIFICATION-SUBSCRIPTIONS-20261009/APPROVAL.md` and its
`HARDENING-PLAN.md`. No additional behavior, release, or infrastructure scope.

Observed: the actual signed-in demo notification page rendered its privacy
footer links as narrow vertical columns. `Profile.tsx` uses a semantic `footer`
with class `profilePrivacy`. Global footer styles supply viewport-based
horizontal padding and 160px bottom padding, while the profile override only
sets top padding. This consumes the profile content width.

Repository intelligence: CodeGraph queried first for Profile structural impact,
then CocoIndex for footer/CSS evidence; critical conclusions verified directly
in `Profile.tsx`, `profile.css`, and `src/styles/global.css`. Current READY receipt
is `/private/tmp/satsunicgo-email-ui-report-rig-ready.txt`; concurrent document
edits can make metadata stale, so the scope remains bounded to these sources.

Implementation: replace `padding-top: 18px` with `padding: 18px 0 0` only in
`.profilePrivacy`. Keep flex wrapping, gaps, semantics, links, text and global
footer unchanged. Before-change CSS SHA-256:
`45e33dd4c707e8113ad34b544b5be214d59acd2fced860fa3d2776f6f74ab76c`.

Risk: low visual-only change; no authentication, consent, persistence, payment,
provider, dependency, or runtime configuration changes. No changed strings.

Verify: actual demo rendering at desktop, 390px and 320px; record real DOM
viewport and document width, computed padding, footer/link geometry, keyboard
focus and screenshots. Rebuild the clean candidate and refresh source-bound
product/final review evidence. Historical screenshots remain historical.

Rollback: restore the previous single padding declaration. No data migration.

Plan ID/version: ANALYTICS-CONSENT-COMPACT-20261008 v5
Repository intelligence gate status: DEGRADED — stale optional indexes; source verified
Approval status: APPROVED
Approver: Human user in this chat
Approval timestamp or task reference: User message “apporved” after preview v5 in chat 01a11e57-a0fb-7692-997e-699fbff9a43e

Approved scope: Apply the approved compact bottom-right consent preview, top-right X, approved Vietnamese content and proportionate validation.

Approved paths:
- `src/shared/AnalyticsConsent.tsx`
- `src/shared/analytics-consent.css`
- `docs/reviews/ANALYTICS-CONSENT-COMPACT-20261008/**`

Required constraints: Preserve unrelated WIP, consent storage/events, explicit opt-in, tracking/auth gates and public-route conditions. X only hides the panel; no implicit consent. Keep reopen and withdrawal. Reuse shared 5207; no restart, deployment, backend, schema or dependency changes.

Approval validator limitation: the legacy script requires READY even though current repository-intelligence policy explicitly allows DEGRADED source-based work. Do not fabricate READY. This record retains the actual gate and direct human approval.

## Explicit user-directed delta — v6

The user requests automatic initial display and complete disappearance after X/decline/accept, with no lingering floating button. This directly authorizes removing the reopen-button implementation in the already-approved consent files. Concrete plan: retain unknown-consent auto-display, hide on X without opt-in, store no/yes on explicit choice, render nothing afterward; visiting /privacy provides the existing consent dialog as the withdrawal/change path. Update the paragraph to name the actual privacy page instead of the removed button. Preserve all other controls, tracking/auth gates and Ask clearance. Verify all three dismissals, reload and privacy withdrawal. No additional application file, API or backend change.

Supporting dependent content correction: src/features/content/PrivacyPage.tsx, replace only the outdated instruction referring to the removed floating button with the actual privacy-page withdrawal path. No other privacy policy content changes.

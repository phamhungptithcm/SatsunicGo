# Product content review — r2 prototype

Scope: Vietnamese web mockup, contact form, profile notification settings and four email/SMS template previews. Audience: SatsunicGo customers selecting optional communication. Reviewer: Codex, 2026-10-09. Reference: `docs/previews/NOTIFICATION-SUBSCRIPTIONS-20261009.html`, `CONTENT-INVENTORY.json`, prototype script template map, saved r2 screenshots. Actual application and delivery: NOT_IMPLEMENTED.

Facts: checkout has recipient phone; current inbox is owner-scoped; current email worker has verified identity checks and a legacy marketing consent guard. Proposed confirmation/preferences are new behavior. Assumptions: Vietnamese destination phone, account email, SMS limited to order updates, required invoices/security governed separately. Unknowns: sender approval, provider/cost, live delivery, final classification of required communication.

## Inventory and states

| Surface | Proposed content/state | Meaning and evidence |
| --- | --- | --- |
| Form | Information labels, two unchecked optional choices, short SMS hint, manage link, Continue | Both purposes named for email; SMS explicitly excludes marketing. Four combinations tested in browser; no order/backend action |
| Phone | Số nhận SMS; ownership/verification hint; invalid-format feedback | Number differs from delivery contact; browser rejects empty number when SMS chosen. Format only, no ownership verification claim |
| Settings | Three named choices, off/pending/active labels, save/cancel, change-number hint | Current prototype state, not provider state; disabling promotions preserves active email order/SMS preferences |
| Confirmation | Email request/activated, SMS verification request/activated | Single-use token/OTP policy specified in plan; buttons explicitly simulate confirmation |
| Templates | Subject, heading, body, CTA, notes, sender, manage link and SMS body | All four versions opened in rendered page. Order message requires real handover event in implementation. Placeholder links inert |
| Error/offline/loading/unauthorized | Save failed/changes retained; disconnected; loading; sign-in boundary | Browser checked. Failed save leaves committed preference unchanged; offline disables save; private settings hidden when unauthorized |
| Opt-out | Tắt tất cả tin tùy chọn; in-app/required communications scope | Reversible prototype operation. No SMS sent after opt-out; opt-out SMS-shaped message is in-app preview only |
| Static controls | Preview navigation, width toggle, scenario selector, mockup labels | Review-only UI; not production product controls |

Default, focus, checked, disabled and pending states use native input/button semantics. Empty state is not subscribed, not a fabricated active subscription. No timing, percentage, delivery estimate or free-SMS claim. Offline recovery is simulated; real network behavior NOT_RUN. No destructive data action.

Data semantics: local in-memory state reset on reload; no stored customer data. `customer@example.com` and phone entry are synthetic fixtures. No external scripts, fonts, tracking, SMS or email requests. Required email delivery classification is a proposal, not proven current policy. Do not send the preview as an email.

## Mandatory principles

| Principle | Status | Evidence |
| --- | --- | --- |
| Purpose | PASSED | Two rows immediately after contact inputs; r2-form.jpg |
| Agency | PASSED | Unchecked, optional, independent SMS choice, separate profile email purposes, cancel and revoke |
| Responsibility | PASSED | Mockup-only label, pending before confirmation, account phone ownership, no delivery claim |
| Familiarity | PASSED | Native web checkbox, inputs, disclosure and account preference rows; Shopee/Amazon sources in plan |
| Flexibility | PASSED | Rendered 320/390 and default desktop, wrapped copy, persistent labels, keyboard Space interaction |
| Simplicity | PASSED | User-requested r2 removes hero/sidebar; secondary detail in disclosure |
| Craft | PASSED | Rendered forms/settings/templates, all four choices and failure-state checks; JS syntax verified |
| Delight | PASSED | Short copy, no forced celebration, no animation or extra required opt-in step |

Platform fit: cross-platform web. Apple-derived principles used only as quality reference; native Apple HIG compliance NOT_APPLICABLE. Brand colors remain #163cff/#111c35. Typography/control semantics suit web forms, no copied platform assets.

Pattern checks: labels/control names, feedback, optional permission consequences, reversible settings, contextual disclosure, privacy and Vietnamese language PASSED for prototype proxy. Browser AX tree exposes label text, checkbox state, control names and role=status feedback. Full screen-reader user testing, actual email client rendering, multilingual expansion and 200% text scaling NOT_RUN; these remain implementation acceptance work. Text wrapping verified at 320/390. No quantitative data/RTL change.

Decision: prototype content and in-context preview reviewed; **production Product Language Gate BLOCKED / NOT_IMPLEMENTED**. This is reviewable design evidence only, not successful application handoff. No current email/SMS integration acceptance claim.

r3 evidence refresh: unchanged functional strings; revision label only changed. Font Arial 400, smaller visual controls; all eight principle mappings retained for prototype, Craft/Flexibility rechecked via current desktop form/settings and 390/320 viewport DOM measurements. Native mobile input height remains 38px and checkbox/switch rows 40px. Full AT and 200% scaling still NOT_RUN. Production gate remains BLOCKED / NOT_IMPLEMENTED.

Current r5 supersedes earlier proxy: preview is source-derived from actual app components and rendered shell. New strings: email and SMS choice labels; notification tab/header/description; three preferences; destination/verification hints shown only after SMS selection; preview-only toolbar/save feedback; personal-profile settings link. Existing app strings and design preserved. User explicitly removes the SMS marketing exclusion helper and general manage/confirmation helper; SMS checkbox still names order updates exclusively, and selecting a checkbox makes no active-subscription claim. All eight principles remain PASSED for this scoped design proxy: Purpose/Agency via two optional unchecked labels and independent preferences; Responsibility via no send/save claim and controlled-number hint; Familiarity via actual app components; Flexibility via native controls/390/320; Simplicity via requested helper removal; Craft via current browser and generator checks; Delight via reduced repetition. Source-backed component render is not authenticated integration or live notification proof. Current images r4-profile.jpg and r5-checkboxes.jpg. Actual product-language integration gate BLOCKED / NOT_IMPLEMENTED; AT/full email client/200% scaling still NOT_RUN.

# Product Content Review — Staff invitation and directory

Scope: StaffAccess, StaffInvitationAccept, invitation status labels and transactional email template. Vietnamese web CRM, enterprise blue/navy visual system. Audience: owner inviting/managing staff and employee explicitly accepting with their verified Google account. Reviewed 2026-10-17 against current-source browser harness. Apple platform/HIG compliance: not applicable; eight human-interface principles applied as human-centered guidance, with native HTML/web controls.

## Verified context and limitations

Creating an invitation queues a mail job; it does not prove inbox delivery. Acceptance binds a verified account but does not grant CRM permissions. Owner assigns permissions separately. Directory includes legacy grants (active, inactive, locked and departed) and accepted invitees without grants, with bounded pagination. Separate departure records server time and disables access. Temporary lock does not set departure date. Original historic dates absent from the database remain unknown. Email sender is disabled by default; review rendered browser surfaces and email source, not a live mailbox.

Browser evidence is a disclosed proxy: current TSX/modules on existing shared 5207 through Playwright routes; direct real Firestore handler transactions; Google identity/MFA/callable transport/email adapter simulated. Existing shared runtime serves another checkout and was not restarted or overwritten. No native screen reader/speech-input test or live OAuth test was performed.

## Content inventory and state mapping

`CONTENT-INVENTORY.json` lists Vietnamese source strings/JSX fragments with exact file and line, including inherited role-editor text reviewed in context. The following maps every functional group to its intended meaning and evidence:

| Group/location | States and content | Meaning and evidence |
| --- | --- | --- |
| Invite heading, email label/help, submit | Email tài khoản Google; Gửi lời mời; Đang xử lý… | Owner addresses exact verified Google email; Gmail aliases are not silently merged. Browser full-flow and unit schema tests. |
| Invitation list headings, actions | Lời mời (collapsible history); Gửi lại lời mời; Thu hồi lời mời; Phân quyền/Chỉnh quyền; paging/reload | Pending/expiry/revocation are distinct from acceptance and access. Version checks, rate limits, superseded invitation fence. |
| Invitation delivery/status labels | Đang chờ gửi email; Đang gửi email; Dịch vụ email đã nhận yêu cầu gửi; Chưa xác nhận được kết quả gửi; Đã dừng gửi email | Provider acceptance does not claim inbox delivery. Unknown send cannot automatically resend. Worker concurrency/unknown/retry integration tests. |
| Owner action feedback | Durable queued/revoked/departed messages; uncertain-operation recovery; validation/MFA/version/quota errors | No success before durable response; preserve operation and input for ambiguous transport. Distinct departure error refers to staff, not invitation. Browser lost-response tests. |
| Directory header/table/data | Họ tên, Email, Ngày tham gia, Ngày nghỉ việc, Vai trò, Trạng thái, Thao tác | Google provider name/avatar, profile fallback only when Google name absent; unsupported dates show Chưa ghi nhận, missing identity clearly named; pagination includes whole directory. |
| Directory states | Đang tải nhân viên…; Chưa tải được…; Chưa có nhân viên nào; Xem thêm nhân viên | Loading/error not conflated with empty. Refresh retains data on error; row changes disabled while refreshing. Backend/browsers test paging. |
| Departure confirmation | Ghi nhận nghỉ việc; hôm nay và ngừng quyền làm việc; lịch sử được giữ lại; Hủy; Xác nhận nghỉ việc | Explicit separate action, permission effect and retained history. Owner cannot depart self. Readback verifies active=false/date set, lock independent. |
| Role editor heading/help/steps | Selected employee identity; Kiểm tra quyền hiện tại; role/scopes; Được phép làm việc; Khóa; Lưu quyền nhân viên | Existing role editor retained, initial grant requires accepted invitation, legacy identity does not claim an invitation happened. Unknown save disables switching employees. |
| Recipient signed-out/loading | Đăng nhập với Google; current account; explicit acceptance button | No automatic acceptance or implicit grant. Native button/heading/label structure. |
| Recipient accepted/error states | Accepted awaits assignment; wrong-account switch; invalid/expired/revoked; retry checking status | Safe non-disclosing account mismatch, explicit recovery and no raw provider errors. Browser wrong account, expiry, revoke, malformed-link checks. |
| Transactional email | Invitation purpose/link; correct Google account; tối đa 7 ngày; owner grants later; ignore unexpected invite | Opaque locator not bearer token; exact-email authorization server side. TTL begins when queued, so wording says maximum seven days. Unit content assertions. |

## Data semantics

- Joined date is acceptance time copied to first access grant. Legacy joinedAt absent is unknown; account creation is not used to invent employment dates.
- Departure is a separate owner command timestamp; active=false, prior roles/history retained. No retroactive date picker or rehire workflow in scope.
- Dates use `vi-VN` and viewer's browser timezone. Browser test timezone is explicitly Asia/Ho_Chi_Minh; timestamp persisted in milliseconds. Null is “Chưa ghi nhận”; zero is not inferred from missing fields.
- Full name prioritizes Firebase Auth google.com provider displayName over older users fields. Avatar uses that Google provider photoURL, validated HTTPS Google host; name/profile fallback for absent Google identity remains bounded. Batch lookup is at most20 identities per page. Firebase Auth reflects the most recently synchronized Google sign-in identity, not a direct live Google API fetch. Email retains the existing profile/accepted address with Auth fallback. Owner authorization is rechecked after Auth. No public directory, client writes denied. Avatar is decorative beside the readable full name, suppresses referrer, loads lazily and falls back to initials for absent/broken photos. No arbitrary image host/proxy is exposed.
- Role label maps existing domain roles to Vietnamese. Unknown roles show “Vai trò chưa xác định”. Lock, active and departure have distinct text.

## State coverage

| State | Result/evidence |
| --- | --- |
| Default/action | PASSED — labeled native forms and named actions, owner/recipient screenshots. |
| Loading/pending/disabled | PASSED — live status, disabled pending actions and identity switching; browser checks. |
| Empty/no result | PASSED — only after successful empty response; list failure does not show false empty. |
| Success | PASSED — durable accepted/granted/departed readbacks. |
| Error/recovery | PASSED — denied/invalid/expiry/revoke/MFA/version and transport paths; unit/integration/browser. |
| Offline/stale/partial | PASSED — unavailable response retains idempotency; current-version conflict protects mutations; explicit load-more. |
| Unauthorized | PASSED — exact-email recipient and owner/MFA guards; no invitation enumeration to outsiders. |
| Consequential confirmation | PASSED — departure consequence and retained history explained; cancel available. |

## Eight principles

| Principle | Status | Current in-context evidence |
| --- | --- | --- |
| Purpose | PASSED | Invitation → acceptance → assignment explicitly explained; directory provides requested employment data. |
| Agency | PASSED | Explicit acceptance, switch-account, retry/reload and cancel-departure; no automatic grant. |
| Responsibility | PASSED | Grant/lock/departure and unknown delivery distinguished; confirmation explains access effect; unknown dates honest. |
| Familiarity | PASSED | Vietnamese business terms, native table/form, established blue/navy CRM styles. |
| Flexibility | PASSED | 1440/390/320 widths, CSS zoom200%, keyboard tab/focus, horizontally scrollable labeled table. |
| Simplicity | PASSED | Email-first onboarding and selected employee; employee table first, collapsible invitation history and staged role editor, no UID entry for new staff. |
| Craft | PASSED | Long synthetic email wrapping, status/error text, accessible table headers, date/null semantics and recovery verified. |
| Delight | PASSED | Preserved input and understandable recovery, clear next step, no false success or unnecessary celebration. |

## Platform and pattern checks

Native web labels/buttons, focus-visible, region/table caption/column scopes, status/alert live regions and keyboard navigation are present. Table uses horizontal scrolling on narrow screens without page overflow. Vietnamese text wraps; no English-only sentence concatenation, Apple-only control or protected expression introduced. No added animation; reduced-motion impact not applicable. RTL/locales beyond current Vietnamese are not introduced or claimed supported. Assistive technology evidence is browser accessibility tree and native semantics, not a manual screen-reader certification.

All applicable content gates: PASSED for meaning/behavior, audience, tone, brevity, actions/states, data semantics/privacy, terminology, keyboard/semantic accessibility, Vietnamese text expansion, platform fit and in-context proxy verification. Live email/client rendering and deployed shell remain NOT_VERIFIED and outside this local acceptance boundary.

## Decision

Product Language Gate: PASSED for current-source local scope, confirmed by matching seven-case browser receipt and independent cycle3 review. Evidence: owner-1440.png, owner-390.png, owner-320.png, recipient-320.png, owner-granted.png, directory-departed.png and browser-results.json. Fixes: table shrink/overflow; honest email TTL; no false acceptance claim for legacy staff; departure-specific failure copy; disable stale/pending row actions. No additional owner decision needed within approved scope.

UI refinement approved in the same task: compact email form, directory above collapsed invitation history, remove repetitive role guidance card, smaller row buttons and textual status badges. Harness wraps current modules in workspaceShell/workspaceContent to apply the actual CRM selectors; only shell/sidebar navigation is omitted. Current screenshots verify compact spacing and all required columns.

Google identity delta: integration test links synthetic google.com provider data in Auth emulator and proves Google name overrides stale users/displayName; unit test rejects non-HTTPS, credentials and lookalike/non-Google hosts; browser test stubs a Google avatar response and failed image, verifying name, image and initials fallback. `directory-google-avatar.png` is synthetic preview evidence; no real Google photo fetch in test.

Final source manifest: `638284e570731a60a8bef99b4ebd20c2bc4187a51750796f2fb6a70d8eeaa529`. Existing hosting CSP allows the tested primary Google avatar host lh3.googleusercontent.com; other Google image hosts can fall back to initials. No hosting/security policy expansion was made.

## Release candidate refresh

Rechecked on clean latest-main integration (base fff83392), Node22, shared5207 proxy. Seven browser cases passed; after adding the missing required marker and placing it inline with the email label, focused required-label/domain tests10/10 and responsive/keyboard/recovery browser1/1 passed. Updated owner320/390/1440 and recipient320 screenshots reviewed. Current content inventory regenerated. Source binding is RELEASE-SOURCE-MANIFEST.json; the prior manifest above identifies historical local review only. Product meaning and eight principle findings remain applicable. Production settings/email read returned404, so actual email remains disabled; queued never means sent.

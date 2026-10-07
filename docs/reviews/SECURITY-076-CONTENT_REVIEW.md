# Product Content Review — SECURITY076

Scope: Vietnamese web account security and account navigation; people configuring an authenticator. Task: scan or enter a private setup key, confirm a current six-digit code, recover safely. Source: Security.tsx, AccountRail.tsx, App.tsx, security.css. Review date: 2026-10-06. Product Language Gate and write-product-content applied. Apple HIG is a human-centered reference; Apple-specific platform conventions are not applicable to this web UI.

## Context and evidence

Verified: Firebase enrollment is awaited; refreshed user factor count is the status source. QR is produced locally with installed qrcode using SDK-generated otpauth URI. No remote QR service, storage, clipboard, analytics or logging. Cancellation clears component state and invalidates pending generation. Switching user or unmounting invalidates async state updates. A submitted enrollment cannot be undone by UI cancellation: cancel is disabled during verification. Real provider enrollment and release remain separate human/provider gates.

Assumptions: compatible authenticator installed on a second device or manual entry supported. No usability study or screen-reader session claimed. Synthetic keys/images only. Complete source-extracted string inventory: SECURITY-076-STRINGS.json. Existing sidebar destinations and names are preserved. Dynamic count has unit “ứng dụng xác thực đã đăng ký”; displayed count reflects Firebase factor records, presently TOTP-only UI, no inferred zero.

## Content/state inventory

| State | Content and purpose | Behavior evidence |
| --- | --- | --- |
| Default/action | Bảo mật tài khoản; Thêm ứng dụng xác thực | Existing page job and explicit enrollment action |
| Pending/disabled | Đang xử lý…; Đang tạo mã QR…; Đang xác nhận… | Only pending operation; submit requires six digits |
| Loading/unknown | Đang kiểm tra; Chưa xác định | Reload pending or failed; unknown does not become zero |
| True zero | Chưa bật | Successful reload yields no enrolled factor |
| One/multiple factors | Đã bật; count of registered apps | Refreshed SDK state, not generation or entered OTP |
| QR/manual | Quét mã QR; Không quét được mã?; Khóa thiết lập | Image local; details collapsed, automatically opens on QR failure |
| Privacy | Giữ riêng mã QR và khóa thiết lập… | No copying/saving real material in development evidence |
| Wrong code/retry | Mã chưa được xác nhận… | Generic safe retry, no fabricated expiry diagnosis |
| Offline/provider error | Chưa tạo được thiết lập…; Chưa xác thực lại được… | Exception, recover by Google reauthentication |
| Partial enrollment/reload | Ứng dụng đã được đăng ký nhưng chưa tải được trạng thái mới… | Enrollment passed, reload failed; material cleared, no enabled claim |
| Success | Đã bật xác thực hai bước. | Enrollment succeeded AND refreshed count positive |
| Existing challenge | Xác nhận mã; Đã xác nhận mã xác thực. | Challenge resolution does not imply new enrollment |
| Unsupported challenge | Tài khoản cần phương thức xác thực khác… | No supported TOTP hint: submit disabled and handler rejects empty factor |
| Unauthorized | Đăng nhập với Google để quản lý bảo mật tài khoản. | No user/no challenge yields sign-in guidance, no setup |
| Cancel/change user | Hủy thiết lập | Clears QR/key/input/error/message, stale callback guard |
| Destructive | NOT_APPLICABLE | No factor removal or irreversible data deletion UI |
| Navigation | See complete string inventory | Router links unchanged, active security/profile aria-current |

## Data semantics and privacy

Count is live refreshed Firebase enrolledFactors.length, no currency/time aggregation. Null is loading or unavailable; zero only follows successful reload. Six digits are current authenticator code, not a stored credential. Source user email appears only within locally generated account QR per SDK. No raw provider errors rendered. Real screenshot key is never reused in fixtures. Generated synthetic screenshots have no production identity or authentication capability.

## Mandatory Human Interface principles

| Principle | Status | Current evidence |
| --- | --- | --- |
| Purpose | PASSED | Heading, summary, two ordered steps; rendered390/768/1440 |
| Agency | PASSED | Explicit add, manual alternative, cancel before submission, disabled cancel during submit |
| Responsibility | PASSED | Privacy guidance; unknown/reload failure does not claim enabled; fake fixture only |
| Familiarity | PASSED | Existing account rail, native form, details disclosure, Google action |
| Flexibility | PASSED | QR/manual paths; mobile sidebar; 200percent scaling; keyboard tests |
| Simplicity | PASSED | One enrollment card, two steps, collapsed key, primary confirm |
| Craft | PASSED | Retry/partial/cancel/identity/challenge states; labels, focus, alert/status, quiet zone |
| Delight | PASSED | Calm success message, balanced card spacing and restrained blue/navy palette |

## Platform fit and pattern checks

Web native buttons/inputs/details/router links; canonical white/light-gray, royal-blue163cff, navy111c35. No Apple-only controls, brand assets or copied product text. Writing/labels, feedback, privacy/account onboarding, consequential actions and inclusion patterns PASSED within tested scope. RTL and additional translations NOT_APPLICABLE: this scoped surface is Vietnamese LTR. Full assistive technology QA NOT_TESTED; semantic labels/status/alert and keyboard focus checked in Chromium.

## Gate results and verification

Meaning/behavior, audience, natural respectful Vietnamese, concision, actions/state coverage, privacy/data semantics, terminology, target-platform fit, localization/text scaling and in-context verification: PASSED within the observed scope. Accessibility: semantic and keyboard checks PASSED; screen-reader/device scanning NOT_TESTED. Eleven synthetic browser tests exercise actual source component. PNG evidence SECURITY-076-390/768/1440-synthetic.png; desktop/mobile images visually inspected. At200percent zoom no horizontal overflow; reduced-motion disables account animation. Vision independently decoded the synthetic screenshot QR to exact expected URI.

Decision: Product Language Gate PASSED for scoped UI. Findings fixed: mobile secondary navigation hidden; loading failure misleadingly pending; supported-factor validation; shared CSS needed on direct Profile route. Residual: real MFA enrollment requires human completion; deployment readiness is NOT_READY. No further owner design decision required.

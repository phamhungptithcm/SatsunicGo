# SECURITY077 Product Content Review

Scope: Vietnamese web MFA setup, requested compact copy and visible manual key/copy icon. Human user directly requested this delta2026-10-06. Target: existing SatsunicGo web palette/layout, native inputs/buttons and accessible icon label. Apple-specific HIG contracts NOT_APPLICABLE; eight human-centered principles applied. Source-extracted complete inventory: SECURITY-077-STRINGS.json. Underlying SECURITY076 auth/identity/cancel/retry behavior retained.

Verified current behavior: QR generated locally; manual secret always visible underneath, small monospace text. Icon same flex row, accessible “Sao chép khóa thiết lập”. Clipboard write only on explicit click; pending/done/failed truthful feedback; cancel/success/identity invalidates stale feedback. Clipboard contents remain after explicit copy, no automatic overwrite/clear. No logs, storage, network QR service, or real-key screenshots. Assumption: user has compatible authenticator, no new device usability evidence.

Changed copy: remove redundant Settings eyebrow, page explanatory paragraph, zero-factor explanatory paragraph, decorative shield, two step captions/headings and manual disclosure. Intro shortens to “Dùng ứng dụng xác thực để nhận mã đăng nhập.” Manual label “Khóa nhập thủ công”; privacy “Không chia sẻ mã QR hoặc khóa này.” Copy feedback “Đang sao chép…”, “Đã sao chép”, “Không sao chép được. Chọn khóa để sao chép thủ công.” Field “Mã xác thực 6 chữ số”. Challenge gets accurate code-entry hint, never QR instruction without QR.

| State | Result/evidence |
| --- | --- |
| Default/zero/one/multiple | Refreshed-status badge preserved; no inferred zero |
| Pending/disabled | Existing operation disables preserved; copy pending disabled |
| Success | Explicit clipboard Promise resolved; independent MFA success requires provider+reload |
| Error/recovery | Clipboard rejection or missing API enters manual recovery; no false copied message |
| Offline/partial/unknown | Existing safe SDK/reload error handling preserved |
| Cancel/change user | Key/QR/code/copy feedback removed; pending copy callback guarded |
| Unauthorized | Existing sign-in guidance, no secret |
| Destructive | NOT_APPLICABLE; no factor deletion |

Data semantics: manual key is current SDK secret, not OTP; OTP field remains six digits. Badge is refreshed SDK enrollment presence, null unknown/loading; no fabricated count/status. No currency/period/aggregation. Privacy boundary explicit manual disclosure authorized by user and short warning retained.

| Principle | Status | In-context evidence |
| --- | --- | --- |
| Purpose | PASSED | QR, manual row and OTP focus actual task |
| Agency | PASSED | Visible manual alternative; explicit copy/cancel; no automatic clipboard write |
| Responsibility | PASSED | Private key warning, accurate clipboard failure, no fake success |
| Familiarity | PASSED | Existing sidebar, native icon button with name, labeled field |
| Flexibility | PASSED | QR/manual/copy; keyboard and200percent;390/768/1440 |
| Simplicity | PASSED | Redundant captions/prose removed; one compact key row |
| Craft | PASSED | Pending/failure/late response states; focus, alert/status and wrapping |
| Delight | PASSED | Calm inline copy feedback, balanced QR-centered card |

Platform fit/writing/feedback/privacy/account patterns: PASSED, canonical white/navy/blue and web semantics. Accessibility semantic labels/focus/keyboard PASSED; full screen-reader session NOT_TESTED. Vietnamese LTR, no additional translation/RTL scope. Natural tone, terminology, actions, privacy/data semantics, text scaling and in-context dimensions PASSED. Synthetic PNGs SECURITY-077-390/768/1440-synthetic.png; mobile/desktop visually inspected. Current browser test coverage includes clipboard success/rejection/late response in addition to prior11MFA cases. No live secret captured.

Product Language Gate PASSED for scope. No owner design decision pending. Real Auth enrollment/production rollout remain separate, unverified by synthetic evidence.

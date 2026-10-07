# LOGIN-105 Product Content Review

## Scope and evidence contract

Audience: staff setting up MFA after Google login; customers choosing optional MFA; existing-factor users confirming sign-in. Locale/platform: Vietnamese web, native HTML dialog and ordinary web forms. Royal blue/navy/light SatsunicGo design remains authoritative. Apple principles are a human-centered reference; no Apple-platform compliance claim or copied platform expression.

Current evidence: `tests/browser/login105.spec.ts` uses the actual App and auth components on shared5207 with explicitly synthetic Firebase/Firestore/QR transports. Real provider credentials, secrets and production data are never used. Synthetic rendered screenshots: `output/login105/setup-{320,390,1440}-synthetic.png` and `setup-zoom-synthetic.png`. In-context keyboard, focus, native dialog, live-role, pending/disabled, error/retry, customer/staff and cached-authority paths are exercised. Screenshot inspection covered narrow/mobile composition. Real Google/Firebase enrollment and sign-in remain NOT_TESTED; screen-reader software and non-Chromium browsers remain NOT_TESTED.

## Verified behavior and assumptions

Server-confirmed active/unlocked nonempty staff roles select mandatory onboarding. Enrollment absent/unknown/enabled remain distinct. Customers receive no mandatory popup. A complete normalized six-digit input submits once; rejection clears that transient OTP and restores focus. QR and manual key exist only during setup; copying is explicit. Confirmed enrollment is read back before success. Ambiguous transport failures require readback before another attempt. A shared account flight prevents competing enrollment, including when staff rights arrive during optional setup. Required staff onboarding can be exited by signing out; optional setup can be cancelled. Server authorization, App Check and recent-MFA proof requirements remain unchanged.

Assumption: existing authoritative staff role contract is the staff classification source; no new policy field is invented. Enrollment is not proof of a recent MFA token. No product language claims server-wide MFA enforcement or production/provider readiness.

## Changed content inventory

| Location/state | Current content | User job and behavior evidence |
| --- | --- | --- |
| Staff dialog title | Bảo mật tài khoản nhân viên | Identify the account task; appears only for confirmed staff needing setup/lookup recovery. |
| Staff onboarding description | Thêm ứng dụng xác thực để tiếp tục vào không gian nhân viên. | Explain the client Workspace gate and the next action. |
| Staff lookup recovery | Chưa kiểm tra được bảo mật và quyền truy cập. Thử lại. | No invented absence/success; retry creates a new authority read. |
| Lazy dialog setup | Đang mở thiết lập… | Indeterminate load; no progress percentage or ETA. |
| Staff exit | Đăng xuất / Đang đăng xuất… | Existing real logout action; mandatory setup has an explicit exit. |
| Required initial/readback wait; optional authority wait | Đang kiểm tra bảo mật… | Wait for current authority and any enrollment already running. |
| Optional page while required popup is active | Hoàn tất thiết lập trong cửa sổ bảo mật. | Avoid two forms/secrets; native dialog owns setup. |
| Optional unavailable authority | Chưa kiểm tra được bảo mật. / Kiểm tra lại quyền | Retain customer login; retry only optional security/authority inspection. |
| Status reload failure | Chưa tải được trạng thái bảo mật. Kiểm tra lại. | Implemented status retry, no mandatory page reload. |
| Secret generation requiring recent login | Xác thực lại với Google để tiếp tục thiết lập. | Google popup starts only from a user action. |
| Other generation failure | Chưa tạo được thiết lập. Thử lại. | Generation did not complete; explicit retry. |
| Provider acknowledgement but absent readback | Chưa xác nhận được trạng thái bảo mật. Kiểm tra lại. | Do not claim enabled or send a second enrollment. |
| Acknowledgement then reload/token failure | Ứng dụng đã được đăng ký nhưng chưa tải được trạng thái mới. Kiểm tra lại. | Distinguish acceptance from fresh state; retry reads only. |
| Unknown enrollment acceptance | Chưa xác nhận được thiết lập. Kiểm tra lại trạng thái để tiếp tục. | No assertion of invalid input when transport failed. |
| Enrollment session expiry | Phiên thiết lập đã hết hạn. Xác thực lại với Google để tiếp tục. | Old QR cleared; user-controlled reauthentication, then fresh setup. |
| Invalid OTP | Mã chưa đúng hoặc đã hết hạn. Nhập mã mới để thử lại. | No background retry loop; fresh input retriggers once. |
| Sign-in network failure | Chưa kết nối được. Kiểm tra mạng rồi thử lại. | Do not label a network failure an invalid code. |
| Confirmed absence after uncertain request | Chưa đăng ký ứng dụng xác thực. Thử thiết lập lại. | Fresh SDK read/token refresh confirms absence before restarting. |
| Status retry action | Kiểm tra lại / Đang kiểm tra… | Readback only while acceptance is confirmed or unknown. |
| Copy feedback | Empty reserved row / Đang sao chép… / Đã sao chép / Không sao chép được. Chọn khóa để sao chép thủ công. | Existing words; reserve line space to avoid shifting the OTP input on ordinary copy. |
| Success feedback | Đã bật xác thực hai bước. | Existing toast, now shared with the security view only after verified positive readback. |
| Google login toast | Đã đăng nhập. | Existing text; suppressed while an MFA resolver remains pending. |

Inherited QR alt text, manual-key label, copy accessible name, privacy notice, OTP label/placeholder, required marker, verification pending text, optional cancel and existing sign-in expired/unsupported descriptions remain meaningful and were reviewed in context. Errors/labels are associated with their input; icon-only copy has an accessible name. Secrets/OTP are never evidence data except explicitly synthetic fixture material.

## State coverage and data semantics

Default/setup, loading/disabled, empty enrollment, verified success, invalid input, generation/clipboard/QR failure, network/unknown acceptance, expired session, unauthorized/revoked/locked access, cancellation and sign-out are covered. Cached roles cannot establish new staff authority; CRM offers retry instead of an endless spinner. Zero factors means verified absence, null means checking/unknown; neither is converted to enabled. Count is SDK enrollment state, not session MFA proof. There are no monetary/date/metric changes. No destructive account removal or automatic unenrollment occurs.

## Mandatory Human Interface principles

| Principle | Status | Current in-context evidence |
| --- | --- | --- |
| Purpose | PASSED | One setup dialog with QR, manual key/copy and OTP; customer account page remains optional. |
| Agency | PASSED | Staff sign-out exit, customer optional setup/cancel, explicit retries and user-gesture Google reauth; no looping rejected OTP. |
| Responsibility | PASSED | Privacy note, explicit clipboard action, ephemeral secret and verified outcomes; unknown acceptance is not disguised as failure/success. |
| Familiarity | PASSED | Native web dialog, labelled numeric OTP with one-time-code autocomplete, standard buttons and existing toast. |
| Flexibility | PASSED | Typing/paste, manual key when QR fails, clipboard failure recovery, 320/390/1440 widths, 200% zoom and reduced-motion browser checks. |
| Simplicity | PASSED | Shared setup surface, no duplicate heading/status card inside popup; automatic six-digit verification removes an extra action. |
| Craft | PASSED | Focus after errors/cancel, stable copy row, current authority/error states and shared page readback; synthetically rendered/keyboard-tested. |
| Delight | PASSED | Immediate clear feedback and preserved route; no invented progress, interruption or marketing copy. |

## Pattern and gate results

Writing/actions, feedback level, consequential exit, contextual onboarding, privacy/accounts, accessible labelling/live roles, natural respectful Vietnamese, terminology, brevity, actual state semantics and in-context verification: PASSED for this web scope. Platform fit: PASSED using project-native web controls. Vietnamese wrapping/text scaling passed; full multilingual/RTL localization is NOT_APPLICABLE to this Vietnamese-only change. No claim of exhaustive assistive-technology accessibility; native semantics/keyboard are the observed evidence.

Product Language Gate: PASSED for the scoped implementation proxy. Source hashes, final test receipts and review cycles are recorded in the neighboring candidate/check/final-review files. Live-provider acceptance is explicitly separate.

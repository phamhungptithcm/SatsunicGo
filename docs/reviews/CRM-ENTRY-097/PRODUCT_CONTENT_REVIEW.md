# Product Content Review — CRM-ENTRY-097

Scope: Vietnamese web CRM entry for authorized staff. Approval: docs/approvals/SATSUNICGO-CRM-ENTRY-097.md. Target: React web, native buttons/links, existing brand blue/navy, not Apple controls. Reviewed 2026-10-06.

Verified: Google login, root MFA challenge and staffAccess active/locked/roles boundary remain authoritative. Missing MFA is not proven as the reported root cause. No real Google account or OTP was inspected. The design is user-approved; usefulness beyond tested tasks is an assumption, not user research.

## Content inventory
All new component labels, headings, status/error copy and safe provider feedback below. Existing MFA copy is unchanged and regression-tested. Brand Satsunic / Go / CRM and decorative arrows are unchanged semantics.

| Source | Content | Job and evidence |
| --- | --- | --- |
| CrmAccessScreen.tsx | Chưa có quyền CRM | State/action mapping in source; rendered entry or synthetic browser projection |
| CrmAccessScreen.tsx | Chưa thể mở CRM | State/action mapping in source; rendered entry or synthetic browser projection |
| CrmAccessScreen.tsx | Không gian làm việc | State/action mapping in source; rendered entry or synthetic browser projection |
| CrmAccessScreen.tsx | Liên hệ chủ doanh nghiệp để được cấp quyền nhân viên. | State/action mapping in source; rendered entry or synthetic browser projection |
| CrmAccessScreen.tsx | Chưa kiểm tra được quyền truy cập. Thử lại để tiếp tục. | State/action mapping in source; rendered entry or synthetic browser projection |
| CrmAccessScreen.tsx | Đăng nhập bằng tài khoản nhân viên để vào CRM. | State/action mapping in source; rendered entry or synthetic browser projection |
| CrmAccessScreen.tsx | Truy cập CRM | State/action mapping in source; rendered entry or synthetic browser projection |
| CrmAccessScreen.tsx | SatsunicGo CRM | State/action mapping in source; rendered entry or synthetic browser projection |
| CrmAccessScreen.tsx | Đang khôi phục phiên đăng nhập… | State/action mapping in source; rendered entry or synthetic browser projection |
| CrmAccessScreen.tsx | Đang kiểm tra quyền CRM… | State/action mapping in source; rendered entry or synthetic browser projection |
| CrmAccessScreen.tsx | Đang mở đăng nhập… | State/action mapping in source; rendered entry or synthetic browser projection |
| CrmAccessScreen.tsx | Tiếp tục với Google | State/action mapping in source; rendered entry or synthetic browser projection |
| CrmAccessScreen.tsx | {busy ? "Đang mở đăng nhập…" : "Tiếp tục với Google"} | State/action mapping in source; rendered entry or synthetic browser projection |
| CrmAccessScreen.tsx | Nhập mã xác thực để hoàn tất đăng nhập. | State/action mapping in source; rendered entry or synthetic browser projection |
| CrmAccessScreen.tsx | Dành cho tài khoản được cấp quyền | State/action mapping in source; rendered entry or synthetic browser projection |
| CrmAccessScreen.tsx | Kiểm tra lại quyền | State/action mapping in source; rendered entry or synthetic browser projection |
| CrmAccessScreen.tsx | Dùng tài khoản khác | State/action mapping in source; rendered entry or synthetic browser projection |
| CrmAccessScreen.tsx | Bảo mật tài khoản | State/action mapping in source; rendered entry or synthetic browser projection |
| CrmAccessScreen.tsx | Tài khoản khách hàng | State/action mapping in source; rendered entry or synthetic browser projection |
| CrmAccessScreen.tsx | → | State/action mapping in source; rendered entry or synthetic browser projection |
| CrmAccessScreen.tsx | ← Về website | State/action mapping in source; rendered entry or synthetic browser projection |
| auth-feedback.ts | Đã đóng cửa sổ đăng nhập. Bạn có thể thử lại. | State/action mapping in source; rendered entry or synthetic browser projection |
| auth-feedback.ts | Một cửa sổ đăng nhập đang được mở. Tiếp tục trong cửa sổ đó. | State/action mapping in source; rendered entry or synthetic browser projection |
| auth-feedback.ts | Chưa kết nối được Google. Kiểm tra mạng rồi thử lại. | State/action mapping in source; rendered entry or synthetic browser projection |
| auth-feedback.ts | Đăng nhập Google chưa sẵn sàng trên trang này. Liên hệ quản trị viên. | State/action mapping in source; rendered entry or synthetic browser projection |
| auth-feedback.ts | Tài khoản chưa thể đăng nhập. Liên hệ quản trị viên. | State/action mapping in source; rendered entry or synthetic browser projection |
| auth-feedback.ts | Chưa đăng nhập được. Hãy thử lại. | State/action mapping in source; rendered entry or synthetic browser projection |

## State coverage

| State | Result | Evidence |
| --- | --- | --- |
| Default/action | PASSED | Real /crm/orders Google action, account and website links |
| Loading/pending/disabled | PASSED | restoring/checking source states; pending button and MFA disable in browser/unit |
| Empty/no result | NOT_APPLICABLE | Not a data list; denied roles distinct from read failure |
| Success | PASSED | Synthetic MFA resolution continues checking, no premature authorization claim; Workspace remains behind staffRoles |
| Error/recovery | PASSED | Safe network/popup code mapping, retry/switch account, invalid MFA and cancellation browser |
| Offline/partial | PASSED | Network failure offers retry, permission read failure distinct from denial; no fabricated authorized data |
| Unauthorized | PASSED | Owner-granted staff permission instruction; denied state tested |
| Destructive | NOT_APPLICABLE | No destructive actions |

Data semantics: no metrics, currency or dates added. Permission source is staffAccess and staffRoles. Unknown/loading/error never means granted access. No provider payloads, credentials or OTP retained by new feedback helper.

## Human Interface principles

| Principle | Status | Evidence |
| --- | --- | --- |
| Purpose | PASSED | One staff Google action; customer path quiet and distinct |
| Agency | PASSED | MFA cancel/reopen, access retry, account switch and return link |
| Responsibility | PASSED | Explicit granted-role requirement, no MFA bypass, safe mapped errors |
| Familiarity | PASSED | Google logo, native web controls, existing CRM terminology |
| Flexibility | PASSED | Actual 320/390/720/1440 screenshots, keyboard navigation and reduced-motion check |
| Simplicity | PASSED | Icon/title same row; one concise instruction; no generic overlay on CRM |
| Craft | PASSED | Heading reflow, role alerts/status, read-error/denied separation, formatter/compiler/lint |
| Delight | PASSED | Calm feedback, no blame or forced celebration; compact balanced card |

Platform fit PASSED: web-native focus/links/buttons and product brand. Apple HIG platform-specific contract not applicable; bundled human-centered principles used. No Apple assets/trade dress.

Pattern checks: writing/controls, contextual help, feedback/interruption, privacy/accounts and inclusion PASSED within rendered/keyboard/source evidence; consequential destructive alerts NOT_APPLICABLE. Vietnamese wrapping/reflow PASSED; RTL/other locales NOT_APPLICABLE to this scoped Vietnamese screen. Screen reader device and real-provider flow NOT_TESTED.

Gate dimensions: principles, platform fit, meaning/behavior, audience/business, natural respectful tone, concise structure, actions/states, data/privacy, accessibility within keyboard/semantics scope, localization/reflow, terminology and in-context verification PASSED. Evidence: entry-320.png / entry-390.png / entry-720.png / entry-1440.png and tests/browser/crm-entry097.spec.ts (actual entry plus disclosed synthetic auth states).

Decision: Product Language Gate PASSED for local approved scope. Residual limitation: synthetic provider/MFA evidence is not live Google acceptance. No owner decision required for local implementation.

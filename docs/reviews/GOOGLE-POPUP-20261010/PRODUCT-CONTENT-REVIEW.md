# Product Content Review

## Scope

Google login lifecycle dialog and browser/cart recovery; Vietnamese customers continuing shopping or unfinished work. Target: cross-platform web, React native HTML dialog; blue-white-navy SatsunicGo identity. Current rendered evidence: Chromium 1440x1000, WebKit/Firefox 390x844, all engines 320x720 at 200% root text. This is a web implementation, not a native Apple UI; Apple HIG-derived principles were applied as human-centered references, with no native HIG compliance claim. Reviewer: Codex, 2026-10-10.

## Context And Evidence

Verified: popup starts inside the original click, main URL stays unchanged, first guest login retains component memory, private account transitions reset it. Provider credentials remain entirely in the Google-owned window. Pending dismissal does not cancel Firebase's still-owned request; copy says to close Google to cancel. Retry starts only when the previous request finishes. Unknown: real Google provider completion, private-mode policies and mobile OS keyboard/window management. Browser provider is synthetic and cannot prove those.

## Content Inventory

| Surface/state | Added or changed content | Job and behavior evidence |
| --- | --- | --- |
| Dialog title | Đăng nhập với Google | Names the only provider; real credential entry stays outside our dialog |
| Pending | Tiếp tục trong cửa sổ Google. | Native popup fixture opens before promise waits |
| Pending help | Trang này vẫn giữ nguyên. Đóng cửa sổ Google nếu bạn muốn hủy. | Exact URL and draft preserved; provider window closure cancels the request |
| Pending/error exit | Quay lại trang | Dismisses only local overlay; browser popup remains user-owned |
| Error recovery | Thử lại với Google; Sao chép liên kết | Retry/copy are available only after failure; exact public URL only |
| Error help | Bạn có thể thử lại. Nếu mở từ ứng dụng, sao chép liên kết rồi mở bằng trình duyệt trên điện thoại. | Offers user-controlled external-browser recovery, never silently redirects |
| Copy success | Đã sao chép liên kết. | Announced only after clipboard resolves |
| Copy failure | Chưa sao chép được. Bạn có thể sao chép liên kết trên thanh địa chỉ. | Clipboard rejection tested; no false success |
| Popup blocked | Trình duyệt đã chặn cửa sổ Google. Cho phép cửa sổ bật lên cho trang này rồi thử lại. | Error code mapping and in-place retry tested |
| Unsupported browser | Trình duyệt này chưa hỗ trợ đăng nhập Google. Sao chép liên kết rồi mở bằng Safari hoặc trình duyệt trên điện thoại. | Capability failure named without exposing provider payload |
| Volatile cart | Giỏ chỉ được giữ trong trang này vì trình duyệt chưa cho phép lưu. | Existing warning reused when preserving in-memory guest quantity |
| Cart concurrent recovery | Giỏ đã thay đổi ở tab khác. Các món ở trang này vẫn được giữ lại. | Revision mismatch blocks overwrite; memory remains |
| Volatile edit recovery | Các món vẫn được giữ trong trang này. Cho phép lưu rồi thử lưu vào giỏ trước khi sửa. | Blocks durable guest editing until its volatile snapshot is recovered |

Existing closed/cancelled/network/unauthorized/MFA error mappings retain their prior wording; unit tests cover safe output. No payment, consent, fees or owner-access semantics changed.

## State Coverage

| State | Result | Evidence |
| --- | --- | --- |
| Default/action | PASSED | Existing Google button invokes shared login |
| Loading/pending | PASSED | Named status with indeterminate bar, no unsupported percentage |
| Empty/no result/zero | NOT_APPLICABLE | No numeric data in login dialog |
| Success | PASSED | Overlay closes after SDK resolves; App confirmation requires current user and no pending MFA |
| Error/recovery | PASSED | Blocked/closed/unsupported/network mappings; retry, copy rejection and dismissal tests |
| Offline/partial | PASSED | Unit network error; quota browser fixture honestly retains volatile cart and retries only after persistence recovers |
| Unauthorized/forbidden | PASSED | Existing safe auth mapping; private pending state admitted after login without submitting a new command |
| Confirmation/destructive | NOT_APPLICABLE | No destructive action |

## Data Semantics

No metric, money, period or timezone changed. SDK result and Firestore acknowledgment remain authoritative; pending never means success. No credentials/provider payload in UI or copied data. Cart transfer retains revision, ownership and idempotent operation identifiers. Copy uses current page URL, never OAuth result or stored identity.

## Mandatory Human Interface Principles

| Principle | Status | Current evidence |
| --- | --- | --- |
| Purpose | PASSED | One provider and clear instruction to continue in its window |
| Agency | PASSED | Escape/Quay lại dismiss; retry and user-controlled copy; no forced main-page redirect |
| Responsibility | PASSED | Cancellation wording distinguishes provider closure; volatile cart warning preserves limits |
| Familiarity | PASSED | Google name, native web modal, normal button terminology, current design colors |
| Flexibility | PASSED | Three browser engines, 320/390/1440 widths, real 200% text, keyboard cycle and Escape |
| Simplicity | PASSED | Pending has one action; recovery controls appear only on failure; removed duplicate App toast |
| Craft | PASSED | Center bounds measured, wrapping/scrolling checked, focus restored, safe error and copy status |
| Delight | PASSED | Unfinished image/text/cart/composer survive first login; no forced restart of the user's task |

## Platform Fit And Pattern Checks

Native HTML dialog supplies modal semantics/inert page; explicit Tab/Shift+Tab cycling covers Safari settings that exclude buttons. Visible/accessibility names agree. Escape exits, focus restores to the previous connected control. Minimum 44px buttons; text scales with rem and content scrolls. Error alert/status announcements and aria-labelledby/aria-describedby are present. Existing loading bar honors reduced motion. No Apple-only asset, control, typography or trade dress introduced. WebKit is a desktop engine proxy, not physical iPhone Safari evidence.

| Pattern | Result | Evidence |
| --- | --- | --- |
| Writing/controls | PASSED | State-specific complete Vietnamese messages, action labels match effects |
| Feedback/interruption | PASSED | Only requested login opens modal; duplicate toast removed |
| Alerts/consequential choices | PASSED | Safe error + actionable recovery, no destructive confirmation |
| Onboarding/help | PASSED | Browser-opening help only after failure |
| Privacy/accounts | PASSED | Google-owned authentication, server owner/MFA guards unchanged |
| Inclusion/localization | PASSED | Vietnamese diacritics, expansion at 200%, non-color status, keyboard operation |

## Gate Results

Human Interface principles, target-platform fit, meaning/behavior agreement, audience context, natural tone, brevity, state coverage, privacy, accessibility semantics, Vietnamese expansion, terminology and rendered-context verification: PASSED for the scoped web UI and disclosed synthetic browser evidence.

## Verification Evidence And Decision

`tests/browser/google-popup-login.spec.ts`: pending, recovery, copy failure, popup close/retry, exact URL, guest/private transitions, step/notes/images, Ask composer and cart quota. `tests/unit/google-popup-login.test.ts`: dedup, pending dismissal/late result, MFA including invalid challenge, safe provider errors.
Screenshots: `screenshots/chromium-pending.png`, `screenshots/webkit-pending.png`, `screenshots/firefox-pending.png`, corresponding 200% recovery screenshots. Keyboard tested in all engines. Manual VoiceOver/TalkBack, physical phone, real provider and RTL translation: NOT_RUN; Vietnamese-only change, no translated-locale claim.

Product Language Gate: PASSED for scoped cross-platform web change. Fixed: top-left placement, duplicate toast, small-screen text scaling and WebKit keyboard focus. Residual: physical-device/provider verification remains required before production rollout. No owner decision needed for local scope.

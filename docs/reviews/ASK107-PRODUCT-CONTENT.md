# ASK107 Product Content Review

Scope: Vietnamese responsive web Settings, Ask pilot and shared action MFA. Owner manages configuration; consequential actions preserve server authorization, confirmations and monetary semantics. Review date 2026-10-07. Brand blue/white/navy; native web dialog, form, ARIA tabs. Apple-only expression and HIG compliance not applicable.

## Content inventory and states
| Surface | Changed content / state | Verified meaning |
|---|---|---|
| Settings | Cấu hình; Quản lý tỷ giá, điều khoản và thử Ask; Tỷ giá & điều khoản; Thử Ask | Tabs select panels, keep drafts mounted; selection is not save |
| Policy form | Phiên bản điều khoản; Tỷ giá quy đổi; Số VND; Số đơn vị tiền nguồn; Thời gian áp dụng; date labels; approval checkbox; Lưu chính sách | Existing rational rates for smallest source unit, local device dates, approval and exact payload unchanged |
| Policy feedback | Đã lưu chính sách; accepted quotes retain old policy; validation, loading, reload, unknown-write recovery | Success follows acknowledged durable response; unknown write retains same operation ID |
| Ask budget | Giới hạn thử; Đã giữ cho lượt thử; Còn lại; Chưa xác minh | Server reservation, not invoiced cost. Null not zero. Maximum 10000 VND and reserve 1000 per attempt unchanged |
| Ask actions | Bật thử Ask; Dừng thử; Xác nhận bật thử; Hủy xác nhận; Tải lại cấu hình thử Ask | Owner-only bounded text pilot; explicit confirmation retained. Draft not submitted request/payment |
| Ask status | Chưa bật thử / Đang bật thử; Kết nối AI sẵn sàng / Chưa kết nối được AI; Hết hạn | Server readiness/state readback; expiry device locale |
| Ask feedback | activation/stopping success; load failure; acknowledged-but-unread; pending unknown result; canceled MFA | Toast reflects durable outcome or uncertainty, recovery uses retained operation ID |
| MFA | Xác thực để tiếp tục; opening Google; blocked popup instructions; Tiếp tục với Google; Hủy thao tác | Only server RECENT_MFA_REQUIRED triggers; browser restrictions get user gesture fallback |
| MFA challenge | existing code field; wrong/expired/network error toast and inline field guidance | No OTP logging or secret retrieval. Successful refreshed second-factor token required |
| Recovery | Chưa xác thực xong. Thao tác chưa được tiếp tục; changed account/page stops action | No replay on cancellation, route/account change, role error or unknown transport failure |

## Human Interface principles
| Principle | Status | In-context evidence |
|---|---|---|
| Purpose | PASSED | Two task tabs, policy full form and Ask status/actions; actual component screenshots |
| Agency | PASSED | Explicit enable confirmation; cancel/back-to-action; exact one replay; drafts retained |
| Responsibility | PASSED | Server MFA remains 5 minutes; cost reservation explanation and owner restriction retained |
| Familiarity | PASSED | Web native inputs, button labels, tabs and Google reauth; Vietnamese business terms |
| Flexibility | PASSED | 390px/desktop rendering, keyboard tabs, focus restoration, mobile stacked dates |
| Simplicity | PASSED | No stepper; errors toast; grouped form and three budget values |
| Craft | PASSED | Visible labels/required markers, focus borders, 44px targets; toast inside modal; units/date meaning checked |
| Delight | PASSED | Input preserved and automatic contextual MFA recovery reduces repeated manual navigation |

## Gate evidence
Meaning, audience, tone, brevity, states, data/privacy, terminology, localization and platform fit PASSED within executed Vietnamese web scope. Keyboard/ARIA/live-region/focus and overflow checks PASSED. No full screen-reader certification, RTL or other-locale claim. Current rendered proxy is actual components and production CSS with synthetic Firebase SDK transport, not provider authentication proof. Screens: output/ask107/settings-desktop.png, settings-mobile.png, ask-mobile.png, mfa-success.png, mfa-blocked.png. Six browser cases passed including cancel/account/route changes. Product Language Gate PASSED for reviewed scope; production authenticated acceptance remains separate.

Production follow-up: final Settings and Ask panels observed on production; automatic MFA dialog observed after typed server refusal. Google internal-error now keeps safe in-page fallback. Latest seven component browser cases passed. Real Google/TOTP completion remains unavailable in this remote session; no provider-success claim.

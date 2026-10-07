# ACCOUNT-RAIL081 Product Content Review

2026-10-06. Vietnamese web customer account sidebar. User corrected prior assumption with screenshot; actual job is distinct meaningful navigation icons, not repeated icons in notifications. Direct correction authorizes rollback080 and rail delta. No user-visible/accessibility strings changed. Existing six labels/targets and support label remain source-of-truth; decorative SVG aria-hidden, link names stay textual. Existing navigation/status/keyboard state and mobile treatment retained. No brand identity or backend edits.

Mapping: Đơn của tôi→box; Vận chuyển→truck; Thông báo→bell; Chứng từ của tôi→receipt; Hồ sơ và địa chỉ→person; Bảo mật tài khoản→shield; Cần hỗ trợ?→lifebuoy, existing right-arrow retained. All20px/1.7stroke/currentColor, fixed shrink, aligned to existing rail layout. Mobile retains existing text-first navigation CSS, no accidental width expansion. Query/error/empty/loading/read/unread notification behavior restored to079presentation; no new content/data meaning.079review rechecked for restored component. Notification CSS matches079SHA; TSX presentation reverted without byte-identical hash claim.

| Principle | Result | Evidence |
| --- | --- | --- |
| Purpose | PASSED | Each icon reflects corresponding destination |
| Agency | PASSED | Textual links/destinations/active page unchanged |
| Responsibility | PASSED | No invented state/action; no private data |
| Familiarity | PASSED | Existing box icon style extended across rail |
| Flexibility | PASSED | Existing mobile treatment,390/768/1440 and keyboard200percent |
| Simplicity | PASSED | No extra copy, compact20px icons |
| Craft | PASSED | Unique glyph assertions, alignment, SVG hidden semantics |
| Delight | PASSED | Meaningful consistent visual navigation |

Current synthetic desktop screenshot visually inspected.8browser tests check six distinct nav drawings, support icon, restored notification dots/no080row icons, route/read/loading/error/empty/retry and keyboard/mobile. Type/source lint/build passed. Product Language Gate PASSED scoped to unchanged copy/decorative meaning. Native web/canonical white/navy/blue; Apple-only HIG not applicable. Full screen reader/live provider NOT_TESTED. No new translation strings. No further clarification required after exact user screenshot/correction.

# SATSUNICGO-ACCOUNT-MENU-009 — v1

Status: AWAITING HUMAN PLAN APPROVAL. Delta beyond approved PAGES-007; no header code edited for this request.

## Requested result
Replace signed-in header “Tài khoản” and “Đăng xuất” with a single Google profile control: circular avatar, Google display name, chevron. Clicking opens a compact account dropdown like the supplied screenshot, with actual SatsunicGo customer functions.

Reviewable menu:

```text
[Avatar] Tên từ Google                         ˅
               ┌──────────────────────────────────┐
               │ Tên từ Google                    │
               │ Google                           │
               ├──────────────────────────────────┤
               │ Hồ sơ và địa chỉ                 │
               │ Đơn của tôi                      │
               │ Gửi yêu cầu mua hộ               │
               │ Membership                       │
               │ Hỗ trợ                           │
               │ Bảo mật tài khoản                │
               ├──────────────────────────────────┤
               │ Đăng xuất                        │
               └──────────────────────────────────┘
```

Use white background, navy text, blue interaction/focus, subtle neutral border/shadow, 14px radius, approximately 280px width. Rows around 42px with restrained line icons if they improve scanning. Name may wrap inside dropdown; header name truncates on narrow screens while accessible name remains complete. Avatar remains visible. Do not introduce language/theme controls from the reference screenshot because this request does not ask for those capabilities.

## Source-verified destinations
- Hồ sơ và địa chỉ → /account/profile (Profile)
- Đơn của tôi → /account (Account: quote/payment/order journey; existing shipment/notification sections)
- Gửi yêu cầu mua hộ → /request (RequestForm)
- Membership → /membership (Membership)
- Hỗ trợ → /support (Support)
- Bảo mật tài khoản → /account/security (Security)
- Đăng xuất → existing signOut callback, no new logout implementation.
Do not invent saved-items, progress, settings, balance or separate shipment routes. CRM remains subject to the existing staff check and current navigation.

## Intelligence and existing flow
Gate remains DEGRADED: CodeGraph/CocoIndex stale; bounded native source inspected. Gate/refresh already attempted for PAGES-007, no completeness claim. Current checkout has extensive concurrent WIP. Verified files: src/app/SiteChrome.tsx (SiteHeader user/signOut/busy, staff subscription, mobile menu cleanup), src/app/App.tsx (onAuth state and existing customer routes), src/features/auth/OneTap.tsx (Google credential sign-in), src/features/profile/Profile.tsx (display-name fallback), src/styles/global.css (headerActions/account/nav/mobile rules). React19.3/TS6/Vite8/Firebase12 responsive Vietnamese web. Shared .ai context remains placeholder-based.

OneTap supplies Firebase Auth User. Prefer google.com providerData displayName/photoURL, then Firebase user values when available. Use a neutral account label and initials fallback if name/photo missing. Show Google provider label only when providerData verifies Google. No new OAuth requests, account mutation, extra profile database reads, sign-in buttons, or OneTap lifecycle changes.

## Exact implementation scope
- src/app/SiteChrome.tsx / SiteHeader: profile trigger and dropdown within existing headerActions; local open state/ref; close on route change, identity change, outside click, Escape, menu selection and sign-out. Keep main navigation and staff-role policy.
- src/styles/global.css: only account-profile/dropdown selectors and narrow responsive/focus styles. Preserve PAGES-007 and all unrelated header redesign work.
- docs/approvals/SATSUNICGO-ACCOUNT-MENU-009.md: approved-plan evidence after human approval.
- docs/reviews/ACCOUNT-MENU-009-*: content review, browser evidence, review cycles and completion report.
No new dependency or backend/config/schema/production change.

## Behavior, risk and validation
Low-to-medium shared-header UI risk. Use native button + labelled navigation disclosure, normal links and native Tab behavior; do not attach ARIA menu semantics without implementing its full interaction model. Escape returns focus to trigger. Clicking outside closes; internal clicks still navigate. Coordinate account dropdown and mobile navigation so only one overlay opens. On logout/user change, private profile data disappears promptly. Keep current busy state and error propagation; avatar image failure falls back to initials without layout shift. Bound avatar dimensions, avoid loading a new profile via API; no credentials printed. Preserve untrusted display names as React text.

Validation: tsc, scoped lint, appropriate existing auth/OneTap regression tests, real component fixtures for Google name/photo, missing/broken photo, missing name, long name, signed-out, route change, Escape/outside/Tab, all destinations, sign-out callback and pending/error, 1280/390/320px. Only mock logout/auth in fixture unless a real action is explicitly needed and authorized. Product content eight-principle review and fresh final implementation review required. Keep production readiness distinct from local dropdown acceptance. Revert only task-specific changes on rollback.

## Approval request
Approve SATSUNICGO-ACCOUNT-MENU-009 v1 for the two source paths and task-specific approval/review documents above. Material expansion into auth, new customer services, App/account layouts, shared header redesign, theme/language controls or deployment requires a delta plan.

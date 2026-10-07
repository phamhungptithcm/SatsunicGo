# Product Content Review — ACCOUNT-MENU-009

Surface: SiteHeader AccountProfile and SiteFooter. Audience: signed-in Vietnamese customers navigating existing purchase/account functions. Platform: responsive web, native disclosure button and navigation links; no Apple-platform compliance claim. Reviewed 2026-10-04, Codex. Approved ACCOUNT-MENU-009 v1 plus owner refinement placing attribution after footer brand.

## Facts, assumptions and limits
Firebase User.google.com providerData is the preferred name/photo source, falling back to user values and neutral name/initials. Only a verified Google provider receives the Google label. Existing routes and signOut callback are retained. Avatar requires HTTPS, has no-referrer policy and fixed bounds. No profile API/database/auth mutation added. Six menu destinations verified from App.tsx and fixture clicks. Native web controls and established royal-blue/navy branding remain authoritative. Local fixture imports actual SiteChrome/global/public-ux styles; data and logout callbacks are synthetic. Successful Google credential exchange and live logout NOT TESTED here.

## Changed-string inventory
| Location/state | Content | Meaning and evidence |
| --- | --- | --- |
| Profile trigger | Google displayName, fallback user.displayName | React text from current user/provider; name stays visible/truncated in header and full in panel |
| Missing identity | Tài khoản của bạn; SG | Neutral label and decorative initials; no invented personal identity |
| Trigger accessible label | Tài khoản của {name}, or Tài khoản của bạn | Full name despite visual truncation; fallback avoids duplicated wording |
| Provider label | Google | Only rendered when google.com exists in providerData |
| Navigation accessible label | Chức năng tài khoản | Identifies standard web navigation disclosure |
| Menu links | Hồ sơ và địa chỉ; Đơn của tôi; Gửi yêu cầu mua hộ; Membership; Hỗ trợ; Bảo mật tài khoản | /account/profile, /account, /request, /membership, /support, /account/security; all existing functions |
| Sign-out normal/pending | Đăng xuất; Đang đăng xuất… | Existing callback; busy state disables action; not a success promise |
| Navbar attribution | removed by HunpeoLabs | Removes secondary header brand text as requested |
| Footer attribution | by HunpeoLabs after SatsunicGo | Attribution retained once, duplicate lower line removed |

Initials, avatar, chevron and link arrows are decorative aria-hidden. No email, account ID or credential is displayed.

## State coverage
| State | Result/evidence |
| --- | --- |
| Default/open/focus | PASSED: actual local app and fixture; native Tab reaches first link |
| Loading/pending/disabled | PASSED: mocked pending logout disabled and labelled; no new account loading fetch |
| Missing name/photo | PASSED: neutral label/SG; broken HTTPS photo falls back KK |
| Photo success | PASSED: fixture HTTPS image rendered with naturalWidth272; not a real Google avatar/account claim |
| Sign-out success | PASSED for UI: mock removes trigger/menu; live logout NOT TESTED |
| Error | PASSED for UI: mock failure retains current account and existing parent error feedback; production/provider failure NOT TESTED |
| Route change/outside/Escape | PASSED: six links navigate/close; outside closes; Escape closes/restores trigger focus |
| Identity change | PASSED: changed fixture UID closes/remounts profile; non-Google does not show Google label |
| Signed out | PASSED: zero profile controls; OneTap/auth lifecycle preserved |
| Mobile nav interaction | PASSED: mobile navigation closes when account opens and vice versa |
| Offline/stale/partial | NOT_APPLICABLE to new menu data loading; existing Auth User snapshot remains authority, photo failure supported |
| Confirmation/destructive | NOT_APPLICABLE: logout callback unchanged, no export/delete/financial action introduced |

## Mandatory principles
| Principle | Status | Evidence |
| --- | --- | --- |
| Purpose | PASSED | One identity control opens actual customer functions |
| Agency | PASSED | Six clear destinations, native links, Escape/outside dismissal and sign-out control |
| Responsibility | PASSED | No private email/credentials; accurate provider label; no new auth permissions or promises |
| Familiarity | PASSED | Conventional web profile disclosure and established Vietnamese route labels |
| Flexibility | PASSED | 1280/390/320px, long name and missing/broken image, native Tab/Escape |
| Simplicity | PASSED | Replaces two header actions; only supported functions, single footer attribution |
| Craft | PASSED | Persistent names, ARIA expansion/control, HTTPS/fallback image, wrapping and mobile visibility verified |
| Delight | PASSED | Quiet white panel, thin border, no new animation/interruption, less header clutter |

## Platform and pattern checks
PASSED for web fit, writing/controls, low-interruption feedback, privacy/account rationale, inclusion and vi-VN wrapping. Native button + labelled nav uses normal Tab; no incomplete ARIA menu pattern. No price/date/unit semantics changed. Contrast inherited navy and muted text on white, blue focus ring; screenshot/source reviewed. Full screen-reader/cross-browser/200%-zoom certification NOT TESTED; keyboard/AX evidence is bounded. RTL NOT_APPLICABLE to Vietnamese scope. No Apple-only expression/assets imported.

In-context evidence: ACCOUNT-MENU-009-desktop.jpg, mobile.jpg and long-mobile.jpg use explicitly synthetic harness. Actual app header/menu and footer were also observed. Mobile menu bounds320: left28/right308; viewport390 width390 and panelright378. Google image test used a public static logo fixture purely to exercise image success; production never receives it.

Gate: PASSED for approved UI scope. Fixed: inherited primary-nav styles hiding nested dropdown; menu remount preventing opening after mobile nav; mobile panel clipping; repeated fallback accessible wording. Narrow mobile hides the concurrently-added duplicate purchase CTA for signed-in users, whose account dropdown retains the same request destination. Full release readiness is outside this gate.

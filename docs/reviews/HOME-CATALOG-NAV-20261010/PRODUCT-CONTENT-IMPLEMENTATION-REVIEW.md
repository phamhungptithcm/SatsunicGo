# Product Content Review — implemented HOME-CATALOG-NAV v1

## Scope

- Surface: Home hero/JourneyTimeline, SiteHeader and AccountProfile navigation.
- Audience/job: Vietnamese customers browse listed products first; send a custom purchase request when needed.
- Business outcome: two clear purchase entry points without implying every listing is warehouse stock.
- Platform/locale: responsive web, Vietnamese. React Router links, native buttons, visible focus, keyboard menu and existing account/cart semantics.
- Apple HIG: human-centered principle reference only; no current Apple-platform compliance claim or Apple-only expression. SatsunicGo blue/white/navy remains authoritative.
- Reviewer/date: /root, 2026-10-10 UTC. PLAN.md is the historical proposal; APPROVAL.json records the subsequent human approval.

## Context and evidence

Verified: /products is the existing catalog; /request renders the existing request form. Both actual routes were opened through hero links on shared5207. /how-it-works remains reachable below the journey. Candidate and shared App have different approved test-mode content: SOURCE-PRESERVATION.json reverses only these Home/Journey edits and recovers each exact preimage. Common header/CSS sources match. No order, payment, account or cart was created/changed by these checks.

Assumption: the existing Vietnamese public surface remains the target; there is no new language switch or translated locale. No conversion improvement is claimed.

Blockers: native Mac remains locked at current recheck. Genuine200% browser zoom and spoken screen-reader acceptance for the changed header are NOT_RUN. DOM/AX and component fixtures do not substitute for spoken AT, real staff MFA or provider proof.

## Content inventory

| Location/state | Before | Implemented | Job and behavior evidence |
| --- | --- | --- | --- |
| Hero primary/default/hover/focus | Gửi yêu cầu mua hộ → /request | Xem sản phẩm → /products | First browse listed products; actual route opened |
| Hero secondary/default/hover/focus | Xem cách hoạt động → /how-it-works | Gửi yêu cầu mua hộ → /request | Custom request; actual form rendered |
| Journey first description | Chọn hàng có sẵn hoặc gửi món cần mua hộ. | Chọn sản phẩm đã đăng hoặc gửi món cần mua hộ. | Supports listings and requests, avoids stock promise |
| Journey secondary link | Hero placement | Xem cách hoạt động → /how-it-works below journey | Existing explanatory destination still accessible |
| Mobile nav request and desktop right entry | Mua hộ | Mua hộ theo yêu cầu | Same /request destination; one visible entry per layout |
| Main nav fees | Biểu phí | Phí dịch vụ | Same /fees destination |
| Main/account membership nav | Membership | Thành viên | Same /membership destination |
| Narrow account trigger | Visible name plus avatar | Avatar; existing full accessible name and full name in dropdown | Avoid clipped menu at320px; actual component dropdown checked |

Menu “Mở menu”/“Đóng menu”, cart state announcements, sign-in, CRM and other labels are unchanged. Decorative grid/arrow SVGs are aria-hidden and do not replace link names.

## State coverage

| State | Applicable | Content/rationale and evidence |
| --- | --- | --- |
| Default/action/hover/focus | Yes | Two hero links; actual mobile menu Enter/Space/Tab/Escape, pointer and outside close; no focus theft on pointer opening |
| Loading/pending | Yes, existing cart | Actual CartIcon component fixture announces Giỏ hàng đang tải, no false zero badge |
| Empty/true zero | Existing behavior | Unchanged cart count mapping inspected; this delta does not replace data with zero |
| Success | Navigation only | Products/request/how-it-works routes observed; no durable purchase success claim |
| Error/recovery | Yes, existing cart | Fixture Giỏ hàng chưa tải được, no badge; account photo HTTP rejected and initials fallback retained |
| Offline/stale/partial | Yes, existing cart | Cached3 announces từ bản lưu; fixture120 shows99+ visually and120 in accessible name |
| Unauthorized/forbidden | Yes | Guest/customer/staff component states checked; real auth/roles unmodified; fixtures are not authorization proof |
| Confirmation/destructive | No new action | No submit, deletion, money or confirmation behavior changes |

## Data semantics

Catalog listing does not assert stock. No prices, availability, deadlines, financial terms, metrics, units or persistence mappings changed. Cart quantity remains sum of real+guest lines, including cached/error distinctions. Existing auth/role checks and safe photo validation remain source-identical; no PII was printed/committed. Synthetic component fixtures never contact backend or grant roles.

## Mandatory Human Interface principles

| Principle | Status | Current evidence/rationale |
| --- | --- | --- |
| Purpose | PASSED | Catalog primary, request secondary; both routes work |
| Agency | PASSED | Both paths remain; explanatory link preserved; menu closes by Escape/outside/navigation |
| Responsibility | PASSED | No stock or payment promise added; consent/auth/data boundaries unmodified |
| Familiarity | PASSED | Web links/buttons, Vietnamese destination labels, existing account/cart behavior |
| Flexibility | NOT_RUN | Five actual viewports and18 component layouts pass; genuine200%zoom/spoken AT still missing |
| Simplicity | PASSED | Exactly two hero CTAs and one visible request entry per header layout |
| Craft | NOT_RUN | Narrow overflow and headline orphan fixed; current visual/keyboard checks pass, native acceptance incomplete |
| Delight | PASSED | Consistent compact hierarchy, considerate keyboard focus and preserved journey; no performance/satisfaction claim |

## Platform fit and patterns

Responsive web conventions and existing brand preserved. Buttons/links retain visible names, focus styles and44px minimum header targets. No Apple-only gestures/assets/controls imported. Writing/controls, feedback/interruption, contextual help and account/privacy patterns reviewed within source+browser scope. No new alerts or consequential choices. Inclusion/localization remains incomplete until native zoom and spoken AT are exercised; Vietnamese and long-name fixtures pass, no RTL/multi-locale support added.

## Gate results

| Dimension | Status | Evidence/rationale |
| --- | --- | --- |
| Human Interface principles | NOT_RUN | Flexibility/Craft missing native evidence |
| Target-platform fit | PASSED | Web controls and SatsunicGo design system |
| Meaning matches behavior | PASSED | Existing routes plus source preservation |
| Audience/business context | PASSED | Human requirement and catalog/request source |
| Natural respectful tone | PASSED | Short concrete Vietnamese labels, no machinery/filler |
| Concise without meaning loss | PASSED | Clear destination names, listing distinction preserved |
| Actions/state coverage | PASSED | Local route/keyboard checks and disclosed component cart/account fixtures |
| Data semantics/privacy | PASSED | No changed data contract or backend access |
| Accessibility | NOT_RUN | Keyboard/AX checks pass; spoken AT/zoom missing |
| Localization/text expansion | NOT_RUN | Vietnamese/long names pass; genuine text zoom missing |
| Terminology consistency | PASSED | Thành viên and Mua hộ theo yêu cầu consistent in changed entries |
| In-context verification | PASSED | Actual shared app screenshots1440/390/320 and bounded component fixtures |

## Verification and decision

Actual app viewport matrix1440/1280/1024/390/320: no horizontal overflow, header fits, headline2lines, hero buttons50px desktop/49px mobile. Component matrix1440/1280/1201/1024/390/320 ×guest/customer/staff:18/18 fit/no overlap after correction. Synthetic fixtures are disclosed proxies, not genuine role/MFA acceptance. Enter/Space/Tab/Escape, focus restoration, pointer no-focus-theft and actual outside close checked. Fixture outputs/tab cleaned; viewport override reset. Node22 frontend strict/lint and3navigation regression tests passed; exact public CI-tuple build/public-assets regeneration passed.

Product Language Gate: **BLOCKED**. Findings fixed: offscreen signed-in mobile menu and390px orphan headline. Remaining: genuine200%zoom/spoken AT, plus broader production-test manual/release/live gates. Existing pending MFA/login and unlock requests are not repeated. No new design approval needed.

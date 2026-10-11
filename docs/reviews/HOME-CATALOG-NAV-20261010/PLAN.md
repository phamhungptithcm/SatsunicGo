# Trang chủ: sản phẩm trước, mua hộ theo yêu cầu

Status: REVIEWABLE_PLAN; implementation approval PENDING. Application source untouched.

## Requirement and verified flow

User requests primary “Xem sản phẩm”, secondary “Gửi yêu cầu mua hộ”, plus a clearer, more distinctive public navbar. Listings are products the business can help purchase; a listing does not by itself promise warehouse stock. /products is the existing catalog; /request already accepts name/link/images and has existing auth/cart/image recovery semantics. /fees is existing service pricing, /membership existing member plans/benefits, /posts articles, /support help. Home calls JourneyTimeline, App renders SiteHeader; SiteHeader renders actual account menu/cart/staff CRM based on current role. Source/DOM confirmed. Shared context architecture/ownership contains placeholders, so no invented team ownership.

## Proposed design

- Hero: “Xem sản phẩm” → /products, blue filled, first. “Gửi yêu cầu mua hộ” → /request, white outlined, second. 50px high, 14px type, 12px gap, matched geometry. Mobile stacks both with full width. Keep headline and lead copy. Existing JourneyTimeline animation remains in the app; the standalone preview shows a static representation.
- Keep /how-it-works discoverable as a small blue “Xem cách hoạt động” link below the existing journey. Hero retains exactly two CTA buttons.
- Journey first line: “Chọn sản phẩm đã đăng hoặc gửi món cần mua hộ.” Clarifies listings without an in-stock promise. Other steps unchanged.
- Navbar: full-width white surface, restrained border/shadow, existing blue cube/wordmark, clearer 14px medium links, visible focus/hover/active underline. No oversized pills or nested panels.
- Desktop center: Sản phẩm · Phí dịch vụ · Thành viên · Bài viết · Hỗ trợ. Existing right request entry is “Mua hộ theo yêu cầu”, subtly outlined blue. Same /request appears in mobile menu rather than duplicating desktop nav + right action.
- Mobile menu includes Sản phẩm · Mua hộ theo yêu cầu · Phí dịch vụ · Thành viên · Bài viết · Hỗ trợ; cart and existing signed-in account remain accessible. Align both CSS and matchMedia breakpoint; proposed 1024px is accepted only after signed-in long-name/staff CRM width checks. If those checks fail, use the existing1200 breakpoint with identical visual language. No new mega-menu/search or new destination.
- Account menu Membership label becomes “Thành viên” for consistency; no account behavior change.

## File/function implementation after approval

1. src/app/App.tsx Home: dedicated heroActions wrapper, route/label hierarchy and move how-it-works link into JourneyTimeline; single listing wording correction. Preserve test-mode routes and all other current candidate deltas.
2. src/app/SiteChrome.tsx navigation/accountNavigation/SiteHeader: labels, class hook for request entry; retain role checks, cart state/count labels, account interactions, hover preload, Escape/outside-click/navigation close and scroll behavior. Keyboard opening should focus the first visible menu link; Escape restores the trigger, pointer opening does not steal focus. No sign-in or permission change.
3. src/styles/public-ux.css: scope new navbar and heroActions rules to public components. Desktop/mobile duplicate request visibility and control sizing. Avoid broad .topbar nav rules affecting account dropdown.
4. src/styles/global.css only if the existing menu breakpoint must align; smallest exact media change, no global primary/secondary button redesign.
5. Review/evidence docs and actual browser verification. No mirrored/generated source edits.

## Integration and risk

This is a NEW design scope, not implied by prior test-mode or general release approval. Do not implement before the concrete preview is approved. Existing release automation and PR3 remain separately gated. SharedApp differs from candidate because of approved test-mode integration; merge only the scoped Home/Journey diff into candidate, never copy the shared file over candidate. SiteChrome/styles currently match both trees. Preserve all unrelated WIP and shared5207; no server start/restart/reseed. No backend/API/database/payment/consent/budget/IAM/dependency/CI change. Risk medium for shared-header layout/accessibility, low for static hero navigation.

## Verification after approval

- Strict TypeScript/lint/diff and production build relevant to CSS/markup. No test mirroring static copy.
- Actual app pointer+keyboard: primary/secondary destinations, no forced sign-in for browsing, how-it-works remains discoverable, menu open/close/Escape/outside-click/focus restoration; preload and compact-header behavior.
- Desktop1440/1280/1024, mobile390/320, actual200%zoom, guest/customer long-name/staffCRM; ensure no horizontal overflow and44px controls. Preserve cart loading/cached/error/count99+ and avatar fallback semantics, rather than fabricating account data.
- Product Language Gate: complete all8 principles using actual rendered states; preview evidence is explicitly proxy and not implementation acceptance.
- Final review → fix in approved scope → verify → review. Normal immutable release workflow only; no new deployment approval inferred from design approval.

## Alternatives and trade-offs

Keeping Mua hộ both in desktop center and right CTA repeats the destination and crowds the row; the proposed design retains one desktop entry and the mobile menu entry. A richer mega-menu/product search would add behavior and is outside this scope. Reduced motion, accessible names matching visible labels and existing web conventions take priority over decorative effects.

## Approval request

Approve HOME-CATALOG-NAV v1 and its standalone preview to implement the above scoped UI and merge the delta into the active integration candidate. No application source has been changed yet.

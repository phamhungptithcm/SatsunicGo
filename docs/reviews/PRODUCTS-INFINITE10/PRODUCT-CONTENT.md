# Product Content Review — PRODUCTS-INFINITE10

Reviewer: Codex, 2026-10-07. Surface: public /products, Vietnamese desktop/mobile web. Audience: shoppers browsing published catalog products. Purpose: append 10 products per read without a required click. Existing product design system remains authoritative; no Apple-specific controls or expression introduced. Apple platform HIG contract: not applicable.

## Context and inventory

No visible text is added or rewritten. Existing messages are used in a new automatic-loading interaction. Firestore remains the source of published products; browser fixtures are synthetic public SDK responses, not provider readback. Search/market filtering remains local to loaded rows. No totals, ETA or successful purchase claims are introduced.

| State | In-context content / behavior | Evidence |
| --- | --- | --- |
| Action | Xem thêm sản phẩm; native button remains keyboard reachable | Browser test 2 |
| Pending | Đang tải thêm sản phẩm…; Đang tải…; aria-busy and aria-disabled; repeated clicks ignored | Browser tests 2 and 4, loading.png |
| Loaded | Cards appended; prior cards retained | Browser test 1, desktop.png |
| Error/recovery | Chưa tải được thêm sản phẩm.; Thử lại; auto retries stopped | Browser test 3, error.png |
| Filter/no result | Existing local-filter scope and clear/filter messages unchanged; more pages remain reachable | Browser test 5, mobile-filter.png |
| Terminal | Load button disappears after partial/empty last page | Browser tests 1 and 2 |
| Initial loading/error, empty, offline/stale | Existing text preserved; source review confirms paths; automatic offline requests suppressed | public-content.ts and ProductsCatalog.tsx; no separate offline screenshot |
| Unauthorized, destructive, confirmation | Not applicable to this published-only read interaction | No permission/write contract changes |

## Data semantics

Ten is request page size, not a guaranteed count of matching filter results. Final page can be smaller. No total is inferred from hasMore. IDs and document cursor ordering are preserved; no changes to price, market, purchase eligibility or currency. Existing stale/error disclosures remain. No private information, credentials or database writes in tests.

## Mandatory principles

| Principle | Status | Evidence |
| --- | --- | --- |
| Purpose | PASSED | Scrolling appends published catalog cards, test 1 |
| Agency | PASSED | Keyboard/manual fallback and explicit retry, tests 2–3 |
| Responsibility | PASSED | No synthetic totals; errors retain prior cards; filters remain local |
| Familiarity | PASSED | Existing web buttons, existing Vietnamese messages and loading component |
| Flexibility | PASSED | 390px viewport/filter check and keyboard fallback, tests 2 and 5 |
| Simplicity | PASSED | No extra instructions or modal interruption |
| Craft | PASSED | Loading/error screenshots and focus defect fixed, final 5/5 tests |
| Delight | PASSED | Less repeated clicking and preserved browsing context without added animation |

## Platform fit and pattern checks

Web fit: PASSED. Product brand/grid/styles retained. Buttons match visible/accessible names. New aria-disabled keeps focus during pending state and callback guards repeated activation. Existing LoadingState uses semantic status feedback; existing error alert and retry retained. No focus is moved by auto append. No new onboarding, permissions or consequential confirmation; those patterns NOT_APPLICABLE. No new motion; existing motion conventions retained.

Meaning/behavior, audience/business context, natural tone, brevity, actions/states, data semantics/privacy, terminology, target-platform fit and scoped in-context verification: PASSED. Localization/text expansion: unchanged complete Vietnamese strings; mobile layout has no horizontal overflow. Accessibility: scoped keyboard and DOM semantics PASSED; screen-reader/audio behavior and cross-browser certification NOT_RUN, not claimed. Zoom/RTL expansion NOT_RUN; no copy/layout changes requiring new locale behavior.

## Evidence and decision

Current Chromium screenshots inspected: output/products-infinite10/desktop.png, loading.png, error.png, mobile-filter.png. Viewports 1280×800 and 390×844. Browser tests exercise actual React components, paging hook and IntersectionObserver against synthetic public SDK responses on shared 5207. These do not prove live Firestore or production behavior. Gate: PASSED for scoped interaction and retained product language. Residual limitations: screen-reader, broader browsers and real provider readback unverified. No required owner decision.

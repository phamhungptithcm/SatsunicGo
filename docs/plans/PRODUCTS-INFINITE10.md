# PRODUCTS-INFINITE10 — public catalog scrolling pagination

Status: AWAITING HUMAN PLAN APPROVAL. No application edits authorized yet.

## Repository intelligence and verified scope

- Base commit inspected: caeec532a77176f7412551ab6621fe9df1d5da48; dirty shared checkout.
- Initial intelligence gate: DEGRADED; CodeGraph and CocoIndex healthy but stale. One bounded incremental refresh completed with exit 0. Indexed structural/semantic queries have not been used; conclusions below are bounded direct-source evidence.
- Shared architecture/build/ownership context files are placeholders. package.json verifies React 19, TypeScript 6, Firebase 12, Vite 8, Vitest and Playwright.
- Content.tsx renders ProductsCatalog. Its only catalog paging hook is useCatalogPages in src/shared/public-content.ts.
- Hook reads published products through Firestore getDocs, orderBy(documentId()), startAfter(cursor), limit(30). It appends deduplicated IDs and derives hasMore from snapshot.size === 30. An active ref prevents overlapping reads; mounted ref fences unmount updates.
- ProductsCatalog currently uses a manual load-more button, existing loading/error/stale recovery, and client-side search/market filtering over loaded rows.
- ProductsCatalog.tsx and its CSS already contain unrelated uncommitted work. Preserve all of it. Shared frontend remains 127.0.0.1:5207; no restart, reseed or additional server.

## Outcome and implementation plan

Interpret user request as 10 published products per request, initially 10 and subsequent pages appended automatically near the list bottom. A final partial page may have fewer than 10.

1. src/shared/public-content.ts: give useCatalogPages one page-size constant of 10; use it for both limit and hasMore. Preserve cursor ordering, published-only access, deduplication and recovery. Guard terminal-page and concurrent requests; preserve retry after failed reads.
2. src/features/content/ProductsCatalog.tsx: add a bottom sentinel with IntersectionObserver and effect cleanup. Trigger loadMore only when near bottom, hasMore, not loading, not error, and online. Reevaluate after each appended page so short viewports and locally filtered pages can continue. Stop automatic retries after an error. Preserve scroll position and keyboard focus. Keep the accessible manual button as fallback.
3. src/features/content/products-catalog.css: minimal sentinel/loading layout only if required; preserve current grid/card styling and unrelated WIP.
4. Add focused pagination regression coverage in a new scoped test file: 10/20/30 progression, partial last page, exact multiple followed by empty page, no duplicate concurrent reads, failed next page with prior cards preserved and explicit retry, and observer cleanup. Browser checks on shared 5207 for scrolling, mobile, keyboard fallback, filters and error/loading states. Do not reuse Ask search fixtures as proof of this listing.
5. Complete scoped product-content review, quality checks and mandatory final-implementation-review after approved implementation; record actual outcomes and limitations.

## Impact, constraints and tradeoffs

- Risk: low-to-medium; customer-visible loading behavior and public read frequency. Smaller pages reduce initial payload but cause more reads while browsing. No backend, schema, access rules, purchase/payment, dependency, deploy or infrastructure changes.
- Existing search/market filters remain local to loaded rows; this plan does not promise server-side search or 10 matching results per filtered page.
- Existing Vietnamese loading/error/retry text should be reused. New or changed announcements require the repository write-product-content gate and rendered evidence.
- End-of-list detection for exactly 10 remaining products can require an additional empty read; avoid inventing totals.
- Alternative: keep manual pagination only; does not meet automatic scrolling request. Server-side filtered paging would broaden contracts/index requirements and is deferred.
- Rollback: revert only scoped pagination edits, retaining preexisting worktree changes.

## Approval boundary

Approve PRODUCTS-INFINITE10 to authorize only the application/test files and behavior above. No implementation or runtime mutation has been performed in this planning turn.

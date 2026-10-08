# PRODUCTS112 v1 — product workspace and scroll loading
Plan ID/version: PRODUCTS112 v1
Repository intelligence gate status: DEGRADED — indexes refreshed once successfully; current worktree edits invalidate signature. Native bounded source verification allowed by repository gate.
Approval status: APPROVED
Approver: repository owner in current chat
Approval timestamp or task reference: 2026-10-07 user follow-up: “tự động loading kiểu scroll loading làm xong cái này hardness tìm cái khác tương tự để làm” following the concrete product-only plan.
Approved scope: Product-only ContentEditor and sidebar label, header refresh using existing CrmHeading reload slot, add-first spreadsheet action row, cursor-based automatic scroll loading with duplicate/stale/repeated-cursor protection, proportional browser checks, and read-only discovery of similar list patterns.
Approved paths:
- `src/features/content/ContentEditor.tsx`
- `src/features/content/ProductSpreadsheet.tsx`
- `src/features/content/content-editor092.css`
- `src/features/crm/Workspace.tsx`
- `tests/browser/products112*`
- `docs/reviews/PRODUCTS112/**`
Required constraints: Preserve unrelated WIP, backend contracts, Blog Studio, existing save/import/export semantics and shared port 5207. No extra servers, production mutations, dependencies, release actions or changes to other screens without their concrete impact plan.

## Intelligence and impact
Gate DEGRADED: installed CodeGraph/CocoIndex indexes stale; health checks passed. Source verified: ContentEditor is mounted by Workspace content route, supports products/posts selector; CrmHeading already exposes navbar reload portal. listWork enforces staff access and limits pages to 30, cursor is document ID. ProductSpreadsheet all-inventory export traverses cursor separately; filtered/selected export uses loaded rows.
React 19 / TypeScript 6 / Vite 8. Selected profiles: TypeScript-JavaScript, web-app, visual-design, product-content. Risk: medium frontend concurrency and display semantics; no schema/API/access-control change.

## Implementation and validation
1. Workspace sidebar: product-only label. ContentEditor: fixed products kind, remove post selector/branches/copy; use reload slot; move create button through ProductSpreadsheet action slot.
2. ProductSpreadsheet: optional leading action, compact icon/text export/import controls, unchanged scope and format behavior.
3. ContentEditor: IntersectionObserver sentinel; synchronous in-flight guard; stop automatic retries on errors and repeated cursor; clean observer on editor entry/unmount; preserve loaded rows on append failure and manual keyboard fallback. Do not automatically scan unloaded pages solely because a loaded-only filter has no matches.
4. CSS: scoped full-width action row, narrow layouts, offscreen row rendering optimization.
5. Browser fixture on existing 5207: header/sidebar/action order, automatic append, duplicate requests/rows, failure/retry, cursor non-progress, filters, edit/refresh cleanup, responsive overflow. Frontend typecheck and scoped lint; source review of save/import/export regressions.
6. Final product-content and implementation review; record limitations and similar-list candidates without silently extending protected scope.

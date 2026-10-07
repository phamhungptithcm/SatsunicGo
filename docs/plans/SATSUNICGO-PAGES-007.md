# SATSUNICGO-PAGES-007 — v1

Status: AWAITING HUMAN PLAN APPROVAL. No application edits performed.

## Outcome and design
Redesign /posts and /support from the two supplied screenshots. White canvas, navy headings, existing royal-blue accent, thin neutral borders, 16–20px corner radius, restrained depth. Compact content width around 1100px; responsive single column on mobile. Preserve header, footer, chat and existing navigation.

/posts: editorial heading with small “BÀI VIẾT” label, title “Hiểu rõ hơn trước khi mua”, concise introduction. A balanced empty-content panel with a small line illustration, “Bài viết đang được cập nhật”, truthful next-step copy and a solid blue “Gửi yêu cầu mua hộ” link to /request. Below, quiet links to the existing /how-it-works and /fees pages. When real posts exist, use an editorial card grid with existing media/title/category/excerpt; no fabricated articles, dates or categories. Apply the same visual shell to beta mode while preserving its current meaning and destinations. Loading, failed loading, stale cache and true empty remain distinct.

/support: title “Bạn cần hỗ trợ gì?” with concise introduction. Left column contains restrained guidance to include an order reference when available and a separate existing-ticket section. Right column is a compact form with “Gửi yêu cầu hỗ trợ” heading, persistent labels, example placeholders and clear primary action. Render the data-export/deletion explanation next to the selected data-request type, keeping the full identity/retention caveat. Purchase help should not visually lead with a data-rights notice. Preserve topic deep links, validation limits, signed-out notice, disabled submit, busy/error states, ticket ownership and reply flow. Do not promise response times or introduce a new sign-in path.

## Repository intelligence brief
Gate checked against 3bd0d093255963a2cbf66ddd80d27456da7076e0: DEGRADED. CodeGraph installed and healthy but stale; CocoIndex stale and health failed. No current indexed impact claims. Bounded native source evidence used: src/app/App.tsx, src/app/SiteChrome.tsx, src/features/content/Content.tsx, src/features/support/Support.tsx, src/styles/global.css, package.json. Shared repository-map/build-test context contains placeholders. Existing checkout has extensive unrelated WIP; retain it.

Verified stack: React 19.3, TypeScript 6, Vite 8, react-router 7, Firebase 12. /posts calls Catalog(kind=posts), shared with products; /support lazily loads Support. Catalog uses usePublicContent and a betaRelease branch. Support reads owner-filtered supportTickets and calls workspaceCommand/openTicket; Thread owns replies. Current screenshots show empty posts and signed-out support.

## File-by-file plan
- src/features/content/Content.tsx: add posts-specific visual classes and presentation in Catalog only. Keep products and ContentDetail behavior intact; preserve usePublicContent and all state handling.
- src/features/support/Support.tsx: change presentation, group existing tickets, control selected topic for relevant explanation; preserve payload, authentication, subscriptions and validation.
- src/styles/global.css: add narrowly scoped posts/support selectors and responsive/focus/reduced-motion styles; avoid broad page/requestPage overrides.
- docs/reviews/PAGES-007-*: current product-content inventory, eight-principle review, verification evidence, final review cycles and completion report.

## Impact and risk
Low-to-medium UI risk: Catalog shares product code; CSS must be scoped. Conditional disclosure is an intentional UX change; legal meaning stays intact. Long tickets and mobile layouts need browser checks. No new dependencies, API/schema/rules/infrastructure/deployment changes. Shared chrome/chat remains outside scope. Rollback only this task's diff, never existing WIP.

## Validation and handoff
Run TypeScript and scoped lint; existing relevant tests after inspecting their coverage. Browser verification at desktop and 390px mobile: posts populated/empty/loading/error/stale/beta; support signed-in/out, purchase/data topics and deep links, busy/error/tickets, keyboard focus, long text and 200% zoom. Use fixtures only when explicitly identified; no production-data mutation. Complete write-product-content review with in-context evidence and fresh final-implementation-review cycles. Mark unavailable states NOT TESTED; do not equate build success with live support acceptance.

## Approval
Approve plan SATSUNICGO-PAGES-007 v1 with the exact three source paths and task-specific review documents above. Record human approval reference before protected edits. Material changes to shared chrome/chat/auth/backend or scope require a delta plan.

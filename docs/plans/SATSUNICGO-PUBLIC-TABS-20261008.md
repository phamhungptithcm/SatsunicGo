# Public tabs — PUBLIC-TABS-20261008 v1

Status: APPROVED by user message "Approved"; scoped implementation and final review completed. See docs/reviews/PUBLIC-TABS-20261008/REPORT.md.

## Request and acceptance criteria

Use the user's second screenshot as the visual reference for all existing tab-like page controls outside CRM: transparent background, no pill outline or selected fill, dark semibold selected label, muted inactive label, and small neutral count badges where counts have a verified meaning. No baseline or selected underline in this variant. Preserve current Vietnamese/English labels, URL navigation, filtering, mounted drafts and lazy panel behavior. Keep horizontal scrolling and visible keyboard focus at narrow widths; minimum target height 44px.

## Repository intelligence brief

Current HEAD: 53d59bd88fa7da9d1243692336ecd09b6540ea31. Worktree contains extensive concurrent edits, including App.tsx and Ask.tsx; preserve all unrelated changes and re-read touched regions immediately before implementation.

CodeGraph and CocoIndex calls returned evidence. CodeGraph included output snapshots and incorrect caller associations; CocoIndex returned weak matches. The repository checker completed: both tools installed, both health checks passed, both indexes stale, gate DEGRADED. Use targeted current source evidence. Context repository-map.md and build-test-commands.md are placeholders.

Verified source: App.tsx Account and OrderCard, account.css, ProductsCatalog.tsx/products-catalog.css, ShippingRates.tsx/shipping-rates.css, Ask.tsx/Ask.module.css, PageTabs.tsx/page-tabs.css and CRM Workspace.tsx. Stack: React 19, TypeScript 6, React Router 7, Vite 8, Vitest and Playwright. Existing frontend listener: 127.0.0.1:5207, PID 33570 at inspection. Reuse it; do not restart or reseed.

## Surface inventory and file-level implementation

1. Add src/shared/public-tabs.css: a scoped reusable visual primitive for links and buttons, selected/hover/focus/disabled states and optional badges. Keep CRM PageTabs and global segmented styling unchanged.
2. src/app/App.tsx / src/styles/account.css: adopt the primitive for customerOrderFilters and orderSections. Keep order filters as router links with aria-current, and detail selectors as buttons with aria-pressed. Preserve setVisited and section mounting. Remove only obsolete styles for these two rails.
3. src/features/content/ProductsCatalog.tsx / products-catalog.css: adopt for the country filter rail, preserving market state and loaded-row filtering semantics. No invented whole-catalog counts.
4. src/features/shipping/ShippingRates.tsx / shipping-rates.css: adopt for public direction selectors only; condition on the existing staff flag so CRM pricing controls are unchanged. Preserve warehouse/service/product reset behavior.
5. src/features/ask/Ask.tsx / Ask.module.css: adopt only for Conversation/Current task selectors when rendered outside CRM. Keep language controls, conversation history waypoints, review/action behavior and focus handling separate. Confirm route boundary before editing shared Ask surfaces.

Excluded controls: CRM and its embedded Studio, navigation header/sidebar, real form steppers, language selection, weight presets, request market input, editor toolbar and date pickers. These have different control semantics. Public pages without tabs do not acquire new tabs.

## Count semantics and product language

For customer order filters, optional badges count ownerOrders using matchesCustomerOrderFilter. The query has limit(50); counts describe the loaded list, never the customer's complete order history. Keep the existing loaded-list scope disclosure and make its relationship to badges clear. Hide badges while loading or on read error, show zero only after a successful read, and preserve access filtering. Do not add requests, aggregate APIs, backend dependencies or fabricated counts. Other rails have no meaningful count and remain text-only.

Required implementation evidence: use write-product-content, inventory any added badge/scope accessible strings, and complete product-content review with all eight principles, web platform fit, selected/loading/error/zero states, narrow/wide layouts and keyboard behavior.

## Impact, alternatives and risks

Risk: low-to-medium UI regression across multiple pages; no database, API, IAM, payment, schema, deployment or infrastructure changes. Main risks are broad CSS selectors leaking into CRM, inaccurate count scope, loss of focus visibility, mobile overflow, and collisions with concurrent Ask/App edits. Scope styles explicitly and preserve handlers and data flow. Re-check actual diff against this plan.

Alternative: change global PageTabs/segmented CSS. Rejected because shared CRM surfaces would change. Adding server-authoritative totals is deferred because it expands contracts and exceeds the visual request. Rollback consists of reverting only this task's scoped diff, preserving unrelated WIP.

## Validation and handoff

After approval: frontend TypeScript check, focused existing order-filter/account-tracking and tab tests, targeted lint, and browser verification against the shared 5207 runtime. Check order URLs, detail draft persistence, country filtering, direction reset behavior, Ask selection/focus, desktop/mobile, keyboard, loading/error/zero counts and representative CRM regression. Test filenames will be selected from current test source; no duplicate servers or generated-file edits.

Complete quality-gate evidence, product-content review and mandatory final-implementation-review after implementation; repair approved findings and repeat affected checks. At plan creation, implementation, browser acceptance, final review and production verification were NOT_RUN. Current scoped evidence is in the completion report; production remains NOT_VERIFIED. Deployment is outside scope. Token usage and actual billed cost: Unavailable. Memory candidates: None.

## Approval required

Approve PUBLIC-TABS-20261008 v1 to authorize only the file/surface scope above. This is required by .ai/workflows/plan-existing-system-change.md, step 15: "Stop and request developer-team approval." Application edits were made only after the user message "Approved"; APPROVAL.md records the authorization.

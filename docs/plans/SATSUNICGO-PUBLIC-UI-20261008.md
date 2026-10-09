# PUBLIC-UI-20261008 v1 — đồng bộ toàn bộ UI ngoài CRM

Status: PLAN_READY, awaiting human approval. This is a new scope beyond PUBLIC-TABS-20261008 v1. No application code changed during this audit.

## Outcome and design contract

Bring every existing public/customer screen to one coherent SatsunicGo visual system: white surfaces, navy text, blue primary actions, compact spacing, thin borders, consistent page headings/forms/feedback and the recently approved plain text tabs. Preserve each screen's real task, state, labels, data source and transaction behavior. Home/editorial screens retain their content composition; account and purchase screens use their appropriate shared layouts.

Design reference: the user's screenshot 2 for page tabs, existing SatsunicGo brand and current account/purchase components for the rest. No new branding, font download, icon library or dependency. Layout variance 3/10 (reuse known structures), density 6/10 (compact but readable), motion 1/10 (existing purposeful feedback with reduced-motion support).

Reviewer preview: docs/previews/SATSUNICGO-PUBLIC-UI-20261008.html. This is a static design board, not a working application or evidence of implementation.

## Repository intelligence brief

- HEAD: 53d59bd88fa7da9d1243692336ecd09b6540ea31.
- Gate: DEGRADED. Both index tools installed, health passed, indexes stale against concurrent WIP. CodeGraph audit request timed out in its concurrent request queue. CocoIndex retrieval did not return within this bounded audit and was stopped. No indexed completeness claim.
- Evidence fallback: current App.tsx routes, route-modules.ts, feature render sections, main.tsx stylesheet imports, global/public/account/security/profile styles, Documents staff/public branch and shared document privacy headers, Loading/ErrorBoundary and relevant test filenames.
- .ai/context repository-map.md and build-test-commands.md remain placeholders. No nested source AGENTS override was found.
- Current stack: React 19.3, TypeScript 6, React Router 7, Vite 8, Vitest 4 and Playwright. Selected profiles: universal, typescript-javascript, frontend-html-css, web-app, visual-design and product-content; animation-motion only for modified existing motion.
- Runtime: reuse 127.0.0.1:5207, listener PID 33570 at audit. No restart/reseed, additional server, live payment, customer mutation or production action.
- Worktree: extensively dirty, including App/Ask/RequestForm/Profile/Membership/purchase files. Freeze task-local baseline immediately after approval; re-read relevant regions before each slice, preserve concurrent changes and stop for a material scope conflict.
- Browser audit: current documents/account/form/profile/membership/support surfaces observed at measured 1280px desktop. Heading sizes differ (profile/request 30px, membership 34px); request has visible controls measured 36–38px. Requested viewport overrides on the background audit tab did not alter the measured viewport; filenames containing mobile are not mobile proof. Final mobile acceptance is NOT_RUN for this new scope.
- Saved raw audit observations: output/public-ui-audit-20261008/observations.json. Initial profile/documents reads included loading; later profile/document headings were observed loaded. Browser screenshot failure and support locator mismatch are limitations, not acceptance passes.

## Verified gaps and smallest solution

1. App wraps profile/security in AccountRail/accountPage, but /account/documents renders Documents directly. Documents reuses CrmHeading even in public mode; a public heading branch and the account shell should unify navigation and placement without changing staff rendering.
2. Global CSS and public-ux.css are globally imported; feature CSS also sets heading/font/padding/radius separately. Broad changes to .page/.form/button can leak into CRM, shared invoice/shipping widgets and Ask task forms. Introduce public-scoped tokens/primitives and migrate explicit public presentation rather than broad global selectors.
3. Account headers, profileHeader, securityHeading, cartHeading and public content headings repeat the same title/description/action job with different geometry. A shared public heading avoids continuing that divergence.
4. Existing LoadingState already defines inline/panel/overlay semantics; keep it. Normalize surrounding empty/error/unauthorized/recovery presentation without changing authoritative state ownership, messages or handlers.
5. Some form buttons are below the proposed 44px minimum target. Normalize touch size, focus, native input sizing and wrapping across supported widths.

## Common UI specifications

| Element | Proposed standard |
| --- | --- |
| Public page width | Up to 1200px with consistent page gutter: 32px desktop, 24px tablet, 16px mobile |
| Focused form/article width | Form 720px; policy/article reading measure 760px; account content consumes its existing shell width |
| Typography | Preserve Inter/Arial; page heading 32px desktop / 26px mobile, section heading 20px, body/actions 14px, secondary metadata 12px; mobile form input text 16px |
| Space | 4/8/12/16/24/32px scale; page title/subtitle/actions aligned; 24px between main sections |
| Surfaces | White, border #e2e6ef, navy #111c35; panel radius 12px, fields/buttons 8px; restrained shadow for overlays only |
| Actions | Blue #163cff primary, secondary outlined, tertiary text; min 44px target, clear disabled/pending/focus; mobile primary actions may span available width |
| Tabs | Existing publicTabs style from screenshot 2; actual counts only; horizontal scroll when required |
| Forms | Persistent labels, associated hints/errors, native controls, clearly separated field groups; retain genuine steppers and draft mounting |
| Feedback | Reuse LoadingState; consistent inline status panels with current safe recovery action and caller-owned role/status/error semantics |
| Lists/tables | Consistent rows/cards and status tags; long values wrap; table overflow stays within its own accessible region |
| Overlays | Shared visual tokens, visible focus, current keyboard/focus/close behavior; keep Ask's existing interaction architecture |

These are role-based standards: home hero and product/editorial headings may retain their larger display scale where required by content hierarchy. Do not shrink legal caveats, hide unavailable values or remove business context for visual consistency.

## Complete route and embedded-screen inventory

| Surface | Source and intended presentation work |
| --- | --- |
| / | App.tsx Home/JourneyTimeline; normalize common actions/spacing and responsive clearance, preserve illustration and homepage hierarchy |
| /products | ProductsCatalog.tsx, CatalogCard.tsx and products-catalog.css; filters, cards, search, append/manual fallback and loading/error/empty |
| /products/:slug | Content.tsx, ProductDetail.tsx, product-detail080.css; title/facts/source/price/action hierarchy and mobile rows |
| /products/:slug/checkout | products/Checkout.tsx; form/summary/actions/feedback; preserve immutable product snapshot and full-payment contract |
| /cart | Cart.tsx, cart.css; rows/empty/errors/recovery/totals and sticky action clearance |
| /checkout | cart/purchase-checkout.tsx and purchase-checkout.css; real staged form, review summary, validation and pending/uncertain state presentation |
| /checkout/payment/:id and completion | purchase-payment.tsx, purchase-completion.tsx; status, documents/actions/receipt/download failure presentation; no financial action changes |
| /request | RequestForm.tsx, request-form.css; consistent form dimensions, fields, market selectors and real stepper; preserve the current approved purchase flow and handlers |
| /fees | ShippingRates.tsx and shipping-rates.css; public heading, fields/results/tables/notices; staff branch unchanged |
| /membership | Membership.tsx; heading, cards/terms/request/history/empty states, including embedded Ask view; no membership price or eligibility changes |
| /account and order filters | App.tsx Account, account.css; shared heading/list/state geometry and existing public tabs/counts |
| /account/orders/:id | App.tsx OrderCard, OrderTools.tsx, OrderConversation.tsx, OrderConversation.css; detail sections, messages, summary, forms, tables and feedback |
| /account?view=shipments | CustomerShipments.tsx; consistent parcel cards, heading levels and empty/error/loaded states |
| /account?view=notifications | notifications/Notifications.tsx and notifications.css; consistent list/state/action presentation |
| /account/profile | Profile.tsx, profile.css; heading, personal/address forms, field hints, stepper/recovery/uncertain states; same styling in public Ask context |
| /account/security | Security.tsx, security.css; visual alignment of heading/cards/enrollment/recovery forms; preserve MFA controls and flow |
| /account/documents | App.tsx, AccountRail.tsx, Documents.tsx; account shell plus explicit public heading branch; extend AccountRail active union for documents and mark its existing documents link current |
| /documents/shared | Documents.tsx SharedDocument/StatementView; lightweight shared-view heading/status/readable document, no account sidebar, privacy/token behavior retained |
| /support | Support.tsx and public-ux.css; heading/form/ticket/conversation/state consistency; privacy request types remain explicit |
| /posts and /posts/:slug | Content.tsx, public-ux.css and blog-comments027.css; cards/article/comment/empty/loading/error presentation and readable content widths |
| /how-it-works | App.tsx PublicPage; readable editorial layout using actual published content |
| /privacy | PrivacyPage.tsx and privacy105.css; typography/table/sections/navigation/action consistency; preserve pending-policy disclosure |
| /terms | TermsPage.tsx and terms-page.css; reading measure/section rhythm/common action; legal policy facts unchanged |
| /restricted | RestrictedPage.tsx and restricted-page.css; cards/disclosures/FAQ/actions and long text wrapping |
| Unknown routes | App.tsx/PublicPage fallback; common not-found presentation and existing safe home link |
| Ask public idle/dialog/task/answer/action/error surfaces | Ask.tsx, Ask.module.css, customer-workspace.css, CustomerWorkspace.tsx, ActionWindow.tsx/ActionWindow.module.css, Research.module.css; shared field/button/surface/feedback tokens with public guards; retain chat/task architecture, drafts and action review |
| Public site chrome and feedback | SiteChrome.tsx, AnalyticsConsent.tsx/analytics-consent.css, AuthFeedbackToast and LoginChallenge presentation, ErrorBoundary/ErrorBoundary.module.css; visual consistency and accessibility while retaining consent/auth/error meanings and CRM mode |

## Implementation slices and exact boundaries

1. Foundation: add src/shared/PublicUi.tsx (public heading/status presentation, caller-owned text/actions/roles) and src/shared/public-ui.css (scoped tokens and styles). App.tsx adds the public main class; SiteChrome and public Ask attach explicit scope where outside main. Retain shared LoadingState and public-tabs.css. Do not edit CRM PageTabs or shared StepForm behavior.
2. Account: adopt public heading/state primitives in App Account/OrderCard and feature presentation above. Add documents to AccountRail active contract and reuse accountWorkspace/accountPage in App documents route. Remove duplicate public outer padding, not nested task identity headings. Documents staff mode continues to use CrmHeading unchanged.
3. Catalog/purchase/request: migrate only JSX presentation/class names/styles in the listed files. Preserve every load/filter/pagination/calculation/save/cancel/confirm/payment handler, readiness barrier, UID/version fence and durable recovery state. Adjust control sizing and mobile composition proportionally.
4. Informational/support/membership: normalize public page/section/action roles and copy placement. Reuse current labels and recovery behavior. Any wording change requires a complete product-content inventory; changes to policy/payment/pricing facts require a separate owner-backed decision and delta approval.
5. Ask/chrome: apply the same public visual primitives to existing UI states; preserve action/confirmation boundaries, modal focus, mounted form drafts, VI/EN support and the currently approved Ask layout. Auth/consent/ErrorBoundary styling must explicitly distinguish public vs CRM/shared contexts.
6. Validation and final review: retain screen-by-screen current source hashes, screenshots, viewport measurements and state results. Fix in-scope presentation findings and re-review until a fresh cycle passes.

Allowed existing style files: styles/account.css, security.css, public-ux.css, form-labels.css; features/account/account-rail.css, profile/profile.css, notifications/notifications.css, cart/cart.css, cart/purchase-checkout.css, requests/request-form.css, shipping/shipping-rates.css, support/OrderConversation.css, content/products-catalog.css, product-detail080.css, blog-comments027.css, privacy105.css, terms-page.css, restricted-page.css and Ask styles listed above. Global.css and shared Loading CSS may be inspected but remain unchanged by default; public-ui.css owns this task's standard. src/app/main.tsx may import the new public stylesheet. Any unlisted module with required edits needs a delta plan.

## Risk, constraints and alternatives

Risk: MEDIUM due cross-page CSS and sensitive shared purchase/auth components. Visual-only scope still needs transaction regression evidence. No backend/domain/API/schema/IAM/secret/CI/deployment change, dependency installation or existing business-rule rewrite. Public styles must not leak into /crm or /staff, even when the same module is imported there. Preserve all unrelated WIP.

Tradeoff: shared public primitives + scoped feature adoption take more explicit work than global overrides, but permit bounded CRM isolation. A wholesale reimplementation of page state/controllers is unnecessary for this task. Keep reusable shared primitives small and preserve existing specialized components. Rollback uses this task's baseline diff only.

Unknowns: not every loaded/error/unauthorized screen has browser evidence yet; authenticated document details and real successful payment require suitable demo fixtures. Current purchase work is concurrent, and policy copy must be checked against its approved specification before any wording change. Do not reinterpret a missing callable/provider result as zero, an empty list, confirmed payment or success.

## Acceptance and verification matrix

- Every inventory row must have a recorded completion decision; common controls/headings/cards/forms/states conform to the shared standard or have a justified content-role exception.
- Reuse port 5207. Verify actual viewport dimensions at 320/390/768/1280px, 200% zoom/text expansion, keyboard focus and reduced motion. Screenshots include both meaningful content and empty/error states; do not count loading screenshots as loaded acceptance.
- Reconfirm Account route/filter counts, document current navigation, detail drafts and lazy panels, catalog pagination/manual fallback, shipping direction reset, profile recovery, MFA steps, membership handling, cart totals and checkout confirmation boundaries with current tests/fixtures.
- Frontend compiler: node node_modules/typescript/bin/tsc --noEmit. Targeted ESLint on changed TSX files. git diff --check against task baseline.
- Existing focused unit suites selected from current source: customer-order-filter073, account-tracking-request073, request-input, cart107, purchase-checkout, profile-state/profile-save-recovery, membership-command/membership-command-recovery and staff-route.
- Existing browser checks as compatible with shared runtime: products-infinite10, product-detail080, request083, profile-recovery, membership-workspace, notifications079, cart107 and relevant release-account-tracking/support/security specs. Inspect configs first; do not invoke specs that start forbidden duplicate servers or destructive fixtures. Equivalent native-browser evidence is acceptable when a fixture configuration cannot reuse 5207.
- Record signed-out, owned signed-in and access-denied states; never bypass MFA or mutate seeded orders just to produce screenshots. Finance/payment/provider success remains NOT_VERIFIED unless actually demonstrated through an authorized safe fixture.
- Product Language Gate: changed-string/data inventory, state semantics, native AX evidence, all eight principles, web platform fit and in-context review. Preserve policy uncertainties rather than invent approval dates or guarantees.
- Mandatory final-implementation-review with every cycle/finding/fix; scoped source manifests and completion report. Implementation/tests/final review for this new scope are NOT_RUN until approval and execution. Production/deployment outside scope; token usage and actual cost Unavailable; memory candidates None.

## Approval requested

Approve PUBLIC-UI-20261008 v1 to authorize the full inventory and implementation boundaries above. Previous tab approval covers only the completed tab slice. Repository workflow .ai/workflows/plan-existing-system-change.md step 15 says: "Stop and request developer-team approval." Application changes begin only after this expanded plan is approved.

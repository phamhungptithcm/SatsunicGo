# SATSUNICGO-CRM-SPACE-019 — Separate CRM space

Status: concrete delta plan awaiting human implementation approval. User selected same website `/crm`, with its own interface and navigation. This choice establishes direction; the file-level change below still needs reviewed-plan approval under repository policy. No protected implementation files changed for this delta.

## Requirement and verified gap

Customers browse SatsunicGo, purchase/request products and track their orders. Staff need a distinct working space for customer management, requests, conversations and operations. Today App renders SiteHeader and SiteFooter around every route; `/staff/*` has a Workspace sidebar inside that public shell. Ask is already excluded on `/staff`. Workspace and cross-module links hardcode `/staff`, including notification destinations.

Reference checked live from local HunpeoLabs source: app/admin/blog/layout.tsx uses StudioShell; components/blog-admin/chrome.tsx BlogChrome hides public chrome on `/admin/blog`, with its own sidebar and account controls. Adopt the separation pattern and SatsunicGo visual language; do not copy editorial-only behavior or change HunpeoLabs.

Intelligence: current base 3bd0d093255963a2cbf66ddd80d27456da7076e0; dirty shared worktree. CodeGraph health previously verified and refreshed; source changed concurrently since indexing. CocoIndex unhealthy after bounded refresh attempts. DEGRADED evidence: targeted App, SiteChrome, Workspace, role gate, route/link searches, notification resolver and verified local reference source. Structural/semantic coverage is bounded; recheck exact candidate before implementation. No linked issue supplied.

## Proposed experience

- `/`, `/products`, `/request`, `/account`: existing customer space.
- `/crm`: staff landing page selected from existing role-allowed pages.
- `/crm/orders`, `/crm/customers`, `/crm/support` and existing operational pages: independent CRM shell, compact sidebar, page heading, staff identity, sign-out, and “Xem website” link.
- Public header/footer and customer Ask do not appear in CRM. Branding: “SatsunicGo CRM”; public staff entry: “Mở CRM”. No duplicated nested navigation.
- Anonymous access shows CRM-specific sign-in state; signed-in non-staff, locked, loading and failed authorization states remain explicit. Client navigation never substitutes for callable/Firestore authorization.
- Old `/staff/*` URLs redirect to matching `/crm/*`, preserving encoded path, query and hash. Existing notification/bookmark links remain usable; new staff notifications use canonical CRM URLs.
- Order conversation, assignment and internal-note behavior stays as validated in COMMUNICATION-017. Catalog full payment/custom purchase installments stay as defined by PURCHASE-FLOW-018.

## File-level implementation

1. src/app/App.tsx: isolate public versus CRM layouts; reuse existing authenticated Staff gate; `/crm/*` route and compatibility redirect; extend auth-loading route recognition. Keep global feedback/security controls available without public chrome.
2. src/features/crm/Workspace.tsx and its existing styles: canonical CRM links/active state, compact independent shell, account/sign-out controls passed from App, mobile menu and focus handling. Keep existing role-filtered pages and lazy modules.
3. src/app/SiteChrome.tsx: authorized staff entry points to `/crm`; preserve public/customer navigation.
4. Add a small shared staff-route helper if needed. Update confirmed links only: CRM Dashboard/Customers/Customer, operations Workbench/Returns, payments Refunds, support Thread, and src/features/content/notification-target.ts. Inventory any additional `/staff` occurrences before editing; do not broadly rewrite URLs in policies or historic records.
5. Tests: meaningful URL redirect/query/hash compatibility and notification routing assertions; local browser checks for public versus CRM shell, anonymous/non-staff/locked access, role-filtered navigation, direct deep links, customer privacy and mobile keyboard navigation. Reuse existing authorization coverage; no server/data schema changes planned.
6. Docs: approval evidence, changed-string/state inventory, product-content review with actual screenshots, scoped validation and fresh final review/report.

## Impact, boundaries and validation

Risk MEDIUM: routing and shared UI chrome affect deep links, sign-in restoration, navigation and accessibility. React/TypeScript/Vite/React Router stack remains unchanged. Profiles: universal, typescript-javascript, web-app, frontend-html-css, visual-design, product-content. No new dependencies, collection migration, provider connection, domain/DNS, Firebase configuration, billing or deployment. Reuse existing staffAccess/current-account controls and server checks. CSS must stay scoped to CRM to prevent customer-layout regressions.

Acceptance: CRM has its own shell; customer page keeps public shell; all role-allowed sections work at `/crm`; old links reach the same resource with filters intact; unavailable/unauthorized states cannot expose staff content; conversation and customer-only order view still work. Run typecheck, lint, focused route/notification tests, production build, existing relevant staff/security checks and local desktop/mobile browser validation. Report emulator/local evidence separately from production.

Rollback: revert this scoped UI/routing patch; `/staff` remains original entry and stored data is unchanged. Deployment remains a separate authorized step. Alternative separate subdomain deferred by explicit user choice. Shared WIP must be preserved; no whole-worktree commit/release certification.

Approval request: approve CRM-SPACE-019 v1 for the file-level scope above. Material expansion needs a delta plan. Memory candidates: None.

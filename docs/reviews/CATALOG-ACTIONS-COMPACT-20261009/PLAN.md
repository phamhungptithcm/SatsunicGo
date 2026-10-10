# Catalog card compact actions — v1

Plan ID/version: CATALOG-ACTIONS-COMPACT-20261009 v1
Repository intelligence gate status: READY
Indexed analysis reviewed: CodeGraph structure then CocoIndex retrieval; verified current source and shared5207 listener.
Approval status: APPROVED
Approver: repository owner in this chat
Approval timestamp or task reference: 2026-10-09 latest explicit implementation instruction with screenshot: “cụm này cùng hàng thiết kế same type cùng loại không nhập số lượng ở đây chỉ nhập số lượng trong deteail screent”. Existing local UI implementation approval persists.
Approved scope: Narrow catalog action grouping and removing catalog quantity control, while preserving product-detail quantity editing.
Approved paths:
- `src/features/cart/AddToCart.tsx`
- `src/features/content/ProductsCatalog.tsx`
- `src/features/content/products-catalog.css`
- `docs/reviews/CATALOG-ACTIONS-COMPACT-20261009/**`
Required constraints: Preserve concurrent WIP, cart/server validation/variant requirements, detail default, payment routes, auth, analytics and runtime. No deployment, production writes, new dependency, contract/schema/config changes.

## Change impact and implementation

Observed: ProductsCatalog renders AddToCart (variant, quantity, action and feedback) above a separate detail/buy footer. ProductDetail shares the same AddToCart default. Cart mutation validates integer1–100 and requires valid variant; account writes use existing private callable path.

1. AddToCart: optional compact prop; hide number control and use fixed quantity1 in validation and mutation in compact mode. Preserve variant selection, busy/offline/cache guards, feedback and recovery link. Default detail rendering unchanged.
2. ProductsCatalog: put compact AddToCart and both existing navigation links in one productAction group; retain eligibility and routes.
3. Catalog CSS: scoped grid row for three same-style outlined blue actions, variant/feedback full-width as needed,44px minimum targets, visible keyboard focus, wrapping for narrow/text-expanded layouts. No global cart/detail CSS changes.

Risk: low reversible UI; shared component mode could accidentally affect detail quantity or select variant. Check actual catalog/detail rendering and cart resulting quantity, keyboard, mobile320/390, feedback and variant disabled state; scoped lint/format and TypeScript. No new low-value mirror tests; reuse existing cart units and actual UI for meaningful validation.

Profiles: universal, TypeScript/React19/Vite8/Node22, frontend HTML/CSS, web-app, product-content; bounded concurrency/security review on unchanged mutation guards.
Rollback: restore only this patch against baseline hashes after checking concurrent edits.

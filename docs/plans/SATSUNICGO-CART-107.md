# SATSUNICGO-CART-107 — Giỏ hàng phù hợp luồng catalog hiện tại

Status: PLAN_READY / AWAITING_HUMAN_APPROVAL. No application edits authorized yet.

## Repository intelligence and observed facts

- Gate: DEGRADED. `check-repository-intelligence.py --json` failed with OS resource error 35 while launching CodeGraph. Neither CodeGraph nor CocoIndex health/freshness is established. Evidence below is bounded direct source inspection, not exhaustive impact coverage.
- React 19, React Router 7, TypeScript 6, Firebase 12, Zod 4, Vite 8; versions verified in package.json.
- `src/features/content/products-catalog.css`: white/light-gray surfaces, navy #111c35, blue #163cff, restrained borders, rounded controls, 44px interaction targets.
- `src/features/content/ProductsCatalog.tsx` and `ProductDetail.tsx` link directly to single-product checkout. No cart implementation found in bounded source search.
- `src/features/products/Checkout.tsx`: quantity 1–100, catalog option selection, authenticated checkout, per-user session retry record, stable operationId for uncertain outcomes.
- `packages/domain/catalog-checkout.ts`: one catalog product per order, immutable catalogSnapshot, full payment, version validation, total bounds. Custom requests have a separate business flow.
- `functions/src/catalog-checkout.ts`: verified Google guard, App Check, locked-account checks, transactional creation, idempotency, acceptance, audit and outbox records. Server determines price.
- `src/shared/firebase.ts`: getFirestore initialization; no explicit persistent cache configuration. `src/shared/public-content.ts` already shares live public listeners and tracks cache/offline metadata.
- `firestore.rules`: client writes denied; no cart collection rule. New persistence must respect server-controlled mutations.
- Shared frontend listener observed on 127.0.0.1:5207. Do not restart/reseed or create another server.
- Dirty App.tsx, authentication/content files and generated assets exist. Preserve all unrelated edits; edit App.tsx only around cart integration and recheck concurrent changes.
- Architecture/ownership/glossary context contains placeholders. Business rules come from source; ownership remains unknown.

## Proposed experience

1. Add a Giỏ hàng navigation destination and count; add-to-cart controls on catalog/detail. Products with options require an explicit variant choice before addition.
2. `/cart`: desktop item list plus a compact summary; mobile single column with an accessible summary/action area that does not obscure content. Reuse existing colors, typography, image component and controls.
3. Each row shows image, title, selected variant, quantity, unit price, subtotal and remove action. Same product + variant merges, respecting the 100-unit bound. Maximum 30 distinct rows keeps reads/writes bounded.
4. Total is labeled Tạm tính until current catalog data is validated. Unavailable products remain visible for removal; changed price/options require review. No invented stock, savings, ETA or payment success.
5. First scope: cart contains multiple products, but each row continues to its existing single-product checkout with prefilled selection. Display clearly that each product creates a separate order/payment. Do not present a combined-payment CTA.
6. Do not delete a row just because checkout opens. After a confirmed order result, remove only the corresponding confirmed quantity; preserve edits added concurrently and retain the row on uncertain results.

## Persistence, cache and authority

- Guest: versioned local cart containing productId, variant and quantity only; no recipient/contact/payment data. Storage failure is surfaced and an in-memory fallback is labeled accurately.
- Signed-in: owner-private `carts/{uid}` with bounded selections, revision and server timestamp. Firestore listener supplies current state; callable mutations validate account access, inputs and expected revision in transactions. Direct client writes remain denied.
- Merge guest selections only after explicit user action after sign-in; clear guest entries only after server confirmation. Never silently transfer an account cart into guest storage.
- Account changes: unsubscribe and clear private in-memory state immediately. Namespace pending commands and local keys by project/account, guard late responses, prevent old snapshots from resurfacing.
- Cache public product snapshots separately with a bounded TTL and deduplicated reads. Cart selections may be restored offline; cached price is informational and checkout remains online/server validated. Avoid changing global Firestore persistence or retaining unrelated private Firestore collections.
- Offline account cart edits are not reported as server saved. Retain explicit unsent selections or disable server mutations with a clear recovery action; no blind replay.
- Cart revision conflicts reload the latest cart and preserve recoverable input. Stable operationId handles mutation retry; no duplicate merges or quantity increments on retries.
- Backend checkout continues using catalog version, authoritative price and existing payment rules. No new payment aggregator, multi-item order schema, coupon or inventory reservation.

## File/function implementation map

- NEW `packages/domain/cart.ts`: schemas, canonical row keys, bounded merge/update/remove logic, checkout reconciliation.
- NEW `functions/src/cart.ts`: read/modify cart callable, transactional version checks, idempotent operations, verified account/lock guards.
- `functions/src/index.ts`: export cart callable only.
- `firestore.rules`: owner-only cart get, no list or client writes; respect existing locked-account restrictions.
- NEW `src/features/cart/{Cart.tsx,cart-store.ts,cart-cache.ts,cart.css}`: page, scoped store lifecycle, guest persistence, cloud listener/mutations, product freshness and responsive styling.
- `src/app/App.tsx`: lazy cart route, minimal navigation/count integration, user propagation.
- `src/features/content/ProductsCatalog.tsx`, `ProductDetail.tsx`: add-to-cart entry points; preserve existing buy-now path.
- `src/features/products/Checkout.tsx`: consume/validate cart selection; preserve pending retry authority; reconcile cart only after confirmed order, using the exact attempt selection.
- `src/shared/firebase.ts`: register read-only cart service classification only if separate read callable is needed; preserve initialization/auth and global persistence.
- NEW `tests/unit/cart107.test.ts`, `tests/rules/cart107.test.ts`, `tests/browser/cart107.spec.ts` and browser config if needed: bounded meaningful tests.
- NEW approval, product-content and review evidence under docs/approvals and docs/reviews/SATSUNICGO-CART-107; no generated-file edits.

## Risks, checks and preserved boundaries

Risk: HIGH for new private persistence/account isolation and MEDIUM for UI; financial flow remains unchanged. Validate schemas, negative/oversized quantities, row limits, merge idempotency, conflict handling, concurrent quantity changes, sign-out/account swap, inaccessible products, price/version changes, unavailable storage, offline state and ambiguous request results.

Run typecheck, focused unit tests, Firestore denial/owner isolation tests and callable emulator checks when compatible with the existing shared suite. Browser checks use ONLY 5207: desktop, 390px/320px, keyboard/focus, zoom, long titles, loading/empty/error/offline and changed-price states. No restart, reseed or alternate port without explicit authorization. No deployment or production writes in scope. Provider payment and production readiness remain NOT_TESTED.

Selected quality profiles: universal, typescript-javascript, web-app, frontend-html-css, visual-design, accessibility, product-content, api, database, security and concurrency where existing profiles apply. Product Language Gate must inventory all strings and verify Purpose, Agency, Responsibility, Familiarity, Flexibility, Simplicity, Craft and Delight in rendered web UI. Final implementation review and task completion report follow implementation; neither is claimed passed for this plan.

## Alternatives and approval boundary

Recommended: multi-product cart with per-product existing checkout, owner-private cloud selections and scoped cache. Alternative: one combined order/payment requires a separate approved impact plan covering order schema, payments, invoice, CRM, Ask, shipping and refund consumers.

Approval requested for CART-107 as written, including new cart callable/private collection/rules and the listed integration paths. No dependency additions, global Firebase persistence change, custom-request merge, payment redesign, runtime restart, deployment or production operation.

# Compact cart recovery — v1

Plan ID/version: CART-RECOVERY-COMPACT-20261009 v1
Repository intelligence gate status: READY — DEGRADED index freshness; bounded current source, caller/rule/domain/test inspection complete. CodeGraph queried first, CocoIndex second; one refresh attempted. Optional stale indexes do not block safe scoped work.
Approval status: APPROVED
Approver: repository owner in this chat
Approval timestamp or task reference: 2026-10-09 explicit screenshot instruction to remove unnecessary cart banners, trace logic and revise required UI/UX/business flow; earlier approved complete cart implementation and local demo UI testing persist.
Approved scope: Simplify guest-to-account cart continuity and price recovery on the existing cart; retain item preservation, validation and checkout guards.
Approved paths:
- `src/shared/firebase.ts`
- `src/app/SiteChrome.tsx`
- `src/features/cart/Cart.tsx`
- `src/features/cart/cart-store.tsx`
- `src/features/cart/cart-cache.ts`
- `src/features/cart/cart.css`
- `src/features/cart/cart-guest-transfer.ts`
- `tests/unit/cart-guest-transfer.test.ts`
- `tests/unit/cart-cache.test.ts`
- `tests/unit/cart-service-feedback.test.ts`
- `tests/unit/cart-recovery-view.test.ts`
- `docs/reviews/CART-RECOVERY-COMPACT-20261009/**`
Required constraints: Preserve all concurrent WIP and product images/catalog/detail actions. No server/API/domain schema/rules/dependency/config changes, server restart, production mutation or deployment. Source ownership coordinated with integration owner.

## Observed flow / impact

CartProvider reads anonymous localStorage cart separately from private Firestore account cart. CartPage displays a manual merge banner even for an apparently empty account cart. Account merge uses revision and idempotency validation but current client pending recovery is per-tab; automatic transfer needs shared cross-tab serialization and an exact durable command to avoid duplicate quantities after an uncertain response. Auth-change asynchronous responses must never apply to a new account. cartProducts loads up to30 IDs in one server query, caches public previews and returns a generic connection banner on all errors. CartPage already reloads on online change and every5minutes; unknown/cached prices block review. Backend checkout revalidates prices independently.

## File/function plan

1. cart-guest-transfer.ts: small tested coordinator with Web Locks, per-browser project-scoped durable transfer journal and existing cartCommand shape. Persist exact owner/command before send; serialize across tabs, retry uncertain requests identically, reconcile only confirmed quantities, preserve guest choices on rejection/storage failure. Decline automatic transfer when cross-tab locking unavailable; retain compact explicit recovery.
2. cart-store.tsx: wrap existing mergeGuest in coordinator, reconcile confirmed existing pending command through the same journal, bound automatic attempts through CartPage, isolate reads/mutations by auth generation and clear account state on switch. Preserve server-authoritative cart/revision/locks and existing pending mutation contract.
3. Cart.tsx: on opening cart automatically transfer once after account/server readiness, retry naturally on reconnect; no repeated failed auto loop. Replace manual normal-state banner with a short live pending state; retain small inline retry only when required. Move product-price recovery to summary beside disabled review action, mark cached totals as unverified, no duplicate offline/error blocks. Empty/custom-only carts must not load product prices. No hiding unresolved updates or enabling unverified checkout. Render unmerged guest choices as product rows with local quantity/remove controls so an unavailable choice never becomes a global cart trap. Serialize those local edits with transfer and block edits while an uncertain transfer remains.
4. cart-cache.ts: retain bounded public cache/batch/inflight cleanup; combined account/guest view is capped at60 unique product IDs in at most2 batches of30; distinguish offline from service failures, keep expired values informational only. Test empty/custom-only, query failure, recovery and deduplication.
5. cart.css: compact neutral recovery text and inline44px actions, no blue notice boxes for these states; preserve existing product/card/thumbnail layout. Narrow and expanded text must wrap without overflow.
6. Focused tests: concurrent tabs, uncertain reply/exact retry, storage failures before/after commit, account change, unavailable/invalid product merge, quantity preservation; server handler regression tests. Actual shared5207 UI happy cart/empty/price failure/recovery, keyboard320/390/desktop. Own fixtures only with backups and cleanup; preserve human existing guest choices by confirmed account transfer rather than deletion.

Risk: medium cart data continuity and recovery. No payment/order writes. Existing server guards remain authoritative. Cross-tab journal remains local and bounded to one transfer, contains no token/price/PII. Unsupported locking degrades to a clear compact recovery; never allow unsafe automatic writes.
Rollback: restore only owned patch against current baseline hashes; keep local transfer journal when uncertain. No database migration or server rollback needed.

Profiles: React19.3/TypeScript6/Vite8/Firebase12 web; universal, typescript-javascript, frontend-html-css, web-app, product-content, concurrency, memory, API/data integrity review of unchanged callable.

Observed caller correction: SiteChrome treats every cart mutation error as a failed cart read and hides the count. Restrict that state to error plus unverified/cached cart so an unavailable guest choice does not mislabel an already-loaded account cart. Two conditions only; unrelated navigation/auth untouched.

Verified local cause: same public ID/status query succeeds for an existing fixture but returns permission-denied for a missing ID. Add a permission-denied-only per-ID fallback with at most4 concurrent lookups per batch (at most8 across2 batches), max60 IDs. Omit unreadable rows without private-data inference, keep available rows current, retain global unverified/error state for network/service failures. Backend/rules unchanged.

Automatic merge feedback correction: shared callService currently opens a global overlay and duplicates inline cart errors as toast. Add optional feedback inline/global (default global) and thread boolean only into overlay/toast; preserve runWithMfaRecovery, authenticated identity/path checks, mutation timeout and payload. Cart store opts into inline for cartCommand only. Other callers retain identical defaults.

Rendered caller consistency: header count must include visible unmerged guest choices (guestItems empty in anonymous mode) to match the cart product rows. Preserve99+ cap and privacy/loading states.

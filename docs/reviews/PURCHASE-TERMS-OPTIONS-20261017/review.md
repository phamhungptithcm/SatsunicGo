# Final implementation review

Scope and authorization: plan.md. No dependency, schema, auth, payment, infrastructure or workflow changes. Runtime ledger adapter is unavailable in this worktree; this evidence report is the fail-open manual equivalent. Token usage and actual billed cost: Unavailable. Memory candidates: None.

Cycle 1: BLOCKED — browser regression selectors still used the old option label. Corrected the three affected specs without weakening assertions. Also found checkout lacked a direct link to expanded policy; added a new-tab link that preserves checkout state. Local shared dependencies initially missed chokidar-core, resolved by isolated `npm ci` against unchanged lockfile. Temporary preview setup first rejected by automatic approval review; explicit user permission for port 5208 then obtained. Mac lock interrupted keyboard testing; resumed after user unlocked.

Cycle 2: PASSED for release candidate. Reviewed complete diff and consumers. No known actionable finding remains within executed checks.

- Requirement: detailed return/refund/cancellation terms replace placeholder; every caller uses exact per-product options, and single-option fresh selections work without another choice.
- Security/privacy: no credentials or customer data changed; no order/cart/payment commands executed during QA; React escapes option text. Support privacy guidance and consumer rights preserved.
- Correctness: stale explicit choice is not overwritten; cart-origin choice and pending snapshot remain untouched; multiple options preserve explicit selection and disabled semantics. Existing backend membership/version/idempotency checks unchanged.
- Failure paths: no options, empty choice, stale mismatch, pending/disabled rendering, unavailable products and original price-review flow examined. New tests cover helper/render boundaries; existing catalog/cart suite covers domain validation.
- Error handling: no new asynchronous calls or exception paths. Existing recovery/pending behavior retained.
- Product language: product-content-review.md PASSED with live rendered browser evidence, focus navigation and 200% zoom.
- Operational readiness: local Node 22 typecheck, frontend/Functions builds, full lint passed. Full Vitest: 192 files / 3095 tests passed; focused 4 files / 65 tests passed again after final text/link updates. Diff whitespace check passed. Existing pipeline supplies rules/HTTP/restore integrations, immutable artifact, Hosting+Functions binding, provider readback and release publication. Those live gates remain required after push.
- Tradeoffs: no fixed vendor return deadline, refund SLA or universal return guarantee is promised. Support handles case-specific acceptance and timing. Production business operations and refund execution are not proven by content/UI tests. Full product browsing/readback follows deploy.

Rollback: revert this scoped commit and run existing release pipeline; do not mix Hosting assets with an older Functions publicPage bundle. Unrelated dirty primary checkout never enters this candidate.

Cycle 3: BLOCKED after production readback — all seven policy sections and 20 specifications matched, but the catalog's `display: contents`/three-column action grid compressed the new static specification to 88 px. First fixture did not include this container. Classified medium visual regression; corrected by adding the specification class to the existing full-width grid selector. No quantity, price or action changes.

Cycle 4: PASSED for corrected release candidate — reviewed the one-selector diff and all applicable styles. Actual CatalogCard/AddToCart/CartProvider fixture at desktop and 390 px confirms full-width specification and separate action row. Build/typecheck rerun. Existing semantic tests and first release CI remain relevant because only CSS changed; subsequent pipeline remains required. Screenshots and measurements are recorded in product-content-review.md.

Separate observed pre-existing limitation: navigating directly to `/products/:slug/checkout` returns 404 because Hosting routes `/products/**` to publicPage, whose route regex excludes checkout. These files are unchanged from the base. Navigation from the catalog succeeds; Biotin showed the exact 100-capsule option, quantity 1, 305000 VND, enabled submit and `/terms` link. No order was submitted. Routing correction is outside this content/specification scope and was disclosed to the user.

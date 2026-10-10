# Catalog producer isolation

Approved scope: PRODUCTION-TEST v1 (`APPROVAL.json`, human approval call
`call_5081fd46f74546c08b78d7a095730a9a` item0). Root assigned this bounded
catalog/cart producer correction after independent finance review.

Repository intelligence remains DEGRADED as recorded in `TEAM-BRIEF.json`;
bounded source, Git, compiler and focused handler tests are used.

Observed: `catalogCheckout` is exported by `functions/src/index.ts` and called
by the product Checkout and Ask commerce flows. It creates orders directly,
without the newer cart checkout producer. Its transaction currently writes an
unmarked order, acceptance, timeline, audit, idempotency and outbox records.
Those orders can therefore reach ordinary finance, invoice and dashboard
consumers while the approved production-test artifact is active.

Implement only `functions/src/catalog-checkout.ts` and a focused actual-handler
test. In the existing transaction, preserve authenticated, unlocked idempotent
replay before checking current policy. For new orders in artifact v1, require
the exact production-test environment and an approved, active policy admitting
the current user. Read that policy within the transaction; fail closed before
any write on missing or invalid admission. Stamp server-created immutable
mode/policy/run provenance and `testMode` on the order and its transaction
derivatives, including the response. Preserve legacy behavior outside v1.

No stock/reservation/vendor writer exists in this producer or
`createCatalogOrder`; the producer writes no bank transaction or ledger. Do not
invent stock simulation or change payment activation. Existing downstream
real-money/physical guards remain authoritative. No new UI or server, provider
request, secret read, production write, push or deployment is included.

Validate actual callable happy path, disabled/missing/expired/future/unapproved
policy, wrong tester/project/runtime, forged provenance, locked/unauthenticated
actor, stale product, policy-off replay and conflicting operation reuse. Assert
zero writes on rejection and no real financial/stock side effects. Run scoped
lint and both strict compilers, then review the current complete diff. Product
copy reuses the existing denial message `Không thể đặt mua lúc này.`; rendered
product acceptance remains assigned to the UI/root owner.

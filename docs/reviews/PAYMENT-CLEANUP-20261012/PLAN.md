# Compact payment status

Authority: human directly requested removal of unnecessary checkout wording and a cleaner Shopee-informed flow; existing release instruction authorizes scoped fixes, review and release without repeated approval. This plan narrows implementation to payment presentation. No payment proof, pricing, AI, database, security or provider behavior changes.

Intelligence: CodeGraph located PurchasePayment and route callers; CocoIndex identified SePay recovery runbook. Results verified against main 255a9669. Primary contains separate uncommitted expiry hardening, which is preserved and excluded from this candidate. TypeScript/React19/Vite8, existing CSS, Vitest. Indexes reference primary; isolated candidate verified directly.

Observed problem: unknown SePay presents two controls calling read(), repeated explanatory prose and an internal UUID before the amount. read() preserves owned checkout during provider outage and financial proof remains server-authoritative.

Implementation:
1. purchase-payment.tsx: remove redundant introduction; put status and compact test badge first, amount/products next; shorten failure/cancel/review prose without claiming success or removing payment-again warning. Move full reference into native details. One check action for SePay unknown; retain distinct gateway and check actions for pending/demo (different operations). Preserve every callback/authorization/provider guard.
2. purchase-checkout.css: scoped compact payment summary, readable state hierarchy, responsive product row and full reference wrapping, minimum44px controls.
3. component test/config: status/action matrix, unknown reconciliation-only, pending gateway, cancelled/review no payment CTA, unavailable/loading, duplicate controls, details semantics, no raw internal prose.
4. docs: copy inventory, state/principle evidence, independent final review and report.

Reference: official Shopee Help article79472 separates clear order statuses. Apply familiar status-first information hierarchy; preserve SatsunicGo blue/white design and actual business semantics.

Validation: focused component tests + SePay/domain regression + TypeScript + scoped lint; rendered narrow/wide fixture on existing5207 only, keyboard/details/overflow. Independent read-only review; fix and re-review. Release only from frozen CI artifact after source checks. Rollback normal previous artifact; no DB changes.

Review cycle1 found repeated-click/no-feedback gap in read(), within requested cleanup. Added generation-scoped single-flight checking, disabled action/loading label and stale guard before second status read. No new provider operation; regression includes delayed request/account change. All13 component checks pass;157 domain checks pass; TypeScript and scoped lint pass.

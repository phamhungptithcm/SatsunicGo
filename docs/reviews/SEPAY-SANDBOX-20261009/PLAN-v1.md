# SEPAY-SANDBOX-20261009 v1 — implementation and impact plan

Status: PLAN_READY / AWAITING_REVIEWED_PLAN_APPROVAL. Risk: HIGH (external payment gateway, secret binding, transactional settlement and public contract additions). This is a delta from the approved emulator-only payment plan, which explicitly excluded new dependencies/live provider activation. Current human request authorizes preparing SePay integration; a reviewed-plan approval is still required by .ai/workflows/plan-existing-system-change.md step15 before protected changes.

## Confirmed scope

- Merchant: SP-TEST-HL5339A9; environment sandbox; BANK_TRANSFER only initially.
- User explicitly selected local implementation/testing first, public IPN later. No public tunnel, cloud deployment, IAM changes, production writes, live money, real emails or production activation in this phase.
- Existing source, mixed-cart UI and business behavior remain: listed products pay100% server price; researched custom products pay100% researched goods plus configured service fee; staff-approved price/shipping differences require customer-reviewed balance payment before release. Never accept client totals or callbacks as money proof.
- Secret SEPAY_SANDBOX_SECRET_KEY version1 enabled was verified by metadata only; value was not accessed. It remains in Google Secret Manager. No VITE secret, source literal, browser storage, prompt, artifact, log or shell argument containing the key.
- Existing shared frontend5207 and demo-satsunicgo emulator data are preserved. No extra frontend/server or backend restart/reset. If a backend reload is required, first inspect ownership and preserve data; coordinate before restarting.

## Proposed end-to-end flow

1. Existing cart → recipient → overview creates an immutable server-calculated preview. Commit reserves the same checkout/operation ID and pins provider=sepay_sandbox only when explicit local sandbox configuration and actual demo database identity pass; otherwise preserve existing demo/unavailable behavior.
2. Authenticated owner calls purchaseSePayPayment(createCheckout). Backend validates owner/account locks, checkout state/version/expiry/hash and provider. Persist one deterministic invoice per checkout; simultaneous calls reuse it. SDK secret is consumed server-side only; sign BANK_TRANSFER/VND fields and fixed return URLs. Browser receives only ordered signed fields plus the exact allowlisted sandbox form action.
3. Existing payment page posts a normal form to SePay sandbox. No SDK import or secret in the frontend. Same attempt is used on retry; no new checkout because a response was lost.
4. Returning success/error/cancel query parameters only trigger a status/reconcile read. UI shows pending/verification until backend confirms. Browser cannot mark paid or release cart/funding. Cancel is not a local financial reversal; verify provider status before releasing a pending reservation, and retain late/conflicting payment evidence for review.
5. Local IPN handler is tested with authenticated contract fixtures. Later, public IPN requires deployed HTTPS and configured SECRET_KEY auth. Use timing-safe header comparison; do not assume PayOS signatures or that merchant/IPN keys are interchangeable. Validate method/content type/body size/schema; ignore/drop card/customer fields; never log raw body/header. Resolve persisted invoice/index, then authenticated SePay readback before settlement. In this local phase real webhook delivery remains explicitly deferred.
6. Reconcile uses the same trusted verifier, whether triggered by return, owner retry or a bounded recovery job. Readback host is fixed pgapi-sandbox.sepay.vn; no caller-provided URLs. Exact expected invoice, merchant scope, provider order ID, transaction ID, currency, approved payment type/status and integer amount must agree. SDK/docs lookup semantics are a contract gate; unknown or mismatched responses cannot settle.
7. Trusted persisted proof enters one transaction that records evidence, allocations, order updates, ledger entries and receipt/outbox job exactly once. Initial and balance payments share the reviewed core. Reference reuse across checkouts, over/underpayment, expired/closed or stale balance targets enter review_required without purchasing/shipping or silently losing received money. Firestore transaction correctness must hold across processes; local queue alone is insufficient.
8. PDF rendering remains asynchronous/private and independent from payment settlement. Receipt explicitly identifies SePay sandbox and test/no-real-money status, itemized lines, method/reference/paidAt/amount and initial/balance link. Existing no-tax-invoice meaning retained. Email goes to the demo sink/unconfigured state; no real transport activation. Receipt retries never debit or allocate again.

## File/function implementation map

| Files | Concrete change |
| --- | --- |
| functions/package.json, package-lock.json | Add only official SePay SDK to backend workspace, pin audited registry version or immutable official Git commit; verify package dist against source and audit transitive dependencies. Do not install a floating github main. Candidate official source reports1.0.0; registry version/integrity still to verify |
| packages/domain/purchase-sepay.ts (new) | Strict input/IPN/readback schemas, exact VND decimal parser, sandbox invoice/proof binding, bounded enums and pure mapping; no secret |
| packages/domain/purchase-checkout.ts, purchase-provider.ts | Add tagged sepay_sandbox provider/acknowledgement; retain demo compatibility and all preview/amount/owner checks |
| functions/src/payments/sepay-sandbox.ts (new) | defineSecret binding and fixed sandbox merchant/environment; SDK-only signing and fixed host validation. Bounded REST adapter (native fetch/AbortSignal) because current SDK readback lacks timeout; redact all errors. Keep all production SePay constructors/endpoints out of this scope |
| functions/src/purchase-sepay.ts (new) | Owner-checked create/status/reconcile callable, invoice/index persistence, constant-time authenticated IPN admission, minimal durable inbox/lease worker and shared verified proof path. IPN only acknowledges durable accepted/completed evidence; transient failure remains retryable |
| functions/src/purchase-settlement.ts (new), purchase-checkout.ts | Extract only the existing allocation/receipt transaction into a trusted provider-aware core; demo wrapper retains its current environment/proof guards. Add sandbox wrapper requiring persisted verified SePay proof. Update initial and balance provider selection together; no legacy payment-policy mutation |
| functions/src/index.ts | Register local sandbox callable/IPN/worker exports behind exact demo sandbox gate; do not enable real payments or modify provider-release-gate holds |
| functions/src/purchase-receipts.ts, purchase-pdf.ts | SePay sandbox method/test wording and immutable proof metadata; keep private PDF/job leases, demo sink and rendering/payment failure separation |
| src/features/cart/purchase-payment.tsx, purchase-completion.tsx; purchase-checkout.tsx if response admission requires | Switch by provider, ordered signed POST form and fixed action validation; keep existing compact checkout/success card, account links, pending/error/unknown/review states. Cleanup stale requests/timers; no auto-paid redirect |
| firebase.json | Only add the exact sandbox checkout origin to form-action if required. Do not broaden script/connect/frame/origin policies or add production hosting rewrite/deploy |
| firestore.rules, tests/rules/purchase-sepay.test.ts | New provider intent/inbox/evidence collections stay server-only; demonstrate guest/owner/other owner/staff direct writes denied; owner reads through existing callable only |
| tests/unit/purchase-sepay*.test.ts, purchase-acknowledgement.test.ts, purchase-provider/checkout/pdf tests | Contract, amount, mapping, idempotency, failure/cancellation and provider regression evidence |
| scripts/purchase-sepay-scenarios.mjs, scripts/purchase-sepay-cross-process.mjs; tests/browser/purchase-sepay* | Named synthetic emulator fixtures only, race/restart/replay allocation tests and actual shared5207 UI cases; no reseed/reset of shared data |
| docs/reviews/SEPAY-SANDBOX-20261009/** | Current hashes, scenarios/results, product string inventory/all8principles, security findings, each final review/fix/verify cycle and report |

Implementation may consolidate new files if it preserves these trust boundaries. Any material added dependency, module, deployment or database/retention change requires a delta-impact review.

## Database, correctness and retention

- New proposed private stores: purchaseSePayIntents/{checkoutId}, purchaseSePayInvoiceIndex/{hash(merchant+invoice)}, purchaseSePayInbox/{hash(provider+merchant+transaction)}, purchaseSePayEvidence/{same unique reference}. IDs are deterministic and provider/environment scoped; no client writes.
- Checkout, invoice, owner, purpose, target version, amount/currency and provider are pinned. Financial totals, proofs and receipt snapshots are immutable after verified settlement. Retry/dedup processing status can change without altering proof.
- Batch/bulk/transaction writes are bounded by existing30line checkout maximum, well below Firestore transaction write ceilings; all reads before writes. No external HTTP/SDK call inside a transaction retry body. No unbounded repository save/read loop.
- Timestamp freshness rules must tolerate documented provider retries; an old authenticated IPN can still trigger current readback but cannot bypass persisted proof/state guards. Durable duplicate evidence survives restarts.
- No new TTL on financial evidence, orders, ledger or receipts. Signed form fields are short-lived attempt material and not logged/persisted unnecessarily. Temporary inbox cleanup may remove only acknowledged normalized retry payload after retaining permanent dedup key; no TTL activation in this phase without retention approval.

## Security and performance controls

- Firebase verified Google owner/auth/AppCheck checks retained; provider IPN authenticates separately, never disables customer auth.
- No sensitive user/customer/card payload sent unless necessary. Signed form includes only order/invoice/amount and approved callbacks; return URL is server-derived, not arbitrary client input. No open redirect/SSRF or dynamic API base.
- Backend secret manager binding only. A scoped runtime credential mechanism must be approved/available before real sandbox calls; the agent will not fetch/copy secret values into local files or evidence. If unavailable, fixture/local tests continue and provider calls remain NOT_RUN; document the required human runtime setup.
- Bound request body (proposed64KiB), provider response (proposed256KiB), HTTP timeout (proposed10s), concurrent readback and finite retry/backoff; tune with measured test evidence, not invented performance claims. Configure maxInstances/concurrency conservatively using existing defaults. Lease owner/expiry and transaction dedup prevent duplicate workers from settling twice.
- Avoid SDK global environment mutation by a sandbox-only wrapper; no mixed production client in the process. Browser return reconciliation is finite with manual retry retained. Abort/ignore old requests after account/route changes; clear timers on unmount. PDF buffers remain under existing3MB bound.
- Logs contain only event category, internal correlation ID and outcome/latency; never secret, Authorization/X-Secret-Key, signed form payload, provider raw error/body or PII. Test redaction deliberately.

## Validation and acceptance

Run the matrix in SCENARIOS.md with explicit PASS/FAIL/NOT_RUN per case. Build TypeScript backend/frontend, lint targeted paths, dependency/secret scans, focused unit/rules, transactional/cross-process tests and browser desktop/mobile/keyboard checks. Re-run prior demo financial/business/receipt scenarios after settlement extraction. Verify actual invoice/merchant/status/transaction contracts against sandbox before calling provider E2E complete. Static signing and mocked contracts are not real provider acceptance.

The local phase is complete only when approved code and local regression cases pass plus fresh security/product/final review passes. Provider-hosted checkout/readback may be exercised only with scoped runtime credentials and exact sandbox destinations; whether localhost callback is accepted must be observed. Public IPN delivery/deployment, real email, production money/release are explicitly deferred, not passed. Final handoff records executed scenarios, blocked cases and exact source hashes; no complete-provider or production claim from emulator success.

## Deployment/rollback boundary

No deployment in this phase. Rollback of eventual local activation: select existing demo provider for new attempts; keep already-pinned SePay attempts/evidence available for reconciliation, never relabel them demo or erase paid proofs. Preserve old demo tests. Later public sandbox requires a separate reviewed endpoint/project/network/secret/IAM plan and successful IPN dashboard test. Production activation is a separate business/security/release decision.

## Approval requested

Approve SEPAY-SANDBOX-20261009 v1 for the file/dependency/contract changes and local emulator tests above, including sandbox-only runtime secret consumption by the application when an approved scoped credential mechanism is available. Public IPN/deployment/real money/email remain excluded. No secret value access by the conversational agent.

## Primary references checked

- https://developer.sepay.vn/vi/cong-thanh-toan/sdk/nodejs
- https://developer.sepay.vn/vi/cong-thanh-toan/sandbox
- https://developer.sepay.vn/vi/cong-thanh-toan/IPN
- https://developer.sepay.vn/vi/cong-thanh-toan/API/tong-quan
- https://developer.sepay.vn/vi/cong-thanh-toan/API/don-hang/chi-tiet-don-hang
- https://github.com/sepayvn/sepay-pg-node (src/checkout.ts, client.ts, api-resource.ts, order.ts, package.json)
- https://docs.cloud.google.com/secret-manager/docs/creating-and-accessing-secrets
- https://firebase.google.com/docs/functions/config-env

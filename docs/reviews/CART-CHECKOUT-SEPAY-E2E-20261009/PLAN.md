# CART-CHECKOUT-SEPAY-E2E-20261009 v1

Human request: continue full cart -> checkout -> SePay sandbox -> PDF, happy and negative cases, review/fix until passing, then synchronize the release chat. This continues the approved upfront-payment/SePay/cart plans; no new provider, policy, schema, dependency or deployment expansion is inferred.

Risk: HIGH (payment evidence, authorization, idempotency, private receipt). Repository intelligence: DEGRADED; CodeGraph then CocoIndex queried, critical paths verified directly. Shared demo listeners are present on 5207/19207/18207/15207/19208.

Verified flow: cart/checkout server preview and commit -> provider-pinned intent -> authenticated IPN admission -> fixed-host readback -> persisted verified proof -> transactional settlement/order/ledger -> leased private PDF worker -> owner-only download. Browser return is never payment proof. Current source permits SePay only in the exact demo emulator and signs fixed127.0.0.1 return URLs. Existing local runbook says activation off, synthetic keys, public IPN deferred; genuine provider readiness remains to verify.

## Execution / impact plan

1. Freeze hashes for current cart, checkout, SePay, settlement, receipt/PDF, region/validation and affected notifications. Coordinate existing release/payment owners before shared edits; no duplicate pipelines or runtime takeover.
2. Run focused Node22 unit tests. Execute existing SePay transactional/private-rules cases using task-local adapters only, recording all owned synthetic IDs and cleanup. Preserve shared settings and prior data; never clear an emulator database. Synthetic provider tests are protocol/application evidence only.
3. Exercise the real shared5207 UI in the separately authorized localhost session: empty/guest/auth/cart, catalog plus custom request, mixed review, invalid recipient and autocomplete, overview acknowledgement, submit, reload/cancel/failure/lost response/delayed notification/amount mismatch, completion link and PDF download. Use only owned synthetic customer/products/data. No injected browser auth or production account fixture.
4. Validate PDF bytes/hash, itemized quantities/prices/totals, method/reference/time, Vietnamese rendering, multipage/long content and download privacy. Inspect rendered pages. Validate async rendering failure does not repeat settlement.
5. For any reproduced defect within the existing approved files below, document root cause and precise fix before editing; preserve existing UI/business semantics and owner work. Add proportional regression, run affected tests/static checks and repeat actual failing interaction. Material scope change needs a delta plan.
6. Perform fresh mandatory final implementation review and product-content review if UI/text changes. Bind results to current hashes, record every cycle and open gap. Send scoped handoff to the authorized release chat; complete release checks remain owned there.

Possible in-scope fix paths (only after a reproduced finding): src/features/cart/{Cart,cart-store,purchase-checkout,purchase-payment,purchase-gateway,purchase-completion,purchase-thumbnail,purchase-recipient-validation,purchase-region-autocomplete,purchase-region-search}.*; functions/src/{purchase-checkout,purchase-sepay,purchase-settlement,purchase-receipts,purchase-pdf,purchase-demo-gateway,purchase-mutation-queue,purchase-environment}.ts; functions/src/payments/sepay-sandbox.ts; packages/domain/{cart,purchase-checkout,purchase-sepay,purchase-provider}.ts; directly corresponding tests. Notification source is inspect-only unless its owner releases a specific fix. No migration, contract expansion, new dependency or auth weakening.

## Preserved constraints

- No production financial writes, real money, real email, secret value access, public endpoint/tunnel/IAM deployment, restart/reseed/additional server, or changes to provider production holds.
- Secret configuration must use an approved application-scoped runtime mechanism. Credentials and signed forms are never printed or stored in evidence.
- Existing cart data and unowned WIP remain unchanged. Clean only exact newly owned synthetic records/objects, with collision guards and receipts.
- Full genuine SePay sandbox E2E cannot pass without configured credentials and externally deliverable IPN; local demo/protocol success will not be relabeled real provider success.

Approval evidence: latest human message in this chat explicitly authorizes this test/review/fix continuation and synchronization; earlier SEPAY-SANDBOX-20261009 v1 and upfront/cart approvals bind preserved behavior. Public IPN/production activation remain outside those approvals. New tests/evidence are task-local. Production readiness is fail-closed until exact integrated candidate acceptance, release workflow and provider readback pass.

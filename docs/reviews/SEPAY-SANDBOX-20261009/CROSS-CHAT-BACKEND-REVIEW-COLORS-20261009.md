# Supplemental read-only backend review

Reviewer: Codex UI owner,2026-10-09. Requested by integration owner under already verified human sync authorization. No backend file edited. This review is independent from the PASSED bounded UI color refinement.

Snapshot SHA256:

- functions/src/purchase-sepay.ts: dd70aff383acf5bcb1c03c17d3dbb0c348f43d843f489f49379f2b228ebf4e45
- functions/src/purchase-settlement.ts:7a64ef2a40cdce157fdea7407b9f516de2724789d160222e372018f35be6eb2e
- functions/src/payments/sepay-sandbox.ts:f5d450cbc604d404f171a5e844984f1c25988fd1f84096f366ec4c3ca6ccf53e
- packages/domain/purchase-sepay.ts:c7af02fb13bca20f34b325b258bd2c86dfc05124dc1b16685b05adf03e6ef6ed

Intelligence gate rerun `/tmp/sepay-cross-review-intelligence.json`; CodeGraph then CocoIndex queried. DEGRADED index coverage; critical conclusions verified from current source. Related evidence inspected: environment/auth guards, deny-by-default Firestore rules and relevant DB-contract tests. React/TypeScript/Firebase web/serverless system; bounded review covers auth, server proof admission, settlement atomicity, retry/late/void/reference handling, secret boundary and bounded readback resources. Provider protocol correctness and deployed behavior are not independently certified.

## Cycle1 — CHANGES REQUESTED

HIGH BR-01: a distinct payment notification can be acknowledged internally without reconciliation during the readback cooldown/lease.

- Location: functions/src/purchase-sepay.ts293-301 and442-459.
- Observed code: reconcileSePayIntent returns without a result when leaseUntil or nextReadAt blocks the claim. processSePayInbox then reads the checkout and marks the current inbox item done whenever the checkout is already paid or review_required.
- Concrete scenario: payment A completes; payment B has a different transaction ID and its authenticated ORDER_PAID arrives during A's2-second readback cooldown (or another active reconciliation lease). The B worker skips readback but sees the checkout paid and marks B done. No proof/payment evidence/SECOND_TRANSACTION review record for B is persisted. Later queue retries cannot recover a done item automatically.
- Existing test gap: the second-transaction test explicitly sets nextReadAt:0 before processing B at tests/rules/purchase-sepay.test.ts454, avoiding this path.
- Impact: a second received payment can be silently omitted from financial reconciliation. Duplicate order allocation is prevented, but recording every distinct incoming transaction is still required.
- Recommended correction: distinguish deferred/no-op reconciliation from proof processed for THIS transaction. Keep deferred inbox queued and retry. Only mark done after binding the result to the current notification or explicitly recording its conflict/review disposition. Test future nextReadAt and active lease without resetting them, then retry and verify one allocation plus separate B evidence.
- Handoff: finding sent immediately to integration owner; owner responsible for fix and emulator regression. No mutation or reproduction test run by this reviewer.

## Other reviewed boundaries

No additional actionable finding identified within this bounded source pass. This does not establish absence of defects.

- Duplicate allocation: deterministic checkout/order ledger IDs plus atomic Firestore settlement transaction; evidence/reference conflict checked before allocation. Existing second-payment path records separate review evidence when it actually executes; BR-01 concerns skipping that path.
- Binding/amount: owner, provider, merchant, invoice/order IDs, checkout hash, bank method/currency and safe integer amounts are compared; decimal VND is rejected. Under/overpayment, late payment, cancelled/locked/stale cart and changed balance targets route to review.
- Void: authenticated notice freezes fulfillment/order hold; money is not automatically reversed. Pending checkout becomes review_required. Transaction reads/writes include checkout/order snapshots, protecting against concurrent settlement at this boundary.
- Owner/auth: callable requires verified Google session and owner match; production gate checks all demo/emulator identities. Backend collections are denied by default to client access. No claim of full rules/auth certification in this pass.
- Secret/provider resources: definition names only inspected, never values. Constant-time hashed IPN secret comparison; fixed sandbox HTTPS destination, redirect denial,10-second abort,256KiB stream limit, bounded provider transaction array and sanitized errors; timer/read-stream cleanup present. SDK is server-only for signing.
- Recovery: persisted verified proof can resume allocation without reading the provider again; provider readback/API status never relies on return URL. The already verified proof is validated again in settlement. Readback-deferred versus notification-handled distinction remains blocking under BR-01.

Limits: read-only source review and related test inspection only; no emulator mutation, network provider call, secret access, performance benchmark or browser checkout by this pass. Integration owner's20/20 earlier test result is reported by that owner and not rerun or independently promoted to current proof here. Overall backend/provider release readiness: NOT_READY pending BR-01 fix, fresh owner regression/review and provider/deployment evidence.

Usage/API-equivalent cost/actual billed cost: Unavailable. Memory candidates: None.

## Cycle2 — source correction reviewed; execution evidence pending

Current functions/src/purchase-sepay.ts SHA256:1c5a15ae711bae599aaf781d866d91f21f2161d9f7173ee4a1939aa12111d2a0. Other three reviewed source hashes unchanged. The integration owner implemented an explicit deferred/pending/processed/review_required result and transactionId. The inbox now requires processed/review disposition bound to its own transaction before marking done; deferred/pending paths throw into the queued retry path. BR-01 correction is present and no further actionable defect was found in this bounded delta source review.

Inspected new tests.each cooldown/lease at tests/rules/purchase-sepay.test.ts442-509: future cooldown/active lease is set before the first processing attempt, which must reject and remain queued; no second evidence may exist yet. Only then is expiry simulated, and retry must create separate SECOND_TRANSACTION review evidence while preserving one ledger allocation. These are meaningful regressions for BR-01.

Executable verification: PENDING integration-owner run result; not independently rerun here to avoid concurrent emulator mutations. Overall backend review remains NOT_READY pending that evidence and current-hash confirmation. This pending backend slice does not change the completed UI color refinement's scoped review.

## Cycle3 — BR-01 correction PASSED within reviewed boundary

Integration owner supplied fresh `/tmp/sepay-integration-cycle8.json` and `/tmp/sepay-unit-final.json`. Reviewer independently parsed both structured files: success=true,27 integration tests and238 unit tests passed,0failed. Specifically verified passed assertions for distinct transaction during cooldown, distinct transaction during lease, and expired inbox lease recovery. Current candidate hash still1c5a15ae711bae599aaf781d866d91f21f2161d9f7173ee4a1939aa12111d2a0. Sanitized proof/counts/original report hashes recorded in BR-01-R2-TEST-EVIDENCE.json.

BR-01 is FIXED/VERIFIED by fresh source read plus owner-executed emulator regression evidence independently inspected. No actionable finding remains in this bounded four-file source review. Review recommendation: APPROVED for the examined correction, not blanket approval of all concurrent changes. Tests use synthetic provider evidence and local shared database/storage; reviewer did not independently rerun emulator mutations. Real provider payment, authenticated browser end-to-end and public IPN/deployment remain NOT_RUN/NOT_READY. Earlier cycle statuses above are historical, retained for review traceability.

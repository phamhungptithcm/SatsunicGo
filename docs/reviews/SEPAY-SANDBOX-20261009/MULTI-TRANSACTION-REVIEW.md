# Readback transaction selection correction

Approved-scope correction: match each authenticated normalized notification to exactly its own approved transaction in the private readback. No new endpoint, secret, provider host, payment method, financial amount, refund or release behavior. Existing owner/merchant/invoice/order/internal-ID/hash/currency/method/amount/time/notice comparisons remain. Public IPN authenticates before normalizing/persisting the notification; the notice alone is not settlement evidence.

Observed gap: verifySePayReadback previously required exactly one approved PAYMENT across the entire order response even when notification.transaction.id was supplied. The second-money fixture represented only paymentB. A legitimate response containing bothA andB would leaveB queued and eventually in inbox review rather than create its verified financial review evidence. This did not authorize double allocation, but left the explicit second-payment happy/reconciliation path incomplete.

Correction: approved candidates are additionally filtered by the notice's exact transaction ID when a notice is supplied. Exactly one selected candidate is still required. Manual reconciliation without a notice continues to reject multiple approved payments. Duplicate matching IDs, declined target, transaction substitution, VOID and all mismatched proof fields still reject. No first/last arbitrary transaction selection.

Verification: three new unit cases cover a matching notice among two approved transactions, duplicate IDs and a declined notice target. Existing no-notice multiple, substitution, VOID and proof-field negatives remain. The two cooldown/lease integration regressions now return[A,B] before and after expiry; assert queued/no second evidence before retry, then separate SECOND_TRANSACTION evidence and exactly one financial entry. Fresh owner execution:241unit tests and27emulator tests pass; evidence/unit-final.json and evidence/integration-final.json. Synthetic provider only; no live acceptance claim.

Independent original-chat reviewer performed a bounded read-only review of current domain/unit/rules files and public IPN→normalized inbox provenance. Reported PASSED/no actionable finding within this delta, explicitly without independently rerunning emulator tests or certifying provider/browser/production. Source hashes:

- packages/domain/purchase-sepay.ts:644dd35eace381de945ca89cee7887151cb308d1e1287dd1b12478a83ecd0df0
- tests/unit/purchase-sepay.test.ts:f5a7b95afb99f6a04e5cffc698585ba42328da46864652f49938f8fb8a1911f4
- tests/rules/purchase-sepay.test.ts:3930909c3732d0cd3fc5f279dce87392e6ac5d0dfc71546d8c606358013ed1bf

Core purchase-sepay handler remains1c5a15ae711bae599aaf781d866d91f21f2161d9f7173ee4a1939aa12111d2a0; settlement remains7a64ef2a40cdce157fdea7407b9f516de2724789d160222e372018f35be6eb2e. Complete handoff still BLOCKED by missing integrated browser/product evidence; production NOT_READY. Native review ledger unavailable; this is file-backed evidence.

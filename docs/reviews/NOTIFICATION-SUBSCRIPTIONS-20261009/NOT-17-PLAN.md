# NOT-17 queue hardening plan

Observed in current subscription-delivery-service.ts: invalid/missing recipient returns before durable job transition; malformed queue rows also remain queued. Recipient check precedes expiry. A bounded worker query can repeatedly select these rows.

Approved existing scope: subscription queue failure/concurrency hardening and regression tests under the original approved implementation and final-review fix loop. No new provider, delivery activation, consent or business-message change. This correction does not require a delta for a new capability. Request from integration QA is evidence of the defect, not standalone authorization for a broader scope.

Smallest fix: terminally retire malformed/permanent-invalid/expired jobs only under a transaction rechecking queued state and the unchanged complete job snapshot. Check expiry before Auth lookup. Explicit null and known Auth user-not-found/invalid-uid mean permanent invalid recipient; all other Auth exceptions remain retryable and leave the queue untouched. Claim path must also reject changed snapshots. Preserve sending, unknown, accepted and consent records.

Validation: tests for invalid identity after repeated polls, malformed rows, expiry preceding dependency error, transient outage recovery, raced job mutation/claim and existing terminal states. Compile/lint plus shared existing demo Firestore integration; no restart, reseed, production messages or sender activation. Update manifest and review evidence; coordinate only after direct human authorization to message is verified.

Intelligence DEGRADED: CodeGraph then CocoIndex queried; canonical source/tests verified directly. Existing original approval permits bounded source fallback; validator READY mismatch remains documented, not fabricated.

# PR6 source review

Baseline source af58ec29 against base e9d248f3; final source supplied in evidence report. Scope all70 PR files plus direct consumers, Firestore rules and release contracts. Node22/TypeScript/React19/Firebase callable v2/Admin Firestore, npm10/11, Vitest/Playwright. Intelligence DEGRADED, optional indexes missing. Selected profiles universal/typescript-javascript/api/database/concurrency/devops/web-app/product-content; lifecycle/memory reviewed.

Verified finding P2 PR6-001: managePublicTrackingCode previous-operation branch acknowledged historical revoke after a different code became active. Lost-response retry could show revoked while replacement remained usable. Reproduced with emulator (expected rejection instead resolved null); minimal current-access guard fixed. No additional schema, permission, quota, API/dependency or UI layout scope.

Architecture/API PASSED within reviewed boundary: callable remains source of truth; owner auth/lock and staff RBAC enforced in transaction. Guest four-field strict DTO rebuilt without order/parcel/private spreads; no ordinary order-ID capability. App Check production, hash-only codes, quotas, owner issuance, logical expiry/revocation fence retained. Client routes guest lookup before provider/image preparation/transcript; generation/uid/conversation fences preserve account switching. Shared owner renderer retained.

Database/concurrency PASSED within executed cases: CRM parcel and batch updates atomically publish canonical parcel/order version, safe timeline and owner projection. CAS/idempotency and canonical quantity receipt verified. Aggregate ETA requires matching canonical/projection owner/id/version/state/allocation/estimate, complete quantities and current time; partial/failure/hold do not promise ETA. Revocation replay now checks current access fence in same transaction; no writes on stale replay.

Failure/error/lifecycle PASSED: auth/account change invalidation, offline/timeout/late response, A-B-A fencing, single-flight refresh, guest60-second budget, subscription/timer cleanup, transactional collision rollback and exporter cleanup are covered by source/tests. No global cache of guest payload or browser persistence of codes. Initial owner callable uses shared read-only15-second SDK timeout; no unbounded custom request asserted.

Performance PASSED for local bounded paths: max60 parcel reads, bounded histories/allocations and instance/concurrency limits; ETA canonical reads conditional. Global quota hot-document throughput and sustained hosted cold-start/load NOT_VERIFIED, not a production SLA.

Observability: existing atomic audit/outbox retained; stale replay creates neither. No raw alias/IP/PII logs added. Production alerts/rate/latency acceptance remains pending approved deployment.

Supply chain/artifact: audit and immutable exact-head CI/artifact must be rerun after fix; af58 artifact is historical only. Temporary Resource bridge is scoped, standalone install/delivery and artifact tampering guards verified before and rerun at final source. Existing release workflow auto-deploys main; do not merge/push main. No release-version reservation.

Docs: original release note prerequisite statuses are historical, superseded by completion note and fresh metadata-only readback. New report records current secret/TTL/function status and actual CI/artifact SHA. No customer or secret payload accessed.

Remaining risks: temporary upstream compatibility bridge; missing index confidence; no hosted candidate acceptance; no authenticated independent human approval. This automated reviewer is the implementation author; fresh review is not author-independent approval. Review recommendation BLOCKED for merge/deploy, scoped implementation may pass after final verification. Rollback only PR6-001 to af58 if needed; no production rollback now. No new unsupported generic findings.

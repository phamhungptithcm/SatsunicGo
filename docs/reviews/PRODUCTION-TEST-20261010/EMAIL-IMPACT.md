# Test email boundary

Approved scope: PRODUCTION-TEST v1 / APPROVAL.json.

Current customer worker rechecks entity ownership, identity, cutover and optional topic consent before send; financial templates intentionally do not require optional order consent in normal live mode. Subscription service binds pending/active generations and immutable destination. Preserve those live semantics.

Production-test changes: new production-test-email-policy.ts reads central productionTest admission plus independent productionTestEmail policy (approved/enabled/version/current expiry/tester UIDs/forward cutover). Test order mail additionally requires current orderEmail consent and exact destination; subscription confirmation keeps its existing pending-generation proof. Both workers recheck immediately before I/O. Test entity/job provenance must match. Old live entity jobs are blocked while test mode is active. Unknown/malformed provenance cannot gain authority; no queue reset, backfill or customer send is performed.

Files: new helper and focused tests; customer-email-job.ts, email.ts, subscription-delivery-service.ts, subscription-email.ts. Existing daily100attempt shared dispatch budget, unknown fences, current identity and domain verification remain unchanged. Test email subject gets compact [Test] marker via authoritative resource only; UI agent includes it in content review.

Checks: legacy live regression; valid test opt-in; missing/revoked/expired test policies; wrong owner/identity; legacy cutover; mismatched/partial provenance; preference revoke before I/O; subscription pending/active generation behavior. No provider calls, secret reads or production writes.

## EMAIL-REVOCATION-01 correction

Independent source review found a before-I/O revocation race: test policy reads were outside the final attempt transaction, including an Auth await in subscription delivery. Peer review identified the same gap for existing global email config/profile eligibility. Root assigned both bounded corrections under v1, including subscription-email.ts. Both real workers now watch current global config and applicable test policies, consent/resource/profile eligibility in the same Firestore transaction that records the attempt. The final commit is the authorization linearization point; Auth and provider I/O remain separate services.

Existing default/preflight callers remain compatible through an optional Transaction reader. The real subscription sender passes its already-validated config into the final service authorization; provider-agnostic service defaults remain unchanged. No transport, quota, unknown-state or provider setup contract changed.

Fresh local evidence: 289 tests /4files PASS, including 40 new actual worker/service timing, conflict-retry and happy cases (61 in production-test-email.test.ts); both strict compilers, targeted lint and diff check PASS. See EMAIL-REVOCATION-01/REVIEW.json and TESTS.json. No provider/live proof or production activation is claimed.

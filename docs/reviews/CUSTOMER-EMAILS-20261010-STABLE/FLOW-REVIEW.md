# End-to-end flow review

## Scope and evidence boundary

Reviewed current TypeScript6 / React19 / Firebase Admin/Functions source and Node22 execution. Profiles: universal, typescript-javascript, web-app, api, database, concurrency. CodeGraph then CocoIndex queried; current targeted source/typechecks/tests verify critical facts. Broad parallel-WIP index coverage remains DEGRADED. No subagents spawned.

The new Firestore suite executes actual customerEvent/customerEventFields, transactional outbox persistence, projectCustomerNotification, deliverEmail.run, prepareCustomerEmail, emailPreferenceAllowed, renderCustomerEmail, dispatchResend and sendResend. Database is the canonical demo emulator; every worker settings/resource/outbox/inbox collection is prefixed with a unique qaCustomerEmailFlows UUID. The technical dispatch quota uses a separate random qa UUID. Actual runtime eligibility, Auth/secret ports and HTTP are fixture substitutes. This proves backend composition under controlled ports, not a browser/callable/Cloud Functions trigger/scheduler/provider deployment journey.

## Reviewed chain

1. Committed business facts build strict versioned customer events with canonical snapshot hashes. Notification formatting fails closed independently of authoritative financial writes. Domain/payment tests in the full suite exercise real producer rules; the new composed test writes a synthetic business fact and outbox atomically rather than settling an actual payment.
2. Trigger/scheduled recovery share the atomic queued-event projector. Owner, snapshot, current resource and account-lock validation precede one inbox creation. Eight concurrent projector calls yield one inbox. Transport readiness/cutover gates affect email candidacy without suppressing legitimate in-app updates. No provider I/O occurs in the business transaction.
3. Customer and subscription workers use separate queues/purposes. Confirmation/welcome templates are separate from the 42 business templates. Optional order updates need current confirmed orderEmail generation and exact destination; promotionsEmail is independent. Financial/action policy and template eligibility remain separate. Missing/unconfirmed/revoked consent cannot authorize optional dispatch.
4. Sender claims and pins recipient/body/provider identity, checks ownership/current resources/verified Auth account, and repeats live config/consent/job identity checks immediately before provider I/O. Historical/untyped jobs, stale proposals, changed recipients, account locks and configuration mismatches are blocked or suppressed. Source checks and worker/security unit suites cover these branches.
5. Shared Resend dispatch has a transactional daily cap, lease, monotonic clock guard and completion cooldown across both workers. One bounded provider retry preserves the exact subscription token/body in memory. Adapter response/error handling distinguishes accepted, rejected and unknown; ambiguous outcomes remain reconciliation-required. Immutable idempotency keys and late-outcome fencing protect repeated processing.
6. New actual-Firestore composed scenarios: accepted payment email once across repeated worker runs; optional orderEmail withdrawn after enqueue is suppressed; connection uncertainty persists unknown and never auto-replays; disabled runtime produces inbox only with no HTTP. Synthetic recipients use example.invalid; no real provider request is made. Finally cleanup checks verify outbox/quota deletion. Existing integration suites separately cover consent save/confirmation/scoped revocation, rules denial, shared quota/cap/cadence/lease/clock behavior.

## Findings and corrections

The three historical compile errors are absent in current source: database identity is read as unknown through Reflect.get and passed to the strict project fence; recipient is captured after identity.email is narrowed. Both frontend and backend strict compile pass. No production source fix was needed in this task.

Cycle1 new fixture incorrectly expected an order-detail CTA for payment_confirmed. Canonical catalog intentionally uses the account destination, suitable for checkout-level payments. Corrected test to verify /account, and made the optional case explicitly confirm then withdraw consent after enqueue. Product behavior/catalog were preserved. All12 integration tests and final frontend typecheck/new-test lint pass after correction.

Initial sandbox runs could not open/read localhost sockets (EPERM). They are environment failures, not product passes. After approved localhost access, all2372 unit tests and all12 integration tests pass. No test was disabled, deleted or weakened to hide an application failure.

Within these executed checks no unresolved critical/high integration finding was found. This is not a claim that the code has no issues.

## Operations and residual limits

No production source, financial state, provider configuration, dependencies, shared rules, server process, deployment or customer delivery changed. Existing source releaseCapabilities.email is true with exact-production identity/environment plus validated server policy gates; this task did not flip it. Therefore old statements that the code-owned email flag is false are historical and must not describe this candidate. No fresh external activation readback was performed here. Keep activation/deployment/customer canary out of this local handoff; do not infer they are safe or enabled from tests.

Durable outbox/claim/quota/audit states and safe logger messages support diagnosis; provider acceptance remains distinct from delivered mail. Live dashboards/alerts, webhook delivery evidence, production retention, authenticated browser/callable acceptance and immutable release/deploy/rollback evidence remain release work. SMS provider/live order dispatcher remains unverified and outside this scope. Existing provider batch limits and cadence are source-level bounds, not a measured production SLA.

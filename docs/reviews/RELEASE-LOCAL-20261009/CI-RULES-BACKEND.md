# Backend CI fixture correction receipt

Scope and authority: CI-RULES-DELTA-PLAN.md SHA256 390e10af2fbebbf55872161fab1f9fb87c068f4b2bab348dc1fe4d9ad701f51f and root's explicit fixture-write assignment under the existing human release/test-fix authorization. Repository intelligence remains DEGRADED; current source and only the ANSI-stripped actual FAIL section of run37885468606 were inspected. Root owns all Git operations, isolated validation and real CI execution. Concurrent application/payment/generated changes were preserved.

The failed run's four mocked web scenarios reached the unchanged source pricing fence after 2026-10-09T00:00:00Z, so they failed before their intended mock-dispatch/catalog/context assertions. The server-only scenario used port18207 while CI baseline uses8181; assertFails correctly rejected an offline/unavailable error rather than accepting it as PERMISSION_DENIED. Tracking's strict field assertion omitted upfrontPayment, which functions/src/customer-order-tracking.ts:221 returns as a boolean derived from checkoutId presence. The raw checkoutId is not returned; this fixture lacks it, so the flag must be false.

| Owned fixture | Before SHA256 | Frozen SHA256 | Correction |
| --- | --- | --- | --- |
| tests/rules/ask-research-feedback.test.ts | 579cc2b7186b83c7c98646d601bdd5ba6f5ed4188fbb6df779fe97e72d7dc211 | 07ce78850fd86d72b1824aa0519fd9f5086815e1c83eb0621861b062c16232f4 | Historical mocked admission starts12hours before the source deadline. Date.now advances by integer performance.now elapsed, resets before each test and restores mocks in cleanup finally. Real policyVersion is captured before the spy for ownership uniqueness. Client checks use demoFirestoreEndpoint(process.env), with the existing exact demo identity/emulator/allowlisted-loopback validation. |
| tests/rules/order-tracking027.test.ts | 30e66c212eaade78bbaaf1e6ad983bed0044fd1e3ad26e15b62a3deab2546990 | 01d1435ee30157bbdce2a6cb1b9df10a9cc536e0b29df7b9ceb80fd59898e2b4 | Added only upfrontPayment to the strict exact safe-key list and asserted false for this fixture. Existing PRIVATE exclusion, no order mutation, authorization and malformed projection checks remain intact. |

Research now contains21 scenarios: the existing19 plus expired-policy and expired-pricing cases using the actual runWebDiscovery caller and synthetic transport. Their exact oracles are unavailable/resource-exhausted respectively, zero mock transport calls, unchanged owned synthetic ledger and no discovery record. The pricing case verifies ownership versions and moves only both synthetic policy expiries beyond the fixed pricing deadline, so it independently reaches the pricing fence. Both expiries and the admission clock are restored in finally. The source deadline, reservation sizes, production ledger, provider transport defaults, all permission-denied assertions, timeouts and retries were not changed. No fake global timers were introduced.

Source review cycle1: root found that the initial pricing case also expired the synthetic policies, which would have produced unavailable before reaching the expected pricing rejection. Corrected before execution by keeping both owned policy fixture windows current across the deadline and restoring them afterward. The initial research hash80137cf3 and receipt5f557ca2 are superseded. Fresh independent review and actual execution remain root-owned and pending.

Unchanged supporting source hashes:

- tests/helpers/demo-environment.ts: bdf216c820414088a34097ae7701ca0a4b202c408913248ecfb85670344d6313.
- functions/src/customer-order-tracking.ts: e452fa53c1e0c3918369d9c6ed302e6b84ae69d2ee22d3581ee8df7166a67dae.
- functions/src/ai/research-live.ts: c4d8dfe0491395362fc85045dd7149229b31cc94b2874916cabd4dfd2a948bb2.
- functions/src/ai/research-gemini.ts: 6cac39e0619fca0fef1f684b138310ac88d5194e13a55159c5d140c89a3c671e.

Validation performed by this worker: git diff --check on the two owned fixture files passed; TypeScript AST parse diagnostics were empty for both. No application runtime module was imported for these source checks. Rules execution, compilation, lint, independent review and production readback are NOT_RUN by this worker and remain root-owned. The failed CI evidence is retained locally at /private/tmp/satsunicgo-release-local-ci-37885468606-failed.log SHA256 1d0ad16338b1419b32b2cb735f44b5025208f9510401752c236a87b12b0e397d; it is not copied into source or this report.

No server/emulator start or restart, shared data operation, provider/model call, credential access, production date/budget/hold change, stage, commit or push occurred. This fixture correction does not certify deployed behavior or production readiness. Write lease: RELEASED. Memory candidates: None.

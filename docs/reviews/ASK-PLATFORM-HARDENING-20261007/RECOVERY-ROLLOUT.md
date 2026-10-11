# Customer recovery rollout — NOT DEPLOYED

Current production metadata: workspaceCommand ACTIVE, Node22, updated 2026-10-08T00:54:20Z. Exact source generation 1791420803535554 does not contain customerSaveFences. customerSaveResolve describe returns 404. See PRODUCTION-WORKSPACE-CURRENT.json and PRODUCTION-WORKSPACE-FENCE.json. Readback inspected compiled workspace JavaScript only, not environment files or customer data.

Required order after reviewed, frozen release candidate and deployment gates:
1. Deploy workspaceCommand customer-only fence admission. Verify deployed compiled guard and authenticated compatibility. Existing financial/staff transitions unchanged.
2. Deploy customerSaveResolve with App Check, verified Google, account lock, strict pointer/resource validation, admission quota and transactional audit. Verify authenticated saved/not-saved/race and direct-client-denial acceptance.
3. Ship frontend pointer persistence and account tabs only after both backend verifications. Verify actual client callable accessibility, Google/Auth/App Check, reload, loss/retry and account switch. Demo or HTTP403 is not positive acceptance.

Recovery uses separate fence collection to avoid altering financial idempotency record contracts. Missing save result and fence creation are transactionally coherent with the original workspace transaction. Existing fences must remain authoritative; no TTL/deletion on fences. Quota expiresAt is metadata only; a production TTL policy has not been applied. Admission counts failed semantic lookup attempts. Raw profile/address payload is not persisted in browser storage; stored metadata/hash remains private and must not enter telemetry/model context.

Rollback: stop/disable frontend new-write entry, retain recovery and workspace fence enforcement until uncertain operations are resolved. Do not revert workspace guard or delete fences while old requests/replays can exist. No destructive data cleanup authorized. Pricing/budget authorization, authoritative knowledge corpus and full-platform acceptance remain separate gates. Membership mounted-session retries are improved; durable Membership reload reconciliation remains incomplete and prevents full readiness.

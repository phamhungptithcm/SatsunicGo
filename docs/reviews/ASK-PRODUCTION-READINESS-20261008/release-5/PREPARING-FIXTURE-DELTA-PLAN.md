# Ask preparing fixture

Status: approved existing consumer-fixture correction; application behavior unchanged.

Authority: direct human hardening/test/fix-loop instructions and `docs/reviews/ASK-PRODUCTION-READINESS-20261008/integration-4/APPROVAL.md`, which explicitly includes `tests/browser/ask109.spec.ts` as a required consumer fixture. This does not authorize the rejected chat layout. Repository intelligence remains DEGRADED; exact source and current receipt supply bounded evidence.

Observed failure: `ACCEPTANCE-r4.json` (SHA256 9f9fbcdd7d96f1f107052ded4368a1adeea3780e5ff76c4b2d18a2c2d98801fa) records 138/139 passing and a preparing-motion mismatch. The existing fixture releases image preparation after 150ms and edits the next draft in a separate awaited browser action. It does not establish edit-before-send-origin capture.

Source evidence: candidate Ask.tsx awaits prepare at2115, calls ask at2131, captures origin only while the submitted question remains the input value at1029-1034, animates that origin at945-969, and preserves edited input at1039. Both relative orderings are valid application behavior. No application defect is established.

Exact change: only isolated candidate `tests/browser/ask109.spec.ts`, preimage SHA2568ecf8e8c4085e046c9ec7cbccbb5af1fcec362040db9f3263997753c57024020. Replace preparing-mode sleep with a manually released synthetic mock promise. Await mock entry, edit/assert the next draft while transport call count is zero, then release preparation. Keep the original-question, zero-motion, draft-preservation, one-dispatch and page-error assertions. Do not alter other modes, thresholds, timeouts, retries or runtime source.

Risk/impact: test synchronization only. No shared application/spec edit, data/API/auth/financial/provider/policy/retention/dependency/CI change, server restart/reseed or additional frontend. The test hook exists only in the intercepted synthetic ImageIntake module. Existing source104 receipts remain historical until a successor manifests the exact one-file candidate test delta.

Validation: affected eight composer cases, lint of that spec, then one fresh full139-case route-mocked acceptance run with workers1/retries0 on shared5207; record every failure and exact before/after hashes. Independent fresh review and source/archive metadata successors required. No provider, native-AT or production claim from these local results.

Owner: backend_engineer owns this candidate spec and `preparing-fixture-r1/` receipts only; root owns manifest/report integration. All other concurrent work is preserved.

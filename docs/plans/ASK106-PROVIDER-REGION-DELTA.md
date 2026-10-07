# ASK106 provider region delta

Status: APPROVED via current chat reply: Approved: dung us-central1 cho demo. 2026-10-07.

Observed: production runtime readiness receives HTTP404 for gemini-2.5-flash-lite at asia-southeast1. Current official model page lists global, US and Europe, with no Singapore support. Prior Singapore selection was incorrect. Paid generation remains disabled; actual owner readback reserve0/10000.

Smallest proposal: pin pilotLimits.location to us-central1, preserving model/rates/token/output/thinking limits,1000VND reservation per attempt,10000VND lifetimecap, pricingexpiry and no retries. Runtime Functions/Firestore stay Singapore. Demo question text processed by Google Vertex in US rather than Singapore; use only nonsensitive invented shopping intent, no customer identifiers. No IAM, secrets, API grants, or financial actions.

Files: functions/src/ai/ask-pilot.ts locationconstant; tests/unit/ask-pilot106.test.ts endpointassertion if any; docs/reviews/ASK106-OWNER-IMPLEMENTATION-REVIEW.md and product content evidence. No frontendcontractchange. Deploy only ask,workspaceCommand,readOwnerConfiguration from isolated immutablecandidate so their shared provider setting remains consistent.

Validation: unit quota/concurrency/countbodytests, lint/Functionsbuild, fresh selfreview; production ownerread readytrue; enable through confirmed Settings command (recentMFA enforced); one explicit draft request, validate actual structuredresult/reservereadback; screenshots. Stop on auth/providerfailure without weakening protections. Rollback: normal ownerdisable command; previous revieweddisabled revision remains safe, preserve ledger.

Official reference: https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/2-5-flash-lite (supportedregions current2026-10-07).

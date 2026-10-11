# Quality gates — current local candidate

These statuses certify only their stated scope. Final success and production readiness remain BLOCKED/NOT_READY.

| Gate | Status | Evidence / limitation |
|---|---|---|
| Compilation | PASSED | Full npm run typecheck, including backend build; evidence/typecheck-final.log. Earlier unrelated test typing failures repaired by owners. |
| Unit tests | PASSED | 329 passing tests in12 files; evidence/unit-final.json. |
| Integration/rules | PASSED | 39 passing tests in3 files on existing demo emulators; evidence/integration-final.json. |
| HTTP regression | PASSED | 69 synthetic gateway checks/171 HTTP calls; evidence/GATEWAY-SCENARIOS-E2E.json. |
| Business flow | PASSED | 17 mixed-cart/sourcing/final balance/PDF checks; evidence/business-results.json. |
| Scoped static analysis | PASSED | ESLint on the two corrected modules, tests and new runner; no diagnostics. Prettier check on all6 touched source/test/runner files passed. |
| Architecture/API compatibility | PASSED | No new API/schema/dependency/migration; provider I/O outside Firestore transaction, trusted evidence/atomic allocation and private receipt paths retained. |
| Language/platform profiles | PASSED | TypeScript6, React19, Firebase Functions/Admin, Vite8, Zod4; universal/typescript-javascript/api/database/concurrency/memory/web-app selected. Host Node25 differs from target22. |
| Security checks | PASSED | Local owner/lock/rules/IPN/readback/form/PII negative checks; no blanket penetration-test or fresh supply-chain-audit claim. |
| Database migration | NOT_APPLICABLE | No schema migration, backfill or real financial correction. Synthetic fixtures only. |
| Finite performance/resources | PASSED | 3200 queue operations,1600 expected failures,50 PDFs of30 lines. Offline finite probe; evidence/resources.json. |
| Target Node22 / stream soak | NOT_RUN | Only Node25.9.0 host and Node24.19.0 bundled runtime found; Node22 unavailable. Storage SDK listener warnings remain for targeted investigation. |
| Authenticated browser/UI/accessibility | NOT_RUN | Binding CUA localhost denial; no workaround. SSR/PDF/unit proxies are not real payment-route interaction evidence. |
| Product language | NOT_RUN | Data semantics checked; full required in-context UI dimensions remain unavailable. PRODUCT-CONTENT-REVIEW.md. |
| SEO/GEO/motion/visual redesign | NOT_APPLICABLE | No public-discovery, animation or visual-design change in this corrective delta. Existing full UI acceptance is still NOT_RUN. |
| Live provider/email/deployment | NOT_RUN | Deferred by local-first scope; no real secret/payment/email/publicIPN or production activation. |
| Observability/rollback | PASSED | Reviewed bounded codes/private proof/retry/hold behavior. Revert the two isolated corrections for source rollback; no persisted-data rollback required. Production monitoring not verified. |
| Diff/source freshness | PASSED | Explicit51-file SHA256 manifest matches at review; concurrent unrelated source remains outside certificate. |
| Final implementation review | NOT_RUN | Latest review BLOCKED because required browser/product/runtime dimensions not executed; see FINAL-REVIEW.json. |
| Native runtime ledger | NOT_RUN | ai-agent-kit CLI not installed; file-backed report is a disclosed fallback. |

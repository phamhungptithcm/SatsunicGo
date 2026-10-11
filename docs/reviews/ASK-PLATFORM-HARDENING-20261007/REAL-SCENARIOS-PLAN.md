# Ask real scenarios: implementation and impact

Approval: user's current explicit request to establish complete happy/bad scenarios and run test/fix/review loops; prior Ask implementation continuation remains effective. Preserve concurrent WIP.

Intelligence: DEGRADED, indexes stale. Source-verified Ask -> approvedKnowledgeAnswer -> approval/source/owner transaction -> retrieveKnowledge -> validated extractive response; shared 5207 frontend and 18207 demo Firestore listeners present. No restart/reseed/rules replacement. TypeScript6/Node22, Vitest/Playwright; profiles universal, typescript-javascript, web-app, API, database, concurrency, product-content and agent-evaluation as applicable.

Scope and file map:
- NEW tests/unit/ask-real-scenarios.test.ts: natural VI/EN queries, Unicode/digits, ambiguous/negative/no-match, source provenance, limits, atomic tables and deterministic chunk invariants.
- tests/rules/ask-approved-knowledge.test.ts: actual approval/Ask/response path, date validity, source revisions, auth/lock, citations, no mutation and cleanup of allocated synthetic records only.
- NEW tests/browser/ask-acceptance.config.ts: serial existing Ask/owner approval/profile/membership/browser scenarios against 5207; no server lifecycle hooks.
- functions/src/ai/knowledge-retrieval.ts: only fix defects reproduced by approved retrieval tests, preserving contracts/corpus bounds and exact citation evidence. Potential defect: Unicode numbers are not protected by ASCII-only digit guard; overlap after paragraph/table boundary can create orphan rows.
- docs/reviews/...: scenario inventory, evidence, gates and review cycles.

Run backend cases sequentially on actual demo handlers/Firestore; callable auth is synthetic, not HTTP/App Check proof. Run actual browser components with existing synthetic auth/API fixtures. Run existing general unit tests. Provider/production matrix remains NOT_RUN absent current provider budget, authoritative corpus and authenticated acceptance; tests must expose remaining implementation gaps rather than mark them passed.

No publication/business rule/paid gate/IAM/config/financial change, dependency addition or deployment. Rollback pure retrieval changes; no migration. Before fixes add failing regressions, then focused rerun, broader affected acceptance, fresh actual-source review. No blanket claim of perfect coverage.

Runner impact: scripts/ask-hardening-scenarios.mjs serializes local phases, requires exact demo target, snapshots code/tests/config to SHA256, marks source drift STALE, saves per-phase reports and explicit NOT_RUN for remaining/provider/production. tests/unit/ask-scenario-runner.test.ts validates production/remote/missing-emulator/invalid-mode rejection before test execution. No runtime lifecycle or cloud operations added.

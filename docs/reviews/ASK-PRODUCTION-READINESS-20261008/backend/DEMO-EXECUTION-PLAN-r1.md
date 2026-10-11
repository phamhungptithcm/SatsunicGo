# Bounded demo execution plan

Root approved Phase A after source safety inspection. Backend has not run these demo tests. Existing shared Firestore18207 is sufficient: these tests execute current handlers through `.run` with crafted auth claims. Auth19207 and Functions15207 listeners are unnecessary for this evidence class. They do not prove HTTP Auth/App Check or deployed handler behavior.

Run the four commands serially against the validated demo environment, from the repository root. Do not run the emulator launcher, clearFirestore, settings creation, rules upload, global quota reset, paid provider, restart or reseed.

```sh
GCLOUD_PROJECT=demo-satsunicgo FUNCTIONS_EMULATOR=true FIRESTORE_EMULATOR_HOST=127.0.0.1:18207 VITE_RECAPTCHA_ENTERPRISE_SITE_KEY='' /Users/hunpeo97/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin/node node_modules/vitest/vitest.mjs run tests/rules/ask-platform.test.ts --config=vitest.rules.config.ts --pool=threads --maxWorkers=1 --fileParallelism=false -t 'duplicate draft retries|stale version and tampered retry|anonymous, password-provider|chat cannot execute privileged action|completed recovery still checks'

GCLOUD_PROJECT=demo-satsunicgo FUNCTIONS_EMULATOR=true FIRESTORE_EMULATOR_HOST=127.0.0.1:18207 VITE_RECAPTCHA_ENTERPRISE_SITE_KEY='' /Users/hunpeo97/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin/node node_modules/vitest/vitest.mjs run tests/rules/profile-recovery.test.ts --config=vitest.rules.config.ts --pool=threads --maxWorkers=1 --fileParallelism=false

GCLOUD_PROJECT=demo-satsunicgo FUNCTIONS_EMULATOR=true FIRESTORE_EMULATOR_HOST=127.0.0.1:18207 VITE_RECAPTCHA_ENTERPRISE_SITE_KEY='' /Users/hunpeo97/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin/node node_modules/vitest/vitest.mjs run tests/rules/ask-membership-workspace.test.ts --config=vitest.rules.config.ts --pool=threads --maxWorkers=1 --fileParallelism=false

GCLOUD_PROJECT=demo-satsunicgo FUNCTIONS_EMULATOR=true FIRESTORE_EMULATOR_HOST=127.0.0.1:18207 VITE_RECAPTCHA_ENTERPRISE_SITE_KEY='' /Users/hunpeo97/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin/node node_modules/vitest/vitest.mjs run tests/rules/ask-approved-knowledge.test.ts --config=vitest.rules.config.ts --pool=threads --maxWorkers=1 --fileParallelism=false -t 'nonowner, absent MFA|tampered replay, stale approval|preview distinguishes|direct client reads|actual Ask rejects|actual Ask input rejects'
```

Expected selected coverage, subject to actual execution: Ask workflow 9 cases; profile recovery 12; membership workspace 7; approved knowledge 8. Counts are plans, not results.

The Ask workflow subset only mutates owned conversations/current pointers/users and rejects privileged actions. Excluded custom-submit cases create audit/outbox records not comprehensively collected by their cleanup; no broader execution recommended in this wave.

Profile tests allocate random user IDs, use owned address/audit filters and explicit fence/quota/idempotency paths for cleanup. Membership plan IDs are random `ask-free-*`, `ask-plus-*` and `reload-plan-*`, not canonical plans. Membership cleanup uses owned user IDs and explicit paths only. A prior conservative exclusion of membership was corrected after full source inspection.

Approved-knowledge subset covers OWNER/MFA and lock enforcement, stale/tampered approval replay, preview/publication distinction, installed Firestore rules and actual Ask auth/input rejection. Both rules assertions use `initializeTestEnvironment` without a `rules` argument, preserving installed shared rules. Approval revisions are recursively removed only beneath the allocated synthetic source ID. No selected answer execution consumes the shared global knowledge quota.

Phase B remains proposed and NOT_RUN: one happy approved answer plus the natural-query case would consume three admissions in `askKnowledgeQuota/global-${day}` through current production transactions. It would never reset the counter, but violates the current Phase A no-global-quota boundary. The 20-approval cap can also exclude a synthetic fixture if the existing shared corpus is full; do not remove other approvals to force a pass. Demo paid readiness fails closed before provider dispatch on retrieval miss.

Research/feedback suite remains proposed and NOT_RUN. Despite absent preflight paths, its beforeAll creates shared `settings/askWebDiscovery`, `settings/askResearch`, `settings/askFeedback` and `askResearchBudget/lifetime`; a later case also creates `settings/askKnowledgeHoldout-vi`. A separate synthetic-policy lease and fresh existence check are required before any execution. Do not weaken the suite's existing-policy refusal or replace shared settings.

Preserve actual stdout/stderr, command exit, selected/skipped counts and source hashes in root-owned test evidence. A failure must remain a failure; do not relax authorization assertions or claim emulator success as provider/production proof.

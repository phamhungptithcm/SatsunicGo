# Analytics session transaction retry

Run38006910464 failed the actual concurrent same-request analytics session test before any production build/deploy. An earlier request could retry after a later request committed and validate that newer session with its stale initial timestamp.

Sample time and UTC quota day inside each transaction attempt. Keep stable request/capability identities, all current session validity, consent, ownership, alias and quota checks unchanged. No API/schema/dependency/workflow/runtime change.

A deterministic conflict test failed against the original code. The fix passed24analytics unit regressions, frontend/backend strict compilation and focused ESLint on Node22.23.3. Normal CI and production artifact/provider/live verification remain required; this local evidence is not a production-readiness claim. Genuine staffMFA acceptance remains pending.

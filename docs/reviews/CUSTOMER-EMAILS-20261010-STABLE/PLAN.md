# Notification email stable integration validation

User authorization: sync with Resend, resolve integration errors, rerun typecheck/tests and review end-to-end notification/email; do not activate customer sending.

Scope: current typed business-event producers, atomic in-app projection, subscription confirmation/preferences, current-resource/consent preflight, existing email workers, shared Resend adapter and quota/claim/retry/unknown fences. Coordinate owned seams before source changes. No provider activation, production writes/messages, deployment, server restart/reseed, financial or UI redesign.

Risk: high (contact data, notification consent, financial-event interpretation); validation is local/synthetic only. CodeGraph then CocoIndex queried; bounded current source verification required due broad parallel WIP/index scope. Source snapshot binds checks; final drift audit required.

Acceptance: (1) Resend ownership handoff and closed findings; (2) frontend/backend strict no-emit checks; (3) joint unit regression; (4) demo Firestore transaction/rules and concurrent projection checks with disposable fixtures, mocked external transport; (5) producer-to-renderer-to-worker/dispatch review including stale data, withdrawal, missing config, idempotency, timeout,429 and unknown recovery; (6) current final review/report. Provider delivery remains NOT_RUN. Existing source eligibility is not activation proof; current external disabled state must be reported as verified or unverified explicitly.

Implementation: fix only narrow in-scope confirmed findings after owner reconciliation; first record a concrete finding and fix plan. Avoid generated functions/lib or unrelated WIP. Use isolated builds only if needed. New integration fixtures must use scoped records and finally cleanup, never mutate shared settings/rules or production.

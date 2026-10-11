# Reply notification provenance

Approved scope: PRODUCTION-TEST v1, human approval `call_5081fd46f74546c08b78d7a095730a9a` item 0, plus root's bounded consumer-isolation assignment. Work only in the clean production-test candidate. Repository intelligence is DEGRADED; targeted source, compiler and tests provide bounded evidence.

Observed: `orderConversationCommand` reads and authorizes the authoritative order, but its staff reply customer outbox omits immutable execution provenance. `projectCustomerNotification` authorizes the authoritative entity but creates an in-app record without provenance or a source/job mode comparison. A test reply can therefore lose its Test marker in the inbox.

Policy correction: `order_reply` has `email_if_unread` policy; `customerEmailEligible` intentionally excludes it in v1. Missing provenance is not the first reason this reply is ineligible for email. This change preserves that exclusion and does not introduce unread-email delivery or expand any topic allowlist.

Implementation: return the already-read authoritative order from conversation authorization; copy only validated execution fields into a newly-created staff reply customer outbox, before transaction writes. During projection, require source/job execution agreement and validate inherited fields before creating the notification; malformed or mismatched records enter existing blocked-content states. Valid test notification records inherit the source's immutable mode/version/run and Test flag; unmarked live records stay unmarked. No extra database reads or network I/O.

Validation: actual callable-handler and transactional projection tests for live/test happy paths, idempotent replay, malformed source/job, mixed modes/runs/versions, existing ownership/lock checks and unchanged reply email exclusion; eligible-event control verifies the unchanged email-policy path. No provider, secret, runtime, production fixture, release or deployment operations.

Risks/limits: test classification remains conservative for legacy `testMode` markers. Projection does not grant email authority: the sender still revalidates current policy, consent, identity and provenance at its final transaction. This metadata correction adds no new user-facing strings, layouts or displayed-data meaning. Current `src/features/notifications/Notifications.tsx` does not render the execution marker; no visible Test badge is claimed by this patch. Whole candidate CI/artifact/live verification remains root-owned.

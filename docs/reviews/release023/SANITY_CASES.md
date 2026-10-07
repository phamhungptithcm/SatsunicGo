# Executed scenario inventory

The executable cases are `tests/browser/release-sanity.spec.ts`, `release-hardening.spec.ts`, `release-accessibility.spec.ts`, `tests/rules`, and `tests/unit`. Existing comprehensive matrix: `docs/reviews/release021`; current results: `output/playwright/release023`.

Happy paths: catalog selection/variant/quantity and full payment transition; custom reviewed quote/deposit/final balance/dispatch/customer receipt; staff support; document draft/issued/print; customer order deep links; media upload/read; responsive keyboard controls.

Bad paths: unauthorized/foreign ownership, locked/revoked roles, malformed input, stale versions, purchased substitution, duplicate/concurrent operations, response loss/retry, obsolete route completions, private image leakage, pending reservations, queue starvation, uncertain SMTP reconciliation, revoked public documents, unavailable/failed lists and empty filters. Monetary authority and ledger immutability remain server enforced.

Added023 regressions: 8 mocked email-worker cases; mixed-role media union and concurrent upload/revocation integration; substitution no-write transaction regression; three native deferred UI mutation/read cases at390/768/1440; native browser200 keyboard/AX assertions. A passing automated case covers its named assertions, not every product state or real provider interaction.

NOT_RUN: real screen reader, provider payments/email/model, production identity/security configuration, production restore/rollback and load/animation frame profiling. Native complete proposal-application journey is not established by the server negative and domain positive tests.

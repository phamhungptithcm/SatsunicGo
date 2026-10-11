# Review cycle 1

F1 MEDIUM — src/features/cart/purchase-checkout.tsx preview invalidation effect. Actual Chrome localhost mixed checkout 7af18e68-23ae-41f8-b3c1-1c7f6b003552 showed the recipient screen with “Giỏ đã đổi” after successful commit, then navigated to payment. Commit atomically increments the cart revision and sets activeCheckoutId; the old preview is therefore expected to differ during navigation. No money was allocated by this transient state. Fix plan within approved v1 paths: only invalidate a changed revision when the cart has no active checkout; include activeCheckoutId in dependencies. Existing active-checkout navigation remains authoritative. Preserve ordinary stale-cart rejection and server preview/commit validation. Verify with typecheck, scoped lint, focused checkout tests and fresh actual UI checkout; product-content review covers the existing message's corrected applicability.

E1 TEST ENVIRONMENT — Two slow native-input Auth Emulator popup attempts failed “No matching frame”. Fresh popup with normal DOM fill/click completed Google emulator login and automatic guest transfer. No auth/config/security change was made. Popup lifecycle/timing remains an emulator limitation, not a verified production auth defect.

E2 TEST HARNESS — Initial restricted-network SePay integration setup could not reach loopback. Scoped rerun with local-network execution passed 31/31; preserve the failed receipt. Aggregate emitted PassThrough MaxListeners warnings. Single-case trace rerun passed with no warnings; aggregate trace identifies @google-cloud/storage teeny-request index.js:194 pipeline(responseStream,requestStream). Ten sequential owned-PDF downloads show GC-normalized heap +710,424 B / external +60,776 B, 3–10 ms, with22per-request warnings including warmup. This does not prove a persistent leak or production capacity. No listener limit suppression or dependency change.

B1 PROVIDER BLOCKER — Genuine SePay sandbox hosted payment/IPN was not run: runtime activation off, no verified app-scoped credential binding, public IPN previously deferred. Synthetic tests are not provider evidence. Production release must preserve payment holds pending provider setup and acceptance.

# Review cycle 2 — fresh current source

F1 FIXED: activeCheckoutId now prevents false preview invalidation during commit navigation. Exact file SHA25634b96ced28ab271a230cf50d6882e41f7dca1c1bb28a5833892a927a1f27de4b. Frontend typecheck, scoped lint,168focusedunit tests and two post-fix normal UI commits pass. Actual second-tab cart edit still invalidates overview and preserves recipient. Server owner/revision/hash/expiry/price checks unchanged.

B1 remains OPEN/HIGH acceptance blocker. Current local engineering delta passes within executed evidence; full SePay provider task and production readiness remain BLOCKED/NOT_READY. Concrete next gate is PROVIDER-NEXT-GATE.md; earlier public-IPN deferral remains in effect.

E2 remains LOW residual SDK warning. Production load/soak is NOT_RUN. E1 emulator popup lifecycle and download-event watcher limitations are retained; actual login and PDF download independently succeeded. No auth bypass or observer-failure-as-product-failure claim.

All automated fixtures owned by this task were cleaned with zero remaining (1,201initial +31latest documents); own UI demo records retained for review. No shared reset/reseed/restart. Two concurrent SePay secret-registration source deltas were identified without rollback;100currentunit cases, freshcompile and currentfour-process settlement selection pass. FINAL-MANIFEST.json binds exact current source; deployment is a separate release-owner gate.

# ASK-COMMERCE-008 validation evidence

Base HEAD: 3bd0d093255963a2cbf66ddd80d27456da7076e0; extensive unrelated WIP preserved. Source hashes in ASK-COMMERCE-008-SOURCE.json match current candidate; frozen browser source comparison passed. Repository intelligence DEGRADED (stale optional indexes); bounded source/compiler/tests used.

## Executed checks

- npm run typecheck: frontend TS and functions build exit 0.
- npm run lint: exit 0 (latest with Vite build).
- npm run test -- tests/unit/ask-workflow.test.ts tests/unit/ask-transport.test.ts tests/unit/lifecycle.test.ts: 3 files, 15 tests passed.
- Isolated demo emulator workflow/rules test: 6 tests passed, including server commerce gate closed outside explicit demo exemption, authentication/role denial, owner separation, no client writes, locked account denial, quote conflict, recipient boundary, concurrency/idempotency and lost-finalization recovery.
- npx vite build --outDir /tmp/ask008-build: exit 0. Existing >500kB Firebase chunk / ineffective dynamic import warnings remain. This is a frontend bundle check, not full production release.
- Initial default rules runner failed because shared emulator ports were occupied; no test passed from that attempt. Dedicated ports were then used.

## Browser fixture

Frozen frontend http://127.0.0.1:5178 and frozen functions in /tmp/ask008-runtime; demo auth9197, Firestore8183, functions5103, own hub4418. Emulator Node25 differs from declared Node22. No actual Google exchange, payment, purchase or shipment.

Customer A synthetic request Ask008 Fixture Shoes, US,size42,quantity1 → one order; recipient saved; authoritative quote1,300/deposit650 → accepted in chat. Missing payOS configuration displayed safe retry/no added-money message. Existing authorized synthetic finance command credited650, staff purchase/receive/pack commands advanced state. Final charge1,400 required customer approval in browser, resulting due750. Synthetic finance750 then staff dispatch/tracking DELIVERED. Customer receipt confirmation in browser transitioned COMPLETED. Closed/reopened and signed A→B→A: B showed no A data; A resumed same completed order. English FAQ and native English buying form rendered. VI mobile390×844 and desktop1280×900; keyboard Tab inside modal; screenshot artifacts and AX state observed.

## Production boundaries

Client commerce defaults off in production unless VITE_ASK_COMMERCE_ENABLED=true. Both new authenticated server endpoints require settings/askCommerce enabled=true and approved=true outside exact demo emulator exemption. No production config changed. Existing orders/payments continue on existing surfaces if commerce disabled. Disabling writes preserves server records; re-enable requires reviewed live readiness. No destructive migration; new owner-scoped documents/rules and bounded single-field saved-address reads.

Live Gemini extraction, real Google auth/AppCheck/MFA, payOS happy link/checkout/webhook/reconciliation, merchant checkout/carrier automation, actual physical fulfillment, full screenreader/offline/zoom/cross-browser testing: NOT TESTED. PII redaction heuristic is best effort. Support/returns link uses existing support workflow, not an automatically resolved dispute. Recipient retention uses existing project records; no automated deletion introduced. No provider/secrets/IAM/release/push/deploy changed.

Optional cleanup: Firebase CLI export accidentally selected another local demo hub; that export was never read/imported. Correct frozen import used own hub4418 export. Automatic approval rejected recursive removal of the accidental temporary export directory; it remains untouched. No production action was involved.

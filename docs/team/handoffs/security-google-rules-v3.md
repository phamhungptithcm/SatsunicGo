# Rules fixture type correction — v3

Observed full tsc exposed widened sign_in_provider fixture strings, intentional string verification, and SDK TokenOptions lacking documented MFA property. Corrected only tests/rules/firestore.test.ts: contextual TokenOptions for normal/rejected fixtures; intentionally malformed string injected with Reflect.set into mock fixture (case retained, no production cast/relaxation); structurally compatible separate MFA fixture retains totp and literal Google provider.

Validation: npm run typecheck PASS (root tsc --noEmit plus functions build), scoped ESLint PASS. Emulator NOT_RUN, lease unchanged. Rules get(key, default) verified in official Firebase Rules Map reference including default arbitrary types and nested map support: https://firebase.google.com/docs/reference/rules/rules.Map . Existing chained get syntax matches that contract; runtime compiler acceptance awaits coordinated emulator suite.

v2 source hashes superseded only for test fixture file; obtain current shasum before acceptance. Rules/hash/control predicate unchanged. No casts suppress malformed negative-case semantics, no provider/secret/memory changes.

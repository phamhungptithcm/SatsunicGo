# CI cycle 1 → scoped test repair

Initial exact-head CI38077839091 and candidate38077849800 failed on8ae62989; artifact skipped. Two tracking suites hardcoded18207 rather than CI8181, cleanup produced a secondary missing-app failure, and an existing parcel fixture reused revision1 after CRM shipping increments.

Commit00da8d08 uses the existing strict demo/loopback environment guard, preserves unique project cleanup, skips absent-app cleanup, and tracks/asserts actual order revisions. Added stale-revision ABORTED assertion. No production logic or safety control weakened. Typecheck, focused ESLint and87 tracking emulator cases pass. Full isolated CI is rerunning.

Cycle2: baseline/purchase/cart/pilot passed; delivery group exposed five old expectations in manual-delivery-estimate064.test.ts. Commit4eb4646f now asserts only customer revision/updatedAt changes, preserves money/allocation/outbox invariants and mixed-owner redaction checks, uses current CAS revisions and cleans newly emitted unique-order timeline fixtures. Focused ESLint/typecheck pass. Full isolated CI rerun required before marking fixed.

Cycle3: four ETA tests failed because the repair incorrectly assumed order.updatedAt existed. Source stores timestamps on canonical timeline events and customerShipment projections. Commita4c59f6f corrects assertions to revision-only order changes and deliveryEstimateUpdated events with numeric createdAt. Existing strict demo helper permits running this unique-project fixture on the shared emulator; no restart/reset/baseline writes. All15 ETA cases pass locally, as do lint/typecheck. Full final CI rerunning. This was a test-repair error, not an application defect.

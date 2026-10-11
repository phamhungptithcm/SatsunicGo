# Production test notification consumer impact

Mode: approved v1 implementation, scoped owner assignment from root. Human approval: PRODUCTION-TEST v1, `call_5081fd46f74546c08b78d7a095730a9a`, item0. RIG remains DEGRADED; bounded direct component/projection/test evidence is used. This plan is recorded before the edit.

Observed: `Notifications.tsx` maps Firestore `d.data()` into each row and displays title/time/read-state/target. It has no Test marker. Root identified that finance now persists execution metadata for test notification projections; the current order-conversation source also derives reply execution from the authorized source order. This UI assignment does not alter or certify those backend writers.

Before-edit source SHA256: `62269d36b0eff98b5d64364e03b45617a87b61778c6cbd441be1fe11db94535b`.

Smallest implementation: import the existing `TestOrderBadge`; add optional unknown presentation provenance fields to the local row type; render that badge beside the existing notification title. Reuse visible `Test` and accessible `Đơn test`. No new product strings, CSS, wrapper, layout, query, auth, target, subscription, mutation or read-state behavior.

Owned source: `src/features/notifications/Notifications.tsx`. Owned new regression: `tests/unit/production-test-notification-ui.test.ts`. Actual-component rendering tests inject already-read synthetic rows through a disclosed state seam, cover canonical/legacy/partial/untagged records and retain destination/unread/title semantics; no Firebase initialization or network.

Preview: retain current source-bound network-blocked artifact controls. Add the actual Notifications component in the existing synthetic context and an owned Firestore adapter limited to exact `notifications` + preview owner + descending createdAt + limit30 read. Every other provider/read/mutation stays denied. No new server, external import, account or provider call. Root handles exact HTTP reload and browser review. Sync cycle2 scaffolding before extension; regenerate from new candidate source, never edit HTML directly.

Verification: focused component regression, affected presentation tests, frontend strict compile, scoped lint/diff check, preview build/syntax/hash/module inventory and source binding. Browser acceptance of the new notification row is NOT_RUN until root reloads the new exact artifact. Prior 37ba component evidence remains scoped historical proof for unchanged components.

Risk: test metadata could otherwise be mistaken for a real payment/reply. A marker is presentation only, with conservative existing classification; it grants no authorization. Preserve other owners' backend fixes and every shared runtime/account. Full Product Language Gate remains BLOCKED while native select/zoom/spoken AT evidence is incomplete.

# Notification state fixture

Run the saved `build.mjs` from the repository root with Node22. It builds into this directory only, through Vite `write:false`; do not hand-edit `components.js`, `components.css` or `preview.html`.

Open `http://127.0.0.1:5207/docs/reviews/PRODUCTION-INTEGRATION-20261009/EMAIL-CONTENT-R2/preview.html` using the existing shared server. Root owns CUA browser validation. No browser automation is included here.

Query parameters: `screen=profile|preferences|checkout|token`, `availability=ready`, `state=off|pending|active|partial`, `stateB=off|pending|active|partial`, and `mode=ok|loading|loadfail|savepending|uncertain|conflict|unauthorized|quota|tokenfail`.

`Fixture owner A/B` changes the synthetic Auth identity and user prop. `Resolve pending response` completes the oldest captured request, under its original owner, even after switching owners. Use `screen=preferences` for the hook epoch test: the NotificationPreferences instance stays mounted across user changes. Profile itself keys its notification child by user ID, matching current application behavior. Every reload resets the in-memory fixture.

The visible call trace contains only action, synthetic owner and operation ID. It is capped at80 rows. No payload, recipient, phone, message, credential or token is traced or persisted. A lost response commits to an owner-scoped in-memory operation cache; retrying the same command returns the cached result. Reusing that ID under another owner cannot read the first owner's data. Delayed responses preserve the captured request owner and result rather than reading the currently displayed owner's state.

Profile, NotificationPreferences, NotificationLinkAction, CheckoutNotificationChoices, the notification hook, domain schemas and imported styles are actual current source. Checkout uses a declared synthetic frame around the real choices and hook, excluding the full checkout/cart/payment flow while another owner works there. Profile save-recovery storage and all Firebase/Firestore/Auth/callable/cart boundaries are synthetic. Profile persistence is denied. The historical r4 header/footer are inert and explicitly excluded from current shell acceptance. CSP blocks remote provider connections; the existing local Vite connection remains allowed.

`SCENARIOS.json` lists25 prior acceptance cases plus current owner-isolation/recovery cases. Their browser status is `NOT_RUN` until root executes CUA and records current evidence. Local fixture success never proves authentication, deployed callables, backend ownership, provider acceptance/delivery, SMS, CRM or production performance. Native AX inspection does not prove spoken screen-reader acceptance; text scaling is not browser zoom.

Rollback: remove only this new fixture directory after preserving review evidence. No account/runtime restore is needed. Token usage and actual billing: Unavailable. Memory candidates: None.

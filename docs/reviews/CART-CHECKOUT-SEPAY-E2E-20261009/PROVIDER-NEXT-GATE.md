# Genuine SePay sandbox acceptance — proposed delta, not executed

Local protocol and demo UI acceptance are complete. Genuine hosted SePay sandbox/IPN acceptance is NOT_RUN. Existing source intentionally permits this provider only in the exact demo emulator; it cannot be enabled in production by flipping a flag.

The next test needs an application-scoped server binding for SEPAY_SANDBOX_SECRET_KEY and a separate SEPAY_SANDBOX_IPN_SECRET_KEY. User entry must occur through a secure server-configuration mechanism; never send secret values in chat, browser URLs, screenshots, committed files or reports. Creating credentials at SePay does not prove that this app runtime is bound to them.

Before implementing any public endpoint/exposure, review and approve its exact host, owning project/process, authentication, route, expiry and teardown. Expose only the IPN route required by SePay, never Auth/Firestore/Storage emulator/admin/debug surfaces. The present task retains the earlier decision to defer a public IPN; it creates no tunnel, deployment, IAM or secret access.

Once binding/public-IPN details are approved, run one isolated synthetic customer and sandbox-only order: normal hosted BANK_TRANSFER checkout, sandbox fake-bank interaction, authenticated real IPN admission, fixed-host SePay readback, verified settlement, PDF worker and owner download. Capture sanitized provider references/timestamps and receipt hashes, not credentials/signed forms. Then exercise duplicate/delayed IPN, wrong authentication, cancelled/error return and reconcile-after-return. Separate provider limitations from injected negative cases.

Before accepting: actual provider wakeup/readback must match invoice, merchant, currency, total and owner; ledger/order creation once; PDF/download and downstream fulfillment correct. Remove temporary public exposure and leave activation fail-closed if incomplete. Production payment activation requires a distinct reviewed integration/release plan, exact candidate CI and deployment/provider readback; this sandbox-only adapter is not a production payment implementation.

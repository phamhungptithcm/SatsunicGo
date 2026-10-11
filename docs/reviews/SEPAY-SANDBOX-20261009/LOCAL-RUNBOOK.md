# Local sandbox handoff

The shared browser URL is http://127.0.0.1:5207. Backend demo uses Auth19207, Firestore18207, Functions15207, Storage19208 and project demo-satsunicgo. Configuration and synthetic data export are in /private/tmp/satsunicgo-shared5207. The user approved creating this replacement demo dataset; it is not a restoration of the lost prior dataset.

The current shared runtime has PURCHASE_SEPAY_SANDBOX_ENABLED=false. It uses synthetic fixture keys and the existing demo gateway. Do not enable the flag with fixture keys and describe the result as a real SePay payment. The SePay integration tests explicitly inject the synthetic provider adapter into real handlers against emulator persistence; the live SDK/API path remains unverified.

## Reproducible local checks

Use the existing listeners; do not start an extra frontend. Commands require local loopback access in the execution environment:

```sh
npm run typecheck
npx vitest run tests/unit/purchase-sepay.test.ts tests/unit/purchase-checkout.test.ts tests/unit/purchase-provider.test.ts tests/unit/purchase-pdf.test.ts tests/unit/purchase-payment-selection.test.ts tests/unit/purchase-owner-guard.test.ts tests/unit/purchase-feedback.test.ts tests/unit/purchase-recipient-validation.test.ts tests/unit/purchase-mutation-queue.test.ts tests/unit/purchase-acknowledgement.test.ts
FUNCTIONS_EMULATOR=true GCLOUD_PROJECT=demo-satsunicgo FIRESTORE_EMULATOR_HOST=127.0.0.1:18207 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:19207 FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:19208 npx vitest run --config scripts/purchase-sepay-rules.config.mjs
FUNCTIONS_EMULATOR=true GCLOUD_PROJECT=demo-satsunicgo FIRESTORE_EMULATOR_HOST=127.0.0.1:18207 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:19207 FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:19208 node scripts/purchase-sepay-scenarios.mjs
```

Each run creates uniquely named synthetic fixtures and does not reset shared data. Export before stopping/reloading emulators; keep the same config and import directory. Source lib is linked into the temporary Functions source; the emulator watcher has reloaded compiled definitions. Host Node25.9.0 was used; requested Node22 is not installed, so Node22 runtime validation is NOT_RUN.

## Owner configuration needed for later real sandbox acceptance

Keep merchant SP-TEST-HL5339A9 and BANK_TRANSFER. The application expects separate bindings SEPAY_SANDBOX_SECRET_KEY and SEPAY_SANDBOX_IPN_SECRET_KEY. The latter must match the independently configured SECRET_KEY IPN authentication setting in the SePay dashboard; equivalence with the merchant secret is not assumed. Never paste either value into chat, frontend/VITE variables, source control, command arguments or report artifacts. The agent verified merchant-secret metadata only and did not retrieve its value.

An approved application-scoped runtime credential mechanism is still required. This document supplies no workaround to retrieve secrets through the conversational agent. A human or approved broker must bind the keys securely before live sandbox activation. The current code deliberately allows only exact demo emulator identity and fixed localhost return URLs. Real provider acceptance of those callbacks is unknown.

Public HTTPS IPN deployment is a separate deferred phase. The current endpoint is local:

http://127.0.0.1:15207/demo-satsunicgo/asia-southeast1/purchaseSePayIpn

Do not paste that localhost URL into the provider dashboard expecting external delivery. Readback requires a provider order ID learned from authenticated IPN; an invoice is not substituted for that order ID. Until real IPN is available, real hosted checkout cannot be declared complete from a browser return alone.

## Failure and recovery

Use the same checkout ID/invoice after unknown results. The browser cannot mark paid, release funds or create a replacement payment from a success/cancel query parameter. Verified proof survives interrupted allocation; expired worker leases can be reclaimed. Distinct second transactions retain separate financial review evidence. Wrong amounts, late/cancelled/locked/stale balance targets remain for human reconciliation. VOID holds fulfillment without automatic reversal/refund. Receipt rendering retries independently, with a finite retry limit; it never repeats allocation.

Private intent/index/inbox/proof/payment-evidence collections deny direct client reads/writes. No financial TTL was activated. Operator review/dead-letter tooling and alerts are not a production-ready workflow in this local phase. Do not delete evidence to clear an error or relabel a pinned sandbox checkout as demo.

## Deferred acceptance

Current authenticated full-app browser checkout, real hosted payment/readback, public IPN, actual email, production deployment, real money and Node22 validation have no passing evidence here. Browser automation rejected localhost access; no workaround was attempted. Keep final review BLOCKED and production NOT_READY until the applicable missing checks are completed through an authorized environment.

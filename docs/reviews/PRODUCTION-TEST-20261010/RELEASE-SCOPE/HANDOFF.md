# Release scope handoff

Source is frozen for parent validation. The owned source review passed its bounded checks; aggregate final review and production remain **BLOCKED / NOT_READY** until combined build, normal CI, immutable artifact, provider readback and live acceptance pass. No push, deployment, provider mutation, secret payload access or shared runtime change was performed by this agent.

## Implementation

- Keep the three authentic SePay handlers behind the exact production-test artifact environment and server policy. Strip the two client-outcome demo handlers.
- Bind the fixed public flags `PURCHASE_PRODUCTION_TEST_ARTIFACT=v1` and `PURCHASE_SEPAY_SANDBOX_ENABLED=true` into `deployment/functions/.env.satsunicgo`. Firebase excludes dotenv from its uploaded source ZIP, so only this exact file/digest is exempted from source ZIP comparison; every deployed function must separately read back the matching flags and no emulator variables.
- Retain Ask workflow/conversation exports. Keep legacy PayOS, mixed maintenance and feedback cleanup held. Cleanup still needs the approved indexes and READY readback.
- Pin test provenance in the generic request transaction. Artifact v1 rejects missing, disabled, expired, unauthorized or malformed runtime admission before any write. Existing idempotent operations replay their original result after policy-off. Original behavior outside v1 remains intact.
- Allow simulated quote/accept/cancel/claim/hold/finalize decisions after the existing domain and role checks. Block real money, stock and physical fulfillment actions for test records.
- Split studio publication and in-app customer notification recovery from mixed deletion/expiry maintenance. Both remain inactive without strict, current `settings/scheduledJobs` policy.
- Recovery uses the private `scheduledJobCursors/customerNotificationRecovery` document. Each run reads at most 30 queued outbox rows, projects at most five concurrently, and advances only if a transaction still sees the cursor initially read. An empty page resets the cursor to null; projection failures are eligible after wrap and by the retry-enabled creation trigger. Unknown/legacy job contents are not changed. No external-send drain or deletion is added. Firestore rules deny client access to this cursor path.

## Evidence

- Current backend strict and owned TypeScript lint: passed.
- Current five-file focused unit run: **258/258 passed**, including ten actual command producer scenarios and mixed-head recovery/wrap/concurrency cases.
- Artifact, pinned CLI retry prompt, real SDK discovery and source ZIP contracts: **124/124 passed**. The earlier offline lock-resolution failure is preserved in the review history; no gate was relaxed.
- Actual source preflight recognizes 110 source endpoints, three retained SePay handlers and two stripped client-outcome demos. It correctly remains failed only on `PUBLIC_ASSET_BINDING_INVALID` until the normal combined build regenerates assets.
- All 16 owned code/test/config paths and check log hashes are recorded in `HANDOFF.json`. Review cycles and residual limitations are in `FINAL-REVIEW.json`.

Root must reconcile the separately pushed c423001 retry repair with this 608-based working tree, regenerate assets and run the full combined candidate checks. The retry repair must not overwrite later artifact/environment validation changes. Provider tokens, actual billed cost and runtime ledger adapter are unavailable here. Memory candidates: None.

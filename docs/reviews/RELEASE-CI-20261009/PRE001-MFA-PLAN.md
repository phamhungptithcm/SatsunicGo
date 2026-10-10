# PRE001-MFA-20261009/v1 — proposed local acceptance harness

Candidate: da9369f602474b57e96482e43bd889ead7b096f4. User selected acceptance before deployment, confirmed VoiceOver audible pass, and confirmed production is the only real environment. No conditional rollout approval.

## Source facts and impact

- purchaseDemoEnvironment requires FUNCTIONS_EMULATOR=true, GCLOUD_PROJECT and FIREBASE_CONFIG.projectId and actual DB projectId exactly demo-satsunicgo, Firestore loopback18207. Actual applySettlement refuses other environments. Creating cloud staging alone cannot run this producer without changing candidate fences.
- OperationsDetails calls readOrderOperations; actual handler requires verified Google identity and current active/unlocked allowed staff role, and reads orderOperations recipient projection. BUYER does not receive recipient details. Existing local component proxy used synthetic service/Auth evidence and does not close genuineMFA acceptance.
- Existing real production session/old deployment cannot prove candidate producer integration. No production order/financial fixtures, payment execution, staff grant, authentication enrollment, secret access or changed production policy proposed.
- Existing shared5207/demo emulators must remain untouched except owned synthetic records; no restart/reseed. Candidate application source remains immutable.

## Smallest proposed test setup

Create task-owned, credential-free test harness files under /private/tmp/satsunicgo-pre001-mfa-20261009/ only, plus this task's review receipts. Explicit exception requested to the shared-server rule: one temporary isolated frontend bound127.0.0.1:5208 and one backend verification/handler bridge bound127.0.0.1:15209. Check both ports before binding; collision means stop, no fallback. Reuse existing Firestore18207; no extra emulator. Stop both owned processes after acceptance.

Frontend bundles actual frozen OperationsDetails/CRM presentation and actual candidate login/MFA challenge components. Only test bundle's service wiring points to local bridge. Firebase Auth uses the existing production project's public auth configuration without emulator. User performs normal existing staff Google login/MFA directly in browser. No OTP/password/secret through chat, no new MFA enrollment or account/role changes. If login requires credential creation/enrollment, hand off and stop that path.

Backend independently verifies Firebase-issued production ID token (signature, issuer, audience, expiry), verified Google provider and actual recent second-factor evidence using existing recentMfa semantics. It reads only that signed-in user's own current staffAccess/users lock and role metadata through normal authenticated Firestore permissions; no customer/order production data. It requires existing active/unlocked OWNER or OPERATIONS_MANAGER/WAREHOUSE role appropriate to actual handler; cannot create/grant production staff authority. No client-supplied role/auth claim accepted.

Raw ID token is sent only from test frontend to loopback bridge in an Authorization header, and from bridge to the existing Google/Firebase services needed for token verification and reading that user's own authorization metadata. Do not print, persist, put tokens in URLs, or copy production browser storage. No production data is written. If authentication/own-metadata permission is unavailable, record the blocker and stop; do not weaken rules, mint claims or use synthetic MFA.

After real identity/role verification, create only owned demo staffAccess/users documents at the exact verified staff UID, copying only necessary allowed role/lock metadata. Use create-if-absent; if either UID path already exists, stop rather than overwrite shared state. Keep the real verified UID unchanged in handler auth. Execute the actual candidate recipient producer against exact existing demo18207 using newly owned synthetic checkout/order IDs and addresses. Invoke actual candidate readOrderOperations handler with independently verified real auth claims and the corresponding owned demo role documents; render actual OperationsDetails via local bridge. Preserve manager/warehouse projection and buyer redaction. Verify recipient name/phone/long address and selected order identity, reload, permission failure, denied stale MFA and cleanup. Maintain a manifest of every owned record and delete only owned synthetic records afterward. Never overwrite shared settings or other accounts/carts.

## Evidence boundaries and acceptance

This can prove local candidate producer→actual read handler→actual CRM renderer under genuinely verified Firebase staffMFA. The bridge is test instrumentation; it does not certify deployed callable HTTP/AppCheck, IAM, real payment settlement or production provider behavior. Those remain later production gates. Do not silently treat this as ordinary deployed end-to-end evidence. Final review must explicitly assess whether this scoped evidence satisfies the existing PRE001 criterion; if insufficient, retain BLOCKED and propose the next concrete step without relaxing auth/environment fences.

Bind source hashes to da9369f; capture sanitized outcome receipts/screenshots, authentication facts only as booleans/provider and freshness, no tokens or private profile details. Verify original production/shared runtime state unchanged, owned processes stopped and synthetic fixtures removed. Repeat review→fix within approved harness scope→verify→review. No application/dependency/workflow/IAM/provider changes in this plan.

## Approval requested

Approve PRE001-MFA-v1: task-local harness/test wiring, temporary loopback5208+15209 exception, existing production staff login/MFA and read-only own role/lock metadata, sensitive ID-token use only in the stated local/Firebase verification path, and owned synthetic demo fixtures/cleanup. This does not authorize deployment, production writes, credential changes or expanded access.

Approval: direct human reply “Duyệt PRE001-MFA v1” (call_6V6KSr7O7oY3Vt7ej33JrRkO). Implemented only task-local harness; user login/acceptance pending.

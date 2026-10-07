# Auth setup progress — 2026-10-04

Approved human request: setup Google One Tap for satsunicgo, following UX-AUTH-004. Repository intelligence refreshed; DEGRADED fallback used. Relevant current source and installed Firebase CLI auth/domain/provisioning implementations inspected.

Initial Auth admin403 included SERVICE_DISABLED for identitytoolkit.googleapis.com. Enabled only that API using Service Usage; operation operations/noop.DONE_OPERATION returned done:true. Independent Service Usage readback reports ENABLED. Billing not enabled; no other API, provider, IAM, secret or production data changed.

Diagnostic correction: Auth admin requests require x-goog-user-project:satsunicgo, matching installed firebase-tools/lib/gcp/auth.js. With target project header, config read now404 (no configured Auth resource); previous unqualified403 was not sufficient to establish lack of IAM permissions. Inspector now uses that header. No API keys, access tokens, client secrets or protected user records printed/read/exported.

Firebase Console opened at project's Authentication providers page; browser redirected to Google account chooser with all listed accounts signed out. Human login requested, without requesting password/OTP. Support identity email requested for correct Google consent brand/provider provisioning. Those inputs remain pending; no invented email or other project's OAuth client reused.

Next: use verified satsunicgo Web app and supported Firebase CLI Auth provisioning; confirm provider support identity, matching public OAuth client and authorized localhost/production domains/origins, preserve any existing settings, obtain current browser action-time confirmation if security-sensitive final save is needed. Store only public client ID in ignored .env.local. API/header correction alone does not establish One Tap sign-in acceptance. No auth initializer capable of unintended Identity Platform upgrade invoked.

Current review BLOCKED: provider/client not provisioned, public client ID absent, interactive login/local/production acceptance not performed. Source inspector parse/format checked; whitelisted enablement readback passed. No full production readiness claim. Token usage/cost Unavailable. Memory candidates None.

## Continued setup with support identity

User supplied hunpeo97@gmail.com or contact@hunpeolabs.com; chose the named Google account address for consent support. Official installed Firebase auth provisioning attempted twice; both returned500. Reconciled state: Auth config now exists; Google provider read404 after API attempts. No further blind retry performed.

Preserved existing production domains and added localhost/127.0.0.1 using the installed Firebase domain API. Independent readback verified all four exact domains. This does not prove OAuth JavaScript origins or One Tap login.

Browser account selection successfully opened satsunicgo Firebase Console as the user-selected Google identity. Google provider dialog is prepared with Enable on, not yet saved. Screenshot: /tmp/satsunicgo-google-provider-ready.png. Browser policy requires action-time confirmation before activating the new authentication provider; question sent to human. No private Web SDK fields expanded or client secret accessed. Public Client ID and OAuth origins remain pending the provider save. Current status BLOCKED_PENDING_PROVIDER_SAVE, live login acceptance NOT_TESTED. Full master readiness remains NOT_READY; other concurrent source changes preserved.

User approved the Firebase Google provider Save action. Save was attempted, but dialog did not complete; no successful provider state observed. Google Auth Platform read-only overview confirms zero OAuth clients. Prepared Web client SatsunicGo Web with5 JavaScript origins (localhost, localhost:5173,127.0.0.1:5173, production web.app/firebaseapp.com) and two Firebase handler redirects. Creation form is valid, Create not clicked; action-time confirmation requested for new OAuth credentials. Screenshot /tmp/satsunicgo-oauth-client-ready.png contains configuration only, no credentials. Current provider/client setup remains incomplete; no live login claim.


Final configuration review: human approved Create OAuth Web client and Save Google provider. OAuth client creation succeeded. Firebase automatic client creation/provider activation then completed asynchronously; API readback confirms enabled:true and a Firebase-bound public client. Kept the additional named client rather than deleting credentials without authorization. Updated only the bound client's exact requested URLs, preserving original localhost:5000 and other settings; save navigated back to client list, re-opened detail and read all expected persisted origins/redirects. Stored bound public Client ID in ignored .env.local (0600), not the unmatched new client. Branding readback confirms app SatsunicGo and user-selected support identity. Provider Enabled screenshot /tmp/satsunicgo-google-provider-enabled.png. No secret download or secret field output.

Configuration criteria verified; overall review remains BLOCKED because live local/production One Tap interaction and full application acceptance are NOT_TESTED. Current production static bundle still disables clients; no integrated deployment, billing or IAM changes performed. Concurrent backend/CRM source changes detected and preserved, so this configuration review cannot certify that full candidate. Test results recorded from the current command output separately; token usage/cost Unavailable.

Validation during current concurrent source work:46 tests/15 files passed. First compiler run saw a transient minDeposit reference while another edit was in progress; current source already uses order.deposit. Re-ran TypeScript/Functions compiler after inspecting current source, without reverting or changing the concurrent edit. Live Google authentication NOT_TESTED.

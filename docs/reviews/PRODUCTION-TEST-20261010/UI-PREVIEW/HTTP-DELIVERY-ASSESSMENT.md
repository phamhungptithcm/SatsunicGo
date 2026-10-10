# HTTP delivery assessment — no action performed

## Decision

Serving **only the reviewed synthetic artifact** through the existing loopback HTTP server is materially narrower than granting browser filesystem access. It is a distinct standard HTTP delivery route; it does not retry `file://`, alter browser policy, change providers, introduce a new server or use accounts/backend data. Root must decide and obtain any required action approval before copying or navigating. This assessment performed neither action.

The recorded denial is `BROWSER_URL_POLICY_DENIED_FILE_PROTOCOL`, before navigation (INTEGRATION/UI-BROWSER-ATTEMPT.json). No alternate browser, native launch, raw CDP, file-policy workaround or new listener is proposed.

## Exact minimal delivery

- **Source:** `/private/tmp/satsunicgo-full-local-integration-20261009-jdho247x/repo/docs/reviews/PRODUCTION-TEST-20261010/UI-PREVIEW/production-test-components.html`
- **One temporary destination:** `/Users/hunpeo97/Desktop/Workspace/Coder/SatsunicGo/docs/previews/PRODUCTION-TEST-COMPONENTS-20261010.htm`
- **Existing-server URL:** `http://127.0.0.1:5207/docs/previews/PRODUCTION-TEST-COMPONENTS-20261010.htm`
- **Exact bytes:** 933,564; SHA-256 `bc202b1f4b44613b9c8f3143df4087bfbd54fbe770aa272271422d4dd0c78bb2`.
- The destination is currently absent and its parent directory exists. Recheck immediately before any authorized copy; do not overwrite an existing file. Copy the bytes once, without adding scripts, config, links or other source files.

`.htm` is standard HTML MIME delivery here. Current installed Vite source maps `htm` to `text/html` at node.js:5041. Its static middleware skips `.html` specifically at node.js:17792, while indexHtmlMiddleware transforms `.html` at node.js:18106. Static middleware runs before fallback/index HTML handling (node.js:24903–24908). A `.html` file under ordinary docs/previews would therefore receive Vite client/React-refresh injection and would not be byte-identical to the reviewed artifact. The `.htm` destination preserves ordinary static serving without modifying the server or its controls.

Both candidate and shared installed Vite source bytes match. Verified source SHA-256: `21d5c6b4fb1013b98b1436e9e2a3bb416c8932343ad42ec293bbf760f51a0131`. This is current source evidence, not a successful HTTP readback.

## Required checks before browser acceptance

1. Recheck MANIFEST's 34 inputs and the 15 UI-CHECKS source hashes. If relevant code changed, regenerate the preview and re-review its bytes rather than copying the old artifact.
2. If root authorizes delivery, exclusively create only the destination above from the verified source. Preserve unrelated docs, app source, shared runtime, environment and processes. No new server, restart, auth, cookie, token or Firebase action.
3. Read the exact HTTP URL without following redirects. Require HTTP200, `Content-Type: text/html` and the decoded response body SHA-256 equal to the approved artifact. Reject SPA fallback, injected Vite scripts, transformed content, redirect or different MIME/body. No browser action until this readback passes. Prior curl loopback transport failed; HTTP reachability is currently **NOT_VERIFIED**.
4. Root performs the source-bound component checks in CHECKLIST.md. Existing document CSP `connect-src 'none'`, provider-import denial, fetch/XHR/WebSocket/EventSource blocking, mutation denial and nonpersistent storage must stay intact. Do not navigate the normal application or external links as part of this preview acceptance.
5. Record exact viewport/zoom, pointer/keyboard/focus and authorized AT observations. Restore any temporarily enabled AT state. Do not relabel a screenshot or component preview as staff/MFA/backend/provider evidence.
6. Remove only the owned temporary copy after acceptance, with its expected identity/hash rechecked. Do not include this temporary delivery copy in a production release or keep it as an untracked file when committing all local changes. The canonical review artifact remains in the isolated evidence folder.

## What becomes provable

The real candidate Workbench/filter/detail focus, TestOrderBadge, ActionForm suppression and OrderTools/PDF-link affordance can be exercised in a browser using synthetic read responses and real imported CSS. The synthetic account heading and feedback marker remain explicitly context proxies. No retest of unrelated unchanged screens or competing MFA harness is needed merely for this small presentation delta.

This route does **not** verify genuine staff identity/roles/MFA, deployed callables/AppCheck/IAM, settlement/provider behavior, actual receipt download/email delivery, fulfillment, current production settings or production readiness. Same-origin browser/service-worker behavior and final HTTP response are not inferred from source; response identity and actual browser observations remain required. No account/session mutation is authorized by this assessment.

## Current status

- RIG: DEGRADED; bounded current source/hash checks used.
- Artifact and 34 input hashes: match. All 15 owned UI hashes still match UI-CHECKS.
- Copy: NOT_RUN. HTTP readback: NOT_RUN. Browser acceptance: NOT_RUN.
- Product Language Gate remains BLOCKED until required changed-component acceptance evidence is supplied. Root continues the already approved work and handles any new delivery approval; this subagent does not ask the user or perform the delivery.

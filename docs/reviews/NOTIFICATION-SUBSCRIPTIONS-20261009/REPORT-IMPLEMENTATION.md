Latest supplement: NOT-17-REPORT.md; current review cycle 4, 134 joint tests + expanded Firestore integration and final global/scoped/Functions typechecks passed. The earlier results below are retained as the initial implementation snapshot. Cross-chat delivery is blocked by automatic approval review.

# Notification subscriptions — local implementation report

Approved scope completed in source: compact two-checkbox checkout, existing profile's third Notifications tab, independent owner preferences, hashed-token confirmation and revocation, gated email subscription jobs/templates, optional email preference enforcement, and provider-neutral SMS preparation. This is not a production release. SMS remains unavailable and no external messages were sent.

Context: TypeScript 6, React 19, Vite 8, Zod 4, Firebase client 12/Admin Firestore, Node 22 Functions target (local tool host Node 25). Profiles selected: typescript-javascript, web-app, frontend-html-css, visual-design, product-content, api, database, concurrency. Current code, existing checkout/Profile/auth/email/release-gate/rules, approved plan r5 and source-derived screens were inspected. CodeGraph then CocoIndex were queried; health is available but both indexes are stale, so intelligence is DEGRADED with bounded source/typecheck/test evidence. Approval validator insists on READY, conflicting with the user's AGENTS instructions permitting DEGRADED fallback; explicit user approval and the limitation are recorded in APPROVAL.md. No READY status was fabricated.

## Evidence-derived acceptance ledger

Equal weights apply only to the approved local preparation scope, not provider activation.

| Criterion | Weight | Result | Evidence |
| --- | --- | --- | --- |
| Two compact existing-checkout choices; removed helper lines | 1 | PASSED | Source component; browser 12px/400 computed labels, desktop/mobile screenshots |
| Existing Profile tab with independent choices | 1 | PASSED | Source and actual component/hook browser fixture; keyboard/pointer checks |
| Server owner isolation, save/replay/versioning, confirmation/revocation | 1 | PASSED | Endpoint/unit tests and actual shared demo Firestore transaction test |
| Email confirmation/welcome preparation and optional-message preference guards | 1 | PASSED | Closed release gate retained, templates/worker source, lifecycle and regression tests |
| SMS integration prepared with unavailable state | 1 | PASSED | Generic sender contract, SMS templates, consent-generation and order-SMS policy helper; no live dispatcher/provider claimed |
| Focused checks and final local review | 1 | PASSED | Commands below; FINAL-REVIEW-IMPLEMENTATION.json and source manifest |

Local preparation progress: 6/6. Provider delivery, production release, retention activation and authenticated deployed acceptance are deferred, not counted as passed.

## Checks

- `npx tsc --noEmit` — PASSED, exit 0, no diagnostics.
- `npx tsc -p functions/tsconfig.json --noEmit` — PASSED, exit 0, no diagnostics. No generated Functions build or shared runtime restart was performed.
- Scoped ESLint over changed notification sources, Profile/checkout and email integration — PASSED, exit 0, no diagnostics.
- `npx vitest run tests/unit/notification-subscriptions.test.ts tests/unit/notification-endpoint.test.ts tests/unit/customer-emails.test.ts tests/unit/email-delivery-security.test.ts` — 4 files, 103 tests PASSED.
- `RUN_NOTIFICATION_EMULATOR_TESTS=1 FIRESTORE_EMULATOR_HOST=127.0.0.1:18207 GCLOUD_PROJECT=demo-satsunicgo npx vitest run --config /private/tmp/notification-integration.config.mjs` — 1 actual Firestore test PASSED. Disposable random-owner records were cleaned in finally. Existing server/data preserved. Initial sandbox attempt timed out; read-only outside-sandbox probe returned 200 and the test passed outside sandbox. No emulator health failure remains.
- Browser fixture on existing :5207 — actual PurchaseCheckout/Profile/AccountRail, actual client preference hook, Firebase/provider I/O replaced. Pointer + Space toggles, independent save/opt-out, missing-number validation and 390px wrapping checked. This does not certify deployed Functions or real provider delivery.
- Product content review PASSED for local preparation: PRODUCT-CONTENT-REVIEW-IMPLEMENTATION.md and source-located inventory.
- Architecture/API/security/privacy/concurrency/observability reviewed: additive server-only collections, expected-version/idempotency operations, scoped token generations, hash-only token storage, auth/App Check preserved, no dependency or financial-core changes by this task. SMTP/unknown handling and state-based audit visibility documented in INTEGRATION.md.
- Database migration: no legacy migration; new records only after explicit choices. Real transaction test passed. Production retention/export/deletion/index/TTL review remains a release precondition.
- SEO/GEO: NOT_APPLICABLE to authenticated checkout/profile controls; design fixture is noindex. Motion: NOT_APPLICABLE, no animation added. Full application/release build and real assistive-technology session: NOT_RUN, not required for local source preparation; authenticated end-to-end callable/browser acceptance remains NOT_VERIFIED.

## Final review loop

Cycle 1 found: historical queued confirmations could send on much later activation; legacy marketing consent could bypass the new confirmation requirement in the sender; third-tab aria-controls initially referenced an unmounted panel. Fixes: confirmation/welcome job age limits with expiry test, new current confirmed preference check immediately before email provider I/O with legacy-bypass test, stable hidden notification-panel element. Source checks, targeted tests, browser state checks and typechecks rerun as applicable.

Cycle 2: PASSED for the approved local scope, no known unresolved critical/high issue within these checks. All seven required dimensions reviewed; product-language review current. External provider and production readiness remain NOT_READY. Runtime `ai-agent-kit` CLI is unavailable on this host; no runtime receipt is claimed. Evidence and criteria/review ledgers are saved here; report rendered directly from those recorded results.

## Compatibility and operational boundaries

Checkout commit/payment amounts, allocations, completion/recovery semantics and the in-app notification feed are preserved. Existing profile name-save payload preserves loaded legacy consent. Optional order updates now fail closed without a current confirmed preference. Financial, invoice and action-required email policies remain unchanged. New code never activates provider capability or reads a secret during these checks. Unknown delivery is terminal pending operator reconciliation. INTEGRATION.md covers provider/configuration follow-up, additive collection privacy, cutover and rollback.

Git worktree is dirty with extensive concurrent unrelated WIP; no commit, merge, PR or deployment was created. Source manifest identifies shared files containing concurrent work; this report does not attribute their entire Git diff to this task. New task-owned production files: packages/domain/notification-preferences.ts; functions/src/notification-{preferences,preferences-service,token-service,order-policy}.ts; functions/src/subscription-{content,delivery-service,email}.ts; src/features/notifications/{NotificationPreferences.tsx,use-notification-preferences.ts,subscription-state.ts,subscription-preferences.css}. Minimal call-site integrations: existing Profile, purchase-checkout, index, customer-email-job and email worker. Additional files are task tests, preview generator/generated design fixture and review evidence.

Production readiness: NOT_READY / PREPARED_NOT_DEPLOYED. Required follow-up: choose SMS provider and wire order-SMS dispatcher/worker; approve external email release/config and cutover; verify full authenticated callable/browser flow with rebuilt Functions runtime; retention/account-data handling; provider acceptance and actual inbox/handset delivery. No production data, credentials, paid provisioning, restart or reseed was performed.

Token usage: Unavailable. Actual billed cost: Unavailable. API-equivalent estimated cost: Unavailable. Memory candidates: None.

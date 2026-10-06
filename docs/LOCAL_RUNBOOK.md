# Local operation and external gates

## Start and checks

`npm ci`, `npm run dev`, then http://127.0.0.1:5173. Functions target Node 22. Node 22.23.3 has passed compilation and unit tests; run the complete suite using Node 22. Firebase CLI is pinned to 15.32.1. The emulator runner locates an installed JDK 21+; this host uses Homebrew JDK 24. No global runtime replacement is required.

Commands: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run test:rules`, `npm run test:http`, `npm run test:restore`. Rules/direct-handler tests use fixture auth. HTTP tests use real emulator-issued ID tokens but cannot prove Google signatures, real OAuth, App Check or MFA. Every emulator runner forces `demo-satsunicgo` and fixed isolated ports. Do not change that target to a real project.

`test:restore` exports Firestore and Storage fixture data, stops the emulators, imports into a fresh emulator process and verifies both stores. Functions, schedules and provider effects are not started. Backups remain under a printed temporary directory. This is isolated fixture evidence, not a production backup, retention or disaster-recovery certification.

## Firebase and auth

Authorized WEB app `SatsunicGo` now exists in `satsunicgo`, app ID `1:278913913091:web:e40355cd8ad5abe00f9936`. Its public SDK config is in ignored `.env.local`; do not print or commit it. The exact registration authorization and receipt are in `docs/approvals/SATSUNICGO-WEB-APP-001.md`. Existing API keys/secrets were not read or changed beyond obtaining that browser SDK configuration.

Google provider/origins/domains, Identity Platform upgrade, TOTP support, App Check, Storage setup and deployed callable functions remain unverified. Registration does not enable them. Google popup/redirect fallback, One Tap integration and TOTP enrollment/challenge UI exist in source. No real interactive login/MFA test occurred. Finance/access/grants require recent MFA outside emulators. Browser login never grants staff roles; first OWNER needs a separately authorized verified bootstrap.

## Commercial and provider configuration

Owner must approve rates, terms/effective periods, membership prices/benefits and public policies before real trade. Quote commands reject unapproved/expired pricing. Do not publish fixture rates. Membership funds are separate from order funds.

payOS needs approved beneficiary and return-origin settings plus three Secret Manager credentials. A browser return cannot mark paid. SDK signature verification precedes webhook allocation; allocation tests are fixtures. Unknown payment-link creates are not blindly repeated: authenticated provider readback must match amount/order code before recovering the link identifier. Real provider signatures, reconciliation and merchant account are NOT_TESTED.

Genkit/Gemini require approved model/settings and IAM. Application quotas, timeouts, output/tool limits and current order ownership are implemented. Tools can retrieve published content, read authorized context and prepare a reviewed request draft. They cannot purchase, verify money, refund or grant roles. AI stays disabled by default. Runtime audit contains unresolved Genkit/OpenTelemetry advisories; do not certify or enable the production AI path until these are resolved or reviewed through the required release process.

Email is queued only with enabled configuration. Recipients are Firebase Auth identities. Marketing jobs require current opt-in; unknown SMTP outcomes and abandoned sends are marked unknown for reconciliation, not blindly resent. Real SMTP delivery is NOT_TESTED. Campaigns store captions, editorial approval, planned dates and UTM links; copying a caption is not automatic posting. Social posting is disabled.

## Public build and release

`npm run build` produces client assets, a readable public overview in the SPA entry and `functions/generated/public-assets.json` from the Vite manifest and Hosting CSP. Published product/post and policy HTML includes readable content, escaped metadata and that same client entry. The generated manifest must match deployed Hosting assets; do not hand-edit it or perform a Hosting-only release against a mismatched Functions manifest.

Staff features use dynamic chunks; the main Firebase-containing chunk remains large. Current release021 native demo checks cover responsive keyboard/reduced-motion, actual200% zoom and print pagination. Actual assistive technology, full-product parity and production providers remain NOT_RUN. See reviews/release021/READINESS.md; historical browser restriction is not current acceptance evidence.

No deployment, push, IAM/billing change, secret setup, real money/purchase/refund, external email or social posting occurred. Only the approved Web app registration changed cloud state. Before launch complete all matrix details, the 12 acceptance scenarios, current rendered UI/content review, live provider checks, production backups/restore/retention, monitoring, rollout/rollback and a passing mandatory final review. Production readiness remains NOT_READY.

UI-002 cache: public catalog snapshots are shared briefly in memory and revalidated, with stale/offline labels; no private data cache was added. Local Hosting config revalidates HTML and long-caches generated hashed assets. These header settings are not deployed. Current slice evidence: reviews/UI-002-TASK_REPORT.md.

## E2E-005 isolated demo (current entry point)

Run `npm run typecheck`, then `npm run dev:demo`. Open http://127.0.0.1:5173/account and use **Tài khoản thử nghiệm** to choose a fixture role. This starts Auth9198, Firestore8181, Functions5101 and Storage9298 on loopback, seeds deterministic e2e005 data and overrides browser config to exact `demo-satsunicgo`. AI, Google One Tap and external email stay disabled in this environment. It does not reuse the production browser project. Historical E2E005 used host Node25. Current release021 runs Node22 on dedicated Auth9197/Firestore8187/Functions5107/Storage9297 and UI5187, separate from shared services; never restart or reseed a shared emulator.

Fixture roles: owner, manager, buyer, warehouse, finance, support, editor, customer-a, customer-b, revoked, locked. Identities are synthetic `e2e005-<role>`; the UI supplies the demo-only password. They never authorize production access. CustomerA has multiple stage orders, a ticket, a membership and an overdue follow-up; CustomerB has an upcoming follow-up. CRM: `/staff/customers`, `/staff/follow-ups`, and linked customer detail. Operations: `/staff/orders`, `/staff/returns`, `/staff/refunds`, `/staff/activity`. Browser can upload bounded private PNG/JPEG/WebP to an existing order; no public Storage download token is created. Staff permissions determine visible categories, bank receipts exclude warehouse/buyer/support. Up to20 images/order,2MB each; failed pending uploads retain their slot and operation ID for retry, require operator review if abandoned.

Seed/check/reset/backfill require explicit environment values:

```sh
GCLOUD_PROJECT=demo-satsunicgo FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9198 FIRESTORE_EMULATOR_HOST=127.0.0.1:8181 npm run demo:check
```

`demo:seed` creates only missing fixture documents. `demo:reset` removes only fixtureNamespace=e2e005 parent documents and the known synthetic Auth identities; command-created records and nested histories remain. It is not a database-wide reset. Stop demo before launching `test:rules`, `test:http` or `test:restore` because those runners use the same ports; tests are isolated fixture evidence, not production validation. For non-destructive direct tests against a running demo, run only `tests/rules/server.test.ts` and `tests/rules/order-media.test.ts`; Storage tests require FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9298. Never run Rules cleanup against a demo someone is using.

Name backfill: `node scripts/seed-demo.mjs backfill` reports a bounded dry-run, `backfill-apply` updates at most100 server-owned normalized names. Set `DEMO_BACKFILL_AFTER` to the reported cursor to resume; only exact demo hosts are accepted. Production migration is not authorized.

The earlier browser-restriction paragraph describes historical evidence. Current E2E-005 browser checks ran at320/390/768/1440 and screenshots live in docs/reviews/e2e005. Full12 master browser scenarios, live OAuth/MFA, AppCheck, provider callbacks, commercial setup and production indexing are separate gates and remain uncertified. Additional Google setup evidence is owned by the parallel auth session; consult its current report instead of the historical paragraph above.

## Release021 artifact isolation

Vite development watcher ignores output and playwright-report so recording traces/PDF/screenshots cannot reload the tested application. Current35-case browser configuration requires exact demo loopback5187 and matching owned emulator ports; no credentials fallback. Runtime audit13moderate/0high/0critical and residual Baggage/override diagnostic are recorded in SECURITY_022_RESIDUAL.md. Never use local fixture success as permission to enable production AI/payment/email.

## Current hardening evidence

Latest local hardening023:178unit/71integration/38native browser PASS with zero skips; source freeze coordinated by four specialist chats. See `reviews/release023/READINESS.md` and `SANITY_CASES.md`. Production/provider/actualAT/load gates remain unverified. Historical release021 instructions/evidence are preserved; latest owned browser artifact namespace is SATSUNICGO_SANITY_RELEASE=release023. Never reset shared emulators.

## CRM hardening 024

Latest evidence: 178 unit / 100 integration / 45 broad browser cases passed, then 4 affected UI cases passed after the final caption-color correction. Artifacts use SATSUNICGO_SANITY_RELEASE=release024. See `reviews/release024/READINESS.md`; this is local demo evidence, not production acceptance. Earlier 021/023 results remain historical. Keep shared services/data intact and run tests serially on a frozen candidate.

## Hardening025 current candidate

Current194unit/133integration/51complete native E2E PASS, zero skips/retries; final compile/lint/build and current alltest lint exit0. Namespace SATSUNICGO_SANITY_RELEASE=release025. Full receipt browser-final51-complete.json; details reviews/release025/COMPLETION_REPORT.md and TEST_CASES.md. Same original45s/default budgets retained. Owned8187 demo runtime showed cumulative degradation; both latest-data-preserving recoveries/canaries documented in RUNTIME_RECOVERY.md. Never reset shared services. ProductionNOT_READY and aggregate reviewBLOCKED on real acceptance gaps.

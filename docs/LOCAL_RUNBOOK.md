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

Staff features use dynamic chunks; the main Firebase-containing chunk remains large. Real responsive, keyboard, accessibility, reduced-motion and HunpeoLabs parity evidence is BLOCKED by the browser URL-security restriction. Do not use another automation surface to bypass that restriction.

No deployment, push, IAM/billing change, secret setup, real money/purchase/refund, external email or social posting occurred. Only the approved Web app registration changed cloud state. Before launch complete all matrix details, the 12 acceptance scenarios, current rendered UI/content review, live provider checks, production backups/restore/retention, monitoring, rollout/rollback and a passing mandatory final review. Production readiness remains NOT_READY.

UI-002 cache: public catalog snapshots are shared briefly in memory and revalidated, with stale/offline labels; no private data cache was added. Local Hosting config revalidates HTML and long-caches generated hashed assets. These header settings are not deployed. Current slice evidence: reviews/UI-002-TASK_REPORT.md.

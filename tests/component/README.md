# Guest tracking adverse QA

Tests mount the real React Ask component, public card, parser and abort reader. SDK, auth, commerce, analytics and image dependencies are controlled doubles; they never use real orders. No production test hooks or application dependencies are added.

Install test tools outside the app (scripts disabled):

```sh
npm install --prefix /private/tmp/satsunicgo-guest-adverse-tools --ignore-scripts --no-audit --no-fund happy-dom@20.8.4 axe-core@4.13.0
npx vitest run --config tests/component/guest-adverse.config.mjs
```

Override `SATSUNICGO_QA_TOOLS` when using another directory. Node25.9.0, Happy DOM20.8.4 and axe4.13.0 used for this run. The 15000ms native deadline test takes about15seconds. Other deadlines and response order are controlled explicitly. React dependencies come from the repository.

Optional browser fixture, using the existing shared5207 server only:

```sh
node tests/component/build-guest-harness.mjs
```

Open `http://127.0.0.1:5207/test-results/guest-adverse/tests/component/guest-harness.html`. Choose SDK scenario before opening Ask. `offline` rejects as Firebase unavailable; `timeout` hangs and exercises the real15s deadline; `auth-ABA` emits synthetic auth transitions while pending; `delayed` supports repeated Enter submissions. Real Ask/GuestOrderTracking render with normal styles. axe scans the modal and displays evidence in fixture output. Reset fixture to discard synthetic state. This is SDK fault injection, not physical network disconnection or real Firebase sign-in.

Build outputs remain ignored in `test-results/`. The application Vite entry does not import this harness; QA SDK, canaries and axe are absent from the application build. Do not deploy this fixture. No additional server, shared-emulator restart or reset is required.

Backend security regression uses a unique disposable demo project on shared Firestore18207 and cleans only that project:

```sh
GCLOUD_PROJECT=demo-satsunicgo FUNCTIONS_EMULATOR=true FIRESTORE_EMULATOR_HOST=127.0.0.1:18207 npx vitest run --config vitest.rules.config.ts tests/rules/guest-order-tracking.test.ts
```

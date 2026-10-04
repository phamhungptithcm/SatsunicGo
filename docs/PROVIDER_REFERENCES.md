# Provider references

## Current implementation verification (2026-10-04)

- [Firebase TOTP MFA](https://firebase.google.com/docs/auth/web/totp-mfa): requires Firebase Authentication with Identity Platform and enabled TOTP; the app does not enable billing or change provider configuration.
- [Google Identity JavaScript API](https://developers.google.com/identity/gsi/web/reference/js-reference): One Tap uses the official script, explicit credential exchange, cancellation and persistent Firebase popup/redirect fallback. The deprecated `use_fedcm_for_prompt` option is omitted.
- [Firebase Google sign-in](https://firebase.google.com/docs/auth/web/google-signin): ID credentials are exchanged through Firebase SDK; frontend sign-in alone is not current staff authorization.
- [CLI 14.27 emulator runtime source](https://github.com/firebase/firebase-tools/blob/v14.27.0/src/emulator/functionsEmulatorRuntime.ts): avoids removed Functions v7 config calls. Workspace now pins CLI 15.32.1 and checks Java 21+ for the dedicated demo emulator runner.

CI action release refs were checked against the official [checkout v7.0.1](https://github.com/actions/checkout/releases/tag/v7.0.1), [setup-node v7.0.0](https://github.com/actions/setup-node/releases/tag/v7.0.0) and [setup-java v6.0.1](https://github.com/actions/setup-java/releases/tag/v6.0.1) release pages, then their full tag SHAs were verified using read-only `git ls-remote`. The local workflow pins those SHAs, uses Node 22/Java 21, read-only repository permission, no persistent checkout credential, demo emulators and a fail-closed runtime audit. No GitHub workflow run, push or release was performed. Known high advisories currently prevent a green audit gate.

UI-002 cache policy checked 2026-10-04: [Firebase Hosting cache behavior](https://firebase.google.com/docs/hosting/manage-cache), [Hosting header configuration](https://firebase.google.com/docs/hosting/full-config#headers). Local config revalidates app HTML and long-caches content-hashed assets; deployment/header readback remains NOT_RUN. Private/dynamic responses keep their server cache policy.

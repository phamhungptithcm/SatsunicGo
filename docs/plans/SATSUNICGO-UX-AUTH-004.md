# SATSUNICGO-UX-AUTH-004 v1 — navigation, footer and Google One Tap

## Evidence and authorization boundary

Current user requests compact Satsunic UI inspired by HunpeoLabs, mobile hamburger and animation, no navbar login button or beta/test/local labels, functioning One Tap for local and production, required functions/data. Original SATSUNICGO-001 approval covers local stages A–E; first release authorization covers isolated static Hosting beta only. Enabling live Firebase changes that release scope. No approval to invent commercial data, bootstrap privileged identities, enable billing or bypass blocked public push exists.

Repository Intelligence Gate: DEGRADED; both available indexes are stale. Bounded source evidence: SiteChrome.tsx, App.tsx, OneTap.tsx, firebase.ts, Content.tsx, external setup/readiness docs. Reference evidence: current HunpeoLabs components/site-header.tsx and lib/blog/one-tap-controller.ts. React19/TypeScript/Vite/Firebase12; existing unit, compiler, lint and emulator tooling. Preserve unrelated agent setup and managed policies.

## Findings

Navbar currently lacks hamburger; footer has four wide columns. Production build deliberately disables Firebase clients, so One Tap cannot start. OneTap silently swallows script failures and references the fallback login button in credential errors. HunpeoLabs uses accessible mobile menu and guarded One Tap lifecycle/FedCM. One Tap may be suppressed by browser/account preferences; removing navbar login must not remove all recovery paths. Products/posts currently have no live data because services are unavailable. Prior preflight returned403 on Auth/Firestore/Functions admin reads, billing false and no Storage buckets; refresh before making provider changes.

## Exact implementation plan

1. src/app/SiteChrome.tsx, src/styles/global.css: fixed compact navigation with active link; mobile hamburger, aria-expanded/controls, closed menu hidden from keyboard, Escape/route-change close and focus recovery. Animate transform/opacity; reduced-motion support. Compact footer with brand and essential real policy/support links; clear space above Ask composer.
2. src/app/App.tsx and features/content/Content.tsx: remove environment badges and labels. Keep neutral, accurate unavailable states until live services work. Never portray empty fixture content as actual available products.
3. src/features/auth/OneTap.tsx: align guarded SDK lifecycle with reference: deduplicate loading, verify identity after script load, credential-exchange concurrency guard, disposal cleanup, success prompt cancellation, FedCM settings, truthful retry/MFA errors. No navbar login button. Retain deliberate account-page authentication recovery for browsers that suppress One Tap; no automatic repeated prompts or auto-consent.
4. src/shared/firebase.ts and build scripts: separate public preview presentation from services readiness. Remove client lock only from the reviewed integrated release after actual Firebase Auth readback and login verification; preserve transaction/AppCheck/authorization protections. Inspect only presence/metadata of ignored public SDK settings, never print credentials.
5. Firebase configuration: verify existing Google provider/OAuth web client, Firebase authorized domains, exact local origin http://localhost:5173 and http://127.0.0.1:5173, production https://satsunicgo.web.app and https://satsunicgo.firebaseapp.com. Configure only verified matching project/client. If provider/origin changes create security-sensitive access, obtain specific action-time authority. User may need to complete console steps when permissions/API access unavailable. Do not enable billing or generate secrets.
6. Required data/functions: use REQUIREMENTS_MATRIX.md to trace source gaps. Add meaningful local fixtures only to tests/emulators, separate from production. Real catalog, fees, membership/refund terms, contact/business identity and privileged owner require operator-supplied/verified data. No invented commercial promises or production test seeding. Functions/Storage deployment remains blocked until billing, dependencies, provider and acceptance gates are satisfied.
7. Tests: menu keyboard/route lifecycle, One Tap script timeout/retry/duplicate credential/disposal/MFA; compiler/lint/unit and affected emulators. Production and local browser evidence only on permitted targets; mobile viewport and reduced motion. A successful build never proves login or animation smoothness.
8. docs/reviews and docs/releases: inventory changed strings/states, all eight product principles, current review cycles, exact candidate and provider readback, task report and rollback. Deploy integrated release only after approved scope and readiness checks. Public Git push remains pending explicit payload disclosure approval after automatic-review rejection.

## Risk and trade-offs

Medium UI and authentication-lifecycle risk; high live provider/access/data-integrity risk. Prefer shared existing components; no new dependency or schema needed for UI. Static preview remains truthful while live blockers are fixed. Full product acceptance must stay NOT_READY if any required provider or review evidence is missing. Exact animation parity requires rendered timing checks, not source similarity.

## Approval requested

Approve v1 for the specified local UI/auth implementation and verification. This approval does not authorize billing, secrets, privileged bootstrap, real payments, invented production data, or public Git disclosure. Live provider access changes and integrated deployment will be handled using verified specific authority and evidence.

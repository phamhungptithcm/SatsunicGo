# Current shared frontend integration review

Status: bounded **SOURCE REVIEW**, not a release/production QA pass. Intelligence: **DEGRADED**. Root owns the final source freeze, whole-repository compiler/lint/build/tests, production verification and Git operations. This report reads the shared checkout at HEAD `53d59bd88fa7da9d1243692336ecd09b6540ea31`, including untracked implementation files; it does not substitute the historical Ask candidate for current source.

Consumed brief: `INTELLIGENCE-BRIEF.md`, SHA-256 `59149a33cc2d13aa8d7e3263bed316aa60f711551775b7fbcfd6ad69bd8205f9`. Applied `.ai/skills-src/final-implementation-review/SKILL.md` as a scoped source checklist. Initial review was read-only; root subsequently assigned the narrow FE-REL-01 correction under approved PAYMENT-UPFRONT v3 review/fix scope. The concrete plan was saved before editing the two financial callers, additive domain helpers and owned unit file. No dependency, runtime, Git, provider or design-preview changes by this reviewer. Ask r3 remains a separate design proposal.

## Findings and production gaps

### FE-REL-01 — malformed financial acknowledgements retire recovery too early

**MEDIUM; FIXED in the bounded approved delta, real-component failure injection NOT_RUN.** The original shared checkout at SHA `9b6fe9fa669f9d73ce793a419053a6a10debf5a2b9d84f003cec6cda60272898`, `:317–326`, accepted a generic TypeScript cast `{ id: string }`, removed the persisted exact command and cleared `pending.current`, then read `result.id`. A fulfilled transport response `{}` consequently retired the pending UUID and navigated to `/checkout/payment/undefined`. A fulfilled `null` retired the identity before throwing into unknown-result copy. A different checkout ID was also accepted. These were admission defects even though the server continued to own money and customer authorization.

The original adjustment at SHA `108f1cf66d64336fd54afdafecd2b5bc2e31bd2e84fbca38bdf4cde5fc41216b`, `:69–74`, similarly ignored the response, removed its operation and marked the update saved on any fulfilled payload. The backend contract currently returns `{ id: order.id, version: order.version + 1 }` (`functions/src/purchase-adjustment.ts:153–170`). Current Ask, Profile, Membership and cart handlers already demonstrate runtime response admission before retiring recovery.

Implemented under `ACKNOWLEDGEMENT-DELTA-PLAN.md`: parse the existing returned shape and bind checkout ID to the submitted `previewId`, or sourcing order ID/version to the submitted envelope, before retiring its recovery identity. The server's initial and balance ID relationship was verified first. Invalid/mismatched acknowledgements preserve the exact UUID; adjustment reuses its existing pending copy rather than showing Zod/internal errors. No backend contract or replacement-operation change. The 45 new guard cases plus 12 existing purchase cases passed, as did scoped lint and frontend type checking. Whole-source independent review and component cases for unknown replay/held owner change remain root-owned.

### FE-REL-02 — the new purchase flow is deliberately unavailable for live payment

**Production prerequisite, not a missing export or an unsafe demo bypass.** `/checkout` and `/checkout/payment/:id` are mounted in `src/app/App.tsx:429–430`; the Cart continuation now points to them (`src/features/cart/Cart.tsx:374–392`). `purchaseCheckout` commit rejects non-demo environments with `failed-precondition` before creating a checkout or updating the cart (`functions/src/purchase-checkout.ts:375–391`). `purchaseBalanceCheckout` has the same barrier at `:887–892`.

The demo predicate requires `FUNCTIONS_EMULATOR=true`, matching `demo-satsunicgo` project identities, and the exact local Firestore host `127.0.0.1/localhost:18207` (`:71–88`). `purchaseDemoPayment` is exported conditionally for the emulator, and its own handler also checks that predicate. Preserve these controls. Current source cannot complete a live grouped purchase until a separately reviewed live payment integration and its configuration/readback exist. An owner availability decision is needed before describing this public flow as production-ready; enabling the demo policy is not a remedy.

### FE-REL-03 — grouped purchases lack the existing analytics attribution hook

**MEDIUM reporting/integration gap; source-confirmed absence, runtime coverage NOT_RUN.** Existing `linkAnalyticsOrder` calls occur in Ask Commerce (`:610`, `:810`) and legacy product Checkout (`:192`). No equivalent call/session attribution occurs in new `purchase-checkout`, `purchase-payment`, `purchase-completion`, RequestForm or the purchase-checkout backend. The grouped checkout's line/order IDs are available to the completion view, but none are connected to a recorded analytics session.

`analyticsLinkOrder` creates `analyticsAttributions` only after session/owner/time-window validation (`functions/src/analytics-ingest.ts:289–343`). Therefore the new flow can contribute canonical payment/order totals through backend analytics workers while missing the attributed-session conversion numerator. Also, `packages/domain/analytics.ts:82–98` recognizes `/products/:slug/checkout`, but not the new `/checkout` route. This second absence may be intentional private-route policy; confirm it rather than broadening collection silently.

The reviewed analytics plan defines owned-order session attribution, and the upfront plan's validation includes a single parent conversion. A future fixture should verify one grouped payment containing multiple child orders produces one converted session, preserves order ownership, performs no analytics before consent, and remains successful if analytics is unavailable. Decide an explicitly deferred reporting contract or add reviewed integration; never derive conversion from unlinked paid-order totals. Existing undercoverage wording does not prove this new journey was integrated.

### FE-REL-04 — source exports are present; production promotion still holds critical Ask/payment functions

**Production compatibility gap, not a source missing-export finding.** A read-only literal-name scan found 74 frontend `callService`, `httpsCallable` and analytics transport names, all present in `functions/src/index.ts`. This includes `customerSaveResolve`, analytics/dashboard, `purchaseCheckout`, `purchaseBalanceCheckout`, `purchaseCheckoutSetup`, `purchaseOrderRead`, `purchaseDraftImage`, `purchaseReceipt` and `purchaseSourcingChange`. The scan is bounded to literal names; it is not a deploy-manifest or dynamic-call proof.

`scripts/release/artifact.mjs:139–140` still excludes the seven baseline held exports (`askWorkflow`, `currentAskConversation`, `maintenance`, `createPaymentLink`, `payosWebhook`, `reconcilePayments`, `deliverEmail`) plus `askFeedbackCleanup` from promotion. Root's concurrent artifact-parser changes moved these lines; the hold declaration was reread and remains intact, while the whole parser review/checks remain root-owned. Updated frontend source calling these services cannot be certified against deployed behavior from source export presence alone. Existing deployment presence/version, policy readiness and provider compatibility require root's readback. Do not remove these holds to satisfy a frontend smoke test.

## Boundaries confirmed in current source

- **Account privacy:** `App.tsx:309` keys the entire CartProvider route subtree by auth readiness and UID. Purchase routes and RequestForm also have owner keys. Native Ask account forms are UID-keyed in CustomerWorkspace. The new checkout's retained local address state does not alone establish a cross-account leak because this outer remount is present.
- **Private native saves:** Profile reserves a hashed-owner pointer containing action/UUID/hash/version, not name/address payload, and validates save/resolve results before clearing it. Save/resolve admission checks current owner and epoch. Membership preserves the exact operation/action/payload and validates target/result shape. Profile and Membership remain native saves, separate from generic chat approval. CustomerWorkspace permits reopening the unique pending form while rejecting cross-task/readonly/blocked changes (`:88–105`).
- **Ask consent and stale-state admission:** useActionPreview canonicalizes supported commands, waits through `reviewBarrier`, binds owner/conversation/epoch/version/draft/order, rereads a published orderable catalog product, and consumes consent inside the queued mutation. Commerce checks readiness and the current synchronous version before dispatch. Direct payment also checks shared readiness (`Commerce.tsx:1248–1255`). Pending IDs survive unknown outcomes. No authority removal or r3 layout integration was observed in this slice.
- **Cart/money:** current cart responses are schema/owner admitted before clearing their pending mutation. Custom totals use integer FX and service basis from the server-projected cart; Cart labels them provisional. Backend checkout rereads cart, pricing, terms and recipient; the client does not certify a payment from a button alone. PurchasePayment shows success only from a server `paid` checkout; demo controls are shown only for provider `demo`. The approved acknowledgement correction now admits those two financial responses before retiring recovery.
- **Analytics privacy and interpretation:** collection is opt-in and route-gated; event payloads use a bounded topic taxonomy rather than raw Ask text. Account/consent changes invalidate the queue/session. Dashboard parses its response/range, rejects stale requests and clears private data on auth/permission failure. It discloses provisional/partial/unavailable values and distinguishes verified cash movement from revenue/profit. This is source evidence, not browser consent/AT or deployed retention proof.

## Validation, limits and handoff

Initial review used bounded `rg`, targeted source/plan reads, `git diff --stat/--numstat`, `git rev-parse`, and SHA-256/literal-name inspection. Following the approved narrow correction, Node 22 focused units passed **57/57**, scoped ESLint and frontend `tsc --noEmit` exited 0. Exact commands, logs, the initial type-check failure/fix and final receipts are recorded in `ACKNOWLEDGEMENT-DELTA-PLAN.md`. No build/browser/emulator/provider run by this agent. React 19.3.0, TypeScript 6.0.3, Vite 8.3.2 and Firebase 12.19.0 were read from the current package manifest; root's whole-source checks must confirm final dependency integration and imports. The narrow historical candidate's test counts are not applied here.

Whole-source stability, broad authenticated purchase/analytics acceptance, payment/SMTP/provider integration, production data/configuration, native screen-reader audio and performance are **NOT_VERIFIED / NOT_RUN** in this review. Product Language review of changed UI states and the full eight-principle evidence remain root-owned release gates. Source holds and intentional live-payment rejection mean **production readiness is not established**. This report cannot authorize deployment, financial activation, unrelated fixes or r3 implementation. Memory candidates: None; no memory writes.

## Read receipt (SHA-256)

These are current shared-file read receipts, not root's final release freeze. Re-review changed files if any receipt diverges.

| File | SHA-256 |
| --- | --- |
| `src/app/App.tsx` | `1c4b94cdb805706f923dba00342cb5b1fc45074c61c8f0eefc334ec81a777cf3` |
| `src/features/ask/Ask.tsx` | `5cf41d6ebc3815c3e5648aa1d11ceabc6d6f9a681998a8013cd24fd56ceecd73` |
| `src/features/ask/Commerce.tsx` | `6b5f8e3823d584f281bed59f00c35a32654669dcf5254ca3f77750a9cf5b7c55` |
| `src/features/ask/useActionPreview.ts` | `cbf01fb1209a3211070bc54a3acca0c72b8c9932e3535ad8d1b6ccffc1f151b7` |
| `src/features/ask/CustomerWorkspace.tsx` | `ee1c9ca83558ec940b0ddbecaf6a381657a50020590e46a53586aa53a6a5e4bf` |
| `src/features/profile/Profile.tsx` | `5d93d4936216f879fc5f41e982ca340eec6343f1ca8f937e9307656ece78477b` |
| `src/features/profile/save-recovery.ts` | `fd6cffe03ea3d79b32d02f80e69ed77aa35180a16277d68cde330b8475053099` |
| `src/features/membership/Membership.tsx` | `15a929f4d8cc6429c26f5dc4b2adad2ddb10510e1e752e9a1b25af7771416077` |
| `src/features/membership/command-recovery.ts` | `f07f865bf394447db4dc4796283ba2cf967cd30cc171f31397a3641a2a9c3184` |
| `src/features/cart/Cart.tsx` | `159cd69d42959b4c18f23e497e2bebb169c6aa431c69ab46a4e535e6babc00d2` |
| `src/features/cart/cart-store.tsx` | `c8a3fb8950870caffd2fe51cf6295f6e06e3b2454053792959b7fa9f7d45a77b` |
| `src/features/cart/purchase-checkout.tsx` | `9f419a72aa7e12ef83472741507483ab225369cfffa0cddf67b2a50090893733` |
| `src/features/cart/purchase-payment.tsx` | `f0add7a976da711d1063cddf5dfea3960b892a11804bdc38aaf048754bf9d92b` |
| `src/features/cart/purchase-completion.tsx` | `0be7681d7f4c39af319221a8e2b07d672cf44d8bef7d51db9c24fe9ccf4dd09b` |
| `src/features/orders/purchase-adjustment.tsx` | `1075d076052c9a4320e020471443e6d710d215735ec9cb323184feacec9ceb69` |
| `src/features/requests/RequestForm.tsx` | `61124f73d0c10a9023e6c071b85ad1433bd7a99e9ae08e2a577cc21fa23a10bb` |
| `src/features/crm/Dashboard.tsx` | `ccca78132db14813cebbbaffc760925cda0bfd628df8760d13c87e1378b510ed` |
| `src/shared/analytics.ts` | `79eac596833602e9d437a80d135e6b1b1af83792c7c2197c8f1ebba5ec9b60c3` |
| `src/shared/AnalyticsConsent.tsx` | `a1cb8476a5a693f5334c8e159cc7959a0cfc831e271057e4a56acfd37d5405d4` |
| `src/shared/firebase.ts` | `f536939e0f08bf6f27a42efa4d194a65b30b9d370f522dec3a8759dd8e9f5371` |
| `packages/domain/analytics.ts` | `f7e70ebe14350a8bc449fdfc7f8ac6f8216a9d78087ee2ad47fddda1e11287fc` |
| `packages/domain/purchase-checkout.ts` | `1144926ab8865ddcde29e871ed81f834809bd302984535860ed341dbd5bd465a` |
| `tests/unit/purchase-acknowledgement.test.ts` | `f784a3dea6944e09bd02235e65bebac1336e63923406db371236567af8d0bc3a` |
| `functions/src/index.ts` | `60f0e3b406c1046181efa638163c309a01ad9330b4e22748169217f4bd46b167` |
| `functions/src/purchase-checkout.ts` | `00edf99aba78f2723d30bae8f2b5ddfa5635a63f6185201d7147869be62db1cc` |
| `functions/src/purchase-adjustment.ts` | `482dd3ec049bbc49857ab1cc5daf13c6f5d609e971f57e3ccee7f9367d2f61ef` |
| `functions/src/analytics-ingest.ts` | `859c0ec93ecec836ed5c15ce3c04ad6a99afea7c3c0933d6b9fc9d6959dec318` |
| `functions/src/dashboard-analytics.ts` | `999bc115d30834c9f53afe4cc45fc1eea18c72d32b32a3974465172dfb4c92ce` |
| `scripts/release/artifact.mjs` | `64d0618bdebda3c4ee2ff8405016ce7a0ecb1a597692595de35a7d2fb478379d` |
| `package.json` | `f419ec7c6e50a7a50d8d81f04a398f391f63d35d46e41ba7c7e2daa36ef82610` |

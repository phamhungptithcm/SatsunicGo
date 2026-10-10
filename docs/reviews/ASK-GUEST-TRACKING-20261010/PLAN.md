# Ask guest tracking — reviewed design v1

Status: PLAN_READY / AWAITING_REVIEWED_PLAN_APPROVAL. No application/API/rules/behavior-changing test edits in this design pass. User request authorizes desired feature; repository workflow requires review of this concrete public-access plan before implementation. Security risk HIGH: new public object-property disclosure. No deployment authorized.

## Repository intelligence and verified context

Gate DEGRADED (stale indexes); CodeGraph queried first, CocoIndex second. CodeGraph includes output snapshots; source verified against actual functions/src and src paths. Shared context repository-map/build-test-commands remain placeholders. Preserve current dirty concurrent worktree and shared5207/emulators; no restart/reseed.

Observed: AccountTracking and Ask call owner-only customerOrderTracking (verified Google, matching owner, user/staff lock); shared renderer exposes routes/history/parcels and owner link. shippingRatesPublic is anonymous callable with production App Check. invoiceShare provides existing transaction quota/no-store/no-referrer pattern, not a proven general abuse service. Order creation uses randomUUID by default (functions/src/index.ts, purchase-checkout.ts) but command schema also accepts arbitrary alphanumeric/hyphen IDs: entropy cannot be assumed from syntax alone. Ask has standalone and mixed-read tracking branches, UID-scoped followups, conversation serialization and analytics before tracking dispatch. Both branches and storage boundaries require review.

Technology/profiles: strict TypeScript, React web, Firebase Functions v2/Firestore, Zod, Vitest/ESLint; universal, typescript-javascript, web-app, api, database, concurrency, product-content. Security-review skill applied. No new dependencies.

## Public-access policy and code choice

Anyone possessing an eligible full tracking code can see its coarse progress and staff ETA without login. This intentionally reveals that an eligible shipment exists; it cannot promise owner identity verification. Never expose the rich owner projection, even by hiding fields with CSS.

Recommended safe eligibility: existing full server-generated random UUID order codes only after source provenance is verified; arbitrary/custom/sequential codes must not become public merely because they exist. If legacy codes lack verified entropy, introduce a random128-bit-or-stronger guest alias bound server-side to order, with revoke/rotate support; display it to the authenticated owner as “Mã tra cứu”. Same one-code/no-OTP guest interaction. No blanket legacy backfill. Issuance/lifecycle requires explicit approved scope; this plan includes owner-only alias issuance if provenance cannot be guaranteed, not public order-id fallback. Hash aliases at rest; never put them into URLs/analytics/logs or public collections. Full UUID schema alone is not proof of server issuance. Rollout only enables code classes whose issuance is verified; unsupported codes get generic unavailable response and sign-in option.

Decision needed with plan approval: accept the safe code eligibility/legacy-alias treatment. Reject alternative “all arbitrary IDs publicly readable” because numeric/predictable IDs permit enumeration. Rate limiting/App Check reduce abuse, do not make guessable identifiers secret or stop all distributed attackers.

## UX and backend flow

1. Guest asks “Đơn <mã> đang tới đâu?”; exact single-code parser, no image/tool/LLM dispatch. Multiple codes: ask for one, no batch. Missing code: “Nhập mã tra cứu để xem tiến độ và thời gian giao dự kiến.”
2. Separate publicOrderTracking callable: production App Check → strict bounded input → trusted-server client quota admission → eligible code lookup → read locked/revoked/source state → compute validated public projection → strict output allowlist. Owner callable and Firestore client rules unchanged. Signed-in nonowner may use exactly this public projection, never receive private owner data by fallback.
3. Response only publicStatus (received/preparing/shipping/delivered/cancelled/temporarily_unavailable), updatedAt nullable (actual relevant recorded update, not observedAt), observedAt, eta nullable staff window with recordedAt. No orderId/ownerId/customer name/phone/email/address/items/money/payment stage/parcel IDs/carrier/tracking/routes/location/free-text reason/hold reason/audit actors/URLs/private metadata. Progress timeline derives normalized known stages only; no invented dates or percentage. Hold uses neutral unavailable state without reason.
4. Public UI component shares visual primitives/approved blue-white styling, never accepts CustomerOrderTracking. Show current normalized milestone, next coarse step and date/time if evidenced. No order-detail deep link. “Thời gian giao dự kiến chưa được xác nhận.” when unknown; range and timezone/“Ước tính của nhân viên, có thể thay đổi.” when valid. Failed/returned/held/expired/incomplete or stale-canonical data suppresses ETA; terminal state has no future promise. Quantity-based multi-parcel aggregate semantics retained. No route or individual-parcel cards.
5. Follow-up “Khi nào giao?” uses session-memory selected public code only; lookup again, no invented estimate. New code, clear chat, logout/login/account switch, abort/unmount invalidate generation and clear selection. No public code/result persisted into localStorage, restored conversations or third-party prompts. Explicit tracking interception occurs before analytics/conversation persistence, including mixed questions; only non-identifying metrics allowed. Mask code in displayed submitted question after successful parse where practical; user still controls text before submission.
6. Unknown/revoked/unsupported/locked/malformed code → same “Chưa tra cứu được đơn này. Kiểm tra mã hoặc đăng nhập để xem đơn của bạn.” No “exists but forbidden” distinction. Valid lookup intentionally differs by returning status; no false claim of eliminating all timing/enumeration signals. Rate limit → “Bạn đang tra cứu quá nhanh. Thử lại sau một phút.” Network/service unavailable → separate retryable message without confirming code existence.

## Abuse, privacy and lifecycle

- Provisional quota30 attempts/minute per trusted network identity, success/failure/malformed all charged. Transactional shared counter across instances; limiter errors fail closed. No quota keyed only by target code (attacker must not block victim globally). No client-supplied UID, session ID or spoofable X-Forwarded-For accepted as authority. Deployment proxy-IP semantics must be verified; missing identity uses conservative shared fallback, never unlimited requests. App Check is anti-abuse, not owner authorization.
- Short-lived pseudonymous quota keys, no raw IP/code/PII logging. Existing invoiceShare hashes IP+minute but hashing is not anonymization; evaluate HMAC deployment configuration before reuse. If protected keyed hashing is required, provision/configure separately with approved deployment, never read secrets in this task. Quota retention must be bounded with TTL or existing cleanup job; expiresAt field alone does not delete data. TTL/cleanup provider readback is a release gate, no autonomous infra change.
- Limits maxInstances2/concurrency8 proposed (consistent public read pattern), input one code<=80chars, no search/list/wildcards/array. Shared max60parcels/50events. Reuse pure aggregate logic, no call to owner callable, no per-parcel N+1 repeat lookups; bounded reads. No global user-result cache; no-store/noindex/no-referrer headers, avoid guest code in navigation and telemetry. These limits are not a hard spend cap or full DDoS guarantee.
- Read-time checks must reject locked owner/staff and revoked eligibility. No anonymous writes to orders, financial state or Firestore public data. Alias creation/rotation (if needed) uses separate authenticated owner command, CAS/idempotency, no automatic invoice/email/notification delivery. Public responses are reconstructed field-by-field, strict schema and canary validation.

## Impact / implementation files

| File/module | Change after approval |
|---|---|
| packages/domain/public-order-tracking.ts (new) | Strict public DTO, coarse status mapping, input/code class policy, pure safe projection; reuse aggregation helper |
| functions/src/public-order-tracking.ts (new) | Separate public callable, quota admission, owner-lock/revocation checks, safe projection, error normalization |
| functions/src/index.ts | Export new callable only; leave owner command/access checks intact |
| functions/src/public-tracking-code.ts (conditional new) | Owner-only issuance/rotation if existing code provenance insufficient; server-only hashed mapping, no unauthenticated issue |
| src/features/ask/GuestOrderTracking.tsx (new) | Minimal public progress/ETA component; existing visual primitives, native disclosure, VI/EN |
| src/features/ask/Ask.tsx | Standalone+mixed guest routing, public followup generations, no private upgrade/fallback, exclude tracking from persistence/analytics |
| src/features/ask/useAskCommerce.ts / actual serializer path | Only targeted suppression if source review finds tracking code persisted; no commerce rewrite |
| existing owner Account/Ask tracking | Regression tests only; no public exposure of CustomerOrderTracking |
| tests/unit/guest-order-tracking*.test.ts; tests/rules/guest-order-tracking*.test.ts | Test plan in TEST-SCENARIOS.md, source transactions and real Firestore rules |
| docs/reviews/ASK-GUEST-TRACKING-20261010 | Current plan/content/security review, hashes, red/green/browser/benchmark evidence, final runtime report |

No schema rename, finance change, broad refactor, new dependency, server restart or provider deployment. New server-private code/quota collections additive; Firestore default-deny remains. Any needed TTL/secret/edge configuration is an explicit deployment dependency. If broader serializer/config/schema changes become necessary, stop for delta-impact approval.

## Validation / release / rollback

After reviewed-plan approval: add meaningful red regressions and happy/negative suites, implement minimal scope, run unit/emulator/rules with unique synthetic projects on existing emulator, root+Functions types/scoped lint/build. Browser logged-out Ask real callable at320/desktop, mixed/followup/auth-switch/retry; inspect network DTO and storage/canary leakage via supported evidence. Bench worst supported data and concurrent quota transactions, do not claim local p95 as production SLA. Product Language Gate includes all eight principles and current in-context VI/EN/loading/unknown/error/partial evidence; final implementation/security/code-quality review cycles until fresh pass.

Release requires actual AppCheck HTTP enforcement, proxy identity and quota cleanup readback, code issuance provenance and deployment candidate verification. No deployment in this task. Rollback public export/routing/eligibility flag; owner-only tracking unchanged, revoke aliases; never undo unrelated WIP.

References checked2026-10-10: https://api-security.owasp.org/editions/2023/en/0xa3-broken-object-property-level-authorization/ (minimal allowlisted output and schema validation); https://firebase.google.com/docs/app-check (AppCheck complements auth, cannot eliminate all abuse).

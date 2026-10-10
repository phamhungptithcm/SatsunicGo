# Production test mode v1

Status: APPROVED — see APPROVAL.json and the human answer “Duyệt v1 và tạo secret trống”. Implementation is in progress; combined release and live acceptance remain separate gates. Human explicitly requests using the production deployment for testing and accepts sandbox. This supersedes the earlier environment preference; it does not certify unfinished provider paths or waive auth, consent, financial integrity or CI.

## Source facts at plan preparation

- Current main608d2e0 contains the full combined local feature candidate plus analytics concurrency and sandbox-parameter discovery fixes. Normal release38009393058 is in progress. That release preserves the previous runtime boundaries; it is not this activation delta.
- SePay uses merchant SP-TEST-HL5339A9 and fixed sandbox endpoints. Only BANK_TRANSFER is implemented as available. CARD/NAPAS are modeled but disabled; their provider support has not been verified.
- Current handlers, settlement and export guards require the exact demo emulator. Signed return URLs are hardcoded to localhost5207. Artifact preflight deliberately strips the five demo/sandbox exports. Removing one check or creating a secret alone cannot deliver hosted sandbox E2E.
- Sandbox settlement already tags some orders, financial evidence and receipts with testMode=true. It still writes collected balances, financial entries, order state, receipt jobs and payment-confirmed outbox events. Those writes would affect real business consumers if the emulator fence were simply removed. This is a verified integration risk, not a claim that sandbox charges real money.
- Metadata read00:31Z: SEPAY_SANDBOX_SECRET_KEY version1 ENABLED; SEPAY_SANDBOX_IPN_SECRET_KEY NOT_FOUND. Secret value correctness is NOT_VERIFIED; no payload read.
- The production Ask path uses ask-pilot; its pricing envelope expired2026-10-08. The legacy paid guard always rejects. Web research and feedback have separate policies. Setting ai=true would not fix those paths.
- Two email workers ship in the combined candidate. Their eligibility still requires validated Resend policy, verified domain and cutover/consent; production settings/email and customerNotifications were absent at00:00Z. Historical domain verification must be read again before activation.
- Existing source holds cover askWorkflow/currentAskConversation, maintenance, PayOS payment creation/webhook/reconciliation and feedback cleanup. SMS has no configured provider. Publish/enable only after the specific implementation and provider checks pass; never display fake availability.

## Proposed behavior

Use the existing production website/domain and project satsunicgo for testing. Keep verified sign-in, owner isolation, staff role/MFA, AppCheck, version checks, idempotency, quotas and consent exactly enforced. Add an explicit server-authoritative production_test mode, immutable per-operation provenance, test-only records and a visible compact Test label. This is an application feature, not FUNCTIONS_EMULATOR=true on production.

1. The server admits new test checkouts through an approved, versioned test policy and records executionMode=production_test, provider=sepay_sandbox, policyVersion and testRunId. The browser cannot invent or change that provenance; initial/balance checkout, replay, proofs, orders, receipts and outbox inherit it. Existing records keep their original mode and provider.
2. Use sandbox inventory/reservation balances for test operations. Read the actual catalog/pricing for realistic display, but never decrement real available stock or write a real revenue/refund/payout entry because of a sandbox proof. Persist test financial evidence separately; do not reinterpret or relabel pre-existing records.
3. Permit SePay sandbox only under the exact satsunicgo production identity, no emulator variables, actual database identity, approved test policy and secure runtime secret bindings. Use the exact approved HTTPS origin https://satsunicgo.web.app for callbacks; other website aliases may be added only after verified ownership and an explicit allowlist. Browser returns cannot settle a payment.
4. Publish the real authenticated sandbox IPN at the deployed Function HTTPS URL. Require the separate dashboard X-Secret-Key, schema/body bounds, persisted invoice/owner/method/amount/merchant binding and authoritative sandbox readback. Keep duplicate, unknown, over/underpayment, cancellation, late payment and VOID handling. Never accept injected adapter results in deployed code.
5. Allow the existing chat/cart/checkout/receipt/CRM flows to show and operate on test records, with a clear Test filter/provenance. Live fulfillment, stock, revenue dashboards, refunds/payouts and vendor actions reject test records unless they implement an explicitly simulated test operation. Audit all consumers before enablement. A test receipt must say it is a test receipt.
6. Email uses real Resend only to explicitly opted-in testing recipients under the existing100attempt/day shared budget. Subscription consent, current identity, unknown fences and forward cutover remain. Existing customer queues are not drained. SMS stays truthfully unavailable until a real provider is configured; there is no fake SMS success.
7. Enable Ask chat commerce exports/settings after their ownership/idempotency/confirmation tests and live AppCheck checks pass. Enable Gemini/web research using a freshly verified pricing/cost envelope within the already authorized50000VND allocation; keep per-attempt reservation, current policy expiry, bounded context/output, source allowlist, PII minimization and no paid fallback. Do not simply advance an expired pricing date.
8. Feedback learning promotes only reviewed knowledge; raw feedback is not instantly trusted training. Test feedback is tagged and excluded from real customer analytics. Retention cleanup may delete only the explicitly approved class/duration; payment/audit evidence is never deleted by enabling maintenance.
9. Enable safe scheduler tasks individually. Split jobs that mix publication/recovery with deletion. PayOS is a different provider from SePay sandbox and is not enabled merely because SePay is accepted. Card/NAPAS activation requires successful provider contract verification, not removing disabled UI.

## File and function implementation scope

| Boundary | Intended files/functions | Change |
| --- | --- | --- |
| Mode/policy and immutable contracts | new functions/src/production-test-policy.ts; packages/domain/purchase-checkout.ts, purchase-sepay.ts; provider-release-gate.ts | exact environment/policy admission, immutable execution provenance, default-deny unknown mode |
| Checkout and attempts | purchase-environment.ts, purchase-checkout.ts initial/balance/capability handlers; payments/sepay-sandbox.ts; purchase-sepay.ts handle/admit/reconcile/worker | production test admission separate from demo guard; fixed HTTPS callbacks; secure bindings; preserve replay semantics |
| Settlement and side effects | purchase-settlement.ts applySettlement/settleSePayEvidence; purchase-adjustment.ts, finance-review.ts, refunds.ts; inventory/reservation helpers discovered from their callers | route test stock/financial effects into test stores; reject mixed/live targets; no production financial datafix |
| Receipts and CRM | purchase-receipts.ts, purchase-pdf.ts; relevant CRM/account/order readers and operational dashboard consumers | maintain provenance, test PDF marker, safe filters and no real fulfillment from sandbox |
| Email and notification consumers | email.ts, subscription-email.ts, customer-email-job.ts, subscription-delivery-service.ts, customer notification projection | reject unintended real-recipient side effects; owner-opt-in live canary only |
| Ask and feedback | ai/ask-workflow.ts, ask-pilot.ts, ask-pilot-answer.ts, research-live.ts/research-budget.ts, feedback lifecycle modules | deploy commerce; verified current budget envelope; tagged test learning; retention scoped to approved policy |
| Jobs and package contract | jobs.ts, index.ts; scripts/release/artifact.mjs, preflight.mjs, verify-production.mjs; relevant release tests | explicit sandbox production-test export contract; safe job split; actual SDK params/endpoints checks; no deletion/CI/security gate relaxation |
| Product UI | checkout/payment/completion/receipt and relevant Ask/CRM components | small Test badge, truthful status; retain compact approved layout; source-bound product content review |
| Infrastructure metadata | Functions secret bindings/version1 and minimal per-service secretAccessor; IPN URL/provider dashboard; exact named secret container if missing | no secret payload via agent, no website DNS change, no broad IAM |

Before each protected subchange, trace exact consumers/callers and update the change-impact record if another business module is needed. Preserve shared5207, WIP, owner MFA harness and active cart E2E work. No new frontend/emulator, no competing pipelines. Integrate owner fixes by source hashes only after handoff.

## Test and acceptance matrix

Run each case against current combined source, then provider/live checks on the deployed immutable artifact. Local/injected cases are never provider acceptance.

Happy cases: listed item; custom purchase request from chat; mixed cart; natural chat confirm/edit/cancel; save/resume checkout; initial BANK_TRANSFER hosted sandbox; verified IPN/readback; CRM test-order inspection; source/price adjustment and test balance checkout; test PDF with image/localization; opted-in owner email; feedback review and approved knowledge retrieval.

Negative/recovery cases: unauthenticated/wrong owner/locked account; missing AppCheck/stale token/recent staff MFA missing; forged executionMode/provider/amount/return URL; wrong or absent secret; forged IPN; malformed/oversize/non-JSON payload; wrong invoice/merchant/currency/method; underpayment/overpayment; duplicate IPN; distinct second transaction; concurrent commit; lost response; provider timeout/429/5xx; abandoned checkout/late success/cancel-success query; VOID; expired lease/restart; original mode replay after policy change; real/test mixed balance target; old genuine order accessed by test flow; test event attempting real stock/revenue/refund/vendor fulfillment; real-recipient email without opt-in; optout after enqueue; unknown send outcome; stale email identity; malicious product webpage/prompt injection; expired/oversized context; source unavailable; budget exhaustion/concurrent last reservation; feedback poisoning/PII/retention boundary.

Performance: maximum30line checkout with bounded Firestore writes; simultaneous same-invoice requests settle once; finite worker leases/backoff; provider timeout10s/response256KiB; bounded model input/output and one network attempt/reservation; no secret/PII/signed-form values in logs; scoped load test using owned test records only.

Release: frontend/backend strict, lint, focused unit/rules/integration, full normal mandatory CI, current root and packaged Functions audit, artifact SDK parameter+endpoint manifest, final review and product content review, immutable artifact/source/revisions/Hosting/IAM/secret-version/scheduler readback. No bypass or direct dirty deploy. Genuine staff MFA remains a separate acceptance fact, not a simulated token.

## Rollout and rollback

Deploy code with test sending/payment activation inactive; read back exact metadata and policy, configure provider IPN, verify authenticated owner sandbox canary, then enable the proven test capability. Activation is per feature so one missing provider does not hold already working website/UI functions. Preserve original attempt mode and financial evidence on every rollback. Disable new test attempts/sending first; reconcile pinned attempts, never erase unknown/paid evidence or downgrade them to demo. Restore the prior verified immutable artifact through the normal release workflow if required.

## Approval boundary and input

This v1 is the concrete material delta required by AGENTS.md plan-existing-system-change workflow. Approval covers the production-test implementation and release contract above, runtime secret bindings and creation of the missing empty SEPAY_SANDBOX_IPN_SECRET_KEY container. The human/provider must set its value securely and configure the matching SePay sandbox dashboard key; never paste it in chat. No real money, production financial corrections, destructive cleanup, security bypass or mass customer email is included. Existing50000VND Ask allocation and100attempt/day Resend limit remain.

Token usage and actual billed cost: Unavailable. Repository Intelligence: DEGRADED; current source/Git/SDK evidence used. Memory candidates: None.

# Production test scenario coverage

Capture: `2026-10-10T02:37:06.318923+00:00` · source commit `fdbbda017a324befce93e6a3fac2ee882c6de795` · original base `b916c75cbb0e686fe20e2e52e31dd1a340b2272e` · revision 3.

**NOT_READY for production integration.** The 53 approved scenarios are mapped to current source and focused checks. They remain partial scenarios: no new-mode provider or live end-to-end PASS is inferred. Original proposals and older receipts are preserved.

Final bounded freeze: **624 inputs**, digest `8fb877f191cb46c858d74d7dba20d0add8fad5ac82e436c8188d95ce09ccbb57`. All hashes match at capture. The freeze excludes generated public assets; final build/artifact bindings are root-owned. Repository Intelligence is **DEGRADED**; this document uses bounded source, exact titles, compiler and recorded test evidence.

## Current local evidence

| Evidence | Result | Scope |
|---|---|---|
| Root final R2 Vitest | 2,789 / 2,789 tests; 180 files PASS | Unit, mocked handlers/concurrency, SSR and synthetic PDF. |
| Root final R2 contracts | 179 PASS | Selected Node release/config/optional-AI contracts; no AI call implied. |
| Frontend/backend strict and lint | PASS | Source/compiler/lint only. |
| Email final revocation | 293 tests / 4 files; 65 email cases; peer PASS | Current consent/config/identity fences; local mocked provider. Counts overlap full suite. |
| Analytics exclusion | 25 tests / 3 files; scoped independent review PASS | Tester and test-order exclusion; unit/model, not real ingestion. |
| Reply provenance | 177 tests / 4 suites; 24 new cases; scoped independent review PASS | Server-pinned reply/outbox/inbox mode/run/version; no wider email eligibility. |
| Notifications | Scoped synthetic browser PASS | Actual component/CSS at desktop and 390px, test/legacy/partial badges, genuine row unchanged. No backend/auth/real read mutation. |
| Retention R2 | 48 focused / 145 release contracts; independent peer PASS | Exact classes, transaction revocation, canonical readiness digest, immutable metadata, three fixed create-only indexes and Scheduler parity. Counts overlap full checks. |
| Source preflight correction | 233 focused PASS; actual preflight PASS | Current helper/index/preflight source semantics. |
| Exact local CI build tuple | Five checks PASS | Public config, frontend/assets/backend build and source preflight; not a remote CI run. |
| Actual offline artifact SDK | 106 endpoints / 360 packaged files / 193 non-dot Hosting paths / 3 secret params PASS | Zero network attempts; local v0.11.0 validation tag is neither reserved nor deployed. |
| Remote normal CI/provider/live | NOT_VERIFIED / NOT_RUN | Local build/package/SDK evidence does not certify deployment. |

The prior 2,698-test local pass remains historical. Its first run passed 2,697 and failed one telemetry HTTP test with sandbox loopback `EPERM`; that failure and the permitted-loopback rerun are retained under `combined-local`. Retention review cycle 1 requested changes; cycle 2 fixed canonical receipt-digest validation, racing-409 ownership and exact endpoint parity. None of these earlier failures was erased.

## Evidence layers

| Layer | Meaning |
|---|---|
| unit | Pure/domain/schema or transport with mocked I/O; no real provider/model. |
| model | Actual handler/controller/service with in-memory/mock Firestore/auth/provider; retries/concurrency are modelled. |
| SSR | React renderToStaticMarkup; no actual layout/focus/keyboard/spoken screen reader. |
| PDF | Synthetic PDF generation/recorded raster inspection; no deployed private download or provider proof. |
| emulator | Rules/Firebase demo tests are only mapped; not executed for current new production mode by this task. |
| provider | External SePay/Resend/Gemini/API acceptance/readback for new v1 remains NOT_RUN. |
| live | Actual current immutable deployed browser/auth/AppCheck/MFA business journey remains NOT_RUN. |
| browser-synthetic | Actual candidate React component/CSS in a browser with owned synthetic read adapters; scoped layout/focus only. No real identity, backend write, provider, genuine native zoom or spoken AT proof. |
| artifact-offline | Actual local immutable packaging and Firebase SDK export discovery with zero network attempts; no deployment, remote CI, effective IAM, secret-value correctness or provider proof. |

## Scenario map

Every row is **PARTIAL_LOCAL_COVERAGE_LIVE_NOT_RUN**. Test IDs resolve to literal titles, current file lines and SHA256 in the JSON registry. Emulator test IDs are source mappings only and remain NOT_RUN for the new mode; they are excluded from passed local layers. Focused suite counts overlap the full suite.

| ID | Scenario | Current evidence layers | Exact test IDs | Remaining acceptance |
|---|---|---|---|---|
| CHAT-01 | Ask tìm sản phẩm có sẵn bằng câu tự nhiên | model, unit | `catalog-language`, `catalog-select`, `catalog-producer` | Current browser conversation, authoritative stock/price rendering and no-write read-only journey. |
| CHAT-02 | Không có hàng sẵn, tìm web và so sánh | model, unit | `web-selection`, `web-sources`, `web-unverified`, `web-draft` | Real Gemini grounding/web fetch, source freshness/review quality, comparison and select→draft browser journey. |
| CHAT-03 | Sửa màu, size, số lượng bằng chat rồi đồng ý | model, unit | `draft-edit`, `catalog-confirm`, `question-consent`, `generic-pin`, `emu-chat`, `reply-pin`, `reply-replay` | End-to-end edit→current-version confirmation→one request under hosted auth/AppCheck; generic source fix supersedes earlier Ask finding. |
| CHAT-04 | Trả lời đồng ý cho nháp đã cũ hoặc đổi account | model, unit | `catalog-stale`, `identity-fence`, `generic-replay`, `emu-recipient`, `reply-forge`, `reply-corrupt` | Browser account-switch/stale confirm and deployed callable ownership/idempotency checks. |
| CHAT-05 | Trang sản phẩm chứa prompt injection/PII | model, unit | `private-input`, `tool-allowlist`, `redaction`, `web-sources` | Real malicious merchant page and citation/PII test through hosted research and model; unit sources do not prove all injections. |
| PAY-01 | Catalog checkout BANK_TRANSFER sandbox từ domain thật | model, unit | `checkout-pinned`, `mode-https`, `sepay-form`, `catalog-producer` | Actual domain sign-in/AppCheck→hosted sandbox merchant form→authentic IPN/readback. |
| PAY-02 | Custom request đã chọn giá nghiên cứu và service fee | model, unit | `web-draft`, `web-selection`, `generic-pin`, `emu-pay` | Staff accepted source-price/service-fee snapshot and custom request total under real hosted flow. |
| PAY-03 | Mixed cart catalog và custom | model | `checkout-pinned`, `settle-once`, `emu-pay` | New-mode mixed catalog/custom browser and hosted settlement; no new test-stock mutation is invented. |
| PAY-04 | Nhân viên duyệt chênh lệch và thanh toán bổ sung thử | model | `balance-pinned`, `simulated-sourcing`, `emu-recipient` | Genuine staff role/recent MFA adjustment→target/version→sandbox supplemental payment. |
| PAY-05 | Không auth/Google chưa verified/AppCheck thiếu | model | `catalog-auth`, `checkout-owner`, `generic-deny` | Deployed missing/invalid AppCheck, unverified/anonymous and stale-token HTTP acceptance. |
| PAY-06 | Sai owner/locked user/role hoặc MFA hết hạn | model | `checkout-owner`, `history-owner`, `emu-recipient`, `reply-current-owner` | Genuine staff MFA freshness/role/lock and cross-account live reads/actions. |
| PAY-07 | Client giả mode test/provider/tổng tiền/callback | model, unit | `checkout-forge`, `mode-https`, `sepay-form` | Hosted forged amount/provider/callback requests and deployed schema readback. |
| PAY-08 | Policy test tắt/hết hạn/project sai/emulator variable trên production | model, unit | `mode-env`, `mode-policy`, `intent-off`, `generic-runtime` | Deployed runtime flags/actual database and policy version/expiry readback; pinned attempts stay immutable. |
| PAY-09 | Key thiếu/binding sai/IPN secret khác dashboard | unit, artifact-offline | `sepay-auth`, `artifact-sepay` | Exact deployed secret version binding/IAM and authentic sandbox dashboard-IPN match; offline SDK parameter discovery is insufficient to validate secret values. |
| PAY-10 | CARD/NAPAS gửi trực tiếp khi chưa hỗ trợ | model, unit | `sepay-methods`, `checkout-forge` | Hosted UI availability and direct CARD/NAPAS negative calls; providers remain unavailable. |
| PAY-11 | Gửi commit/create intent đồng thời cùng operation | model | `checkout-pinned`, `settle-once`, `emu-chat`, `emu-pay` | Actual Firestore concurrency/retry and hosted same-operation intent/commit response binding. |
| PAY-12 | Mất response sau commit hoặc return browser | model | `intent-resume`, `catalog-replay`, `generic-replay`, `emu-resume` | Browser/network interruption after actual commit/return; same checkout/invoice without second attempt. |
| IPN-01 | IPN authentic và sandbox readback khớp | model, unit | `sepay-binding`, `settle-once`, `emu-pay` | Authentic deployed IPN and authoritative real sandbox readback; no injected result acceptance. |
| IPN-02 | GET/non-JSON/body lớn/thiếu header/key sai | unit | `sepay-auth`, `emu-http` | Current deployed GET/non-JSON/oversize/header/auth status and zero valid-evidence writes. |
| IPN-03 | Sai invoice/merchant/order/currency/method | unit | `sepay-binding`, `sepay-second`, `emu-conflict` | New-mode deployed mismatch/review behavior using owned test attempts. |
| IPN-04 | Thiếu tiền/thừa tiền/số thập phân không hợp lệ | model, unit | `sepay-under`, `settle-review`, `emu-under` | Actual under/overpayment and decimal-invalid callbacks/readback without rounding. |
| IPN-05 | Lặp cùng IPN/khác timestamp/đổi payload cùng id | model | `settle-once`, `emu-conflict` | Current mode same-ID exact duplicate/timestamp/conflicting payload durable acknowledgment. |
| IPN-06 | Giao dịch thứ hai cùng invoice | unit | `sepay-second`, `emu-second` | Actual second distinct transaction retention and no duplicate settlement/release. |
| IPN-07 | Provider timeout/429/5xx/network loss | model | `sepay-transport`, `emu-timeout` | Sandbox timeout/429/5xx and process/network uncertainty under hosted worker. |
| IPN-08 | Browser ?success hoặc ?cancel bị tự sửa | unit | `sepay-binding`, `emu-return` | Hosted manually changed success/cancel query cannot settle or invent provider order. |
| IPN-09 | Thanh toán muộn sau cancel/expiry/locked account | model | `settle-review`, `emu-late` | Actual delayed callback after cancel/expiry/lock; no fulfillment or deleted financial proof. |
| IPN-10 | Authenticated VOID sau đã paid | unit | `sepay-void`, `emu-void` | Authentic deployed VOID after sandbox-paid state and no automatic refund/ledger reversal. |
| REC-01 | Worker chết trước/sau claim/settle/PDF | model | `settle-once`, `emu-lease`, `emu-pdf-retry` | Current-mode Firestore worker crash/replacement/expired lease/PDF retry execution. |
| REC-02 | Balance test trỏ order thật hoặc ngược lại | model | `balance-mix`, `balance-pinned` | Hosted same-run initial/balance and mixed-target negative acceptance. |
| REC-03 | PDF test có tên/ảnh/số lượng/phương thức | PDF | `test-pdf` | Current private downloaded test PDF, image/localization/line quantities/method and deployed digest/access checks. |
| REC-04 | Mở receipt người khác/stale share/token | model | `history-owner`, `emu-private-pdf`, `subscription-stale` | Hosted private PDF request with wrong owner/locked/stale token; share capability meaning verified. |
| ISO-01 | Sandbox success chạm tồn kho thật | model | `catalog-producer`, `checkout-30`, `settle-once` | Deployed stock read-before/after and all consumer proof; current flow has no stock reservation writer, so no separate test-stock store claimed. |
| ISO-02 | Test order đi vào doanh thu/financialEntries/refund/payout thật | model | `settle-once`, `refund-fence`, `analytics-finance`, `dashboard-test`, `analytics-tester`, `analytics-order` | Emulator and hosted zero impact on real revenue/refund/payout/traffic. Independent analytics scoped review now PASSED; provider/live remains unverified. |
| ISO-03 | Test event chạy vendor purchase/shipping dispatch thật | SSR, model | `shipping-fence`, `no-physical-form`, `simulated-sourcing` | Current hosted command/CRM tests for every real vendor/receiving/packing/dispatch entry point. |
| ISO-04 | Record cũ bị policy hiện tại đổi thành test | SSR, model | `settle-old`, `catalog-replay`, `generic-replay`, `feedback-pin`, `reply-live`, `reply-legacy`, `reply-corrupt`, `notification-live` | Deployment rollback/replay on pre-existing true live records without migrations. |
| ISO-05 | CRM nhân viên xem và thao tác đơn test | SSR, model, browser-synthetic, unit | `test-marker`, `no-physical-form`, `checkout-owner`, `reply-pin`, `reply-current-owner`, `notification-marker`, `notification-reply`, `notification-preview`, `notification-read-scope` | Genuine current candidate staff role/recent MFA, native 200% zoom/spoken AT/selector keyboard acceptance and actual deployed inbox read/link actions; synthetic browser does not satisfy these. |
| MAIL-01 | Owner opt-in nhận email thử Resend | model | `mail-optin`, `mail-current-config` | Verified-domain fresh provider readback and opted-in owner canary; accepted and inbox delivered reported separately. |
| MAIL-02 | Không consent/optout sau enqueue/đổi email | model | `mail-destination`, `mail-revoke`, `mail-retry`, `mail-subscription`, `mail-current-config`, `mail-promotions-optin`, `mail-live-optout`, `reply-optout`, `reply-current-owner` | Real identity change/opt-out/stale confirmation with deployed workers. Authorization commits linearize Firestore, not cross-service atomic cancellation. |
| MAIL-03 | Resend timeout sau có thể accepted | model | `mail-unknown`, `subscription-unknown` | Actual provider timeout/lost acceptance response and durable deployed unknown fence. |
| MAIL-04 | Vượt100attempt/day hoặc event cũ trước cutover | model | `mail-cutover`, `mail-real-queue`, `mail-quota`, `jobs-starvation`, `jobs-overlap`, `reply-corrupt` | Current shared100-attempt runtime readback, no historical customer drain, hosted backlog latency; quota suite is included in the current full local rerun, without provider acceptance. |
| AI-01 | Knowledge/context đầy đủ câu không dấu/typo/multi-turn | model, unit | `knowledge-noaccent`, `knowledge-typo`, `knowledge-ambiguous`, `knowledge-source` | Live natural multi-turn tasks using official current source publication; no claim arbitrary questions always answered correctly. |
| AI-02 | Pricing policy/model/budget hết hạn | model, unit | `cost-current`, `mode-policy`, `research-revoke` | Runtime model availability and policies/readback, existing ledger reconciliation; expiry2026-10-12/model retirement2026-10-20 require reviewed update, not date bump. |
| AI-03 | Context quá dài/LLM output sai schema/tool request vượt quyền | model, unit | `context-bound`, `context-overflow`, `tool-allowlist` | Malformed actual LLM output/schema/tool request through deployed model; bounded tests do not certify semantic truth. |
| AI-04 | Hai request cuối cùng tranh budget hoặc timeout provider | model, unit | `cost-shared`, `cost-race`, `pilot-race`, `pilot-unknown`, `emu-shared-budget` | Actual Firestore competing final reservation and provider uncertainty; no reset/top-up or confirmed remaining50000 assumed. |
| LEARN-01 | Feedback đã consent → staff review → holdout → publish | unit | `learning-review`, `learning-source`, `emu-learning` | Real staff MFA review→owner-reviewed publication→fresh retrieval in current hosted mode. |
| LEARN-02 | Feedback poisoning/PII/withdrawal/expired retention | SSR, model, unit | `feedback-pin`, `feedback-analytics`, `feedback-retention`, `cleanup-old`, `cleanup-cas`, `emu-withdraw`, `test-feedback-marker`, `retention-runtime`, `retention-ready`, `retention-digest`, `cleanup-bounds`, `cleanup-revoke`, `cleanup-disable`, `cleanup-expire`, `cleanup-admission-independent` | Exact three indexes deployed and READY, effective Function/Scheduler/IAM readback, protected current retention activation and renewal; hosted consent/withdrawal/poisoning journey. Cleanup is present in v1 but default-inactive. |
| OPS-01 | Enable maintenance làm chạy deletion/financial jobs chưa duyệt | model, unit, artifact-offline | `jobs-split`, `artifact-sepay`, `cleanup-old`, `retention-export`, `retention-env`, `retention-runtime`, `retention-ready`, `cleanup-scheduler-sdk` | Normal artifact/export/scheduler policy/IAM readback; no deletion enabled by blanket flag. |
| OPS-02 | Tắt test mode giữa lúc payment pending | model, unit | `mode-pinned`, `intent-off`, `intent-resume`, `generic-replay`, `cleanup-admission-independent` | Hosted disable during actual pending sandbox operation and email sending; preserve proof/consent/quota. |
| PERF-01 | Checkout tối đa30dòng và cùng invoice đồng thời | model | `checkout-30`, `settle-30`, `settle-once` | Current Firestore contention/latency/load; mocks do not measure p95 or distributed throughput. |
| PERF-02 | Provider response lớn/chậm và retry worker | model | `sepay-transport`, `jobs-bound`, `jobs-starvation`, `emu-timeout` | Real request timeout/256KiB stream bounds, backoff/replacement lease and backlog latency; no load benchmark claimed. |
| PERF-03 | Nhiều chat/feedback/search liên tiếp | model, unit | `context-bound`, `cost-shared`, `private-input`, `feedback-retention`, `analytics-tester`, `cleanup-bounds`, `cleanup-revoke` | Combined repeated chat/feedback/search quotas, concurrency/load and log inspection on deployed owned tester sessions. |
| REL-01 | Normal main CI → immutable artifact → provider readback | model, unit, artifact-offline | `artifact-sepay`, `jobs-split`, `mode-env`, `retention-artifact`, `retention-source-index`, `retention-release-fence`, `retention-index-idempotent`, `retention-index-create`, `retention-index-mismatch`, `retention-scheduler`, `retention-readback`, `retention-compiled-parity`, `retention-scheduler-retries`, `retention-scheduler-uri` | Normal remote main CI/rules/HTTP/audit and deployed exact artifact/provider/source/secret/IAM/Scheduler readback; local freeze, build tuple and offline SDK already passed. Runtime activation and live journey remain separate. |
| REL-02 | Rollback sau provider accepted hoặc attempt unknown | model, unit | `mode-pinned`, `intent-resume`, `mail-unknown`, `pilot-unknown`, `cleanup-disable`, `cleanup-expire`, `retention-ready` | Actual controlled rollback of exact immutable artifact, disable new sends/attempts first, retain accepted/unknown/mode/consent/cutover/quota/proof. |

## Current fixes and applicability

- Alternate catalog checkout now uses server admission and pinned execution provenance; generic chat commands preserve the same approved boundary.
- Final email delivery rechecks current identity, consent, config and token state. Unknown/accepted attempts remain fenced; queue starvation and daily quota use local model evidence.
- Staff replies and derived notifications keep authoritative mode/run/policy version. Mismatched, malformed or legacy unmarked derivatives fail closed; no new unread-email eligibility is introduced.
- Notifications show a compact test marker in the actual component. Desktop and CSS390 browser evidence is scoped to synthetic read adapters. Existing link and read state remain intact; genuine native zoom, spoken AT and staff MFA are unverified.
- Test feedback is excluded from real analytics; raw feedback cannot auto-promote knowledge. Promotion still requires reviewed provenance/evaluation and current source policy.
- Retention cleanup is now included in v1 with an independent **default-inactive** gate. Exact scoped records retain their original <=30-day feedback/review and <=48-hour quota classes; legacy, malformed, finance and audit records stay excluded. Turning off new tester admission does not revoke already-approved expiry.
- Cleanup reads current protected policy/readiness and class query inside each transaction, checks the clock before writes, uses row update-time preconditions and maxAttempts3. At most 100 rows per class and three class transactions run. Malformed same-class rows may occupy the bounded page; no continuous erasure SLA is claimed.
- Immutable retention metadata and canonical readiness digest bind artifact, exact READY index definitions/names, Function revision and hourly UTC POST/OIDC Scheduler with no retries. Checksum integrity is not authentication; protected settings authority remains the boundary.
- Root later obtained explicit minimum-index IAM approval and verified the exact role/binding. That supersedes historical “IAM approval pending” wording only. Effective provider capability, index READY, Scheduler/invocation readback and protected activation/renewal remain operational gates. No automatic activation or destructive index reconciliation is added.

Current registry: **148 test families**, **78 source/config files**, **21 evidence receipts**. **9 known historical source bindings** are explicitly superseded by current matching receipts; **0 unexplained drifts**. The old cda coverage files and proposal hashes remain unchanged.

## Receipts

| ID | Receipt | Status |
|---|---|---|
| `ask` | `docs/reviews/PRODUCTION-TEST-20261010/ASK/HANDOFF.json` | NOT_READY |
| `policy` | `docs/reviews/PRODUCTION-TEST-20261010/BACKEND-POLICY-REVIEW.json` | BLOCKED_PENDING_COMBINED_PRODUCT_AND_LIVE_ACCEPTANCE |
| `finance` | `docs/reviews/PRODUCTION-TEST-20261010/FINANCE/REVIEW.json` | BLOCKED_PENDING_COMBINED_PRODUCT_AND_RELEASE_ACCEPTANCE |
| `catalog` | `docs/reviews/PRODUCTION-TEST-20261010/CATALOG-PRODUCER-REVIEW.json` | BLOCKED |
| `ui` | `docs/reviews/PRODUCTION-TEST-20261010/UI-CHECKS.json` | NOT_READY |
| `release` | `docs/reviews/PRODUCTION-TEST-20261010/RELEASE-SCOPE/HANDOFF.json` | BLOCKED_AGGREGATE_GATES |
| `email` | `docs/reviews/PRODUCTION-TEST-20261010/EMAIL-REVOCATION-01/REVIEW.json` | BLOCKED_PENDING_COMBINED_RELEASE_ACCEPTANCE |
| `analytics` | `docs/reviews/PRODUCTION-TEST-20261010/INTEGRATION/ANALYTICS-CHECKS.json` | NOT_READY |
| `preflight-correction` | `docs/reviews/PRODUCTION-TEST-20261010/INTEGRATION/PREFLIGHT-CORRECTION.json` | PASSED |
| `email-peer` | `docs/reviews/PRODUCTION-TEST-20261010/EMAIL-REVOCATION-01/PEER-REVIEW.json` | PASSED_WITHIN_SCOPED_SOURCE_TEST_REVIEW |
| `analytics-peer` | `docs/reviews/PRODUCTION-TEST-20261010/INTEGRATION/ANALYTICS-PEER-REVIEW.json` | PASSED |
| `combined-local` | `/private/tmp/satsunicgo-production-test-combined-checks/unit-network-allowed.json` | PASSED_LOCAL_UNIT_RERUN; aggregate release review still pending |
| `reply-provenance` | `docs/reviews/PRODUCTION-TEST-20261010/INTEGRATION/REPLY-PROVENANCE-REVIEW.json` | PASSED_SCOPED_LOCAL_AND_INDEPENDENT_SOURCE_REVIEW |
| `notification-browser` | `docs/reviews/PRODUCTION-TEST-20261010/INTEGRATION/NOTIFICATION-BROWSER-ACCEPTANCE.json` | PASS_WITHIN_SYNTHETIC_RENDER_SCOPE |
| `notification-ui-review` | `docs/reviews/PRODUCTION-TEST-20261010/INTEGRATION/UI-NOTIFICATION-REVIEW.json` | BLOCKED_PRODUCT_LANGUAGE_NATIVE_GATES; scoped engineering and synthetic browser PASS |
| `retention-r2` | `docs/reviews/PRODUCTION-TEST-20261010/INTEGRATION/RETENTION-COMPLETION-R2-CHECKS.json` | PASSED_SOURCE_LOCAL_R2; production activation NOT_READY |
| `retention-peer` | `docs/reviews/PRODUCTION-TEST-20261010/INTEGRATION/RETENTION-COMPLETION-PEER-REVIEW.json` | PASSED_SCOPED_INDEPENDENT_SOURCE_REVIEW |
| `retention-handoff` | `docs/reviews/PRODUCTION-TEST-20261010/INTEGRATION/RETENTION-COMPLETION-HANDOFF.json` | PASSED_SOURCE_LOCAL_HANDOFF |
| `combined-r2` | `/private/tmp/satsunicgo-production-test-final-r2-checks/unit.json` | PASSED_FINAL_R2_LOCAL_UNIT_STRICT_LINT_AND_NODE_CONTRACTS; whole release NOT_READY |
| `build-ci-tuple` | `/private/tmp/satsunicgo-production-test-final-r2-checks/BUILD-CI-TUPLE.json` | PASSED_LOCAL_EXACT_CI_BUILD_TUPLE |
| `offline-artifact-sdk` | `/private/tmp/satsunicgo-production-test-final-r2-checks/ARTIFACT-SDK.json` | PASSED_WITHIN_OFFLINE_ARTIFACT_SCOPE |

## Remaining gates

- Normal remote main CI/audit and exact deployed immutable artifact/provider/runtime source readback remain unverified. Root local exact CI build tuple and offline actual SDK artifact passed; these do not certify remote CI or deployment. Base v0.10.0 is not the new-mode release.
- Product Language Gate remains BLOCKED for genuine native select keyboard/200% zoom/spoken AT and current candidate genuine staff role/recent MFA. Scoped actual-component synthetic browser receipts do not replace these.
- Authentic SePay sandbox IPN/readback, exact secret binding/IAM and dashboard secret match; enabled version metadata is not secret-value correctness.
- Verified Resend domain/settings/current consent plus opted-in live canary; provider accepted is not inbox delivered.
- Real Gemini/model readiness and existing cost ledger/import reconciliation remain unverified. Shared 50,000 VND is an approved allocation, not a confirmed balance; research import floor remains 50,000 without reset/top-up. Short pricing policy expiry 2026-10-12 and model retirement 2026-10-20 require fresh operator evidence before renewal.
- Retention v1 includes askFeedbackCleanup with an independent strict default-inactive gate. Minimal index IAM approval and exact role/binding metadata are verified in the root receipt, but effective deployer capability, exact three index READY definitions, live Function revision/Scheduler/OIDC, immutable readiness and protected activation/renewal remain separate. No automatic settings write or continuous erasure SLA.
- Distributed Firestore retries, backlog/load latency and actual production rollback remain distinct from bounded model/unit contracts.
- The final R2 624-input local freeze and 2,789 unit/179 Node/strict/lint checks passed. Final root aggregate review and current-mode emulator/provider/live acceptance remain separate and must bind the final release artifact.

## Validation and cost

Only these two coverage documents were updated. This refresh executed **0 tests, 0 model/provider calls**. It verified 624 frozen input hashes, 148 exact current test-title/file/line/hash references, source bindings, receipts and logs. It records completed local build/package/SDK scope, and does not certify remote normal CI, deployment or a whole production review.

Gemini allocation: 50,000 VND approved; **actual billed cost and remaining balance unavailable**. Existing research import floor remains 50,000 VND, unreconciled; no reset or top-up. No provider/model call was made by this coverage task. Memory candidates: None.

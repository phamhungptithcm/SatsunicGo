# Payment integration — local demo handoff

The current application implements the approved mixed-cart, 100% initial payment and subsequent approved-cost funding flow. The latest paid view is a compact centered card with a green check, one amount, blue actual order IDs, an accessible PDF icon and an order-view action. Final scoped review: **PASSED**, cycle 6. Local configured acceptance: **8/8 criteria completed (100% of local scope)**. Production: **NOT_READY**.

Source binding: HEAD 53d59bd88fa7da9d1243692336ecd09b6540ea31, dirty shared checkout; IMPLEMENTATION-SOURCE-MANIFEST.json SHA256 5ccf75159d4aed7c10a164024abc1a4fd95dd4c5b1eb9ab6fe23bb916f69871b. Approved plan v3 SHA256 2c07b9c3c799d99ba351767cc1bca6ee487070c1c1575b4e3995a185edfcd7ca, APPROVAL-V3.md and SUCCESS-UI-DELTA.md. The frozen plan's original pending label remains historical; approval is separately bound. Intelligence DEGRADED; CodeGraph first, CocoIndex second, critical paths source verified. No unrelated WIP reverted, staged or committed. Existing Cart and RequestForm CSS retained.

| Local acceptance criterion | Weight | Result/evidence |
| --- | --- | --- |
| Existing form/catalog into same cart; sourced flag/images/quantity | 15 | PASSED — actual app and HTTP replay; no staff work before paid. |
| Compact overview, connected nodes, 44px thumbnails, address and freight semantics | 15 | PASSED — actual desktop/mobile, VN coded directory, tariff calculator and consent reset. |
| Authoritative full initial payment, exact child allocations and dedupe | 20 | PASSED — 4,695,000 VND = 3,045,000 custom + 1,650,000 listing; parallel proof only one ledger allocation. |
| Pending/unknown/reload/ownership and safe recovery | 10 | PASSED — exact attempt survives; no unknown cancellation or duplicate charge; private access rejected. |
| Staff price proposal → customer consent/funding → buying | 10 | PASSED — browser approval/top-up, HTTP buyer path; excess spend refused before approval/funds. |
| Actual cost/final approval/top-up → shipping guard | 10 | PASSED — HTTP final 3,500,000 VND, incremental 255,000; browser fixture final 3,400,000 VND and dispatch; listing remains fixed. |
| Private PDF/background delivery demo, lease/retry/failure | 15 | PASSED — PDF and sink complete before read; queued/live/expired recovery, missing recipient and failure without ledger mutation. |
| Current completion UI, copy, focused review/test evidence | 5 | PASSED — current 520px centered card, 44px download icon, 320/390px no overflow, UUID navigation and keyboard; 73 unit / 5 rules / 17 HTTP. |

## What the demo proves

Real local Auth/Functions/Firestore/Storage calls, server transactions, private object PDFs and durable demo email sink. The worker uses the same bounded registered recovery handler because the preserved shared Firestore belongs to its original emulator hub: native Firestore triggers/scheduler are not connected to this restarted Functions hub. This is an explicit local runner, not a claim of native trigger delivery. No extra frontend server or Firestore reset was started. Frontend 5207 and Firestore 18207 were preserved; owned Auth 19207, Functions 15207, Storage 19208 were gracefully exported/restored after hot build interruption. Current helper: scripts/purchase-demo-receipt-worker.mjs --watch; only exact demo emulator environment is permitted.

Customer-browser fixture: initial parent 2036b737-2950-41e2-832a-377aac8bdbd6, custom child 125a9e15-d29b-4cf0-b04c-c5c8e1e1a888, fixed listing 73cc1a1a-c9cf-474a-9765-ab3fcf2f7d97. Custom initial 3,045,000; source increase 100,000; final increase 255,000; net final 3,400,000. HTTP final independent fixture: parent 10e535e1-8784-4210-8ff6-abf80d24658c, source/final IDs in E2E-HTTP.json; initial 4,695,000; source increment 200,000; final increment 255,000. These are synthetic fixtures, not customer transactions.

Actual demo at http://127.0.0.1:5207/checkout/payment/2036b737-2950-41e2-832a-377aac8bdbd6 (local customer B). Single-order final card: http://127.0.0.1:5207/checkout/payment/44d49da9-5fc1-4882-8fc6-5b91c9e8d8ba. Login via existing /account “Tài khoản thử nghiệm” customer B if the emulator session expires. Start another request in existing /request, enter researched price and add to cart; listing can be added via Products. Existing cart leads to recipient/overview/payment. “Demo: thanh toán thành công” performs server verification; it never calls PayOS or charges real money.

## Review and fixes

Every current review dimension is recorded in IMPLEMENTATION-FINAL-REVIEW.json; earlier candidate hashes were not retained and are not presented as current gates. Same primary reviewer; no independent agent claim. Iterations: (1) full-funding domain/claim/spend barriers; (2) exact replay/owner/media/lease isolation; (3) fixed-listing action crash, missing recipient, source/final receipt meaning, frozen recovery and tracking semantics; (4) route reset, latest receipt discovery and queue starvation; (5) explicitly approved centered completion, icon accessibility and friendly transport-error recovery; (6) fresh full scoped pass after verification. No known critical/high issue remains within executed checks. Residual risks are explicit, not silently accepted as production evidence.

Verification: web/functions builds exit 0, scoped ESLint, 73 unit tests (six files), five real Firestore/rules tests, 17 real HTTP checks and current CUA customer-browser evidence. One earlier rules run timed out while another HTTP run competed; rerun alone with original thresholds passed. A later HTTP run was interrupted by Functions hot reload/socket hang-up; no claim of pass for that run. Final frozen rebuild + graceful export/import + rerun passed. Existing build chunk warnings retained. Runtime performance/production load thresholds are not invented.

## Deferred production work and limits

PayOS grouped checkout adapter/webhook/readback is **NOT_RUN**; live channel fails closed. Real SMTP attachment sender is **NOT_RUN**; emailState=demo_delivered means the private demo sink, not real inbox delivery. Maps is not activated; coded Vietnam province/commune plus manual street entry works. Production fee/FX/terms/destination directory and domestic carrier table need owner-approved configuration; no province price is invented. The PDF is a branded payment receipt, **not a tax invoice**. Formal fiscal issuance requires a separate issuer/provider contract.

Production Node 22, native deployed triggers/scheduler, IAM/App Check/MFA, monitoring alerts, real-device/zoom/native AT and provider/production readback remain NOT_RUN. Staff authenticated CRM browser path is not asserted; staff flow was exercised through actual existing-authorized HTTP calls, with source/component checks as disclosed proxy. PDF CJK/emoji glyph coverage needs expansion before those international-script names can be used in production. Existing capped order list/document inbox behavior is not broadened; direct current receipt/order links are available. Browser OS download-event completion remains NOT_VERIFIED in IAB, while authenticated PDF output and the UI action are verified.

Runtime reporting CLI unavailable: criteria/checks/review are stored as task-local evidence files; native runtime receipts and native rendered task report are NOT_RUN. The current repository allows bounded DEGRADED intelligence; the older READY-only approval validator is not weakened or falsely satisfied. No release, commit/push, production enablement or datafix performed for this payment scope. Rollback is intake-disable plus preserved recovery/read/fulfillment; never delete proof or TTL-release an unknown financial obligation.

Automatic approval review rejected one earlier proposed additional demo OWNER grant. No rejected action executed. The safer route used an existing verified authorized demo OWNER through the callables, with permissions unchanged; no permission blocker remains. This is recorded separately from all passing checks.

Provider-reported token usage: **Unavailable**. API-equivalent estimate and actual billed cost: **Unavailable** (no stable usage/pricing entry). Memory candidates: **None**; no memory writes. Native report receipt unavailable; this compact evidence-derived report is the fallback.

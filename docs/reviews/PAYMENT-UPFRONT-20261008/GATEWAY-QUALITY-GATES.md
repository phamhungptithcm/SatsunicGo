# Quality gates — scoped local demo

HEAD 0d6e721698608eebb36b0b2f68021c3054d97d1c; manifest df6bcc5170c527da1ca28e6120d566ba3d5d44fa6d1531326a6a1654483c7663.

| Gate | Status | Evidence |
| --- | --- | --- |
| Compilation | PASSED | npm run build; npm run build --workspace functions; observed exit0 and current hashes |
| Unit tests | PASSED | npx vitest run tests/unit/purchase-provider.test.ts tests/unit/purchase-mutation-queue.test.ts tests/unit/purchase-checkout.test.ts tests/unit/purchase-owner-guard.test.ts tests/unit/purchase-acknowledgement.test.ts tests/unit/purchase-pdf.test.ts tests/unit/cart107.test.ts tests/unit/payos-signature.test.ts tests/unit/order-tracking.test.ts tests/unit/purchase-feedback.test.ts — 132 tests /10 files |
| Integration tests | PASSED | GCLOUD_PROJECT=demo-satsunicgo FUNCTIONS_EMULATOR=true FIRESTORE_EMULATOR_HOST=127.0.0.1:18207 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:19207 FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:19208 node scripts/purchase-gateway-scenarios.mjs —69; node scripts/purchase-gateway-business-e2e.mjs —17; node scripts/purchase-gateway-cross-process.mjs —2 independent processes; npx vitest run --config scripts/purchase-gateway-rules.config.mjs —19 |
| Static analysis | PASSED | npx eslint [owned TS/TSX/MJS source/tests/scripts]; empty log and exit0; full command in GATEWAY-VALIDATION-COMMANDS.md |
| Architecture | PASSED | Source/diff/callers + GATEWAY-INTELLIGENCE.md; no external I/O inside allocation transactions; shared domain commands remain authority |
| Language/version profile | PASSED | TypeScript/JavaScript + HTML/CSS; detected Node25.9 vs Functions target22 explicitly separated |
| Platform/domain profile | PASSED | Web/API/database/concurrency/memory, GATEWAY-CODE-QUALITY.md |
| Public SEO/GEO | NOT_APPLICABLE | No discovery content, crawler metadata or public search contract changed |
| Visual design | PASSED | Preserved R4/cart, narrow gateway, current desktop +CSS320/390 +real states; GATEWAY-BROWSER-CHECKS.json |
| Product content | PASSED | GATEWAY-PRODUCT-CONTENT.md; current AST inventory plus rendered states and all eight principles |
| Animation/motion | NOT_APPLICABLE | No added decorative motion; existing shared UI retained |
| Language-aware analysis | PASSED | Frontend/functions tsc, scoped ESLint/Prettier; git diff --check |
| Security | PASSED | Auth/owner/locked/strict args/signature and persisted time/money binding;11 private rules groups, callback replay and guarded environment |
| Database migration | NOT_APPLICABLE | No schema migration, backfill or destructive rename; private additive demo intents/optional checkout metadata only |
| API compatibility | PASSED | Existing unlinked demo branch retained; linked intent denies bypass; new public callback emulator-only; real adapter remains unavailable |
| Observability | PASSED | Audit/evidence/ledger preserved; attempts/lease/failure enum and private outbox; production SLIs/alerts deferred |
| Diff review | PASSED | Primary reviewer compared approved scope to actual diff/new files and affected callers after fixes |
| Final implementation review | PASSED | Fresh cycle7, GATEWAY-FINAL-REVIEW.json, matching HEAD and manifest |
| Search/claims review | NOT_APPLICABLE | No SEO/structured-data changes; gateway explicitly discloses demo, no real money |
| Design/states/accessibility | PASSED | Current form->cart->recipient->overview->gateway->unknown->delayed reconcile->paid->order, keyboard/44px/responsive; formal AT audit NOT_RUN |
| Human Interface/product meaning | PASSED | All eight principles with in-context evidence; vi-VN/VND/GMT+7, actual paidAt and unknown freight meaning |
| Formatter | PASSED | Scoped npx prettier --check; All matched files use Prettier code style |
| Resource probe | PASSED | node --expose-gc scripts/purchase-resource-probe.mjs —3200 queue work/1600 expected failures/50 PDFs, five forced-GC samples; finite scope only |
| Exclusive CI fixture | NOT_RUN | Current tests/rules/purchase-checkout.test.ts requires Storage9298; preserve concurrent fixture, use shared variant on19208 |
| Production provider/deployment | NOT_RUN | Explicitly excluded live PayOS/Maps/mail/production mutation; Node22, deployed trigger/readback and load not executed |
| Native runtime reporting | NOT_RUN | ai-agent-kit CLI unavailable; file-backed evidence report, no fabricated native ledger receipt |
| Legacy approval validator | FAILED | Validator attempted and returned ERROR requiring READY; DEGRADED fallback explicitly permitted by repository workflow and human approval exists. It did not pass. |
| Native browser file-save | NOT_RUN | Download event not confirmed in initial15s; chrome://downloads blocked; no bypass. API/Storage bytes/hash/render are verified separately |

PASSED applies only to the documented scope. Native approval validator did not pass; DEGRADED fallback/human approval and runtime-report limitation are explicit. Production NOT_READY.

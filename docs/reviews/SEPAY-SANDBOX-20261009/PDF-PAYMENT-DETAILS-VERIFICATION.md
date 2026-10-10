# PDF payment method and paid-time verification

Task: PDF-PAYMENT-DETAILS-20261009. User requests method actually paid and time paid. Scope: verify the existing concurrent integration owner's implementation and provide current PDF evidence. No application/test/data/runtime/dependency changes were needed or made by this chat. Owner retained candidate ownership; no duplicate fields or candidate-invalidating edit introduced. Direct current request authorizes read-only verification and preview artifacts. Risk LOW.

Intelligence gate run to `/tmp/sepay-pdf-details-intelligence.json`; CodeGraph queried before CocoIndex, then critical current source verified. Index coverage DEGRADED; current source/test/artifact evidence is authoritative for this bounded review.

## Observed implementation and data flow

- `functions/src/purchase-settlement.ts` persists the server-verified SePay proof's paymentMethod, provider, reference and paidAt into the receipt snapshot. paidAt is payment time, not PDF creation/download time.
- `functions/src/purchase-receipts.ts` passes that stored snapshot to renderPurchaseReceipt; money allocation remains independent of PDF generation/delivery. Existing private storage/download owner checks are unchanged.
- `functions/src/purchase-pdf.ts` shows Phương thức thanh toán and Thời gian thanh toán together in the metadata panel below receipt/reference. Phase-one SePay proof accepts only BANK_TRANSFER, displayed as QR chuyển khoản · SePay sandbox. Demo receipts remain Thanh toán demo. No claim that NAPAS/card payments are currently supported.
- Intl formatting explicitly uses Asia/Ho_Chi_Minh and day/month/year,24-hour hour/minute/second. The label Giờ Việt Nam (GMT+7) removes ambiguity. Both initial and balance receipts share the renderer.
- SePay preview receipts explicitly state Không thu tiền thật; this is local synthetic/emulator evidence, not an actual bank payment. Existing tax-document distinction retained.

## Acceptance and checks

Three equally weighted criteria complete: correct method, paid timestamp/timezone, legible initial/balance PDF. Scoped acceptance3/3 (100%). No remaining work for these existing PDF fields within executed checks.

| Check | Result/evidence |
| --- | --- |
| PDF unit regression | PASSED: `node node_modules/vitest/vitest.mjs run tests/unit/purchase-pdf.test.ts`,8/8 tests; includes exact known UTC→Vietnam timestamp, demo/SePay labels, initial/balance totals and30-line pagination |
| Rendered layout | PASSED: pdftoppm PNG render of both PDFs, each1page, visually inspected method/time panel, table and totals; no clipping/overlap found |
| Independent extraction | PASSED: pypdf checks both method/time labels, formatted timestamp, timezone and sandbox disclosure; output verification.json |
| ESLint/format | PASSED: current renderer/test scoped ESLint and Prettier check, exit0 |
| Compilation/build | NOT_RUN by this verification: no code edit; no prior run relabeled current |
| Backend/provider E2E | NOT_RUN by this verification: no emulator mutation, secret read, real payment or public IPN deployment |
| Native runtime ledger | NOT_RUN: ai-agent-kit CLI unavailable; file-backed evidence only |
| Database/API/motion/SEO change | NOT_APPLICABLE: no changes |

Available pdftoppm was used. pdftotext was unavailable and the first fitz import was unavailable; bundled pypdf provided successful independent extraction. No dependency install or system configuration change.

## Product content and visual gate

Audience: Vietnamese purchase customer reading a payment receipt. Platform: printable A4 PDF, existing Unicode font and blue/white/navy branding. Apple-only HIG contract NOT_APPLICABLE. Existing user-facing strings unchanged by this verification; inventory: Phương thức thanh toán, provider/method value, Thời gian thanh toán, formatted date/time, Giờ Việt Nam (GMT+7), Không thu tiền thật. Each is inspected in the actual rendered initial and balance PDFs.

| Principle | Result/current evidence |
| --- | --- |
| Purpose | PASSED: tells customer how and when this receipt's payment was made |
| Agency | PASSED: method/time readable in downloadable PDF; no interaction or payment action added |
| Responsibility | PASSED: persisted paidAt rather than render time; explicit sandbox and tax-document disclosures |
| Familiarity | PASSED: Vietnamese labels, day/month/year,24-hour time and named timezone |
| Flexibility | PASSED: same fields on initial/balance;30-item pagination test retains references |
| Simplicity | PASSED: metadata stays in one panel; no duplicate rows or new instructions |
| Craft | PASSED: aligned two-column metadata, clear hierarchy, Unicode glyphs, unclipped time/method |
| Delight | PASSED: immediate readable payment facts within existing restrained branding |

State coverage: paid initial/balance and demo/SePay sandbox inspected/tested. Pending/failed payments do not produce a paid receipt through the settlement path; no new states introduced. Missing/future unsupported method is not certified here; only currently accepted BANK_TRANSFER and existing demo behavior are covered. Stale/offline/download authorization/backend delivery behavior unchanged and not newly certified. PDF semantic-tag/full assistive-technology certification NOT_RUN; embedded Unicode extraction verified. Data meaning/tone/brevity/terminology/platform fit/in-context visual evidence PASSED for the requested fields. Product Language Gate PASSED within this scope.

## Final review and completion boundary

Fresh cycle1 PASSED for this read-only requirement verification: source/data meaning, security/PII, bounded renderer/resource behavior, initial/balance and failure boundaries, compatibility, visual content and trade-offs reviewed. No actionable finding for the requested fields in executed checks. No source fix required. Earlier source owner work is not attributed to this verification.

Profiles considered: universal, TypeScript/JavaScript, product-content, visual-design; PDF skill applied. Existing typed bounded renderer, local Unicode font, max30lines/max12pages and3MB worker cap unchanged. No new request, cache, timer, listener or persistence introduced. Architecture/security/API/observability impact PASSED by no-change review. Deployment/rollback/migration NOT_APPLICABLE to this verification. Overall SePay production readiness remains NOT_READY; provider verification/deployment remains separate.

Verified artifacts: `output/pdf/payment-details-20261009/{initial.pdf,balance.pdf,initial.png,balance.png,initial.txt,balance.txt,verification.json}`. Copies preserve the integration owner's original PDF hashes; their visible transactions are synthetic. Source/evidence hashes recorded in PDF-PAYMENT-DETAILS-FINAL-REVIEW.json. HEAD0d6e721698608eebb36b0b2f68021c3054d97d1c, dirty concurrent worktree preserved. No commit/push/deploy/restart/reset by this verification. Provider usage/API-equivalent estimated cost/actual billed cost: Unavailable. Memory candidates: None.

# Approval and release scope

Plan ID/version: ASK-SEMANTIC-COMMANDS-20261017-v1 + inline purchase scope explicitly requested 2026-10-17
Repository intelligence gate status: READY — original planning gate; isolated latest-main checkout uses DEGRADED bounded source verification without a copied index
Approval status: APPROVED
Approver: repository owner, current human user
Approval timestamp or task reference: 2026-10-17, chat 01a14c03-2ce6-7110-8025-4b8bf70787ae, user message beginning "approve đảm bảo để mua được hàng ngay trên ask anything"
Approved scope: Semantic Gemini commands, existing utilities, inline purchase using canonical cart/request/checkout/payment UI and backend, tests and production deployment after verification. Explicit production instruction supersedes earlier local-only scope.
Constraints: Preserve WIP and domain/auth/payment/confirmation controls. No unrelated release. No real payment without customer action. Provider budget remains bounded. Price/activation renewal requires current source/provider evidence. No secrets in evidence.
Baseline: f9e323eeffaa38b313428a583f56cdd8324ffdf5; isolated worktree rather than dirty old checkout.
Impact delta: Reuse current cart/request/checkout/payment components through scoped inline navigation. Provider redirects may still open the provider for customer authorization; Ask never marks paid from chat. Existing standalone pages retain default routing. Refresh the expired bounded AI activation only after current provider/pricing checks. Same model and budget ceiling; no model substitution or unrestricted spending.

Demo configuration delta APPROVED: user replied "Duyệt cấu hình demo này" to the explicit 24-hour demo request: global ceiling remains 50,000 VND, per-account ceiling 20,000 VND, 6 requests/minute/account. Preserve all reserved/spent counters. Customer policy expiry is at most 24 hours from activation and before 2026-10-19T00:00:00Z, ahead of model retirement. Price and model lifecycle checked against current Google Cloud documentation on 2026-10-17.

Language clarification: user explicitly requests natural Gemini-style multilingual conversation followed by conversion to supported actions. Interpret all languages the model understands, preserve context and clarifications; interface locale remains vi/en. No claim of all-language accuracy or parity with the Gemini consumer application's tools.

Context payload delta APPROVED: after automatic review required explicit payload/destination authorization, user replied "Duyệt ngữ cảnh đã lọc" to sending up to six recent question/answer turns, with sensitive information filtered, to the existing Gemini service on Google Cloud. Include bounded redacted answer paragraphs in the existing protected conversation context, subject to the same token/byte bounds. No other private account, contact or payment fields are added. Update the customer-facing privacy notice accordingly.

Approved paths:
- `packages/domain/ask-command-plan.ts`
- `packages/domain/ask-stream.ts`
- `packages/domain/action-preview.ts`
- `functions/src/ai/ask-command-*.ts`
- `functions/src/ai/ask.ts`
- `functions/src/ai/ask-pilot-answer.ts`
- `functions/src/ai/server-context.ts`
- `functions/src/ai/ask-production.ts`
- `functions/src/ai/ask-pilot.ts`
- `src/features/ask/*`
- `src/features/cart/*`
- `src/features/requests/RequestForm.tsx`
- `tests/unit/ask-*`
- `tests/unit/purchase-inline*`
- `tests/component/ask-*`
- `tests/browser/ask-semantic*`
- `docs/plans/ASK-SEMANTIC-COMMANDS-20261017/*`
- `output/ask-semantic/*`

Output scope above is local synthetic test evidence only; excluded from release commit.

Production demo activation scope: the authorized purchase demo requires renewing the already approved `settings/productionTest` and `settings/upfrontCheckout` activation windows as well as `settings/askCustomerAi`. Use at most 24 hours, preserve the existing tester allowlist, sandbox provider, monetary values, pricing terms and all consumption counters. Preconditions: exact current document updateTime and previous enabled/approved values. Do not create a broader tester list, change financial records or enable real-money processing. Record sanitized before/after flags and timestamps only.

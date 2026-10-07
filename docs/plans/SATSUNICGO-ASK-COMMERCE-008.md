# SATSUNICGO-ASK-COMMERCE-008 v1

Date: 2026-10-04 (America/Chicago). Status: APPROVED — owner chat approval `apporved`; see docs/approvals/SATSUNICGO-ASK-COMMERCE-008.md.

## Outcome

Ask Anything becomes the customer's continuous buying-assistance workspace. Customers describe what they want, supply missing details, review the actual offer, confirm commitments and authorize payment. The system coordinates the request through delivery and completion without requiring navigation through operational forms.

AI coordinates permitted actions; physical purchasing, warehouse work and carrier delivery require actual staff or verified integration events. This plan does not claim that those operations are currently automated.

## Repository intelligence and observed facts

Base commit: 3bd0d093255963a2cbf66ddd80d27456da7076e0. The worktree contains extensive pre-existing changes; preserve them. CodeGraph and CocoIndex health queries returned results, but the repository gate reported stale indexes. One incremental refresh failed because the CocoIndex daemon log was outside permitted writes. Evidence mode: DEGRADED; targeted source reads are authoritative. No completeness claim.

- `src/features/ask/Ask.tsx`: local FAQ selection can bypass the backend; history includes only previous questions, is bounded and held in component state. Authentication and operation cards need integration without losing the current conversation.
- `functions/src/ai/ask.ts`: Gemini/Genkit tools provide published information, private owner-scoped order context and draft requests. Its system contract explicitly forbids submitting drafts, spending money or confirming payment.
- `packages/domain/ask-stream.ts`: responses contain text, citations, an action string and optional request draft; they lack durable workflow state and typed executable actions.
- `functions/src/index.ts`: the authenticated command handler includes `submitRequest` and `acceptQuote`, transaction handling and operation identities. Reuse its business rules rather than bypassing them.
- `packages/domain/index.ts`: request schema, quote versions, money calculations, 50% deposit rule, order state transitions and staff role grants already exist. Dispatch requires packing, approved final amount, sufficient verified funds and no hold.
- `functions/src/payments/payos.ts`: authenticated owner-scoped deposit/balance link creation and verified-payment processing exist. Live provider readiness was not tested.
- `functions/src/shipping.ts`: parcel commands require staff authorization. Carrier booking automation and merchant checkout connectivity were not established by this inspection.
- Stack verified in package manifest: React, TypeScript, Vite, Firebase and Zod; backend uses Genkit/Vertex AI. No new dependency or provider proposed.

## Customer journey and acceptance criteria

1. Describe a product using a link or plain language. AI preserves variants, quantity, source market and budget, and asks only for missing or conflicting details. Missing external product verification becomes a tracked staff task, never invented inventory or price.
2. Continue anonymously for public advice/draft preparation. Require existing verified authentication before private reads or writes, preserving the draft and returning to the same chat.
3. Show a structured request summary in chat. The customer confirms submission once; create exactly one request despite retries, double clicks or lost responses.
4. Show an authoritative quote with product details, itemized fees, expiry, terms, deposit and known estimates. Bind acceptance to the displayed quote version; changed or expired quotes require renewed review.
5. Offer the verified deposit payment link/QR inside the conversation. Payment authorization may open the provider/bank surface and must return to the same chat. Only verified webhook/reconciliation or the existing authorized finance process establishes paid status.
6. Collect recipient, phone and destination through structured inline controls; reuse saved information with customer review. Store operational PII separately from model context; never send raw addresses, payment credentials or receipts to the LLM by default.
7. Keep the chat synchronized with real order, purchase, parcel and payment events. Display waiting reason and next responsible party. Staff handle sourcing, purchase and warehouse actions through their existing permissions; AI never acquires staff permissions.
8. Present actual final charges and remaining balance, allow authorized payment, then follow real dispatch and delivery. Mark completion only when existing domain prerequisites and delivery evidence permit it. Surface cancellation, returns and disputes as supported workflows rather than forcing completion.
9. Resume the same conversation/order after reload or another authenticated session. Background progress continues after the UI closes; closing a streamed reply must not silently cancel a committed operation.

The customer provides details, approves material commitments and authorizes payment. Routine progress requires no repeated customer input. A task can be waiting on staff, provider or customer; "end to end" does not imply instantaneous completion.

## Implementation boundaries and file plan

Risk: HIGH (customer PII, authorization, payment-related orchestration, persistent public contracts).

- `packages/domain/ask-stream.ts`, new `packages/domain/ask-workflow.ts`: typed conversation state, pending fields, authorized action proposals, outcomes, request/order references and operation IDs. AI output is a proposal; a deterministic server policy validates every execution.
- `functions/src/ai/ask.ts`: maintain trusted server conversation context, distinguish advice from shopping intent before local FAQ shortcuts, offer only allowlisted owner-scoped tools. Preserve source restrictions, quotas, App Check and bounded tool work. Use structured context with PII redaction.
- New `functions/src/ai/ask-workflow.ts`: authenticated durable conversations and action executor. Bind confirmation to owner, action payload, quote/order version and expiry. Store idempotent outcomes and reconcile unknown results before retrying.
- `functions/src/index.ts` and new internal command service if needed: extract/reuse existing validated command execution without changing role gates or transaction rules. Do not call privileged staff paths with AI identity.
- `functions/src/payments/payos.ts`: reuse verified payment service for authenticated link requests; retain its provider verification, ledger and idempotency rules. No AI-calculated payment amount or beneficiary.
- `src/features/ask/Ask.tsx`, `src/features/ask/transport.ts`, new inline action components and associated Ask styles: durable chat hydration, login continuation, request/quote/address/payment/status cards, minimal confirmation controls and recovery states. Do not claim cancellation of a transaction when merely stopping a reply.
- `src/shared/firebase.ts`: typed calls for conversation/actions only where needed.
- `firestore.rules`, `firestore.indexes.json`: owner-isolated conversations, redacted model context, server-only action/audit state; indexes only when actual queries require them. No destructive migration.
- Recipient storage contract and exact owning module must be verified before implementation. Introduce a validated owner-bound address record only if no existing contract can be reused; document retention, access and whether delivery address changes invalidate a quote.
- `tests/unit/ask-*.test.ts`, new workflow unit tests, `tests/http/callable.mjs`, relevant rules tests: exercise the criteria and failure paths below.
- `docs/reviews/ASK-COMMERCE-008-*`: product-content inventory, in-context review, final review cycles and task report.

## Reliability and security

No arbitrary URL fetch or merchant checkout added. Product URLs remain data until an approved connector is available. No new provider, secret access, IAM, live purchase/refund/payment, production write, push or deployment authorized by this plan.

Transactions establish authoritative state; conversational wording cannot establish paid, purchased or delivered. Use payload-bound idempotency, version conflicts, bounded retries and persistent pending/outcome records. Recover provider timeouts by reconciliation. Persist jobs/events for work spanning requests; avoid a long-running LLM call as the workflow engine. Record redacted operational audit outcomes and correlate conversation, operation and order without logging PII or full prompts.

Live merchant/carrier integrations are a later delta plan naming each provider, credentials, terms, spending permissions, webhook verification, retry/reconciliation behavior and rollback. The first implementation delivers the complete chat interface over the current staff-operated fulfillment flow.

## Validation and rollout

- Unit: missing fields, intent versus FAQ, malformed tool proposals, policy denial, quote version/expiry, repeated confirmation, concurrency, partial payment and completion prerequisites.
- Emulator HTTP/rules: cross-user access, locked accounts, anonymous mutation, replay/tampered confirmation, duplicate actions, lost response, reload/resume, webhook replay and spoofed payment claims. Re-run the original chat entry point.
- Browser: Vietnamese/English, mobile, keyboard/focus, screen reader status, loading/empty/failure/retry/waiting states, authentication continuation and end-to-end customer journey with explicitly marked fixtures and staff steps.
- Run repository typecheck, lint and relevant tests. Complete product language review with all eight principles and current in-context evidence; run mandatory final implementation review until current checks pass.
- Keep conversational writes gated until validated; rollback disables new action execution while retaining readable conversations and existing orders/payments. Never discard a committed action during rollback.
- No production readiness assertion without actual integration/configuration and provider evidence. Local/emulator tests cannot certify live commerce.

## Planning handoff

Delivered: source-bound gap analysis, customer flow, scoped implementation and validation plan. Implementation and local validation recorded in docs/reviews/ASK-COMMERCE-008-VALIDATION.md; final review and remaining evidence are recorded separately. Production readiness: NOT_READY. Token usage and actual cost: Unavailable. Memory candidates: None.

Approval requested: SATSUNICGO-ASK-COMMERCE-008 v1, local implementation and emulator/browser validation within these boundaries. Existing E2E-005 approval does not establish approval for the new persistent commerce/chat/payment contracts. Any material expansion requires delta approval.

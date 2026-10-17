# Semantic Ask and inline checkout — release review

Scope: approved semantic interpretation, multilingual conversation, bounded redacted context, inline canonical cart/request/checkout/payment, and the approved 24-hour demo limits. No new payment provider, real-money activation, database migration, dependency, release workflow, authentication or authorization change.

## Implementation and evidence

- Authenticated text reaches the production Gemini path before lexical FAQ/catalog shortcuts. Optional protocol v1 preserves legacy responses. Gemini emits a strict allowlisted proposal; schema, published product/variant and owned order checks run before a proposal reaches the client. No model command can write an order, cart, approval, payment, refund or receipt.
- Free conversation and clarification return zero commands. Multiple dependent goals ask for priority. Interface locale remains Vietnamese/English; generated content can use the customer's language, with separate content language metadata and automatic bidi direction.
- Up to six previous turns are redacted and bounded before Google Cloud receives context. The explicit payload authorization is in APPROVAL.md. No recipient form values or private account records are added. Redaction is imperfect; the interface explicitly asks customers not to provide private information.
- Selection resolves against current UI context and cannot invent IDs, quantities or variants. A deliberate Add to cart action re-reads product version/variant. Canonical cart mutation and checkout handlers retain idempotency and customer confirmation. Busy-state propagation blocks conflicting navigation during requests.
- Inline navigation defaults to the original router outside Ask. Checkout still requires recipient/price review and explicit confirmation. Provider authorization can leave the site. Existing production checkout is allowlisted SePay sandbox, not real-money commerce for all customers.
- No executable plan is persisted in conversation history. Current source, declarations, callers, tests and Git diff were reviewed in DEGRADED repository intelligence mode: this isolated checkout has no copied CodeGraph/CocoIndex index. The planning checkout had READY indexes; no exhaustive graph claim for the release checkout.

## Review cycles

1. BLOCKED: real Gemini generated unrelated variant fields for two budget searches. Fixed provider schema with separate command variants; strict admission retained. Current-schema multilingual provider set: 13/13 pass, including both budget regressions. Initial failed attempts remain disclosed in PROVIDER-EVALUATION.json.
2. BLOCKED: cart failure text was hidden, mobile clarifications could remain behind the task pane, and purchase navigation could interrupt a pending component. Fixed error rendering, conversation visibility and busy propagation. Browser scenarios cover current source at 1440/390/320 pixels, stale-price rejection and provider error recovery. Historical local fixture import/locator failures were corrected without loosening business assertions.
3. Source review: payment-word matching could reject legitimate negation. Valid semantic commands now survive while model payment claims are replaced by neutral, non-transactional text; legacy behavior is unchanged. Added handler-level tests proving no cart/order writes and retained paid-call reservation on rejection. Added redacted-history and invalid-command coverage. A completed prior order also hid a newly selected product; separate the old-order view from the explicit new cart candidate, with a dedicated sixth browser regression. Final release/production readback remains a separate gate.

## Checks and boundaries

| Gate | Evidence |
| --- | --- |
| TypeScript frontend + Functions Node 22 | `npm run typecheck` |
| Static analysis | `npm run lint`, `git diff --check` |
| Unit regression | `npm test`: 191 files; final count in completion receipt |
| Browser integration | `tests/browser/ask-semantic.config.ts`: six scenarios; real components with synthetic transport/data fixtures, not production proof |
| Canonical HTTP integration | HTTP-EVALUATION.json: 11 passed checks against shared demo Auth/Firestore/Functions/Storage; demo payment and receipt, not external provider evidence |
| Provider interpretation | PROVIDER-EVALUATION.json: real Vertex, synthetic inputs/catalog only; no actual customer data |
| Production build and release contracts | `npm run build`; Node release108/deep-review tests; public config tests |
| Approval scope | `validate_implementation_approval.py --record .../APPROVAL.md --base-ref f9e323ee...` |
| CI integration/rules/audit | Required existing CI, pending exact commit readback at candidate preparation |
| Migration | Not applicable; additive optional response fields and existing settings only |
| SEO/GEO | No public indexing, metadata or crawler changes |
| Observability | Existing budget/operation ledger and answer-rejected reason labels; no prompts or private payload logging added |

Profiles used: universal, TypeScript/JavaScript, frontend HTML/CSS, web-app, API, database, concurrency, visual design and product content. Applied code-review, code-quality-review, security-review and final-implementation-review. No new motion. Existing reduced-motion and native dialog behavior retained.

## Deployment and rollback

Deploy through the existing main release workflow and verify its exact commit/artifact readback. After successful release, renew the existing AI and purchase-test policies for at most 24 hours using updateTime preconditions. Preserve tester allowlist, pricing, terms, provider, global 50,000 VND ceiling and every spent/reserved counter. User AI limits are the approved 20,000 VND and 6/minute, not unlimited chat. The source ceiling ends 2026-10-19T00:00:00Z, before the model retirement on October 20.

Rollback: disable the AI activation using a guarded policy version update, or revert this isolated commit and release through the existing pipeline. Do not reset counters, relabel test orders, delete financial records, replay unknown payment requests or revert other work.

Current Google sources checked 2026-10-17: [standard text pricing](https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing), [model lifecycle](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/model-versions), [structured output](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/capabilities/control-generated-output).

Residual limits: probabilistic interpretation; one supported command per turn; only text uses this protocol; signed-in verified Google accounts; no unrestricted Gemini consumer-product tool parity; interface forms remain their existing locale; external sandbox provider completion and production smoke need live evidence. Global remaining budget includes prior reservations. No production completion claim until those gates have readback.

Provider evaluation totals: 44,437 input tokens and 6,601 output/thought tokens across 52 completed calls; API-equivalent estimate USD 0.0070841 at the checked standard text prices. Actual billed cost and coding-agent token usage: Unavailable. Memory candidates: None. Runtime reporting CLI is unavailable in PATH; this source-bound manual report is the fallback, not a fabricated runtime receipt.

## Follow-up review: no-diacritic and code-switched quantities

4. BLOCKED: an expanded eight-case real-provider set passed six cases but dropped a replacement quantity in a code-switched sentence and treated a relative addition as the final total. The production run 39078974280 was cancelled during quality checks before build/deploy. Strengthened the general semantic normalization instruction and quantity field description: resolve number words, compute the final total from current selection, include all unambiguous corrections, and ask a follow-up rather than silently omitting a requested field. No exact-phrase routing, aliases or regex were added. The two failed inputs both passed with the revised provider instruction/schema. Expanded evidence is in MIXED-LANGUAGE-EVALUATION.json.

This follow-up stays inside the approved natural language interpretation scope and the user's explicit steering to support accents, omitted accents and English/Vietnamese mixing. No action authority, model, budget, provider, dependency, UI control or payment behavior changed. Current full regression/typecheck/lint and exact follow-up CI are required before release. Prior 13-language-case results establish the prior prompt only; the revised prompt has two direct provider regressions, not a claim that every previous example was rerun.

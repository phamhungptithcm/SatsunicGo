# Ask production demo: investigation and approval plan

Status: PLAN_PENDING_APPROVAL. No application or production changes made.

## Evidence and intelligence brief

- Repository revision: 22214b64743d6abbcaf4162382b6e53605348adc. Existing unrelated untracked work preserved.
- Repository Intelligence Gate: DEGRADED; CodeGraph and CocoIndex health passed but worktree indexes stale. Conclusions below use targeted current source and browser evidence; no completeness claim.
- Production browser: https://satsunicgo.web.app/; query `Tìm sản phẩm đồ gia dụng Nhật Bản có sẵn trong danh mục` enters processing, then shows `Em chưa thể trả lời lúc này`.
- Production /products shows `Danh mục đang được cập nhật`; this establishes the visible empty state, not the database count or reason.
- Read-only gcloud describe for `ask`, project `satsunicgo`, region `asia-southeast1`, returned 404. Frontend effective Firebase project/region and deployed-source identity still need verification; do not assume the Hosting site ID proves backend identity.
- Current src/features/ask/transport.ts calls Firebase callable `ask` using src/shared/firebase.ts configuration.
- Current functions/src/ai/ask.ts calls assertPaidAskReadiness before model execution. functions/src/ai/ask-paid-gate.ts deliberately denies all paid generation, including a valid pilot policy. Do not bypass this cost/security control for a screenshot.
- Current Ask.tsx searches published catalog and uses model fallback when it cannot return catalog matches. Public FAQ can answer before search/model. packages/domain/ask-workflow.ts shoppingIntent omits some natural draft phrasing (for example `Soạn yêu cầu mua hộ ...`), allowing FAQ routing; observed prior browser response was workflow guidance.

## Outcome and boundaries

Capture real production outcomes: listed product result with review of selection, and an explicit custom request draft with its next step. Screenshots must distinguish draft, submitted request, paid order, and staff procurement. No customer data, invented inventory, fake waiting state, automatic payment, or staff-state fabrication.

## Smallest staged implementation plan

1. Read-only deployment/config investigation: verify effective frontend public project and region, callable inventory, deployed build identity, catalog read failure versus empty publication state. Inspect only metadata and aggregate/public catalog evidence; no private customer records. No changes until this evidence resolves the deployment delta.
2. packages/domain/ask-workflow.ts and src/features/ask/Ask.tsx: recognize explicit request-drafting language before FAQ fallback; keep catalog matching before custom request preparation. Preserve multi-goal clarification and explicit action confirmation. If a deterministic draft is needed, accept only explicitly supplied fields, validate using existing schemas, and ask for missing fields. Never infer absence from a bounded search.
3. src/features/ask/Ask.tsx, catalog-search.ts, and transport.ts as required by step 1: distinguish no catalog matches, read failure, and unavailable model service; offer the actual products/request route. Do not turn an unavailable response into a success. Do not change paid gate, payment, authentication, authorization, rules, or provider spending policy.
4. Real catalog publication is a separate production action: review existing public product records and readiness/price/variant authority, prepare the exact proposed publication list, obtain approval, then publish through the established flow. Do not generate inventory to populate screenshots.
5. If success requires deploying a missing callable or enabling a paid provider, produce a separate delta plan with deployment identity, provider cost bounds, reviewed authority, and rollback before implementation. The present plan does not authorize removing paid-generation controls.

## Validation and acceptance

- Focused unit regressions: tests/unit/ask-workflow.test.ts, catalog-search027.test.ts, ask-language-query040.test.ts and ask-transport.test.ts where behavior changes; cover explicit draft language, real match, no match, failed read, unavailable callable, and multi-goal input.
- Browser validation against shared http://127.0.0.1:5207 only; preserve shared emulator data and coordinate runtime ownership. No new server.
- Product Language Gate: read write-product-content skill; inventory changed strings and states; complete product-content-review with in-context evidence. TypeScript/React/Firebase profiles and focused typecheck apply.
- Fresh mandatory final-implementation-review and quality/completion reports after approved implementation; local evidence does not prove production.
- After separately approved release, verify both real production flows end-to-end and capture result/next-step screenshots. A real procurement state requires an existing properly authorized paid order and actual staff event; never manufacture one for demo.

## Risks and rollback

Medium frontend/domain risk: intent ordering may regress FAQ, multi-goal or catalog/custom routing. Production deployment, catalog publication, provider spend and financial workflows remain separate higher-risk gates. Roll back an approved frontend release to its recorded prior artifact; do not roll back or mutate orders/catalog blindly.

Remaining work: effective deployed config, catalog availability reason, deployment delta, plan approval, implementation, review, release approval and successful production captures. Production demo readiness: NOT_READY. Tests: NOT_RUN (investigation only). Memory candidates: None. Exact token usage/cost: unavailable.

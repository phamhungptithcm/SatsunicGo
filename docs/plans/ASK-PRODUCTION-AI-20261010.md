# Ask production AI activation — plan v1

Status: APPROVED for implementation and bounded production rollout. Human evidence: `../reviews/ASK-PRODUCTION-AI-20261010/APPROVAL.md`. Customer ceiling: 50,000 VND; maximum activation window: 24 hours. Production activation remains NOT_RUN. The initial investigation snapshot below is historical; see the current task review/report for subsequent evidence.

## Evidence and repository intelligence brief

- Baseline HEAD: `99822aae502cc75406184ee345e4527c6e0db66d`. Shared worktree contains extensive unrelated changes, including Ask UI, workspace, release, payment and email work. Preserve all existing changes; isolate the approved candidate and recheck drift before release.
- Repository intelligence: DEGRADED. CodeGraph and CocoIndex MCP queries returned useful source and related plans. The gate reports stale indexes, and its local CocoIndex health probe cannot write its daemon log. Source was inspected directly for critical conclusions. No completeness claim.
- Current source flow: `Ask.tsx` deterministic/catalog/workflow paths and model transport → `ask` callable → verified Google authentication → approved knowledge answer → production `pilotAnswer` → `generatePilot` → Vertex countTokens → transactional lifetime reservation → one generateContent attempt → schema validation and current-context recheck.
- `functions/src/ai/ask-pilot.ts`: pricing expiry `2026-10-08T00:00:00Z`; model `gemini-2.5-flash-lite`, location `us-central1`, 10,000 input/800 output tokens, thinking disabled, 1,000 VND reservation, 10,000 VND lifetime ceiling. Policy matches one UID; reservation also requires active unlocked OWNER. Thus current source cannot enable customer AI by settings alone.
- `functions/src/ai/ask.ts`: exact `satsunicgo` branch uses the pilot; the alternative `assertPaidAskReadiness` always denies generation. `releaseCapabilities.ai` is false, but flipping it alone does not make this flow work.
- `functions/src/workspace.ts`: existing `saveAskPilotPolicy` uses OWNER and recent MFA, sets a maximum 24-hour window bounded by code expiry; `readOwnerConfiguration` exposes pilot readiness/budget. Preserve authenticated administration; no direct production document datafix.
- Live metadata read: `gcloud functions describe ask --gen2 --region asia-southeast1 --project satsunicgo` reports ACTIVE, revision `ask-00012-sec`, Node 22, updated `2026-10-10T01:19:57.723942369Z`. This proves deployment existence only; deployed-source equivalence, live policy, remaining budget, IAM/model availability and actual generation remain NOT_VERIFIED.
- Prior documents distinguish a 10,000 VND Ask trial from a separate 50,000 VND research budget. Neither is authorization for new customer spend. Do not merge, replenish, reset or release uncertain reservations.

## Outcome and scope

Enable general text AI assistance for verified signed-in customers, using published approved evidence, current catalog and authorized order context. Stage rollout through an OWNER canary before customer admission. Guests retain current public deterministic help; anonymous paid AI, images and paid web research are deferred. Business transactions remain separate explicit authenticated actions.

High risk: paid provider I/O, customer authorization, context privacy and concurrency. Stack: React/TypeScript/Vite, Firebase callable Functions on Node 22, Firestore and Vertex AI. Applicable profiles: universal, TypeScript/JavaScript, API, database, concurrency, web-app, agent-runtime/evaluation, devops and product-content when displayed meaning or text changes.

## Implementation scope by file and function

1. `functions/src/ai/ask-pilot.ts` (`checkPilot`, `generatePilot`, `verifyPilotProvider`, request/reservation helpers), or a new narrowly scoped production admission module: keep the legacy pilot separate; implement strict versioned customer policy, code-bounded model/location/expiry, exact production/database identity fences, explicit audience, global and per-user admission limits, fixed reservation envelope and transactional budget ownership. Count the complete serialized request. Reserve before paid I/O; retain failed/unknown reservations; no automatic retries or top-ups. Recheck policy/account authorization immediately before dispatch. Verify current model lifecycle, regional support, billing SKU and full cost envelope before selecting production constants. Do not merely extend an expired date.
2. `functions/src/ai/ask.ts`: route production model requests through the approved customer admission path after existing approved knowledge handling. Keep verified Google, App Check, account locks, owner-scoped order/conversation access, cancellation and validated output. Do not enable the currently denied multi-turn Genkit path without bounded execution evidence.
3. `functions/src/ai/ask-pilot-answer.ts` and `server-context.ts` as needed: extract/reuse text response validation for authorized customers; preserve source-ID allowlist, context stamp, missing-evidence uncertainty, explicit draft fields and catalog/custom-request distinction. Server remains authoritative; model cannot submit, spend, mark paid, refund or change staff state. Verify current approved payment semantics against authoritative workflow before changing prompts.
4. `functions/src/workspace.ts`: add separate OWNER/recent-MFA customer policy administration and sanitized readback using existing idempotency/version/audit patterns. Customer policy includes a fixed approved total budget and expiry; disabling closes admission without resetting the ledger. No UID or role grant, production fixture, arbitrary provider endpoint or secret values.
5. `src/features/settings/AskPilot.tsx` and its relevant types: show verified customer AI policy/budget separately from the OWNER trial, with unknown/error/expired/exhausted states. `src/features/ask/Ask.tsx`/transport only if needed for sign-in, exhaustion, recovery or cancellation behavior. Complete write-product-content review and VI/EN in-context evidence for every changed string/state before handoff.
6. Tests: extend `tests/unit/ask-pilot106.test.ts` or add `ask-production-admission.test.ts`; update Ask integration/context/transport and workspace policy tests. Add meaningful rules/emulator/browser checks for any new policy/ledger boundary. Do not alter rules or release infrastructure unless a separately approved delta proves necessary.
7. Release: freeze approved Ask-only source and artifact hashes; run existing preflight; deploy only affected callable functions and paired Hosting when required, using the repository release mechanism. Preserve unrelated shared WIP. Any required IAM/API expansion gets a precise delta plan. Record previous function/Hosting versions and disable-policy rollback; no database deletion or ledger reset.

## Validation and acceptance

- Authorized customer succeeds; guest, unverified, locked, foreign owner/order/conversation and missing App Check fail appropriately.
- Concurrent admission cannot exceed approved lifetime/global/per-user bounds; stale/disabled/expired/malformed policy and unknown pricing fail closed. No paid request before reservation or after revoked authorization; timeout/cancellation/unknown provider outcome retains reservation and never blindly retries.
- Exact serialized token accounting, output/thinking bounds, malformed output, injected user/history/image text, fabricated citations/actions and stale context are covered. No private prompts/PII/credentials in logs or cost ledger.
- Real production canary through actual hosted Ask, authenticated session and App Check; capture provider usage and deployed revision/artifact match. Then customer audience smoke with an authorized test account. Metadata, mock tests and HTTP 200 alone do not pass production acceptance.
- Run affected unit/integration/rules/browser checks, compilation, lint, product-content review where applicable, release preflight and fresh final-implementation-review. Fix approved findings and repeat review until current evidence passes.
- Rollback: close customer admission using authenticated OWNER control and restore previous verified Functions/Hosting artifact if required. Preserve conversations, orders and cost reservations.

## Decisions required before protected implementation

Approve plan v1 and supply the customer AI total spending ceiling in VND and validity window. Recommendation: verified signed-in text customers after an OWNER canary; no anonymous paid generation. The prior OWNER trial ceiling remains unchanged and is not an additional allowance. No paid canary starts until approved available budget and provider bounds are verified.

## Current report

- Investigation and concrete plan: complete. Implementation, deployment and live customer acceptance: NOT_RUN pending plan/budget approval.
- Baseline validation: `npx vitest run tests/unit/ask-pilot106.test.ts tests/unit/ask-approved-knowledge-caller.test.ts tests/unit/ask-run-guard.test.ts tests/unit/ask-transport.test.ts` — 4 files, 53 tests passed. Synthetic unit evidence only, including historical clock fixtures; does not prove today's provider availability or pricing readiness.
- Compilation/lint/integration/browser/provider smoke/final implementation review: NOT_RUN; no implementation candidate exists yet. Production readiness: NOT_READY.
- No production mutations, paid calls, runtime restarts, commits or pushes by this task. Agent token usage and actual billed cost: Unavailable. Memory candidates: None.

Provider references for implementation verification: [Vertex pricing](https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing), [thinking controls](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/thinking). Search results were checked in this investigation; account-specific SKU, lifecycle and cost acceptance still require verification.

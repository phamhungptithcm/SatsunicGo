# SATSUNICGO-ASK-KNOWLEDGE-022 v1

Status: concrete implementation plan awaiting reviewed-plan approval.
The user's `apporved` message approves the overall knowledge-first direction. It predates this file-level plan and must not be represented as approval of its exact implementation boundaries.

## Evidence and intelligence brief

Base HEAD: 3bd0d093255963a2cbf66ddd80d27456da7076e0. The working tree contains extensive unrelated WIP, including ask.ts; preserve it and capture a task-start snapshot before implementation.
Repository Intelligence Gate: DEGRADED. CodeGraph and CocoIndex health queries pass on the latest check, but both indexes are stale. A previous refresh attempt failed on CocoIndex daemon-log permissions. Bounded source evidence supports this plan; complete graph/semantic impact coverage is unavailable.
Context repository-map/build-test/architecture documents are placeholders.
Stack verified from manifests: TypeScript, React/Vite, Firebase callable Functions, Firestore, Node 22, Genkit 1.42.0 and Vertex AI.
Applicable profiles: typescript-javascript, web-app, product-content.

## Current flow and requirement gap

Ask.tsx -> transport.ts callable `ask` -> functions/src/ai/ask.ts -> settings/ai enabled+approved+Gemini model checks -> published posts and bounded tools -> Vertex AI -> structured answer -> source ID allowlist -> rendered source links.
Initial context selects eight published posts without question-based ranking and truncates each body to 1,800 characters. searchPublished selects at most 30 records before matching any whitespace-delimited term and returns five matches. Relevant answers can therefore be outside the scan or truncated content; this is a source-verified limitation, not a verified customer incident.
Existing tools already cover published products/plans, fee policy, authorized order reads, and draft preparation. Keep those responsibilities and authorization checks intact.

## Proposed first increment

Improve retrieval over existing published posts, using a pure bounded chunk/ranking helper shared by initial context selection and the posts branch of searchPublished. Normalize Vietnamese accents/case, suppress stopword-only matches, rank substantive term overlap, and select bounded relevant excerpts rather than first-body prefixes. Preserve original post citation IDs and exact source text. No result must be represented as proof that the entire knowledge base has no answer.
Use deterministic paginated document-ID reads, at most 100 published posts per callable invocation, at most 20,000 characters per document, at most eight selected excerpts and at most 12,000 total context characters. Reuse the request-local post pool for subsequent tool calls. Return internal scan-limit metadata to the model and instruct it to disclose insufficient evidence rather than make definitive unsupported policy claims. Search ranking is lexical and must not be advertised as semantic/vector search.
Use existing publication workflow for knowledge entry; published is the current eligibility gate, not proof of an additional approval workflow. Prepare an operator guide and FAQ authoring template; do not invent fees, promises, or approved business policy.

## File and function boundaries

- Add functions/src/ai/knowledge-retrieval.ts: validated published-document conversion, normalization, bounded chunking, ranking and context-budget selection. Ignore malformed documents rather than admitting invalid citations.
- Edit functions/src/ai/ask.ts: bounded request-local published-post loading; replace initial eight-post context; route only the posts tool branch through the helper; supply retrieval limitations in model context. Preserve product catalog tool branch, tool-call cap, response schema, citation allowlist, auth, rate limiting, streaming and ai.stopServers cleanup.
- Add tests/unit/ask-knowledge.test.ts: ranking and multilingual retrieval, evidence beyond initial body prefix, malformed source rejection, budgets, no-match and stable source IDs.
- Add docs/ASK_KNOWLEDGE.md: publishing instructions, authoring template, knowledge coverage limits, maintenance workflow and live acceptance checklist.
- Add task-specific docs/reviews/ASK-KNOWLEDGE-022-* evidence and docs/approvals/SATSUNICGO-ASK-KNOWLEDGE-022.md after approval.

## Impact, risk and constraints

Risk: Medium. Changes affect customer-facing answer evidence and Firestore read volume. The 100-document cap bounds reads but increases cost relative to eight; paging consumes callable latency under the existing 30-second timeout. Record measured fixture behavior and keep live cost/latency unknown until verified. No persistent cache or new writes; publication changes are reread each invocation. Overload/model errors retain current safe failure behavior.
No dependency, database schema/index/rules, callable contract, model/region, frontend, auth, payment, customer-data ingestion, deployment or cloud-enablement changes. No fine-tuning or File Search migration. Never upload private orders or chat logs into public knowledge. Preserve unrelated edits. Material deviation requires delta approval.
Rollback: revert only this task's hunks/new files to the captured dirty-tree baseline. Turning off settings/ai is an existing operational control, not authorized for autonomous mutation by this plan.

## Validation and handoff

Run focused retrieval tests plus existing ask-content, ask-transport and ask-workflow unit regressions, npm run typecheck, and scoped ESLint. Verify only published documents are queried; empty/invalid data cannot create citations; scan limits and input sizes remain bounded; relevant text after 1,800 characters is found; accents/no accents and English cases rank correctly; product checkout/order authorization behavior remains unchanged.
Use synthetic emulator integration fixtures if an owned environment is available; never reset shared emulator services. Provider-backed Vietnamese/English answer quality, unpublished-content exclusion, unsupported-policy abstention, real citations and cloud latency/cost require separate live acceptance evidence.
Apply write-product-content to changed model instructions and resulting displayed-data meaning; inventory affected states and collect in-context evidence. Complete quality gates and fresh final-implementation-review cycles before successful implementation handoff. No live model outcome can be certified by pure retrieval unit tests.

## Alternatives and unknowns

Gemini File Search or a vector index offers semantic retrieval but adds ingestion, access/lifecycle governance, cost and deployment scope. Defer until lexical evidence shows the need. Fine-tuning is not proposed for changing business facts.
Unknown: cloud deployment/model availability, complete corpus size/quality, reviewed policy ownership, live retrieval cost and customer answer quality. Business owner must approve factual FAQ content before publication; this engineering plan does not approve it.

## Approval

Approve `SATSUNICGO-ASK-KNOWLEDGE-022 v1` to authorize the paths and behavior above. Implementation approval does not authorize deployment or enabling Gemini in cloud settings.

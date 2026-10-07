# Ask knowledge operations

Ask uses published posts as public knowledge, with request-local lexical retrieval. It does not train Gemini weights and does not ingest customer orders or conversation logs into a public corpus.

## Authoring and publishing

Use the existing post editor to prepare a draft. Have the business owner check factual claims before publishing through the existing workflow. `published` is the eligibility flag; it does not prove a separate approval system exists.

Suggested article template:

- Title: one customer question, such as “Cách gửi yêu cầu mua hộ”.
- Body: approved answer, steps the customer can take, exceptions and support route.
- Include Vietnamese and English terms customers actually use when appropriate.
- State the policy effective date, owner and authoritative reference in the body when relevant. These are authoring conventions, not new database fields.
- Do not invent fees, delivery promises, refund rights or availability. Never publish personal customer details, receipts, credentials or internal margins.

Start with approved buying-process, payment, shipping, returns and membership explanations. Pricing and order state remain tool-backed; do not duplicate changing values into generic FAQ articles.

## Coverage and maintenance

Each invocation scans at most 100 published posts in document-ID order using pages of at most 25. Each body is capped at 20,000 characters. At most eight relevant excerpts (1,200 characters each; overlapping windows) are provided initially, with a 12,000-character content budget. The posts tool returns at most five matches from the same request-local pool. Accents/case are normalized for matching; original evidence text and source links are preserved. Retrieval matches whole words and ranks overlap; it is not semantic search, automatic translation or a guarantee of a correct answer.

Only the best excerpt per article is selected. Context counts text/title/ID characters, not JSON serialization overhead or token counts. A scan reaching 100 is conservatively treated as potentially incomplete. No match never establishes that the full corpus lacks an answer. Prefer focused articles; split overly long guidance into separately reviewable posts. Review coverage before growing beyond 100 posts.

No persistent retrieval cache is used: publication changes are read on the next invocation. Firestore pagination is not a single consistent snapshot across all pages. Owner review should periodically remove outdated or conflicting guidance; authoring dates do not automatically expire posts. Chat feedback requires human review before it becomes published knowledge.

## Acceptance and operations

Before cloud enablement, verify the configured Gemini model, IAM, region, existing App Check/auth/quota controls and budget separately. Test real Vietnamese/English questions, sources, insufficient-evidence responses, unpublished exclusions and provider latency/cost against the current candidate. Local unit checks cannot prove model compliance or customer answer quality.

This change does not enable Gemini, deploy functions, change customer permissions or modify payment workflows. Roll back only the task-specific hunks/new helper to its captured dirty-tree baseline. Follow the existing approved operational process for AI settings.

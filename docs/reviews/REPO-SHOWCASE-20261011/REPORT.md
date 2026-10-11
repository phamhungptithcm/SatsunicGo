# Repository showcase · 2026-10-11

## Scope and impact

The user requested a professional GitHub repository presentation, a README aligned with current project code, and an Ask Anything demo covering catalog purchases, external references, custom requests, fees, and order tracking. The user subsequently requested short, friendly Vietnamese video copy without jargon or repetitive explanation.

Changes are restricted to README, demonstration media, and this evidence directory. GitHub About description, website, and topics were also updated and read back. No application, authentication, database, provider, runtime, dependency, or deployment configuration was changed. Existing unrelated work is preserved. No protected implementation changes were required.

Repository intelligence: **DEGRADED**. CodeGraph and CocoIndex were queried in order; both indexes were stale and the CocoIndex health check failed. Relevant source was verified directly. Local source baseline: `99822aae502cc75406184ee345e4527c6e0db66d` plus existing worktree changes. Remote main was observed at `9f52b2fdd26b82266fd5953f2f1e247e1bc8fbea` before publication; it has progressed independently.

## Deliverables and acceptance

| Criterion | Result | Evidence |
| --- | --- | --- |
| GitHub description, website, topics | PASSED | Authenticated `gh repo edit` and subsequent readback; website HTTP 200 |
| README grounded in current code | PASSED within inspected scope | Ask, CatalogChat, WebDiscovery, knowledge, research-discovery, package manifests, release workflow |
| Video covering requested journeys | PASSED as illustration | 8 scenes, 72 seconds, H.264, 1440 × 900, captions |
| Full live authenticated end-to-end demo | NOT_FULFILLED | Guest session lacked catalog results; no approved authenticated/provider scenario executed |
| Friendly, concise Vietnamese copy | PASSED for storyboard | Revised all 8 scenes after direct user feedback; see product-content review |
| Publish documentation | Branch/PR, separate from production | Main pushes trigger production release; merge remains pending |

No percentage is assigned to the live-demo criterion. An illustrative video is not substituted for live acceptance evidence.

## Checks

- Local Markdown links: 16 checked, zero missing targets.
- README rendered with the installed `marked` package at 1440 and 390 pixels; no broken images. This is a local GitHub-style proxy, not a GitHub-rendered acceptance test.
- Eight storyboard scenes rendered. Panel bottoms cleared subtitle tops for all eight scenes. The revised demo label clears the panel.
- Video probed and decoded with FFmpeg; duration, codec, dimensions, and file integrity checked.
- `git diff --check` scoped to deliverables.
- No application tests/builds rerun: no execution paths changed. Existing dirty source is outside this task's certification.
- No new dependencies installed. No secrets, customer records, real payments, or production writes used in the media.
- Runtime ledger: NOT_RUN; `ai-agent-kit` executable unavailable. This report is a manual evidence record, not a runtime receipt.

## Review cycles

1. Found that a complete live demo could not be supported by this guest session. Corrected framing to an illustrative storyboard, disclosed simulated panels/data, and retained raw local recording separately. Also found a small label/panel overlap in a dense scene and moved the label upward. Rendered all scenes again.
2. User requested shorter, warmer language. Rewrote every scene, removed panel/variant/backend jargon and repeated caveats, kept a small persistent illustration label, retained necessary customer checks, and moved detailed conditions into demo notes. Re-rendered all eight scenes and rechecked caption separation.
3. Final documentation/media review: reviewed actual README diff, source claims, all scene copy, captions, links, rendered proxies, media metadata, scope, and publication path. **PASSED for documentation and illustrative media only**. Live E2E remains NOT_FULFILLED; production readiness NOT_VERIFIED.

## Quality gates

Requirement match: PARTIAL for the overall request due to missing live E2E video. Security/privacy: PASSED for scoped artifacts. Code quality: PASSED for documentation/standalone storyboard. Business semantics: PASSED within source-inspected scope. Failure/recovery claims: PASSED; unavailable data is not portrayed as verified. Product content: PASSED for static documentation/illustration; no application copy changes. API/database compatibility, migration, runtime observability: NOT_APPLICABLE because these were not changed. Deployment: NOT_RUN and not authorized through this documentation publication.

## Remaining work and production status

To record real actions, provide an approved demo identity and populated catalog, verify external discovery/provider eligibility, and record catalog confirmation, selected-source draft persistence, custom-form handoff, and authorized tracking outcomes. The clarification seen for a combined fee question should be investigated under a separate approved application change if it is reproduced as a defect.

Production readiness: **NOT_VERIFIED**. The video carries no claim of settlement, shipment, fulfillment, AI-provider acceptance, or complete system readiness. Git worktree remains dirty with unrelated concurrent changes.

Token usage: provider-reported totals unavailable. Cost: unavailable; no estimate invented. Memory candidates: None.

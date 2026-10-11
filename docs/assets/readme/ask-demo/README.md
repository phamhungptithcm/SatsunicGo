# Ask Anything product walkthrough

[Watch the MP4](ask-anything-demo.mp4) · [Vietnamese captions](captions.vi.srt) · [Editable storyboard](storyboard.html)

72 seconds, 1440 × 900, H.264 MP4, Vietnamese on-screen captions, no audio. The selected products, sources, quantities, and order timeline are illustrative. Panels are explanatory compositions, not pixel-identical screenshots of the application. No purchase, payment, shipment, or external search was executed to produce these scenes.

## Chapters

| Time | Scene |
| --- | --- |
| 00:00 | Ask Anything overview |
| 00:09 | Search listed products |
| 00:18 | Edit a selection and confirm adding to cart |
| 00:27 | External seller references, when enabled |
| 00:36 | Prepare a custom purchase draft and review the form |
| 00:45 | Published fees and cost conditions |
| 00:54 | Authorized order tracking |
| 01:03 | Continue with Ask |

## Source anchors

- `src/features/ask/Ask.tsx`: search routing, external discovery eligibility, order lookups.
- `src/features/ask/CatalogChat.tsx`: variant, quantity, total, confirmation.
- `src/features/ask/WebDiscovery.tsx`: reference selection and draft preparation.
- `src/features/ask/WebResearch.tsx`: reviewed seller-reference flow.
- `src/features/ask/useActionPreview.ts`: action preparation and review.
- `functions/src/ai/ask.ts`: published information, model boundaries, checkout policy.
- `functions/src/ai/research-discovery.ts`: server-side discovery policy.

## Actual local observation

On 2026-10-11, the shared server at `127.0.0.1:5207` opened Ask for a guest. A CeraVe query led to the market clarification path, with no catalog results in that session. A combined buying/shipping-fee question returned a clarification. A raw local recording is kept under `output/playwright/readme-showcase/ask-anything.webm` and is excluded from the public showcase. Full authenticated catalog checkout, external provider discovery, autofill, and order tracking were not executed in this documentation task.

The video illustrates source-backed journeys and discloses the simulation throughout. It does not replace acceptance testing. To create an end-to-end live recording, use an approved demo account and populated catalog, confirm discovery/provider eligibility, and record each persistence and payment outcome separately.

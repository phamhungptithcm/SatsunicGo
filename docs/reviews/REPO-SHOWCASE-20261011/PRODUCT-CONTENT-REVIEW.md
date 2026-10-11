# Product Content Review

Scope: English GitHub README/About and Vietnamese illustrative video. Audience: potential customers, collaborators, and developers. Goal: explain Ask's shopping journeys clearly while preserving customer confirmation and financial meaning. Platform: GitHub Markdown and a captioned video; no Apple platform UI or HIG compliance claim. Reviewer: Codex, 2026-10-11.

## Context and inventory

Verified against current source: catalog selection/quantity editing, external-source panel and authentication/enablement conditions, draft selection, request-form handoff, published fees, authorized/guest-code tracking, full initial checkout payment, and server-authoritative outcomes. The app was opened at the shared 5207 listener without restarting or seeding it.

Inventory: every README section through Repository guide; About description/website/topics; all eight storyboard headings, descriptions, questions, panel labels, examples, explanatory notes, captions, and persistent illustration label. The existing Install and run section was retained. `storyboard.html` and `captions.vi.srt` contain the complete current video inventory. Rendered screenshots: `output/playwright/readme-showcase/scene-0.png` through `scene-7.png`; README desktop/mobile previews in the same directory.

Assumptions: English repository presentation for collaborators; Vietnamese video for customers. User explicitly requested friendly short copy. Simulated sources, product choices, and order statuses are examples. Detailed availability/limitations belong in adjacent demo notes. No prices, delivery deadlines, or purchase success invented.

## State coverage

| State | Result and evidence |
| --- | --- |
| Default/action | PASSED: concrete questions and next steps in all 8 scenes |
| Loading/pending/disabled | NOT_APPLICABLE: static explanatory media, no executable purchase controls |
| Empty/no result | PASSED: “Chưa thấy món? Mình tìm thêm”; README clarifies bounded search |
| Success | PASSED: example timeline labeled illustrative; no claim a real payment occurred |
| Error/recovery | PASSED: README offers catalog, form, support when lookup cannot be verified |
| Offline/stale/partial | PASSED: reference prices/availability require checking; no missing-data-as-zero |
| Unauthorized | PASSED: signed-in/owner or supported guest-code flow stated |
| Confirmation | PASSED: customer checks variant, quantity, price, form, and checkout |
| Destructive | NOT_APPLICABLE: no destructive actions represented |

## Data semantics

Source of truth: domain and server records, not generated text. No monetary amount, metric, delivery estimate, real identity, customer order ID, or private record is exposed. Displayed quantity/size/market/source/timeline values are examples. Video data freshness is not represented as live. New full initial checkout and legacy recorded order workflows remain distinct in README.

## Human Interface principles

| Principle | Status | Current evidence |
| --- | --- | --- |
| Purpose | PASSED | One job per scene, from finding an item through checking an order |
| Agency | PASSED | Customer chooses sources and confirms before purchase |
| Responsibility | PASSED | Illustration disclosed; price/stock uncertainty and payment authority preserved |
| Familiarity | PASSED | “món”, “mẫu”, “nơi bán”, “giỏ”, “xem lại”; removed internal jargon |
| Flexibility | PASSED | Captions, separate SRT and text notes; README preview at wide/narrow widths |
| Simplicity | PASSED | Short headings, one-sentence captions; technical detail moved to docs |
| Craft | PASSED | All 8 scene layouts checked; label overlap corrected and rendered again |
| Delight | PASSED | Warm everyday phrases, calm tone, no pressure or forced celebration |

## Platform and patterns

Platform fit PASSED for static web documentation/video. Plain Markdown navigation, descriptive links and image alt text, readable headings, embedded captions, separate transcript. No Apple-only conventions or copied expressions. Writing/actions, contextual help, confirmation and account boundaries reviewed. Alerts, live regions, touch gestures, focus behavior and interactive-control screen-reader testing NOT_APPLICABLE: no application controls changed. Full screen-reader/video-player certification NOT_RUN; no claim made. Original application accessibility is outside this documentation task.

Gate: **PASSED for documentation and illustrative video only**. Rendered proxy evidence is explicitly identified. Full live product acceptance remains outside this result.

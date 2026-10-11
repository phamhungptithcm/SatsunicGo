# PDF website branding product review

Task PDF-WEBSITE-BRANDING-20261009; reviewer Codex; 2026-10-09. Approved scope: website branding refinement of the existing payment PDF. Audience: Vietnamese purchase customers; task: recognize SatsunicGo and check completed-payment facts. Target: printable A4 PDF with the existing licensed Noto Sans font. Website uses Inter/Arial; identical browser typography is not claimed. Apple platform contract is not applicable; the eight Human Interface principles are applied as a human-centered quality reference without Apple-only expression.

## Verified context and changed presentation inventory

Shared5207/products header inspected through CUA after reload. DOM/source agree on the parcel icon and Satsunic/Go spans. Observed computed colors: icon and Go rgb22,60,255; Satsunic rgb17,28,53. Sources: SiteChrome.tsx and global.css. No invented brand asset. Existing renderer, receipt worker and resource-probe consumers verified; source strings and financial calculations unchanged.

| Location/state | Before | Current | Evidence and purpose |
| --- | --- | --- | --- |
| Every-page brand | All-blue SatsunicGo, no parcel mark | Website parcel paths, navy Satsunic and blue Go | Actual PDF vectors and character colors independently extracted; all five variants |
| Subtitle | Left-aligned at page margin | Aligned beneath wordmark | Six rendered PNGs inspected; unchanged MUA HỘ QUỐC TẾ wording |
| Main/accent colors | Rounded approximations | #111c35 and #163cff to six-decimal PDF RGB precision | Website computed colors and PDF character-color assertions |
| Supporting labels | Previous neutral tone | Website #647087 | Readable in rendered metadata, rows and footer |
| Panel and dividers | Previous neutral approximations | Website #f7f8fc and #e2e6ef | Rendered metadata/summary panels and thin table dividers |

Changed user-facing text inventory: none. Splitting the brand into two draw operations retains extractable SatsunicGo. All five new PDFs have identical text to the preceding copy version after whitespace normalization; text-equivalence.json records this. Retained copy/data semantics are reviewed in PDF-NATURAL-COPY-PRODUCT-REVIEW.md and freshly validated here: payment method, paidAt, timezone, amounts, custom/catalog notes, tax distinction and final-page thank-you.

## State and data coverage

Actual rendered success states: mixed-cart initial, sourcing increment, final increment, catalog-only, and 30-item/eight-page receipt. Initial and both balance totals unchanged. Demo disclosure retained by existing unit assertion. Pending/loading/disabled, empty/no-result, confirmation/destructive: no changed state/control in this static receipt delta. Invalid/failed/offline/stale/partial and unauthorized paths remain unchanged; no new backend or download acceptance claimed. Existing ready immutable PDFs are not rewritten.

Source of truth: same receipt snapshot, VND integer amounts, server paidAt formatted in Asia/Ho_Chi_Minh, actual provider/method. No changed zero/null fallback, estimate, freshness or aggregation semantics. No new personal data, tracking, secret, network call or permission.

## Mandatory Human Interface principles

| Principle | Status | Current in-context evidence |
| --- | --- | --- |
| Purpose | PASSED | Website identity is immediately recognizable without obscuring rows, payment time or total |
| Agency | PASSED | No changed payment action; retained notes explain approval of future custom-goods fees |
| Responsibility | PASSED | Verified site asset/colors reused; sandbox, collected amounts and tax distinction remain explicit |
| Familiarity | PASSED | Same parcel icon and two-color name as the actual website header; Vietnamese wording retained |
| Flexibility | PASSED | Branding repeats on all eight pages; initial and both incremental receipt layouts remain intact |
| Simplicity | PASSED | Local vector mark replaces text-only identity without adding labels, explanation or external assets |
| Craft | PASSED | Wordmark/icon alignment, neutral panels, thin dividers and Unicode text inspected in six current PNGs |
| Delight | PASSED | Consistent website-to-receipt identity and the existing warm closing make the document feel considered |

## Platform, patterns and verification

Printable A4 brand fit PASSED; no browser navigation, responsive control, focus, motion or interaction change. Writing/labels and feedback proportionality PASSED by unchanged text and quiet brand presentation. Alerts/consequential choices, onboarding, permissions/accounts are NOT_APPLICABLE. Vietnamese glyphs and extractable text PASSED. RTL and new locale support NOT_APPLICABLE. Full tagged-PDF/screen-reader certification NOT_RUN; no such conformance claimed.

Visible readability, data meaning, tone, brevity, terminology, state fit, privacy, Vietnamese localization, eight principles and current in-context evidence PASSED for this presentation delta. Six PNGs inspected: initial, sourcing, final, catalog, multipage-1 and multipage-8. Five PDFs pass text/bounds/method/time/thank-you assertions plus all-page exact wordmark/color/vector validation. Initial/sourcing/final/catalog are one page each; long example eight pages. No clipping/overlap found in inspected renders.

The first brand-extractor attempt counted only curves; pdfplumber classifies the two straight parcel segments as lines. Corrected extraction to inspect both object types, preserving all four expected paths and exact color/width assertions. This was a verification-tool assumption, not a renderer defect. No application finding remained after current review. Product Language Gate PASSED within the stated scope.

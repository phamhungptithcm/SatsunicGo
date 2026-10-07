# Studio rendered review — current CSS dependency round 3

## Current bounded update

Reviewed `source-host-compat.css` SHA256 `9cf6da877eab77a2b8e770b9c9e4a7b4b9743cdd663e9b7fa00cd98373a45646`, the enhanced preview dependency assertions, and all three actual original/Go preview screenshot pairs in `output/playwright/release027/studio-style-dependency-round3/results/`. The archive runner log verifies **3 passed**. The separate component round and whole native rerun were pending at this review boundary; no outcome is inferred for them.

The scoped CSS restores original browser heading/list/hr defaults with low-specificity selectors. Explicit original component rules can still override those fallbacks. Font synthesis is restored only within `.blog-surface`; no SVG display rule was introduced, preserving the previously restored inline checklist icons. The new test compares actual original and Go h3/h4, unordered/ordered lists, hr and source-list computed font size/weight/synthesis, list style, margins, padding and border properties, plus author-heading typography. All comparisons remain exact; no tolerances or scope were weakened.

Actual current screenshots visibly restore author boldness, body h3/h4 emphasis, bullets, numbered body/source lists, indentation and horizontal-rule appearance. Preview 768 and 1440 have matching apparent layout/content geometry apart from the disclosed brand text. At 390, original HunpeoLabs breadcrumb wraps to an extra line while shorter SatsunicGo stays on one line, shifting subsequent content approximately 23 pixels; this is visible brand-copy wrapping, not a hidden reset failure. Raw pixel/text metrics remain REVIEW_REQUIRED, not an automatic visual pass. These three rich-preview captures do not verify every component affected by inherited defaults.

The 12 older round-4 screenshot pairs and 57-pass receipt below are **STALE for this new CSS candidate**. Their historical editor/account geometry differences cannot be declared fixed without fresh component captures. Six settings/moderation full-panel original comparisons remain NOT_RUN. Current bounded verdict: observed preview style-dependency parity checks PASS; whole-candidate rendered verification pending. No 100% parity or production claim.

## Historical round-4 review

### Actual CRM host-gap follow-up

Reviewed authenticated Go-only **full-page** round-5 attachments: dashboard 390, account 768 and dashboard 1440 (`studio-parity-complete-round5/results/release-studio-complete027-*/attachments/`). The Studio header/sidebar starts at the image's top; no blank commerce-header-height strip is visible in these three actual application captures. The complete spec's `capture()` calls `page.screenshot({ fullPage: true })`, not an element crop. Therefore these images do **not** confirm an actual CRM gap; pure reference-harness coordinates cannot establish one.

Resolved by targeted source read: `src/features/crm/Workspace.css:427` contains `body:has(main.crmRoot) { padding-top: 0; }`. Actual App provides this main wrapper, so the existing cascade correctly removes the public-header body offset in CRM, consistent with the full-page captures. **No actual CRM gap and no application fix required.** The pure Go harness imports Workspace.css but omits App's `main.crmRoot` wrapper, so the selector does not match there; its ambient header offset is a harness fidelity issue, not actual product evidence. Root released a private Go-5194 harness-only faithful wrapper correction to the component owner; the application source candidate remains unchanged and no global CSS fix is planned. The older six standalone geometry captures retain their disclosed ambient coordinate offsets and cannot certify corrected harness geometry. The prior unconditional-body-padding risk hypothesis is withdrawn after finding the existing scoped override.

2026-10-06. Independent bounded review; repository intelligence remains DEGRADED. Targeted source reads and archived screenshots were used; no runtime, index, source, harness or test changes were made by this reviewer.

## Evidence and scope

`output/playwright/release027/studio-parity-complete-round4/runner.log` records **57 passed, 6 skipped, 0 failed** across the 63-case run. I visually inspected all 12 original/Go screenshot pairs: dashboard, account, editor and preview at 390, 768 and 1440 pixels, under that archive's `results/` directory. Settings and moderation full-panel original-reference comparisons at all three widths remain **NOT_RUN** (six guarded skips); their other functional evidence does not replace these comparisons.

The captured candidate is recorded in `STUDIO_PARITY_CANDIDATE.json`. This review describes that capture, not later edits. During review, `source-host-compat.css` had advanced from captured `a8b0e2ff…` to `23ddeae97327d4d5c6321cc213d2f628c750a87e10574b52728536a9f2771cce`, adding an h3 bold restoration. That later candidate has no rendered verification in this review.

## Findings

1. **Remaining visual parity defect: source-list numbering and indentation.** Original preview shows the ordered source marker and indentation; Go preview loses the marker/indentation, plainly visible at 390 and 768. `source-preview.tsx` uses an ordered list for sources. Tailwind preflight lines 202–205 resets ordered lists to `list-style: none`; the copied preview styles do not restore that list's original browser presentation. This is not a fixture or brand difference. Preserve source numbering in a narrowly scoped compatibility fix and recapture all three preview widths.
2. **Captured author typography differs.** Original preview author-card h3 is bold; round-4 Go is regular at all three widths despite the same author fixture. Original source styles set h3 size/margins but leave its browser-default weight; Tailwind resets heading weights. The later h3 restoration noted above addresses the source cause but still requires a new capture. Byline and dashboard title weights also appear lighter in Go. Both use the same explicit 550 weight; the exact computed-font cause is not established. Host `font-synthesis: none` is a hypothesis, not a verified diagnosis.
3. **Small unexplained geometry differences remain.** Editor heights are original/Go 2636/2629 at 390, 2503/2496 at 768, and 1388/1388 at 1440. Account body rows and dividers shift approximately 10–14 pixels vertically. All expected controls, six-of-nine checklist state and fixture content remain visible; no clipped workflow or functional failure is established by these differences. Exact visual equivalence is nevertheless not proven.

Dashboard compact layout, original checklist icon placement, account blue primary CTA and preview responsive containment are visibly restored. Current captures show no horizontal clipping; the existing no-overflow assertions passed. Raw changed-pixel counts and `textEqual: false` remain review evidence, not automatic parity acceptance.

## Expected integration exceptions and limits

Visible SatsunicGo branding, CRM return navigation, `/posts/` routes and preview brand copy explain some text/pixel differences. The Go preview inner div sits within App's existing main landmark; this avoids a nested main and is an intentional host adaptation. Account reference uses the documented embedded fixture prop. These exceptions are unmasked and should remain disclosed.

The original harness uses synthetic data/auth, Next/router shims and deliberate 503 write transport; Go uses actual local authenticated callables for task-owned fixtures. This is not original SSR/prefetch, live Google/provider, payment or production evidence. The original Hung Pham author-profile route is outside the matched fixture and remains unverified. Six foreign-data-guarded full-panel comparisons are still absent.

**Verdict:** observed functional round passes with the stated skips; rendered parity still has actionable list/typography differences and unclassified small geometry differences. This bounded review does not certify 100% original parity, whole-product completeness or production readiness. Recheck the newly frozen candidate after approved fixes; do not reuse round-4 screenshots to certify later CSS.

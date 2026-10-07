# SATSUNICGO-LAYOUT-WIDTH-011 — Pending human approval

Request: widen the homepage to consume about half of the existing horizontal whitespace.

Repository intelligence: DEGRADED. CodeGraph index is stale; CocoIndex index is stale and its health query failed due to daemon-log filesystem permissions. Conclusions below are bounded source observations.

Verified source: src/styles/global.css defines .navShell, .hero, .marketSection, and .explain with a 1280px maximum. Hero and section containers have 32px horizontal padding. src/app/main.tsx imports public-ux.css after global.css, allowing a scoped override.

Implementation scope: src/styles/public-ux.css only. Add a desktop rule above 1280px viewport width for .navShell, .hero, .marketSection, and .explain: max-width: calc(50vw + 640px). At a 1920px viewport, the cap becomes 1600px instead of 1280px, consuming half of the spare 640px. Preserve current padding, typography, grid proportions, content, mobile/tablet rules, and Ask geometry.

Risk: low, visual CSS geometry only. Header is shared by public routes and will widen consistently. No data, auth, API, dependencies, runtime, or deployment changes. Preserve unrelated worktree edits.

Validation after approval: inspect computed container widths at 1440px and 1920px; confirm mobile 390px and tablet 768px remain unchanged and no horizontal overflow; inspect homepage screenshot; run scoped CSS formatting check. Complete product-content review for layout-only changes with no changed strings and final implementation review.

Rollback: remove only this scoped desktop override.

Approval required: explicit approval of this plan identifier and CSS-only scope before protected application edits, per .ai/workflows/plan-existing-system-change.md and .ai/guards/implementation-approval-gate.yaml.

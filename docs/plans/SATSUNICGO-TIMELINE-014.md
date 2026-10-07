# SATSUNICGO-TIMELINE-014 — Pending approval

Request: remove pause button from homepage timeline.

Evidence: App.tsx JourneyTimeline currently uses paused state/button and a 12-second infinite decorative animation; public-ux.css contains journeyPause styles. Repository intelligence retains DEGRADED source fallback.

Smallest accessible solution: remove pause/resume button, its state and related CSS. Change animation to one 4.8-second journey, ending visibly at step four (no fade/reset). Preserve reduced-motion static fallback and offscreen/document-hidden guards, measured marker positions, all process/deposit copy and other UI. No looping without a pause mechanism.

Approved paths pending approval: src/app/App.tsx and src/styles/public-ux.css only, plus task evidence. Low risk decorative UI; no server/data/auth changes. Validate final stop, mobile overflow, reduced-motion source path, TypeScript, scoped lint/formatting and final review. No deployment; preserve concurrent WIP.

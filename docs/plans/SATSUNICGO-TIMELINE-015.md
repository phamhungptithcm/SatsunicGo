# SATSUNICGO-TIMELINE-015 — Pending approval

User request: parcel illustration repeats continuously with no visible pause button.

Evidence: JourneyTimeline in src/app/App.tsx uses 4800ms, one iteration, forwards fill and a completion guard from approved plan014. Intelligence DEGRADED source fallback.

Delta proposal: restore gentle 12-second infinite loop through four stations; briefly fade parcel at step four and reset to first, preserving text. Remove one-pass completion guard. Keep no visible pause button, reduced-motion static mode, offscreen/document-hidden suspension and cleanup. Provide pause while pointer hovers the card or keyboard focus is within the card; make card keyboard focusable with an accessible instruction so continuous decorative motion has a way to stop without a visible button. Resume on pointer exit/focus leaving. No live announcements or order-status meaning.

Scope: src/app/App.tsx journey lifecycle/card attributes and src/styles/public-ux.css focus indicator only; task records. No other UI/data/auth/dependencies/deployment changes. Low-risk motion delta. Validate loop reset over a full cycle, pointer/focus pause and resume, mobile layout, source reduced motion/visibility cleanup, scoped lint/formatting, compiler and final review. Preserve unrelated WIP.

Human approval required for delta to previously approved one-pass behavior.

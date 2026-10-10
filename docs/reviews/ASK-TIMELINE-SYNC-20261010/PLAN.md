# Ask timeline sync — approved design continuation

Human direction 2026-10-10: remove pictured VI/EN controls; synchronize Account timeline in Ask with previously approved implementation, slightly compact for chat. This is explicit scoped amendment to approved Account/Ask design. No deploy. Preserve WIP, private owner authorization and public progress/ETA allowlist.

Intelligence DEGRADED: CodeGraph then CocoIndex queried, source verified. Owner Account and Ask already share OrderTracking; GuestOrderTracking has separate unconnected step styling. Approved implementation report prescribes shared icons, connectors, compact one-line time, current/next labels, responsive vertical/horizontal and reduced motion.

Plan: remove Ask language control row (automatic query language stays); add compact OrderTracking prop at Ask call sites only; share stateless TrackingIcon with guest; render guest using existing ot-panel/ot-hero/ot-eta/ot-steps structure and public4milestone meanings. No invented past dates or private6financial stages for guests. Add compact-only CSS; preserve Account sizing. Update affected component tests to choose English by English query; focus regression targets log instead of removed language control. Run component/privacy, renderer, types/lint/build; inspect actual shared5207 fixture desktop/mobile, record product/final review.

Files: Ask.tsx, OrderTracking.tsx, GuestOrderTracking.tsx, TrackingIcon.tsx, order-tracking.css, scoped tests/docs. Risk low UI with sensitive display boundary: no backend/API/schema/dependency change. Rollback only own delta.

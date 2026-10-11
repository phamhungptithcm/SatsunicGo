# Revision 2 — approved mockup refinement

User request: “làm đẹp hơn nữa animation transition trực quan hơn clean hơn”. Scope is the existing standalone prototype, not application implementation.

Change impact: only docs/previews/ORDER-TRACKING-20261009.html and related design evidence. Keep synthetic status/ETA/parcel contracts, all 15 states, source colors and shared server. Gate remains DEGRADED (stale indexes; failed local CocoIndex health). CodeGraph query did not resolve this HTML; CocoIndex located it; actual preview source read directly.

Plan: simplify repeated milestone text; prominent current step; move next step directly below timeline; make milestones selectable for explanations; improve spacing/type/ETA grouping. Use finite line/icon entrance, opacity/8px state transition, pointer hover and preview mode fade. Keep all content present immediately. All motion respects system reduced motion plus a preview-only toggle. Cancel previous animation on retrigger, hidden page, pagehide and reduced-motion change; no persistent loops, timers, asynchronous render or dependencies. Replay is explicit and does not change order state. No percentage, geographic location, live delivery or clock prediction added.

Verification: syntax, 15 fixtures, rapid changes/replay, step selection with pointer/keyboard, reduced-motion preview, 1440/390/320 rendering/overflow, existing retry and console. Full screen-reader/device/trace performance acceptance remains NOT_RUN; avoid fps or production claims.

Additional user requirement: display date/month/year and update time at each milestone. Render explicit recorded timestamps using vi-VN formatting and Asia/Ho_Chi_Minh (UTC+7), with semantic time elements and date-inclusive accessible names. Unknown/future timestamps must read “Chưa có cập nhật”. For grouped warehouse/packing milestones use the latest applicable event, not the earliest warehouse arrival. For actual integration, a passed stage without a matching retained event must read “Chưa có thời điểm ghi nhận”; never manufacture dates from stage order or observedAt. History completeness remains bounded by existing DTO limits. Sample timestamps are fixtures only.

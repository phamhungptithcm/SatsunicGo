# Profile076 approved impact plan
Human request: redesign Profile screenshot, review/fix/verify until done; prior explicit all-fix approval authorizes local implementation.
Scope: Profile.tsx, new scoped profile.css, local browser fixtures and review evidence. Preserve saveProfile/saveAddress payload/version/owner contracts, privacy support routes, fields and validation. No backend, deployment, production writes or unrelated WIP.
Design: compact header/order destination; balanced independent cards; profile fields and opt-in spaced clearly; address collection with distinct loading/empty/error above new address form; local notices/retry and save outcomes; mobile stack. No invented address edit/delete/default actions.
Hardening: clear private view immediately for UID mismatch; missing DB resolves to errors; save notices bound to current rendered UID and epoch. Existing snapshot lock/readiness and duplicate write guards retained.
Intelligence DEGRADED: stale CodeGraph, unavailable/stale CocoIndex; bounded source, reducer tests and browser evidence.
Review cycle1: M1 stale private render on UID switch; M2 missing DB perpetual loading; M3 async notices must bind UID. Fix and execute verification before fresh review.

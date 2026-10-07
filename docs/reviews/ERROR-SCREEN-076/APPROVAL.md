Plan ID/version: ERROR-SCREEN-076/v1
Repository intelligence gate status: DEGRADED — stale indexes; bounded source inspection per repository preferred-with-degraded-fallback policy. Validator's legacy READY-only check conflicts with current gate; no false READY claim.
Approval status: APPROVED
Approver: human user
Approval timestamp or task reference: 2026-10-06, current chat user message "apporved" following shared ErrorBoundary design plan
Approved paths:
- `src/app/ErrorBoundary.tsx`
- `src/app/ErrorBoundary.module.css`
- `docs/reviews/ERROR-SCREEN-076/**`
Scope: shared render-error fallback; sad parcel SVG, scoped responsive styles, gentle limited animation and reduced-motion support; preserve reload action and transaction caution. CSS module is the approved dedicated CSS implementation.
Constraints: preserve unrelated WIP, no backend build/reseed/restart, no provider effects, no expansion to non-render errors. Earlier copy-removal request not approved here.

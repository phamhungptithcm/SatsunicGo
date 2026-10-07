# Implementation approval
Plan ID/version: SATSUNICGO-PUBLIC-UX-007 v1 with owner unified-box and compact-copy refinements
Approval status: APPROVED
Approver: repository owner, current chat
Approval timestamp or task reference: 2026-10-04 America/Chicago; user reply `apporved` after reviewing the prototype and requested refinements.
Approved scope: docs/plans/SATSUNICGO-PUBLIC-UX-007.md, local implementation and emulator/browser verification only.
Approved paths: src/app/SiteChrome.tsx, Home section of src/app/App.tsx, src/features/requests/**, src/features/content/Content.tsx, src/features/membership/Membership.tsx, src/shared/public-content.ts, src/features/ask/Ask.tsx for visibility coordination only, src/styles/**, packages/domain/** for request normalization/public copy, functions public renderer if required, relevant tests/docs and generated assets through build only.
Constraints: preserve concurrent account/Ask/CMS work; no auth/rules/schema/provider/pricing change, dependencies, cloud mutations/deploy/push or real transactions. Images private, no invented commercial content. Approval does not certify production readiness.

Owner refinement in this chat: keep Home unchanged; product details include origin/function/use, curated order selected via async answer “SatsunicGo chọn và sắp xếp trước”. Approved additive content field/editor/API/public-render scope documented in plan supplement; no schema rename/migration or access change.

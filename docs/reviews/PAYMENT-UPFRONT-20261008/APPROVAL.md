# Implementation approval binding

Task: PAYMENT-UPFRONT-20261008
Plan: v1
Plan SHA256: `61da191daa407a0e950b508c423fa53cdd32261b741b6db92702caec7617107e`
Source checkout commit: `53d59bd88fa7da9d1243692336ecd09b6540ea31`
Current approval: **PENDING**. No human approval of this new payment impact plan has been recorded.

Required decision: approve v1 bounded application/schema/worker/UI/mock/demo-mail changes and its initial-payment/PDF assumptions, or state the requested changes. Earlier analytics approvals do not bind this plan. No self-approval, deployment approval, production money/data change, merchant activation or VAT certification is inferred. Recheck relevant concurrent source hashes and clean release baseline before protected edits.

Design clarification r2: the user requested designing from existing code. `DESIGN-R2.md` and the r2 preview refine the UI within v1, without changing its business rules or granting implementation/release approval. V1 plan hash remains unchanged. The current design sources/artifacts are separately bound in `SOURCE-MANIFEST-R2.json`.

Applicable explicit gate: `.ai/skills-src/change-impact-plan/SKILL.md`, Approval Gate: “Implementation must not begin until explicit developer approval is provided.” Design artifacts are reviewable work ahead of that implementation gate.

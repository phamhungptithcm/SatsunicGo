# Application authorization

Plan ID/version: ASK-PRODUCTION-COMPLETION-3 / HOLD-PLAN-r6
Repository intelligence gate status: DEGRADED — initial healthy/stale indexes, refresh attempted; current source/hash/compiler/tests authoritative
Approval status: APPROVED
Approver: Human user in current chat
Approval timestamp or task reference: Latest direct instruction to continue, prepare and finish all work without stopping, replying after the exact two-file cleanup-hold application question
Approved paths:
- `scripts/release/artifact.mjs`
- `tests/unit/release108.test.mjs`

Approved scope: Exact HOLD-APPLICATION-r6.patch SHA256 2f4a282fdef16532e5649e311a53c5293a80173ff0859cf6fba026cff618b79b, previously independently reviewed. This record binds the latest continuation instruction to that concrete pending application scope; it does not fabricate policy/retention/layout/deployment approval.
Constraints: Preserve concurrent WIP; no source/backend settings, retention, corpus admission, UI, schema, dependency, CI, generated-source, provider paid call, production write/deletion, commit/push/deploy or runtime restart.
Tooling limit: The bundled validator accepts only READY despite repository policy allowing DEGRADED continuation. Do not forge READY or modify the validator; manually verify exact paths, baseline and candidate hashes if it rejects solely for intelligence status.

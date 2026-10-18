# Scoped staff feature production release

Authorization: direct user request “làm xong release lên production”, superseding prior no-push/no-deploy hold for this feature. Prior no-real-email testing constraint remains: no invitations or test mail to real recipients.

Candidate scope: integrate the 15 reviewed source/test paths onto freshly fetched origin/main in managed worktree staff-invitation-release. Preserve current main behavior and unrelated original-checkout WIP. Existing files use saved baseline three-way merge; review every conflict. Add repeatable feature test config if required. Do not copy the dirty checkout as a release bundle.

Impact: additive private invitation/mail collections, six callables and scheduled invitation worker; initial grants require accepted invitation, existing staff retain edit path; staff list/name/avatar and explicit departure. Production dispatch remains gated; inspect production-ready sender and feature activation policy without reading secrets or sending mail. Release deployment authorizes bringing the feature online; any unavailable operational capability must be reported truthfully.

Validation: exact candidate compile/lint/unit and focused emulator/browser suite, release preflight/immutable artifact, current final review. Use existing shared5207 backend and no new frontend/emulator. Existing required CI is authoritative; do not skip or weaken gates.

Rollout: preserve latest successful release identity for rollback; wait for existing production release to settle; commit scoped candidate and fast-forward push only after current-origin recheck. Existing main release workflow runs quality→immutable build→deploy→provider readback→publish. Verify exact pushed SHA/run/artifact and live Hosting/Functions. Do not start duplicate/manual deployment while CI owns rollout.

Rollback: use previous verified immutable artifact under existing release runbook; disable staff invitation sending before any uncertain send retry. Never roll back existing unrelated main changes or delete production records. Keep accepted-invitation enforcement when UI remains enabled.

Intelligence: original indexes queried; new clean worktree not indexed, bounded source/diff/compiler/test fallback applies. Local prior PASS is not exact candidate or production proof. ai-agent-kit CLI absent; record manual evidence, not fictitious runtime-ledger execution.

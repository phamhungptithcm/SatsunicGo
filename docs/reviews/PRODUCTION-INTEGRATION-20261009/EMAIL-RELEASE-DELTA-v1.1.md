# Email release — compatibility delta v1.1

Plan ID/version: PRODUCTION-INTEGRATION-20261009/EMAIL-RELEASE-DELTA-v1.1
Base approval: EMAIL-RELEASE-DELTA-v1, explicitly approved in this chat.
Status: APPROVED by direct human reply “Duyệt bổ sung v1.1”, current chat, request_user_input_async/call_0065287369784c568b59e6a1c1101f6a question0. No source edits to these additional modules preceded this approval.

Two dependencies were verified during implementation of the approved delta:

1. `scripts/release/artifact.mjs` / `excludeEmulatorOnlyExports` rejects more than one emulator exclusion and any name other than `purchaseDemoPayment`. The newly validated five-entry preflight therefore still fails artifact packaging with `EMULATOR_EXPORT_METADATA`. Update this consumer and `tests/unit/release108.test.mjs` to accept only the exact five validated names/trigger shapes, verify exclusions correspond to source/preflight evidence, and remove only their guarded demo exports from the production package. Keep source hashes, immutable artifact checks, inventory/deletion protections, unsupported-shape rejection and CI workflow unchanged. Add tampered metadata/shape/missing/extra/duplicate exclusion tests and production package/discovery verification. No sandbox endpoint may ship.
2. `functions/src/outbox-command.ts` / existing staff retry branch still requires SMTP host/user/messageIdDomain. Replace only this obsolete readiness predicate with the same strict Resend configuration and exact production eligibility used by the worker. Preserve staff role authorization, App Check, expected version, attempts cap, explicit evidence for unknown reconciliation, audit, and no automatic replay. Add/update focused outbox regression tests for disabled/wrong provider/project, missing domain receipt, exhausted attempts and reconciliation. Existing user-facing messages and successful result contracts remain unchanged.

This is a compatibility correction to finish the already approved transport/release behavior. It adds no provider, schema, dependency, workflow, capability or financial operation. Scope is limited to the two source files above and their existing unit suites/review documents. No customer sending, secret payload read, production datafix or deployment is authorized by this document alone; all v1 conditions and the user's conditional automatic-release authorization remain.

Domain readback: authenticated Resend Domains currently shows **No domains yet**. Domain addition/DNS edits are not included here; sending stays disabled until verified.

Validation: Node22 focused unit/negative cases, artifact source comparison and production SDK inventory, typecheck/lint, fresh source manifest and final review. Rollback: previous source/artifact with sending disabled; preserve unknown/accepted/consent states. Token usage/cost Unavailable; no provider send call in this preparation.

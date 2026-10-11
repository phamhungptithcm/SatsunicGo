# SePay implementation approval

Plan ID/version: SEPAY-SANDBOX-20261009 v1
Plan SHA256: f4438cd74092b4f47f8b97c8e9bf95e793add72b0a4d8729dde4fa804dedf29d
Approval status: APPROVED
Approver: Human user
Approval timestamp/task reference: 2026-10-09T13:37:07.785198+00:00; chat01a120df-2ef2-79b2-a108-1bc1f32012a7 message “approved sync up vs chat khac de lam dong bo” after v1 review request
Repository intelligence: DEGRADED; CodeGraph→CocoIndex and current source verification; optional index limitation preserved.
Approved scope/paths: exact file/function map in PLAN-v1.md, including backend-only official SDK, sandbox contracts, trusted settlement reuse, initial/balance integration, private PDF and local regression/e2e tests.
Constraints/exclusions: no production/publicIPN/tunnel/deploy/push, no real money/email, no secret value exposure or agent secret access, preserve shared5207/emulator data and unrelated WIP. Runtime credentials only through an approved application-scoped mechanism. No additional dependency beyond reviewed SePay SDK.
Coordination: user explicitly authorizes messaging related existing chats for synchronization. Frontend method-selector v2 remains owned in original chat pending its own reviewed approval; this chat owns v1 backend/domain/payment adapter and avoids editing its checkout selector files until handoff.

## Subsequent authority and ownership

- Original chat implemented the user-approved three-method selector and later color refinement; only BANK_TRANSFER enabled. Its reports, source hashes and bounded UI evidence are retained separately. It handed source ownership back without further backend edits.
- Current human runtime reply: “Cho phép tạo lại backend demo và dữ liệu test mới”. The previous backend configuration/export could not be recovered, so this explicitly authorizes the newly created synthetic demo runtime at Auth19207, Firestore18207, Functions15207, Storage19208, project demo-satsunicgo. Existing frontend5207 is reused. Export path: /private/tmp/satsunicgo-shared5207/export. No old demo-data preservation claim is made.
- Application runtime uses synthetic fixture keys with SePay activation disabled. No agent secret-value access, real SePay connection, production activation, public IPN, tunnel, actual email, commit or push occurred in this phase.
- Independent read-only backend review in the original chat found BR-01; its approved in-scope fix and cooldown/lease regressions are recorded in the final evidence. Original chat also inspected current PDF without editing it.

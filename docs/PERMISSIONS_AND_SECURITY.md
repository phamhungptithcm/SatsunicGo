# Permissions and security

Current authenticated UID, locked state, active roles and applicable assignment are checked server-side. OWNER administration, finance verification/refunds, membership grants and staff changes require recent second-factor authentication outside the emulator. Buyer access requires assignment where implemented. Tests cover representative ownership, revoked/locked rights, duplicate/stale/concurrent commands; the exhaustive role × assignment × action matrix remains incomplete.

Client writes to authoritative money, roles, membership and shipping are denied. Default-deny Rules protect private paths. Customer reads expose separate projections. Public media requires published matching parent; uploads bound MIME/signature/size/dimensions and rights/alt confirmation. Full decoder/EXIF sanitization and private request-image workflow remain open.

App Check is enforced on deployed callable paths; webhook signature verification uses provider SDK. CSP/headers are configured but real OAuth compatibility and App Check rollout are NOT_RUN. Secrets belong in Secret Manager; ignored browser SDK config is distinct from privileged credentials. No credentials are recorded here.

Do not enable production until unresolved high dependency advisories, full access/isolation tests, policies/consent/retention, service IAM, provider checks and final review pass. Privacy export/deletion currently creates a support intake; it does not automatically export or delete customer data. Technical quota cleanup requires approved settings and never deletes financial/legal/customer records.

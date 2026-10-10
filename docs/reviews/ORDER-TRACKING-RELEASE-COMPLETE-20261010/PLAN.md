# Tracking release completion v2 — 2026-10-10

Authorization: current user asks to complete secret/least privilege, TTL, exact-commit CI/artifact and independent review, with security-sensitive actions handed to the user. No deployment authorization. This extends prior local-only release preparation to a non-main branch push, draft PR and non-deploying CI dispatch needed for requested GitHub CI/review. It does not authorize main merge, release/tag publication, production data, secret values access, IAM/TTL writes or deploy.

1. Re-run intelligence gate; continue bounded source/Git/compiler checks under DEGRADED where indexes unavailable.
2. Refresh isolated candidate onto verified latest production/main e9d248f331cba92970a6d06c503a3f66eb7d0972 (v0.11.1 Google popup fix); preserve tracking UI/logic and upstream auth/CSP changes. Inspect overlap before rebase.
3. Run exact-source Node22 full static/unit gates, tracking backend/component regression and existing release packaging/config checks. Fix only reproduced scoped tracking bugs. Unrelated failures are reported; dependency/CI architecture changes need delta plan approval.
4. Push only hunpeolabs/tracking-release-20261010 (never main), create draft PR and dispatch Local quality gates (workflow_dispatch on that branch). Existing Production release triggers only main push and must not be dispatched/merged. Bind CI to exact remote SHA.
5. Prepare secure operator commands/runbook: generate secret locally without printing; create-only, no implicit version rotation; secret-level accessor for verified runtime service account only. Three exact TTL fields; never TTL guestTrackingAccess. User executes security-sensitive production provisioning. Read back metadata only after completion.
6. Build local production configuration artifact with a clearly unreserved candidate version and exact SHA; verify manifest/checksum/held exports/assets, dependency audit and negative tamper regression. Keep separate from a pipeline-approved promoted production artifact. No tag reservation or release publication.
7. Independent human GitHub reviewer requested from user; prepare PR/evidence but never substitute self-review or optional AI advisory for authenticated independent approval. Hosted acceptance waits for explicit deploy approval and approved safe test identity/order.
8. Record every current gate, blockers, source/artifact hashes, cleanup and final review; no deploy.

Risk HIGH: privacy boundary and operational retention/IAM. Shared frontend/emulators untouched; no duplicate servers, restarts/reseeds or production customer reads/writes. New release evidence under this folder; source edits only isolated candidate.

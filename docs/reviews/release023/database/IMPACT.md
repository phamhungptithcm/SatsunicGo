# Database hardening023 impact and repro

Approval: TEAM_CONTEXT.md records direct human approval for confirmed local fixes in current business scope. Ownership: rules/indexes/order-media and two existing rules tests only. Shared WIP preserved.

Gate: DEGRADED on 2026-10-05; CodeGraph stale, CocoIndex stale/failed (daemon log permission). Bounded direct source fallback. No index refresh/install/runtime undertaken.

Confirmed source defect DB023-1 (medium correctness): staff role combinations do not compose the existing media grants consistently. An assigned BUYER+WAREHOUSE is listed warehouse images and may upload purchase images but readOrderImage denies purchase because warehouseOnly ignores BUYER. BUYER+SUPPORT list omits warehouse despite readOrderImage permitting warehouse under SUPPORT. Repro: seed request/purchase/warehouse/receipt ready media for one order; assign these two mixed roles; compare list IDs and read each listed/role-granted kind. No bank receipt grant may be added to these roles.

Smallest fix: derive the union of existing role grants once inside authorized(), use it both for read authorization and list query. Owner/manager/finance all kinds; assigned buyer request/purchase; warehouse request/warehouse; support request/purchase/warehouse. Upload grants, lock/current-revocation checks and transaction boundaries unchanged. No schema, index, dependency, public string, release or deployment change. Add regression for mixed roles, unassigned buyer, revoked assignment and locked staff with synthetic Firestore records. Root-controlled integration required; no standalone shared runtime use.

Review also targets reservation concurrency/retry, after-I/O revocation, cross-owner reads, private recursive rules, published-only filter semantics and direct Storage denial. Pending upload quota retention is existing documented behavior; no automatic deletion/datafix introduced.
